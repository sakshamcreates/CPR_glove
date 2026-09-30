import { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMonitorPage } from './pages/LiveMonitorPage';
import { SessionsPage } from './pages/SessionsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DevicePage } from './pages/DevicePage';
import { AboutPage } from './pages/AboutPage';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPath) {
      case '/dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case '/live':
        return <LiveMonitorPage onNavigate={handleNavigate} />;
      case '/sessions':
        return <SessionsPage onNavigate={handleNavigate} />;
      case '/analytics':
        return <AnalyticsPage onNavigate={handleNavigate} />;
      case '/device':
        return <DevicePage />;
      case '/about':
        return <AboutPage />;
      case '/':
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas-primary text-content-primary">
      <Navbar currentPath={currentPath} onNavigate={handleNavigate} />
      <div className="flex-1">
        {renderPage()}
      </div>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
