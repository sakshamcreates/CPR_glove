export type CPRStatus =
  | "OPTIMAL"
  | "SLOW"
  | "FAST"
  | "TILT"
  | "PAUSED"
  | "TOO_SLOW"
  | "TOO_FAST"
  | "POSITION_ALERT"
  | "PAUSE_WARNING"
  | "CRITICAL";

export interface CPRData {
  timestamp: number;
  cprRate: number;              // Current CPM (e.g. 112)
  rate?: number;                 // Alias for backward compatibility
  compressionCount: number;     // Current count in cycle (e.g. 18)
  targetCount: number;          // Target per cycle (30)
  totalCompressions: number;    // Cumulative compressions in session
  cycle: number;                // Current cycle number (1, 2, 3...)
  tilt: number;                 // Degrees tilt from vertical (e.g. 14°)
  acceleration: number;         // Current instantaneous acceleration in g (e.g. 1.42g)
  peakAcceleration: number;     // Peak acceleration of latest compression (e.g. 6.65g)
  status: CPRStatus;
  waveformBuffer?: number[];    // Continuous acceleration points buffer for real-time charting
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
 * Exact JSON telemetry payload transmitted by ESP32-S3 over WebSocket
 */
export interface ESP32TelemetryMessage {
  type: "telemetry";
  timestamp: number;
  compressionCount: number;
  cprRate: number;
  peakAcceleration: number;
  tilt: number;
  status: "OPTIMAL" | "SLOW" | "FAST" | "TILT" | "PAUSED";
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
  onStatusChange?(callback: (status: ConnectionStatus) => void): () => void;
}
