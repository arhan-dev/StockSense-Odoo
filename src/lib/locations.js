import { supabase } from './supabaseClient'

function throwIfError(error) {
  if (error) throw error
}

// ------------------------------
// WAREHOUSES
// ------------------------------

export async function listWarehouses() {
  const { data, error } = await supabase
    .from('warehouses')
    .select('id, name, created_at')
    .order('name', { ascending: true })

  throwIfError(error)

  return data ?? []
}

export async function getWarehouse(warehouseId) {
  if (!warehouseId) {
    throw new Error('Warehouse ID is required.')
  }

  const { data, error } = await supabase
    .from('warehouses')
    .select('id, name, created_at')
    .eq('id', warehouseId)
    .single()

  throwIfError(error)

  return data
}

export async function createWarehouse(name) {
  const cleanName = String(name ?? '').trim()

  if (!cleanName) {
    throw new Error('Warehouse name is required.')
  }

  const { data, error } = await supabase
    .from('warehouses')
    .insert({
      name: cleanName,
    })
    .select('id, name, created_at')
    .single()

  throwIfError(error)

  return data
}

export async function updateWarehouse(warehouseId, name) {
  if (!warehouseId) {
    throw new Error('Warehouse ID is required.')
  }

  const cleanName = String(name ?? '').trim()

  if (!cleanName) {
    throw new Error('Warehouse name is required.')
  }

  const { data, error } = await supabase
    .from('warehouses')
    .update({
      name: cleanName,
    })
    .eq('id', warehouseId)
    .select('id, name, created_at')
    .single()

  throwIfError(error)

  return data
}

export async function deleteWarehouse(warehouseId) {
  if (!warehouseId) {
    throw new Error('Warehouse ID is required.')
  }

  const { error } = await supabase
    .from('warehouses')
    .delete()
    .eq('id', warehouseId)

  throwIfError(error)
}

// ------------------------------
// LOCATIONS
// ------------------------------

export async function listLocations() {
  const { data, error } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      warehouse_id,
      created_at,
      warehouses (
        id,
        name
      )
    `)
    .order('name', { ascending: true })

  throwIfError(error)

  return data ?? []
}

export async function listLocationsByWarehouse(warehouseId) {
  if (!warehouseId) {
    throw new Error('Warehouse ID is required.')
  }

  const { data, error } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      warehouse_id,
      created_at,
      warehouses (
        id,
        name
      )
    `)
    .eq('warehouse_id', warehouseId)
    .order('name', { ascending: true })

  throwIfError(error)

  return data ?? []
}

export async function getLocation(locationId) {
  if (!locationId) {
    throw new Error('Location ID is required.')
  }

  const { data, error } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      warehouse_id,
      created_at,
      warehouses (
        id,
        name
      )
    `)
    .eq('id', locationId)
    .single()

  throwIfError(error)

  return data
}

export async function createLocation({
  name,
  warehouseId = null,
}) {
  const cleanName = String(name ?? '').trim()

  if (!cleanName) {
    throw new Error('Location name is required.')
  }

  const { data, error } = await supabase
    .from('locations')
    .insert({
      name: cleanName,
      warehouse_id: warehouseId,
    })
    .select(`
      id,
      name,
      warehouse_id,
      created_at,
      warehouses (
        id,
        name
      )
    `)
    .single()

  throwIfError(error)

  return data
}

export async function updateLocation(locationId, updates) {
  if (!locationId) {
    throw new Error('Location ID is required.')
  }

  const payload = {}

  if (updates.name !== undefined) {
    const name = String(updates.name).trim()

    if (!name) {
      throw new Error('Location name cannot be empty.')
    }

    payload.name = name
  }

  if (updates.warehouseId !== undefined) {
    payload.warehouse_id = updates.warehouseId
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('No location fields were provided for update.')
  }

  const { data, error } = await supabase
    .from('locations')
    .update(payload)
    .eq('id', locationId)
    .select(`
      id,
      name,
      warehouse_id,
      created_at,
      warehouses (
        id,
        name
      )
    `)
    .single()

  throwIfError(error)

  return data
}

export async function deleteLocation(locationId) {
  if (!locationId) {
    throw new Error('Location ID is required.')
  }

  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId)

  throwIfError(error)
}

// ------------------------------
// CATEGORIES
// ------------------------------

export async function listCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('name', { ascending: true })

  throwIfError(error)

  return data ?? []
}

export async function getCategory(categoryId) {
  if (!categoryId) {
    throw new Error('Category ID is required.')
  }

  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .eq('id', categoryId)
    .single()

  throwIfError(error)

  return data
}

export async function createCategory(name) {
  const cleanName = String(name ?? '').trim()

  if (!cleanName) {
    throw new Error('Category name is required.')
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: cleanName,
    })
    .select('id, name')
    .single()

  throwIfError(error)

  return data
}

export async function updateCategory(categoryId, name) {
  if (!categoryId) {
    throw new Error('Category ID is required.')
  }

  const cleanName = String(name ?? '').trim()

  if (!cleanName) {
    throw new Error('Category name is required.')
  }

  const { data, error } = await supabase
    .from('categories')
    .update({
      name: cleanName,
    })
    .eq('id', categoryId)
    .select('id, name')
    .single()

  throwIfError(error)

  return data
}

export async function deleteCategory(categoryId) {
  if (!categoryId) {
    throw new Error('Category ID is required.')
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  throwIfError(error)
          }
