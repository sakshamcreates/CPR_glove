import React from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { MetricCard } from '../components/common/MetricCard';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { Button } from '../components/common/Button';
import { AccelerationChart } from '../components/visualization/AccelerationChart';
import { useCPRData } from '../hooks/useCPRData';
import { useSession } from '../hooks/useSession';
import {
  ArrowRight,
  Activity,
  Settings,
  History,
  BarChart3,
  ShieldCheck,
  Compass,
  Timer,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { data, isPaused } = useCPRData();
  const { isRecording, sessionDuration, sessions } = useSession();

  const cprRate = data?.cprRate ?? 112;
  const compressionCount = data?.compressionCount ?? 18;
  const targetCount = data?.targetCount ?? 30;
  const tilt = data?.tilt ?? 14.5;
  const status = data?.status ?? 'OPTIMAL';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <PageContainer
      eyebrow="OVERVIEW"
      title="CPR Overview"
      subtitle="System status, live telemetry preview, and session tracking."
      actions={
        <div className="flex items-center gap-3">
          <StatusIndicator variant="demo" label="● DEMO MODE" />
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('/live')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Open Live Monitor
          </Button>
        </div>
      }
    >
      {/* 4 Core Telemetry Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="CPR RATE"
          value={cprRate}
          unit="/min"
          highlight={true}
          statusBadge={
            <span className="font-mono text-xs font-semibold text-brand-green">
              {status}
            </span>
          }
          target="100–120 Target"
        />

        <MetricCard
          label="COMPRESSIONS"
          value={`${compressionCount} / ${targetCount}`}
          statusBadge={
            <span className="flex items-center gap-1 text-[11px] font-mono text-brand-green font-medium">
              <ShieldCheck className="w-3 h-3" /> ACTIVE
            </span>
          }
          hint={`Cycle ${data?.cycle ?? 1}`}
        />

        <MetricCard
          label="HAND TILT"
          value={`${tilt.toFixed(1)}°`}
          statusBadge={
            <span className="flex items-center gap-1 text-[11px] font-mono text-status-success font-medium">
              <Compass className="w-3 h-3" /> ALIGNED
            </span>
          }
          hint="Sternum vertical axis"
        />

        <MetricCard
          label="SESSION"
          value={isRecording ? formatTime(sessionDuration) : sessions.length > 0 ? `${sessions.length} Saved` : 'Ready'}
          statusBadge={
            isRecording ? (
              <span className="font-mono text-xs text-status-success font-semibold flex items-center gap-1">
                <Timer className="w-3 h-3 animate-pulse" /> RECORDING
              </span>
            ) : (
              <span className="font-mono text-xs text-content-muted">IDLE</span>
            )
          }
          hint={isRecording ? 'Telemetry recording' : 'Live monitor standby'}
        />
      </div>

      {/* Main Live Telemetry Preview Card */}
      <div className="bg-white rounded-xl border border-border p-5 sm:p-6 shadow-subtle mb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              <h2 className="text-sm font-bold text-content-primary">
                Live Acceleration Stream Preview
              </h2>
            </div>
            <p className="text-xs text-content-secondary mt-0.5">
              Continuous MPU6050 accelerometer vector in Demo Mode. Connects to Live HUD.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-content-muted">
              {isPaused ? 'STREAM PAUSED' : 'STREAMING 30 Hz'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('/live')}
              icon={<ArrowRight className="w-3 h-3" />}
            >
              Full Monitor
            </Button>
          </div>
        </div>

        <AccelerationChart
          mode="live"
          height={130}
          title="Telemetry Stream"
          dataBuffer={data?.waveformBuffer}
          currentG={data?.acceleration}
          peakG={data?.peakAcceleration}
        />
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-lg border border-border bg-white/80 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded bg-canvas-muted flex items-center justify-center text-brand-green mb-3">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-content-primary mb-1">
              Live Monitor
            </h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              Real-time CPR rate, rhythm guidance, hand positioning feedback, and session recording.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/live')}
            className="mt-4 text-xs font-semibold text-brand-green flex items-center gap-1 hover:underline"
          >
            Launch Monitor <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 rounded-lg border border-border bg-white/80 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded bg-canvas-muted flex items-center justify-center text-brand-green mb-3">
              <History className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-content-primary mb-1">
              Session History ({sessions.length})
            </h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              Review completed practice sessions, average rhythm rate, and consistency logs stored locally.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/sessions')}
            className="mt-4 text-xs font-semibold text-brand-green flex items-center gap-1 hover:underline"
          >
            View Sessions <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 rounded-lg border border-border bg-white/80 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded bg-canvas-muted flex items-center justify-center text-brand-green mb-3">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-content-primary mb-1">
              Performance Analytics
            </h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              Calculate accuracy within the 100–120 CPM window, average tilt, and session progress trends.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/analytics')}
            className="mt-4 text-xs font-semibold text-brand-green flex items-center gap-1 hover:underline"
          >
            Inspect Analytics <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 rounded-lg border border-border bg-white/80 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded bg-canvas-muted flex items-center justify-center text-brand-green mb-3">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-content-primary mb-1">
              Device Pinout
            </h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              Inspect physical ESP32-S3 pin mapping, MPU6050 wiring, and feedback actuators.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/device')}
            className="mt-4 text-xs font-semibold text-brand-green flex items-center gap-1 hover:underline"
          >
            Inspect Hardware <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </PageContainer>
  );
};
