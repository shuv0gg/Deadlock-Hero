import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineExclamation, HiOutlinePlay, HiOutlinePause, HiOutlineRefresh } from 'react-icons/hi';
import { MdSkipNext } from 'react-icons/md';

const RESOURCES = ['Doctor', 'MRI Machine', 'ICU Bed', 'Ventilator'];
const PATIENTS = ['Patient A', 'Patient B', 'Patient C'];
const RESOURCE_ICONS = { 'Doctor': '👨‍╴', 'MRI Machine': '🔬', 'ICU Bed': '🛏️', 'Ventilator': '💨' };
const PATIENT_ICONS = ['🧑‍🤝‍🧑', '👩', '👦'];

// Steps of the simulation
const STEPS = [
  { desc: 'Patient A arrives and requests ICU Bed.', allocated: { 'Patient A': ['ICU Bed'] }, waiting: {}, blocked: [] },
  { desc: 'Patient B arrives and requests MRI Machine.', allocated: { 'Patient A': ['ICU Bed'], 'Patient B': ['MRI Machine'] }, waiting: {}, blocked: [] },
  { desc: 'Patient A now requests MRI Machine — but it is held by Patient B.', allocated: { 'Patient A': ['ICU Bed'], 'Patient B': ['MRI Machine'] }, waiting: { 'Patient A': 'MRI Machine' }, blocked: [] },
  { desc: 'Patient B now requests ICU Bed — but it is held by Patient A.', allocated: { 'Patient A': ['ICU Bed'], 'Patient B': ['MRI Machine'] }, waiting: { 'Patient A': 'MRI Machine', 'Patient B': 'ICU Bed' }, blocked: [] },
  { desc: '🔴 DEADLOCK! Patient A holds ICU Bed waiting for MRI. Patient B holds MRI waiting for ICU Bed. Circular wait!', allocated: { 'Patient A': ['ICU Bed'], 'Patient B': ['MRI Machine'] }, waiting: { 'Patient A': 'MRI Machine', 'Patient B': 'ICU Bed' }, blocked: ['Patient A', 'Patient B'], deadlock: true },
];

const COFFMAN = {
  'Mutual Exclusion': true,
  'Hold and Wait': true,
  'No Preemption': true,
  'Circular Wait': true,
};

const PREVENTION = [
  'Use resource ordering: always request resources in a fixed global order (ICU Bed < MRI < Doctor).',
  'Apply the Banker\'s Algorithm to ensure the system stays in a safe state before granting resources.',
  'Allow preemption: forcibly release ICU Bed from Patient A and re-assign to Patient B.',
];

