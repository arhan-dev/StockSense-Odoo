export default function PrivacyView() {
  return (
    <div className="content-area">
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-main)' }}>Privacy Policy</h2>
      <div style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
        <p style={{ marginBottom: '1rem' }}>Last updated: September 2026</p>
        <p style={{ marginBottom: '1rem' }}>We take your privacy seriously. This privacy policy describes how StockSense collects, uses, and protects your data.</p>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Data Collection</h3>
        <p style={{ marginBottom: '1rem' }}>We collect necessary telemetry and operation logs strictly for inventory processing and system stability.</p>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Data Security</h3>
        <p style={{ marginBottom: '1rem' }}>All warehouse data is encrypted in transit and at rest using industry-standard protocols.</p>
      </div>
    </div>
  );
}
