// Import useState hook for managing which scenario is currently open
import { useState } from 'react';
// Import motion and AnimatePresence for entrance/exit animations
import { motion, AnimatePresence } from 'framer-motion';
// Import scenario-specific icons from react-icons
import { MdOutlineLocalHospital, MdOutlineAccountBalance, MdOutlineTraffic } from 'react-icons/md';
// Import eye icon for the page header
import { HiOutlineEye } from 'react-icons/hi';

// Import the three animated scenario simulation components
import HospitalScenario from './visual-scenarios/HospitalScenario';
import BankScenario from './visual-scenarios/BankScenario';
import TrafficScenario from './visual-scenarios/TrafficScenario';

// SCENARIOS: Static list of all available simulation scenarios
// Each entry defines the scenario's metadata and the component to render
const SCENARIOS = [
  {
    id: 'hospital',                         // Unique ID used to track which scenario is open
    label: 'Hospital Resources',            // Display label shown on the card and tab
    icon: MdOutlineLocalHospital,           // Icon component used in tabs and card footer
    emoji: '🏥',                            // Large emoji for visual flair on the card
    color: 'from-rose-500/20 to-pink-600/10 border-rose-500/30', // Gradient and border CSS classes
    accent: 'text-rose-400',               // Text color for the "Open Simulation" link
    description: 'Patients compete for Doctor, MRI Machine, ICU Bed, and Ventilator. See how circular resource requests lead to deadlock.', // Card description
    tags: ['Hold & Wait', 'Circular Wait', 'Mutual Exclusion'], // Concept tags displayed as badges
    difficulty: 'Beginner',                // Difficulty level badge
    component: HospitalScenario,           // The React component to render when this scenario is opened
  },
  {
    id: 'bank',                            // Unique ID for the bank scenario
    label: 'Bank Transactions',            // Display label
    icon: MdOutlineAccountBalance,         // Icon for tabs and card
    emoji: '🏦',                           // Emoji for card header
    color: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/30', // Card gradient
    accent: 'text-emerald-400',            // Link text color
    description: 'Two bank transactions lock different accounts and each waits for the account held by the other — a classic deadlock.', // Description
    tags: ['Lock Ordering', 'Two-Phase Locking', 'Rollback'], // Concept tags
    difficulty: 'Intermediate',            // Difficulty level
    component: BankScenario,              // Component to render
  },
  {
    id: 'traffic',                         // Unique ID for the traffic scenario
    label: 'Traffic Intersection',         // Display label
    icon: MdOutlineTraffic,               // Icon
    emoji: '🚦',                           // Emoji
    color: 'from-amber-500/20 to-orange-600/10 border-amber-500/30', // Card gradient
    accent: 'text-amber-400',             // Link text color
    description: 'Four cars arrive from four directions and each blocks the next in a circular chain. No car can advance!', // Description
    tags: ['Circular Wait', 'No Preemption', 'Resource Ordering'], // Concept tags
    difficulty: 'Intermediate',            // Difficulty level
    component: TrafficScenario,           // Component to render
  },
];

// DIFF_COLOR: Maps difficulty labels to their Tailwind CSS color classes for badge styling
const DIFF_COLOR = { Beginner: 'text-success bg-success/10 border-success/30', Intermediate: 'text-warning bg-warning/10 border-warning/30', Advanced: 'text-danger bg-danger/10 border-danger/30' };

