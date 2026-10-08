import React, { useState } from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { MetricCard } from '../components/common/MetricCard';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { Button } from '../components/common/Button';
import { AccelerationChart } from '../components/visualization/AccelerationChart';
import { useCPRData } from '../hooks/useCPRData';
import { useSession } from '../hooks/useSession';
import { CPRSession } from '../types/cpr';
import {
  Activity,
  ShieldCheck,
  Compass,
  Play,
  Square,
  Pause,
  RotateCcw,
  Zap,
  Gauge,
  Timer,
  CheckCircle2,
  ArrowRight,
  Wifi,
  WifiOff,
  Radio,
} from 'lucide-react';

interface LiveMonitorPageProps {
  onNavigate?: (path: string) => void;
}

export const LiveMonitorPage: React.FC<LiveMonitorPageProps> = ({ onNavigate }) => {
  const { data, connectionStatus, adapterMode, setAdapterMode, isPaused, pause, resume, reset } = useCPRData();
  const { isRecording, sessionDuration, startSession, stopSession } = useSession();
  const [completedSession, setCompletedSession] = useState<CPRSession | null>(null);

  // Fallbacks if data stream is initializing
  const cprRate = data?.cprRate ?? 112;
  const compressionCount = data?.compressionCount ?? 18;
  const targetCount = data?.targetCount ?? 30;
  const cycle = data?.cycle ?? 1;
  const tilt = data?.tilt ?? 14.5;
  const acceleration = data?.acceleration ?? 1.42;
  const peakAcceleration = data?.peakAcceleration ?? 6.65;
  const status = data?.status ?? 'OPTIMAL';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopSession = () => {
    const session = stopSession();
    if (session) {
      setCompletedSession(session);
    }
  };

  const isLiveEsp32 = adapterMode === 'esp32';
  const isConnected = connectionStatus === 'CONNECTED';
  const isReconnecting = connectionStatus === 'RECONNECTING' || connectionStatus === 'CONNECTING';

  return (
    <PageContainer
      eyebrow="LIVE FEEDBACK"
      title="Live CPR Monitor"
      subtitle="Real-time telemetry stream from the PULSEMATE motion system."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          {/* Stream Mode Switcher (Demo vs Live ESP32) */}
          <div className="flex items-center p-0.5 rounded-md bg-canvas-secondary border border-border text-[11px] font-mono">
            <button
              onClick={() => setAdapterMode('demo')}
              className={`px-2.5 py-1 rounded transition-colors ${
                !isLiveEsp32
                  ? 'bg-white text-content-primary font-semibold shadow-subtle'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
              title="Use physics-simulated CPR telemetry stream"
            >
              DEMO MODE
            </button>
            <button
              onClick={() => setAdapterMode('esp32')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                isLiveEsp32
                  ? 'bg-white text-brand-green font-semibold shadow-subtle'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
              title="Connect to physical ESP32-S3 over WebSocket"
            >
              <Radio className="w-3 h-3" />
              LIVE ESP32
            </button>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-canvas-secondary border border-border">
            <span className="font-mono text-xs text-content-secondary">DEVICE:</span>
            <span className="font-mono text-xs font-semibold text-content-primary">PULSEMATE-01</span>
            <span className="text-border">|</span>
            {isLiveEsp32 ? (
              <StatusIndicator status={connectionStatus} size="sm" />
            ) : (
              <StatusIndicator variant="demo" label="DEMO MODE" size="sm" />
            )}
          </div>

          {/* Session Recording Controls */}
          {isRecording ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStopSession}
              className="border-brand-burgundy text-brand-burgundy hover:bg-brand-burgundy/10"
              icon={<Square className="w-3.5 h-3.5 fill-current" />}
            >
              Stop Session ({formatTime(sessionDuration)})
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={startSession}
              icon={<Play className="w-3.5 h-3.5 fill-current" />}
            >
              Start Session
            </Button>
          )}

          {/* Demo Controls (Only shown in demo mode) */}
          {!isLiveEsp32 && (
            <div className="flex items-center gap-1 bg-canvas-secondary border border-border rounded-md p-0.5">
              <button
                onClick={isPaused ? resume : pause}
                className="px-2 py-1 text-xs font-mono font-medium rounded hover:bg-white text-content-secondary hover:text-content-primary flex items-center gap-1 transition-colors"
                title={isPaused ? 'Resume stream' : 'Pause stream'}
              >
                {isPaused ? <Play className="w-3 h-3 text-status-success" /> : <Pause className="w-3 h-3 text-content-muted" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                onClick={reset}
                className="p-1 text-content-muted hover:text-content-primary rounded hover:bg-white transition-colors"
                title="Reset cycle counter"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      }
    >
      {/* Session Completed Alert Banner */}
      {completedSession && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-status-success/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-status-success/15 flex items-center justify-center text-status-success shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-content-primary">
                Session Saved to LocalStorage
              </h4>
              <p className="text-xs text-content-secondary font-mono mt-0.5">
                {completedSession.totalCompressions} compressions recorded in {formatTime(completedSession.duration)} • Avg: {completedSession.averageRate} CPM • {completedSession.targetRangePercentage}% in target range
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onNavigate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('/sessions')}
                icon={<ArrowRight className="w-3 h-3" />}
              >
                View in Sessions
              </Button>
            )}
            <button
              onClick={() => setCompletedSession(null)}
              className="text-xs font-mono text-content-muted hover:text-content-primary px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Stream Signal Banner (Contextual based on Demo vs Live Mode) */}
      {isLiveEsp32 ? (
        <div className={`mb-6 p-3 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-xs font-mono transition-colors ${
          isConnected
            ? 'bg-emerald-50/80 border-status-success/30 text-content-primary'
            : isReconnecting
            ? 'bg-amber-50/80 border-status-warning/40 text-content-primary'
            : 'bg-canvas-secondary border-border text-content-secondary'
        }`}>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-status-success" />
            ) : (
              <WifiOff className="w-4 h-4 text-content-muted" />
            )}
            <span className="font-semibold uppercase tracking-wide">
              {isConnected ? 'ESP32-S3 LIVE STREAM CONNECTED:' : isReconnecting ? 'CONNECTING TO GATEWAY:' : 'GATEWAY STANDBY:'}
            </span>
            <span>
              {isConnected
                ? 'Receiving real-time motion telemetry from ESP32-S3 via WebSocket.'
                : isReconnecting
                ? 'Attempting connection to ws://localhost:3001. Ensure gateway is running (`npm run server`).'
                : 'No WebSocket connection at ws://localhost:3001. Start server with `npm run server` or switch to DEMO MODE.'}
            </span>
          </div>
          <span className="font-semibold text-brand-green">
            {isRecording ? `● RECORDING (${formatTime(sessionDuration)})` : 'READY TO RECORD'}
          </span>
        </div>
      ) : (
        <div className="mb-6 p-3 rounded-lg bg-canvas-secondary border border-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-content-secondary">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-warning" />
            <span className="font-semibold text-content-primary">DEMO SIGNAL ACTIVE:</span>
            <span>Simulated CPR motion data stream. Click "LIVE ESP32" above to connect to real hardware.</span>
          </div>
          <span className="font-semibold text-brand-green">
            {isRecording ? `● RECORDING (${formatTime(sessionDuration)})` : 'READY TO RECORD'}
          </span>
        </div>
      )}

      {/* Primary HUD Instrument Layout */}
      <div className="space-y-6">
        {/* Main Rate & Status Header Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Primary Metric: CPR RATE Dial */}
          <div className="lg:col-span-5 p-6 rounded-xl border border-border bg-white shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-semibold tracking-wider text-content-secondary uppercase">
                  PRIMARY RHYTHM
                </span>
                <StatusIndicator variant="cpr" cprStatus={status} size="sm" />
              </div>

              <div className="text-center py-5">
                <span className="text-xs font-mono uppercase text-content-secondary block mb-1">
                  CPR RATE
                </span>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl sm:text-7xl font-mono font-bold tracking-tight text-content-primary">
                    {cprRate}
                  </span>
                  <span className="text-sm font-mono text-content-secondary font-medium">
                    /min
                  </span>
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-canvas-secondary border border-border text-xs text-content-secondary font-medium">
                  <Activity className="w-3.5 h-3.5 text-brand-green" />
                  Target: 100–120 per minute
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/70 flex items-center justify-between text-xs text-content-secondary">
              <span>Cadence State:</span>
              <span className={status === 'OPTIMAL' ? 'text-status-success font-semibold font-mono' : 'text-status-warning font-semibold font-mono'}>
                {status === 'OPTIMAL' ? 'In Target Cadence (100–120)' : status === 'SLOW' ? 'Rate Below Target (<100)' : status === 'FAST' ? 'Rate Above Target (>120)' : status}
              </span>
            </div>
          </div>

          {/* Supporting Telemetry 4-Pack */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-2 gap-4">
            {/* 1. Compressions */}
            <MetricCard
              label="COMPRESSIONS"
              value={`${compressionCount} / ${targetCount}`}
              statusBadge={
                <span className="flex items-center gap-1 text-[11px] font-mono text-brand-green font-medium">
                  <ShieldCheck className="w-3 h-3" /> CYCLE {cycle}
                </span>
              }
              hint={`Total: ${data?.totalCompressions ?? compressionCount}`}
            />

            {/* 2. Tilt / Hand Orientation */}
            <MetricCard
              label="HAND TILT"
              value={`${tilt.toFixed(1)}°`}
              statusBadge={
                tilt <= 18 ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-status-success font-medium">
                    <Compass className="w-3 h-3" /> ALIGNED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-status-warning font-medium">
                    <Compass className="w-3 h-3" /> CHECK ANGLE
                  </span>
                )
              }
              hint="Sternum vertical axis"
            />

            {/* 3. Instantaneous Acceleration */}
            <MetricCard
              label="CURRENT ACCEL"
              value={`${acceleration.toFixed(2)} g`}
              statusBadge={
                <span className="flex items-center gap-1 text-[11px] font-mono text-brand-green font-medium">
                  <Zap className="w-3 h-3" /> DYNAMIC
                </span>
              }
              hint="Real-time MPU6050 vector"
            />

            {/* 4. Peak Acceleration */}
            <MetricCard
              label="PEAK ACCELERATION"
              value={`${peakAcceleration.toFixed(2)} g`}
              statusBadge={
                <span className="flex items-center gap-1 text-[11px] font-mono text-status-success font-medium">
                  <Gauge className="w-3 h-3" /> RECENT STROKE
                </span>
              }
              hint="Stroke compression force"
            />
          </div>
        </div>

        {/* Live Motion Waveform */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-xs font-semibold tracking-wider text-content-secondary uppercase">
              REAL-TIME ACCELERATION WAVEFORM
            </span>
            <span className="font-mono text-[11px] text-content-muted">
              {isLiveEsp32 ? 'LIVE HARDWARE BUFFER (30 Hz)' : 'SIMULATION BUFFER (30 Hz)'}
            </span>
          </div>

          <AccelerationChart
            mode="live"
            height={160}
            dataBuffer={data?.waveformBuffer}
            currentG={acceleration}
            peakG={peakAcceleration}
            title={isLiveEsp32 ? 'Live ESP32 Motion' : 'Live Motion'}
          />
        </div>

        {/* Active Session Info Bar */}
        <div className="p-4 rounded-xl border border-border bg-white/70 shadow-subtle flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isRecording ? 'bg-status-success/15 text-status-success' : 'bg-canvas-muted text-content-muted'}`}>
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-[11px] text-content-secondary uppercase block">
                SESSION RECORDING STATE
              </span>
              <span className="font-mono text-sm font-semibold text-content-primary">
                {isRecording ? `Active • Elapsed: ${formatTime(sessionDuration)}` : 'No active recording session'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isRecording ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStopSession}
                className="border-brand-burgundy text-brand-burgundy hover:bg-brand-burgundy/10"
                icon={<Square className="w-3.5 h-3.5 fill-current" />}
              >
                Stop & Save Session
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={startSession}
                icon={<Play className="w-3.5 h-3.5 fill-current" />}
              >
                Start Recording Session
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