export default function HospitalScenario({ speed = 1 }) {
  const [stepIndex, setStepIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [showDeadlock, setShowDeadlock] = useState(false);
  const [activeTab, setActiveTab] = useState('without');
  const intervalRef = useRef(null);

  const currentStep = stepIndex >= 0 ? STEPS[Math.min(stepIndex, STEPS.length - 1)] : null;

  const tick = useCallback(() => {
    setStepIndex(prev => {
      const next = prev + 1;
      if (next >= STEPS.length) {
        setPlaying(false);
        return prev;
      }
      if (STEPS[next]?.deadlock) setShowDeadlock(true);
      return next;
    });
  }, []);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(tick, 1800 / speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, tick]);

  const reset = () => {
    setPlaying(false);
    setStepIndex(-1);
    setShowDeadlock(false);
    clearInterval(intervalRef.current);
  };

  const stepForward = () => {
    if (stepIndex < STEPS.length - 1) {
      const next = stepIndex + 1;
      setStepIndex(next);
      if (STEPS[next]?.deadlock) setShowDeadlock(true);
    }
  };

  const isDeadlocked = currentStep?.deadlock;

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
          <input type="range" min="0.5" max="3" step="0.5" defaultValue="1"
            className="w-24 accent-primary" />
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isDeadlocked ? 'bg-danger/20 text-danger border-danger/40 pulse-glow' : stepIndex >= 0 ? 'bg-success/20 text-success border-success/40' : 'bg-surface-light/50 text-text-muted border-border'}`}>
          {isDeadlocked ? '🔴 DEADLOCK' : stepIndex >= 0 ? '🟢 Running' : '⚪ Ready'}
        </span>
      </div>

      {/* Step Description */}
      <AnimatePresence mode="wait">
        {currentStep && (
          <motion.div key={stepIndex}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-4 rounded-xl border text-sm font-medium ${isDeadlocked ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-primary/10 border-primary/30 text-primary-light'}`}>
            {currentStep.desc}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patients column */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <h4 className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-4">Processes (Patients)</h4>
          {PATIENTS.slice(0, 2).map((p, i) => {
            const held = currentStep?.allocated?.[p] || [];
            const waiting = currentStep?.waiting?.[p];
            const blocked = currentStep?.blocked?.includes(p);
            return (
              <motion.div key={p} animate={{ scale: blocked ? [1, 1.03, 1] : 1 }}
                transition={{ repeat: blocked ? Infinity : 0, duration: 1.2 }}
                className={`p-4 rounded-xl border transition-all ${blocked ? 'border-danger/50 bg-danger/10' : held.length ? 'border-success/40 bg-success/5' : 'border-border bg-surface-light/20'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{PATIENT_ICONS[i]}</span>
                  <span className="font-semibold text-white">{p}</span>
                  {blocked && <span className="ml-auto text-xs bg-danger/20 text-danger px-2 py-0.5 rounded-full border border-danger/30">Blocked</span>}
                </div>
                {held.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-text-muted">Holds:</span>
                    {held.map(r => <span key={r} className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full border border-success/30">{r}</span>)}
                  </div>
                )}
                {waiting && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-text-muted">Waiting for:</span>
                    <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full border border-warning/30 pulse-glow">{waiting}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Resources column */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <h4 className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-4">Resources</h4>
          {RESOURCES.slice(0, 4).map(r => {
            const holder = Object.entries(currentStep?.allocated || {}).find(([, res]) => res.includes(r))?.[0];
            const requester = Object.entries(currentStep?.waiting || {}).find(([, res]) => res === r)?.[0];
            const inDeadlock = isDeadlocked && (holder || requester);
            return (
              <div key={r} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${inDeadlock ? 'border-danger/50 bg-danger/10' : holder ? 'border-warning/40 bg-warning/5' : 'border-border bg-surface-light/20'}`}>
                <span className="text-xl">{RESOURCE_ICONS[r]}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-white">{r}</span>
                  {holder && <div className="text-xs text-warning mt-0.5">Held by {holder}</div>}
                  {requester && <div className="text-xs text-orange-400 mt-0.5">Requested by {requester}</div>}
                  {!holder && !requester && <div className="text-xs text-success mt-0.5">Available</div>}
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${inDeadlock ? 'bg-danger pulse-glow' : holder ? 'bg-warning' : 'bg-success'}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* RAG */}
      <div className="glass rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-white mb-4">Resource Allocation Graph (RAG)</h4>
        <svg viewBox="0 0 500 180" className="w-full h-36">
          {/* Process nodes */}
          {['Patient A', 'Patient B'].map((p, i) => {
            const blocked = currentStep?.blocked?.includes(p);
            return (
              <g key={p}>
                <circle cx={80 + i * 340} cy={90} r={32}
                  fill={blocked ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.25)'}
                  stroke={blocked ? '#ef4444' : '#6366f1'} strokeWidth={blocked ? 2.5 : 1.5} />
                <text x={80 + i * 340} y={86} textAnchor="middle" fill="white" fontSize="11" fontWeight="600">{p.split(' ')[0]}</text>
                <text x={80 + i * 340} y={100} textAnchor="middle" fill="#94a3b8" fontSize="10">{p.split(' ')[1]}</text>
              </g>
            );
          })}
          {/* Resource nodes */}
          {['ICU Bed', 'MRI Machine'].map((r, i) => {
            const inDeadlock = isDeadlocked;
            return (
              <g key={r}>
                <rect x={200 + i * 70 - 30} y={60} width={60} height={60} rx={8}
                  fill={inDeadlock ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}
                  stroke={inDeadlock ? '#ef4444' : '#10b981'} strokeWidth={inDeadlock ? 2.5 : 1.5} />
                <text x={200 + i * 70} y={88} textAnchor="middle" fill="white" fontSize="9" fontWeight="600">{r.split(' ')[0]}</text>
                <text x={200 + i * 70} y={100} textAnchor="middle" fill="#94a3b8" fontSize="9">{r.split(' ')[1]}</text>
              </g>
            );
          })}
          {/* Allocation edges (black/gray) */}
          {currentStep?.allocated?.['Patient A']?.includes('ICU Bed') && (
            <line x1={230} y1={90} x2={112} y2={90} stroke={isDeadlocked ? '#ef4444' : '#94a3b8'} strokeWidth={2} markerEnd="url(#arrowBlack)" />
          )}
          {currentStep?.allocated?.['Patient B']?.includes('MRI Machine') && (
            <line x1={270} y1={90} x2={388} y2={90} stroke={isDeadlocked ? '#ef4444' : '#94a3b8'} strokeWidth={2} markerEnd="url(#arrowBlack)" />
          )}
          {/* Request edges (orange) */}
          {currentStep?.waiting?.['Patient A'] === 'MRI Machine' && (
            <path d="M112,72 Q250,30 268,68" fill="none" stroke={isDeadlocked ? '#ef4444' : '#f97316'} strokeWidth={2} strokeDasharray={isDeadlocked ? '0' : '5,3'} markerEnd="url(#arrowOrange)" />
          )}
          {currentStep?.waiting?.['Patient B'] === 'ICU Bed' && (
            <path d="M388,108 Q250,150 232,112" fill="none" stroke={isDeadlocked ? '#ef4444' : '#f97316'} strokeWidth={2} strokeDasharray={isDeadlocked ? '0' : '5,3'} markerEnd="url(#arrowOrange)" />
          )}
          <defs>
            <marker id="arrowBlack" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8" />
            </marker>
            <marker id="arrowOrange" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill={isDeadlocked ? '#ef4444' : '#f97316'} />
            </marker>
          </defs>
        </svg>
        <div className="flex flex-wrap gap-4 mt-2 text-xs text-text-muted">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary/60 border border-primary inline-block" /> Process</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success/60 border border-success inline-block" /> Resource</span>
          <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 bg-orange-400 inline-block" /> Request</span>
          <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 bg-text-muted inline-block" /> Allocation</span>
          {isDeadlocked && <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 bg-danger inline-block pulse-glow" /> Deadlock Cycle</span>}
        </div>
      </div>

      {/* Real-time stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Running', value: currentStep ? Object.keys(currentStep.allocated || {}).length - (currentStep.blocked?.length || 0) : 0, color: 'text-success' },
          { label: 'Allocated Resources', value: currentStep ? Object.values(currentStep.allocated || {}).flat().length : 0, color: 'text-primary-light' },
          { label: 'Waiting', value: currentStep ? Object.keys(currentStep.waiting || {}).length : 0, color: 'text-warning' },
          { label: 'Blocked', value: currentStep?.blocked?.length || 0, color: 'text-danger' },
        ].map(s => (
          <div key={s.label} className="glass-light rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-text-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Prevention Comparison Tabs */}
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
          <div className="space-y-2 text-sm text-text-muted">
            <p className="text-danger font-semibold">❌ No prevention applied — Deadlock occurs</p>
            <p>Patients request resources in arbitrary order. Patient A holds ICU Bed, Patient B holds MRI Machine, and both wait indefinitely for each other's resource.</p>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p className="text-success font-semibold">✅ Prevention strategies available:</p>
            {PREVENTION.map((p, i) => <p key={i} className="text-text-muted flex gap-2"><span className="text-success mt-0.5">→</span>{p}</p>)}
          </div>
        )}
      </div>

      {/* Education Panel */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-white">📚 Educational Explanation</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-text-muted font-semibold text-primary-light">What is happening?</p>
            <p className="text-text-muted">Patient A has secured the ICU Bed and is waiting for the MRI Machine. Patient B has secured the MRI Machine and is waiting for the ICU Bed. Neither can proceed — a circular dependency.</p>
          </div>
          <div className="space-y-2">
            <p className="text-primary-light font-semibold">Coffman Conditions Satisfied:</p>
            {Object.entries(COFFMAN).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${v ? 'bg-danger/30 text-danger' : 'bg-success/30 text-success'}`}>{v ? '✗' : '✓'}</span>
                <span className="text-text-muted">{k}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deadlock Popup */}
      <AnimatePresence>
        {showDeadlock && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeadlock(false)}>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-surface border-2 border-danger/60 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl glow-danger"
              onClick={e => e.stopPropagation()}>
              <motion.div animate={{ rotate: [0, -10, 10, -10, 10, 0] }} transition={{ duration: 0.5, delay: 0.2 }}>
                <HiOutlineExclamation className="w-16 h-16 text-danger mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold text-danger mb-2">⚠️ Deadlock Detected!</h3>
              <p className="text-text-muted text-sm mb-4">Patient A holds ICU Bed → waits for MRI<br />Patient B holds MRI → waits for ICU Bed<br /><span className="text-danger font-semibold">Circular Wait = Deadlock!</span></p>
              <button onClick={() => setShowDeadlock(false)}
                className="px-6 py-2.5 bg-danger/20 hover:bg-danger/30 text-danger border border-danger/40 rounded-xl font-semibold text-sm transition-all">
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
