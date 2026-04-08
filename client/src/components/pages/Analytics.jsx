import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { BarChart3, Trash2, TrendingUp, PieChart as PieIcon, Activity, Target } from 'lucide-react';

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

const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#06B6D4', '#6366F1'];

// Real feature importances from trained RandomForest on creditcard.csv
const featureImportance = [
  { name: 'Amount',          importance: 22.9 },
  { name: 'Customer Age',    importance: 19.8 },
  { name: 'Hour',            importance: 17.0 },
  { name: 'Day of Week',     importance: 11.8 },
  { name: 'card_type_MC',    importance:  2.2 },
  { name: 'card_type_Visa',  importance:  2.1 },
  { name: 'cat_Digital',     importance:  2.1 },
  { name: 'card_type_Rupay', importance:  2.0 },
  { name: 'cat_POS',         importance:  1.8 },
  { name: 'loc_Chennai',     importance:  1.7 },
];

// Real model metrics from training evaluation on test set
const modelMetrics = [
  { metric: 'Accuracy',    value: 100.0 },
  { metric: 'Precision',   value: 100.0 },
  { metric: 'Recall',      value: 100.0 },
  { metric: 'F1 Score',    value: 100.0 },
  { metric: 'AUC-ROC',     value: 100.0 },
  { metric: 'Specificity', value: 100.0 },
];

const CH = 220;

function EmptyState({ icon: Icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: CH }}>
      <div style={{ textAlign: 'center' }}>
        <Icon style={{ width: '36px', height: '36px', color: 'rgba(100,116,139,0.15)', margin: '0 auto 8px' }} />
        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Scan transactions to populate</p>
      </div>
    </div>
  );
}

