-- ============================================================
-- StockSense-Odoo — full schema (Batch 1, final)
-- Run this entire file once in Supabase SQL Editor.
-- Safe to re-run only on a fresh database (uses `create table`,
-- not `create table if not exists` — see SETUP.md).
-- ============================================================

-- ---------- ENUMS ----------
create type doc_status as enum ('draft','waiting','ready','done','cancelled');
create type move_type as enum ('receipt','delivery','transfer','adjustment','opening');

-- ---------- CORE TABLES ----------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'inventory_manager' check (role in ('inventory_manager','warehouse_staff')),
  created_at timestamptz not null default now()
);

create table warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  warehouse_id uuid references warehouses(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (name, warehouse_id)
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  category_id uuid references categories(id) on delete set null,
  unit_of_measure text not null default 'unit',
  reorder_threshold numeric not null default 0 check (reorder_threshold >= 0),
  reorder_quantity numeric not null default 0 check (reorder_quantity >= 0),
  created_at timestamptz not null default now()
);

-- ---------- RECEIPTS ----------

create table receipts (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  supplier_name text,
  destination_location_id uuid not null references locations(id),
  status doc_status not null default 'draft',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  validated_at timestamptz
);

create table receipt_lines (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references receipts(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric not null check (quantity > 0),
  unique (receipt_id, product_id)
);

-- ---------- DELIVERIES ----------

create table deliveries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_name text,
  source_location_id uuid not null references locations(id),
  status doc_status not null default 'draft',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  validated_at timestamptz
);

create table delivery_lines (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric not null check (quantity > 0),
  unique (delivery_id, product_id)
);

-- ---------- INTERNAL TRANSFERS ----------

create table transfers (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  source_location_id uuid not null references locations(id),
  destination_location_id uuid not null references locations(id),
  status doc_status not null default 'draft',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  check (source_location_id <> destination_location_id)
);

create table transfer_lines (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references transfers(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric not null check (quantity > 0),
  unique (transfer_id, product_id)
);

-- ---------- ADJUSTMENTS ----------

create table adjustments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  location_id uuid not null references locations(id),
  status doc_status not null default 'draft',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  validated_at timestamptz
);

create table adjustment_lines (
  id uuid primary key default gen_random_uuid(),
  adjustment_id uuid not null references adjustments(id) on delete cascade,
  product_id uuid not null references products(id),
  counted_quantity numeric not null check (counted_quantity >= 0),
  reason text,
  unique (adjustment_id, product_id)
);

-- ---------- STOCK LEDGER (append-only source of truth) ----------

create table stock_moves (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  location_id uuid not null references locations(id),
  quantity_delta numeric not null,
  move_type move_type not null,
  source_document_id uuid,
  source_document_ref text,
  note text,
  created_at timestamptz not null default now()
);

create view stock_by_location as
select product_id, location_id, sum(quantity_delta) as quantity
from stock_moves
group by product_id, location_id;

create view stock_by_product as
select product_id, sum(quantity_delta) as quantity
from stock_moves
group by product_id;

-- ============================================================
-- SHARED ADVISORY LOCK HELPER
-- Single canonical definition of "how we lock a (product, location)
-- pair before reading/writing stock_moves for it". Every validation
-- function below calls THIS function rather than building its own
-- lock key — that is what guarantees delivery vs transfer vs
-- adjustment all serialize against each other for the same pair,
-- instead of relying on three separate expressions staying identical
-- by convention.
-- ============================================================

create or replace function public.lock_stock_row(p_product_id uuid, p_location_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(p_product_id::text),
    pg_catalog.hashtext(p_location_id::text)
  );
end;
$$;

-- ============================================================
-- PROFILE AUTO-CREATION
-- Hardened: search_path = '' + fully schema-qualified references.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- STATUS TRANSITIONS (non-validating stages only)
-- Hardened: search_path = '' + schema-qualified dynamic SQL.
-- ============================================================

