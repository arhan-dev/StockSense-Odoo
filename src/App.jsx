import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  Settings, 
  User,
  LogOut,
  Search,
  Bell,
  Box
} from 'lucide-react';
import './index.css';
import ProductsView from './ProductsView';
import OperationsView from './OperationsView';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Box style={{ marginRight: '8px', color: 'var(--primary)' }} />
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
            <ArrowRightLeft /> Operations
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
                  borderRadius: '20px', 
                  border: '1px solid var(--border)',
                  outline: 'none',
                  fontSize: '0.875rem'
                }} 
              />
            </div>
            <Bell style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
            <div className="user-profile">
              <div className="avatar">IM</div>
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Inventory Manager</span>
            </div>
          </div>
        </header>

        <div className="main-content">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'operations' && <OperationsView />}
          {activeTab === 'settings' && <div className="content-area">Settings: Warehouse configuration...</div>}
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
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--secondary)', paddingTop: '8px' }}>
            ↑ 4.2% from last week
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
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px' }}>Document ID</th>
              <th style={{ padding: '12px' }}>Type</th>
              <th style={{ padding: '12px' }}>Source → Destination</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Date</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '0.875rem' }}>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px', fontWeight: '500', color: 'var(--primary)' }}>WH/IN/001</td>
              <td style={{ padding: '12px' }}>Receipt</td>
              <td style={{ padding: '12px' }}>Vendor X → Main Store</td>
              <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Done</span></td>
              <td style={{ padding: '12px' }}>Today, 09:41 AM</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px', fontWeight: '500', color: 'var(--primary)' }}>WH/OUT/045</td>
              <td style={{ padding: '12px' }}>Delivery</td>
              <td style={{ padding: '12px' }}>Main Store → Customer Y</td>
              <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Ready</span></td>
              <td style={{ padding: '12px' }}>Today, 08:30 AM</td>
            </tr>
            <tr>
              <td style={{ padding: '12px', fontWeight: '500', color: 'var(--primary)' }}>WH/INT/012</td>
              <td style={{ padding: '12px' }}>Internal</td>
              <td style={{ padding: '12px' }}>Main Store → Production Rack</td>
              <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Done</span></td>
              <td style={{ padding: '12px' }}>Yesterday, 04:15 PM</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default App;