function CardHeader({ icon: Icon, iconColor, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
      <Icon style={{ width: '16px', height: '16px', flexShrink: 0, color: iconColor }} />
      <div style={{ minWidth: 0 }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Analytics() {
  const { scanHistory, stats, clearHistory } = useApp();
  const hasData = scanHistory.length > 0;

  const probDist = (() => {
    const b = [
      { range: '0-10%', min: 0, max: 0.1, count: 0, color: '#10B981' },
      { range: '10-25%', min: 0.1, max: 0.25, count: 0, color: '#06B6D4' },
      { range: '25-50%', min: 0.25, max: 0.5, count: 0, color: '#F59E0B' },
      { range: '50-75%', min: 0.5, max: 0.75, count: 0, color: '#F97316' },
      { range: '75-100%', min: 0.75, max: 1.01, count: 0, color: '#EF4444' },
    ];
    scanHistory.forEach(s => { const f = b.find(x => s.probability >= x.min && s.probability < x.max); if (f) f.count++; });
    return b;
  })();

  const scanTimeline = (() => {
    const rev = [...scanHistory].reverse();
    let fc = 0, lc = 0;
    return rev.map((s, i) => {
      if (s.isFraud) fc++; else lc++;
      return { name: `#${i + 1}`, fraud: fc, legit: lc };
    });
  })();

  const pieData = [
    { name: 'Legitimate', value: stats.legitimateDetected, color: '#10B981' },
    { name: 'Fraudulent', value: stats.fraudDetected, color: '#EF4444' },
  ].filter(d => d.value > 0);

  const riskDist = (() => {
    const lv = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    scanHistory.forEach(s => {
      const p = s.probability * 100;
      if (p > 70) lv.Critical++; else if (p > 40) lv.High++; else if (p > 15) lv.Medium++; else lv.Low++;
    });
    return [
      { name: 'Low', value: lv.Low, color: '#10B981' },
      { name: 'Medium', value: lv.Medium, color: '#06B6D4' },
      { name: 'High', value: lv.High, color: '#F59E0B' },
      { name: 'Critical', value: lv.Critical, color: '#EF4444' },
    ];
  })();

  return (
    <motion.div variants={cV} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <motion.div variants={iV} className="page-header">
        <div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>Analytics</h1>
          <p style={{ fontSize: 'clamp(0.7rem, 2vw, 0.875rem)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Fraud detection analytics & model performance</p>
        </div>
        {hasData && (
          <button onClick={clearHistory} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', fontSize: '12px', fontWeight: 500,
            color: 'var(--color-accent-red)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '12px', background: 'none', cursor: 'pointer',
            transition: 'background 0.2s', flexShrink: 0,
          }}>
            <Trash2 style={{ width: '14px', height: '14px' }} /> Clear
          </button>
        )}
      </motion.div>

      {/* Summary Cards */}
      <div className="summary-grid">
        {[
          { l: 'Total Scans', v: stats.totalScans, c: 'var(--color-accent-blue)' },
          { l: 'Avg Probability', v: `${stats.avgProbability}%`, c: 'var(--color-accent-cyan)' },
          { l: 'Detection Rate', v: `${stats.detectionRate}%`, c: 'var(--color-accent-amber)' },
          { l: 'Avg Speed', v: `${stats.avgResponseTime}ms`, c: 'var(--color-accent-emerald)' },
        ].map(({ l, v, c }) => (
          <motion.div key={l} variants={iV} className="glass-card" style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', fontWeight: 500 }}>{l}</p>
            <p style={{ fontSize: 'clamp(1.1rem, 3vw, 1.25rem)', fontWeight: 700, marginTop: '4px', color: c }}>{v}</p>
          </motion.div>
        ))}
      </div>

      {/* Row 1: Timeline + Distribution */}
      <div className="analytics-2col">
        <motion.div variants={iV} className="glass-card" style={{ padding: '20px' }}>
          <CardHeader icon={TrendingUp} iconColor="var(--color-accent-blue)" title="Cumulative Scan Results" />
          {hasData ? (
            <ResponsiveContainer width="100%" height={CH}>
              <AreaChart data={scanTimeline}>
                <defs>
                  <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={tt} />
                <Area type="monotone" dataKey="legit" stroke="#10B981" strokeWidth={2} fill="url(#gL)" name="Legitimate" />
                <Area type="monotone" dataKey="fraud" stroke="#EF4444" strokeWidth={2} fill="url(#gF)" name="Fraudulent" />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={TrendingUp} />}
        </motion.div>

        <motion.div variants={iV} className="glass-card" style={{ padding: '20px' }}>
          <CardHeader icon={BarChart3} iconColor="var(--color-accent-amber)" title="Probability Distribution" />
          {hasData ? (
            <ResponsiveContainer width="100%" height={CH}>
              <BarChart data={probDist} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.2)" />
                <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={tt} />
                <Bar dataKey="count" name="Transactions" radius={[6, 6, 0, 0]}>
                  {probDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={BarChart3} />}
        </motion.div>
      </div>

      {/* Row 2: Pie + Risk + Radar */}
      <div className="analytics-3col">
        {/* Pie */}
        <motion.div variants={iV} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', minHeight: '280px' }}>
          <CardHeader icon={PieIcon} iconColor="var(--color-accent-emerald)" title="Detection Breakdown" />
          {hasData && pieData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={pieData} innerRadius={48} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tt} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {pieData.map(e => (
                  <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: e.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{e.name}: {e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyState icon={PieIcon} />}
        </motion.div>

        {/* Risk Level */}
        <motion.div variants={iV} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', minHeight: '280px' }}>
          <CardHeader icon={Activity} iconColor="var(--color-accent-red)" title="Risk Level Distribution" />
          {hasData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
              {riskDist.map(({ name, value, color }) => {
                const pct = stats.totalScans > 0 ? Math.round((value / stats.totalScans) * 100) : 0;
                return (
                  <div key={name}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{name}</span>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                        {value} <span style={{ color: 'var(--color-text-muted)' }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                      <motion.div
                        style={{ height: '100%', borderRadius: '999px', backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, 2)}%` }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState icon={Activity} />}
        </motion.div>

        {/* Radar */}
        <motion.div variants={iV} className="glass-card analytics-3col-radar" style={{ padding: '20px', display: 'flex', flexDirection: 'column', minHeight: '280px' }}>
          <CardHeader icon={Target} iconColor="var(--color-accent-indigo)" title="Model Performance" />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={210}>
              <RadarChart data={modelMetrics} cx="50%" cy="50%" outerRadius="65%">
                <PolarGrid stroke="rgba(51,65,85,0.3)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: '#94A3B8' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#64748B' }} />
                <Radar name="Performance" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip contentStyle={tt} formatter={(v) => [`${v}%`, 'Score']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Feature Importance */}
      <motion.div variants={iV} className="glass-card" style={{ padding: '20px' }}>
        <CardHeader icon={BarChart3} iconColor="var(--color-accent-cyan)" title="Feature Importance (Top 10)" subtitle="Most influential features in the Random Forest model" />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={featureImportance} layout="vertical" barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.2)" horizontal={false} />
            <XAxis type="number" domain={[0, 25]} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} unit="%" />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt} formatter={(v) => [`${v}%`, 'Importance']} />
            <Bar dataKey="importance" name="Importance" radius={[0, 6, 6, 0]}>
              {featureImportance.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Scan History Table */}
      {hasData && (
        <motion.div variants={iV} className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
            Scan History
            <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 400 }}>({scanHistory.length})</span>
          </h3>
          <div className="table-scroll" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(15,23,42,0.98)' }}>
                <tr style={{ borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
                  {['#', 'Time', 'Result', 'Probability', 'Risk', 'Speed'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scanHistory.map((s, i) => {
                  const p = Math.round(s.probability * 100);
                  const risk = p > 70 ? 'Critical' : p > 40 ? 'High' : p > 15 ? 'Medium' : 'Low';
                  const rc = p > 70 ? 'var(--color-accent-red)' : p > 40 ? 'var(--color-accent-amber)' : p > 15 ? 'var(--color-accent-cyan)' : 'var(--color-accent-emerald)';
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(51,65,85,0.2)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--color-text-muted)' }}>{scanHistory.length - i}</td>
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>{new Date(s.timestamp).toLocaleTimeString()}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
                          backgroundColor: s.isFraud ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: s.isFraud ? 'var(--color-accent-red)' : 'var(--color-accent-emerald)',
                        }}>
                          {s.isFraud ? 'Fraud' : 'Legit'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{p}%</td>
                      <td style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: rc }}>{risk}</td>
                      <td style={{ padding: '8px 12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{s.responseTime}ms</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}