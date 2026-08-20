// useState for local state management, useCallback to memoize the analyze function
import { useState, useCallback } from 'react';
// useNavigate allows programmatic navigation to Quick Mode
import { useNavigate } from 'react-router-dom';
// motion for animations, AnimatePresence for enter/exit transitions
import { motion, AnimatePresence } from 'framer-motion';
// toast shows popup notifications (success/error messages)
import toast from 'react-hot-toast';
// useApp accesses the global context to record analysis history and stats
import { useApp } from '../context/AppContext';
// runSmartAnalysis is the master algorithm that runs all checks at once
import { runSmartAnalysis } from '../utils/algorithms';
// Shared UI design system components
import { Card, Badge, Button, MatrixInput, SectionTitle, ProgressBar, Tooltip } from '../components/ui';
// Icons for section headers, state badges, and condition cards
import {
  HiOutlineLightningBolt,   // Lightning bolt for Smart Mode header and Analyze button
  HiOutlineShieldCheck,     // Shield for SAFE state banner
  HiOutlineExclamation,     // Exclamation for UNSAFE state banner
  HiOutlineBan,             // Ban icon for DEADLOCKED state banner
  HiOutlineInformationCircle, // Info icon for Conditions section header
  HiOutlineCheckCircle,     // Check circle (unused but available)
  HiOutlineXCircle,         // X circle for validation error header
  HiOutlineRefresh,         // Refresh icon for Reset button
  HiOutlineChartBar,        // Bar chart icon for Utilization section
  HiOutlineClock,           // Clock icon for Waiting Dependencies section
  HiOutlineArrowRight,      // Arrow for cycle sequence display
} from 'react-icons/hi';
// FontAwesome icons representing each Coffman deadlock condition
import { FaLock, FaHandPaper, FaBan, FaSyncAlt, FaProjectDiagram } from 'react-icons/fa';
// Recharts components for the resource utilization bar chart
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as RTooltip,
} from 'recharts';
// React Flow components for the Wait-For Graph visualization
import {
  ReactFlow, Background, Controls, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css'; // Required CSS for React Flow canvas styling

// Helper: creates a 2D array of empty strings with r rows and c columns
const emptyMatrix = (r, c) => Array.from({ length: r }, () => Array(c).fill(''));

export default function SmartMode() {
  const { addAnalysis } = useApp(); // Pull addAnalysis to record each run to global history
  const navigate = useNavigate();  // Used to redirect user to Quick Mode page

  // Triggered when user clicks the recommendation badge — transfers data and navigates to Quick Mode
  const handleNavigate = () => {
    if (!result) return; // Guard: do nothing if analysis hasn't run yet
    
    // Compute available resources: Available[j] = Total[j] - Sum of all Allocation[i][j]
    const initialAvail = totalResources.map((total, j) => {
      let sumAlloc = 0;
      for (let i = 0; i < processes; i++) {
        sumAlloc += Number(allocation[i][j]); // Accumulate all process allocations for resource j
      }
      return String(Number(total) - sumAlloc); // Return as string for matrix input compatibility
    });

    // Compute Need matrix: Need[i][j] = Maximum[i][j] - Allocation[i][j]
    const needMatrix = allocation.map((row, i) =>
      row.map((val, j) => String(Number(maximum[i][j]) - Number(val)))
    );

    // Serialize full system state into sessionStorage for Quick Mode to read on mount
    sessionStorage.setItem('deadlock_hero_transfer', JSON.stringify({
      targetTab: result.systemState === 'DEADLOCKED' ? 'detection' : 'avoidance', // Decides which tab to open
      p: processes,          // Number of processes
      r: resources,          // Number of resource types
      avail: initialAvail,   // Available resources for Banker's Tab
      alloc: allocation,     // Allocation matrix
      max: maximum,          // Maximum matrix
      totalRes: totalResources, // Total resource capacities
      allocData: allocation,    // Alias used by Detection Tab
      requestData: needMatrix,  // Need matrix used as current requests in Detection Tab
    }));

    navigate('/quick-mode'); // Navigate the user to the Quick Mode page
  };

  const [processes, setProcesses] = useState(3);           // Number of processes (default 3)
  const [resources, setResources] = useState(3);           // Number of resource types (default 3)
  const [totalResources, setTotalResources] = useState(['', '', '']); // Total capacity per resource
  const [allocation, setAllocation] = useState(emptyMatrix(3, 3));    // Current allocation matrix
  const [maximum, setMaximum] = useState(emptyMatrix(3, 3));          // Maximum demand matrix
  const [result, setResult] = useState(null);              // Stores the full analysis output
  const [loading, setLoading] = useState(false);           // Controls loading spinner on Analyze button
  const [errors, setErrors] = useState([]);                // Stores validation error messages

  // Called when user changes the number of processes or resources
  // Resizes all matrices while preserving any values already entered in existing cells
  const updateDimensions = (p, r) => {
    const np = Math.max(1, Math.min(20, Number(p) || 1)); // Clamp processes between 1–20
    const nr = Math.max(1, Math.min(20, Number(r) || 1)); // Clamp resources between 1–20
    setProcesses(np); // Update process count state
    setResources(nr);  // Update resource count state
    // Resize Total Resources array — copy existing values, fill new slots with empty string
    setTotalResources(prev => {
      const arr = Array(nr).fill('');
      for (let i = 0; i < Math.min(prev.length, nr); i++) arr[i] = prev[i];
      return arr;
    });
    // Resize Allocation matrix — preserve existing cell values within the new bounds
    setAllocation(prev => {
      const m = emptyMatrix(np, nr);
      for (let i = 0; i < Math.min(prev.length, np); i++)
        for (let j = 0; j < Math.min(prev[0]?.length || 0, nr); j++) m[i][j] = prev[i][j] ?? '';
      return m;
    });
    // Resize Maximum matrix — same preservation logic as Allocation
    setMaximum(prev => {
      const m = emptyMatrix(np, nr);
      for (let i = 0; i < Math.min(prev.length, np); i++)
        for (let j = 0; j < Math.min(prev[0]?.length || 0, nr); j++) m[i][j] = prev[i][j] ?? '';
      return m;
    });
  };

  const EXAMPLES = [
    {
      group: '✅ Safe State',
      items: [
        { id: 'safe1', label: 'Classic Banker (OS Textbook)', tag: 'Safe', p: 5, r: 3, total: ['10','5','7'], alloc: [['0','1','0'],['2','0','0'],['3','0','2'],['2','1','1'],['0','0','2']], max: [['7','5','3'],['3','2','2'],['9','0','2'],['2','2','2'],['4','3','3']] },
        { id: 'safe2', label: 'Small Safe — 3 Processes', tag: 'Safe', p: 3, r: 3, total: ['9','3','6'], alloc: [['2','1','2'],['1','0','1'],['1','1','0']], max: [['5','3','4'],['3','1','3'],['3','2','2']] },
        { id: 'safe3', label: 'Plenty of Resources', tag: 'Safe', p: 4, r: 2, total: ['10','10'], alloc: [['1','1'],['2','1'],['1','2'],['1','1']], max: [['4','3'],['5','4'],['3','3'],['4','3']] },
      ],
    },
    {
      group: '⚠️ Unsafe State',
      items: [
        { id: 'unsafe1', label: 'Near Deadlock — Resources Tight', tag: 'Unsafe', p: 3, r: 3, total: ['10','5','8'], alloc: [['1','2','1'],['2','0','2'],['2','2','1']], max: [['2','2','2'],['4','3','3'],['9','6','6']] },
        { id: 'unsafe2', label: 'High Demand, Low Supply', tag: 'Unsafe', p: 3, r: 2, total: ['5','5'], alloc: [['1','2'],['2','1'],['1','1']], max: [['2','2'],['4','4'],['6','6']] },
        { id: 'unsafe3', label: 'Over-committed System', tag: 'Unsafe', p: 3, r: 1, total: ['4'], alloc: [['1'],['2'],['0']], max: [['2'],['5'],['1']] },
        { id: 'unsafe4', label: 'Unsatisfiable Demands (4P 3R)', tag: 'Unsafe', p: 4, r: 3, total: ['9','3','6'], alloc: [['2','1','2'],['1','1','1'],['4','0','1'],['1','0','0']], max: [['3','1','2'],['3','2','2'],['10','5','5'],['2','1','1']] },
        { id: 'unsafe5', label: 'Tight Allocation Limit (4P 2R)', tag: 'Unsafe', p: 4, r: 2, total: ['6','6'], alloc: [['1','2'],['2','1'],['1','1'],['1','1']], max: [['2','2'],['3','3'],['7','7'],['2','2']] },
      ],
    },
    {
      group: '🔴 Deadlocked',
      items: [
        { id: 'dl1', label: 'Circular Wait — 3 Processes', tag: 'Deadlock', p: 3, r: 3, total: ['3','3','2'], alloc: [['1','1','0'],['1','0','1'],['0','1','1']], max: [['2','2','1'],['2','1','2'],['1','2','2']] },
        { id: 'dl2', label: 'Full Lock — No Progress', tag: 'Deadlock', p: 3, r: 2, total: ['2','2'], alloc: [['1','0'],['0','1'],['1','1']], max: [['2','0'],['0','2'],['1','2']] },
        { id: 'dl3', label: 'Large Deadlock — 5 Processes', tag: 'Deadlock', p: 5, r: 3, total: ['4','3','4'], alloc: [['1','1','0'],['0','1','1'],['1','0','1'],['1','1','0'],['0','0','1']], max: [['2','2','1'],['1','2','2'],['2','1','2'],['2','2','1'],['1','1','2']] },
      ],
    },
  ];

  // Maps each example tag to its Tailwind badge color classes
  const TAG_COLOR = { Safe: 'text-success bg-success/10 border-success/30', Unsafe: 'text-warning bg-warning/10 border-warning/30', Deadlock: 'text-danger bg-danger/10 border-danger/30' };

  // Picks a random example from all groups and populates all form states
  const loadRandomExample = () => {
    const allItems = EXAMPLES.flatMap(group => group.items); // Flatten all groups into one array
    const randomEx = allItems[Math.floor(Math.random() * allItems.length)]; // Pick random entry
    setProcesses(randomEx.p); setResources(randomEx.r); // Set matrix dimensions
    setTotalResources(randomEx.total); // Set total resource capacities
    setAllocation(randomEx.alloc);     // Set allocation matrix
    setMaximum(randomEx.max);          // Set maximum demand matrix
    setResult(null); setErrors([]);    // Clear any existing results or errors
    toast.success(`Loaded: ${randomEx.label}`); // Confirm which example was loaded
  };

  // Main analysis function — wrapped in useCallback to avoid unnecessary re-creation
  const analyze = useCallback(() => {
    setLoading(true);  // Show loading spinner on Analyze button
    setErrors([]);     // Clear previous validation errors
    setResult(null);   // Clear previous results

    // setTimeout adds a brief 800ms delay so the loading animation is visible before results appear
    setTimeout(() => {
      const res = runSmartAnalysis({ processes, resources, totalResources, allocation, maximum }); // Run all algorithms
      if (!res.valid) {
        setErrors(res.errors); // Display validation error list in the form
        toast.error('Validation failed. Please fix errors.'); // Show error toast
      } else {
        setResult(res); // Store full analysis result for rendering
        addAnalysis({   // Record this analysis run to the global history/stats context
          systemState: res.systemState, // 'SAFE' | 'UNSAFE' | 'DEADLOCKED'
          timestamp: res.timestamp,     // ISO timestamp of when this ran
          processes,                    // Process count for history display
          resources,                    // Resource count for history display
        });
        const stateMsg = { SAFE: '✅ Safe State', UNSAFE: '⚠️ Unsafe State', DEADLOCKED: '🔴 Deadlocked' };
        toast.success(stateMsg[res.systemState] || 'Analysis complete'); // Show state result as toast
      }
      setLoading(false); // Hide loading spinner
    }, 800);
  }, [processes, resources, totalResources, allocation, maximum, addAnalysis]); // Re-create only when inputs change

  // Clears all inputs and results back to a blank initial state
  const reset = () => {
    setResult(null);    // Hide results panel
    setErrors([]);      // Clear validation errors
    setTotalResources(Array(resources).fill('')); // Reset total resources to empty strings
    setAllocation(emptyMatrix(processes, resources)); // Reset allocation matrix to empty
    setMaximum(emptyMatrix(processes, resources));    // Reset maximum matrix to empty
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SectionTitle
        icon={HiOutlineLightningBolt}
        title="Smart Mode"
        subtitle="Intelligent system analysis with automatic deadlock detection and recommendations"
      />

      {/* Input Section */}
      <Card className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white">System Configuration</h3>
          <div>
            <Button variant="ghost" size="sm" onClick={loadRandomExample}>
              📂 Load Example
            </Button>
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Number of Processes</label>
            <input
              type="number" min="1" max="20" value={processes}
              onChange={e => updateDimensions(e.target.value, resources)}
              className="w-full h-10 px-4 bg-surface-light/40 border border-border rounded-xl text-text font-mono focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Number of Resource Types</label>
            <input
              type="number" min="1" max="20" value={resources}
              onChange={e => updateDimensions(processes, e.target.value)}
              className="w-full h-10 px-4 bg-surface-light/40 border border-border rounded-xl text-text font-mono focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
            />
          </div>
        </div>

        {/* Total Resources */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Total Resources</label>
          <div className="flex flex-wrap gap-2">
            {totalResources.map((v, j) => (
              <div key={j} className="flex flex-col items-center gap-1">
                <span className="text-xs text-primary-light font-mono">R{j}</span>
                <input
                  type="number" min="0" value={v}
                  onChange={e => {
                    const arr = [...totalResources];
                    arr[j] = e.target.value;
                    setTotalResources(arr);
                  }}
                  className="w-16 h-9 text-center text-sm font-mono bg-surface-light/40 border border-border rounded-lg text-text focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Matrices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MatrixInput label="Allocation Matrix" rows={processes} cols={resources} value={allocation} onChange={setAllocation} />
          <MatrixInput label="Maximum Matrix" rows={processes} cols={resources} value={maximum} onChange={setMaximum} />
        </div>

        {/* Errors */}
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-danger/10 border border-danger/20 space-y-1"
            >
              <p className="text-sm font-semibold text-danger flex items-center gap-2">
                <HiOutlineXCircle className="w-4 h-4" /> Validation Errors
              </p>
              {errors.map((err, i) => (
                <p key={i} className="text-xs text-danger/80 ml-6">• {err}</p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={analyze} loading={loading} size="lg">
            <HiOutlineLightningBolt className="w-5 h-5" />
            Analyze System
          </Button>
          <Button variant="secondary" onClick={reset} size="lg">
            <HiOutlineRefresh className="w-5 h-5" />
            Reset
          </Button>
        </div>
      </Card>

      {/* ─── Results ───────────────────────────────────────────── */}
      <AnimatePresence>
        {result && (
          <SmartResults
            result={result}
            processes={processes}
            resources={resources}
            handleNavigate={handleNavigate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Results Component ──────────────────────────────────────────────────────
// Receives analysis result and renders all visual output panels
function SmartResults({ result, processes, resources, handleNavigate }) {
  // Maps each system state to its display color, icon, label, and glow CSS class
  const stateConfig = {
    SAFE: { color: 'success', icon: HiOutlineShieldCheck, label: 'SAFE', glow: 'glow-success' },
    UNSAFE: { color: 'warning', icon: HiOutlineExclamation, label: 'UNSAFE', glow: 'glow-warning' },
    DEADLOCKED: { color: 'danger', icon: HiOutlineBan, label: 'DEADLOCKED', glow: 'glow-danger' },
  };
  const sc = stateConfig[result.systemState]; // Shortcut to the active state's display config

  // ── Build React Flow Wait-For Graph nodes and edges ──
  const flowNodes = []; // Array of React Flow node objects
  const flowEdges = []; // Array of React Flow edge objects
  const cycleProcesses = new Set(); // Tracks which process indices are part of a deadlock cycle
  if (result.circularDep.cycles) {
    // Collect all process indices from every detected cycle into a Set for O(1) lookup
    result.circularDep.cycles.forEach(cycle => cycle.forEach(p => cycleProcesses.add(p)));
  }
  for (let i = 0; i < processes; i++) {
    flowNodes.push({
      id: `p${i}`,             // Unique ID for React Flow to identify this node
      data: { label: `P${i}` }, // Label displayed inside the node
      // Position nodes in a circle using polar coordinates: x = cx + r*cos(θ), y = cy + r*sin(θ)
      position: { x: 150 + 200 * Math.cos((2 * Math.PI * i) / processes), y: 150 + 150 * Math.sin((2 * Math.PI * i) / processes) },
      style: {
        background: cycleProcesses.has(i) ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.3)', // Red if deadlocked, indigo if safe
        border: cycleProcesses.has(i) ? '2px solid #ef4444' : '2px solid #6366f1',                // Red border if in cycle
        borderRadius: '12px',
        padding: '10px 20px',
        color: '#e2e8f0',
        fontWeight: 600,
        fontSize: '14px',
      },
    });
  }
  // Build edges from the waiting dependency list — one arrow per unique process-to-process wait
  const addedEdges = new Set(); // Prevents duplicate edges between the same two processes
  result.waiting.dependencies.forEach(dep => {
    const from = dep.waiting.replace('P', '');    // Strip 'P' prefix to get numeric index
    const to = dep.waitingFor.replace('P', '');   // Strip 'P' prefix to get numeric index
    const edgeId = `${from}-${to}`;              // Unique edge identifier
    if (!addedEdges.has(edgeId)) {               // Only add each unique directed edge once
      addedEdges.add(edgeId);
      const inCycle = cycleProcesses.has(Number(from)) && cycleProcesses.has(Number(to)); // True if both endpoints are in a cycle
      flowEdges.push({
        id: edgeId,
        source: `p${from}`,  // Source process node
        target: `p${to}`,    // Target process node
        animated: inCycle,   // Animate the edge if it's part of a deadlock cycle
        style: { stroke: inCycle ? '#ef4444' : '#6366f1', strokeWidth: 2 }, // Red for cycle edges, indigo otherwise
        markerEnd: { type: MarkerType.ArrowClosed, color: inCycle ? '#ef4444' : '#6366f1' }, // Arrow head color
        label: dep.resource,                              // Show resource name as edge label
        labelStyle: { fill: '#94a3b8', fontSize: 11 },   // Muted label text style
        labelBgStyle: { fill: '#1e1b4b', fillOpacity: 0.8 }, // Dark background for label readability
      });
    }
  });

  // Prepares the four Coffman condition items for rendering as cards
  const conditionItems = [
    { key: 'mutualExclusion', icon: FaLock,      label: 'Mutual Exclusion', present: result.conditions.mutualExclusion },
    { key: 'holdAndWait',     icon: FaHandPaper, label: 'Hold and Wait',    present: result.conditions.holdAndWait },
    { key: 'noPreemption',    icon: FaBan,       label: 'No Preemption',    present: result.conditions.noPreemption },
    { key: 'circularWait',    icon: FaSyncAlt,   label: 'Circular Wait',    present: result.conditions.circularWait },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Available Resources & Need Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Available Resources Card */}
        <Card>
          <h4 className="text-sm font-bold text-white mb-3">Available Resources</h4>
          <div className="flex flex-wrap gap-3 py-2">
            {result.bankers.available.map((val, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-surface-light/40 border border-border px-4 py-2 rounded-xl">
                <span className="text-xs text-primary-light font-mono font-semibold">R{idx}</span>
                <span className="text-lg font-mono text-white font-bold">{val}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Need Matrix Card */}
        <Card>
          <h4 className="text-sm font-bold text-white mb-3">Need Matrix (Max - Allocation)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="px-3 py-2 text-left text-text-muted">Process</th>
                  {Array.from({ length: resources }, (_, j) => (
                    <th key={j} className="px-3 py-2 text-center text-primary-light font-mono">R{j}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.bankers.need.map((row, i) => (
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

      {/* System State Banner */}
      <Card className={`${sc.glow} text-center py-8`}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          <sc.icon className={`w-16 h-16 mx-auto text-${sc.color} mb-4`} />
        </motion.div>
        <Badge color={sc.color} size="lg" pulse>{sc.label}</Badge>
        <p className="text-text-muted mt-3 text-sm max-w-md mx-auto">
          {result.systemState === 'SAFE' && 'All processes can complete successfully. The system is in a safe state.'}
          {result.systemState === 'UNSAFE' && 'The system may enter deadlock with future requests. Caution is advised.'}
          {result.systemState === 'DEADLOCKED' && 'Processes cannot proceed due to circular dependency. Immediate action required.'}
        </p>
      </Card>

      {/* Deadlock Conditions */}
      <div>
        <SectionTitle icon={HiOutlineInformationCircle} title="Deadlock Condition Check" subtitle="Status of all four necessary conditions" delay={0.1} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {conditionItems.map((c, i) => (
            <Card key={c.key} delay={0.2 + i * 0.1}
              className={`text-center ${c.present ? 'bg-gradient-to-br from-danger/15 to-danger/5 border border-danger/20' : 'bg-gradient-to-br from-success/15 to-success/5 border border-success/20'}`}
            >
              <c.icon className={`w-8 h-8 mx-auto mb-2 ${c.present ? 'text-danger' : 'text-success'}`} />
              <p className="text-sm font-semibold text-white mb-1">{c.label}</p>
              <Badge color={c.present ? 'danger' : 'success'} size="sm">
                {c.present ? 'Present' : 'Not Present'}
              </Badge>
            </Card>
          ))}
        </div>
      </div>

      {/* Resource Utilization */}
      <div>
        <SectionTitle icon={HiOutlineChartBar} title="Resource Utilization Analysis" subtitle="How resources are being used across processes" delay={0.2} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card delay={0.3}>
            <div className="space-y-4">
              {result.utilization.map((u, i) => (
                <div key={i}>
                  <ProgressBar
                    value={u.percentage}
                    label={`${u.resource} — ${u.allocated}/${u.total} allocated`}
                    color={u.percentage >= 90 ? 'danger' : u.percentage >= 70 ? 'warning' : 'primary'}
                  />
                </div>
              ))}
            </div>
          </Card>
          <Card delay={0.4}>
            <p className="text-sm font-semibold text-text-muted mb-3">Resource Usage Chart</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.utilization}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                  <XAxis dataKey="resource" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} unit="%" />
                  <RTooltip
                    contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', color: '#e2e8f0' }}
                    formatter={(v) => [`${v}%`, 'Usage']}
                  />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                    {result.utilization.map((u, i) => (
                      <Cell key={i} fill={u.percentage >= 90 ? '#ef4444' : u.percentage >= 70 ? '#f59e0b' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Waiting Dependencies */}
      <div>
        <SectionTitle icon={HiOutlineClock} title="Waiting Dependency Analysis" subtitle={`${result.waiting.waitingCount} process(es) currently waiting`} delay={0.3} />
        <Card delay={0.4}>
          {result.waiting.dependencies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Waiting Process</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Waiting For</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Resource</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Needed</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Held by Target</th>
                  </tr>
                </thead>
                <tbody>
                  {result.waiting.dependencies.map((d, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-accent">{d.waiting}</td>
                      <td className="py-3 px-4 font-mono text-primary-light">{d.waitingFor}</td>
                      <td className="py-3 px-4 font-mono">{d.resource}</td>
                      <td className="py-3 px-4 font-mono">{d.needed}</td>
                      <td className="py-3 px-4 font-mono">{d.held}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-text-muted py-6">No waiting dependencies detected.</p>
          )}
        </Card>
      </div>

      {/* Circular Dependency Graph */}
      <div>
        <SectionTitle icon={FaProjectDiagram} title="Circular Dependency Detection" delay={0.4} />
        <Card delay={0.5} className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-text-muted">Cycle Found:</span>
            <Badge color={result.circularDep.hasCycle ? 'danger' : 'success'} pulse={result.circularDep.hasCycle}>
              {result.circularDep.hasCycle ? 'YES' : 'NO'}
            </Badge>
          </div>
          {result.circularDep.hasCycle && result.circularDep.cycles.length > 0 && (
            <div className="space-y-1">
              {result.circularDep.cycles.map((cycle, i) => (
                <p key={i} className="text-sm text-danger font-mono flex items-center gap-1 flex-wrap">
                  {cycle.map((p, j) => (
                    <span key={j} className="flex items-center gap-1">
                      <Badge color="danger" size="sm">P{p}</Badge>
                      {j < cycle.length - 1 && <HiOutlineArrowRight className="w-3 h-3 text-danger/60" />}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          )}
          {flowNodes.length > 0 && flowEdges.length > 0 && (
            <div className="h-80 rounded-xl overflow-hidden border border-border bg-bg-light/50 mt-3">
              <ReactFlow nodes={flowNodes} edges={flowEdges} fitView className="bg-transparent">
                <Background color="rgba(99,102,241,0.05)" gap={20} />
                <Controls />
              </ReactFlow>
            </div>
          )}
          {flowEdges.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">No dependency edges to visualize.</p>
          )}
        </Card>
      </div>

      {/* Recommendation */}
      <div>
        <SectionTitle icon={HiOutlineLightningBolt} title="Recommendation" delay={0.6} />
        <Card delay={0.7} className={`${sc.glow} border border-${sc.color}/30`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl bg-${sc.color}/20 flex-shrink-0`}>
              <sc.icon className={`w-8 h-8 text-${sc.color}`} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white mb-1">{result.recommendation.action}</h4>
              <p className="text-sm text-text-muted mb-2">{result.recommendation.detail}</p>
              {result.recommendation.mode && (
                <Badge
                  color={sc.color}
                  size="sm"
                  className="cursor-pointer hover:opacity-80 active:scale-95 transition duration-150 select-none"
                  onClick={handleNavigate}
                >
                  Go to → {result.recommendation.mode}
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
