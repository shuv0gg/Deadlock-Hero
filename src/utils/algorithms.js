// ─── Input Validation ───────────────────────────────────────────────────────
// Validates all user inputs before running any algorithm. Returns an array of error messages.
export function validateInputs({ processes, resources, totalResources, allocation, maximum }) {
  const errors = []; // Collect all validation error messages here

  // Ensure process count is a valid number between 1 and 20
  if (!processes || processes < 1 || processes > 20)
    errors.push('Number of processes must be between 1 and 20.');
  // Ensure resource type count is a valid number between 1 and 20
  if (!resources || resources < 1 || resources > 20)
    errors.push('Number of resource types must be between 1 and 20.');

  if (totalResources) {
    // Total Resources array length must match the declared resource count
    if (totalResources.length !== resources)
      errors.push(`Total Resources must have exactly ${resources} values.`);
    for (let j = 0; j < totalResources.length; j++) {
      // Each total resource entry must not be empty
      if (totalResources[j] === '' || totalResources[j] === null || totalResources[j] === undefined)
        errors.push(`Total Resource R${j} is empty.`);
      // Each total resource entry must be a valid non-negative number
      else if (isNaN(totalResources[j]) || Number(totalResources[j]) < 0)
        errors.push(`Total Resource R${j} must be a non-negative number.`);
    }
  } else {
    // Total Resources array is completely missing
    errors.push('Total Resources are required.');
  }

  // Inner helper to validate both Allocation and Maximum matrices with the same logic
  const validateMatrix = (matrix, name) => {
    if (!matrix) { errors.push(`${name} is required.`); return; } // Matrix is null/undefined
    // Matrix must have exactly the right number of rows
    if (matrix.length !== processes)
      errors.push(`${name} must have exactly ${processes} rows.`);
    for (let i = 0; i < matrix.length; i++) {
      // Each row must have exactly the right number of columns
      if (!matrix[i] || matrix[i].length !== resources)
        errors.push(`${name} row ${i} must have exactly ${resources} columns.`);
      else {
        for (let j = 0; j < matrix[i].length; j++) {
          const v = matrix[i][j];
          // Cell must not be empty
          if (v === '' || v === null || v === undefined)
            errors.push(`${name}[P${i}][R${j}] is empty.`);
          // Cell must be a valid non-negative number
          else if (isNaN(v) || Number(v) < 0)
            errors.push(`${name}[P${i}][R${j}] must be a non-negative number.`);
        }
      }
    }
  };

  // Run matrix validation on both Allocation and Maximum matrices
  validateMatrix(allocation, 'Allocation Matrix');
  validateMatrix(maximum, 'Maximum Matrix');

  // Cross-check: sum of all allocations per resource must not exceed total capacity
  if (errors.length === 0 && allocation && totalResources) {
    for (let j = 0; j < resources; j++) {
      let totalAlloc = 0;
      for (let i = 0; i < processes; i++) totalAlloc += Number(allocation[i][j]); // Sum allocations for resource j
      if (totalAlloc > Number(totalResources[j]))
        errors.push(`Total allocation for R${j} (${totalAlloc}) exceeds total available (${totalResources[j]}).`);
    }
  }

  // Cross-check: Maximum claim must never be less than current allocation for any cell
  if (errors.length === 0 && allocation && maximum) {
    for (let i = 0; i < processes; i++) {
      for (let j = 0; j < resources; j++) {
        if (Number(maximum[i][j]) < Number(allocation[i][j]))
          errors.push(`Maximum[P${i}][R${j}] (${maximum[i][j]}) is less than Allocation[P${i}][R${j}] (${allocation[i][j]}).`);
      }
    }
  }

  return errors; // Return the list of all collected errors (empty if inputs are valid)
}

// ─── Calculate Available Resources ──────────────────────────────────────────
// Computes the number of free instances of each resource type not currently allocated
export function calcAvailable(totalResources, allocation, processes, resources) {
  const total = totalResources.map(Number); // Convert all total values to numbers
  const avail = [...total]; // Start with a copy of total resources
  for (let i = 0; i < processes; i++) {
    for (let j = 0; j < resources; j++) {
      avail[j] -= Number(allocation[i][j]); // Subtract each process's allocation from the total
    }
  }
  return avail; // Returns Available[j] = Total[j] - Sum of Allocation[i][j] for all i
}

