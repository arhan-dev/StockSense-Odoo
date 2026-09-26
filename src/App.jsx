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
  RefreshCw,
  AlertTriangle,
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

import {
  getDashboardSummary,
  getRecentStockMoves,
  listLowStockProducts,
  listOutOfStockProducts,
} from './lib/inventory'

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
        console.error(
          'Unable to load Supabase session:',
          error
        )

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
  const [activeTab, setActiveTab] =
    useState('dashboard')

  const [isCommandOpen, setIsCommandOpen] =
    useState(false)

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
          <Package
            style={{
              marginRight: '10px',
            }}
          />

          StockSense
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${
              activeTab === 'dashboard'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('dashboard')
            }
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
            onClick={() =>
              setActiveTab('products')
            }
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
            onClick={() =>
              setActiveTab('operations')
            }
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
            onClick={() =>
              setActiveTab('privacy')
            }
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
            onClick={() =>
              setActiveTab('terms')
            }
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
            onClick={() =>
              setActiveTab('settings')
            }
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
            onClick={() =>
              setActiveTab('settings')
            }
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
  const [summary, setSummary] =
    useState(null)

  const [recentMoves, setRecentMoves] =
    useState([])

  const [lowStockProducts, setLowStockProducts] =
    useState([])

  const [outOfStockProducts, setOutOfStockProducts] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  async function loadDashboard() {
    setLoading(true)
    setError('')

    try {
      const [
        summaryData,
        recentMoveData,
        lowStockData,
        outOfStockData,
      ] = await Promise.all([
        getDashboardSummary(),
        getRecentStockMoves(10),
        listLowStockProducts(),
        listOutOfStockProducts(),
      ])

      setSummary(summaryData)
      setRecentMoves(
        recentMoveData ?? []
      )
      setLowStockProducts(
        lowStockData ?? []
      )
      setOutOfStockProducts(
        outOfStockData ?? []
      )
    } catch (err) {
      console.error(
        'Unable to load dashboard:',
        err
      )

      setError(
        err?.message ||
          'Unable to load dashboard data.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const totalProducts =
    summary?.totalProducts ?? 0

  const lowStock =
    summary?.lowStockItems ?? 0

  const outOfStock =
    summary?.outOfStockItems ?? 0

  const pendingReceipts =
    summary?.pendingReceipts ?? 0

  const pendingDeliveries =
    summary?.pendingDeliveries ?? 0

  const pendingTransfers =
    summary?.pendingTransfers ?? 0

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: '600',
              color:
                'var(--text-main)',
            }}
          >
            Inventory Dashboard
          </h2>

          <p
            style={{
              margin:
                '0.35rem 0 0',
              color:
                'var(--text-muted)',
              fontSize: '0.8rem',
            }}
          >
            Live inventory overview from
            Supabase.
          </p>
        </div>

        <button
          className="btn-secondary"
          type="button"
          onClick={loadDashboard}
          disabled={loading}
        >
          <RefreshCw
            size={15}
            style={{
              marginRight: '6px',
            }}
          />

          {loading
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '0.85rem 1rem',
            border:
              '1px solid rgba(239, 68, 68, 0.35)',
            backgroundColor:
              'rgba(239, 68, 68, 0.08)',
            color: '#fca5a5',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      <div
        className="kpi-grid"
        style={{
          gridTemplateColumns:
            'repeat(auto-fit, minmax(170px, 1fr))',
        }}
      >
        <KpiCard
          title="Total Products"
          value={
            loading
              ? '—'
              : formatNumber(totalProducts)
          }
          type="info"
          footer="Product records"
        />

        <KpiCard
          title="Low Stock Items"
          value={
            loading
              ? '—'
              : formatNumber(lowStock)
          }
          type="warning"
          footer="Below reorder threshold"
        />

        <KpiCard
          title="Out of Stock"
          value={
            loading
              ? '—'
              : formatNumber(outOfStock)
          }
          type="danger"
          footer="Zero available stock"
        />

        <KpiCard
          title="Pending Receipts"
          value={
            loading
              ? '—'
              : formatNumber(
                  pendingReceipts
                )
          }
          type="success"
          footer="Incoming operations"
        />

        <KpiCard
          title="Pending Deliveries"
          value={
            loading
              ? '—'
              : formatNumber(
                  pendingDeliveries
                )
          }
          type="warning"
          footer="Outgoing operations"
        />

        <KpiCard
          title="Internal Transfers"
          value={
            loading
              ? '—'
              : formatNumber(
                  pendingTransfers
                )
          }
          type="info"
          footer="Pending stock moves"
        />
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
            <label>
              Status
            </label>

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
            'minmax(0, 1fr) 300px',
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
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              gap: '1rem',
            }}
          >
            <h3
              style={{
                margin: 0,
                color:
                  'var(--text-main)',
                fontSize: '1rem',
                fontWeight: '600',
              }}
            >
              Recent Stock Activity
            </h3>

            <span
              style={{
                fontSize: '0.7rem',
                color:
                  'var(--text-muted)',
              }}
            >
              Latest 10 movements
            </span>
          </div>

          {loading ? (
            <div
              style={{
                width: '100%',
                padding: '2rem',
                textAlign: 'center',
                color:
                  'var(--text-muted)',
              }}
            >
              Loading recent activity...
            </div>
          ) : recentMoves.length ===
            0 ? (
            <div
              style={{
                width: '100%',
                padding: '2rem',
                textAlign: 'center',
                color:
                  'var(--text-muted)',
              }}
            >
              No stock movements recorded
              yet.
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                overflowX: 'auto',
              }}
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th>
                      Reference
                    </th>

                    <th>
                      Product
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Location
                    </th>

                    <th>
                      Quantity
                    </th>

                    <th>
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentMoves.map(
                    (move) => (
                      <tr
                        key={move.id}
                      >
                        <td
                          style={{
                            fontWeight:
                              '500',
                            color:
                              'var(--text-main)',
                          }}
                        >
                          {move.source_document_ref ||
                            '—'}
                        </td>

                        <td>
                          <div
                            style={{
                              fontWeight:
                                '500',
                            }}
                          >
                            {move.products
                              ?.name ||
                              'Unknown product'}
                          </div>

                          <div
                            style={{
                              fontSize:
                                '0.7rem',
                              color:
                                'var(--text-muted)',
                              marginTop:
                                '2px',
                            }}
                          >
                            {move.products
                              ?.sku ||
                              ''}
                          </div>
                        </td>

                        <td>
                          <span className="badge badge-gray">
                            {formatMoveType(
                              move.move_type
                            )}
                          </span>
                        </td>

                        <td>
                          {move.locations
                            ?.name ||
                            'Unknown location'}
                        </td>

                        <td>
                          <span
                            style={{
                              color:
                                Number(
                                  move.quantity_delta
                                ) >= 0
                                  ? 'var(--success)'
                                  : 'var(--danger)',
                              fontWeight:
                                '600',
                            }}
                          >
                            {Number(
                              move.quantity_delta
                            ) >= 0
                              ? '+'
                              : ''}
                            {formatNumber(
                              move.quantity_delta
                            )}
                          </span>

                          <span
                            style={{
                              marginLeft:
                                '4px',
                              color:
                                'var(--text-muted)',
                              fontSize:
                                '0.7rem',
                            }}
                          >
                            {move.products
                              ?.unit_of_measure ||
                              ''}
                          </span>
                        </td>

                        <td
                          style={{
                            whiteSpace:
                              'nowrap',
                            color:
                              'var(--text-muted)',
                            fontSize:
                              '0.75rem',
                          }}
                        >
                          {formatDateTime(
                            move.created_at
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection:
              'column',
            minWidth: 0,
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
            <AlertTriangle
              size={16}
              style={{
                color:
                  'var(--danger)',
              }}
            />

            Inventory Alerts
          </h3>

          {loading ? (
            <div
              style={{
                color:
                  'var(--text-muted)',
                fontSize:
                  '0.8rem',
              }}
            >
              Loading alerts...
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection:
                  'column',
                gap: '1rem',
              }}
            >
              <AlertSection
                title="Out of stock"
                count={
                  outOfStockProducts.length
                }
                description="Products with zero available stock."
                type="danger"
              />

              <AlertSection
                title="Low stock"
                count={
                  lowStockProducts.length
                }
                description="Products at or below their reorder threshold."
                type="warning"
              />

              {pendingReceipts +
                pendingDeliveries +
                pendingTransfers >
                0 && (
                <AlertSection
                  title="Pending operations"
                  count={
                    pendingReceipts +
                    pendingDeliveries +
                    pendingTransfers
                  }
                  description="Receipts, deliveries, or transfers awaiting completion."
                  type="info"
                />
              )}

              {outOfStockProducts.length ===
                0 &&
                lowStockProducts.length ===
                  0 &&
                pendingReceipts +
                  pendingDeliveries +
                  pendingTransfers ===
                  0 && (
                  <div
                    style={{
                      padding:
                        '0.85rem',
                      border:
                        '1px solid var(--border)',
                      color:
                        'var(--text-muted)',
                      fontSize:
                        '0.8rem',
                    }}
                  >
                    No active inventory
                    alerts.
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function KpiCard({
  title,
  value,
  type,
  footer,
}) {
  return (
    <div
      className={`kpi-card ${type}`}
    >
      <div className="kpi-title">
        {title}
      </div>

      <div className="kpi-value">
        {value}
      </div>

      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.75rem',
          color:
            'var(--text-muted)',
          paddingTop: '8px',
        }}
      >
        {footer}
      </div>
    </div>
  )
}

function AlertSection({
  title,
  count,
  description,
  type,
}) {
  const borderColor =
    type === 'danger'
      ? 'var(--danger)'
      : type === 'warning'
        ? 'var(--warning)'
        : 'var(--primary)'

  return (
    <div
      style={{
        borderLeft:
          `2px solid ${borderColor}`,
        paddingLeft: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <div
          style={{
            fontSize:
              '0.875rem',
            fontWeight: '500',
            color:
              'var(--text-main)',
          }}
        >
          {title}
        </div>

        <span
          className={`badge ${
            type === 'danger'
              ? 'badge-danger'
              : type === 'warning'
                ? 'badge-warning'
                : 'badge-gray'
          }`}
        >
          {count}
        </span>
      </div>

      <div
        style={{
          marginTop: '0.25rem',
          fontSize:
            '0.75rem',
          color:
            'var(--text-muted)',
          lineHeight: 1.45,
        }}
      >
        {description}
      </div>
    </div>
  )
}

function formatNumber(value) {
  const number = Number(
    value ?? 0
  )

  if (!Number.isFinite(number)) {
    return '0'
  }

  return number.toLocaleString(
    undefined,
    {
      maximumFractionDigits: 2,
    }
  )
}

function formatMoveType(type) {
  if (!type) {
    return 'Unknown'
  }

  return (
    type.charAt(0).toUpperCase() +
    type.slice(1)
  )
}

function formatDateTime(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—'
  }

  return date.toLocaleString(
    undefined,
    {
      dateStyle: 'short',
      timeStyle: 'short',
    }
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
        fontFamily:
          'Inter, sans-serif',
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
            fontSize:
              '0.9rem',
            color:
              '#a3a3a3',
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
