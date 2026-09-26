import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Package,
  Truck,
  Settings,
  Search,
  Bell,
  User,
  LogOut,
  Shield,
  FileText,
} from 'lucide-react'

import ProductsView from './ProductsView'
import OperationsView from './OperationsView'
import PrivacyView from './PrivacyView'
import TermsView from './TermsView'
import SettingsView from './SettingsView'
import CommandPalette from './CommandPalette'
import AuthView from './AuthView'

import {
  getSession,
  onAuthStateChange,
  signOut,
  unsubscribeFromAuth,
} from './lib/auth'

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      try {
        const currentSession = await getSession()

        if (mounted) {
          setSession(currentSession)
        }
      } catch (error) {
        console.error('Unable to load Supabase session:', error)

        if (mounted) {
          setSession(null)
        }
      } finally {
        if (mounted) {
          setAuthLoading(false)
        }
      }
    }

    loadSession()

    const subscription = onAuthStateChange(
      (_event, nextSession) => {
        if (mounted) {
          setSession(nextSession)
          setAuthLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      unsubscribeFromAuth(subscription)
    }
  }, [])

  if (authLoading) {
    return <LoadingScreen />
  }

  if (!session) {
    return <AuthView />
  }

  return (
    <AuthenticatedApp
      session={session}
    />
  )
}