// ─── Calculate Need Matrix ──────────────────────────────────────────────────
// Computes how many more resources each process still needs to complete execution
export function calcNeed(allocation, maximum, processes, resources) {
  const need = []; // 2D array to store need values
  for (let i = 0; i < processes; i++) {
    need[i] = []; // Initialize row for process i
    for (let j = 0; j < resources; j++) {
      need[i][j] = Number(maximum[i][j]) - Number(allocation[i][j]); // Need = Max - Allocation
    }
  }
  return need; // Returns the full Need matrix
}

// ─── Banker's Algorithm ─────────────────────────────────────────────────────
// Determines if the current system state is safe by finding a valid execution sequence
export function bankersAlgorithm(allocation, maximum, totalResources, processes, resources) {
  const alloc = allocation.map(r => r.map(Number)); // Parse allocation to numbers
  const max = maximum.map(r => r.map(Number));       // Parse maximum to numbers
  const total = totalResources.map(Number);           // Parse total resources to numbers
  const need = calcNeed(alloc, max, processes, resources);     // Compute Need matrix
  const avail = calcAvailable(total, alloc, processes, resources); // Compute initial Available

  const work = [...avail];                          // work[] = live available resources (changes as processes finish)
  const finish = new Array(processes).fill(false);  // finish[i] = false means P_i has not completed yet
  const safeSequence = [];                          // Stores the order of successfully completed processes
  const steps = [];                                 // Stores step-by-step execution details for UI display

  let found = true; // Controls the outer while loop — set to false when no eligible process is found
  while (found) {
    found = false; // Assume no eligible process found this round
    for (let i = 0; i < processes; i++) {
      if (!finish[i]) { // Only check unfinished processes
        let canRun = true;
        for (let j = 0; j < resources; j++) {
          if (need[i][j] > work[j]) { canRun = false; break; } // P_i can't run if any Need > Work
        }
        if (canRun) {
          // Record the execution step for the UI step-by-step display
          steps.push({
            process: i,              // Which process is executing
            workBefore: [...work],   // Available resources before this process runs
            need: [...need[i]],      // Resources this process needed
            allocation: [...alloc[i]], // Resources this process was holding
          });
          for (let j = 0; j < resources; j++) work[j] += alloc[i][j]; // Simulate process finishing and releasing resources
          steps[steps.length - 1].workAfter = [...work]; // Record available resources after release
          finish[i] = true;         // Mark process as completed
          safeSequence.push(i);     // Add to the safe execution order
          found = true;             // A process was found — restart the scan
        }
      }
    }
  }

  const isSafe = finish.every(f => f); // True only if ALL processes completed successfully
  return { isSafe, safeSequence, steps, need, available: avail }; // Return full result
}

// ─── Deadlock Condition Check ───────────────────────────────────────────────
// Checks whether all four Coffman necessary conditions for deadlock are present
export function checkDeadlockConditions(allocation, maximum, totalResources, processes, resources) {
  const alloc = allocation.map(r => r.map(Number)); // Parse allocation
  const max = maximum.map(r => r.map(Number));       // Parse maximum
  const total = totalResources.map(Number);           // Parse total resources
  const need = calcNeed(alloc, max, processes, resources);     // Compute Need matrix
  const avail = calcAvailable(total, alloc, processes, resources); // Compute Available vector

  // Condition 1 — Mutual Exclusion: at least one resource is held exclusively by one process
  let mutualExclusion = false;
  for (let j = 0; j < resources; j++) {
    let allocCount = 0;
    for (let i = 0; i < processes; i++) {
      if (alloc[i][j] > 0) allocCount++; // Count processes holding resource j
    }
    if (allocCount >= 1 && total[j] > 0) { mutualExclusion = true; break; } // At least one holder found
  }

  // Condition 2 — Hold and Wait: a process holds at least one resource and is waiting for more
  let holdAndWait = false;
  for (let i = 0; i < processes; i++) {
    const holdsAny = alloc[i].some(v => v > 0);  // Does this process hold any resource?
    const needsMore = need[i].some(v => v > 0);  // Does this process still need more resources?
    if (holdsAny && needsMore) { holdAndWait = true; break; } // Both conditions met
  }

  // Condition 3 — No Preemption: always true in this model; resources cannot be forcibly reclaimed
  const noPreemption = true;

  // Condition 4 — Circular Wait: detected by finding cycles in the wait-for graph
  const { hasCycle, cycles } = detectCircularWait(alloc, need, avail, processes, resources);

  return {
    mutualExclusion, // Whether Condition 1 is present
    holdAndWait,     // Whether Condition 2 is present
    noPreemption,    // Whether Condition 3 is present (always true)
    circularWait: hasCycle, // Whether Condition 4 is present (cycle found)
    cycles,          // Array of detected cycle paths (e.g. [P0, P1, P0])
  };
}

