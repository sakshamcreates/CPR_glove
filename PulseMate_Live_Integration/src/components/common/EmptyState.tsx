import React from 'react';
import { Button } from './Button';
import { LucideIcon, Radio } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  badgeText?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Radio,
  title,
  description,
  badgeText,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="border border-dashed border-border-strong/70 rounded-xl p-8 sm:p-12 text-center bg-canvas-secondary/40 max-w-2xl mx-auto my-6">
      <div className="w-12 h-12 mx-auto rounded-lg bg-canvas-muted flex items-center justify-center text-content-secondary border border-border mb-4">
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>

      {badgeText && (
        <div className="mb-3">
          <span className="inline-block font-mono text-xs font-medium px-2.5 py-0.5 bg-canvas-secondary text-content-secondary border border-border rounded">
            {badgeText}
          </span>
        </div>
      )}

      <h3 className="text-lg font-semibold text-content-primary mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-content-secondary max-w-md mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="md" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
