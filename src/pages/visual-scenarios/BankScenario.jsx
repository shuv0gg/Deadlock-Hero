import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineExclamation, HiOutlinePlay, HiOutlinePause, HiOutlineRefresh } from 'react-icons/hi';
import { MdSkipNext } from 'react-icons/md';

const STEPS = [
  { desc: 'System initialized. Accounts A and B are unlocked.', locks: {}, waiting: {}, blocked: [] },
  { desc: 'Transaction T1 starts — locks Account A to debit $500.', locks: { 'Account A': 'T1' }, waiting: {}, blocked: [] },
  { desc: 'Transaction T2 starts — locks Account B to debit $300.', locks: { 'Account A': 'T1', 'Account B': 'T2' }, waiting: {}, blocked: [] },
  { desc: 'T1 now needs to credit Account B — but T2 holds the lock. T1 waits.', locks: { 'Account A': 'T1', 'Account B': 'T2' }, waiting: { 'T1': 'Account B' }, blocked: [] },
  { desc: 'T2 now needs to credit Account A — but T1 holds the lock. T2 waits.', locks: { 'Account A': 'T1', 'Account B': 'T2' }, waiting: { 'T1': 'Account B', 'T2': 'Account A' }, blocked: [] },
  { desc: '🔴 DEADLOCK! T1 ⇄ T2 are blocked in a circular lock dependency. No transaction can proceed.', locks: { 'Account A': 'T1', 'Account B': 'T2' }, waiting: { 'T1': 'Account B', 'T2': 'Account A' }, blocked: ['T1', 'T2'], deadlock: true },
];

