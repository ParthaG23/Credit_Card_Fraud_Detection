import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { LayoutDashboard, ScanSearch, BarChart3, Shield, Wifi, WifiOff } from 'lucide-react';

const navItems = [
  { path: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { path: '/scanner',   label: 'Scanner',   icon: ScanSearch },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { backendStatus } = useApp();

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 'var(--sidebar-w)',
        borderRight: '1px solid rgba(51,65,85,0.5)',
        zIndex: 50,
        display: 'none',
        flexDirection: 'column',
        background: 'rgba(15,23,42,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
      className="desktop-sidebar"
    >
      {/* Brand */}
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(51,65,85,0.5)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(59,130,246,0.25)',
          }}>
            <img 
              src="/logo.png" 
              alt="NexusGuard Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>NexusGuard</h1>
            <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500, marginTop: '2px' }}>AI Fraud Detection</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-text-muted)', fontWeight: 600, padding: '0 12px', marginBottom: '12px' }}>
          Navigation
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                  color: active ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                <Icon style={{ width: '17px', height: '17px', flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                {active && (
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: 'var(--color-accent-blue)',
                    boxShadow: '0 0 6px rgba(59,130,246,0.6)',
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Backend Status */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(51,65,85,0.5)', flexShrink: 0 }}>
        <div style={{
          borderRadius: '12px', padding: '12px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(51,65,85,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {backendStatus.checking ? (
              <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
            ) : backendStatus.online ? (
              <Wifi style={{ width: '16px', height: '16px', color: 'var(--color-accent-emerald)', flexShrink: 0 }} />
            ) : (
              <WifiOff style={{ width: '16px', height: '16px', color: 'var(--color-accent-red)', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                {backendStatus.checking ? 'Connecting...' : backendStatus.online ? 'Backend Online' : 'Backend Offline'}
              </p>
              <p style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {backendStatus.online ? 'Flask API • Port 5000' : 'Run app.py to connect'}
              </p>
            </div>
            {!backendStatus.checking && (
              <span
                className={`status-dot ${backendStatus.online ? 'online' : ''}`}
                style={!backendStatus.online ? { backgroundColor: '#EF4444', boxShadow: '0 0 8px rgba(239,68,68,0.5)' } : {}}
              />
            )}
          </div>
        </div>
        <p style={{ fontSize: '9px', color: 'rgba(100,116,139,0.7)', textAlign: 'center', marginTop: '12px' }}>NexusGuard v1.0</p>
      </div>
    </aside>
  );
}