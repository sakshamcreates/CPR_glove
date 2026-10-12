import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green/20 select-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-md gap-2',
    lg: 'text-base px-5 py-3 rounded-lg gap-2.5',
  };

  const variantClasses = {
    primary: 'bg-brand-green text-white hover:bg-brand-deep active:bg-brand-deep shadow-subtle border border-transparent',
    secondary: 'bg-canvas-secondary text-content-primary hover:bg-canvas-muted active:bg-canvas-muted border border-border shadow-subtle',
    outline: 'bg-transparent text-content-primary border border-border hover:bg-canvas-secondary active:bg-canvas-muted',
    ghost: 'bg-transparent text-content-secondary hover:text-content-primary hover:bg-canvas-secondary/70 border border-transparent',
    danger: 'bg-brand-burgundy text-white hover:bg-[#682020] active:bg-[#541a1a] shadow-subtle border border-transparent',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
