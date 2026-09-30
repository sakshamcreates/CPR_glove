import React from 'react';
import { ConnectionState, CPRStatus } from '../../types/cpr';

interface StatusIndicatorProps {
  status?: ConnectionState;
  cprStatus?: CPRStatus;
  label?: string;
  variant?: 'connection' | 'cpr' | 'demo';
  size?: 'sm' | 'md';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status = 'OFFLINE',
  cprStatus,
  label,
  variant = 'connection',
  size = 'md',
}) => {
  if (variant === 'demo' || status === 'DEMO') {
    return (
      <span className={`inline-flex items-center gap-1.5 ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} font-mono font-medium tracking-wide uppercase bg-canvas-muted text-content-secondary border border-border rounded`}>
        <span className="w-1.5 h-1.5 rounded-full bg-status-warning animate-pulse" />
        {label || 'DEMO MODE'}
      </span>
    );
  }

  if (variant === 'cpr' && cprStatus) {
    const config: Record<string, { text: string; bg: string; textCol: string; dot: string }> = {
      OPTIMAL: {
        text: 'OPTIMAL',
        bg: 'bg-emerald-50',
        textCol: 'text-status-success',
        dot: 'bg-status-success',
      },
      SLOW: {
        text: 'TOO SLOW',
        bg: 'bg-amber-50',
        textCol: 'text-status-warning',
        dot: 'bg-status-warning',
      },
      TOO_SLOW: {
        text: 'TOO SLOW',
        bg: 'bg-amber-50',
        textCol: 'text-status-warning',
        dot: 'bg-status-warning',
      },
      FAST: {
        text: 'TOO FAST',
        bg: 'bg-amber-50',
        textCol: 'text-status-warning',
        dot: 'bg-status-warning',
      },
      TOO_FAST: {
        text: 'TOO FAST',
        bg: 'bg-amber-50',
        textCol: 'text-status-warning',
        dot: 'bg-status-warning',
      },
      TILT: {
        text: 'ADJUST ANGLE',
        bg: 'bg-red-50',
        textCol: 'text-status-danger',
        dot: 'bg-status-danger',
      },
      POSITION_ALERT: {
        text: 'ADJUST ANGLE',
        bg: 'bg-red-50',
        textCol: 'text-status-danger',
        dot: 'bg-status-danger',
      },
      PAUSED: {
        text: 'PAUSED',
        bg: 'bg-canvas-muted',
        textCol: 'text-content-secondary',
        dot: 'bg-content-muted',
      },
      PAUSE_WARNING: {
        text: 'PAUSE DETECTED',
        bg: 'bg-red-50',
        textCol: 'text-status-danger',
        dot: 'bg-status-danger',
      },
      CRITICAL: {
        text: 'CRITICAL',
        bg: 'bg-red-50',
        textCol: 'text-status-danger',
        dot: 'bg-status-danger',
      },
    };

    const current = config[cprStatus] || config.OPTIMAL;

    return (
      <span className={`inline-flex items-center gap-1.5 ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} font-mono font-medium tracking-wider uppercase ${current.bg} ${current.textCol} border border-border rounded`}>
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
        {label || current.text}
      </span>
    );
  }

  // Connection variant (Default)
  const isOnline = status === 'CONNECTED';
  const isPending = status === 'CONNECTING' || status === 'RECONNECTING' || status === 'CALIBRATING';
  const isError = status === 'ERROR';

  let defaultLabel = 'DISCONNECTED';
  if (isOnline) defaultLabel = 'DEVICE CONNECTED';
  else if (status === 'CONNECTING') defaultLabel = 'CONNECTING...';
  else if (status === 'RECONNECTING') defaultLabel = 'RECONNECTING...';
  else if (status === 'ERROR') defaultLabel = 'CONNECTION ERROR';
  else if (status === 'OFFLINE' || status === 'DISCONNECTED') defaultLabel = 'DISCONNECTED';

  return (
    <span className={`inline-flex items-center gap-1.5 ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} font-mono font-medium tracking-wide text-content-secondary bg-canvas-secondary border border-border rounded`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isOnline
            ? 'bg-status-success'
            : isPending
            ? 'bg-status-warning animate-pulse'
            : isError
            ? 'bg-status-danger'
            : 'bg-content-muted'
        }`}
      />
      {label || defaultLabel}
    </span>
  );
};
