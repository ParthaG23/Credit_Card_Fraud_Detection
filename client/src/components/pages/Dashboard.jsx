import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import {
  ScanSearch, ShieldCheck, ShieldAlert, Activity,
  TrendingUp, ArrowRight, Zap
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';

const cV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const iV = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } };

const tt = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(51,65,85,0.5)',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#F1F5F9',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  padding: '8px 12px',
};

function StatCard({ title, value, subtitle, icon: Icon, gradient }) {
  return (
    <motion.div variants={iV} className="glass-card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>{title}</p>
          <p style={{ fontSize: 'clamp(1.25rem, 4vw, 1.875rem)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '6px', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '6px', lineHeight: 1.3 }}>{subtitle}</p>
        </div>
        <div className={gradient} style={{
          width: '38px', height: '38px', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon style={{ width: '18px', height: '18px', color: 'white' }} />
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { stats, scanHistory, backendStatus } = useApp();
  const navigate = useNavigate();
  const hasData = scanHistory.length > 0;
  const recentScans = scanHistory.slice(0, 8);

  const timelineData = [...scanHistory].reverse().slice(-20).map((s, i) => ({
    name: `#${i + 1}`,
    probability: Math.round(s.probability * 100),
  }));

  const pieData = [
    { name: 'Legitimate', value: stats.legitimateDetected || 0, color: '#10B981' },
    { name: 'Fraudulent', value: stats.fraudDetected || 0,      color: '#EF4444' },
  ];

  return (
    <motion.div variants={cV} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <motion.div variants={iV} className="page-header">
        <div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>Dashboard</h1>
          <p style={{ fontSize: 'clamp(0.7rem, 2vw, 0.875rem)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Monitor fraud detection activity and model performance
          </p>
        </div>
        <button
          onClick={() => navigate('/scanner')}
          className="btn-primary"
        >
          <ScanSearch style={{ width: '15px', height: '15px' }} />
          New Scan
        </button>
      </motion.div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <StatCard title="Total Scans" value={stats.totalScans} subtitle="Transactions analyzed" icon={Activity} gradient="bg-gradient-to-br from-accent-blue to-blue-600" />
        <StatCard title="Fraud Detected" value={stats.fraudDetected} subtitle={`${stats.detectionRate}% of total`} icon={ShieldAlert} gradient="bg-gradient-to-br from-accent-red to-red-600" />
        <StatCard title="Legitimate" value={stats.legitimateDetected} subtitle="Verified safe" icon={ShieldCheck} gradient="bg-gradient-to-br from-accent-emerald to-emerald-600" />
        <StatCard title="Avg Response" value={`${stats.avgResponseTime}ms`} subtitle="Prediction speed" icon={Zap} gradient="bg-gradient-to-br from-accent-amber to-amber-600" />
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Timeline */}
        <motion.div variants={iV} className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Fraud Probability Timeline</h3>
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Probability scores from recent scans</p>
            </div>
            <TrendingUp style={{ width: '16px', height: '16px', color: 'var(--color-text-muted)', flexShrink: 0 }} />
          </div>
          {hasData ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="probG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} unit="%" width={34} />
                <Tooltip contentStyle={tt} formatter={(v) => [`${v}%`, 'Fraud Probability']} />
                <Area type="monotone" dataKey="probability" stroke="#3B82F6" strokeWidth={2} fill="url(#probG)"
                  dot={{ r: 3, fill: '#3B82F6', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <Activity style={{ width: '40px', height: '40px', color: 'rgba(100,116,139,0.2)', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>No scan data yet</p>
                <p style={{ fontSize: '11px', color: 'rgba(100,116,139,0.6)', marginTop: '2px' }}>Run scans to see the timeline</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Pie Chart */}
        <motion.div variants={iV} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Detection Breakdown</h3>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Fraud vs Legitimate ratio</p>
          </div>
          {hasData ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData.filter(d => d.value > 0)} innerRadius={45} outerRadius={68} paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.filter(d => d.value > 0).map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tt} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {pieData.map(e => (
                  <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: e.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{e.name}: {e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
              <ShieldCheck style={{ width: '40px', height: '40px', color: 'rgba(100,116,139,0.2)' }} />
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Scans */}
      <motion.div variants={iV} className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Recent Scans</h3>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Latest transaction analysis results</p>
          </div>
          {hasData && (
            <button onClick={() => navigate('/analytics')} style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '12px', color: 'var(--color-accent-blue)', fontWeight: 500,
              cursor: 'pointer', background: 'none', border: 'none', flexShrink: 0,
            }}>
              View All <ArrowRight style={{ width: '12px', height: '12px' }} />
            </button>
          )}
        </div>

        {hasData ? (
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
                  {['ID', 'Time', 'Result', 'Probability', 'Risk'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentScans.map(scan => {
                  const prob = Math.round(scan.probability * 100);
                  const risk = prob > 70 ? 'Critical' : prob > 40 ? 'High' : prob > 15 ? 'Medium' : 'Low';
                  const rc = prob > 70 ? 'var(--color-accent-red)' : prob > 40 ? 'var(--color-accent-amber)' : prob > 15 ? 'var(--color-accent-cyan)' : 'var(--color-accent-emerald)';
                  return (
                    <tr key={scan.id} style={{ borderBottom: '1px solid rgba(51,65,85,0.3)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <td style={{ padding: '10px 12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>#{String(scan.id).slice(-6)}</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>{new Date(scan.timestamp).toLocaleTimeString()}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', fontSize: '11px', fontWeight: 600,
                          padding: '2px 8px', borderRadius: '999px',
                          backgroundColor: scan.isFraud ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: scan.isFraud ? 'var(--color-accent-red)' : 'var(--color-accent-emerald)',
                        }}>
                          {scan.isFraud ? 'Fraud' : 'Legit'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{prob}%</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 600, color: rc }}>{risk}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <ScanSearch style={{ width: '44px', height: '44px', color: 'rgba(100,116,139,0.15)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>No scans performed yet</p>
            <button onClick={() => navigate('/scanner')} style={{
              marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', fontSize: '12px', fontWeight: 600,
              color: 'var(--color-accent-blue)', backgroundColor: 'rgba(59,130,246,0.1)',
              borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background 0.2s',
            }}>
              <ScanSearch style={{ width: '14px', height: '14px' }} /> Go to Scanner
            </button>
          </div>
        )}
      </motion.div>

      {/* Model Info */}
      <motion.div variants={iV} className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            backgroundColor: 'rgba(99,102,241,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Zap style={{ width: '16px', height: '16px', color: 'var(--color-accent-indigo)' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Model Information</h3>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Active ML model details</p>
          </div>
        </div>
        <div className="model-grid">
          {[
            { l: 'Algorithm',  v: 'Random Forest' },
            { l: 'Features',   v: '28 (V1–V28)' },
            { l: 'Estimators', v: '50 Trees' },
            { l: 'Status',     v: backendStatus.online ? 'Deployed' : 'Offline' },
          ].map(({ l, v }) => (
            <div key={l} style={{
              background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '12px',
              border: '1px solid rgba(51,65,85,0.3)',
            }}>
              <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '4px' }}>{l}</p>
              <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>{v}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}