// ─── Circular Wait / Cycle Detection ────────────────────────────────────────
// Internal function that builds a wait-for graph and runs DFS to find cycles
function detectCircularWait(alloc, need, avail, processes, resources) {
  // Build wait-for graph adjacency list using Sets (each process maps to a set of processes it waits on)
  const waitFor = Array.from({ length: processes }, () => new Set());
  
  for (let i = 0; i < processes; i++) {
    for (let j = 0; j < resources; j++) {
      if (need[i][j] > avail[j]) {
        // Process i needs resource j but it's not freely available — find who holds it
        for (let k = 0; k < processes; k++) {
          if (k !== i && alloc[k][j] > 0) {
            waitFor[i].add(k); // P_i is waiting on P_k (which holds resource j)
          }
        }
      }
    }
  }

  // Depth-First Search (DFS) to detect back-edges (cycles)
  const cycles = [];                                    // Stores all discovered cycles
  const visited = new Array(processes).fill(0);         // 0=White(unvisited), 1=Gray(in-stack), 2=Black(done)
  const path = [];                                      // Tracks the current DFS recursion path

  function dfs(node) {
    visited[node] = 1; // Mark node as Gray (currently being explored)
    path.push(node);   // Add node to the current path
    for (const neighbor of waitFor[node]) {
      if (visited[neighbor] === 1) {
        // Back-edge found — neighbor is Gray, meaning it's already in the current path → cycle!
        const cycleStart = path.indexOf(neighbor); // Find where the cycle begins in path
        const cycle = path.slice(cycleStart);      // Extract only the cycle portion
        cycles.push([...cycle, neighbor]);          // Record the cycle (append start node to close the loop)
      } else if (visited[neighbor] === 0) {
        dfs(neighbor); // Neighbor is White — recurse into it
      }
      // If neighbor is Black (visited=2), it was already fully explored with no cycle — skip it
    }
    path.pop();        // Remove node from path as we backtrack
    visited[node] = 2; // Mark node as Black (fully explored)
  }

  // Launch DFS from every unvisited node to handle disconnected graph components
  for (let i = 0; i < processes; i++) {
    if (visited[i] === 0) dfs(i);
  }

  return { hasCycle: cycles.length > 0, cycles, waitFor }; // Return cycle detection results
}

// ─── Resource Utilization ───────────────────────────────────────────────────
// Calculates the percentage of each resource type currently allocated across all processes
export function calcResourceUtilization(allocation, totalResources, processes, resources) {
  const total = totalResources.map(Number); // Parse total resources
  const utilization = []; // Array to hold utilization metrics per resource
  
  for (let j = 0; j < resources; j++) {
    let allocated = 0;
    for (let i = 0; i < processes; i++) allocated += Number(allocation[i][j]); // Sum all allocations for resource j
    const percentage = total[j] > 0 ? Math.round((allocated / total[j]) * 100) : 0; // Calculate % (guard divide-by-zero)
    utilization.push({ resource: `R${j}`, allocated, total: total[j], percentage }); // Store metric object
  }
  
  return utilization; // Each entry: { resource, allocated, total, percentage }
}

