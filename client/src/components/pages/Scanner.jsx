import { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../../api/apiService';
import {
  ScanSearch, AlertTriangle, XCircle, Loader2, RotateCcw,
  Shield, ChevronDown, ChevronUp, ShieldAlert, ShieldCheck, Info
} from 'lucide-react';

/* ── Circular Fraud Gauge ── */
function FraudGauge({ probability, size = 140 }) {
  const pct = Math.round(probability * 100);
  const r = (size - 18) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct > 70 ? '#EF4444' : pct > 40 ? '#F59E0B' : pct > 15 ? '#06B6D4' : '#10B981';
  const label = pct > 70 ? 'CRITICAL' : pct > 40 ? 'HIGH RISK' : pct > 15 ? 'MEDIUM' : 'LOW RISK';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: `0 0 50px ${color}18` }} />
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(51,65,85,0.25)" strokeWidth="7" />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <motion.span
            style={{ fontSize: '28px', fontWeight: 700, color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {pct}%
          </motion.span>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Fraud Score</span>
        </div>
      </div>
      <motion.div
        style={{
          marginTop: '10px', padding: '4px 12px', borderRadius: '999px',
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em',
          backgroundColor: `${color}15`, color,
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {label}
      </motion.div>
    </div>
  );
}

export default function Scanner() {
  const { addScan, backendStatus } = useApp();
  const [features, setFeatures] = useState(null);
  const [trueClass, setTrueClass] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(null);
  const [error, setError] = useState(null);
  const [showFeatures, setShowFeatures] = useState(false);

  const loadSample = useCallback(async (type) => {
    setSampleLoading(type); setError(null); setResult(null);
    try {
      const { transaction, trueClass: tc } = await apiService.fetchSampleTransaction(type);
      setFeatures(transaction); setTrueClass(tc);
    } catch (e) { setError(e.message); }
    finally { setSampleLoading(null); }
  }, []);

  const runScan = useCallback(async () => {
    if (!features) return;
    setLoading(true); setError(null); setResult(null);
    const t0 = performance.now();
    try {
      const res = await apiService.scanTransaction(features);
      const responseTime = Math.round(performance.now() - t0);
      const sr = { ...res, responseTime };
      setResult(sr); addScan(sr);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [features, addScan]);

  const reset = () => {
    setFeatures(null); setResult(null); setError(null); setTrueClass(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>Transaction Scanner</h1>
        <p style={{ fontSize: 'clamp(0.7rem, 2vw, 0.875rem)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Load a sample transaction and analyze it for fraud using the ML model
        </p>
      </div>

      {/* Offline warning */}
      {!backendStatus.online && (
        <div className="glass-card" style={{ padding: '16px', borderLeft: '2px solid var(--color-accent-amber)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <AlertTriangle style={{ width: '20px', height: '20px', color: 'var(--color-accent-amber)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-accent-amber)' }}>Backend Offline</p>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Start the Flask server (python app.py) to use the scanner</p>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="scanner-layout">
        {/* Left: controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Sample Loader */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Load Sample Transaction</h3>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>Pull a random transaction from the dataset for analysis</p>
            <div className="sample-buttons">
              <button
                onClick={() => loadSample('legit')}
                disabled={sampleLoading !== null}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', borderRadius: '12px',
                  border: '1px solid rgba(16,185,129,0.3)', backgroundColor: 'rgba(16,185,129,0.05)',
                  color: 'var(--color-accent-emerald)', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s', opacity: sampleLoading !== null ? 0.5 : 1,
                }}
              >
                {sampleLoading === 'legit' ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <ShieldCheck style={{ width: '16px', height: '16px' }} />}
                Legitimate
              </button>
              <button
                onClick={() => loadSample('fraud')}
                disabled={sampleLoading !== null}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', borderRadius: '12px',
                  border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)',
                  color: 'var(--color-accent-red)', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s', opacity: sampleLoading !== null ? 0.5 : 1,
                }}
              >
                {sampleLoading === 'fraud' ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <ShieldAlert style={{ width: '16px', height: '16px' }} />}
                Fraudulent
              </button>
            </div>
          </div>

          {/* Feature Accordion */}
          <AnimatePresence>
            {features && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card"
                style={{ overflow: 'hidden' }}
              >
                <button
                  onClick={() => setShowFeatures(!showFeatures)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Info style={{ width: '16px', height: '16px', color: 'var(--color-accent-cyan)', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Features (V1–V28)</span>
                    {trueClass !== null && (
                      <span style={{
                        fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                        padding: '2px 8px', borderRadius: '999px',
                        backgroundColor: trueClass === 1 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        color: trueClass === 1 ? 'var(--color-accent-red)' : 'var(--color-accent-emerald)',
                      }}>
                        True: {trueClass === 1 ? 'Fraud' : 'Legit'}
                      </span>
                    )}
                  </div>
                  {showFeatures
                    ? <ChevronUp style={{ width: '16px', height: '16px', color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    : <ChevronDown style={{ width: '16px', height: '16px', color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  }
                </button>
                {showFeatures && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '0 20px 20px' }}>
                    <div className="feature-grid">
                      {Object.entries(features).map(([k, v]) => (
                        <div key={k} style={{
                          background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '8px',
                          border: '1px solid rgba(51,65,85,0.2)',
                        }}>
                          <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{k}</span>
                          <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', marginTop: '2px' }}>{Number(v).toFixed(4)}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scan + Reset Buttons */}
          {features && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={runScan}
                disabled={loading || !backendStatus.online}
                className="btn-primary"
                style={{ flex: 1, padding: '14px 20px' }}
              >
                {loading ? <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Analyzing...</> : <><ScanSearch style={{ width: '16px', height: '16px' }} /> Scan Transaction</>}
              </button>
              <button
                onClick={reset}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '14px 16px', border: '1px solid rgba(51,65,85,0.5)',
                  color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 500,
                  borderRadius: '12px', background: 'none', cursor: 'pointer', flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                <RotateCcw style={{ width: '16px', height: '16px' }} />
                <span className="hidden-mobile">Reset</span>
              </button>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '16px', borderLeft: '2px solid var(--color-accent-red)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <XCircle style={{ width: '20px', height: '20px', color: 'var(--color-accent-red)', flexShrink: 0 }} />
                <p style={{ fontSize: '14px', color: 'var(--color-accent-red)', fontWeight: 500 }}>{error}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Result Panel */}
        <div>
          <div style={{ position: 'sticky', top: '32px' }}>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="glass-card"
                  style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Shield style={{ width: '16px', height: '16px', color: 'var(--color-accent-blue)' }} />
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Analysis Result</h3>
                  </div>

                  <FraudGauge probability={result.probability} />

                  <div style={{
                    display: 'inline-flex', alignItems: 'center', alignSelf: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
                    backgroundColor: result.isFraud ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                    color: result.isFraud ? 'var(--color-accent-red)' : 'var(--color-accent-emerald)',
                    border: `1px solid ${result.isFraud ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                  }}>
                    {result.isFraud ? <ShieldAlert style={{ width: '16px', height: '16px' }} /> : <ShieldCheck style={{ width: '16px', height: '16px' }} />}
                    {result.isFraud ? 'FRAUDULENT' : 'LEGITIMATE'}
                  </div>

                  {trueClass !== null && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Ground Truth:{' '}
                      <span style={{ color: trueClass === 1 ? 'var(--color-accent-red)' : 'var(--color-accent-emerald)', fontWeight: 600 }}>
                        {trueClass === 1 ? 'Fraud' : 'Legit'}
                      </span>
                      {' • '}
                      <span style={{ color: result.isFraud === (trueClass === 1) ? 'var(--color-accent-emerald)' : 'var(--color-accent-red)', fontWeight: 600 }}>
                        {result.isFraud === (trueClass === 1) ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                  )}

                  <div className="result-stats">
                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(51,65,85,0.25)' }}>
                      <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Response</p>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{result.responseTime}ms</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(51,65,85,0.25)' }}>
                      <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Confidence</p>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {result.isFraud ? Math.round(result.probability * 100) : Math.round((1 - result.probability) * 100)}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="placeholder" className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    backgroundColor: 'rgba(59,130,246,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', border: '1px solid rgba(51,65,85,0.25)',
                  }}>
                    <ScanSearch style={{ width: '28px', height: '28px', color: 'rgba(100,116,139,0.3)' }} />
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>No Scan Results</h3>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    Load a sample and scan to see<br />fraud analysis results
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}