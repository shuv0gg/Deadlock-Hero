import { motion } from 'framer-motion';
import { Card, SectionTitle, Badge } from '../components/ui';
import { HiOutlineSwitchHorizontal, HiOutlineLightningBolt, HiOutlinePlay, HiOutlineCheckCircle } from 'react-icons/hi';

const comparisons = [
  { feature: 'Purpose', smart: 'Full system analysis + recommendation', quick: 'Direct algorithm execution' },
  { feature: 'Input Required', smart: 'Processes, Resources, Allocation, Maximum', quick: 'Same + Available (Tab 1) or Requests (Tab 2)' },
  { feature: 'Deadlock Condition Check', smart: '✅ Automatic', quick: '❌ Not included' },
  { feature: 'Resource Utilization', smart: '✅ Charts + Progress bars', quick: '❌ Not included' },
  { feature: 'Waiting Dependencies', smart: '✅ Table + Count', quick: '❌ Not included' },
  { feature: 'Circular Dependency', smart: '✅ Cycle detection + Graph', quick: '✅ Graph (Tab 2 only)' },
  { feature: 'Safe Sequence', smart: '✅ Computed automatically', quick: '✅ Step-by-step (Tab 1)' },
  { feature: 'System State', smart: '✅ SAFE / UNSAFE / DEADLOCKED', quick: '✅ SAFE / UNSAFE' },
  { feature: 'Recommendation Engine', smart: '✅ Automatic suggestions', quick: '❌ Not included' },
  { feature: 'Recovery Simulation', smart: '❌ Recommends Quick Mode', quick: '✅ Terminate / Release (Tab 2)' },
  { feature: 'Graph Visualization', smart: '✅ Wait-for graph', quick: '✅ RAG (Tab 2)' },
  { feature: 'Best For', smart: 'Understanding full system state', quick: 'Running specific algorithms quickly' },
];

export default function CompareModes() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <SectionTitle icon={HiOutlineSwitchHorizontal} title="Compare Modes" subtitle="Understand the differences between Smart Mode and Quick Mode" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card delay={0.1} className="bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/20"><HiOutlineLightningBolt className="w-6 h-6 text-primary-light" /></div>
            <div>
              <h3 className="text-lg font-bold text-white">Smart Mode</h3>
              <p className="text-xs text-text-muted">Comprehensive Analysis Engine</p>
            </div>
          </div>
          <ul className="space-y-2">
            {['8-step automated analysis', 'Deadlock condition checking', 'Resource utilization charts', 'Dependency & cycle detection', 'Intelligent recommendations'].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-text-muted">
                <HiOutlineCheckCircle className="w-4 h-4 text-primary-light flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card delay={0.2} className="bg-gradient-to-br from-secondary/15 to-secondary/5 border border-secondary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-secondary/20"><HiOutlinePlay className="w-6 h-6 text-secondary" /></div>
            <div>
              <h3 className="text-lg font-bold text-white">Quick Mode</h3>
              <p className="text-xs text-text-muted">Direct Algorithm Execution</p>
            </div>
          </div>
          <ul className="space-y-2">
            {['Banker\'s Algorithm step-by-step', 'RAG graph visualization', 'Deadlock detection', 'Recovery simulation', 'Process termination & resource release'].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-text-muted">
                <HiOutlineCheckCircle className="w-4 h-4 text-secondary flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card delay={0.3}>
        <h3 className="text-base font-bold text-white mb-4">Feature Comparison Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-text-muted font-medium">Feature</th>
                <th className="text-left py-3 px-4 text-primary-light font-medium">Smart Mode</th>
                <th className="text-left py-3 px-4 text-secondary font-medium">Quick Mode</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }}
                  className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                  <td className="py-3 px-4 font-medium text-white">{row.feature}</td>
                  <td className="py-3 px-4 text-text-muted">{row.smart}</td>
                  <td className="py-3 px-4 text-text-muted">{row.quick}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card delay={0.4} className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-center py-8">
        <h3 className="text-lg font-bold text-white mb-2">Which Mode Should You Use?</h3>
        <p className="text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
          Use <Badge color="primary">Smart Mode</Badge> when you want a complete system analysis with recommendations. 
          Use <Badge color="secondary">Quick Mode</Badge> when you know which algorithm to run and want step-by-step execution or recovery options.
        </p>
      </Card>
    </div>
  );
}
