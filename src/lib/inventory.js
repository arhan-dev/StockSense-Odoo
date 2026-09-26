import { supabase } from './supabaseClient'

function throwIfError(error) {
  if (error) throw error
}

function toNumber(value) {
  const number = Number(value ?? 0)

  return Number.isFinite(number) ? number : 0
}

/* ============================================================
   STOCK
   ============================================================ */

export async function listStockByProduct() {
  const { data, error } = await supabase
    .from('stock_by_product')
    .select(`
      product_id,
      quantity
    `)

  throwIfError(error)

  return (data ?? []).map((row) => ({
    productId: row.product_id,
    quantity: toNumber(row.quantity),
  }))
}

export async function listStockByLocation() {
  const { data, error } = await supabase
    .from('stock_by_location')
    .select(`
      product_id,
      location_id,
      quantity,
      locations (
        id,
        name,
        warehouse_id,
        warehouses (
          id,
          name
        )
      )
    `)

  throwIfError(error)

  return (data ?? []).map((row) => ({
    productId: row.product_id,
    locationId: row.location_id,
    quantity: toNumber(row.quantity),
    location: row.locations,
  }))
}

export async function getProductStock(productId) {
  if (!productId) {
    throw new Error('Product ID is required.')
  }

  const { data, error } = await supabase
    .from('stock_by_product')
    .select(`
      product_id,
      quantity
    `)
    .eq('product_id', productId)
    .maybeSingle()

  throwIfError(error)

  return {
    productId,
    quantity: toNumber(data?.quantity),
  }
}

export async function getProductStockByLocation(productId) {
  if (!productId) {
    throw new Error('Product ID is required.')
  }

  const { data, error } = await supabase
    .from('stock_by_location')
    .select(`
      product_id,
      location_id,
      quantity,
      locations (
        id,
        name,
        warehouse_id,
        warehouses (
          id,
          name
        )
      )
    `)
    .eq('product_id', productId)

  throwIfError(error)

  return (data ?? []).map((row) => ({
    productId: row.product_id,
    locationId: row.location_id,
    quantity: toNumber(row.quantity),
    location: row.locations,
  }))
}

/* ============================================================
   PRODUCTS WITH STOCK
   ============================================================ */

