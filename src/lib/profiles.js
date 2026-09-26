import { supabase } from './supabaseClient'

function throwIfError(error) {
  if (error) throw error
}

export async function getCurrentProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  throwIfError(userError)

  if (!user) {
    throw new Error('No authenticated user found.')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      role,
      created_at
    `)
    .eq('id', user.id)
    .single()

  throwIfError(error)

  return data
}

export async function getProfile(userId) {
  if (!userId) {
    throw new Error('User ID is required.')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      role,
      created_at
    `)
    .eq('id', userId)
    .single()

  throwIfError(error)

  return data
}

export async function updateCurrentProfile({
  fullName,
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  throwIfError(userError)

  if (!user) {
    throw new Error('No authenticated user found.')
  }

  const cleanName = String(fullName ?? '').trim()

  if (!cleanName) {
    throw new Error('Full name is required.')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: cleanName,
    })
    .eq('id', user.id)
    .select(`
      id,
      full_name,
      role,
      created_at
    `)
    .single()

  throwIfError(error)

  return data
}

export async function listProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      role,
      created_at
    `)
    .order('created_at', { ascending: false })

  throwIfError(error)

  return data ?? []
}

export async function updateProfileRole(userId, role) {
  if (!userId) {
    throw new Error('User ID is required.')
  }

  const allowedRoles = [
    'inventory_manager',
    'warehouse_staff',
  ]

  if (!allowedRoles.includes(role)) {
    throw new Error('Invalid profile role.')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      role,
    })
    .eq('id', userId)
    .select(`
      id,
      full_name,
      role,
      created_at
    `)
    .single()

  throwIfError(error)

  return data
}
