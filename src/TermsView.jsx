export default function TermsView() {
  return (
    <div className="content-area">
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-main)' }}>Terms and Conditions</h2>
      <div style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
        <p style={{ marginBottom: '1rem' }}>Last updated: September 2026</p>
        <p style={{ marginBottom: '1rem' }}>By accessing StockSense, you agree to these terms and conditions.</p>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Usage</h3>
        <p style={{ marginBottom: '1rem' }}>This system is designed strictly for enterprise resource planning. Unauthorized access to endpoints or attempts to disrupt service are strictly prohibited.</p>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Liability</h3>
        <p style={{ marginBottom: '1rem' }}>StockSense is provided as-is without any guarantees or warranty. In association with the use of the application, we make no promises that the data will be error-free.</p>
      </div>
    </div>
  );
}
