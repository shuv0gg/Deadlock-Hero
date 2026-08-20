// useState/useCallback/useEffect — core React hooks for state, memoization, and side-effects
import { useState, useCallback, useEffect } from 'react';
// motion/AnimatePresence — smooth enter/exit animations between tab content and result panels
import { motion, AnimatePresence } from 'framer-motion';
// toast — shows brief popup notification messages for success or error feedback
import toast from 'react-hot-toast';
// Algorithm functions: Banker's safety check, Need matrix calculator, Available vector calculator
import { bankersAlgorithm, calcNeed, calcAvailable } from '../utils/algorithms';
// Shared design system UI components used across the form and result panels
import { Card, Badge, Button, MatrixInput, SectionTitle, Tabs } from '../components/ui';
// Icons for buttons and result state indicators
import {
  HiOutlinePlay,         // Play icon for Run buttons
  HiOutlineShieldCheck,  // Shield for Safe state badge and Avoidance tab label
  HiOutlineXCircle,      // X circle for Unsafe state badge
  HiOutlineCheckCircle,  // Check circle for recovery success message
  HiOutlineRefresh,      // Refresh icon for Reset buttons
  HiOutlineArrowRight,   // Arrow for safe sequence display
  HiOutlineTrash,        // Trash icon for Terminate process recovery button
} from 'react-icons/hi';
import { FaProjectDiagram } from 'react-icons/fa'; // Diagram icon for Detection tab label
import { ReactFlow, Background, Controls, MarkerType } from '@xyflow/react'; // Graph canvas components
import '@xyflow/react/dist/style.css'; // Required base styles for React Flow canvas

// Helper: creates a 2D array pre-filled with empty strings (used for blank matrix inputs)
const emptyMatrix = (r, c) => Array.from({ length: r }, () => Array(c).fill(''));

