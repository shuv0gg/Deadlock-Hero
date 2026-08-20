import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SmartMode from './pages/SmartMode';
import QuickMode from './pages/QuickMode';
import CompareModes from './pages/CompareModes';
import LearningCenter from './pages/LearningCenter';
import About from './pages/About';
import VisualMode from './pages/VisualMode';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e1b4b',
            color: '#e2e8f0',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '12px',
            backdropFilter: 'blur(12px)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1e1b4b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1e1b4b' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="smart-mode" element={<SmartMode />} />
          <Route path="quick-mode" element={<QuickMode />} />
          <Route path="compare" element={<CompareModes />} />
          <Route path="learn" element={<LearningCenter />} />
          <Route path="visual-mode" element={<VisualMode />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
