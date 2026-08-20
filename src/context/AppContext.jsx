import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const STORAGE_KEY = 'deadlock-hero-data';

const defaultState = {
  analyses: [],
  stats: { total: 0, safe: 0, unsafe: 0, deadlocked: 0 },
};

export function AppProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultState;
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* ignore quota errors */ }
  }, [state]);

  const addAnalysis = (analysis) => {
    setState(prev => {
      const newAnalyses = [analysis, ...prev.analyses].slice(0, 50);
      const stats = {
        total: prev.stats.total + 1,
        safe: prev.stats.safe + (analysis.systemState === 'SAFE' ? 1 : 0),
        unsafe: prev.stats.unsafe + (analysis.systemState === 'UNSAFE' ? 1 : 0),
        deadlocked: prev.stats.deadlocked + (analysis.systemState === 'DEADLOCKED' ? 1 : 0),
      };
      return { analyses: newAnalyses, stats };
    });
  };

  const clearHistory = () => setState(defaultState);

  return (
    <AppContext.Provider value={{ ...state, addAnalysis, clearHistory }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