// Main VisualMode page component — renders scenario cards and the selected active simulation
export default function VisualMode() {
  const [activeId, setActiveId] = useState(null); // ID of the currently open scenario (null = showing cards)
  const active = SCENARIOS.find(s => s.id === activeId); // Find the full metadata object for the active scenario

  return (
    <div className="min-h-screen p-6 space-y-8"> {/* Full screen wrapper with padding and vertical spacing */}
      {/* Page Header — animated slide-in from top */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3"> {/* Row layout for icon and title */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 glow-primary"> {/* Glowing icon container */}
            <HiOutlineEye className="w-7 h-7 text-primary-light" /> {/* Eye icon for "visual" mode */}
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Visual Mode</h1> {/* Page title */}
            <p className="text-text-muted text-sm mt-0.5">Real-life deadlock scenarios through animation &amp; step-by-step simulation</p> {/* Subtitle */}
          </div>
        </div>
      </motion.div>

      {/* Scenario Cards Grid — only shown when no scenario is currently selected */}
      {!activeId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-5"> {/* Responsive 2-column card grid */}
          {SCENARIOS.map((s, i) => ( // Loop through all defined scenarios to render their cards
            <motion.button
              key={s.id}                                           // Unique key for React reconciliation
              initial={{ opacity: 0, y: 20 }}                     // Card starts hidden below
              animate={{ opacity: 1, y: 0 }}                      // Card animates into view
              transition={{ delay: i * 0.1 }}                     // Each card staggers its entry by 0.1s
              whileHover={{ y: -4, transition: { duration: 0.2 } }} // Card lifts on hover
              onClick={() => setActiveId(s.id)}                   // Set the active scenario on click
              className={`w-full text-left glass rounded-2xl p-6 border bg-gradient-to-br ${s.color} transition-all hover:shadow-lg group`} // Styling with scenario-specific gradient
            >
              <div className="flex items-start gap-4"> {/* Row: emoji + text content */}
                <div className="text-4xl">{s.emoji}</div> {/* Large emoji icon */}
                <div className="flex-1"> {/* Text content block */}
                  <div className="flex items-center gap-3 mb-2"> {/* Title row */}
                    <h3 className="text-lg font-bold text-white">{s.label}</h3> {/* Scenario name */}
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${DIFF_COLOR[s.difficulty]}`}>{s.difficulty}</span> {/* Difficulty badge */}
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed mb-4">{s.description}</p> {/* Scenario description */}
                  <div className="flex flex-wrap gap-2"> {/* Concept tags row */}
                    {s.tags.map(t => (
                      <span key={t} className="text-xs px-2 py-1 rounded-lg bg-surface-light/40 text-text-muted border border-border">{t}</span> // Individual concept tag badge
                    ))}
                  </div>
                </div>
              </div>
              <div className={`mt-4 flex items-center gap-2 text-sm font-semibold ${s.accent} group-hover:gap-3 transition-all`}> {/* Footer link row — gap increases on hover */}
                <s.icon className="w-4 h-4" /> {/* Scenario icon */}
                Open Simulation → {/* Call-to-action text */}
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Active Scenario Panel — shown with fade transition when a scenario is selected */}
      <AnimatePresence mode="wait"> {/* wait mode ensures exit animation completes before entering new one */}
        {activeId && active && ( // Only render if a valid scenario is selected
          <motion.div key={activeId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}> {/* Fade-in from below, fade-out upward */}
            {/* Top bar: Back button + active scenario title */}
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setActiveId(null)} // Reset activeId to return to the cards grid
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-light/40 border border-border text-text-muted hover:text-white text-sm font-medium transition-all hover:bg-surface-light/60">
                ← Back to Scenarios {/* Back navigation button */}
              </button>
              <div className="flex items-center gap-3"> {/* Active scenario title row */}
                <span className="text-2xl">{active.emoji}</span> {/* Emoji of the active scenario */}
                <div>
                  <h2 className="text-xl font-bold text-white">{active.label}</h2> {/* Scenario name as heading */}
                  <p className="text-xs text-text-muted">{active.description}</p> {/* Scenario description */}
                </div>
              </div>
            </div>

            {/* Scenario Tab Switcher — allows switching between scenarios without going back */}
            <div className="flex gap-1 p-1 bg-surface-light/30 rounded-xl border border-border mb-6 overflow-x-auto"> {/* Horizontal scrollable tab bar */}
              {SCENARIOS.map(s => ( // Render one tab button per scenario
                <button key={s.id} onClick={() => setActiveId(s.id)} // Switch active scenario on click
                  className={`flex items-center gap-2 flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative ${activeId === s.id ? 'text-white' : 'text-text-muted hover:text-white'}`}>
                  {activeId === s.id && ( // Show animated background pill only on the active tab
                    <motion.div layoutId="sceneTab" // layoutId lets Framer Motion animate the pill as it moves between tabs
                      className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/20 border border-primary/30 rounded-lg"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                  )}
                  <span className="relative z-10 flex items-center gap-2"> {/* Label must be above the animated background */}
                    <s.icon className="w-4 h-4" />{s.label} {/* Icon and label for each tab */}
                  </span>
                </button>
              ))}
            </div>

            {/* Dynamically render the selected scenario's React component */}
            <active.component />
          </motion.div>
        )}
      </AnimatePresence>

      {/* "What You'll Learn" info cards — shown only when no scenario is selected */}
      {!activeId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.4 } }}> {/* Delayed fade-in */}
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-widest mb-4">What You'll Learn</h3> {/* Section heading */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> {/* 4-column responsive grid */}
            {[
              { icon: '🔄', title: 'Circular Wait', desc: 'Visualize how processes form a cycle of resource dependencies.' },
              { icon: '📊', title: 'RAG Visualization', desc: 'Watch the Resource Allocation Graph build up in real time.' },
              { icon: '⚠️', title: 'Deadlock Detection', desc: 'See deadlock warnings animate the moment a cycle forms.' },
              { icon: '🛡️', title: 'Prevention Strategies', desc: 'Compare scenarios with and without deadlock prevention applied.' },
            ].map((c, i) => ( // Render each learning concept card
              <motion.div key={c.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08 }} // Stagger entry delay
                className="glass-light rounded-2xl p-5 text-center">
                <div className="text-3xl mb-3">{c.icon}</div> {/* Concept icon */}
                <h4 className="font-semibold text-white text-sm mb-2">{c.title}</h4> {/* Concept title */}
                <p className="text-xs text-text-muted leading-relaxed">{c.desc}</p> {/* Concept description */}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
