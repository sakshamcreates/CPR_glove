import React from 'react';
import { MetricCard } from '../common/MetricCard';
import { StatusIndicator } from '../common/StatusIndicator';
import { AccelerationChart } from './AccelerationChart';
import { useCPRData } from '../../hooks/useCPRData';
import { Activity, ShieldCheck, Compass, Sparkles } from 'lucide-react';

export const DashboardMockup: React.FC = () => {
  const { data } = useCPRData();

  const cprRate = data?.cprRate ?? 112;
  const compressionCount = data?.compressionCount ?? 18;
  const targetCount = data?.targetCount ?? 30;
  const tilt = data?.tilt ?? 14.5;
  const status = data?.status ?? 'OPTIMAL';

  return (
    <div className="w-full rounded-xl border border-border bg-white shadow-elevated overflow-hidden">
      {/* Top Header */}
      <div className="bg-canvas-secondary/80 px-4 sm:px-6 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse" />
            <span className="font-mono text-xs font-bold text-content-primary tracking-tight">
              LIVE MONITOR PREVIEW
            </span>
          </div>
          <span className="text-content-muted text-xs">|</span>
          <span className="font-mono text-[11px] text-content-secondary">
            PULSEMATE-01
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <StatusIndicator variant="cpr" cprStatus={status} size="sm" />
          <StatusIndicator variant="demo" label="DEMO SIGNAL" size="sm" />
        </div>
      </div>

      {/* Main Metric Grid */}
      <div className="p-4 sm:p-6 bg-canvas-primary/30">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* CPR Rate */}
          <MetricCard
            label="CPR RATE"
            value={cprRate}
            unit="/min"
            target="100–120 Target"
            highlight={true}
            statusBadge={
              <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-status-success">
                <Activity className="w-3 h-3" /> {status}
              </span>
            }
          />

          {/* Compression Count */}
          <MetricCard
            label="COMPRESSIONS"
            value={`${compressionCount} / ${targetCount}`}
            statusBadge={
              <span className="flex items-center gap-1 text-[11px] font-mono text-content-secondary">
                <ShieldCheck className="w-3 h-3 text-brand-green" /> CYCLE {data?.cycle ?? 1}
              </span>
            }
          />

          {/* Hand Position */}
          <MetricCard
            label="HAND TILT"
            value={`${tilt.toFixed(1)}°`}
            statusBadge={
              <span className="flex items-center gap-1 text-[11px] font-mono text-status-success">
                <Compass className="w-3 h-3" /> ALIGNED
              </span>
            }
          />

          {/* Motion */}
          <MetricCard
            label="PEAK ACCEL"
            value={`${(data?.peakAcceleration ?? 6.65).toFixed(2)} g`}
            statusBadge={
              <span className="flex items-center gap-1 text-[11px] font-mono text-brand-green">
                <Sparkles className="w-3 h-3" /> DYNAMIC
              </span>
            }
          />
        </div>

        {/* Live Motion Waveform */}
        <div>
          <AccelerationChart
            mode="live"
            height={110}
            title="Live Motion"
            dataBuffer={data?.waveformBuffer}
            currentG={data?.acceleration}
            peakG={data?.peakAcceleration}
          />
        </div>
      </div>
    </div>
  );
};
