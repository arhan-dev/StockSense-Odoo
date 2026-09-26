import { supabase } from './supabaseClient'

export async function signUp({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) throw error

  return data
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) throw error
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) throw error

  return data.session
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error) throw error

  return data.user
}

export function onAuthStateChange(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })

  return subscription
}

export async function requestPasswordResetOtp(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) throw error

  return data
}

export async function verifyPasswordResetOtp({ email, token }) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  })

  if (error) throw error

  return data
}

export async function updatePassword(password) {
  const { data, error } = await supabase.auth.updateUser({
    password,
  })

  if (error) throw error

  return data
}
