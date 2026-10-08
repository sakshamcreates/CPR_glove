import React from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { MetricCard } from '../components/common/MetricCard';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { useSession } from '../hooks/useSession';
import {
  BarChart3,
  Activity,
  Compass,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

interface AnalyticsPageProps {
  onNavigate: (path: string) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onNavigate }) => {
  const { sessions } = useSession();

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const hasSessions = sessions.length > 0;

  // Aggregate computations
  const sessionCount = sessions.length;
  const totalCompressions = sessions.reduce((acc, s) => acc + s.totalCompressions, 0);
  const totalDurationSeconds = sessions.reduce((acc, s) => acc + s.duration, 0);
  const averageRate = hasSessions
    ? Math.round(sessions.reduce((acc, s) => acc + s.averageRate, 0) / sessionCount)
    : 0;
  const targetCompliancePct = hasSessions
    ? Math.round(sessions.reduce((acc, s) => acc + s.targetRangePercentage, 0) / sessionCount)
    : 0;
  const averageTilt = hasSessions
    ? Number((sessions.reduce((acc, s) => acc + s.averageTilt, 0) / sessionCount).toFixed(1))
    : 0;
  const maxPeakAcceleration = hasSessions
    ? Math.max(...sessions.map((s) => s.peakAcceleration))
    : 0;

  // Chart data: chronological order (oldest to newest, max 10 sessions)
  const chartSessions = [...sessions].reverse().slice(-10);

  return (
    <PageContainer
      eyebrow="ANALYTICS"
      title="Performance Analytics"
      subtitle="Computed metrics on rhythm accuracy, hand positioning, and compression consistency from recorded sessions."
      actions={
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('/live')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Start a Session
          </Button>
        </div>
      }
    >
      {!hasSessions ? (
        /* Honest Empty State when zero sessions recorded */
        <div className="bg-white rounded-xl border border-border p-8 sm:p-14 shadow-subtle mb-10 text-center">
          <EmptyState
            icon={BarChart3}
            badgeText="NO RECORDINGS"
            title="Complete a session to see your performance analytics."
            description="PULSEMATE calculates cadence accuracy, compliance in the 100–120 CPM window, hand tilt, and motion consistency dynamically from your recorded runs."
            actionLabel="Open Live Monitor"
            onAction={() => onNavigate('/live')}
            secondaryActionLabel="Session History"
            onSecondaryAction={() => onNavigate('/sessions')}
          />
        </div>
      ) : (
        /* Computed Metrics HUD */
        <div className="space-y-8 mb-10">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="AVG CPR RATE"
              value={averageRate}
              unit="/min"
              highlight={true}
              target="100–120 Target"
              statusBadge={
                <span className="font-mono text-xs font-semibold text-brand-green">
                  {averageRate >= 100 && averageRate <= 120 ? 'OPTIMAL' : 'VARIES'}
                </span>
              }
              hint="Across recorded runs"
            />

            <MetricCard
              label="TARGET COMPLIANCE"
              value={`${targetCompliancePct}%`}
              statusBadge={
                <span className="flex items-center gap-1 text-[11px] font-mono text-status-success font-semibold">
                  <ShieldCheck className="w-3 h-3" /> IN ZONE
                </span>
              }
              hint="100–120 CPM window"
            />

            <MetricCard
              label="TOTAL COMPRESSIONS"
              value={totalCompressions}
              statusBadge={
                <span className="font-mono text-xs text-content-secondary font-medium">
                  {sessionCount} {sessionCount === 1 ? 'RUN' : 'RUNS'}
                </span>
              }
              hint={`Total time: ${formatDuration(totalDurationSeconds)}`}
            />

            <MetricCard
              label="AVERAGE TILT"
              value={`${averageTilt}°`}
              statusBadge={
                <span className="flex items-center gap-1 text-[11px] font-mono text-status-success font-semibold">
                  <Compass className="w-3 h-3" /> ALIGNED
                </span>
              }
              hint="Palm orientation"
            />
          </div>

          {/* Restrained Performance Trend Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* CPR Cadence Trend Chart */}
            <div className="lg:col-span-8 p-6 rounded-xl border border-border bg-white shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-content-primary">
                      CPR Rate Trend by Session
                    </h3>
                    <p className="text-xs text-content-secondary">
                      Average compression cadence per completed run compared to the 100–120 CPM guideline.
                    </p>
                  </div>
                  <span className="font-mono text-xs text-content-muted">
                    LAST {chartSessions.length} SESSIONS
                  </span>
                </div>

                {/* SVG Bar / Trend Chart */}
                <div className="h-44 w-full relative">
                  <svg viewBox="0 0 500 140" preserveAspectRatio="none" className="w-full h-full">
                    {/* Target band (100 to 120 CPM) */}
                    {/* In scale: 60 CPM = y 130, 140 CPM = y 10. Range 80 CPM across 120 px. 1 CPM = 1.5 px */}
                    {/* 120 CPM -> y = 130 - (60 * 1.5) = 40. 100 CPM -> y = 130 - (40 * 1.5) = 70 */}
                    <rect x="0" y="40" width="500" height="30" fill="#173F35" fillOpacity="0.05" />
                    <line x1="0" y1="40" x2="500" y2="40" stroke="#173F35" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
                    <text x="495" y="36" textAnchor="end" className="font-mono text-[7px] fill-brand-green font-semibold">120 CPM Max</text>

                    <line x1="0" y1="70" x2="500" y2="70" stroke="#173F35" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
                    <text x="495" y="67" textAnchor="end" className="font-mono text-[7px] fill-brand-green font-semibold">100 CPM Min</text>

                    {/* Baseline */}
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#D8D4C9" strokeWidth="1" />

                    {/* Bars / Session Data Points */}
                    {chartSessions.map((s, idx) => {
                      const totalBars = chartSessions.length;
                      const slotWidth = 460 / totalBars;
                      const x = 30 + idx * slotWidth + slotWidth * 0.25;
                      const barW = Math.min(28, slotWidth * 0.5);

                      // Rate mapping (60 CPM to 140 CPM)
                      const clampedRate = Math.max(60, Math.min(140, s.averageRate));
                      const barH = ((clampedRate - 60) / 80) * 100;
                      const y = 120 - barH;

                      const isInTarget = s.averageRate >= 100 && s.averageRate <= 120;

                      return (
                        <g key={s.id}>
                          <rect
                            x={x}
                            y={y}
                            width={barW}
                            height={barH}
                            rx="3"
                            fill={isInTarget ? '#173F35' : '#B7791F'}
                            className="transition-all hover:opacity-85"
                          />
                          <text
                            x={x + barW / 2}
                            y={y - 4}
                            textAnchor="middle"
                            className="font-mono text-[8px] font-bold fill-content-primary"
                          >
                            {s.averageRate}
                          </text>
                          <text
                            x={x + barW / 2}
                            y={132}
                            textAnchor="middle"
                            className="font-mono text-[7px] fill-content-muted"
                          >
                            S{idx + 1}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-mono text-content-secondary">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-brand-green" /> In target (100–120)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-status-warning" /> Outside target
                  </span>
                </div>
                <span>Peak Acceleration: {maxPeakAcceleration.toFixed(2)} g</span>
              </div>
            </div>

            {/* Target Range Compliance & Tilt Summary */}
            <div className="lg:col-span-4 space-y-4">
              {/* Compliance Card */}
              <div className="p-5 rounded-xl border border-border bg-white shadow-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-content-primary uppercase">
                    CADENCE ACCURACY
                  </span>
                  <span className="font-mono text-sm font-bold text-status-success">
                    {targetCompliancePct}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-canvas-muted overflow-hidden">
                  <div
                    className="h-full bg-brand-green rounded-full transition-all"
                    style={{ width: `${targetCompliancePct}%` }}
                  />
                </div>
                <p className="text-xs text-content-secondary leading-relaxed">
                  Percentage of compression telemetry that maintained the international standard pace (100 to 120 beats per minute).
                </p>
              </div>

              {/* Session Overview Card */}
              <div className="p-5 rounded-xl border border-border bg-canvas-secondary/70 shadow-subtle space-y-3">
                <span className="font-mono text-xs font-bold text-content-primary uppercase block">
                  PRACTICE LOG SUMMARY
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div>
                    <span className="text-content-muted block text-[10px]">SESSIONS</span>
                    <span className="font-bold text-content-primary">{sessionCount}</span>
                  </div>
                  <div>
                    <span className="text-content-muted block text-[10px]">TIME LOGGED</span>
                    <span className="font-bold text-content-primary">{formatDuration(totalDurationSeconds)}</span>
                  </div>
                  <div>
                    <span className="text-content-muted block text-[10px]">COMPRESSIONS</span>
                    <span className="font-bold text-content-primary">{totalCompressions}</span>
                  </div>
                  <div>
                    <span className="text-content-muted block text-[10px]">MAX PEAK</span>
                    <span className="font-bold text-content-primary">{maxPeakAcceleration.toFixed(2)} g</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Human-Readable Measurement Sections (Phase 1 Baseline Kept) */}
      <div className="mb-6">
        <h3 className="font-mono text-xs font-semibold tracking-wider text-content-secondary uppercase mb-4">
          WHAT PULSEMATE MEASURES
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 01 */}
          <div className="p-6 rounded-xl border border-border bg-white shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-canvas-muted text-brand-green rounded">
                  01
                </span>
                <Activity className="w-4 h-4 text-content-secondary" />
              </div>
              <h4 className="text-base font-bold text-content-primary mb-1">
                CPR RHYTHM
              </h4>
              <p className="text-sm text-content-secondary leading-relaxed">
                How consistently the compression rhythm stayed within the target range (100–120 compressions per minute).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 text-xs font-mono text-content-muted">
              Target: 100–120 per minute
            </div>
          </div>

          {/* Section 02 */}
          <div className="p-6 rounded-xl border border-border bg-white shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-canvas-muted text-brand-green rounded">
                  02
                </span>
                <Sparkles className="w-4 h-4 text-content-secondary" />
              </div>
              <h4 className="text-base font-bold text-content-primary mb-1">
                MOTION CONSISTENCY
              </h4>
              <p className="text-sm text-content-secondary leading-relaxed">
                How stable the compression movement was throughout the session, helping you track rescuer stamina and pace.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 text-xs font-mono text-content-muted">
              Smooth, repeatable movement
            </div>
          </div>

          {/* Section 03 */}
          <div className="p-6 rounded-xl border border-border bg-white shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-canvas-muted text-brand-green rounded">
                  03
                </span>
                <Compass className="w-4 h-4 text-content-secondary" />
              </div>
              <h4 className="text-base font-bold text-content-primary mb-1">
                HAND POSITION
              </h4>
              <p className="text-sm text-content-secondary leading-relaxed">
                How consistently the glove remained correctly positioned and aligned during chest compressions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 text-xs font-mono text-content-muted">
              Vertical palm alignment
            </div>
          </div>

          {/* Section 04 */}
          <div className="p-6 rounded-xl border border-border bg-white shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-canvas-muted text-brand-green rounded">
                  04
                </span>
                <TrendingUp className="w-4 h-4 text-content-secondary" />
              </div>
              <h4 className="text-base font-bold text-content-primary mb-1">
                SESSION PROGRESS
              </h4>
              <p className="text-sm text-content-secondary leading-relaxed">
                How performance changes across practice sessions, helping you build muscle memory and confidence.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 text-xs font-mono text-content-muted">
              Session-over-session trend
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
