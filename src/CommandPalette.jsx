import { useState, useEffect } from 'react';
import { Search, Package, Truck, LayoutDashboard, Settings } from 'lucide-react';

export default function CommandPalette({ isOpen, setIsOpen, setActiveTab }) {
  const [query, setQuery] = useState('');

  // Handle keyboard shortcut (CMD+K or CTRL+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  if (!isOpen) return null;

  const actions = [
    { id: 'dash', name: 'Go to Dashboard', icon: <LayoutDashboard size={16} />, action: () => setActiveTab('dashboard') },
    { id: 'prod', name: 'Manage Products', icon: <Package size={16} />, action: () => setActiveTab('products') },
    { id: 'oper', name: 'Inventory Operations', icon: <Truck size={16} />, action: () => setActiveTab('operations') },
    { id: 'set', name: 'System Settings', icon: <Settings size={16} />, action: () => setActiveTab('settings') },
  ];

  const filteredActions = actions.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));

  const handleAction = (action) => {
    action();
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      paddingTop: '10vh', zIndex: 9999
    }} onClick={() => setIsOpen(false)}>
      <div 
        style={{
          width: '100%', maxWidth: '500px', backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <Search size={20} style={{ color: 'var(--text-muted)', marginRight: '1rem' }} />
          <input 
            autoFocus
            type="text" 
            placeholder="Type a command or search..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-main)', fontSize: '1rem', fontFamily: 'inherit'
            }}
          />
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '2px 6px' }}>ESC</div>
        </div>
        
        <div style={{ padding: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
          {filteredActions.length > 0 ? (
            filteredActions.map((action, idx) => (
              <div 
                key={action.id}
                onClick={() => handleAction(action.action)}
                style={{
                  display: 'flex', alignItems: 'center', padding: '0.75rem 1rem',
                  color: 'var(--text-main)', cursor: 'pointer',
                  backgroundColor: idx === 0 ? 'var(--surface-hover)' : 'transparent',
                  borderLeft: idx === 0 ? '3px solid var(--primary)' : '3px solid transparent'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseOut={(e) => {
                  if (idx !== 0) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ color: 'var(--text-muted)', marginRight: '1rem', display: 'flex' }}>
                  {action.icon}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{action.name}</div>
              </div>
            ))
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No results found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