function AuthenticatedApp({ session }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isCommandOpen, setIsCommandOpen] = useState(false)

  const user = session?.user

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User'

  const initials = getInitials(displayName)

  async function handleLogout() {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="app-container">
      <CommandPalette
        isOpen={isCommandOpen}
        setIsOpen={setIsCommandOpen}
        setActiveTab={setActiveTab}
      />

      <aside className="sidebar">
        <div className="sidebar-header">
          <Package style={{ marginRight: '10px' }} />
          StockSense
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${
              activeTab === 'dashboard'
                ? 'active'
                : ''
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard />
            Dashboard
          </div>

          <div
            className={`nav-item ${
              activeTab === 'products'
                ? 'active'
                : ''
            }`}
            onClick={() => setActiveTab('products')}
          >
            <Package />
            Products
          </div>

          <div
            className={`nav-item ${
              activeTab === 'operations'
                ? 'active'
                : ''
            }`}
            onClick={() => setActiveTab('operations')}
          >
            <Truck />
            Operations
          </div>

          <div
            className={`nav-item ${
              activeTab === 'privacy'
                ? 'active'
                : ''
            }`}
            onClick={() => setActiveTab('privacy')}
          >
            <Shield />
            Privacy Policy
          </div>

          <div
            className={`nav-item ${
              activeTab === 'terms'
                ? 'active'
                : ''
            }`}
            onClick={() => setActiveTab('terms')}
          >
            <FileText />
            Terms
          </div>

          <div
            className={`nav-item ${
              activeTab === 'settings'
                ? 'active'
                : ''
            }`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings />
            Settings
          </div>
        </nav>

        <div
          className="sidebar-nav"
          style={{
            flex: 'none',
            borderTop:
              '1px solid var(--border)',
          }}
        >
          <div
            className="nav-item"
            onClick={() => setActiveTab('settings')}
          >
            <User />
            My Profile
          </div>

          <div
            className="nav-item"
            style={{
              color: 'var(--danger)',
            }}
            onClick={handleLogout}
          >
            <LogOut />
            Logout
          </div>
        </div>
      </aside>

      <main className="main-wrapper">
        <header className="header">
          <div className="header-title">
            {activeTab.charAt(0).toUpperCase() +
              activeTab.slice(1)}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                position: 'relative',
              }}
              onClick={() =>
                setIsCommandOpen(true)
              }
            >
              <Search
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '8px',
                  width: '18px',
                  height: '18px',
                  color:
                    'var(--text-muted)',
                }}
              />

              <div
                style={{
                  padding:
                    '8px 16px 8px 36px',
                  border:
                    '1px solid var(--border)',
                  backgroundColor:
                    'var(--surface)',
                  fontSize: '0.875rem',
                  color:
                    'var(--text-muted)',
                  cursor: 'text',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2rem',
                }}
              >
                Search or jump to...

                <span
                  style={{
                    fontSize: '0.7rem',
                    border:
                      '1px solid var(--border)',
                    padding: '2px 4px',
                    color:
                      'var(--text-muted)',
                  }}
                >
                  ⌘K
                </span>
              </div>
            </div>

            <Bell
              style={{
                color:
                  'var(--text-muted)',
                cursor: 'pointer',
              }}
            />

            <div
              className="user-profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <div className="avatar">
                {initials}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  {displayName}
                </span>

                <span
                  style={{
                    fontSize: '0.7rem',
                    color:
                      'var(--text-muted)',
                  }}
                >
                  {user?.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="main-content">
          {activeTab === 'dashboard' && (
            <DashboardView />
          )}

          {activeTab === 'products' && (
            <ProductsView />
          )}

          {activeTab === 'operations' && (
            <OperationsView />
          )}

          {activeTab === 'privacy' && (
            <PrivacyView />
          )}

          {activeTab === 'terms' && (
            <TermsView />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </div>
      </main>
    </div>
  )
}

function DashboardView() {
  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card info">
          <div className="kpi-title">
            Total Products in Stock
          </div>

          <div className="kpi-value">
            12,450
          </div>

          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              paddingTop: '8px',
            }}
          >
            Live inventory data will appear here
          </div>
        </div>

        <div className="kpi-card danger">
          <div className="kpi-title">
            Low / Out of Stock
          </div>

          <div className="kpi-value">
            18
          </div>

          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              paddingTop: '8px',
            }}
          >
            Inventory alerts
          </div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-title">
            Pending Receipts
          </div>

          <div className="kpi-value">
            5
          </div>

          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              paddingTop: '8px',
            }}
          >
            Incoming operations
          </div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-title">
            Pending Deliveries
          </div>

          <div className="kpi-value">
            24
          </div>

          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              paddingTop: '8px',
            }}
          >
            Outgoing operations
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-header">
          Dynamic Filters
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>
              Document Type
            </label>

            <select>
              <option value="">
                All Types
              </option>
              <option value="receipt">
                Receipts
              </option>
              <option value="delivery">
                Delivery
              </option>
              <option value="internal">
                Internal
              </option>
              <option value="adjustment">
                Adjustments
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>

            <select>
              <option value="">
                All Statuses
              </option>
              <option value="draft">
                Draft
              </option>
              <option value="waiting">
                Waiting
              </option>
              <option value="ready">
                Ready
              </option>
              <option value="done">
                Done
              </option>
              <option value="cancelled">
                Cancelled
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              Warehouse / Location
            </label>

            <select>
              <option value="">
                All Warehouses
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              Product Category
            </label>

            <select>
              <option value="">
                All Categories
              </option>
            </select>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1fr 300px',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          className="content-area"
          style={{
            justifyContent:
              'flex-start',
            alignItems:
              'flex-start',
            flexDirection:
              'column',
            flex: 1,
          }}
        >
          <h3
            style={{
              marginBottom: '1rem',
              color:
                'var(--text-main)',
              fontSize: '1rem',
              fontWeight: '600',
            }}
          >
            Recent Operations Ledger
          </h3>

          <table className="data-table">
            <thead>
              <tr>
                <th>Document ID</th>
                <th>Type</th>
                <th>
                  Source / Destination
                </th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  style={{
                    fontWeight: '500',
                    color:
                      'var(--text-main)',
                  }}
                >
                  WH/IN/001
                </td>

                <td>Receipt</td>

                <td>
                  Vendor / Main Store
                </td>

                <td>
                  <span className="badge badge-success">
                    Done
                  </span>
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    fontWeight: '500',
                    color:
                      'var(--text-main)',
                  }}
                >
                  WH/OUT/045
                </td>

                <td>Delivery</td>

                <td>
                  Main Store / Customer
                </td>

                <td>
                  <span className="badge badge-warning">
                    Ready
                  </span>
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    fontWeight: '500',
                    color:
                      'var(--text-main)',
                  }}
                >
                  WH/INT/012
                </td>

                <td>Internal</td>

                <td>
                  Main Store / Production
                </td>

                <td>
                  <span className="badge badge-success">
                    Done
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h3
            style={{
              marginBottom: '1rem',
              color:
                'var(--text-main)',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                backgroundColor:
                  'var(--danger)',
                borderRadius: '50%',
              }}
            />

            Inventory Alerts
          </h3>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div
              style={{
                borderLeft:
                  '2px solid var(--danger)',
                paddingLeft: '1rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color:
                    'var(--text-main)',
                }}
              >
                Low stock items
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color:
                    'var(--text-muted)',
                }}
              >
                Items below their configured
                reorder threshold.
              </div>
            </div>

            <div
              style={{
                borderLeft:
                  '2px solid var(--warning)',
                paddingLeft: '1rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color:
                    'var(--text-main)',
                }}
              >
                Pending operations
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color:
                    'var(--text-muted)',
                }}
              >
                Receipts and deliveries waiting
                for processing.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#ededed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          textAlign: 'center',
        }}
      >
        <Package
          size={32}
          style={{
            marginBottom: '12px',
          }}
        />

        <div
          style={{
            fontSize: '0.9rem',
            color: '#a3a3a3',
          }}
        >
          Loading StockSense...
        </div>
      </div>
    </div>
  )
}

function getInitials(name) {
  const words = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return 'U'
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

export default App
