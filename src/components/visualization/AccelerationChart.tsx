import React from 'react';
import { useCPRData } from '../../hooks/useCPRData';

interface AccelerationChartProps {
  mode?: 'demo' | 'empty' | 'live';
  dataBuffer?: number[];
  currentG?: number;
  peakG?: number;
  height?: number;
  className?: string;
  title?: string;
  showStats?: boolean;
}

export const AccelerationChart: React.FC<AccelerationChartProps> = ({
  mode = 'demo',
  dataBuffer,
  currentG,
  peakG,
  height = 140,
  className = '',
  title = 'Live Motion Waveform',
  showStats = true,
}) => {
  // If dataBuffer is not explicitly provided, subscribe to useCPRData hook
  const telemetry = useCPRData();
  const buffer = dataBuffer ?? telemetry.data?.waveformBuffer ?? [];
  const instantaneousG = currentG ?? telemetry.data?.acceleration ?? 1.0;
  const highestPeakG = peakG ?? telemetry.data?.peakAcceleration ?? 6.65;

  if (mode === 'empty') {
    return (
      <div
        className={`w-full rounded-lg border border-dashed border-border bg-canvas-secondary/30 flex flex-col items-center justify-center p-6 text-center ${className}`}
        style={{ minHeight: `${height}px` }}
      >
        <div className="font-mono text-xs font-semibold text-content-secondary uppercase tracking-wider mb-1">
          {title}
        </div>
        <p className="text-xs text-content-muted font-mono">
          Waiting for glove sensor telemetry...
        </p>
      </div>
    );
  }

  // Dimensions of SVG canvas
  const svgWidth = 500;
  const svgHeight = 120;
  const minG = 0.0;
  const maxG = 8.0;

  // Coordinate mapping function: maps g value to y coordinate
  // 0.0g -> svgHeight - 12 (bottom)
  // 8.0g -> 12 (top)
  const mapY = (val: number) => {
    const clamped = Math.max(minG, Math.min(maxG, val));
    const normalized = (clamped - minG) / (maxG - minG);
    return (svgHeight - 14) - (normalized * (svgHeight - 28));
  };

  // Build SVG path from buffer
  let pathD = '';
  if (buffer.length > 0) {
    const stepX = svgWidth / (buffer.length - 1);
    pathD = buffer.reduce((acc, val, idx) => {
      const x = Number((idx * stepX).toFixed(1));
      const y = Number(mapY(val).toFixed(1));
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }

  // Y-coordinates for reference lines
  const y6g = mapY(6.0);
  const y4g = mapY(4.0);
  const y2g = mapY(2.0);
  const y1g = mapY(1.0); // Baseline gravity
  const y0g = mapY(0.0);

  return (
    <div className={`w-full rounded-lg border border-border bg-white/95 p-4 shadow-subtle ${className}`}>
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-content-secondary border-b border-border/60 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          <span className="font-semibold text-content-primary uppercase tracking-wide">{title}</span>
          <span className="text-border">|</span>
          <span className="text-content-muted uppercase">MPU6050 Acceleration</span>
        </div>

        {showStats && (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="text-content-muted">Current:</span>
              <span className="font-bold text-content-primary font-mono">{instantaneousG.toFixed(2)} g</span>
            </span>
            <span className="text-border">|</span>
            <span className="inline-flex items-center gap-1">
              <span className="text-content-muted">Peak:</span>
              <span className="font-bold text-brand-green font-mono">{highestPeakG.toFixed(2)} g</span>
            </span>
          </div>
        )}
      </div>

      {/* SVG Waveform Graphic */}
      <div className="relative w-full overflow-hidden" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full select-none"
        >
          <defs>
            {/* Subtle glow filter */}
            <filter id="cpr-wave-subtle-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Reference Grid & Threshold Lines */}
          {/* 6.0g mark */}
          <line x1="0" y1={y6g} x2={svgWidth} y2={y6g} stroke="#ECE8DE" strokeWidth="1" strokeDasharray="3 3" />
          <text x={svgWidth - 6} y={y6g - 3} textAnchor="end" className="font-mono text-[7px] fill-content-muted/80">6.0g</text>

          {/* 4.0g mark */}
          <line x1="0" y1={y4g} x2={svgWidth} y2={y4g} stroke="#ECE8DE" strokeWidth="1" strokeDasharray="3 3" />
          <text x={svgWidth - 6} y={y4g - 3} textAnchor="end" className="font-mono text-[7px] fill-content-muted/80">4.0g</text>

          {/* 2.0g mark */}
          <line x1="0" y1={y2g} x2={svgWidth} y2={y2g} stroke="#ECE8DE" strokeWidth="1" strokeDasharray="3 3" />

          {/* 1.0g Resting Baseline (Earth Gravity) */}
          <line x1="0" y1={y1g} x2={svgWidth} y2={y1g} stroke="#D8D4C9" strokeWidth="1.2" />
          <text x="6" y={y1g - 3} className="font-mono text-[7px] font-semibold fill-content-secondary">1.0g Baseline</text>

          {/* 0.0g Trough line */}
          <line x1="0" y1={y0g} x2={svgWidth} y2={y0g} stroke="#ECE8DE" strokeWidth="0.8" />

          {/* Acceleration Waveform Path (Dual layer for restrained instrumentation glow) */}
          {pathD && (
            <>
              {/* Outer soft glow stroke */}
              <path
                d={pathD}
                fill="none"
                stroke="#173F35"
                strokeWidth="3.2"
                strokeOpacity="0.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Core crisp dark-green line */}
              <path
                d={pathD}
                fill="none"
                stroke="#173F35"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Lead sweeping indicator on newest point (rightmost) */}
          {buffer.length > 0 && (
            <circle
              cx={svgWidth}
              cy={mapY(buffer[buffer.length - 1])}
              r="2.5"
              fill="#173F35"
              className="animate-pulse"
            />
          )}
        </svg>
      </div>

      {/* Chart Footer Scales */}
      <div className="flex items-center justify-between text-[10px] font-mono text-content-muted border-t border-border/50 pt-2 mt-1">
        <span>-2.5s</span>
        <span>-1.5s</span>
        <span>-0.5s</span>
        <span className="font-medium text-brand-green">NOW (LIVE BUFFER)</span>
      </div>
    </div>
  );
};
