import { CPRData, CPRSession, ConnectionStatus, DataAdapter, ESP32TelemetryMessage } from '../types/cpr';
import { validateTelemetryMessage } from './telemetryValidator';

type DataListener = (data: CPRData) => void;
type StatusListener = (status: ConnectionStatus) => void;

export class ESP32Adapter implements DataAdapter {
  private dataListeners: Set<DataListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private ws: WebSocket | null = null;
  private wsUrl: string;

  private status: ConnectionStatus = 'DISCONNECTED';
  private reconnectTimer: number | null = null;
  private reconnectAttempts: number = 0;
  private isIntentionallyDisconnected: boolean = true;

  // Waveform buffer (fixed size rolling window of acceleration values in g)
  private readonly BUFFER_SIZE = 80;
  private waveformBuffer: number[] = [];
  private tickerTimer: number | null = null;

  // Telemetry state (holds latest validated telemetry received from ESP32)
  private cprRate: number = 0;
  private compressionCount: number = 0;
  private targetCount: number = 30;
  private totalCompressions: number = 0;
  private cycle: number = 1;
  private tilt: number = 0;
  private instantaneousAcc: number = 1.0;
  private peakAcceleration: number = 0;
  private cprStatus: ESP32TelemetryMessage['status'] = 'PAUSED';
  private strokePhase: number = 0; // 0.0 to 1.0 for waveform pacing
  private hasReceivedData: boolean = false;

  // Session tracking
  private isSessionActive: boolean = false;
  private sessionStartedAt: number = 0;
  private sessionRateSamples: number[] = [];
  private sessionTiltSamples: number[] = [];
  private sessionPeaks: number[] = [];
  private sessionStartCompressions: number = 0;

  constructor(customUrl?: string) {
    const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_ESP32_WS_URL;
    this.wsUrl = customUrl || envUrl || 'ws://localhost:3001';

    // Initialize baseline waveform buffer
    for (let i = 0; i < this.BUFFER_SIZE; i++) {
      this.waveformBuffer.push(1.0);
    }
  }

  public async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isIntentionallyDisconnected = false;
    this.updateStatus(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    this.startTicker();

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateStatus('CONNECTED');
        if (import.meta.env?.DEV) {
          console.log(`[ESP32Adapter] Connected to WebSocket at ${this.wsUrl}`);
        }
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleIncomingMessage(event.data);
      };

      this.ws.onerror = (err) => {
        if (import.meta.env?.DEV) {
          console.warn('[ESP32Adapter] WebSocket error:', err);
        }
        this.updateStatus('ERROR');
      };

