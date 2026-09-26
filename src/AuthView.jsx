import { useState } from 'react'
import {
  ArrowLeft,
  KeyRound,
  Lock,
  Mail,
  Package,
  User,
} from 'lucide-react'
import {
  signIn,
  signUp,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  updatePassword,
} from './lib/auth'

const initialSignInForm = {
  email: '',
  password: '',
}

const initialSignUpForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

const initialResetForm = {
  email: '',
  otp: '',
  password: '',
  confirmPassword: '',
}

export default function AuthView() {
  const [mode, setMode] = useState('signin')

  const [signInForm, setSignInForm] = useState(initialSignInForm)
  const [signUpForm, setSignUpForm] = useState(initialSignUpForm)
  const [resetForm, setResetForm] = useState(initialResetForm)

  const [resetStep, setResetStep] = useState('email')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function clearMessages() {
    setMessage('')
    setError('')
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    setLoading(false)
    setResetStep('email')
    clearMessages()
  }

  function handleSignInChange(event) {
    const { name, value } = event.target

    setSignInForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleSignUpChange(event) {
    const { name, value } = event.target

    setSignUpForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleResetChange(event) {
    const { name, value } = event.target

    setResetForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSignIn(event) {
    event.preventDefault()

    setLoading(true)
    clearMessages()

    try {
      await signIn({
        email: signInForm.email,
        password: signInForm.password,
      })

      setMessage('Login successful. Loading your dashboard...')
    } catch (err) {
      setError(err?.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(event) {
    event.preventDefault()

    setLoading(true)
    clearMessages()

    try {
      if (
        signUpForm.password !==
        signUpForm.confirmPassword
      ) {
        throw new Error('Passwords do not match.')
      }

      const data = await signUp({
        fullName: signUpForm.fullName,
        email: signUpForm.email,
        password: signUpForm.password,
      })

      if (data?.session) {
        setMessage(
          'Account created successfully. Loading your dashboard...'
        )
      } else {
        setMessage(
          'Account created. Please confirm your email, then sign in.'
        )

        setSignInForm({
          email: signUpForm.email.trim().toLowerCase(),
          password: '',
        })

        setMode('signin')
      }
    } catch (err) {
      setError(err?.message || 'Unable to create your account.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestOtp(event) {
    event.preventDefault()

    setLoading(true)
    clearMessages()

    try {
      await requestPasswordResetOtp(resetForm.email)

      setResetStep('otp')

      setMessage(
        'Password reset code sent. Check your email and enter the OTP.'
      )
    } catch (err) {
      setError(
        err?.message ||
          'Unable to send the password reset code.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault()

    setLoading(true)
    clearMessages()

    try {
      await verifyPasswordResetOtp({
        email: resetForm.email,
        token: resetForm.otp,
      })

      setResetStep('password')

      setMessage(
        'Code verified. Enter your new password.'
      )
    } catch (err) {
      setError(
        err?.message ||
          'The password reset code is invalid or expired.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdatePassword(event) {
    event.preventDefault()

    setLoading(true)
    clearMessages()

    try {
      if (
        resetForm.password !==
        resetForm.confirmPassword
      ) {
        throw new Error('Passwords do not match.')
      }

      await updatePassword(resetForm.password)

      setMessage(
        'Password updated successfully. You can now sign in.'
      )

      setSignInForm({
        email: resetForm.email.trim().toLowerCase(),
        password: '',
      })

      setResetForm(initialResetForm)
      setResetStep('email')
      setMode('signin')
    } catch (err) {
      setError(
        err?.message ||
          'Unable to update your password.'
      )
    } finally {
      setLoading(false)
    }
  }

  function renderInput({
    icon: Icon,
    label,
    name,
    type = 'text',
    value,
    onChange,
    placeholder,
    autoComplete,
  }) {
    return (
      <label style={styles.field}>
        <span style={styles.label}>{label}</span>

        <div style={styles.inputWrapper}>
          <Icon size={17} style={styles.inputIcon} />

          <input
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoComplete={autoComplete}
            style={styles.input}
            disabled={loading}
            required
          />
        </div>
      </label>
    )
  }

  function renderHeader() {
    return (
      <div style={styles.brand}>
        <div style={styles.logo}>
          <Package size={24} />
        </div>

        <div>
          <div style={styles.brandName}>
            StockSense
          </div>

          <div style={styles.brandSubtitle}>
            Odoo Inventory Management
          </div>
        </div>
      </div>
    )
  }

  function renderMessages() {
    return (
      <>
        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {message && (
          <div style={styles.successBox}>
            {message}
          </div>
        )}
      </>
    )
  }

  function renderSignIn() {
    return (
      <>
        <div style={styles.headingBlock}>
          <h1 style={styles.heading}>
            Welcome back
          </h1>

          <p style={styles.description}>
            Sign in to manage your inventory.
          </p>
        </div>

        <form
          onSubmit={handleSignIn}
          style={styles.form}
        >
          {renderInput({
            icon: Mail,
            label: 'Email',
            name: 'email',
            type: 'email',
            value: signInForm.email,
            onChange: handleSignInChange,
            placeholder: 'you@example.com',
            autoComplete: 'email',
          })}

          {renderInput({
            icon: Lock,
            label: 'Password',
            name: 'password',
            type: 'password',
            value: signInForm.password,
            onChange: handleSignInChange,
            placeholder: 'Enter your password',
            autoComplete: 'current-password',
          })}

          <button
            type="submit"
            style={styles.primaryButton}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={styles.linkRow}>
          <button
            type="button"
            style={styles.linkButton}
            onClick={() => changeMode('reset')}
            disabled={loading}
          >
            Forgot password?
          </button>
        </div>

        <div style={styles.separator}>
          <span style={styles.separatorLine} />
          <span style={styles.separatorText}>
            New to StockSense?
          </span>
          <span style={styles.separatorLine} />
        </div>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => changeMode('signup')}
          disabled={loading}
        >
          Create an account
        </button>
      </>
    )
  }

  function renderSignUp() {
    return (
      <>
        <div style={styles.headingBlock}>
          <h1 style={styles.heading}>
            Create your account
          </h1>

          <p style={styles.description}>
            Set up your inventory management account.
          </p>
        </div>

        <form
          onSubmit={handleSignUp}
          style={styles.form}
        >
          {renderInput({
            icon: User,
            label: 'Full name',
            name: 'fullName',
            value: signUpForm.fullName,
            onChange: handleSignUpChange,
            placeholder: 'Your full name',
            autoComplete: 'name',
          })}

          {renderInput({
            icon: Mail,
            label: 'Email',
            name: 'email',
            type: 'email',
            value: signUpForm.email,
            onChange: handleSignUpChange,
            placeholder: 'you@example.com',
            autoComplete: 'email',
          })}

          {renderInput({
            icon: Lock,
            label: 'Password',
            name: 'password',
            type: 'password',
            value: signUpForm.password,
            onChange: handleSignUpChange,
            placeholder: 'At least 6 characters',
            autoComplete: 'new-password',
          })}

          {renderInput({
            icon: Lock,
            label: 'Confirm password',
            name: 'confirmPassword',
            type: 'password',
            value: signUpForm.confirmPassword,
            onChange: handleSignUpChange,
            placeholder: 'Repeat your password',
            autoComplete: 'new-password',
          })}

          <button
            type="submit"
            style={styles.primaryButton}
            disabled={loading}
          >
            {loading
              ? 'Creating account...'
              : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          style={styles.backButton}
          onClick={() => changeMode('signin')}
          disabled={loading}
        >
          <ArrowLeft size={16} />
          Back to sign in
        </button>
      </>
    )
  }

  function renderReset() {
    if (resetStep === 'email') {
      return (
        <>
          <div style={styles.headingBlock}>
            <h1 style={styles.heading}>
              Reset your password
            </h1>

            <p style={styles.description}>
              Enter your account email and we will send
              you a password reset code.
            </p>
          </div>

          <form
            onSubmit={handleRequestOtp}
            style={styles.form}
          >
            {renderInput({
              icon: Mail,
              label: 'Email',
              name: 'email',
              type: 'email',
              value: resetForm.email,
              onChange: handleResetChange,
              placeholder: 'you@example.com',
              autoComplete: 'email',
            })}

            <button
              type="submit"
              style={styles.primaryButton}
              disabled={loading}
            >
              {loading
                ? 'Sending code...'
                : 'Send reset code'}
            </button>
          </form>

          <button
            type="button"
            style={styles.backButton}
            onClick={() => changeMode('signin')}
            disabled={loading}
          >
            <ArrowLeft size={16} />
            Back to sign in
          </button>
        </>
      )
    }

    if (resetStep === 'otp') {
      return (
        <>
          <div style={styles.headingBlock}>
            <h1 style={styles.heading}>
              Enter reset code
            </h1>

            <p style={styles.description}>
              Enter the OTP sent to your email address.
            </p>
          </div>

          <form
            onSubmit={handleVerifyOtp}
            style={styles.form}
          >
            {renderInput({
              icon: KeyRound,
              label: 'OTP code',
              name: 'otp',
              value: resetForm.otp,
              onChange: handleResetChange,
              placeholder: 'Enter the code',
              autoComplete: 'one-time-code',
            })}

            <button
              type="submit"
              style={styles.primaryButton}
              disabled={loading}
            >
              {loading
                ? 'Verifying...'
                : 'Verify code'}
            </button>
          </form>

          <button
            type="button"
            style={styles.backButton}
            onClick={() => setResetStep('email')}
            disabled={loading}
          >
            <ArrowLeft size={16} />
            Use another email
          </button>
        </>
      )
    }

    return (
      <>
        <div style={styles.headingBlock}>
          <h1 style={styles.heading}>
            Create new password
          </h1>

          <p style={styles.description}>
            Choose a new password for your account.
          </p>
        </div>

        <form
          onSubmit={handleUpdatePassword}
          style={styles.form}
        >
          {renderInput({
            icon: Lock,
            label: 'New password',
            name: 'password',
            type: 'password',
            value: resetForm.password,
            onChange: handleResetChange,
            placeholder: 'At least 6 characters',
            autoComplete: 'new-password',
          })}

          {renderInput({
            icon: Lock,
            label: 'Confirm new password',
            name: 'confirmPassword',
            type: 'password',
            value: resetForm.confirmPassword,
            onChange: handleResetChange,
            placeholder: 'Repeat your new password',
            autoComplete: 'new-password',
          })}

          <button
            type="submit"
            style={styles.primaryButton}
            disabled={loading}
          >
            {loading
              ? 'Updating password...'
              : 'Update password'}
          </button>
        </form>

        <button
          type="button"
          style={styles.backButton}
          onClick={() => changeMode('signin')}
          disabled={loading}
        >
          <ArrowLeft size={16} />
          Back to sign in
        </button>
      </>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {renderHeader()}

        <div style={styles.content}>
          {renderMessages()}

          {mode === 'signin' && renderSignIn()}
          {mode === 'signup' && renderSignUp()}
          {mode === 'reset' && renderReset()}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#0a0a0a',
    color: '#ededed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'Inter, sans-serif',
  },

  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#141414',
    border: '1px solid #262626',
    boxShadow: '0 24px 70px rgba(0, 0, 0, 0.45)',
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 24px',
    borderBottom: '1px solid #262626',
  },

  logo: {
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ededed',
    color: '#0a0a0a',
  },

  brandName: {
    fontSize: '1rem',
    fontWeight: '600',
  },

  brandSubtitle: {
    marginTop: '2px',
    fontSize: '0.72rem',
    color: '#8a8a8a',
  },

  content: {
    padding: '28px 24px 24px',
  },

  headingBlock: {
    marginBottom: '24px',
  },

  heading: {
    margin: 0,
    fontSize: '1.5rem',
    lineHeight: 1.2,
    fontWeight: '600',
    color: '#ededed',
  },

  description: {
    margin: '8px 0 0',
    color: '#8a8a8a',
    fontSize: '0.875rem',
    lineHeight: 1.5,
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },

  label: {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#a3a3a3',
  },

  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#737373',
    pointerEvents: 'none',
  },

  input: {
    width: '100%',
    height: '42px',
    padding: '0 12px 0 38px',
    border: '1px solid #303030',
    backgroundColor: '#0a0a0a',
    color: '#ededed',
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: '0.875rem',
  },

  primaryButton: {
    width: '100%',
    minHeight: '42px',
    marginTop: '4px',
    border: '1px solid #ededed',
    backgroundColor: '#ededed',
    color: '#0a0a0a',
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
  },

  secondaryButton: {
    width: '100%',
    minHeight: '42px',
    border: '1px solid #303030',
    backgroundColor: '#1a1a1a',
    color: '#ededed',
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  },

  linkRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '12px',
  },

  linkButton: {
    border: 'none',
    background: 'transparent',
    color: '#a3a3a3',
    fontFamily: 'inherit',
    fontSize: '0.75rem',
    cursor: 'pointer',
    padding: 0,
  },

  separator: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '24px 0 16px',
  },

  separatorLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#262626',
  },

  separatorText: {
    color: '#737373',
    fontSize: '0.7rem',
  },

  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    marginTop: '16px',
    border: 'none',
    background: 'transparent',
    color: '#a3a3a3',
    fontFamily: 'inherit',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },

  errorBox: {
    marginBottom: '16px',
    padding: '10px 12px',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    color: '#fca5a5',
    fontSize: '0.8rem',
    lineHeight: 1.45,
  },

  successBox: {
    marginBottom: '16px',
    padding: '10px 12px',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    color: '#6ee7b7',
    fontSize: '0.8rem',
    lineHeight: 1.45,
  },
  }
