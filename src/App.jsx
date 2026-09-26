import { useState } from 'react';
import { LayoutDashboard, Package, Truck, Settings, Search, Bell, User, LogOut, Shield, FileText } from 'lucide-react';
import ProductsView from './ProductsView';
import OperationsView from './OperationsView';
import PrivacyView from './PrivacyView';
import TermsView from './TermsView';
import SettingsView from './SettingsView';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Package style={{ marginRight: '10px' }} />
          StockSense
        </div>
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard /> Dashboard
          </div>
          <div 
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package /> Products
          </div>
          <div 
            className={`nav-item ${activeTab === 'operations' ? 'active' : ''}`}
            onClick={() => setActiveTab('operations')}
          >
            <Truck /> Operations
          </div>
          <div 
            className={`nav-item ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <Shield /> Privacy Policy
          </div>
          <div 
            className={`nav-item ${activeTab === 'terms' ? 'active' : ''}`}
            onClick={() => setActiveTab('terms')}
          >
            <FileText /> Terms
          </div>
          <div 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings /> Settings
          </div>
        </nav>
        <div className="sidebar-nav" style={{ flex: 'none', borderTop: '1px solid var(--border)' }}>
          <div className="nav-item">
            <User /> My Profile
          </div>
          <div className="nav-item" style={{ color: 'var(--danger)' }}>
            <LogOut /> Logout
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-wrapper">
        <header className="header">
          <div className="header-title">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '8px', width: '18px', height: '18px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search SKU..." 
                style={{ 
                  padding: '8px 16px 8px 36px', 
                  borderRadius: '4px', 
                  border: '1px solid var(--border)',
                  outline: 'none',
                  fontSize: '0.875rem'
                }} 
              />
            </div>
            <Bell style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
            <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="avatar">AD</div>
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Admin</span>
            </div>
          </div>
        </header>

        <div className="main-content">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'operations' && <OperationsView />}
          {activeTab === 'privacy' && <PrivacyView />}
          {activeTab === 'terms' && <TermsView />}
          {activeTab === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

function DashboardView() {
  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card info">
          <div className="kpi-title">Total Products in Stock</div>
          <div className="kpi-value">12,450</div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '8px' }}>
            Volume: 4.2% YoY
          </div>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-title">Low / Out of Stock</div>
          <div className="kpi-value">18</div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '8px' }}>
            Requires immediate action
          </div>
        </div>
        <div className="kpi-card success">
          <div className="kpi-title">Pending Receipts</div>
          <div className="kpi-value">5</div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '8px' }}>
            Incoming this week
          </div>
        </div>
        <div className="kpi-card warning">
          <div className="kpi-title">Pending Deliveries</div>
          <div className="kpi-value">24</div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '8px' }}>
            Processing outgoing
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-header">Dynamic Filters</div>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Document Type</label>
            <select>
              <option value="">All Types</option>
              <option value="receipt">Receipts</option>
              <option value="delivery">Delivery</option>
              <option value="internal">Internal</option>
              <option value="adjustment">Adjustments</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select>
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="waiting">Waiting</option>
              <option value="ready">Ready</option>
              <option value="done">Done</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Warehouse / Location</label>
            <select>
              <option value="">All Warehouses</option>
              <option value="main">Main Warehouse</option>
              <option value="w1">Warehouse 1</option>
              <option value="w2">Warehouse 2</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Product Category</label>
            <select>
              <option value="">All Categories</option>
              <option value="raw">Raw Materials</option>
              <option value="finished">Finished Goods</option>
              <option value="spares">Spare Parts</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="content-area" style={{ justifyContent: 'flex-start', alignItems: 'flex-start', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.125rem' }}>Recent Operations Ledger</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Document ID</th>
              <th>Type</th>
              <th>Source / Destination</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>WH/IN/001</td>
              <td>Receipt</td>
              <td>Vendor X / Main Store</td>
              <td><span className="badge badge-success">Done</span></td>
              <td>Today, 09:41 AM</td>
            </tr>
            <tr>
              <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>WH/OUT/045</td>
              <td>Delivery</td>
              <td>Main Store / Customer Y</td>
              <td><span className="badge badge-warning">Ready</span></td>
              <td>Today, 08:30 AM</td>
            </tr>
            <tr>
              <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>WH/INT/012</td>
              <td>Internal</td>
              <td>Main Store / Production Rack</td>
              <td><span className="badge badge-success">Done</span></td>
              <td>Yesterday, 04:15 PM</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default App;
