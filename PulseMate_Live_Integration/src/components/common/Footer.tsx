import React from 'react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const links = [
    { label: 'Overview', path: '/dashboard' },
    { label: 'Live Monitor', path: '/live' },
    { label: 'Sessions', path: '/sessions' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Device', path: '/device' },
    { label: 'About', path: '/about' },
  ];

  return (
    <footer className="border-t border-border bg-canvas-secondary/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-border/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-content-primary tracking-tight text-base">
                PULSEMATE
              </span>
            </div>
            <p className="text-xs text-content-secondary mt-1">
              A Touch to Revive
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((link) => (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className="text-xs text-content-secondary hover:text-content-primary transition-colors font-medium"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-content-secondary">
          <p>
            Motion-based CPR feedback prototype.
          </p>
          <p className="text-[11px] text-content-muted">
            Designed for better practice and better performance.
          </p>
        </div>
      </div>
    </footer>
  );
};
