export default function SettingsView() {
  return (
    <div className="content-area">
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-main)' }}>System Settings</h2>
      
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>General Configuration</h3>
        
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-row">
            <div className="form-group">
              <label>Company Name</label>
              <input type="text" className="form-control" defaultValue="StockSense Corp" />
            </div>
            <div className="form-group">
              <label>Base Currency</label>
              <select className="form-control">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Support Email Address</label>
            <input type="email" className="form-control" defaultValue="support@stocksense-ims.com" />
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Save Changes</button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Warehouse Management</h3>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Warehouse ID</th>
              <th>Name</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>WH/MAIN</td>
              <td>Main Warehouse</td>
              <td>New York, NY</td>
              <td><span className="badge badge-success">Active</span></td>
            </tr>
            <tr>
              <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>WH/SEC</td>
              <td>Warehouse 1</td>
              <td>Chicago, IL</td>
              <td><span className="badge badge-success">Active</span></td>
            </tr>
            <tr>
              <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>WH/RACK</td>
              <td>Production Floor</td>
              <td>Internal</td>
              <td><span className="badge badge-warning">Maintenance</span></td>
            </tr>
          </tbody>
        </table>
        
        <button className="btn-secondary" style={{ marginTop: '1rem' }}>Add New Warehouse</button>
      </div>
    </div>
  );
}