export default function BankScenario({ speed = 1 }) {
  const [stepIndex, setStepIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [showDeadlock, setShowDeadlock] = useState(false);
  const [activeTab, setActiveTab] = useState('without');
  const intervalRef = useRef(null);
  const current = stepIndex >= 0 ? STEPS[Math.min(stepIndex, STEPS.length - 1)] : null;

  const tick = useCallback(() => {
    setStepIndex(prev => {
      const next = prev + 1;
      if (next >= STEPS.length) { setPlaying(false); return prev; }
      if (STEPS[next]?.deadlock) setShowDeadlock(true);
      return next;
    });
  }, []);

  useEffect(() => {
    if (playing) intervalRef.current = setInterval(tick, 1800 / speed);
    else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, tick]);

  const reset = () => { setPlaying(false); setStepIndex(-1); setShowDeadlock(false); clearInterval(intervalRef.current); };
  const stepForward = () => {
    if (stepIndex < STEPS.length - 1) {
      const next = stepIndex + 1;
      setStepIndex(next);
      if (STEPS[next]?.deadlock) setShowDeadlock(true);
    }
  };

  const isDeadlocked = current?.deadlock;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={() => setPlaying(p => !p)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${playing ? 'bg-warning/20 text-warning border border-warning/40' : 'bg-primary/20 text-primary-light border border-primary/30 hover:bg-primary/30'}`}>
          {playing ? <HiOutlinePause className="w-4 h-4" /> : <HiOutlinePlay className="w-4 h-4" />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={stepForward} disabled={stepIndex >= STEPS.length - 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30 disabled:opacity-40 transition-all">
          <MdSkipNext className="w-4 h-4" /> Step
        </button>
        <button onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-surface-light/50 text-text-muted border border-border hover:text-white transition-all">
          <HiOutlineRefresh className="w-4 h-4" /> Reset
        </button>
        <div className="flex items-center gap-2 ml-auto text-sm text-text-muted">
          <span>Speed:</span>
          <input type="range" min="0.5" max="3" step="0.5" defaultValue="1" className="w-24 accent-primary" />
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isDeadlocked ? 'bg-danger/20 text-danger border-danger/40 pulse-glow' : stepIndex >= 0 ? 'bg-success/20 text-success border-success/40' : 'bg-surface-light/50 text-text-muted border-border'}`}>
          {isDeadlocked ? '🔴 DEADLOCK' : stepIndex >= 0 ? '🟢 Running' : '⚪ Ready'}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {current && (
          <motion.div key={stepIndex} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-4 rounded-xl border text-sm font-medium ${isDeadlocked ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-primary/10 border-primary/30 text-primary-light'}`}>
            {current.desc}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main visual */}
      <div className="glass rounded-2xl p-6">
        <h4 className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-6">Bank Transaction Simulation</h4>
        <div className="flex flex-col md:flex-row items-center justify-around gap-6">
          {/* T1 */}
          {['T1', 'T2'].map((tx, i) => {
            const blocked = current?.blocked?.includes(tx);
            const waiting = current?.waiting?.[tx];
            const lockedAccount = Object.entries(current?.locks || {}).find(([, t]) => t === tx)?.[0];
            return (
              <motion.div key={tx} animate={{ scale: blocked ? [1, 1.03, 1] : 1 }}
                transition={{ repeat: blocked ? Infinity : 0, duration: 1.2 }}
                className={`w-52 p-5 rounded-2xl border text-center transition-all ${blocked ? 'border-danger/50 bg-danger/10' : 'border-border bg-surface-light/20'}`}>
                <div className="text-3xl mb-2">{i === 0 ? '💳' : '🏦'}</div>
                <div className="font-bold text-white text-lg">{tx}</div>
                <div className="text-xs text-text-muted mb-3">Transaction {i + 1}</div>
                {lockedAccount && (
                  <div className="text-xs bg-success/20 text-success px-2 py-1 rounded-lg border border-success/30 mb-2">
                    🔒 Holds: {lockedAccount}
                  </div>
                )}
                {waiting && (
                  <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                    className="text-xs bg-warning/20 text-warning px-2 py-1 rounded-lg border border-warning/30">
                    ⏳ Waiting: {waiting}
                  </motion.div>
                )}
                {blocked && (
                  <div className="text-xs bg-danger/20 text-danger px-2 py-1 rounded-lg border border-danger/30 mt-2 pulse-glow">
                    ❌ Blocked
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Accounts in the middle */}
        <div className="flex justify-center gap-8 mt-8">
          {['Account A', 'Account B'].map(acc => {
            const holder = current?.locks?.[acc];
            const inDeadlock = isDeadlocked && holder;
            return (
              <div key={acc} className={`p-4 rounded-xl border text-center w-36 transition-all ${inDeadlock ? 'border-danger/50 bg-danger/10' : holder ? 'border-warning/40 bg-warning/5' : 'border-border bg-surface-light/20'}`}>
                <div className="text-2xl mb-1">🏛️</div>
                <div className="text-sm font-semibold text-white">{acc}</div>
                <div className={`text-xs mt-1 ${holder ? (inDeadlock ? 'text-danger' : 'text-warning') : 'text-success'}`}>
                  {holder ? `Locked by ${holder}` : 'Free'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Deadlock arrow visualization */}
        {isDeadlocked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger font-semibold">
              T1 → waits for Account B ← held by T2 → waits for Account A ← held by T1
            </div>
          </motion.div>
        )}
      </div>

      {/* RAG */}
      <div className="glass rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-white mb-4">Resource Allocation Graph</h4>
        <svg viewBox="0 0 500 180" className="w-full h-36">
          <circle cx={100} cy={90} r={35} fill={current?.blocked?.includes('T1') ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.25)'} stroke={current?.blocked?.includes('T1') ? '#ef4444' : '#6366f1'} strokeWidth={2} />
          <text x={100} y={94} textAnchor="middle" fill="white" fontSize="13" fontWeight="700">T1</text>
          <circle cx={400} cy={90} r={35} fill={current?.blocked?.includes('T2') ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.25)'} stroke={current?.blocked?.includes('T2') ? '#ef4444' : '#6366f1'} strokeWidth={2} />
          <text x={400} y={94} textAnchor="middle" fill="white" fontSize="13" fontWeight="700">T2</text>
          <rect x={195} y={30} width={60} height={40} rx={6} fill={isDeadlocked ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'} stroke={isDeadlocked ? '#ef4444' : '#10b981'} strokeWidth={2} />
          <text x={225} y={55} textAnchor="middle" fill="white" fontSize="9" fontWeight="600">Acct A</text>
          <rect x={195} y={110} width={60} height={40} rx={6} fill={isDeadlocked ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'} stroke={isDeadlocked ? '#ef4444' : '#10b981'} strokeWidth={2} />
          <text x={225} y={135} textAnchor="middle" fill="white" fontSize="9" fontWeight="600">Acct B</text>
          {current?.locks?.['Account A'] === 'T1' && <line x1={195} y1={50} x2={133} y2={72} stroke={isDeadlocked ? '#ef4444' : '#94a3b8'} strokeWidth={2} />}
          {current?.locks?.['Account B'] === 'T2' && <line x1={255} y1={130} x2={367} y2={108} stroke={isDeadlocked ? '#ef4444' : '#94a3b8'} strokeWidth={2} />}
          {current?.waiting?.['T1'] === 'Account B' && <path d="M133,108 Q180,125 195,130" fill="none" stroke={isDeadlocked ? '#ef4444' : '#f97316'} strokeWidth={2} strokeDasharray={isDeadlocked ? '0' : '5,3'} />}
          {current?.waiting?.['T2'] === 'Account A' && <path d="M367,72 Q300,55 255,50" fill="none" stroke={isDeadlocked ? '#ef4444' : '#f97316'} strokeWidth={2} strokeDasharray={isDeadlocked ? '0' : '5,3'} />}
          <defs>
            <marker id="bankArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8" />
            </marker>
          </defs>
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Running', value: current ? Object.keys(current.locks || {}).length - (current.blocked?.length || 0) : 0, color: 'text-success' },
          { label: 'Locked Accounts', value: current ? Object.keys(current.locks || {}).length : 0, color: 'text-primary-light' },
          { label: 'Waiting', value: current ? Object.keys(current.waiting || {}).length : 0, color: 'text-warning' },
          { label: 'Blocked', value: current?.blocked?.length || 0, color: 'text-danger' },
        ].map(s => (
          <div key={s.label} className="glass-light rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-text-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Prevention Tabs */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex gap-1 p-1 bg-surface-light/30 rounded-xl border border-border">
          {['without', 'with'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === t ? 'bg-gradient-to-r from-primary/30 to-accent/20 border border-primary/30 text-white' : 'text-text-muted hover:text-white'}`}>
              {t === 'without' ? 'Without Prevention' : 'With Prevention'}
            </button>
          ))}
        </div>
        {activeTab === 'without' ? (
          <p className="text-sm text-text-muted">❌ No lock ordering — T1 locks Account A, T2 locks Account B. Circular wait leads to permanent deadlock.</p>
        ) : (
          <div className="text-sm text-text-muted space-y-2">
            <p className="text-success font-semibold">✅ Prevention via Lock Ordering:</p>
            <p>→ Always acquire locks in alphabetical order: Account A → Account B. T2 must wait for Account A first, preventing circular dependency.</p>
            <p>→ Alternatively, use <span className="text-primary-light">two-phase locking (2PL)</span> or detect cycles and roll back one transaction.</p>
          </div>
        )}
      </div>

      {/* Education panel */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-white">📚 Educational Explanation</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text-muted">
          <div><p className="text-primary-light font-semibold mb-2">Why deadlock occurred?</p>
            <p>T1 holds Account A and waits for B; T2 holds Account B and waits for A. This creates a circular dependency that neither can break on its own.</p></div>
          <div><p className="text-primary-light font-semibold mb-2">Coffman Conditions:</p>
            {['Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'Circular Wait'].map(c => (
              <div key={c} className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded-full bg-danger/30 text-danger text-xs flex items-center justify-center">✗</span>{c}</div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDeadlock && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeadlock(false)}>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-surface border-2 border-danger/60 rounded-2xl p-8 max-w-md mx-4 text-center glow-danger"
              onClick={e => e.stopPropagation()}>
              <motion.div animate={{ rotate: [0, -10, 10, -10, 10, 0] }} transition={{ duration: 0.5, delay: 0.2 }}>
                <HiOutlineExclamation className="w-16 h-16 text-danger mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold text-danger mb-2">⚠️ Deadlock Detected!</h3>
              <p className="text-text-muted text-sm mb-4">T1 holds Account A → waits for Account B<br />T2 holds Account B → waits for Account A<br /><span className="text-danger font-semibold">Circular Lock = Bank System Deadlock!</span></p>
              <button onClick={() => setShowDeadlock(false)}
                className="px-6 py-2.5 bg-danger/20 hover:bg-danger/30 text-danger border border-danger/40 rounded-xl font-semibold text-sm transition-all">Dismiss</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
