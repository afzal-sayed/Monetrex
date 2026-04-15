import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useAppContext } from './context/useAppContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Auth } from './pages/Auth';
import { Analytics } from './pages/Analytics';
import { Family } from './pages/Family';
import { Settings } from './pages/Settings';
import { Toast } from './components/ui/Toast';

// ─── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('React error boundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-dark p-8">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
            <p className="text-slate-400 text-sm">{this.state.error?.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Route Guards ────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, authReady } = useAppContext();
  if (!authReady) return null; // Wait for token validation
  return user ? children : <Navigate to="/auth" replace />;
};

const AuthRoute = ({ children }) => {
  const { user, authReady } = useAppContext();
  if (!authReady) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <div className="bg-bg-light dark:bg-bg-dark min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
              <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard"    element={<Dashboard />}    />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/analytics"    element={<Analytics />}    />
                <Route path="/family"       element={<Family />}       />
                <Route path="/settings"     element={<Settings />}     />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
          <Toast />
        </div>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
