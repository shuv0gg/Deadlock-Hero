import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, SectionTitle, Badge } from '../components/ui';
import { HiOutlineAcademicCap, HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi';

const topics = [
  {
    title: 'What is Deadlock?',
    color: 'primary',
    content: `A deadlock is a situation in a multiprogramming environment where two or more processes are unable to proceed because each is waiting for a resource held by another process in the set. The processes are permanently blocked unless the operating system takes some action.

**Real-world Analogy:** Imagine two cars meeting on a narrow bridge from opposite directions. Neither can move forward until the other backs up, but neither is willing to back up.

**Formal Definition:** A set of processes is deadlocked if each process in the set is waiting for an event that can only be caused by another process in the set.`,
  },
  {
    title: 'Four Necessary Conditions',
    color: 'warning',
    content: `For a deadlock to occur, ALL four conditions must hold simultaneously:

**1. Mutual Exclusion:** At least one resource must be held in a non-shareable mode. If another process requests that resource, the requesting process must wait.

**2. Hold and Wait:** A process must be holding at least one resource and waiting to acquire additional resources that are currently being held by other processes.

**3. No Preemption:** Resources cannot be preempted — they can only be released voluntarily by the process holding them.

**4. Circular Wait:** A set of processes {P0, P1, ..., Pn} must exist such that P0 is waiting for a resource held by P1, P1 is waiting for P2, ..., and Pn is waiting for P0.

**Key Insight:** If we can break any ONE of these conditions, deadlock cannot occur.`,
  },
  {
    title: "Banker's Algorithm",
    color: 'success',
    content: `The Banker's Algorithm is a deadlock avoidance algorithm developed by Edsger Dijkstra. It simulates the allocation of resources to processes and checks if the allocation leads to a safe state.

**Key Concepts:**
- **Available:** Number of available instances of each resource type
- **Maximum:** Maximum demand of each process
- **Allocation:** Number of resources currently allocated to each process
- **Need:** Remaining resource need (Maximum - Allocation)

**Safety Algorithm:**
1. Initialize Work = Available, Finish[i] = false for all i
2. Find process i where Finish[i] = false AND Need[i] ≤ Work
3. Work = Work + Allocation[i], Finish[i] = true, go to step 2
4. If all Finish[i] = true → System is in SAFE state

**If a safe sequence exists, the request can be granted safely.**`,
  },
  {
    title: 'Resource Allocation Graph (RAG)',
    color: 'secondary',
    content: `A Resource Allocation Graph is a directed graph used to describe the state of a system of processes and resources.

**Components:**
- **Process Nodes (circles):** Represent system processes
- **Resource Nodes (rectangles):** Represent resource types
- **Request Edge (P → R):** Process P is requesting resource R
- **Assignment Edge (R → P):** Resource R is allocated to process P

**Deadlock Detection using RAG:**
- If the graph contains a cycle, a deadlock MAY exist
- If each resource type has exactly one instance, a cycle means deadlock EXISTS
- If resources have multiple instances, a cycle is necessary but not sufficient

**Example:** If P1→R1→P2→R2→P1, this cycle indicates P1 and P2 are deadlocked.`,
  },
  {
    title: 'Deadlock Detection',
    color: 'danger',
    content: `Deadlock detection is the process of determining whether a deadlock has occurred and identifying the processes involved.

**Detection Algorithm (similar to Banker's):**
1. Initialize Work = Available
2. For each process Pi, if Request[i] ≤ Work, then Work = Work + Allocation[i]
3. If all processes can complete → No deadlock
4. Processes that cannot complete are deadlocked

**When to run detection?**
- Periodically (e.g., every N minutes)
- When resource utilization drops below a threshold
- When a resource request cannot be granted immediately

**Wait-for Graph:** A simplified version of RAG showing only process-to-process waiting relationships. A cycle in the wait-for graph indicates deadlock.`,
  },
  {
    title: 'Deadlock Recovery',
    color: 'accent',
    content: `Once a deadlock is detected, the system must recover. There are several strategies:

**1. Process Termination:**
- **Abort all deadlocked processes:** Simple but expensive — loses all work
- **Abort one process at a time:** Terminate processes until deadlock is resolved. Choose the process with minimum cost.

**Selection criteria for termination:**
- Process priority
- How long the process has been running
- Resources the process has used
- Resources the process needs to complete
- Number of processes to be terminated

**2. Resource Preemption:**
- **Select a victim:** Choose a process whose resources will be preempted
- **Rollback:** Return the process to some safe state and restart
- **Starvation prevention:** Ensure a process is not always chosen as victim (use cost factors)

**Best Practice:** Combine detection with selective recovery for optimal results.`,
  },
];

function TopicCard({ topic, index }) {
  const [open, setOpen] = useState(false);
  return (
    <Card delay={0.1 + index * 0.08} hover={false} className="overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          <Badge color={topic.color} size="sm">{index + 1}</Badge>
          <h3 className="text-base font-bold text-white">{topic.title}</h3>
        </div>
        {open ? <HiOutlineChevronUp className="w-5 h-5 text-text-muted flex-shrink-0" /> : <HiOutlineChevronDown className="w-5 h-5 text-text-muted flex-shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-border text-sm text-text-muted leading-relaxed whitespace-pre-line">
              {topic.content.split('**').map((part, i) =>
                i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : <span key={i}>{part}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function LearningCenter() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <SectionTitle icon={HiOutlineAcademicCap} title="Learning Center" subtitle="Educational content on deadlocks and related algorithms" />
      <Card delay={0.05} className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
        <p className="text-sm text-text-muted leading-relaxed">
          Welcome to the Learning Center! Here you'll find comprehensive explanations of deadlock concepts, algorithms, and recovery strategies.
          Click on any topic below to expand and learn more.
        </p>
      </Card>
      <div className="space-y-3">
        {topics.map((topic, i) => <TopicCard key={topic.title} topic={topic} index={i} />)}
      </div>
    </div>
  );
}