// ─── Waiting Dependencies ───────────────────────────────────────────────────
// Builds a human-readable list of all process-to-process waiting relationships
export function calcWaitingDependencies(allocation, maximum, totalResources, processes, resources) {
  const alloc = allocation.map(r => r.map(Number)); // Parse allocation
  const max = maximum.map(r => r.map(Number));       // Parse maximum
  const total = totalResources.map(Number);           // Parse total resources
  const need = calcNeed(alloc, max, processes, resources);     // Compute Need matrix
  const avail = calcAvailable(total, alloc, processes, resources); // Compute Available vector

  const dependencies = []; // Stores each discovered waiting relationship
  
  for (let i = 0; i < processes; i++) {
    for (let j = 0; j < resources; j++) {
      if (need[i][j] > avail[j]) {
        // P_i needs more of resource j than is currently available
        for (let k = 0; k < processes; k++) {
          if (k !== i && alloc[k][j] > 0) {
            // P_k is holding some of resource j that P_i is waiting for
            dependencies.push({
              waiting: `P${i}`,      // Process that is blocked
              waitingFor: `P${k}`,   // Process that holds the needed resource
              resource: `R${j}`,     // The resource causing the wait
              needed: need[i][j],    // How many units P_i still needs
              held: alloc[k][j],     // How many units P_k holds
            });
          }
        }
      }
    }
  }

  const waitingProcesses = [...new Set(dependencies.map(d => d.waiting))]; // Unique list of waiting processes
  return { dependencies, waitingCount: waitingProcesses.length }; // Return dependency table and count
}

// ─── Full Smart Analysis ────────────────────────────────────────────────────
// Master orchestrator that runs all analysis steps and returns a unified result object
export function runSmartAnalysis({ processes, resources, totalResources, allocation, maximum }) {
  const p = Number(processes); // Convert to number for all calculations
  const r = Number(resources); // Convert to number for all calculations

  // Step 1: Validate all inputs — stop immediately if any error is found
  const errors = validateInputs({ processes: p, resources: r, totalResources, allocation, maximum });
  if (errors.length > 0) return { valid: false, errors }; // Return errors without running algorithms

  // Step 2: Check the four Coffman deadlock conditions
  const conditions = checkDeadlockConditions(allocation, maximum, totalResources, p, r);

  // Step 3: Compute resource utilization percentages for each resource type
  const utilization = calcResourceUtilization(allocation, totalResources, p, r);

  // Step 4: Build the waiting dependency table (who waits on whom)
  const waiting = calcWaitingDependencies(allocation, maximum, totalResources, p, r);

  // Step 5: Extract circular dependency results (already computed inside conditions)
  const circularDep = { hasCycle: conditions.circularWait, cycles: conditions.cycles };

  // Step 6: Run Banker's safety algorithm to find safe sequence and step records
  const bankers = bankersAlgorithm(allocation, maximum, totalResources, p, r);

  // Step 7: Classify the system state based on the safety algorithm results
  let systemState;
  if (bankers.isSafe) {
    systemState = 'SAFE';            // All processes can complete — system is safe
  } else if (bankers.steps.length === 0) {
    systemState = 'DEADLOCKED';      // No process could run at all from the start — fully deadlocked
  } else {
    systemState = 'UNSAFE';          // Some processes ran but system got stuck — unsafe but not yet deadlocked
  }

  // Step 8: Build recommendation text and target Quick Mode tab based on system state
  let recommendation;
  if (systemState === 'SAFE') {
    recommendation = {
      action: 'No action required',                                              // Title shown in recommendation card
      detail: 'The system is in a safe state. All processes can complete successfully.', // Detail text
      mode: null,                                                                // No Quick Mode link needed
    };
  } else if (systemState === 'UNSAFE') {
    recommendation = {
      action: 'Use Banker\'s Algorithm (Deadlock Avoidance)',                    // Title for unsafe recommendation
      detail: 'The system is unsafe — future deadlock is possible.',              // Detail text
      mode: 'Quick Mode → Tab 1',                                               // Links to Banker's Tab in Quick Mode
    };
  } else {
    recommendation = {
      action: 'Use RAG + Recovery (Deadlock Detection & Recovery)',               // Title for deadlocked recommendation
      detail: 'The system is deadlocked — processes cannot proceed. Use detection and recovery to resolve.', // Detail text
      mode: 'Quick Mode → Tab 2',                                               // Links to Detection Tab in Quick Mode
    };
  }

  // Return the complete merged result object for display in SmartMode.jsx
  return {
    valid: true,         // Input was valid
    conditions,          // Coffman condition check results
    utilization,         // Resource utilization percentages
    waiting,             // Waiting dependency table
    circularDep,         // Cycle detection results
    bankers,             // Safety algorithm result (isSafe, safeSequence, steps)
    systemState,         // 'SAFE' | 'UNSAFE' | 'DEADLOCKED'
    recommendation,      // Action text and target Quick Mode tab
    timestamp: new Date().toISOString(), // UTC timestamp of when analysis was run
  };
}
