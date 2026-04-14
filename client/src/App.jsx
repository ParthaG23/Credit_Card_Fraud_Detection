import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import Dashboard from './components/pages/Dashboard';
import Scanner from './components/pages/Scanner';
import Analytics from './components/pages/Analytics';
import BatchScanner from './components/pages/BatchScanner';

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="min-h-screen bg-bg-dark relative">
          <div className="animated-bg" />

          {/* Desktop sidebar — fixed, 260px */}
          <Sidebar />

          {/* Mobile bottom nav */}
          <MobileNav />

          {/* Main content — offset by sidebar on desktop */}
          <main className="app-main">
            <div className="app-content-wrapper">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/scanner" element={<Scanner />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/batch-scan" element={<BatchScanner />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </HashRouter>
    </AppProvider>
  );
}

export default App;