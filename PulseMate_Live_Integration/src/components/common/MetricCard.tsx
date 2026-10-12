import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  target?: string;
  statusBadge?: React.ReactNode;
  hint?: string;
  className?: string;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  target,
  statusBadge,
  hint,
  className = '',
  highlight = false,
}) => {
  return (
    <div
      className={`p-4 sm:p-5 rounded-lg border transition-all ${
        highlight
          ? 'bg-white border-brand-green/30 shadow-subtle'
          : 'bg-white/80 border-border shadow-subtle hover:border-border-strong'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-mono font-medium tracking-wider uppercase text-content-secondary">
          {label}
        </span>
        {statusBadge}
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-3xl sm:text-4xl font-mono font-semibold tracking-tight text-content-primary">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-content-secondary font-medium">
            {unit}
          </span>
        )}
      </div>

      {(target || hint) && (
        <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-content-secondary">
          {target && <span>Target: {target}</span>}
          {hint && <span className="text-content-muted">{hint}</span>}
        </div>
      )}
    </div>
  );
};
