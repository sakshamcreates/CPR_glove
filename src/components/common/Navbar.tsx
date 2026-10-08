import React, { useState } from 'react';
import { StatusIndicator } from './StatusIndicator';
import { Menu, X, Activity } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Overview', path: '/dashboard' },
    { label: 'Live Monitor', path: '/live' },
    { label: 'Sessions', path: '/sessions' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Device', path: '/device' },
  ];

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-canvas-primary/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => handleNav('/')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-7 h-7 rounded bg-brand-green flex items-center justify-center text-white text-xs font-mono font-bold tracking-tight shadow-sm">
              <Activity className="w-4 h-4 text-emerald-300 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-content-primary text-sm leading-tight group-hover:text-brand-green transition-colors">
                PULSEMATE
              </span>
              <span className="text-[10px] text-content-secondary tracking-normal font-mono hidden sm:inline">
                A TOUCH TO REVIVE
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    isActive
                      ? 'bg-canvas-secondary text-brand-green font-semibold shadow-subtle border border-border/80'
                      : 'text-content-secondary hover:text-content-primary hover:bg-canvas-secondary/50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Status Indicator & About Link */}
        <div className="hidden sm:flex items-center gap-4">
          <StatusIndicator variant="demo" label="DEMO MODE" size="sm" />
          <div className="h-4 w-[1px] bg-border" />
          <button
            onClick={() => handleNav('/about')}
            className={`text-xs font-medium transition-colors ${
              currentPath === '/about'
                ? 'text-brand-green font-semibold'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            About
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <StatusIndicator variant="demo" label="DEMO" size="sm" />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-content-secondary hover:text-content-primary focus:outline-none rounded hover:bg-canvas-secondary"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border bg-canvas-secondary/95 px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`block w-full text-left px-3 py-2 text-sm font-medium rounded transition-colors ${
                currentPath === item.path
                  ? 'bg-canvas-primary text-brand-green font-semibold border border-border'
                  : 'text-content-secondary hover:text-content-primary hover:bg-canvas-primary/50'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 mt-2 border-t border-border">
            <button
              onClick={() => handleNav('/about')}
              className={`block w-full text-left px-3 py-2 text-sm font-medium rounded transition-colors ${
                currentPath === '/about'
                  ? 'bg-canvas-primary text-brand-green font-semibold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              About System & Architecture
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