      this.ws.onclose = () => {
        this.ws = null;
        if (!this.isIntentionallyDisconnected) {
          this.updateStatus('RECONNECTING');
          this.scheduleReconnect();
        } else {
          this.updateStatus('DISCONNECTED');
        }
      };
    } catch (err) {
      if (import.meta.env?.DEV) {
        console.warn('[ESP32Adapter] Connection attempt failed:', err);
      }
      this.updateStatus('ERROR');
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isIntentionallyDisconnected = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopTicker();
    this.updateStatus('DISCONNECTED');
  }

  public subscribe(callback: DataListener): () => void {
    this.dataListeners.add(callback);
    callback(this.getCurrentData());

    if (this.status === 'DISCONNECTED') {
      this.connect();
    }

    return () => {
      this.dataListeners.delete(callback);
      if (this.dataListeners.size === 0) {
        this.disconnect();
      }
    };
  }

  public onStatusChange(callback: StatusListener): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public startSession(): void {
    this.isSessionActive = true;
    this.sessionStartedAt = Date.now();
    this.sessionRateSamples = [];
    this.sessionTiltSamples = [];
    this.sessionPeaks = [];
    this.sessionStartCompressions = this.totalCompressions;
  }

  public stopSession(): CPRSession | null {
    if (!this.isSessionActive) return null;

    const endedAt = Date.now();
    const duration = Math.max(1, Math.round((endedAt - this.sessionStartedAt) / 1000));
    const totalCompressions = Math.max(0, this.totalCompressions - this.sessionStartCompressions);

    const avgRate = this.sessionRateSamples.length > 0
      ? Math.round(this.sessionRateSamples.reduce((a, b) => a + b, 0) / this.sessionRateSamples.length)
      : this.cprRate;

    const inTargetCount = this.sessionRateSamples.filter((r) => r >= 100 && r <= 120).length;
    const targetRangePercentage = this.sessionRateSamples.length > 0
      ? Math.round((inTargetCount / this.sessionRateSamples.length) * 100)
      : 85;

    const avgTilt = this.sessionTiltSamples.length > 0
      ? Number((this.sessionTiltSamples.reduce((a, b) => a + b, 0) / this.sessionTiltSamples.length).toFixed(1))
      : this.tilt;

    const maxPeak = this.sessionPeaks.length > 0
      ? Math.max(...this.sessionPeaks)
      : this.peakAcceleration;

    const session: CPRSession = {
      id: `session-esp32-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      startedAt: this.sessionStartedAt,
      endedAt,
      duration,
      totalCompressions,
      averageRate: avgRate,
      targetRangePercentage,
      averageTilt: avgTilt,
      peakAcceleration: maxPeak,
      status: targetRangePercentage >= 80 ? 'OPTIMAL' : 'NEEDS PRACTICE',
    };

    this.isSessionActive = false;
    return session;
  }

  public pause(): void {
    this.cprStatus = 'PAUSED';
    this.notifyDataListeners();
  }

  public resume(): void {
    if (this.hasReceivedData) {
      this.cprStatus = this.cprRate >= 100 && this.cprRate <= 120 ? 'OPTIMAL' : this.cprRate < 100 ? 'SLOW' : 'FAST';
    }
    this.notifyDataListeners();
  }

  public reset(): void {
    this.compressionCount = 0;
    this.cycle = 1;
    this.totalCompressions = 0;
    this.notifyDataListeners();
  }

  /**
   * Process and validate incoming WebSocket raw payload
   */
  private handleIncomingMessage(rawData: unknown): void {
    try {
      const text = typeof rawData === 'string' ? rawData : String(rawData);
      const parsed = JSON.parse(text);
      const validated = validateTelemetryMessage(parsed);

      if (!validated) {
        // Malformed message safely ignored and logged by validator
        return;
      }

      this.hasReceivedData = true;

      // Update state from validated message
      const prevCount = this.compressionCount;
      this.cprRate = validated.cprRate;
      this.compressionCount = validated.compressionCount;
      this.peakAcceleration = validated.peakAcceleration;
      this.tilt = validated.tilt;
      this.cprStatus = validated.status;

      // Detect stroke occurrence or count progression
      if (this.compressionCount > prevCount) {
        this.totalCompressions += (this.compressionCount - prevCount);
        this.cycle = Math.max(1, Math.floor(this.totalCompressions / this.targetCount) + 1);
        this.strokePhase = 0.25; // Align peak wave with compression event
      }

      // Record session metrics if session active
      if (this.isSessionActive) {
        this.sessionRateSamples.push(this.cprRate);
        this.sessionTiltSamples.push(this.tilt);
        this.sessionPeaks.push(this.peakAcceleration);
      }

      this.notifyDataListeners();
    } catch (err) {
      if (import.meta.env?.DEV) {
        console.warn('[ESP32Adapter] Failed to parse WebSocket payload:', err);
      }
    }
  }

  /**
   * Waveform pacing ticker: drives smooth continuous acceleration waveform
   * synchronized to the reported cprRate and peakAcceleration from ESP32.
   */
  private startTicker(): void {
    if (this.tickerTimer !== null) return;

    const intervalMs = 33; // ~30 Hz
    let lastTime = Date.now();

    this.tickerTimer = window.setInterval(() => {
      const now = Date.now();
      const dt = now - lastTime;
      lastTime = now;

      if (this.status === 'CONNECTED' && this.cprRate > 0 && this.cprStatus !== 'PAUSED') {
        const periodMs = (60 / Math.max(60, this.cprRate)) * 1000;
        this.strokePhase = (this.strokePhase + (dt / periodMs)) % 1.0;

        const peak = Math.max(2.5, this.peakAcceleration);
        let acc = 1.0;

        if (this.strokePhase < 0.25) {
          const t = this.strokePhase / 0.25;
          acc = 1.0 + (peak - 1.0) * Math.sin(t * Math.PI * 0.5);
        } else if (this.strokePhase < 0.50) {
          const t = (this.strokePhase - 0.25) / 0.25;
          acc = peak - (peak - 0.5) * Math.sin(t * Math.PI * 0.5);
        } else if (this.strokePhase < 0.80) {
          const t = (this.strokePhase - 0.50) / 0.30;
          acc = 0.5 + (1.0 - 0.5) * Math.sin(t * Math.PI * 0.5);
        } else {
          acc = 1.0 + (Math.sin(Date.now() / 150) * 0.03);
        }

        this.instantaneousAcc = Number(acc.toFixed(2));
      } else {
        // Resting 1.0g baseline with subtle sensor tremor
        this.instantaneousAcc = Number((1.0 + Math.sin(Date.now() / 250) * 0.02).toFixed(2));
      }

      this.waveformBuffer.push(this.instantaneousAcc);
      if (this.waveformBuffer.length > this.BUFFER_SIZE) {
        this.waveformBuffer.shift();
      }

      this.notifyDataListeners();
    }, intervalMs);
  }

  private stopTicker(): void {
    if (this.tickerTimer !== null) {
      clearInterval(this.tickerTimer);
      this.tickerTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.isIntentionallyDisconnected || this.reconnectTimer !== null) return;

    this.reconnectAttempts++;
    // Exponential backoff: 1s, 2s, 4s, capped at 8s
    const delay = Math.min(8000, 1000 * Math.pow(1.8, this.reconnectAttempts - 1));

    if (import.meta.env?.DEV) {
      console.log(`[ESP32Adapter] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts})...`);
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private updateStatus(newStatus: ConnectionStatus): void {
    if (this.status === newStatus) return;
    this.status = newStatus;
    for (const listener of this.statusListeners) {
      listener(this.status);
    }
  }

  private getCurrentData(): CPRData {
    return {
      timestamp: Date.now(),
      cprRate: this.cprRate,
      rate: this.cprRate,
      compressionCount: this.compressionCount,
      targetCount: this.targetCount,
      totalCompressions: this.totalCompressions,
      cycle: this.cycle,
      tilt: this.tilt,
      acceleration: this.instantaneousAcc,
      peakAcceleration: this.peakAcceleration,
      status: this.cprStatus,
      waveformBuffer: [...this.waveformBuffer],
    };
  }

  private notifyDataListeners(): void {
    const data = this.getCurrentData();
    for (const listener of this.dataListeners) {
      listener(data);
    }
  }
}

export const esp32Adapter = new ESP32Adapter();