create or replace function public.advance_status(p_table text, p_id uuid, p_target public.doc_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current public.doc_status;
  v_allowed boolean := false;
begin
  if p_table not in ('receipts','deliveries','transfers','adjustments') then
    raise exception 'Invalid table %', p_table;
  end if;

  execute format('select status from public.%I where id = $1 for update', p_table)
    into v_current using p_id;

  if v_current is null then
    raise exception 'Document not found';
  end if;

  if v_current in ('done','cancelled') then
    raise exception 'Document is already % and cannot be changed', v_current;
  end if;

  if p_target = 'cancelled' then
    v_allowed := true;
  elsif v_current = 'draft' and p_target = 'waiting' then
    v_allowed := true;
  elsif v_current = 'waiting' and p_target = 'ready' then
    v_allowed := true;
  end if;

  if not v_allowed then
    raise exception 'Cannot move from % to %', v_current, p_target;
  end if;

  execute format('update public.%I set status = $1 where id = $2', p_table)
    using p_target, p_id;
end;
$$;

-- ============================================================
-- VALIDATION FUNCTIONS (the only writers of stock_moves)
-- Hardened: search_path = '', schema-qualified, advisory-locked
-- via the shared lock_stock_row() helper above.
-- ============================================================

create or replace function public.validate_receipt(p_receipt_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.doc_status;
  v_destination uuid;
  v_reference text;
  v_line record;
begin
  select status, destination_location_id, reference
    into v_status, v_destination, v_reference
    from public.receipts where id = p_receipt_id for update;

  if v_status is null then
    raise exception 'Receipt not found';
  end if;
  if v_status <> 'ready' then
    raise exception 'Receipt must be in ready status to validate (current: %)', v_status;
  end if;
  if not exists (select 1 from public.receipt_lines where receipt_id = p_receipt_id) then
    raise exception 'Receipt has no line items';
  end if;

  for v_line in
    select distinct rl.product_id, v_destination as location_id
    from public.receipt_lines rl
    where rl.receipt_id = p_receipt_id
    order by rl.product_id
  loop
    perform public.lock_stock_row(v_line.product_id, v_line.location_id);
  end loop;

  insert into public.stock_moves (
    product_id,
    location_id,
    quantity_delta,
    move_type,
    source_document_id,
    source_document_ref
  )
  select
    rl.product_id,
    v_destination,
    rl.quantity,
    'receipt',
    p_receipt_id,
    v_reference
  from public.receipt_lines rl
  where rl.receipt_id = p_receipt_id;

  update public.receipts
  set status = 'done',
      validated_at = now()
  where id = p_receipt_id;
end;
$$;

create or replace function public.validate_delivery(p_delivery_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.doc_status;
  v_source uuid;
  v_reference text;
  v_lock record;
  v_line record;
  v_available numeric;
begin
  select status, source_location_id, reference
    into v_status, v_source, v_reference
    from public.deliveries
    where id = p_delivery_id
    for update;

  if v_status is null then
    raise exception 'Delivery not found';
  end if;

  if v_status <> 'ready' then
    raise exception 'Delivery must be in ready status to validate (current: %)', v_status;
  end if;

  if not exists (
    select 1
    from public.delivery_lines
    where delivery_id = p_delivery_id
  ) then
    raise exception 'Delivery has no line items';
  end if;

  for v_lock in
    select distinct dl.product_id, v_source as location_id
    from public.delivery_lines dl
    where dl.delivery_id = p_delivery_id
    order by dl.product_id
  loop
    perform public.lock_stock_row(v_lock.product_id, v_lock.location_id);
  end loop;

  for v_line in
    select
      dl.product_id,
      dl.quantity,
      p.name as product_name
    from public.delivery_lines dl
    join public.products p on p.id = dl.product_id
    where dl.delivery_id = p_delivery_id
  loop
    select coalesce(sum(quantity_delta), 0)
      into v_available
    from public.stock_moves
    where product_id = v_line.product_id
      and location_id = v_source;

    if v_available < v_line.quantity then
      raise exception
        'Insufficient stock for % at source location (available %, requested %)',
        v_line.product_name,
        v_available,
        v_line.quantity;
    end if;
  end loop;

  insert into public.stock_moves (
    product_id,
    location_id,
    quantity_delta,
    move_type,
    source_document_id,
    source_document_ref
  )
  select
    dl.product_id,
    v_source,
    -dl.quantity,
    'delivery',
    p_delivery_id,
    v_reference
  from public.delivery_lines dl
  where dl.delivery_id = p_delivery_id;

  update public.deliveries
  set status = 'done',
      validated_at = now()
  where id = p_delivery_id;
end;
$$;

create or replace function public.validate_transfer(p_transfer_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.doc_status;
  v_source uuid;
  v_destination uuid;
  v_reference text;
  v_lock record;
  v_line record;
  v_available numeric;
begin
  select
    status,
    source_location_id,
    destination_location_id,
    reference
  into
    v_status,
    v_source,
    v_destination,
    v_reference
  from public.transfers
  where id = p_transfer_id
  for update;

  if v_status is null then
    raise exception 'Transfer not found';
  end if;

  if v_status <> 'ready' then
    raise exception 'Transfer must be in ready status to validate (current: %)', v_status;
  end if;

  if not exists (
    select 1
    from public.transfer_lines
    where transfer_id = p_transfer_id
  ) then
    raise exception 'Transfer has no line items';
  end if;

  for v_lock in
    select distinct x.product_id, x.location_id
    from (
      select
        tl.product_id,
        v_source as location_id
      from public.transfer_lines tl
      where tl.transfer_id = p_transfer_id

      union

      select
        tl.product_id,
        v_destination as location_id
      from public.transfer_lines tl
      where tl.transfer_id = p_transfer_id
    ) x
    order by x.product_id, x.location_id
  loop
    perform public.lock_stock_row(
      v_lock.product_id,
      v_lock.location_id
    );
  end loop;

  for v_line in
    select
      tl.product_id,
      tl.quantity,
      p.name as product_name
    from public.transfer_lines tl
    join public.products p on p.id = tl.product_id
    where tl.transfer_id = p_transfer_id
  loop
    select coalesce(sum(quantity_delta), 0)
      into v_available
    from public.stock_moves
    where product_id = v_line.product_id
      and location_id = v_source;

    if v_available < v_line.quantity then
      raise exception
        'Insufficient stock for % at source location (available %, requested %)',
        v_line.product_name,
        v_available,
        v_line.quantity;
    end if;
  end loop;

  insert into public.stock_moves (
    product_id,
    location_id,
    quantity_delta,
    move_type,
    source_document_id,
    source_document_ref
  )
  select
    tl.product_id,
    v_source,
    -tl.quantity,
    'transfer',
    p_transfer_id,
    v_reference
  from public.transfer_lines tl
  where tl.transfer_id = p_transfer_id;

  insert into public.stock_moves (
    product_id,
    location_id,
    quantity_delta,
    move_type,
    source_document_id,
    source_document_ref
  )
  select
    tl.product_id,
    v_destination,
    tl.quantity,
    'transfer',
    p_transfer_id,
    v_reference
  from public.transfer_lines tl
  where tl.transfer_id = p_transfer_id;

  update public.transfers
  set status = 'done',
      validated_at = now()
  where id = p_transfer_id;
end;
$$;

create or replace function public.validate_adjustment(p_adjustment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.doc_status;
  v_location uuid;
  v_reference text;
  v_lock record;
  v_line record;
  v_current numeric;
  v_delta numeric;
begin
  select status, location_id, reference
    into v_status, v_location, v_reference
    from public.adjustments
    where id = p_adjustment_id
    for update;

  if v_status is null then
    raise exception 'Adjustment not found';
  end if;

  if v_status <> 'ready' then
    raise exception 'Adjustment must be in ready status to validate (current: %)', v_status;
  end if;

  if not exists (
    select 1
    from public.adjustment_lines
    where adjustment_id = p_adjustment_id
  ) then
    raise exception 'Adjustment has no line items';
  end if;

  for v_lock in
    select distinct al.product_id, v_location as location_id
    from public.adjustment_lines al
    where al.adjustment_id = p_adjustment_id
    order by al.product_id
  loop
    perform public.lock_stock_row(
      v_lock.product_id,
      v_lock.location_id
    );
  end loop;

  for v_line in
    select
      al.product_id,
      al.counted_quantity,
      al.reason
    from public.adjustment_lines al
    where al.adjustment_id = p_adjustment_id
  loop
    select coalesce(sum(quantity_delta), 0)
      into v_current
    from public.stock_moves
    where product_id = v_line.product_id
      and location_id = v_location;

    v_delta := v_line.counted_quantity - v_current;

    if v_delta <> 0 then
      insert into public.stock_moves (
        product_id,
        location_id,
        quantity_delta,
        move_type,
        source_document_id,
        source_document_ref,
        note
      )
      values (
        v_line.product_id,
        v_location,
        v_delta,
        'adjustment',
        p_adjustment_id,
        v_reference,
        v_line.reason
      );
    end if;
  end loop;

  update public.adjustments
  set status = 'done',
      validated_at = now()
  where id = p_adjustment_id;
end;
$$;

-- ============================================================
-- PRODUCT CREATION WITH OPTIONAL INITIAL STOCK
-- Hardened: search_path = '', schema-qualified, non-negative check.
-- ============================================================

create or replace function public.create_product_with_initial_stock(
  p_name text,
  p_sku text,
  p_category_id uuid,
  p_unit_of_measure text,
  p_reorder_threshold numeric,
  p_reorder_quantity numeric,
  p_initial_stock numeric,
  p_initial_location_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_id uuid;
begin
  if p_initial_stock < 0 then
    raise exception 'Initial stock cannot be negative';
  end if;

  if p_reorder_threshold < 0
     or p_reorder_quantity < 0 then
    raise exception 'Reorder threshold and reorder quantity cannot be negative';
  end if;

  if p_initial_stock > 0
     and p_initial_location_id is null then
    raise exception 'A location is required when initial stock is greater than zero';
  end if;

  insert into public.products (
    name,
    sku,
    category_id,
    unit_of_measure,
    reorder_threshold,
    reorder_quantity
  )
  values (
    p_name,
    p_sku,
    p_category_id,
    p_unit_of_measure,
    p_reorder_threshold,
    p_reorder_quantity
  )
  returning id into v_product_id;

  if p_initial_stock > 0 then
    insert into public.stock_moves (
      product_id,
      location_id,
      quantity_delta,
      move_type,
      source_document_ref,
      note
    )
    values (
      v_product_id,
      p_initial_location_id,
      p_initial_stock,
      'opening',
      'Initial stock',
      'Opening balance set at product creation'
    );
  end if;

  return v_product_id;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table warehouses enable row level security;
alter table locations enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table receipts enable row level security;
alter table receipt_lines enable row level security;
alter table deliveries enable row level security;
alter table delivery_lines enable row level security;
alter table transfers enable row level security;
alter table transfer_lines enable row level security;
alter table adjustments enable row level security;
alter table adjustment_lines enable row level security;
alter table stock_moves enable row level security;

create policy "profiles_select_all"
on profiles
for select
to authenticated
using (true);

create policy "profiles_update_own"
on profiles
for update
to authenticated
using (id = auth.uid());

create policy "warehouses_all"
on warehouses
for all
to authenticated
using (true)
with check (true);

create policy "locations_all"
on locations
for all
to authenticated
using (true)
with check (true);

create policy "categories_all"
on categories
for all
to authenticated
using (true)
with check (true);

create policy "products_all"
on products
for all
to authenticated
using (true)
with check (true);

create policy "receipts_select"
on receipts
for select
to authenticated
using (true);

create policy "receipts_insert"
on receipts
for insert
to authenticated
with check (true);

create policy "receipts_update"
on receipts
for update
to authenticated
using (true)
with check (true);

create policy "receipt_lines_select"
on receipt_lines
for select
to authenticated
using (true);

create policy "receipt_lines_insert"
on receipt_lines
for insert
to authenticated
with check (true);

create policy "receipt_lines_update"
on receipt_lines
for update
to authenticated
using (true)
with check (true);

create policy "deliveries_select"
on deliveries
for select
to authenticated
using (true);

create policy "deliveries_insert"
on deliveries
for insert
to authenticated
with check (true);

create policy "deliveries_update"
on deliveries
for update
to authenticated
using (true)
with check (true);

create policy "delivery_lines_select"
on delivery_lines
for select
to authenticated
using (true);

create policy "delivery_lines_insert"
on delivery_lines
for insert
to authenticated
with check (true);

create policy "delivery_lines_update"
on delivery_lines
for update
to authenticated
using (true)
with check (true);

create policy "transfers_select"
on transfers
for select
to authenticated
using (true);

create policy "transfers_insert"
on transfers
for insert
to authenticated
with check (true);

create policy "transfers_update"
on transfers
for update
to authenticated
using (true)
with check (true);

create policy "transfer_lines_select"
on transfer_lines
for select
to authenticated
using (true);

create policy "transfer_lines_insert"
on transfer_lines
for insert
to authenticated
with check (true);

create policy "transfer_lines_update"
on transfer_lines
for update
to authenticated
using (true)
with check (true);

create policy "adjustments_select"
on adjustments
for select
to authenticated
using (true);

create policy "adjustments_insert"
on adjustments
for insert
to authenticated
with check (true);

create policy "adjustments_update"
on adjustments
for update
to authenticated
using (true)
with check (true);

create policy "adjustment_lines_select"
on adjustment_lines
for select
to authenticated
using (true);

create policy "adjustment_lines_insert"
on adjustment_lines
for insert
to authenticated
with check (true);

create policy "adjustment_lines_update"
on adjustment_lines
for update
to authenticated
using (true)
with check (true);

-- stock_moves: read-only for clients; every write goes through a
-- SECURITY DEFINER function above, which runs as the function owner
-- and therefore bypasses RLS. There is no INSERT/UPDATE/DELETE policy
-- for this table at all — that absence is the enforcement.

create policy "stock_moves_select"
on stock_moves
for select
to authenticated
using (true);

-- ============================================================
-- GRANTS
-- ============================================================

grant usage on schema public to authenticated;

-- profiles: full_name only. role and id are NOT grantable for update,
-- so no RLS policy, no client request, and no future admin UI bug
-- can let a user grant themselves a privileged role from the client.

grant select on profiles to authenticated;
grant update (full_name) on profiles to authenticated;

grant select, insert, update, delete
on warehouses, locations, categories, products
to authenticated;

grant select, insert, update
on receipts,
   receipt_lines,
   deliveries,
   delivery_lines,
   transfers,
   transfer_lines,
   adjustments,
   adjustment_lines
to authenticated;

grant select
on stock_moves, stock_by_location, stock_by_product
to authenticated;

grant execute
on function public.lock_stock_row(uuid, uuid)
to authenticated;

grant execute
on function public.advance_status(text, uuid, public.doc_status)
to authenticated;

grant execute
on function public.validate_receipt(uuid)
to authenticated;

grant execute
on function public.validate_delivery(uuid)
to authenticated;

grant execute
on function public.validate_transfer(uuid)
to authenticated;

grant execute
on function public.validate_adjustment(uuid)
to authenticated;

grant execute
on function public.create_product_with_initial_stock(
  text,
  text,
  uuid,
  text,
  numeric,
  numeric,
  numeric,
  uuid
)
to authenticated;
