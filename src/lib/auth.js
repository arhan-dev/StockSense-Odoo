import { supabase } from './supabaseClient'

function throwIfError(error) {
  if (error) throw error
}

export async function signUp({
  email,
  password,
  fullName,
}) {
  const cleanEmail = String(email ?? '').trim().toLowerCase()
  const cleanName = String(fullName ?? '').trim()

  if (!cleanEmail) {
    throw new Error('Email is required.')
  }

  if (!password) {
    throw new Error('Password is required.')
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.')
  }

  if (!cleanName) {
    throw new Error('Full name is required.')
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: cleanName,
      },
    },
  })

  throwIfError(error)

  return data
}

export async function signIn({
  email,
  password,
}) {
  const cleanEmail = String(email ?? '').trim().toLowerCase()

  if (!cleanEmail) {
    throw new Error('Email is required.')
  }

  if (!password) {
    throw new Error('Password is required.')
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

  throwIfError(error)

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  throwIfError(error)
}

export async function getSession() {
  const {
    data,
    error,
  } = await supabase.auth.getSession()

  throwIfError(error)

  return data.session
}

export async function getCurrentUser() {
  const {
    data,
    error,
  } = await supabase.auth.getUser()

  throwIfError(error)

  return data.user
}

export function onAuthStateChange(callback) {
  if (typeof callback !== 'function') {
    throw new Error('Authentication callback is required.')
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session)
    }
  )

  return subscription
}

export function unsubscribeFromAuth(
  subscription
) {
  if (!subscription) {
    return
  }

  subscription.unsubscribe()
}

export async function requestPasswordResetOtp(
  email
) {
  const cleanEmail = String(email ?? '').trim().toLowerCase()

  if (!cleanEmail) {
    throw new Error('Email is required.')
  }

  const { data, error } =
    await supabase.auth.resetPasswordForEmail(
      cleanEmail
    )

  throwIfError(error)

  return data
}

export async function verifyPasswordResetOtp({
  email,
  token,
}) {
  const cleanEmail = String(email ?? '').trim().toLowerCase()
  const cleanToken = String(token ?? '').trim()

  if (!cleanEmail) {
    throw new Error('Email is required.')
  }

  if (!cleanToken) {
    throw new Error('Password reset code is required.')
  }

  const { data, error } =
    await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'recovery',
    })

  throwIfError(error)

  return data
}

export async function updatePassword(
  password
) {
  if (!password) {
    throw new Error('New password is required.')
  }

  if (password.length < 6) {
    throw new Error(
      'New password must be at least 6 characters.'
    )
  }

  const { data, error } =
    await supabase.auth.updateUser({
      password,
    })

  throwIfError(error)

  return data
}
