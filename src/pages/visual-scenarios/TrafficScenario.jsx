import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineExclamation, HiOutlinePlay, HiOutlinePause, HiOutlineRefresh } from 'react-icons/hi';
import { MdSkipNext } from 'react-icons/md';

// Cars come from N, S, E, W and enter a one-lane intersection
// Each car blocks the lane the next needs
const DIRS = ['North', 'East', 'South', 'West'];
const CAR_EMOJIS = ['🚗', '🚙', '🚕', '🚌'];
const CAR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f472b6'];
// Each car occupies the quadrant coming from its direction
const STEPS = [
  { desc: 'All four cars approach the intersection from different directions.', present: [], blocked: [] },
  { desc: 'Car from North enters the intersection, occupying the North quadrant.', present: ['North'], blocked: [] },
  { desc: 'Car from East enters, occupying the East quadrant.', present: ['North', 'East'], blocked: [] },
  { desc: 'Car from South enters, occupying the South quadrant.', present: ['North', 'East', 'South'], blocked: [] },
  { desc: 'Car from West enters, occupying the West quadrant.', present: ['North', 'East', 'South', 'West'], blocked: [] },
  { desc: 'North car needs East quadrant — blocked by East car. East car needs South — blocked by South. South needs West — blocked by West. West needs North — blocked by North.', present: ['North', 'East', 'South', 'West'], blocked: ['North', 'East', 'South', 'West'] },
  { desc: '🔴 DEADLOCK! Each car is waiting for the quadrant held by the next car. Nobody can move!', present: ['North', 'East', 'South', 'West'], blocked: ['North', 'East', 'South', 'West'], deadlock: true },
];

// Quadrant center positions (SVG 300x300)
const QUAD_POS = { North: [150, 80], East: [220, 150], South: [150, 220], West: [80, 150] };
const APPROACH_POS = { North: [150, 20], East: [280, 150], South: [150, 280], West: [20, 150] };
const WAIT_POS = { North: [110, 60], East: [240, 110], South: [190, 240], West: [60, 190] };
const ARROW = { North: 'East', East: 'South', South: 'West', West: 'North' };

