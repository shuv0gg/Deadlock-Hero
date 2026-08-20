import { motion } from 'framer-motion';
import { useState } from 'react';

// ─── Animated Card ──────────────────────────────────────────────────────────
export function Card({ children, className = '', glow = '', delay = 0, hover = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={`glass rounded-2xl p-6 ${glow} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, color = 'primary', delay = 0 }) {
  const colors = {
    primary: 'from-primary/20 to-primary/5 text-primary-light border-primary/30',
    success: 'from-success/20 to-success/5 text-success border-success/30',
    warning: 'from-warning/20 to-warning/5 text-warning border-warning/30',
    danger: 'from-danger/20 to-danger/5 text-danger border-danger/30',
    secondary: 'from-secondary/20 to-secondary/5 text-secondary border-secondary/30',
  };

  return (
    <Card delay={delay} className={`bg-gradient-to-br ${colors[color]} border relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
        <Icon className="w-20 h-20 -mt-4 -mr-4" />
      </div>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <p className="text-sm text-text-muted mt-1">{label}</p>
    </Card>
  );
}

// ─── Badge ──────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'primary', size = 'md', pulse = false, className = '', ...props }) {
  const colors = {
    primary: 'bg-primary/20 text-primary-light border-primary/30',
    success: 'bg-success/20 text-success border-success/30',
    warning: 'bg-warning/20 text-warning border-warning/30',
    danger: 'bg-danger/20 text-danger border-danger/30',
    secondary: 'bg-secondary/20 text-secondary border-secondary/30',
  };
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base font-semibold',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colors[color]} ${sizes[size]} ${pulse ? 'pulse-glow' : ''} ${className}`} {...props}>
      {pulse && <span className={`w-2 h-2 rounded-full bg-current`} />}
      {children}
    </span>
  );
}

// ─── Button ─────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', loading = false, className = '', ...props }) {
  const variants = {
    primary: 'bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white shadow-lg shadow-primary/25',
    secondary: 'bg-surface-light/50 hover:bg-surface-light text-text border border-border',
    success: 'bg-gradient-to-r from-success to-emerald-600 hover:from-emerald-400 hover:to-success text-white shadow-lg shadow-success/25',
    danger: 'bg-gradient-to-r from-danger to-red-600 hover:from-red-400 hover:to-danger text-white shadow-lg shadow-danger/25',
    ghost: 'hover:bg-white/5 text-text-muted hover:text-white',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-xl font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </motion.button>
  );
}

// ─── Progress Bar ───────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'primary', label = '', showPercent = true }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const barColors = {
    primary: 'from-primary to-primary-light',
    success: 'from-success to-emerald-400',
    warning: 'from-warning to-amber-400',
    danger: 'from-danger to-red-400',
    secondary: 'from-secondary to-cyan-400',
  };
  const dynamicColor = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : color;

  return (
    <div className="space-y-1">
      {(label || showPercent) && (
        <div className="flex justify-between text-xs text-text-muted">
          <span>{label}</span>
          {showPercent && <span className="font-mono">{pct}%</span>}
        </div>
      )}
      <div className="h-2 bg-surface-light/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${barColors[dynamicColor]} rounded-full`}
        />
      </div>
    </div>
  );
}

// ─── Tooltip ────────────────────────────────────────────────────────────────
export function Tooltip({ children, text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text whitespace-nowrap z-50 shadow-xl"
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-surface border-r border-b border-border rotate-45" />
        </motion.div>
      )}
    </span>
  );
}

// ─── Matrix Input Component ─────────────────────────────────────────────────
export function MatrixInput({ label, rows, cols, value, onChange, processLabels, resourceLabels, readOnly = false }) {
  const handleChange = (i, j, val) => {
    if (readOnly) return;
    const newMatrix = value.map(row => [...row]);
    newMatrix[i][j] = val;
    onChange(newMatrix);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-text">{label}</h4>
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="px-2 py-1 text-xs text-text-muted"></th>
              {Array.from({ length: cols }, (_, j) => (
                <th key={j} className="px-2 py-1 text-xs text-primary-light font-mono">
                  {resourceLabels?.[j] ?? `R${j}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, i) => (
              <tr key={i}>
                <td className="px-2 py-1 text-xs text-accent font-mono font-semibold">
                  {processLabels?.[i] ?? `P${i}`}
                </td>
                {Array.from({ length: cols }, (_, j) => (
                  <td key={j} className="px-1 py-1">
                    <input
                      type="number"
                      min="0"
                      value={value?.[i]?.[j] ?? ''}
                      onChange={e => handleChange(i, j, e.target.value)}
                      readOnly={readOnly}
                      className={`w-14 h-9 text-center text-sm font-mono border rounded-lg focus:ring-1 outline-none transition-all ${
                        readOnly
                          ? 'bg-surface-light/10 border-border/50 text-text-muted cursor-not-allowed focus:ring-0 focus:border-border/50'
                          : 'bg-surface-light/40 border-border text-text focus:border-primary focus:ring-primary/50'
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Section Title ──────────────────────────────────────────────────────────
export function SectionTitle({ icon: Icon, title, subtitle, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex items-center gap-3 mb-6"
    >
      {Icon && (
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
          <Icon className="w-5 h-5 text-primary-light" />
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="p-4 rounded-2xl bg-surface-light/30 mb-4">
        <Icon className="w-12 h-12 text-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-text-muted mb-2">{title}</h3>
      <p className="text-sm text-text-muted/70 max-w-md">{description}</p>
    </motion.div>
  );
}

// ─── Tab Component ──────────────────────────────────────────────────────────
export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-surface-light/30 rounded-xl border border-border">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === tab.id
              ? 'text-white'
              : 'text-text-muted hover:text-white'
          }`}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="tabIndicator"
              className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/20 border border-primary/30 rounded-lg"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
