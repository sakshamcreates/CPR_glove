export type CPRStatus =
  | "OPTIMAL"
  | "SLOW"
  | "FAST"
  | "TILT"
  | "PAUSED"
  | "STANDBY"
  | "TOO_SLOW"
  | "TOO_FAST"
  | "POSITION_ALERT"
  | "PAUSE_WARNING"
  | "CRITICAL";

export interface ESP32HelloMessage {
  type: "hello";
  device?: string;
  t?: number;
  ip?: string;
  sample_hz?: number;
  telemetry_hz?: number;
  cycle_size?: number;
  rate_min?: number;
  rate_max?: number;
  tilt_max_deg?: number;
}

export interface CPRData {
  timestamp: number;
  t?: number;
  sampleSeq?: number;
  sample_seq?: number;
  sensorOk?: boolean;
  sensor_ok?: boolean;
  sampleAgeMs?: number;
  sample_age_ms?: number;
  ax?: number;
  ay?: number;
  az?: number;
  vertG?: number;
  vert_g?: number;
  tiltDeg?: number;
  tilt_deg?: number;
  tiltStatus?: string;
  tilt_status?: string;
  cprRate: number | null;              // Current CPM (null when standby/unavailable)
  rateAvailable?: boolean;            // False when firmware reports rate: null / no valid interval yet
  rate?: number | null;               // Alias for backward compatibility
  rateStatus?: string;
  rate_status?: string;
  compressionCount: number;          // Current count in cycle (e.g. 18)
  compInCycle?: number;
  comp_in_cycle?: number;
  targetCount: number;               // Target per cycle (30)
  totalCompressions: number;         // Cumulative compressions in session
  total_compressions?: number;
  cycle: number;                     // Current cycle number (1, 2, 3...)
  tilt: number;                      // Degrees tilt from vertical (e.g. 14°)
  acceleration: number;              // Current instantaneous acceleration in g (e.g. 1.42g)
  peakAcceleration: number;          // Max observed acceleration magnitude in the current data window (e.g. 6.65g)
  status: CPRStatus;
  sessionState?: string;             // "standby", "active", etc.
  session?: string;
  helloInfo?: ESP32HelloMessage;
  waveformBuffer?: number[];         // Continuous acceleration points buffer for real-time charting
}

export type ConnectionState =
  | "CONNECTED"
  | "CONNECTING"
  | "RECONNECTING"
  | "DISCONNECTED"
  | "OFFLINE"
  | "CALIBRATING"
  | "ERROR"
  | "DEMO";

export type ConnectionStatus =
  | "DEMO"
  | "CONNECTED"
  | "CONNECTING"
  | "RECONNECTING"
  | "DISCONNECTED"
  | "ERROR";

export type AdapterMode = "demo" | "esp32";

/**
 * Normalized telemetry payload consumed by the dashboard after firmware-packet validation.
 */
export interface ESP32TelemetryMessage {
  type: "telemetry";
  t?: number;
  timestamp: number;
  sampleSeq?: number;
  sample_seq?: number;
  sensorOk: boolean;
  sensor_ok: boolean;
  sampleAgeMs?: number;
  sample_age_ms?: number;
  ax: number;
  ay: number;
  az: number;
  vertG: number;
  vert_g: number;
  tiltDeg: number;
  tilt_deg: number;
  tiltStatus: string;
  tilt_status: string;
  cprRate: number | null;
  rate: number | null;
  rateStatus: string;
  rate_status: string;
  rateAvailable: boolean;
  compressionCount: number;
  comp_in_cycle: number;
  totalCompressions: number;
  total_compressions: number;
  acceleration: number;
  peakAcceleration: number;
  tilt: number;
  status: CPRStatus;
  session?: string;
}

export interface CPRSession {
  id: string;
  startedAt: number;
  endedAt: number;
  duration: number;             // Duration in seconds
  totalCompressions: number;
  averageRate: number;
  targetRangePercentage: number;// % of samples within 100–120 CPM
  averageTilt: number;
  peakAcceleration: number;
  status: string;
}

export type CPRSessionRecord = CPRSession;

export interface DeviceTelemetry {
  id: string;
  name: string;
  status: ConnectionState;
  sensor: string;
  controller: string;
  firmwareVersion: string;
  batteryPercentage: number | null;
  i2cAddress: string;
  sampleRateHz: number;
}

export interface DataAdapter {
  connect(): Promise<void>;
  disconnect(): void;
  subscribe(callback: (data: CPRData) => void): () => void;
  getStatus(): ConnectionStatus;
  startSession?(): void;
  stopSession?(): CPRSession | null;
  pause?(): void;
  resume?(): void;
  reset?(): void;
  isPaused?(): boolean;
  getError?(): string | null;
  getHelloInfo?(): ESP32HelloMessage | null;
  onStatusChange?(callback: (status: ConnectionStatus) => void): () => void;
  onError?(callback: (error: string | null) => void): () => void;
}