export async function listProductsWithStock() {
  const [
    { data: products, error: productsError },
    { data: stock, error: stockError },
  ] = await Promise.all([
    supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        category_id,
        unit_of_measure,
        reorder_threshold,
        reorder_quantity,
        created_at,
        categories (
          id,
          name
        )
      `)
      .order('name', { ascending: true }),

    supabase
      .from('stock_by_product')
      .select(`
        product_id,
        quantity
      `),
  ])

  throwIfError(productsError)
  throwIfError(stockError)

  const stockMap = new Map(
    (stock ?? []).map((row) => [
      row.product_id,
      toNumber(row.quantity),
    ])
  )

  return (products ?? []).map((product) => {
    const quantity = stockMap.get(product.id) ?? 0
    const reorderThreshold = toNumber(
      product.reorder_threshold
    )

    return {
      ...product,
      stock: quantity,
      isLowStock:
        quantity > 0 && quantity <= reorderThreshold,
      isOutOfStock: quantity <= 0,
    }
  })
}

/* ============================================================
   LOW / OUT OF STOCK
   ============================================================ */

export async function listLowStockProducts() {
  const products = await listProductsWithStock()

  return products.filter(
    (product) => product.isLowStock
  )
}

export async function listOutOfStockProducts() {
  const products = await listProductsWithStock()

  return products.filter(
    (product) => product.isOutOfStock
  )
}

/* ============================================================
   DASHBOARD COUNTS
   ============================================================ */

export async function getDashboardSummary() {
  const [
    productsResult,
    stockResult,
    receiptsResult,
    deliveriesResult,
    transfersResult,
  ] = await Promise.all([
    supabase
      .from('products')
      .select(`
        id,
        reorder_threshold
      `),

    supabase
      .from('stock_by_product')
      .select(`
        product_id,
        quantity
      `),

    supabase
      .from('receipts')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .in('status', ['draft', 'waiting', 'ready']),

    supabase
      .from('deliveries')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .in('status', ['draft', 'waiting', 'ready']),

    supabase
      .from('transfers')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .in('status', ['draft', 'waiting', 'ready']),
  ])

  throwIfError(productsResult.error)
  throwIfError(stockResult.error)
  throwIfError(receiptsResult.error)
  throwIfError(deliveriesResult.error)
  throwIfError(transfersResult.error)

  const stockMap = new Map(
    (stockResult.data ?? []).map((row) => [
      row.product_id,
      toNumber(row.quantity),
    ])
  )

  let totalProducts = 0
  let lowStockItems = 0
  let outOfStockItems = 0
  let totalStockQuantity = 0

  for (const product of productsResult.data ?? []) {
    totalProducts += 1

    const quantity =
      stockMap.get(product.id) ?? 0

    totalStockQuantity += quantity

    const reorderThreshold = toNumber(
      product.reorder_threshold
    )

    if (quantity <= 0) {
      outOfStockItems += 1
    } else if (quantity <= reorderThreshold) {
      lowStockItems += 1
    }
  }

  return {
    totalProducts,
    lowStockItems,
    outOfStockItems,
    pendingReceipts: receiptsResult.count ?? 0,
    pendingDeliveries: deliveriesResult.count ?? 0,
    pendingTransfers: transfersResult.count ?? 0,
    totalStockQuantity,
  }
}

/* ============================================================
   STOCK LEDGER
   ============================================================ */

export async function listStockMoves({
  productId = null,
  locationId = null,
  moveType = null,
  limit = 100,
} = {}) {
  const safeLimit = Math.min(
    Math.max(Number(limit) || 100, 1),
    500
  )

  let query = supabase
    .from('stock_moves')
    .select(`
      id,
      product_id,
      location_id,
      quantity_delta,
      move_type,
      source_document_id,
      source_document_ref,
      note,
      created_at,
      products (
        id,
        name,
        sku,
        unit_of_measure
      ),
      locations (
        id,
        name,
        warehouse_id,
        warehouses (
          id,
          name
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(safeLimit)

  if (productId) {
    query = query.eq('product_id', productId)
  }

  if (locationId) {
    query = query.eq('location_id', locationId)
  }

  if (moveType) {
    query = query.eq('move_type', moveType)
  }

  const { data, error } = await query

  throwIfError(error)

  return data ?? []
}

export async function getRecentStockMoves(limit = 10) {
  return listStockMoves({
    limit,
  })
}

/* ============================================================
   LOCATION STOCK SUMMARY
   ============================================================ */

export async function getLocationStockSummary(locationId) {
  if (!locationId) {
    throw new Error('Location ID is required.')
  }

  const { data, error } = await supabase
    .from('stock_by_location')
    .select(`
      product_id,
      location_id,
      quantity,
      products:product_id (
        id,
        name,
        sku,
        unit_of_measure,
        reorder_threshold
      )
    `)
    .eq('location_id', locationId)

  throwIfError(error)

  return (data ?? []).map((row) => ({
    productId: row.product_id,
    locationId: row.location_id,
    quantity: toNumber(row.quantity),
    product: row.products,
  }))
}

/* ============================================================
   WAREHOUSE STOCK SUMMARY
   ============================================================ */

export async function getWarehouseStockSummary(warehouseId) {
  if (!warehouseId) {
    throw new Error('Warehouse ID is required.')
  }

  const { data, error } = await supabase
    .from('stock_by_location')
    .select(`
      product_id,
      location_id,
      quantity,
      locations!inner (
        id,
        name,
        warehouse_id,
        warehouses (
          id,
          name
        )
      ),
      products:product_id (
        id,
        name,
        sku,
        unit_of_measure,
        reorder_threshold
      )
    `)
    .eq('locations.warehouse_id', warehouseId)

  throwIfError(error)

  return (data ?? []).map((row) => ({
    productId: row.product_id,
    locationId: row.location_id,
    quantity: toNumber(row.quantity),
    location: row.locations,
    product: row.products,
  }))
}

/* ============================================================
   STOCK MOVEMENT TOTALS
   ============================================================ */

export async function getStockMovementTotals({
  productId = null,
  locationId = null,
} = {}) {
  let query = supabase
    .from('stock_moves')
    .select(`
      move_type,
      quantity_delta
    `)

  if (productId) {
    query = query.eq('product_id', productId)
  }

  if (locationId) {
    query = query.eq('location_id', locationId)
  }

  const { data, error } = await query

  throwIfError(error)

  const totals = {
    receipt: 0,
    delivery: 0,
    transfer: 0,
    adjustment: 0,
    opening: 0,
  }

  for (const row of data ?? []) {
    const type = row.move_type

    if (type in totals) {
      totals[type] += toNumber(row.quantity_delta)
    }
  }

  return totals
    }
