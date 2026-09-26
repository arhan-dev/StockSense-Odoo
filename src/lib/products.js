import { supabase } from './supabaseClient'

function throwIfError(error) {
  if (error) throw error
}

export async function listProducts() {
  const { data, error } = await supabase
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
    .order('name', { ascending: true })

  throwIfError(error)
  return data ?? []
}

export async function getProduct(productId) {
  if (!productId) throw new Error('Product ID is required.')

  const { data, error } = await supabase
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
    .eq('id', productId)
    .single()

  throwIfError(error)
  return data
}

export async function getProductBySku(sku) {
  const cleanSku = String(sku ?? '').trim()

  if (!cleanSku) throw new Error('SKU is required.')

  const { data, error } = await supabase
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
    .eq('sku', cleanSku)
    .maybeSingle()

  throwIfError(error)
  return data
}

export async function createProduct({
  name,
  sku,
  categoryId = null,
  unitOfMeasure = 'unit',
  reorderThreshold = 0,
  reorderQuantity = 0,
  initialStock = 0,
  initialLocationId = null,
}) {
  const cleanName = String(name ?? '').trim()
  const cleanSku = String(sku ?? '').trim()

  if (!cleanName) throw new Error('Product name is required.')
  if (!cleanSku) throw new Error('SKU is required.')

  const threshold = Number(reorderThreshold)
  const reorderQty = Number(reorderQuantity)
  const stock = Number(initialStock)

  if (threshold < 0) {
    throw new Error('Reorder threshold cannot be negative.')
  }

  if (reorderQty < 0) {
    throw new Error('Reorder quantity cannot be negative.')
  }

  if (stock < 0) {
    throw new Error('Initial stock cannot be negative.')
  }

  if (stock > 0 && !initialLocationId) {
    throw new Error(
      'A location is required when initial stock is greater than zero.'
    )
  }

  const { data, error } = await supabase.rpc(
    'create_product_with_initial_stock',
    {
      p_name: cleanName,
      p_sku: cleanSku,
      p_category_id: categoryId,
      p_unit_of_measure: unitOfMeasure || 'unit',
      p_reorder_threshold: threshold,
      p_reorder_quantity: reorderQty,
      p_initial_stock: stock,
      p_initial_location_id: initialLocationId,
    }
  )

  throwIfError(error)
  return data
}

export async function updateProduct(productId, updates) {
  if (!productId) throw new Error('Product ID is required.')

  const payload = {}

  if (updates.name !== undefined) {
    const name = String(updates.name).trim()
    if (!name) throw new Error('Product name cannot be empty.')
    payload.name = name
  }

  if (updates.sku !== undefined) {
    const sku = String(updates.sku).trim()
    if (!sku) throw new Error('SKU cannot be empty.')
    payload.sku = sku
  }

  if (updates.categoryId !== undefined) {
    payload.category_id = updates.categoryId
  }

  if (updates.unitOfMeasure !== undefined) {
    payload.unit_of_measure = updates.unitOfMeasure || 'unit'
  }

  if (updates.reorderThreshold !== undefined) {
    const value = Number(updates.reorderThreshold)

    if (value < 0) {
      throw new Error('Reorder threshold cannot be negative.')
    }

    payload.reorder_threshold = value
  }

  if (updates.reorderQuantity !== undefined) {
    const value = Number(updates.reorderQuantity)

    if (value < 0) {
      throw new Error('Reorder quantity cannot be negative.')
    }

    payload.reorder_quantity = value
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('No product fields were provided for update.')
  }

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId)
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
    .single()

  throwIfError(error)
  return data
}

export async function deleteProduct(productId) {
  if (!productId) throw new Error('Product ID is required.')

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  throwIfError(error)
}

export async function getProductStock(productId) {
  if (!productId) throw new Error('Product ID is required.')

  const { data, error } = await supabase
    .from('stock_by_product')
    .select('product_id, quantity')
    .eq('product_id', productId)
    .maybeSingle()

  throwIfError(error)

  return data ?? {
    product_id: productId,
    quantity: 0,
  }
}

export async function getProductStockByLocation(productId) {
  if (!productId) throw new Error('Product ID is required.')

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
  return data ?? []
}

export async function listProductsWithStock() {
  const { data: products, error: productsError } = await supabase
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
    .order('name', { ascending: true })

  throwIfError(productsError)

  const { data: stock, error: stockError } = await supabase
    .from('stock_by_product')
    .select('product_id, quantity')

  throwIfError(stockError)

  const stockMap = new Map(
    (stock ?? []).map((item) => [
      item.product_id,
      Number(item.quantity ?? 0),
    ])
  )

  return (products ?? []).map((product) => ({
    ...product,
    current_stock: stockMap.get(product.id) ?? 0,
  }))
    }
