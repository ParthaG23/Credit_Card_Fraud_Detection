import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../api/apiService';

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }) {
  const [scanHistory, setScanHistory] = useState([]);
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true, message: '' });

  const stats = {
    totalScans: scanHistory.length,
    fraudDetected: scanHistory.filter(s => s.isFraud).length,
    legitimateDetected: scanHistory.filter(s => !s.isFraud).length,
    detectionRate: scanHistory.length > 0
      ? ((scanHistory.filter(s => s.isFraud).length / scanHistory.length) * 100).toFixed(1)
      : '0.0',
    avgProbability: scanHistory.length > 0
      ? (scanHistory.reduce((a, s) => a + s.probability, 0) / scanHistory.length * 100).toFixed(1)
      : '0.0',
    avgResponseTime: scanHistory.length > 0
      ? Math.round(scanHistory.reduce((a, s) => a + (s.responseTime || 0), 0) / scanHistory.length)
      : 0,
  };

  const addScan = useCallback((scan) => {
    setScanHistory(prev => [{ ...scan, id: Date.now(), timestamp: new Date().toISOString() }, ...prev].slice(0, 200));
  }, []);

  const clearHistory = useCallback(() => setScanHistory([]), []);

  useEffect(() => {
    const check = async () => {
      const r = await apiService.checkHealth();
      setBackendStatus({ ...r, checking: false });
    };
    check();
    const iv = setInterval(check, 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <AppContext.Provider value={{ scanHistory, backendStatus, stats, addScan, clearHistory }}>
      {children}
    </AppContext.Provider>
  );
}