export default function TrafficScenario({ speed = 1 }) {
  const [stepIndex, setStepIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [showDeadlock, setShowDeadlock] = useState(false);
  const [activeTab, setActiveTab] = useState('without');
  const intervalRef = useRef(null);
  const current = stepIndex >= 0 ? STEPS[Math.min(stepIndex, STEPS.length - 1)] : STEPS[0];

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
        {stepIndex >= 0 && (
          <motion.div key={stepIndex} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-4 rounded-xl border text-sm font-medium ${isDeadlocked ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-primary/10 border-primary/30 text-primary-light'}`}>
            {current.desc}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Traffic Visual */}
      <div className="glass rounded-2xl p-5 flex flex-col items-center">
        <h4 className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-4 self-start">Traffic Intersection</h4>
        <svg viewBox="0 0 300 300" className="w-full max-w-xs">
          {/* Road */}
          <rect x={110} y={0} width={80} height={300} fill="rgba(51,65,85,0.5)" rx={4} />
          <rect x={0} y={110} width={300} height={80} fill="rgba(51,65,85,0.5)" rx={4} />
          {/* Intersection box */}
          <rect x={110} y={110} width={80} height={80} fill={isDeadlocked ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.1)'} stroke={isDeadlocked ? '#ef4444' : 'rgba(99,102,241,0.3)'} strokeWidth={2} />
          {/* Lane dashes */}
          {[140, 160].map(x => [10, 60, 220, 270].map(y => <rect key={`${x}-${y}`} x={x} y={y} width={20} height={8} fill="rgba(255,255,255,0.2)" rx={2} />))}
          {[140, 160].map(y => [10, 60, 220, 270].map(x => <rect key={`${x}-${y}`} x={x} y={y} width={8} height={20} fill="rgba(255,255,255,0.2)" rx={2} />))}

          {/* Cars */}
          {DIRS.map((dir, i) => {
            const isPresent = current.present.includes(dir);
            const isBlocked = current.blocked.includes(dir);
            const [qx, qy] = QUAD_POS[dir];
            const [ax, ay] = APPROACH_POS[dir];
            const cx = isPresent ? qx : ax;
            const cy = isPresent ? qy : ay;
            return (
              <motion.g key={dir} animate={{ x: cx - ax, y: cy - ay }} transition={{ type: 'spring', stiffness: 150, damping: 20 }}>
                {/* Car body */}
                <circle cx={ax} cy={ay} r={16}
                  fill={isBlocked ? 'rgba(239,68,68,0.3)' : `${CAR_COLORS[i]}33`}
                  stroke={isBlocked ? '#ef4444' : CAR_COLORS[i]}
                  strokeWidth={isBlocked ? 2.5 : 1.5} />
                <text x={ax} y={ay + 6} textAnchor="middle" fontSize="16">{CAR_EMOJIS[i]}</text>
                {isBlocked && (
                  <motion.text x={ax} y={ay - 20} textAnchor="middle" fontSize="12" fill="#ef4444"
                    animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                    ⏳
                  </motion.text>
                )}
              </motion.g>
            );
          })}

          {/* Wait arrows (show which car waits for which quadrant) */}
          {isDeadlocked && DIRS.map((dir, i) => {
            const [fx, fy] = QUAD_POS[dir];
            const [tx, ty] = QUAD_POS[ARROW[dir]];
            return (
              <motion.line key={dir} x1={fx} y1={fy} x2={tx * 0.4 + fx * 0.6} y2={ty * 0.4 + fy * 0.6}
                stroke="#ef4444" strokeWidth={2} strokeDasharray="4,3"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }} />
            );
          })}

          {/* Direction labels */}
          {[['N', 150, 12], ['E', 288, 154], ['S', 150, 292], ['W', 12, 154]].map(([l, x, y]) => (
            <text key={l} x={x} y={y} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="700">{l}</text>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-text-muted">
          {DIRS.map((d, i) => (
            <span key={d} className="flex items-center gap-1.5">
              <span className="text-base">{CAR_EMOJIS[i]}</span>
              <span style={{ color: CAR_COLORS[i] }}>Car from {d}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Cars in Intersection', value: current.present.length, color: 'text-primary-light' },
          { label: 'Moving', value: Math.max(0, current.present.length - current.blocked.length), color: 'text-success' },
          { label: 'Waiting', value: current.blocked.length, color: 'text-warning' },
          { label: 'Deadlock', value: isDeadlocked ? 'YES' : 'NO', color: isDeadlocked ? 'text-danger' : 'text-success' },
        ].map(s => (
          <div key={s.label} className="glass-light rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-text-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Prevention */}
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
          <p className="text-sm text-text-muted">❌ All 4 cars enter simultaneously with no traffic management → circular block → deadlock.</p>
        ) : (
          <div className="text-sm space-y-2 text-text-muted">
            <p className="text-success font-semibold">✅ Prevention via Traffic Rules:</p>
            <p>→ <span className="text-primary-light">Yield rule:</span> Cars entering from North always yield to cars from the right — breaks circular wait.</p>
            <p>→ <span className="text-primary-light">Traffic light (preemption):</span> Force one car to back up and allow others to proceed.</p>
            <p>→ <span className="text-primary-light">One-at-a-time policy:</span> Only allow one car in the intersection at a time (mutual exclusion removal).</p>
          </div>
        )}
      </div>

      {/* Education */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-white">📚 Educational Explanation</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text-muted">
          <div><p className="text-primary-light font-semibold mb-2">Why deadlock occurred?</p>
            <p>N car needs E quadrant (held by E car) → E needs S (held by S) → S needs W (held by W) → W needs N (held by N). Perfect circular wait among 4 entities.</p>
          </div>
          <div><p className="text-primary-light font-semibold mb-2">Coffman Conditions:</p>
            {['Mutual Exclusion (one car per quadrant)', 'Hold and Wait', 'No Preemption', 'Circular Wait'].map(c => (
              <div key={c} className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded-full bg-danger/30 text-danger text-xs flex items-center justify-center">✗</span><span className="text-xs">{c}</span></div>
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
              <h3 className="text-2xl font-bold text-danger mb-2">⚠️ Traffic Deadlock!</h3>
              <p className="text-text-muted text-sm mb-4">4 cars block each other in a circular chain.<br />N→E→S→W→N. No car can advance!</p>
              <button onClick={() => setShowDeadlock(false)}
                className="px-6 py-2.5 bg-danger/20 hover:bg-danger/30 text-danger border border-danger/40 rounded-xl font-semibold text-sm transition-all">Dismiss</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
