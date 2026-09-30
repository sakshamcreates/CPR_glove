import React from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  index?: string;
  align?: 'left' | 'center';
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  index,
  align = 'left',
  className = '',
}) => {
  return (
    <div
      className={`mb-8 sm:mb-12 ${
        align === 'center' ? 'text-center mx-auto max-w-2xl' : 'max-w-3xl'
      } ${className}`}
    >
      <div className="flex items-center gap-3 mb-2">
        {index && (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-canvas-muted text-content-secondary rounded border border-border">
            {index}
          </span>
        )}
        {eyebrow && (
          <span className="text-xs font-mono font-medium tracking-wider uppercase text-brand-green">
            {eyebrow}
          </span>
        )}
      </div>

      <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-content-primary leading-tight">
        {title}
      </h2>

      {description && (
        <p className="mt-3 text-base sm:text-lg text-content-secondary leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
