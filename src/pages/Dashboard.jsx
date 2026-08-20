import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Card, StatCard, Badge, Tooltip, SectionTitle } from '../components/ui';
import {
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineBan,
  HiOutlineLightningBolt,
  HiOutlineInformationCircle,
} from 'react-icons/hi';
import { FaLock, FaHandPaper, FaBan, FaSyncAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const conditionCards = [
  {
    icon: FaLock,
    title: 'Mutual Exclusion',
    description: 'At least one resource must be held in a non-shareable mode. Only one process can use the resource at a time.',
    tooltip: 'Resource cannot be shared between processes simultaneously.',
    color: 'from-primary/20 to-primary/5 border-primary/20',
    iconColor: 'text-primary-light',
  },
  {
    icon: FaHandPaper,
    title: 'Hold and Wait',
    description: 'A process holding at least one resource is waiting to acquire additional resources held by other processes.',
    tooltip: 'Process holds resources while requesting more.',
    color: 'from-secondary/20 to-secondary/5 border-secondary/20',
    iconColor: 'text-secondary',
  },
  {
    icon: FaBan,
    title: 'No Preemption',
    description: 'Resources cannot be forcibly taken from a process. They must be released voluntarily by the holding process.',
    tooltip: 'Resources can only be released voluntarily.',
    color: 'from-warning/20 to-warning/5 border-warning/20',
    iconColor: 'text-warning',
  },
  {
    icon: FaSyncAlt,
    title: 'Circular Wait',
    description: 'A set of processes exist such that each process is waiting for a resource held by the next process in the chain.',
    tooltip: 'Processes form a circular chain of waiting.',
    color: 'from-danger/20 to-danger/5 border-danger/20',
    iconColor: 'text-danger',
  },
];

export default function Dashboard() {
  const { stats } = useApp();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-surface to-accent/10 border border-primary/20 p-8 md:p-12"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <Badge color="primary" size="sm">Educational Simulator</Badge>
          <h1 className="text-3xl md:text-5xl font-bold mt-4 mb-3">
            <span className="gradient-text">DeadLock Hero</span>
          </h1>
          <p className="text-text-muted max-w-2xl text-base md:text-lg leading-relaxed">
            An interactive Operating System simulator for understanding, analyzing,
            preventing, detecting, and recovering from deadlocks through beautiful
            visualizations and algorithm simulations.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link to="/smart-mode">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold shadow-lg shadow-primary/25 flex items-center gap-2"
              >
                <HiOutlineLightningBolt className="w-5 h-5" /> Launch Smart Mode
              </motion.button>
            </Link>
            <Link to="/learn">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-xl glass-light text-text font-semibold flex items-center gap-2"
              >
                <HiOutlineInformationCircle className="w-5 h-5" /> Learn More
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div>
        <SectionTitle icon={HiOutlineChartBar} title="Analysis Overview" subtitle="Your simulation statistics at a glance" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={HiOutlineChartBar} label="Total Analyses" value={stats.total} color="primary" delay={0.1} />
          <StatCard icon={HiOutlineShieldCheck} label="Safe States" value={stats.safe} color="success" delay={0.2} />
          <StatCard icon={HiOutlineExclamation} label="Unsafe States" value={stats.unsafe} color="warning" delay={0.3} />
          <StatCard icon={HiOutlineBan} label="Deadlocked States" value={stats.deadlocked} color="danger" delay={0.4} />
        </div>
      </div>

      {/* Quick Intro */}
      <div>
        <SectionTitle icon={HiOutlineInformationCircle} title="Quick Introduction" subtitle="Understanding deadlocks in operating systems" delay={0.2} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card delay={0.3} className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-danger/20 flex items-center justify-center text-danger text-sm font-bold">?</span>
              What is Deadlock?
            </h3>
            <p className="text-text-muted text-sm leading-relaxed">
              A <span className="text-primary-light font-semibold">deadlock</span> is a situation in computing where two or more processes are unable to proceed because each is waiting for the other to release a resource. The processes are effectively stuck in an infinite waiting loop.
            </p>
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger/90">
              <strong>Example:</strong> Process A holds Resource 1 and waits for Resource 2, while Process B holds Resource 2 and waits for Resource 1.
            </div>
          </Card>

          <Card delay={0.4} className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center text-warning text-sm font-bold">!</span>
              Why Do Deadlocks Occur?
            </h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Deadlocks occur when <span className="text-warning font-semibold">all four necessary conditions</span> are met simultaneously: Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait. Understanding these is key to prevention.
            </p>
            <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-sm text-success/90">
              <strong>Key Insight:</strong> Breaking even one condition is sufficient to prevent deadlock from occurring.
            </div>
          </Card>

          <Card delay={0.5} className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary-light text-sm font-bold">★</span>
              Why is Deadlock Management Important?
            </h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Deadlocks can cause <span className="text-danger font-semibold">system-wide failures</span>, wasting CPU cycles and memory while bringing critical applications to a halt. In production systems, unresolved deadlocks lead to service outages, data corruption, and poor user experience. Effective deadlock management ensures system reliability, optimal resource utilization, and uninterrupted process execution.
            </p>
          </Card>
        </div>
      </div>

      {/* Four Conditions */}
      <div>
        <SectionTitle icon={HiOutlineBan} title="Four Necessary Conditions for Deadlock" subtitle="All four must be present simultaneously" delay={0.3} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {conditionCards.map((card, idx) => (
            <Card key={card.title} delay={0.4 + idx * 0.1} className={`bg-gradient-to-br ${card.color} border relative overflow-hidden`}>
              <div className="absolute top-4 right-4">
                <Tooltip text={card.tooltip}>
                  <HiOutlineInformationCircle className="w-4 h-4 text-text-muted cursor-help" />
                </Tooltip>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-surface/50 flex items-center justify-center mb-4 ${card.iconColor}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{card.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{card.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
