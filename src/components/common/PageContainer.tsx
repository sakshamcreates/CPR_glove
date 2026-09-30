import React from 'react';

interface PageContainerProps {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'normal' | 'wide' | 'full';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  eyebrow,
  actions,
  children,
  maxWidth = 'normal',
}) => {
  const widthClasses = {
    normal: 'max-w-6xl',
    wide: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <main className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 ${widthClasses[maxWidth]}`}>
      {(title || eyebrow || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-8 border-b border-border">
          <div>
            {eyebrow && (
              <span className="font-mono text-xs font-semibold tracking-wider text-brand-green uppercase block mb-1">
                {eyebrow}
              </span>
            )}
            {title && (
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-content-secondary max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </main>
  );
};
