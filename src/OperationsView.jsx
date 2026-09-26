import React, { useState } from 'react';
import { Download, Upload, ArrowRightLeft, Sliders, CheckCircle } from 'lucide-react';

export default function OperationsView() {
  const [opTab, setOpTab] = useState('receipts');

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Inventory Operations</h2>
        <p style={{ color: 'var(--text-muted)' }}>Manage incoming stock, outgoing shipments, transfers, and inventory counts.</p>
      </div>

      <div className="tabs-header">
        <button 
          className={`tab-btn ${opTab === 'receipts' ? 'active' : ''}`} 
          onClick={() => setOpTab('receipts')}
        >
          <Download size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
          Receipts
        </button>
        <button 
          className={`tab-btn ${opTab === 'deliveries' ? 'active' : ''}`} 
          onClick={() => setOpTab('deliveries')}
        >
          <Upload size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
          Delivery Orders
        </button>
        <button 
          className={`tab-btn ${opTab === 'internal' ? 'active' : ''}`} 
          onClick={() => setOpTab('internal')}
        >
          <ArrowRightLeft size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
          Internal Transfers
        </button>
        <button 
          className={`tab-btn ${opTab === 'adjustments' ? 'active' : ''}`} 
          onClick={() => setOpTab('adjustments')}
        >
          <Sliders size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
          Stock Adjustments
        </button>
      </div>

      {opTab === 'receipts' && <ReceiptsTab />}
      {opTab === 'deliveries' && <DeliveryOrdersTab />}
      {opTab === 'internal' && <InternalTransfersTab />}
      {opTab === 'adjustments' && <StockAdjustmentsTab />}
      
    </div>
  );
}

function ReceiptsTab() {
  const [step, setStep] = useState(1);

  return (
    <div className="card">
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Process Incoming Stock</h3>
      
      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
          <div className="form-row">
            <div className="form-group">
              <label>Vendor / Supplier</label>
              <select className="form-control">
                <option>Vendor A (Steel Co.)</option>
                <option>Vendor B (Furniture Hub)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Reference PO / Document</label>
              <input type="text" className="form-control" placeholder="PO-2026-104" />
            </div>
          </div>
          <div className="form-group">
            <label>Destination Location</label>
            <select className="form-control">
              <option>Main Warehouse</option>
              <option>Warehouse 1</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Start Receipt</button>
        </form>
      )}

      {step === 2 && (
        <div>
          <div style={{ backgroundColor: 'rgba(255, 0, 200, 0.1)', border: '1px solid var(--primary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <strong>Receipt: WH/IN/002</strong> | Vendor: Vendor A | Destination: Main Warehouse
          </div>
          
          <table className="data-table" style={{ marginBottom: '1.5rem' }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Expected Quantity</th>
                <th>Received Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Steel Rods (10mm) [STL-RD-10]</td>
                <td>50 kg</td>
                <td><input type="number" className="form-control" defaultValue="50" style={{ width: '100px', padding: '0.25rem' }} /></td>
              </tr>
              <tr>
                <td>Copper Wire [C-WIRE-01]</td>
                <td>100 m</td>
                <td><input type="number" className="form-control" defaultValue="100" style={{ width: '100px', padding: '0.25rem' }} /></td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-success" onClick={() => setStep(3)}>
              <CheckCircle size={18} /> Validate Receipt
            </button>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>Cancel</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <CheckCircle size={48} style={{ color: 'var(--secondary)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Receipt Validated!</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Stock has automatically increased for the received items.</p>
          <button className="btn btn-primary" onClick={() => setStep(1)}>Create New Receipt</button>
        </div>
      )}
    </div>
  );
}

function DeliveryOrdersTab() {
  return (
    <div className="card">
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Process Outgoing Stock</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Select items to pick, pack, and validate for shipment. Stock will decrease automatically upon validation.</p>
      
      <table className="data-table" style={{ marginBottom: '1.5rem' }}>
        <thead>
          <tr>
            <th>Order Ref</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ fontWeight: '500', color: 'var(--primary)' }}>SO-2026-992</td>
            <td>Client Corp</td>
            <td>10 Chairs [FUR-CH-01]</td>
            <td><span style={{ backgroundColor: 'rgba(255, 230, 0, 0.2)', color: '#ffe600', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #ffe600' }}>To Pick</span></td>
            <td><button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>Process</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function InternalTransfersTab() {
  return (
    <div className="card">
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Move Stock Internally</h3>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-row">
          <div className="form-group">
            <label>Source Location</label>
            <select className="form-control">
              <option>Main Warehouse</option>
              <option>Rack A</option>
            </select>
          </div>
          <div className="form-group">
            <label>Destination Location</label>
            <select className="form-control">
              <option>Production Floor</option>
              <option>Rack B</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Product to Move</label>
          <select className="form-control">
            <option>Steel Rods (10mm) [STL-RD-10]</option>
            <option>Office Chair [FUR-CH-01]</option>
          </select>
        </div>
        <div className="form-group">
          <label>Quantity</label>
          <input type="number" className="form-control" placeholder="0" style={{ maxWidth: '200px' }} />
        </div>
        <button className="btn btn-primary">Confirm Transfer</button>
      </form>
    </div>
  );
}

function StockAdjustmentsTab() {
  return (
    <div className="card">
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Inventory Adjustment</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Update recorded stock to match physical count (e.g., damaged or missing items).</p>
      
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-row">
          <div className="form-group">
            <label>Product</label>
            <select className="form-control">
              <option>Steel Rods (10mm) [STL-RD-10]</option>
              <option>Industrial Lubricant [LUB-IND-5L]</option>
            </select>
          </div>
          <div className="form-group">
            <label>Location</label>
            <select className="form-control">
              <option>Main Warehouse</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Recorded Quantity</label>
            <input type="text" className="form-control" value="1250 kg" disabled style={{ backgroundColor: '#222222', opacity: 0.7 }} />
          </div>
          <div className="form-group">
            <label>Actual Physical Count</label>
            <input type="number" className="form-control" placeholder="1247" />
          </div>
        </div>
        <div className="form-group">
          <label>Reason for Adjustment</label>
          <input type="text" className="form-control" placeholder="e.g., 3 kg steel damaged" />
        </div>
        <button className="btn btn-warning" style={{ backgroundColor: 'var(--warning)', color: 'white' }}>Apply Adjustment</button>
      </form>
    </div>
  );
}
