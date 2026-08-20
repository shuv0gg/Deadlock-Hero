import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineViewGrid,
  HiOutlineLightningBolt,
  HiOutlinePlay,
  HiOutlineSwitchHorizontal,
  HiOutlineAcademicCap,
  HiOutlineInformationCircle,
  HiOutlineX,
  HiOutlineEye,
} from 'react-icons/hi';
import { GiBreakingChain } from 'react-icons/gi';

const navItems = [
  { to: '/', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { to: '/smart-mode', icon: HiOutlineLightningBolt, label: 'Smart Mode' },
  { to: '/quick-mode', icon: HiOutlinePlay, label: 'Quick Mode' },
  { to: '/compare', icon: HiOutlineSwitchHorizontal, label: 'Compare Modes' },
  { to: '/visual-mode', icon: HiOutlineEye, label: 'Visual Mode' },
  { to: '/learn', icon: HiOutlineAcademicCap, label: 'Learning Center' },
  { to: '/about', icon: HiOutlineInformationCircle, label: 'About' },
];

export default function Sidebar({ onClose }) {
  return (
    <aside className="fixed top-0 left-0 h-screen w-72 glass flex flex-col z-50 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
            <GiBreakingChain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text leading-tight">DeadLock Hero</h1>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-primary/20">
          <HiOutlineX className="w-5 h-5 text-text-muted" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-primary/20 to-accent/10 text-white border border-primary/30 shadow-lg shadow-primary/10'
                  : 'text-text-muted hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-light' : 'group-hover:text-primary-light'}`} />
                <span>{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-light"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 m-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
        <p className="text-xs text-text-muted text-center">
          <span className="font-semibold text-primary-light">DeadLock Hero</span>
          <br />
          Educational OS Simulator
        </p>
      </div>
    </aside>
  );
}
