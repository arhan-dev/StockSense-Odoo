import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function ProductsView() {
  const [showCreate, setShowCreate] = useState(false);
  const [products, setProducts] = useState([
    { id: 'PROD-001', name: 'Steel Rods (10mm)', sku: 'STL-RD-10', category: 'Raw Materials', uom: 'kg', stock: 1250, location: 'Main Warehouse' },
    { id: 'PROD-002', name: 'Office Chair', sku: 'FUR-CH-01', category: 'Finished Goods', uom: 'Unit', stock: 45, location: 'Showroom' },
    { id: 'PROD-003', name: 'Industrial Lubricant', sku: 'LUB-IND-5L', category: 'Consumables', uom: 'Liters', stock: 12, location: 'Warehouse 1' },
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Product Management</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage products, categories, and track stock levels across locations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={18} /> {showCreate ? 'Cancel' : 'Create Product'}
        </button>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Create New Product</h3>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-row">
              <div className="form-group">
                <label>Product Name *</label>
                <input type="text" className="form-control" placeholder="e.g., Copper Wire" />
              </div>
              <div className="form-group">
                <label>SKU / Code *</label>
                <input type="text" className="form-control" placeholder="e.g., C-WIRE-01" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select className="form-control">
                  <option>Raw Materials</option>
                  <option>Finished Goods</option>
                  <option>Consumables</option>
                  <option>Spare Parts</option>
                </select>
              </div>
              <div className="form-group">
                <label>Unit of Measure (UoM)</label>
                <select className="form-control">
                  <option>Units</option>
                  <option>kg</option>
                  <option>Liters</option>
                  <option>Meters</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Initial Stock (Optional)</label>
                <input type="number" className="form-control" placeholder="0" />
              </div>
              <div className="form-group">
                <label>Default Location</label>
                <select className="form-control">
                  <option>Main Warehouse</option>
                  <option>Warehouse 1</option>
                  <option>Warehouse 2</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" onClick={() => setShowCreate(false)}>Save Product</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Product Directory</h3>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '8px', width: '18px', height: '18px', color: 'var(--text-muted)' }} />
            <input type="text" className="form-control" placeholder="Search by Name or SKU..." style={{ paddingLeft: '36px' }} />
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Stock on Hand</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td style={{ fontWeight: '500', color: 'var(--primary)' }}>{product.sku}</td>
                <td>{product.name}</td>
                <td><span style={{ backgroundColor: '#F3F4F6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{product.category}</span></td>
                <td>{product.stock} {product.uom}</td>
                <td>{product.location}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                    <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
