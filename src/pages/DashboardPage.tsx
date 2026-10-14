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
  Radio,
  Wifi,
  WifiOff,
  Cpu,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    data,
    connectionStatus,
    adapterMode,
    setAdapterMode,
    isPaused,
    error,
    reconnect,
    wsUrl,
  } = useCPRData();
  const { isRecording, sessionDuration, sessions } = useSession();

  const isLiveEsp32 = adapterMode === 'esp32';
  const isConnected = connectionStatus === 'CONNECTED';
  const isReconnecting = connectionStatus === 'RECONNECTING' || connectionStatus === 'CONNECTING';

  // Real or demo telemetry values without inventing live readings
  const rateAvailable = data?.rateAvailable === true;
  const cprRate = rateAvailable && data?.cprRate !== null ? data.cprRate : null;
  const compressionCount = data?.compressionCount ?? 0;
  const targetCount = data?.targetCount ?? 30;
  const tilt = data?.tilt ?? 0;
  const acceleration = data?.acceleration ?? 1.0;
  const peakAcceleration = data?.peakAcceleration ?? 1.0;
  const status = data?.status ?? (isLiveEsp32 ? 'STANDBY' : 'OPTIMAL');
  const sensorOk = data?.sensorOk !== false;
  const sessionState = data?.sessionState || (isLiveEsp32 ? 'standby' : 'demo');

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
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
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
          {isLiveEsp32 ? (
            <StatusIndicator status={connectionStatus} size="sm" />
          ) : (
            <StatusIndicator variant="demo" label="DEMO MODE" size="sm" />
          )}

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
      {/* Live Connection / Hardware Status Banner */}
      {isLiveEsp32 && (
        <div
          className={`mb-6 p-3 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-xs font-mono transition-colors ${
            isConnected
              ? 'bg-emerald-50/80 border-status-success/30 text-content-primary'
              : isReconnecting
              ? 'bg-amber-50/80 border-status-warning/40 text-content-primary'
              : 'bg-canvas-secondary border-border text-content-secondary'
          }`}
        >
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-status-success shrink-0" />
            ) : (
              <WifiOff className="w-4 h-4 text-content-muted shrink-0" />
            )}
            <span className="font-semibold uppercase tracking-wide">
              {isConnected
                ? 'ESP32-S3 LIVE STREAM CONNECTED:'
                : isReconnecting
                ? 'CONNECTING TO ESP32:'
                : 'ESP32 STANDBY:'}
            </span>
            <span>
              {isConnected
                ? `Receiving continuous telemetry (Seq #${data?.sampleSeq ?? 0}, Sensor: ${
                    sensorOk ? 'MPU6050 OK' : 'SENSOR FAULT'
                  }, Session: ${sessionState.toUpperCase()}).`
                : error
                ? `${error} (Auto-retrying...)`
                : isReconnecting
                ? `Attempting connection to ${wsUrl}...`
                : `No WebSocket connection (${wsUrl}). Click Open Live Monitor to configure.`}
            </span>
          </div>
          {(!isConnected || error) && (
            <button
              onClick={reconnect}
              className="px-2 py-0.5 rounded bg-white border border-border text-[11px] font-semibold text-content-primary hover:bg-canvas-primary"
            >
              Retry Connection
            </button>
          )}
        </div>
      )}

      {/* 4 Core Telemetry Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="CPR RATE"
          value={cprRate !== null ? cprRate : '—'}
          unit="/min"
          highlight={true}
          statusBadge={
            <span
              className={`font-mono text-xs font-semibold ${
                status === 'OPTIMAL'
                  ? 'text-brand-green'
                  : status === 'STANDBY'
                  ? 'text-content-muted'
                  : 'text-status-warning'
              }`}
            >
              {sessionState === 'standby'
                ? 'STANDBY'
                : !rateAvailable
                ? 'WAITING FOR RATE'
                : status}
            </span>
          }
          target="100–120 Target"
          hint={sessionState === 'standby' ? 'Device in standby' : undefined}
        />

        <MetricCard
          label="COMPRESSIONS"
          value={`${compressionCount} / ${targetCount}`}
          statusBadge={
            <span
              className={`flex items-center gap-1 text-[11px] font-mono font-medium ${
                sessionState === 'standby' ? 'text-content-muted' : 'text-brand-green'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              {sessionState === 'standby' ? 'STANDBY' : 'ACTIVE'}
            </span>
          }
          hint={`Total: ${data?.totalCompressions ?? compressionCount} • Cycle ${data?.cycle ?? 1}`}
        />

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
          hint={`Sternum vertical axis • ${data?.tiltStatus || 'ok'}`}
        />

        <MetricCard
          label="HARDWARE & SESSION"
          value={
            isLiveEsp32
              ? isConnected
                ? sensorOk
                  ? 'Sensor OK'
                  : 'Sensor Fault'
                : 'Offline'
              : isRecording
              ? formatTime(sessionDuration)
              : sessions.length > 0
              ? `${sessions.length} Saved`
              : 'Demo Ready'
          }
          statusBadge={
            isLiveEsp32 ? (
              <span
                className={`font-mono text-xs font-semibold flex items-center gap-1 ${
                  sensorOk && isConnected ? 'text-status-success' : 'text-status-danger'
                }`}
              >
                <Cpu className="w-3 h-3" /> {sensorOk && isConnected ? 'MPU6050 OK' : 'SENSOR ERROR'}
              </span>
            ) : isRecording ? (
              <span className="font-mono text-xs text-status-success font-semibold flex items-center gap-1">
                <Timer className="w-3 h-3 animate-pulse" /> RECORDING
              </span>
            ) : (
              <span className="font-mono text-xs text-content-muted">IDLE</span>
            )
          }
          hint={
            isLiveEsp32
              ? `Session: ${sessionState.toUpperCase()} • Seq #${data?.sampleSeq ?? 0}`
              : isRecording
              ? 'Telemetry recording'
              : 'Live monitor standby'
          }
        />
      </div>

      {/* Main Live Telemetry Preview Card */}
      <div className="bg-white rounded-xl border border-border p-5 sm:p-6 shadow-subtle mb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-status-success animate-pulse' : 'bg-content-muted'
                }`}
              />
              <h2 className="text-sm font-bold text-content-primary">
                Live Acceleration Stream Preview
              </h2>
            </div>
            <p className="text-xs text-content-secondary mt-0.5">
              {isLiveEsp32
                ? `MPU6050 motion vector magnitude (${acceleration.toFixed(2)}g). ax: ${(
                    data?.ax ?? 0
                  ).toFixed(2)}g, ay: ${(data?.ay ?? 0).toFixed(2)}g, az: ${(
                    data?.az ?? 1.0
                  ).toFixed(2)}g (vert: ${(data?.vertG ?? 0).toFixed(2)}g)`
                : 'Continuous MPU6050 accelerometer vector in Demo Mode. Connects to Live HUD.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-content-muted">
              {isLiveEsp32
                ? isConnected
                  ? `TELEMETRY ACTIVE (${data?.sampleAgeMs ?? 0}ms age)`
                  : 'DISCONNECTED'
                : isPaused
                ? 'STREAM PAUSED'
                : 'STREAMING 30 Hz'}
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
          currentG={acceleration}
          peakG={peakAcceleration}
        />
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-lg border border-border bg-white/80 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded bg-canvas-muted flex items-center justify-center text-brand-green mb-3">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-content-primary mb-1">Live Monitor</h3>
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
              Review completed practice sessions, average rhythm rate, and consistency logs stored
              locally.
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
            <h3 className="text-sm font-bold text-content-primary mb-1">Performance Analytics</h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              Calculate accuracy within the 100–120 CPM window, average tilt, and session progress
              trends.
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
            <h3 className="text-sm font-bold text-content-primary mb-1">Device Pinout</h3>
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
