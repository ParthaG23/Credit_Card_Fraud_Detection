import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../../api/apiService';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import {
  FileText, Upload, CheckCircle2, AlertCircle, Loader2,
  Search, ShieldAlert, ShieldCheck, Download, Trash2,
  Filter, ArrowRight, BarChart3, Fingerprint, Clock, History,
  MapPin, CreditCard, Tag, TrendingUp, Activity, Target,
  DollarSign, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

/* ─── Shared styles ─── */
const tt = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(51,65,85,0.5)',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#F1F5F9',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  padding: '8px 12px',
};

const cV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const iV = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } };

const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#06B6D4', '#6366F1', '#F97316', '#8B5CF6', '#EC4899', '#14B8A6'];

/* ─── Sub-components ─── */

function CardHeader({ icon: Icon, iconColor, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        backgroundColor: `${iconColor}15`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon style={{ width: '16px', height: '16px', color: iconColor }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function StatBox({ label, value, color, sub }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px',
      border: '1px solid rgba(51,65,85,0.3)', borderLeft: `3px solid ${color}`,
    }}>
      <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 700, marginTop: '4px', color }}>{value}</p>
      {sub && <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{sub}</p>}
    </div>
  );
}

/* ─── Breakdown Bar Chart Section ─── */
function BreakdownChart({ data, icon, iconColor, title, subtitle }) {
  if (!data || data.length === 0) return null;
  return (
    <motion.div variants={iV} className="glass-card" style={{ padding: '20px' }}>
      <CardHeader icon={icon} iconColor={iconColor} title={title} subtitle={subtitle} />
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 42)}>
        <BarChart data={data} layout="vertical" barSize={16} margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.2)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
          <YAxis
            type="category" dataKey="name" width={90}
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip contentStyle={tt} />
          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
          <Bar dataKey="legit" name="Legitimate" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="fraud" name="Fraudulent" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {/* Fraud rate table */}
      <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {data.map((d) => (
          <div key={d.name} style={{
            padding: '6px 12px', borderRadius: '8px',
            backgroundColor: d.fraud_rate > 10 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.06)',
            border: `1px solid ${d.fraud_rate > 10 ? 'rgba(239,68,68,0.15)' : 'rgba(51,65,85,0.2)'}`,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{d.name}</span>
            <span style={{
              fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)',
              color: d.fraud_rate > 10 ? '#EF4444' : d.fraud_rate > 5 ? '#F59E0B' : '#10B981',
            }}>
              {d.fraud_rate}%
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Premium Scanning Animation ─── */
function ScanningAnimation({ filename }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Ingesting transaction dataset...",
    "Extracting sequential temporal features...",
    "Applying Random Forest weights...",
    "Detecting anomalous patterns...",
    "Finalizing threat scores..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s + 1) % steps.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '24px', width: '100%' }}
    >
      <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid var(--color-accent-blue)', opacity: 0.5
            }}
            animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
          />
        ))}
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, boxShadow: '0 0 20px rgba(59,130,246,0.6)' }}>
          <Fingerprint style={{ width: '24px', height: '24px', color: '#fff' }} />
        </div>
      </div>

      <div style={{ textAlign: 'center', minHeight: '60px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Analyzing {filename}</p>
        <AnimatePresence mode="wait">
          <motion.p 
            key={step} 
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} 
            style={{ fontSize: '12px', color: 'var(--color-accent-cyan)', marginTop: '8px', fontWeight: 500 }}
          >
            {steps[step]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div style={{ width: '100%', maxWidth: '240px', height: '4px', backgroundColor: 'rgba(51,65,85,0.4)', borderRadius: '2px', overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', backgroundColor: 'var(--color-accent-blue)', borderRadius: '2px' }}
          initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 8, ease: "linear" }} 
        />
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
/*                           MAIN COMPONENT                              */
/* ════════════════════════════════════════════════════════════════════════ */

export default function BatchScanner() {
  const { backendStatus } = useApp();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'table'
  const [showTopFraud, setShowTopFraud] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await apiService.fetchBatchHistory();
      setHistory(data);
    } catch (err) {
      console.error("History fetch failed", err);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid CSV file.');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiService.scanBatch(file);
      setResult(data);
      setActiveTab('analytics');
      fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setActiveTab('analytics');
  };

  const downloadResults = () => {
    if (!result) return;
    const headers = ['Transaction ID', 'Amount', 'Card Type', 'Location', 'Category', 'Prediction', 'Probability', 'Is Fraud'];
    const csvRows = result.results.map(row => [
      row.id, row.amount, row.card_type, row.location, row.category,
      row.prediction, row.probability.toFixed(4), row.is_fraud ? 'YES' : 'NO'
    ]);
    const csvContent = [headers, ...csvRows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nexusguard_batch_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = result?.results.filter(row => {
    const matchesSearch = row.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.card_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'fraud' && row.is_fraud) ||
      (filter === 'legit' && !row.is_fraud);
    return matchesSearch && matchesFilter;
  }) || [];

  const analytics = result?.analytics;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Batch Analysis <span style={{ color: 'var(--color-accent-blue)' }}>Engine</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '8px', maxWidth: '500px' }}>
            Upload large transaction datasets for deep neural pattern analysis and fraud detection.
          </p>
        </div>
        {result && (
          <button
            onClick={reset}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
              borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)',
              backgroundColor: 'rgba(239,68,68,0.05)', color: 'var(--color-accent-red)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <Trash2 size={16} /> New Analysis
          </button>
        )}
      </div>

      {/* ═══════════════════ UPLOAD VIEW ═══════════════════ */}
      {!result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Upload Card */}
          <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                backgroundColor: 'rgba(59,130,246,0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-blue)'
              }}>
                <Upload size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Data Ingestion</h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Securely upload CSV file for scanning</p>
              </div>
            </div>

            <div
              style={{
                border: loading ? '2px solid rgba(59,130,246,0.5)' : '2px dashed rgba(51,65,85,0.4)', borderRadius: '16px',
                padding: loading ? '20px' : '40px 20px', textAlign: 'center',
                backgroundColor: 'rgba(255,255,255,0.01)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                cursor: loading ? 'default' : 'pointer', transition: 'all 0.3s', position: 'relative', overflow: 'hidden', minHeight: '260px', justifyContent: 'center'
              }}
              onDragOver={(e) => !loading && e.preventDefault()}
              onDrop={(e) => {
                if(loading) return;
                e.preventDefault();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile && droppedFile.name.endsWith('.csv')) {
                  setFile(droppedFile);
                  setError(null);
                }
              }}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <ScanningAnimation key="scanning" filename={file?.name || "dataset"} />
                ) : (
                  <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%' }}>
                    <input
                      type="file" accept=".csv" onChange={handleFileChange}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                    />
                    {file ? (
                      <>
                        <div style={{ color: 'var(--color-accent-emerald)', marginBottom: '4px' }}>
                          <FileText size={48} strokeWidth={1.5} style={{ margin: '0 auto' }} />
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>{file.name}</p>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {(file.size / 1024).toFixed(2)} KB • Ready for analysis
                        </p>
                      </>
                    ) : (
                      <>
                        <div style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                          <Upload size={48} strokeWidth={1} style={{ margin: '0 auto' }} />
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: 500, marginTop: '8px' }}>Drop your CSV here or <span style={{ color: 'var(--color-accent-blue)' }}>browse</span></p>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Supported format: .csv (Max 10MB)</p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || loading || !backendStatus.online}
              className="btn-primary"
              style={{ padding: '16px', fontSize: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}
            >
              {loading ? (
                <><Loader2 size={18} className="spin" /> Scanning transactions...</>
              ) : (
                <><Fingerprint size={18} /> Execute Analysis</>
              )}
            </button>

            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: '12px',
                backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-accent-red)'
              }}>
                <AlertCircle size={18} />
                <p style={{ fontSize: '13px', fontWeight: 500 }}>{error}</p>
              </div>
            )}
          </div>

          {/* Info Side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {history.length > 0 && (
              <div className="glass-card" style={{ padding: '24px', flex: 1 }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={16} color="var(--color-accent-blue)" /> Recent Batches
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {history.slice(0, 5).map((item, idx) => (
                    <div key={idx} style={{
                      padding: '12px', borderRadius: '10px',
                      backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(51,65,85,0.2)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                          {item.filename.split('_').slice(2).join('_')}
                        </p>
                        <p style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={10} /> {new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '11px', fontWeight: 800, color: item.fraud > 0 ? 'var(--color-accent-red)' : 'var(--color-accent-emerald)' }}>
                          {item.fraud} Threats
                        </p>
                        <p style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>{item.total} TXs</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-card" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={16} color="var(--color-accent-blue)" /> Expected Headers
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['amount', 'transaction_time', 'card_type', 'location', 'purchase_category', 'customer_age'].map(header => (
                  <span key={header} style={{
                    fontSize: '11px', padding: '4px 10px', borderRadius: '6px',
                    backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(51,65,85,0.3)',
                    color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)'
                  }}>
                    {header}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '16px', lineHeight: 1.5 }}>
                Missing columns will be automatically imputed with ensemble averages. Identifiers like <code style={{ color: 'var(--color-text-secondary)' }}>transaction_id</code> are recommended for tracking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ RESULTS VIEW ═══════════════════ */}
      <AnimatePresence>
        {result && (
          <motion.div
            variants={cV}
            initial="hidden"
            animate="show"
            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
          >
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <motion.div variants={iV}>
                <StatBox label="Volume Scanned" value={result.summary.total.toLocaleString()} color="var(--color-accent-blue)" sub="Total transactions" />
              </motion.div>
              <motion.div variants={iV}>
                <StatBox label="Threats Detected" value={result.summary.fraud.toLocaleString()} color="var(--color-accent-red)" sub={`${result.summary.fraud_rate}% fraud rate`} />
              </motion.div>
              <motion.div variants={iV}>
                <StatBox label="Verified Safe" value={result.summary.legit.toLocaleString()} color="var(--color-accent-emerald)" sub="Legitimate transactions" />
              </motion.div>
              <motion.div variants={iV}>
                <StatBox
                  label="System Status"
                  value={result.summary.fraud > 0 ? 'THREATS' : 'SECURE'}
                  color={result.summary.fraud > 0 ? 'var(--color-accent-red)' : 'var(--color-accent-emerald)'}
                  sub={result.summary.fraud > 0 ? 'Action required' : 'All clear'}
                />
              </motion.div>
            </div>

            {/* Tab Switcher */}
            <motion.div variants={iV} style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(51,65,85,0.3)', alignSelf: 'flex-start' }}>
              {[
                { key: 'analytics', label: 'Analytics', icon: BarChart3 },
                { key: 'table', label: 'Transaction Table', icon: FileText },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 18px', borderRadius: '10px', border: 'none',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    backgroundColor: activeTab === key ? 'rgba(59,130,246,0.12)' : 'transparent',
                    color: activeTab === key ? 'var(--color-accent-blue)' : 'var(--color-text-muted)',
                  }}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </motion.div>

            {/* ─── ANALYTICS TAB ─── */}
            {activeTab === 'analytics' && analytics && (
              <motion.div variants={cV} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Row 1: Probability Distribution + Risk Levels */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  {/* Probability Distribution */}
                  <motion.div variants={iV} className="glass-card" style={{ padding: '20px' }}>
                    <CardHeader icon={BarChart3} iconColor="#F59E0B" title="Probability Distribution" subtitle="Fraud probability score distribution" />
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={analytics.prob_distribution} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.2)" />
                        <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tt} />
                        <Bar dataKey="count" name="Transactions" radius={[6, 6, 0, 0]}>
                          {analytics.prob_distribution.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>

                  {/* Risk Level Distribution */}
                  <motion.div variants={iV} className="glass-card" style={{ padding: '20px' }}>
                    <CardHeader icon={Activity} iconColor="#EF4444" title="Risk Level Distribution" subtitle="Threat classification breakdown" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                      {analytics.risk_levels.map(({ level, count, color }) => {
                        const pct = result.summary.total > 0 ? Math.round((count / result.summary.total) * 100) : 0;
                        return (
                          <div key={level}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{level}</span>
                              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-text-primary)' }}>
                                {count.toLocaleString()} <span style={{ color: 'var(--color-text-muted)' }}>({pct}%)</span>
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                              <motion.div
                                style={{ height: '100%', borderRadius: '999px', backgroundColor: color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(pct, 1)}%` }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>

                {/* Row 2: Detection Pie + Amount Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {/* Detection Pie */}
                  <motion.div variants={iV} className="glass-card" style={{ padding: '20px' }}>
                    <CardHeader icon={Target} iconColor="#6366F1" title="Detection Breakdown" subtitle="Fraud vs legitimate ratio" />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Legitimate', value: result.summary.legit, color: '#10B981' },
                              { name: 'Fraudulent', value: result.summary.fraud, color: '#EF4444' },
                            ].filter(d => d.value > 0)}
                            innerRadius={52} outerRadius={72} paddingAngle={4} dataKey="value" stroke="none"
                          >
                            {[
                              { name: 'Legitimate', value: result.summary.legit, color: '#10B981' },
                              { name: 'Fraudulent', value: result.summary.fraud, color: '#EF4444' },
                            ].filter(d => d.value > 0).map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip contentStyle={tt} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Legit: {result.summary.legit.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Fraud: {result.summary.fraud.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Amount Statistics */}
                  <motion.div variants={iV} className="glass-card" style={{ padding: '20px' }}>
                    <CardHeader icon={DollarSign} iconColor="#06B6D4" title="Amount Analysis" subtitle="Transaction amount breakdown" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {/* Fraud Amounts */}
                      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#EF4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldAlert size={12} /> Fraud Txns
                        </p>
                        {[
                          { l: 'Average', v: `$${analytics.amount_stats.fraud.avg.toLocaleString()}` },
                          { l: 'Min', v: `$${analytics.amount_stats.fraud.min.toLocaleString()}` },
                          { l: 'Max', v: `$${analytics.amount_stats.fraud.max.toLocaleString()}` },
                          { l: 'Total', v: `$${analytics.amount_stats.fraud.total.toLocaleString()}` },
                        ].map(({ l, v }) => (
                          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{l}</span>
                            <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-text-primary)' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                      {/* Legit Amounts */}
                      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#10B981', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={12} /> Legit Txns
                        </p>
                        {[
                          { l: 'Average', v: `$${analytics.amount_stats.legit.avg.toLocaleString()}` },
                          { l: 'Min', v: `$${analytics.amount_stats.legit.min.toLocaleString()}` },
                          { l: 'Max', v: `$${analytics.amount_stats.legit.max.toLocaleString()}` },
                          { l: 'Total', v: `$${analytics.amount_stats.legit.total.toLocaleString()}` },
                        ].map(({ l, v }) => (
                          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{l}</span>
                            <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-text-primary)' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Row 3: Breakdowns - Card Type, Location, Category */}
                <BreakdownChart
                  data={analytics.by_card_type} icon={CreditCard} iconColor="#3B82F6"
                  title="Fraud by Card Type" subtitle="Detection breakdown per card network"
                />
                <BreakdownChart
                  data={analytics.by_location} icon={MapPin} iconColor="#06B6D4"
                  title="Fraud by Location" subtitle="Geographic fraud distribution"
                />
                <BreakdownChart
                  data={analytics.by_category} icon={Tag} iconColor="#F59E0B"
                  title="Fraud by Purchase Category" subtitle="Transaction type analysis"
                />

                {/* Top Fraud Transactions */}
                {analytics.top_fraud_transactions && analytics.top_fraud_transactions.length > 0 && (
                  <motion.div variants={iV} className="glass-card" style={{ padding: '20px' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                      onClick={() => setShowTopFraud(!showTopFraud)}
                    >
                      <CardHeader icon={AlertTriangle} iconColor="#EF4444" title={`Top ${analytics.top_fraud_transactions.length} Highest-Risk Transactions`} subtitle="Most suspicious transactions by fraud probability" />
                      {showTopFraud
                        ? <ChevronUp size={18} style={{ color: 'var(--color-text-muted)' }} />
                        : <ChevronDown size={18} style={{ color: 'var(--color-text-muted)' }} />
                      }
                    </div>
                    {showTopFraud && (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(51,65,85,0.3)' }}>
                              {['#', 'TX ID', 'Amount', 'Card', 'Location', 'Threat Score'].map(h => (
                                <th key={h} style={{ padding: '10px 14px', fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.top_fraud_transactions.map((row, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(51,65,85,0.15)' }}>
                                <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--color-accent-red)', fontWeight: 700 }}>{idx + 1}</td>
                                <td style={{ padding: '10px 14px', fontSize: '12px', fontFamily: 'var(--font-mono, monospace)' }}>{row.id}</td>
                                <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>${row.amount.toFixed(2)}</td>
                                <td style={{ padding: '10px 14px', fontSize: '12px' }}>{row.card_type}</td>
                                <td style={{ padding: '10px 14px', fontSize: '12px' }}>{row.location}</td>
                                <td style={{ padding: '10px 14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(51,65,85,0.3)', borderRadius: '3px', maxWidth: '80px' }}>
                                      <div style={{
                                        height: '100%', borderRadius: '3px', width: `${row.probability * 100}%`,
                                        backgroundColor: '#EF4444',
                                      }} />
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444', fontFamily: 'var(--font-mono, monospace)' }}>
                                      {(row.probability * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ─── TABLE TAB ─── */}
            {activeTab === 'table' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Table Controls */}
                <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Search Transaction ID, Card, Location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px',
                          backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(51,65,85,0.5)',
                          color: 'var(--color-text-primary)', fontSize: '13px'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', border: '1px solid rgba(51,65,85,0.5)', borderRadius: '10px', overflow: 'hidden' }}>
                      {['all', 'fraud', 'legit'].map(f => (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          style={{
                            padding: '0 12px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                            backgroundColor: filter === f ? 'rgba(59,130,246,0.1)' : 'transparent',
                            color: filter === f ? 'var(--color-accent-blue)' : 'var(--color-text-muted)',
                            border: 'none', borderRight: f === 'legit' ? 'none' : '1px solid rgba(51,65,85,0.3)',
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={downloadResults}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                      borderRadius: '10px', backgroundColor: 'var(--color-accent-blue)', color: 'white',
                      fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer'
                    }}
                  >
                    <Download size={16} /> Export CSV
                  </button>
                </div>

                {/* Matching count */}
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Showing {filteredResults.length.toLocaleString()} of {result.results.length.toLocaleString()} transactions
                </p>

                {/* Results Table */}
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(15,23,42,0.98)' }}>
                        <tr style={{ borderBottom: '1px solid rgba(51,65,85,0.3)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                          {['TX ID', 'Amount', 'Card Type', 'Location', 'Category', 'Threat Score', 'Classification'].map(h => (
                            <th key={h} style={{ padding: '14px 16px', fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.length > 0 ? filteredResults.slice(0, 500).map((row, idx) => (
                          <tr
                            key={row.id + idx}
                            style={{ borderBottom: '1px solid rgba(51,65,85,0.1)', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'var(--font-mono, monospace)' }}>{row.id}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600 }}>${row.amount.toFixed(2)}</td>
                            <td style={{ padding: '12px 16px', fontSize: '12px' }}>{row.card_type}</td>
                            <td style={{ padding: '12px 16px', fontSize: '12px' }}>{row.location}</td>
                            <td style={{ padding: '12px 16px', fontSize: '12px' }}>{row.category}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, height: '4px', backgroundColor: 'rgba(51,65,85,0.3)', borderRadius: '2px', maxWidth: '60px' }}>
                                  <div style={{
                                    height: '100%', borderRadius: '2px', width: `${row.probability * 100}%`,
                                    backgroundColor: row.probability > 0.7 ? '#EF4444' : row.probability > 0.4 ? '#F59E0B' : '#10B981'
                                  }} />
                                </div>
                                <span style={{
                                  fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)',
                                  color: row.probability > 0.7 ? '#EF4444' : 'var(--color-text-secondary)'
                                }}>
                                  {(row.probability * 100).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                backgroundColor: row.is_fraud ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                color: row.is_fraud ? '#EF4444' : '#10B981',
                                border: `1px solid ${row.is_fraud ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`
                              }}>
                                {row.is_fraud ? <ShieldAlert size={11} /> : <ShieldCheck size={11} />}
                                {row.is_fraud ? 'SUSPECT' : 'CLEARED'}
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={24} strokeWidth={1} />
                                <p style={{ fontSize: '14px' }}>No transactions match your current search/filter</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