// ─── Tab 1: Banker's Algorithm ──────────────────────────────────────────────
function BankersTab() {
  const getTransferData = () => {
    try {
      const raw = sessionStorage.getItem('deadlock_hero_transfer');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.targetTab === 'avoidance') return data;
      }
    } catch { }
    return null;
  };

  const transfer = getTransferData();

  const [p, setP] = useState(transfer ? transfer.p : 3);
  const [r, setR] = useState(transfer ? transfer.r : 3);
  const [avail, setAvail] = useState(transfer ? transfer.avail : ['', '', '']);
  const [alloc, setAlloc] = useState(transfer ? transfer.alloc : emptyMatrix(3, 3));
  const [max, setMax] = useState(transfer ? transfer.max : emptyMatrix(3, 3));
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(-1);

  const updateDims = (np, nr) => {
    np = Math.max(1, Math.min(10, Number(np) || 1));
    nr = Math.max(1, Math.min(10, Number(nr) || 1));
    setP(np); setR(nr);
    setAvail(prev => { const a = Array(nr).fill(''); for (let i = 0; i < Math.min(prev.length, nr); i++) a[i] = prev[i]; return a; });
    setAlloc(prev => { const m = emptyMatrix(np, nr); for (let i = 0; i < Math.min(prev.length, np); i++) for (let j = 0; j < Math.min(prev[0]?.length || 0, nr); j++) m[i][j] = prev[i]?.[j] ?? ''; return m; });
    setMax(prev => { const m = emptyMatrix(np, nr); for (let i = 0; i < Math.min(prev.length, np); i++) for (let j = 0; j < Math.min(prev[0]?.length || 0, nr); j++) m[i][j] = prev[i]?.[j] ?? ''; return m; });
    setResult(null); setStep(-1);
  };

  const EXAMPLES = [
    { id: 'b1', label: 'Classic Textbook (5P 3R)', tag: 'Safe', avail: ['3', '3', '2'], p: 5, r: 3, alloc: [['0', '1', '0'], ['2', '0', '0'], ['3', '0', '2'], ['2', '1', '1'], ['0', '0', '2']], max: [['7', '5', '3'], ['3', '2', '2'], ['9', '0', '2'], ['2', '2', '2'], ['4', '3', '3']] },
    { id: 'b2', label: 'Simple Safe (3P 3R)', tag: 'Safe', avail: ['2', '1', '2'], p: 3, r: 3, alloc: [['1', '0', '0'], ['0', '1', '0'], ['1', '1', '1']], max: [['3', '2', '2'], ['2', '2', '1'], ['3', '3', '3']] },
    { id: 'b3', label: 'Two Resources (4P 2R)', tag: 'Safe', avail: ['1', '1'], p: 4, r: 2, alloc: [['1', '0'], ['0', '1'], ['1', '1'], ['0', '0']], max: [['2', '1'], ['1', '2'], ['1', '1'], ['1', '1']] },
    { id: 'b4', label: 'Unsafe — Tight Resources', tag: 'Unsafe', avail: ['0', '0', '1'], p: 3, r: 3, alloc: [['2', '2', '1'], ['2', '1', '1'], ['1', '1', '1']], max: [['5', '4', '3'], ['4', '3', '3'], ['3', '3', '2']] },
    { id: 'b5', label: 'Unsafe — High Demand', tag: 'Unsafe', avail: ['0', '1'], p: 4, r: 2, alloc: [['2', '1'], ['1', '1'], ['1', '0'], ['0', '1']], max: [['4', '3'], ['3', '2'], ['3', '2'], ['2', '2']] },
  ];
  const loadRandomExample = () => {
    const randomEx = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
    setP(randomEx.p); setR(randomEx.r);
    setAvail(randomEx.avail);
    setAlloc(randomEx.alloc);
    setMax(randomEx.max);
    setResult(null); setStep(-1);
    toast.success(`Loaded: ${randomEx.label}`);
  };

  const run = useCallback(() => {
    try {
      // 1. Validate Available Resources
      for (let j = 0; j < r; j++) {
        const v = avail[j];
        if (v === '' || v === null || v === undefined) {
          toast.error(`Available Resource R${j} cannot be empty.`);
          return;
        }
        if (isNaN(v) || Number(v) < 0 || !Number.isInteger(Number(v))) {
          toast.error(`Available Resource R${j} must be a non-negative integer.`);
          return;
        }
      }

      // 2. Validate Allocation Matrix and Max Matrix
      for (let i = 0; i < p; i++) {
        for (let j = 0; j < r; j++) {
          const a = alloc[i]?.[j];
          const m = max[i]?.[j];
          if (a === '' || a === null || a === undefined) {
            toast.error(`Allocation Matrix cell [P${i}][R${j}] cannot be empty.`);
            return;
          }
          if (isNaN(a) || Number(a) < 0 || !Number.isInteger(Number(a))) {
            toast.error(`Allocation Matrix cell [P${i}][R${j}] must be a non-negative integer.`);
            return;
          }
          if (m === '' || m === null || m === undefined) {
            toast.error(`Maximum Matrix cell [P${i}][R${j}] cannot be empty.`);
            return;
          }
          if (isNaN(m) || Number(m) < 0 || !Number.isInteger(Number(m))) {
            toast.error(`Maximum Matrix cell [P${i}][R${j}] must be a non-negative integer.`);
            return;
          }
          if (Number(a) > Number(m)) {
            toast.error(`Allocation [P${i}][R${j}] (${a}) cannot exceed Maximum [P${i}][R${j}] (${m}).`);
            return;
          }
        }
      }

      const totalRes = avail.map(Number);
      for (let i = 0; i < p; i++) for (let j = 0; j < r; j++) totalRes[j] += Number(alloc[i][j]);
      const res = bankersAlgorithm(alloc, max, totalRes, p, r);
      setResult({ ...res, need: calcNeed(alloc.map(row => row.map(Number)), max.map(row => row.map(Number)), p, r) });
      setStep(-1);
      toast.success(res.isSafe ? '✅ Safe State Found' : '⚠️ Unsafe State');
    } catch (e) {
      toast.error('Invalid input: ' + e.message);
    }
  }, [p, r, avail, alloc, max]);

  return (
    <div className="space-y-6">
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white">Banker's Algorithm Configuration</h3>
          <div>
            <Button variant="ghost" size="sm" onClick={loadRandomExample}>
              📂 Load Example
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-muted mb-1">Processes</label>
            <input type="number" min="1" max="10" value={p} onChange={e => updateDims(e.target.value, r)}
              className="w-full h-10 px-4 bg-surface-light/40 border border-border rounded-xl text-text font-mono focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Resources</label>
            <input type="number" min="1" max="10" value={r} onChange={e => updateDims(p, e.target.value)}
              className="w-full h-10 px-4 bg-surface-light/40 border border-border rounded-xl text-text font-mono focus:border-primary outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-2">Available Resources</label>
          <div className="flex flex-wrap gap-2">
            {avail.map((v, j) => (
              <div key={j} className="flex flex-col items-center gap-1">
                <span className="text-xs text-primary-light font-mono">R{j}</span>
                <input type="number" min="0" value={v}
                  onChange={e => { const a = [...avail]; a[j] = e.target.value; setAvail(a); }}
                  className="w-16 h-9 text-center text-sm font-mono bg-surface-light/40 border border-border rounded-lg text-text focus:border-primary outline-none" />
              </div>
            ))}
          </div>
        </div>
        <div className={`grid grid-cols-1 ${result ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
          <MatrixInput label="Allocation Matrix" rows={p} cols={r} value={alloc} onChange={setAlloc} />
          <MatrixInput label="Maximum Matrix" rows={p} cols={r} value={max} onChange={setMax} />
          {result && (
            <MatrixInput label="Need Matrix (Max - Alloc)" rows={p} cols={r} value={result.need} readOnly />
          )}
        </div>
        <div className="flex gap-3">
          <Button onClick={run} size="lg"><HiOutlinePlay className="w-5 h-5" /> Run Banker's Algorithm</Button>
          <Button variant="secondary" size="lg" onClick={() => { setResult(null); setStep(-1); setAvail(Array(r).fill('')); setAlloc(emptyMatrix(p, r)); setMax(emptyMatrix(p, r)); }}>
            <HiOutlineRefresh className="w-5 h-5" /> Reset
          </Button>
        </div>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* State Badge */}
            <Card className={`text-center py-6 ${result.isSafe ? 'glow-success' : 'glow-warning'}`}>
              {result.isSafe ? <HiOutlineShieldCheck className="w-14 h-14 mx-auto text-success mb-3" /> : <HiOutlineXCircle className="w-14 h-14 mx-auto text-warning mb-3" />}
              <Badge color={result.isSafe ? 'success' : 'warning'} size="lg" pulse>{result.isSafe ? 'SAFE STATE' : 'UNSAFE STATE Detected'}</Badge>
              {result.isSafe ? (
                <div className="flex items-center justify-center gap-2 flex-wrap mt-4">
                  <span className="text-sm text-text-muted">Safe Sequence:</span>
                  {result.safeSequence.map((sp, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <Badge color="success">P{sp}</Badge>
                      {i < result.safeSequence.length - 1 && <HiOutlineArrowRight className="w-3 h-3 text-success/60" />}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-4 max-w-lg mx-auto space-y-4">
                  {/* Point of Failure Sequence */}
                  <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
                    <p className="text-xs font-semibold text-warning mb-2 uppercase tracking-wider text-center">Partial Execution Path</p>
                    <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
                      {result.safeSequence.map((sp, i) => (
                        <span key={i} className="flex items-center gap-2">
                          <Badge color="success" size="md">P{sp}</Badge>
                          <HiOutlineArrowRight className="w-4 h-4 text-success/60" />
                        </span>
                      ))}
                      <span className="flex items-center gap-1 bg-danger/10 border border-danger/30 px-3 py-1 rounded-lg">
                        <span className="text-danger font-bold text-sm">🛑 Stuck</span>
                      </span>
                    </div>

                    {/* Deficit information */}
                    <div className="text-left space-y-2 mt-3 bg-surface-light/40 p-3 rounded-lg border border-border/40 font-mono text-xs">
                      <p className="text-text-muted font-sans font-semibold mb-1">Blocked Processes Resource Deficit:</p>
                      {(() => {
                        // Compute final work vector after executing the safe sequence steps
                        const work = [...result.available];
                        result.safeSequence.forEach(pIdx => {
                          const allocRow = result.steps.find(s => s.process === pIdx)?.allocation || [];
                          allocRow.forEach((val, j) => {
                            work[j] = (work[j] || 0) + val;
                          });
                        });

                        // For each process not in safeSequence, find its deficits
                        const safeSet = new Set(result.safeSequence);
                        const blockedList = [];
                        for (let i = 0; i < p; i++) {
                          if (!safeSet.has(i)) {
                            const deficits = [];
                            for (let j = 0; j < r; j++) {
                              const reqVal = result.need[i][j];
                              const availVal = work[j] || 0;
                              if (reqVal > availVal) {
                                deficits.push(`R${j} (Need ${reqVal}, Avail ${availVal})`);
                              }
                            }
                            blockedList.push({ process: i, deficits });
                          }
                        }

                        return blockedList.map(({ process, deficits }) => (
                          <div key={process} className="flex items-start gap-1">
                            <span className="text-danger font-bold">P{process}:</span>
                            <span className="text-text-muted text-left">
                              Needs {deficits.join(', ')}
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Educational tip banner */}
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-left flex items-start gap-2.5">
                    <span className="text-lg">💡</span>
                    <div>
                      <p className="text-xs font-bold text-white mb-0.5">Edu Tip: Unsafe State vs Deadlock</p>
                      <p className="text-xs text-text-muted leading-relaxed">
                        The system is in an <strong>Unsafe State</strong> but not yet deadlocked. Processes that ran successfully (above) can finish right now. However, if other processes request their maximum needs, a deadlock will eventually become unavoidable.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>


            {/* Step-by-step */}
            {result.isSafe && result.steps.length > 0 && (
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Step-by-Step Execution</h4>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setStep(s => Math.max(-1, s - 1))}>← Prev</Button>
                    <Button variant="ghost" size="sm" onClick={() => setStep(s => Math.min(result.steps.length - 1, s + 1))}>Next →</Button>
                    <Button variant="ghost" size="sm" onClick={() => setStep(result.steps.length - 1)}>All</Button>
                  </div>
                </div>
                {result.steps.slice(0, step + 1).map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-xl bg-success/5 border border-success/20">
                    <p className="text-sm font-semibold text-success mb-1">Step {i + 1}: P{s.process} can execute</p>
                    <p className="text-xs text-text-muted">
                      Need [{s.need.join(', ')}] ≤ Work [{s.workBefore.join(', ')}] ✓
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      P{s.process} releases resources → Work becomes [{s.workAfter.join(', ')}]
                    </p>
                  </motion.div>
                ))}
                {step === -1 && <p className="text-sm text-text-muted text-center py-4">Click "Next" to step through execution.</p>}
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab 2: Detection + Recovery ────────────────────────────────────────────
function DetectionTab() {
  const getTransferData = () => {
    try {
      const raw = sessionStorage.getItem('deadlock_hero_transfer');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.targetTab === 'detection') return data;
      }
    } catch { }
    return null;
  };

  const transfer = getTransferData();

  const [p, setP] = useState(transfer ? transfer.p : 3);
  const [r, setR] = useState(transfer ? transfer.r : 2);
  const [allocData, setAllocData] = useState(transfer ? transfer.allocData : emptyMatrix(3, 2));
  const [requestData, setRequestData] = useState(transfer ? transfer.requestData : emptyMatrix(3, 2));
  const [totalRes, setTotalRes] = useState(transfer ? transfer.totalRes : ['', '']);
  const [result, setResult] = useState(null);
  const [recovered, setRecovered] = useState(null);

  const updateDims = (np, nr) => {
    np = Math.max(1, Math.min(10, Number(np) || 1));
    nr = Math.max(1, Math.min(10, Number(nr) || 1));
    setP(np); setR(nr);
    setTotalRes(prev => { const a = Array(nr).fill(''); for (let i = 0; i < Math.min(prev.length, nr); i++) a[i] = prev[i]; return a; });
    setAllocData(prev => { const m = emptyMatrix(np, nr); for (let i = 0; i < Math.min(prev.length, np); i++) for (let j = 0; j < Math.min(prev[0]?.length || 0, nr); j++) m[i][j] = prev[i]?.[j] ?? ''; return m; });
    setRequestData(prev => { const m = emptyMatrix(np, nr); for (let i = 0; i < Math.min(prev.length, np); i++) for (let j = 0; j < Math.min(prev[0]?.length || 0, nr); j++) m[i][j] = prev[i]?.[j] ?? ''; return m; });
    setResult(null); setRecovered(null);
  };

  const EXAMPLES = [
    // d1: total=[1,1], alloc=[[1,0],[0,1]], avail=[0,0], req=[[0,1],[1,0]] → no process can go → DEADLOCK P0,P1
    { id: 'd1', label: 'Classic 2-Process Deadlock', tag: 'Deadlock', p: 2, r: 2, total: ['1', '1'], alloc: [['1', '0'], ['0', '1']], req: [['0', '1'], ['1', '0']] },
    // d2: total=[2,2], alloc=[[1,1],[1,0],[0,1]], avail=[0,0], req=[[1,0],[0,1],[1,1]] → none satisfy → ALL DEADLOCK
    { id: 'd2', label: '3-Process Full Deadlock', tag: 'Deadlock', p: 3, r: 2, total: ['2', '2'], alloc: [['1', '1'], ['1', '0'], ['0', '1']], req: [['1', '0'], ['0', '1'], ['1', '1']] },
    // d3: total=[2,2], alloc=[[1,0],[0,1],[0,0],[1,1]], avail=[0,0], P2 req=[0,0]→work=[0,0]; P0=[1,1]NO, P1=[1,0]NO, P3=[0,1]NO → P0,P1,P3 DEADLOCK
    { id: 'd3', label: 'Partial Deadlock (4P 2R)', tag: 'Deadlock', p: 4, r: 2, total: ['2', '2'], alloc: [['1', '0'], ['0', '1'], ['0', '0'], ['1', '1']], req: [['1', '1'], ['1', '0'], ['0', '0'], ['0', '1']] },
    // d4: total=[3,3,3], alloc=[[1,0,1],[1,1,0],[0,1,1]], avail=[1,1,1], req=[[0,2,0],[0,0,2],[2,0,0]] → all need 2, only 1 avail → ALL DEADLOCK
    { id: 'd4', label: 'Full Deadlock (3P 3R)', tag: 'Deadlock', p: 3, r: 3, total: ['3', '3', '3'], alloc: [['1', '0', '1'], ['1', '1', '0'], ['0', '1', '1']], req: [['0', '2', '0'], ['0', '0', '2'], ['2', '0', '0']] },
    // d5: total=[6,4], alloc=[[2,1],[1,1],[1,0],[1,1]], avail=[1,1], req=[[1,0],[0,1],[1,1],[0,0]] → P3 goes first, then all → NO DEADLOCK
    { id: 'd5', label: 'No Deadlock — Safe System', tag: 'No DL', p: 4, r: 2, total: ['6', '4'], alloc: [['2', '1'], ['1', '1'], ['1', '0'], ['1', '1']], req: [['1', '0'], ['0', '1'], ['1', '1'], ['0', '0']] },
  ];
  const loadRandomExample = () => {
    const randomEx = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
    setP(randomEx.p); setR(randomEx.r);
    setTotalRes(randomEx.total);
    setAllocData(randomEx.alloc);
    setRequestData(randomEx.req);
    setResult(null); setRecovered(null);
    toast.success(`Loaded: ${randomEx.label}`);
  };

  const detect = () => {
    try {
      // 1. Validate Total Resources
      for (let j = 0; j < r; j++) {
        const v = totalRes[j];
        if (v === '' || v === null || v === undefined) {
          toast.error(`Total Resource R${j} cannot be empty.`);
          return;
        }
        if (isNaN(v) || Number(v) < 0 || !Number.isInteger(Number(v))) {
          toast.error(`Total Resource R${j} must be a non-negative integer.`);
          return;
        }
      }

      // 2. Validate Current Allocation and Current Requests
      for (let i = 0; i < p; i++) {
        for (let j = 0; j < r; j++) {
          const a = allocData[i]?.[j];
          const rq = requestData[i]?.[j];
          if (a === '' || a === null || a === undefined) {
            toast.error(`Allocation Matrix cell [P${i}][R${j}] cannot be empty.`);
            return;
          }
          if (isNaN(a) || Number(a) < 0 || !Number.isInteger(Number(a))) {
            toast.error(`Allocation Matrix cell [P${i}][R${j}] must be a non-negative integer.`);
            return;
          }
          if (rq === '' || rq === null || rq === undefined) {
            toast.error(`Request Matrix cell [P${i}][R${j}] cannot be empty.`);
            return;
          }
          if (isNaN(rq) || Number(rq) < 0 || !Number.isInteger(Number(rq))) {
            toast.error(`Request Matrix cell [P${i}][R${j}] must be a non-negative integer.`);
            return;
          }
        }
      }

      // 3. Validate Total Allocation <= Total Resources
      for (let j = 0; j < r; j++) {
        let sumAlloc = 0;
        for (let i = 0; i < p; i++) {
          sumAlloc += Number(allocData[i][j]);
        }
        if (sumAlloc > Number(totalRes[j])) {
          toast.error(`Sum of Allocated resources for R${j} (${sumAlloc}) exceeds Total Resources (${totalRes[j]}).`);
          return;
        }
      }

      const total = totalRes.map(Number);
      const alloc = allocData.map(row => row.map(Number));
      const req = requestData.map(row => row.map(Number));
      const avail = total.map((t, j) => { let s = 0; for (let i = 0; i < p; i++) s += alloc[i][j]; return t - s; });

      // Build RAG nodes/edges
      const nodes = [];
      const edges = [];
      for (let i = 0; i < p; i++) {
        nodes.push({
          id: `p${i}`, data: { label: `P${i}` },
          position: { x: 80, y: 60 + i * 120 },
          style: { background: 'rgba(99,102,241,0.3)', border: '2px solid #6366f1', borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0', fontWeight: 700 },
        });
      }
      for (let j = 0; j < r; j++) {
        nodes.push({
          id: `r${j}`, data: { label: `R${j} [${total[j]}]` },
          position: { x: 350, y: 60 + j * 140 },
          style: { background: 'rgba(14,165,233,0.3)', border: '2px solid #0ea5e9', borderRadius: '8px', padding: '10px 16px', color: '#e2e8f0', fontWeight: 600 },
        });
      }
      for (let i = 0; i < p; i++) {
        for (let j = 0; j < r; j++) {
          if (alloc[i][j] > 0) edges.push({ id: `a${i}${j}`, source: `r${j}`, target: `p${i}`, style: { stroke: '#10b981' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }, label: `${alloc[i][j]}`, labelStyle: { fill: '#94a3b8', fontSize: 10 }, labelBgStyle: { fill: '#1e1b4b', fillOpacity: 0.8 } });
          if (req[i][j] > 0) edges.push({ id: `q${i}${j}`, source: `p${i}`, target: `r${j}`, style: { stroke: '#f59e0b', strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' }, label: `${req[i][j]}`, labelStyle: { fill: '#94a3b8', fontSize: 10 }, labelBgStyle: { fill: '#1e1b4b', fillOpacity: 0.8 } });
        }
      }

      // Detect deadlock: try to find processes that can complete
      const work = [...avail];
      const finish = Array(p).fill(false);
      let found = true;
      while (found) {
        found = false;
        for (let i = 0; i < p; i++) {
          if (!finish[i] && req[i].every((v, j) => v <= work[j])) {
            for (let j = 0; j < r; j++) work[j] += alloc[i][j];
            finish[i] = true; found = true;
          }
        }
      }
      const deadlocked = finish.map((f, i) => (!f ? i : -1)).filter(i => i !== -1);

      // Highlight deadlocked nodes
      deadlocked.forEach(i => {
        const node = nodes.find(n => n.id === `p${i}`);
        if (node) { node.style.background = 'rgba(239,68,68,0.3)'; node.style.border = '2px solid #ef4444'; }
      });

      setResult({ deadlocked, nodes, edges, alloc, req, avail, total, finish });
      setRecovered(null);
      toast.success(deadlocked.length > 0 ? '🔴 Deadlock Detected' : '✅ No Deadlock');
    } catch (e) { toast.error('Invalid input: ' + e.message); }
  };

  const recoverTerminate = (pid) => {
    if (!result) return;
    const newAlloc = result.alloc.map(row => [...row]);
    const released = [...newAlloc[pid]];
    newAlloc[pid] = Array(r).fill(0);
    const newAvail = result.avail.map((v, j) => v + released[j]);
    setRecovered({ method: 'terminate', process: pid, released, newAvail, message: `P${pid} terminated. Resources released: [${released.join(', ')}]. Remaining processes can continue.` });
    toast.success(`P${pid} terminated for recovery`);
  };

  const recoverRelease = (pid) => {
    if (!result) return;
    const released = [...result.alloc[pid]];
    const newAvail = result.avail.map((v, j) => v + released[j]);
    setRecovered({ method: 'release', process: pid, released, newAvail, message: `Resources of P${pid} released: [${released.join(', ')}]. Available now: [${newAvail.join(', ')}]. Deadlock removed.` });
    toast.success(`Resources of P${pid} released`);
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white">RAG Detection & Recovery</h3>
          <div>
            <Button variant="ghost" size="sm" onClick={loadRandomExample}>
              📂 Load Example
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-muted mb-1">Processes</label>
            <input type="number" min="1" max="10" value={p} onChange={e => updateDims(e.target.value, r)}
              className="w-full h-10 px-4 bg-surface-light/40 border border-border rounded-xl text-text font-mono focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Resources</label>
            <input type="number" min="1" max="10" value={r} onChange={e => updateDims(p, e.target.value)}
              className="w-full h-10 px-4 bg-surface-light/40 border border-border rounded-xl text-text font-mono focus:border-primary outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-2">Total Resources</label>
          <div className="flex flex-wrap gap-2">
            {totalRes.map((v, j) => (
              <div key={j} className="flex flex-col items-center gap-1">
                <span className="text-xs text-primary-light font-mono">R{j}</span>
                <input type="number" min="0" value={v} onChange={e => { const a = [...totalRes]; a[j] = e.target.value; setTotalRes(a); }}
                  className="w-16 h-9 text-center text-sm font-mono bg-surface-light/40 border border-border rounded-lg text-text focus:border-primary outline-none" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MatrixInput label="Current Allocation" rows={p} cols={r} value={allocData} onChange={setAllocData} />
          <MatrixInput label="Current Requests" rows={p} cols={r} value={requestData} onChange={setRequestData} />
        </div>
        <div className="flex gap-3">
          <Button onClick={detect} size="lg"><FaProjectDiagram className="w-4 h-4" /> Detect Deadlock</Button>
          <Button variant="secondary" size="lg" onClick={() => { setResult(null); setRecovered(null); }}><HiOutlineRefresh className="w-5 h-5" /> Reset</Button>
        </div>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Available Resources & Need Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Available Resources Card */}
              <Card>
                <h4 className="text-sm font-bold text-white mb-3">Available Resources</h4>
                <div className="flex flex-wrap gap-3 py-2">
                  {result.avail.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-surface-light/40 border border-border px-4 py-2 rounded-xl">
                      <span className="text-xs text-primary-light font-mono font-semibold">R{idx}</span>
                      <span className="text-lg font-mono text-white font-bold">{val}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Need Matrix Card */}
              <Card>
                <h4 className="text-sm font-bold text-white mb-3">Need Matrix (Current Requests)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="px-3 py-2 text-left text-text-muted">Process</th>
                        {Array.from({ length: r }, (_, j) => (
                          <th key={j} className="px-3 py-2 text-center text-primary-light font-mono">R{j}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.req.map((row, i) => (
                        <tr key={i} className="border-b border-border/10 hover:bg-primary/5 transition-colors">
                          <td className="px-3 py-2 text-accent font-mono font-semibold">P{i}</td>
                          {row.map((v, j) => (
                            <td key={j} className="px-3 py-2 text-center font-mono text-white">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <Card className={`text-center py-6 ${result.deadlocked.length > 0 ? 'glow-danger' : 'glow-success'}`}>
              <Badge color={result.deadlocked.length > 0 ? 'danger' : 'success'} size="lg" pulse>
                {result.deadlocked.length > 0 ? 'DEADLOCK DETECTED' : 'NO DEADLOCK'}
              </Badge>
              {result.deadlocked.length > 0 && (
                <p className="text-sm text-text-muted mt-3">Deadlocked processes: {result.deadlocked.map(i => `P${i}`).join(', ')}</p>
              )}
            </Card>

            {/* RAG Graph */}
            <Card>
              <h4 className="text-sm font-bold text-white mb-3">Resource Allocation Graph</h4>
              <div className="flex gap-4 mb-3 text-xs text-text-muted">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-success inline-block"></span> Allocation</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-warning inline-block border-dashed"></span> Request</span>
              </div>
              <div className="h-80 rounded-xl overflow-hidden border border-border bg-bg-light/50">
                <ReactFlow nodes={result.nodes} edges={result.edges} fitView>
                  <Background color="rgba(99,102,241,0.05)" gap={20} />
                  <Controls />
                </ReactFlow>
              </div>
            </Card>

            {/* Recovery */}
            {result.deadlocked.length > 0 && (
              <Card className="space-y-4">
                <h4 className="text-sm font-bold text-white">Recovery Options</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.deadlocked.map(pid => (
                    <div key={pid} className="p-4 rounded-xl bg-surface-light/30 border border-border space-y-3">
                      <p className="text-sm font-semibold text-white">P{pid}</p>
                      <div className="flex gap-2">
                        <Button variant="danger" size="sm" onClick={() => recoverTerminate(pid)}>
                          <HiOutlineTrash className="w-4 h-4" /> Terminate
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => recoverRelease(pid)}>
                          <HiOutlineRefresh className="w-4 h-4" /> Release Resources
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <AnimatePresence>
                  {recovered && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-success/10 border border-success/20">
                      <HiOutlineCheckCircle className="w-6 h-6 text-success mb-2" />
                      <p className="text-sm text-success">{recovered.message}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Quick Mode Page (Root Component) ────────────────────────────────────────
// Renders the tab selector and conditionally mounts BankersTab or DetectionTab
export default function QuickMode() {
  // Initialize activeTab synchronously from sessionStorage transfer data
  // This ensures the correct tab opens immediately without a flicker on mount
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const raw = sessionStorage.getItem('deadlock_hero_transfer');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.targetTab === 'detection') return 'detection'; // Open Detection tab for deadlocked systems
        if (data.targetTab === 'avoidance') return 'bankers';   // Open Banker's tab for unsafe systems
      }
    } catch {} // Silently ignore any JSON parse errors
    return 'bankers'; // Default to Banker's Algorithm tab
  });

  // On first mount: show a success toast if data was transferred, then clear sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('deadlock_hero_transfer');
    if (raw) {
      toast.success('Loaded system configuration from Smart Mode!'); // Confirm transfer to user
      sessionStorage.removeItem('deadlock_hero_transfer'); // Delete key so it doesn't re-apply on refresh
    }
  }, []); // Empty dependency array = runs only once on mount

  // Tab configuration array passed to the shared Tabs component
  const tabs = [
    { id: 'bankers', label: 'Deadlock Avoidance', icon: HiOutlineShieldCheck }, // Tab 1: Banker's
    { id: 'detection', label: 'Detection + Recovery', icon: FaProjectDiagram }, // Tab 2: RAG
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto"> {/* Max width container with vertical spacing */}
      <SectionTitle icon={HiOutlinePlay} title="Quick Mode" subtitle="Directly execute deadlock algorithms without smart analysis" />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /> {/* Tab selector bar */}
      <AnimatePresence mode="wait"> {/* wait = exit animation finishes before next tab enters */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {/* Conditionally render the active tab component based on selected tab */}
          {activeTab === 'bankers' ? <BankersTab /> : <DetectionTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

