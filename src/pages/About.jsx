import { motion } from 'framer-motion';
import { Card, SectionTitle, Badge } from '../components/ui';
import { HiOutlineInformationCircle, HiOutlineCode, HiOutlineHeart } from 'react-icons/hi';
import { GiBreakingChain } from 'react-icons/gi';

const techStack = [
  { name: 'React.js', desc: 'UI Library' },
  { name: 'Vite', desc: 'Build Tool' },
  { name: 'Tailwind CSS', desc: 'Styling' },
  { name: 'React Router', desc: 'Navigation' },
  { name: 'Framer Motion', desc: 'Animations' },
  { name: 'React Flow', desc: 'Graph Visualization' },
  { name: 'Recharts', desc: 'Charts' },
  { name: 'React Hot Toast', desc: 'Notifications' },
];

export default function About() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <SectionTitle icon={HiOutlineInformationCircle} title="About DeadLock Hero" subtitle="Learn about this educational simulator" />

      <Card delay={0.1} className="text-center py-10 bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/20">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary mb-4">
          <GiBreakingChain className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold gradient-text mb-2">DeadLock Hero</h2>
        <p className="text-text-muted text-sm">Educational OS Deadlock Simulator</p>
        <Badge color="primary" size="sm">Version 1.0</Badge>
      </Card>

      <Card delay={0.2} className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <HiOutlineHeart className="w-5 h-5 text-accent" /> Project Overview
        </h3>
        <p className="text-sm text-text-muted leading-relaxed">
          DeadLock Hero is a comprehensive educational tool designed to help students understand, analyze, prevent, detect, and recover from deadlocks in operating systems. Unlike traditional deadlock simulators, DeadLock Hero features an innovative <strong className="text-primary-light">Smart Mode</strong> that automatically analyzes system states and provides intelligent recommendations.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Smart Analysis', desc: '8-step automated system analysis' },
            { label: 'Algorithm Execution', desc: "Banker's Algorithm & RAG" },
            { label: 'Interactive Graphs', desc: 'Visual dependency detection' },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-surface-light/30 border border-border text-center">
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="text-xs text-text-muted mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card delay={0.3} className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <HiOutlineCode className="w-5 h-5 text-secondary" /> Technology Stack
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {techStack.map((tech, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="p-3 rounded-xl bg-surface-light/30 border border-border text-center hover:border-primary/40 transition-colors">
              <p className="text-sm font-semibold text-white">{tech.name}</p>
              <p className="text-xs text-text-muted">{tech.desc}</p>
            </motion.div>
          ))}
        </div>
      </Card>

      <Card delay={0.4} className="space-y-4">
        <h3 className="text-lg font-bold text-white">Key Features</h3>
        <ul className="space-y-2">
          {[
            'Smart Mode with 8-step automated analysis and recommendation engine',
            "Quick Mode for direct Banker's Algorithm and RAG execution",
            'Interactive Resource Allocation Graph visualization with React Flow',
            'Step-by-step algorithm execution with animations',
            'Deadlock detection with cycle highlighting',
            'Recovery simulation with process termination and resource release',
            'Comprehensive Learning Center with educational content',
            'Persistent analysis history with localStorage',
            'Real-time input validation with friendly error messages',
            'Fully responsive design with dark theme and glassmorphism',
          ].map((feat, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.03 }}
              className="flex items-start gap-2 text-sm text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-light mt-1.5 flex-shrink-0" />
              {feat}
            </motion.li>
          ))}
        </ul>
      </Card>

      <div className="text-center py-6 text-text-muted text-xs">
        <p>Built with <span className="text-accent">♥</span> for educational purposes</p>
        <p className="mt-1">DeadLock Hero © 2026 — All computations run entirely client-side</p>
      </div>
    </div>
  );
}
