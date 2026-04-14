import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { LayoutDashboard, ScanSearch, BarChart3, Shield } from 'lucide-react';

const navItems = [
  { path: '/',           label: 'Dash',     icon: LayoutDashboard },
  { path: '/scanner',    label: 'Scan',     icon: ScanSearch },
  { path: '/batch-scan', label: 'Batch',    icon: Shield },
  { path: '/analytics',  label: 'Analytics', icon: BarChart3 },
];

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { backendStatus } = useApp();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderTop: '1px solid rgba(51,65,85,0.5)',
        background: 'rgba(3,7,18,0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'none', /* Hidden on desktop */
      }}
      className="mobile-nav"
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 12px 4px',
      }}>
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px 16px',
                borderRadius: '12px',
                transition: 'all 0.2s',
                cursor: 'pointer',
                color: active ? '#3B82F6' : '#64748B',
                background: 'none',
                border: 'none',
                minWidth: '64px',
              }}
            >
              <div style={{
                padding: '6px',
                borderRadius: '8px',
                transition: 'all 0.2s',
                backgroundColor: active ? 'rgba(59,130,246,0.1)' : 'transparent',
              }}>
                <Icon style={{ width: '20px', height: '20px' }} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 500, lineHeight: 1 }}>{label}</span>
            </button>
          );
        })}
      </div>
      {/* Micro status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        paddingBottom: '8px',
      }}
        className="safe-area-bottom"
      >
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          backgroundColor: backendStatus.online ? '#10B981' : '#EF4444',
          boxShadow: backendStatus.online ? '0 0 6px rgba(16,185,129,0.7)' : 'none',
          display: 'inline-block',
        }} />
        <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
          {backendStatus.checking ? 'Connecting…' : backendStatus.online ? 'Online' : 'Offline'}
        </span>
      </div>
    </nav>
  );
}