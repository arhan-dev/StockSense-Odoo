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
-- ============================================================

create or replace function public.lock_stock_row(
  p_product_id uuid,
  p_location_id uuid
)
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
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================
-- STATUS TRANSITIONS
-- ============================================================

create or replace function public.advance_status(
  p_table text,
  p_id uuid,
  p_target public.doc_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current public.doc_status;
  v_allowed boolean := false;
begin
  if p_table not in (
    'receipts',
    'deliveries',
    'transfers',
    'adjustments'
  ) then
    raise exception 'Invalid table %', p_table;
  end if;

  execute format(
    'select status from public.%I where id = $1 for update',
    p_table
  )
  into v_current
  using p_id;

  if v_current is null then
    raise exception 'Document not found';
  end if;

  if v_current in ('done','cancelled') then
    raise exception
      'Document is already % and cannot be changed',
      v_current;
  end if;

  if p_target = 'cancelled' then
    v_allowed := true;
  elsif v_current = 'draft'
    and p_target = 'waiting' then
    v_allowed := true;
  elsif v_current = 'waiting'
    and p_target = 'ready' then
    v_allowed := true;
  end if;

  if not v_allowed then
    raise exception
      'Cannot move from % to %',
      v_current,
      p_target;
  end if;

  execute format(
    'update public.%I set status = $1 where id = $2',
    p_table
  )
  using p_target, p_id;
end;
$$;

-- ============================================================
-- RECEIPT VALIDATION
-- ============================================================

create or replace function public.validate_receipt(
  p_receipt_id uuid
)
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
  select
    status,
    destination_location_id,
    reference
  into
    v_status,
    v_destination,
    v_reference
  from public.receipts
  where id = p_receipt_id
  for update;

  if v_status is null then
    raise exception 'Receipt not found';
  end if;

  if v_status <> 'ready' then
    raise exception
      'Receipt must be in ready status to validate (current: %)',
      v_status;
  end if;

  if not exists (
    select 1
    from public.receipt_lines
    where receipt_id = p_receipt_id
  ) then
    raise exception 'Receipt has no line items';
  end if;

  for v_line in
    select distinct
      rl.product_id,
      v_destination as location_id
    from public.receipt_lines rl
    where rl.receipt_id = p_receipt_id
    order by rl.product_id
  loop
    perform public.lock_stock_row(
      v_line.product_id,
      v_line.location_id
    );
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
  set
    status = 'done',
    validated_at = now()
  where id = p_receipt_id;
end;
$$;

-- ============================================================
-- DELIVERY VALIDATION
-- ============================================================

create or replace function public.validate_delivery(
  p_delivery_id uuid
)
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
  select
    status,
    source_location_id,
    reference
  into
    v_status,
    v_source,
    v_reference
  from public.deliveries
  where id = p_delivery_id
  for update;

  if v_status is null then
    raise exception 'Delivery not found';
  end if;

  if v_status <> 'ready' then
    raise exception
      'Delivery must be in ready status to validate (current: %)',
      v_status;
  end if;

  if not exists (
    select 1
    from public.delivery_lines
    where delivery_id = p_delivery_id
  ) then
    raise exception 'Delivery has no line items';
  end if;

  for v_lock in
    select distinct
      dl.product_id,
      v_source as location_id
    from public.delivery_lines dl
    where dl.delivery_id = p_delivery_id
    order by dl.product_id
  loop
    perform public.lock_stock_row(
      v_lock.product_id,
      v_lock.location_id
    );
  end loop;

  for v_line in
    select
      dl.product_id,
      dl.quantity,
      p.name as product_name
    from public.delivery_lines dl
    join public.products p
      on p.id = dl.product_id
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
  set
    status = 'done',
    validated_at = now()
  where id = p_delivery_id;
end;
$$;

-- ============================================================
-- TRANSFER VALIDATION
-- ============================================================

create or replace function public.validate_transfer(
  p_transfer_id uuid
)
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
    raise exception
      'Transfer must be in ready status to validate (current: %)',
      v_status;
  end if;

  if not exists (
    select 1
    from public.transfer_lines
    where transfer_id = p_transfer_id
  ) then
    raise exception 'Transfer has no line items';
  end if;

  for v_lock in
    select distinct
      x.product_id,
      x.location_id
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
    order by
      x.product_id,
      x.location_id
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
    join public.products p
      on p.id = tl.product_id
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
  set
    status = 'done',
    validated_at = now()
  where id = p_transfer_id;
end;
$$;

-- ============================================================
-- ADJUSTMENT VALIDATION
-- ============================================================

create or replace function public.validate_adjustment(
  p_adjustment_id uuid
)
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
  select
    status,
    location_id,
    reference
  into
    v_status,
    v_location,
    v_reference
  from public.adjustments
  where id = p_adjustment_id
  for update;

  if v_status is null then
    raise exception 'Adjustment not found';
  end if;

  if v_status <> 'ready' then
    raise exception
      'Adjustment must be in ready status to validate (current: %)',
      v_status;
  end if;

  if not exists (
    select 1
    from public.adjustment_lines
    where adjustment_id = p_adjustment_id
  ) then
    raise exception 'Adjustment has no line items';
  end if;

  for v_lock in
    select distinct
      al.product_id,
      v_location as location_id
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
  set
    status = 'done',
    validated_at = now()
  where id = p_adjustment_id;
end;
$$;

-- ============================================================
-- PRODUCT CREATION WITH OPTIONAL INITIAL STOCK
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
    raise exception
      'Reorder threshold and reorder quantity cannot be negative';
  end if;

  if p_initial_stock > 0
     and p_initial_location_id is null then
    raise exception
      'A location is required when initial stock is greater than zero';
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

alter table public.profiles enable row level security;
alter table public.warehouses enable row level security;
alter table public.locations enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.receipts enable row level security;
alter table public.receipt_lines enable row level security;
alter table public.deliveries enable row level security;
alter table public.delivery_lines enable row level security;
alter table public.transfers enable row level security;
alter table public.transfer_lines enable row level security;
alter table public.adjustments enable row level security;
alter table public.adjustment_lines enable row level security;
alter table public.stock_moves enable row level security;

-- ============================================================
-- PROFILES
-- ============================================================

create policy "profiles_select_all"
on public.profiles
for select
to authenticated
using (true);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- ============================================================
-- MASTER DATA
-- ============================================================

create policy "warehouses_all"
on public.warehouses
for all
to authenticated
using (true)
with check (true);

create policy "locations_all"
on public.locations
for all
to authenticated
using (true)
with check (true);

create policy "categories_all"
on public.categories
for all
to authenticated
using (true)
with check (true);

create policy "products_all"
on public.products
for all
to authenticated
using (true)
with check (true);

-- ============================================================
-- RECEIPTS
-- ============================================================

create policy "receipts_select"
on public.receipts
for select
to authenticated
using (true);

create policy "receipts_insert"
on public.receipts
for insert
to authenticated
with check (
  status = 'draft'
  and created_by = auth.uid()
);

create policy "receipts_update"
on public.receipts
for update
to authenticated
using (status = 'draft')
with check (status = 'draft');

-- No DELETE policy/grant for receipts.
-- Documents are never physically deleted after creation.

-- ============================================================
-- RECEIPT LINES
-- ============================================================

create policy "receipt_lines_select"
on public.receipt_lines
for select
to authenticated
using (true);

create policy "receipt_lines_insert"
on public.receipt_lines
for insert
to authenticated
with check (
  exists (
    select 1
    from public.receipts r
    where r.id = receipt_lines.receipt_id
      and r.status = 'draft'
  )
);

create policy "receipt_lines_update"
on public.receipt_lines
for update
to authenticated
using (
  exists (
    select 1
    from public.receipts r
    where r.id = receipt_lines.receipt_id
      and r.status = 'draft'
  )
)
with check (
  exists (
    select 1
    from public.receipts r
    where r.id = receipt_lines.receipt_id
      and r.status = 'draft'
  )
);

create policy "receipt_lines_delete"
on public.receipt_lines
for delete
to authenticated
using (
  exists (
    select 1
    from public.receipts r
    where r.id = receipt_lines.receipt_id
      and r.status = 'draft'
  )
);

-- ============================================================
-- DELIVERIES
-- ============================================================

create policy "deliveries_select"
on public.deliveries
for select
to authenticated
using (true);

create policy "deliveries_insert"
on public.deliveries
for insert
to authenticated
with check (
  status = 'draft'
  and created_by = auth.uid()
);

create policy "deliveries_update"
on public.deliveries
for update
to authenticated
using (status = 'draft')
with check (status = 'draft');

-- No DELETE policy/grant for deliveries.

-- ============================================================
-- DELIVERY LINES
-- ============================================================

create policy "delivery_lines_select"
on public.delivery_lines
for select
to authenticated
using (true);

create policy "delivery_lines_insert"
on public.delivery_lines
for insert
to authenticated
with check (
  exists (
    select 1
    from public.deliveries d
    where d.id = delivery_lines.delivery_id
      and d.status = 'draft'
  )
);

create policy "delivery_lines_update"
on public.delivery_lines
for update
to authenticated
using (
  exists (
    select 1
    from public.deliveries d
    where d.id = delivery_lines.delivery_id
      and d.status = 'draft'
  )
)
with check (
  exists (
    select 1
    from public.deliveries d
    where d.id = delivery_lines.delivery_id
      and d.status = 'draft'
  )
);

create policy "delivery_lines_delete"
on public.delivery_lines
for delete
to authenticated
using (
  exists (
    select 1
    from public.deliveries d
    where d.id = delivery_lines.delivery_id
      and d.status = 'draft'
  )
);

-- ============================================================
-- INTERNAL TRANSFERS
-- ============================================================

create policy "transfers_select"
on public.transfers
for select
to authenticated
using (true);

create policy "transfers_insert"
on public.transfers
for insert
to authenticated
with check (
  status = 'draft'
  and created_by = auth.uid()
);

create policy "transfers_update"
on public.transfers
for update
to authenticated
using (status = 'draft')
with check (status = 'draft');

-- No DELETE policy/grant for transfers.

-- ============================================================
-- TRANSFER LINES
-- ============================================================

create policy "transfer_lines_select"
on public.transfer_lines
for select
to authenticated
using (true);

create policy "transfer_lines_insert"
on public.transfer_lines
for insert
to authenticated
with check (
  exists (
    select 1
    from public.transfers t
    where t.id = transfer_lines.transfer_id
      and t.status = 'draft'
  )
);

create policy "transfer_lines_update"
on public.transfer_lines
for update
to authenticated
using (
  exists (
    select 1
    from public.transfers t
    where t.id = transfer_lines.transfer_id
      and t.status = 'draft'
  )
)
with check (
  exists (
    select 1
    from public.transfers t
    where t.id = transfer_lines.transfer_id
      and t.status = 'draft'
  )
);

create policy "transfer_lines_delete"
on public.transfer_lines
for delete
to authenticated
using (
  exists (
    select 1
    from public.transfers t
    where t.id = transfer_lines.transfer_id
      and t.status = 'draft'
  )
);

-- ============================================================
-- INVENTORY ADJUSTMENTS
-- ============================================================

create policy "adjustments_select"
on public.adjustments
for select
to authenticated
using (true);

create policy "adjustments_insert"
on public.adjustments
for insert
to authenticated
with check (
  status = 'draft'
  and created_by = auth.uid()
);

create policy "adjustments_update"
on public.adjustments
for update
to authenticated
using (status = 'draft')
with check (status = 'draft');

-- No DELETE policy/grant for adjustments.

-- ============================================================
-- ADJUSTMENT LINES
-- ============================================================

create policy "adjustment_lines_select"
on public.adjustment_lines
for select
to authenticated
using (true);

create policy "adjustment_lines_insert"
on public.adjustment_lines
for insert
to authenticated
with check (
  exists (
    select 1
    from public.adjustments a
    where a.id = adjustment_lines.adjustment_id
      and a.status = 'draft'
  )
);

create policy "adjustment_lines_update"
on public.adjustment_lines
for update
to authenticated
using (
  exists (
    select 1
    from public.adjustments a
    where a.id = adjustment_lines.adjustment_id
      and a.status = 'draft'
  )
)
with check (
  exists (
    select 1
    from public.adjustments a
    where a.id = adjustment_lines.adjustment_id
      and a.status = 'draft'
  )
);

create policy "adjustment_lines_delete"
on public.adjustment_lines
for delete
to authenticated
using (
  exists (
    select 1
    from public.adjustments a
    where a.id = adjustment_lines.adjustment_id
      and a.status = 'draft'
  )
);

-- ============================================================
-- STOCK MOVES
-- ============================================================

create policy "stock_moves_select"
on public.stock_moves
for select
to authenticated
using (true);

-- ============================================================
-- GRANTS
-- ============================================================

revoke all
on schema public
from authenticated;

grant usage
on schema public
to authenticated;

-- Profiles: users can read profiles and update their own
-- full_name. Role is deliberately not client-updatable.
grant select
on public.profiles
to authenticated;

grant update (full_name)
on public.profiles
to authenticated;

-- Master data.
grant select, insert, update, delete
on public.warehouses,
   public.locations,
   public.categories,
   public.products
to authenticated;

-- Parent inventory documents.
-- No DELETE permission is granted.
-- Status, ownership metadata, timestamps, and validation
-- timestamps are not client-updatable.
grant select, insert
on public.receipts,
   public.deliveries,
   public.transfers,
   public.adjustments
to authenticated;

grant update (
  reference,
  supplier_name,
  destination_location_id
)
on public.receipts
to authenticated;

grant update (
  reference,
  customer_name,
  source_location_id
)
on public.deliveries
to authenticated;

grant update (
  reference,
  source_location_id,
  destination_location_id
)
on public.transfers
to authenticated;

grant update (
  reference,
  location_id
)
on public.adjustments
to authenticated;

-- Document line reads/inserts.
grant select, insert
on public.receipt_lines,
   public.delivery_lines,
   public.transfer_lines,
   public.adjustment_lines
to authenticated;

-- Only the fields used by the backend line-update services
-- are client-updatable.
grant update (quantity)
on public.receipt_lines,
   public.delivery_lines,
   public.transfer_lines
to authenticated;

grant update (
  counted_quantity,
  reason
)
on public.adjustment_lines
to authenticated;

-- Controlled line deletion is permitted only by the
-- draft-only RLS policies above.
grant delete
on public.receipt_lines,
   public.delivery_lines,
   public.transfer_lines,
   public.adjustment_lines
to authenticated;

-- Stock views and immutable ledger are read-only to clients.
grant select
on public.stock_moves,
   public.stock_by_location,
   public.stock_by_product
to authenticated;

-- ============================================================
-- RPC EXECUTION PERMISSIONS
-- ============================================================

grant execute
on function public.lock_stock_row(uuid, uuid)
to authenticated;

grant execute
on function public.advance_status(
  text,
  uuid,
  public.doc_status
)
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

-- ============================================================
-- END OF SCHEMA
-- ============================================================
