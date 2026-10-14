import {
  CPRData,
  CPRSession,
  ConnectionStatus,
  DataAdapter,
  ESP32HelloMessage,
  ESP32TelemetryMessage,
} from '../types/cpr';
import { validateTelemetryMessage } from './telemetryValidator';

type DataListener = (data: CPRData) => void;
type StatusListener = (status: ConnectionStatus) => void;
type ErrorListener = (error: string | null) => void;

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export class ESP32Adapter implements DataAdapter {
  private dataListeners: Set<DataListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();

  private ws: WebSocket | null = null;
  private customWsUrl?: string;

  private status: ConnectionStatus = 'DISCONNECTED';
  private lastError: string | null = null;
  private helloInfo: ESP32HelloMessage | null = null;

  // Diagnostics and bridge awareness
  private bridgeConnected: boolean = false;
  private esp32Reachable: boolean = false;
  private lastPacketTimestamp: number | null = null;
  private targetEsp32Url: string = 'ws://10.103.136.142:81';

  private reconnectTimer: number | null = null;
  private reconnectAttempts: number = 0;
  private isIntentionallyDisconnected: boolean = true;

  // Waveform buffer (fixed size rolling window of acceleration values in g)
  private readonly BUFFER_SIZE = 80;
  private waveformBuffer: number[] = [];

  // Telemetry state (holds latest validated telemetry received from ESP32)
  private t?: number = undefined;
  private sampleSeq?: number = undefined;
  private sensorOk: boolean = true;
  private sampleAgeMs: number = 0;
  private ax: number = 0;
  private ay: number = 0;
  private az: number = 1.0;
  private vertG: number = 0;
  private tiltDeg: number = 0;
  private tiltStatus: string = 'ok';
  private cprRate: number | null = null;
  private rateAvailable: boolean = false;
  private rateStatus: string = 'none';
  private compressionCount: number = 0;
  private compInCycle: number = 0;
  private targetCount: number = 30;
  private totalCompressions: number = 0;
  private cycle: number = 1;
  private tilt: number = 0;
  private instantaneousAcc: number = 1.0;
  private peakAcceleration: number = 1.0;
  private cprStatus: ESP32TelemetryMessage['status'] = 'STANDBY';
  private sessionState: string = 'standby';
  private hasReceivedData: boolean = false;

  // Session tracking
  private isSessionActive: boolean = false;
  private sessionStartedAt: number = 0;
  private sessionRateSamples: number[] = [];
  private sessionTiltSamples: number[] = [];
  private sessionPeaks: number[] = [];
  private sessionStartCompressions: number = 0;

  constructor(customUrl?: string) {
    this.customWsUrl = customUrl;

    // Initialize baseline waveform buffer with 1.0g (earth gravity at rest)
    for (let i = 0; i < this.BUFFER_SIZE; i++) {
      this.waveformBuffer.push(1.0);
    }
  }

  public setCustomWsUrl(url: string): void {
    const trimmed = url.trim();
    this.customWsUrl = trimmed || undefined;
    if (typeof window !== 'undefined') {
      if (trimmed) {
        window.localStorage.setItem('pulsemate_ws_url', trimmed);
      } else {
        window.localStorage.removeItem('pulsemate_ws_url');
      }
    }
    // Reconnect with the new URL if active
    if (!this.isIntentionallyDisconnected) {
      this.disconnect();
      this.connect();
    }
  }

  public getWsUrl(): string {
    if (this.customWsUrl) return this.customWsUrl;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryWs = urlParams.get('wsUrl');
      if (queryWs) return queryWs.trim();

      const savedWs = window.localStorage.getItem('pulsemate_ws_url');
      if (savedWs) return savedWs.trim();

      const globalOverride = (window as unknown as Record<string, unknown>).__ESP32_WS_URL__;
      if (typeof globalOverride === 'string' && globalOverride) return globalOverride.trim();
    }

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

    const envUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ESP32_WS_URL : undefined;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
      const trimmed = envUrl.trim();
      // On HTTPS, only use envUrl if it uses secure wss:// (or tunnel)
      if (!isHttps || trimmed.startsWith('wss://')) {
        return trimmed;
      }
    }

    // Default: On HTTPS (like deployed Vercel), default to secure local bridge endpoint wss://localhost:3001
    // On plain HTTP, default to standard local ESP32 IP
    return isHttps ? 'wss://localhost:3001' : 'ws://10.103.136.142:81';
  }

  public async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isIntentionallyDisconnected = false;
    this.cleanupSocket();

    const url = this.getWsUrl();
    const isBridgeUrl = url.includes('localhost:3001');

    this.updateStatus(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    try {
      const socket = new WebSocket(url);
      this.ws = socket;

      socket.onopen = () => {
        if (this.ws !== socket) return;
        this.reconnectAttempts = 0;

        if (isBridgeUrl) {
          // Connected to the local bridge socket
          this.bridgeConnected = true;
          // Do not display fully "CONNECTED" until bridge reports ESP32 is connected and data arrives
          if (this.esp32Reachable && this.hasReceivedData) {
            this.updateStatus('CONNECTED');
          } else {
            this.updateStatus('CONNECTING');
          }
        } else {
          // Direct connection to ESP32
          this.esp32Reachable = true;
          this.bridgeConnected = false;
          if (this.hasReceivedData) {
            this.updateStatus('CONNECTED');
          } else {
            this.updateStatus('CONNECTING');
          }
        }

        if (import.meta.env?.DEV) {
          console.log(`[ESP32Adapter] WebSocket open to ${url}`);
        }
      };

      socket.onmessage = (event: MessageEvent) => {
        if (this.ws !== socket) return;
        this.handleIncomingMessage(event.data);
      };

      socket.onerror = (err) => {
        if (this.ws !== socket) return;
        const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
        let msg = `WebSocket error connecting to ${url}`;

        if (isHttpsPage && url.startsWith('ws://')) {
          msg = `Mixed Content Block: Browser blocked insecure ws:// on HTTPS site. Use wss:// or run the local bridge.`;
        } else if (url.includes('localhost:3001')) {
          msg = `Bridge Error: Cannot connect to local bridge at ${url}. Ensure bridge is running (npm.cmd run bridge) and open https://localhost:3001 once in your browser to accept the TLS certificate.`;
        } else {
          msg = `Connection Failed: Unable to reach ${url}. Check that ESP32 is powered on and laptop is on Wi-Fi 'saksham'.`;
        }

        this.bridgeConnected = false;
        this.esp32Reachable = false;
        this.lastError = msg;
        this.notifyErrorListeners(msg);
        this.updateStatus('ERROR');

        if (import.meta.env?.DEV) {
          console.warn('[ESP32Adapter]', msg, err);
        }
      };

      socket.onclose = () => {
        if (this.ws !== socket) return;
        this.ws = null;
        this.bridgeConnected = false;
        this.esp32Reachable = false;

        if (!this.isIntentionallyDisconnected) {
          this.updateStatus('RECONNECTING');
          this.scheduleReconnect();
        } else {
          this.updateStatus('DISCONNECTED');
        }
      };
    } catch (err) {
      this.ws = null;
      this.bridgeConnected = false;
      this.esp32Reachable = false;
      const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
      let msg = err instanceof Error ? err.message : String(err);

      if (isHttpsPage && url.startsWith('ws://')) {
        msg = `Browser Security Block: Cannot connect to insecure ${url} from HTTPS page.`;
      }

      this.lastError = msg;
      this.notifyErrorListeners(msg);
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
    this.cleanupSocket();
    this.updateStatus('DISCONNECTED');
  }

  private cleanupSocket(): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
        }
      } catch {
        // ignore error during close
      }
      this.ws = null;
    }
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

  public onError(callback: ErrorListener): () => void {
    this.errorListeners.add(callback);
    callback(this.lastError);
    return () => {
      this.errorListeners.delete(callback);
    };
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getError(): string | null {
    return this.lastError;
  }

  public getHelloInfo(): ESP32HelloMessage | null {
    return this.helloInfo;
  }

  public getLastPacketTime(): number | null {
    return this.lastPacketTimestamp;
  }

  public isBridgeActive(): boolean {
    return this.bridgeConnected;
  }

  public isDeviceReachable(): boolean {
    return this.esp32Reachable;
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

    const validRates = this.sessionRateSamples.filter((r) => r > 0);
    const avgRate = validRates.length > 0
      ? Math.round(validRates.reduce((a, b) => a + b, 0) / validRates.length)
      : (this.cprRate ?? 0);

    const inTargetCount = validRates.filter((r) => r >= 100 && r <= 120).length;
    const targetRangePercentage = validRates.length > 0
      ? Math.round((inTargetCount / validRates.length) * 100)
      : 0;

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
      if (this.cprRate !== null && this.cprRate > 0) {
        this.cprStatus = this.cprRate >= 100 && this.cprRate <= 120 ? 'OPTIMAL' : this.cprRate < 100 ? 'SLOW' : 'FAST';
      } else if (this.sessionState === 'standby') {
        this.cprStatus = 'STANDBY';
      } else {
        this.cprStatus = 'PAUSED';
      }
    }
    this.notifyDataListeners();
  }

  public reset(): void {
    this.compressionCount = 0;
    this.compInCycle = 0;
    this.cycle = 1;
    this.totalCompressions = 0;
    this.peakAcceleration = 1.0;
    this.notifyDataListeners();
  }

  /**
   * Process and validate incoming WebSocket raw payload with full firmware event support.
   */
  private handleIncomingMessage(rawData: unknown): void {
    try {
      const text = typeof rawData === 'string' ? rawData : String(rawData);
      const parsed = JSON.parse(text);

      if (!parsed || typeof parsed !== 'object') {
        return;
      }

      const obj = parsed as Record<string, unknown>;
      const msgType = typeof obj.type === 'string' ? obj.type : '';

      // 1. Hello Packet from firmware
      if (msgType === 'hello') {
        if (import.meta.env?.DEV) console.log('[ESP32Adapter] Firmware hello:', obj);
        this.helloInfo = obj as unknown as ESP32HelloMessage;
        if (finiteNumber(obj.cycle_size) && obj.cycle_size > 0) {
          this.targetCount = obj.cycle_size;
        }
        this.lastPacketTimestamp = Date.now();
        this.notifyDataListeners();
        return;
      }

      // 2. Bridge Status Packet from local bridge
      if (msgType === 'bridge_status') {
        this.bridgeConnected = Boolean(obj.bridgeOk);
        const esp32Connected = Boolean(obj.esp32Connected);
        const target = typeof obj.targetUrl === 'string' ? obj.targetUrl : this.targetEsp32Url;
        this.targetEsp32Url = target;

        if (esp32Connected) {
          this.esp32Reachable = true;
          this.lastError = null;
          this.notifyErrorListeners(null);
          // Only show fully CONNECTED once real data is flowing
          if (this.hasReceivedData) {
            this.updateStatus('CONNECTED');
          } else {
            this.updateStatus('CONNECTING');
          }
        } else {
          this.esp32Reachable = false;
          const msg = `Bridge is running on localhost:3001, but ESP32 at ${target} is unreachable. Check that ESP32 is powered on and laptop is connected to Wi-Fi 'saksham'.`;
          this.lastError = msg;
          this.notifyErrorListeners(msg);
          this.updateStatus('CONNECTING');
        }
        this.notifyDataListeners();
        return;
      }

      // 3. Compression Event
      if (msgType === 'compression') {
        this.hasReceivedData = true;
        this.esp32Reachable = true;
        this.lastPacketTimestamp = Date.now();

        if (finiteNumber(obj.comp_in_cycle)) {
          this.compInCycle = obj.comp_in_cycle;
          this.compressionCount = obj.comp_in_cycle;
        } else if (finiteNumber(obj.count)) {
          this.compInCycle = obj.count;
          this.compressionCount = obj.count;
        }

        if (finiteNumber(obj.total_compressions)) {
          this.totalCompressions = obj.total_compressions;
        } else {
          this.totalCompressions++;
        }

        if (finiteNumber(obj.peak_g)) {
          this.peakAcceleration = Math.max(this.peakAcceleration, obj.peak_g);
        }

        if (finiteNumber(obj.rate) && obj.rate > 0) {
          this.cprRate = Math.round(obj.rate);
          this.rateAvailable = true;
        }

        this.cycle = Math.max(1, Math.floor(this.totalCompressions / this.targetCount) + 1);
        this.updateStatus('CONNECTED');
        this.notifyDataListeners();
        return;
      }

      // 4. Cycle Complete Event
      if (msgType === 'cycle_complete') {
        this.hasReceivedData = true;
        this.lastPacketTimestamp = Date.now();
        if (finiteNumber(obj.cycle)) {
          this.cycle = obj.cycle + 1;
        } else {
          this.cycle++;
        }
        this.compInCycle = 0;
        this.compressionCount = 0;
        this.notifyDataListeners();
        return;
      }

      // 5. Session End Event
      if (msgType === 'session_end') {
        this.lastPacketTimestamp = Date.now();
        this.sessionState = 'standby';
        this.cprStatus = 'STANDBY';
        this.cprRate = null;
        this.rateAvailable = false;
        this.notifyDataListeners();
        return;
      }

      // 6. Session Cancelled Event
      if (msgType === 'session_cancelled') {
        this.lastPacketTimestamp = Date.now();
        this.sessionState = 'standby';
        this.cprStatus = 'STANDBY';
        this.cprRate = null;
        this.rateAvailable = false;
        this.notifyDataListeners();
        return;
      }

      // 7. Sensor Recover Event
      if (msgType === 'sensor_recover') {
        this.sensorOk = true;
        this.lastPacketTimestamp = Date.now();
        this.notifyDataListeners();
        return;
      }

      // 8. Pong Event (Heartbeat acknowledgement)
      if (msgType === 'pong') {
        this.lastPacketTimestamp = Date.now();
        return;
      }

      // 9. Standard / High-Frequency Telemetry Packet
      const validated = validateTelemetryMessage(obj);
      if (!validated) {
        return;
      }

      this.hasReceivedData = true;
      this.esp32Reachable = true;
      this.lastPacketTimestamp = Date.now();
      this.updateStatus('CONNECTED');
      this.lastError = null;
      this.notifyErrorListeners(null);

      // Update state from validated message
      const prevCount = this.compressionCount;
      const prevTotal = this.totalCompressions;

      this.t = validated.t;
      this.sampleSeq = validated.sampleSeq;
      this.sensorOk = validated.sensorOk;
      this.sampleAgeMs = validated.sampleAgeMs ?? 0;
      this.ax = validated.ax;
      this.ay = validated.ay;
      this.az = validated.az;
      this.vertG = validated.vertG;
      this.tiltDeg = validated.tiltDeg;
      this.tiltStatus = validated.tiltStatus;

      // Handle rate: null as unavailable
      this.cprRate = validated.cprRate;
      this.rateAvailable = validated.rateAvailable;
      this.rateStatus = validated.rateStatus;

      this.compInCycle = validated.comp_in_cycle;
      this.compressionCount = validated.compressionCount;

      this.tilt = validated.tilt;
      this.cprStatus = validated.status;
      this.sessionState = validated.session || (this.rateAvailable ? 'active' : 'standby');

      this.instantaneousAcc = validated.acceleration;
      if (this.sessionState === 'standby') {
        this.peakAcceleration = validated.peakAcceleration;
      } else {
        this.peakAcceleration = Math.max(this.peakAcceleration, validated.peakAcceleration);
      }

      // Add real acceleration directly into waveform buffer
      this.waveformBuffer.push(this.instantaneousAcc);
      if (this.waveformBuffer.length > this.BUFFER_SIZE) {
        this.waveformBuffer.shift();
      }

      // Handle cumulative compressions
      if (typeof validated.totalCompressions === 'number') {
        this.totalCompressions = validated.totalCompressions;
      } else if (this.compressionCount > prevCount) {
        this.totalCompressions += this.compressionCount - prevCount;
      }

      if (this.totalCompressions > prevTotal || this.compressionCount > prevCount) {
        this.cycle = Math.max(1, Math.floor(this.totalCompressions / this.targetCount) + 1);
      }

      // Record session metrics if session active
      if (this.isSessionActive) {
        if (this.cprRate !== null && this.cprRate > 0) {
          this.sessionRateSamples.push(this.cprRate);
        }
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

  private scheduleReconnect(): void {
    if (this.isIntentionallyDisconnected || this.reconnectTimer !== null) return;

    this.reconnectAttempts++;
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

  private notifyErrorListeners(err: string | null): void {
    for (const listener of this.errorListeners) {
      listener(err);
    }
  }

  private getCurrentData(): CPRData {
    return {
      timestamp: Date.now(),
      t: this.t,
      sampleSeq: this.sampleSeq,
      sample_seq: this.sampleSeq,
      sensorOk: this.sensorOk,
      sensor_ok: this.sensorOk,
      sampleAgeMs: this.sampleAgeMs,
      sample_age_ms: this.sampleAgeMs,
      ax: this.ax,
      ay: this.ay,
      az: this.az,
      vertG: this.vertG,
      vert_g: this.vertG,
      tiltDeg: this.tiltDeg,
      tilt_deg: this.tiltDeg,
      tiltStatus: this.tiltStatus,
      tilt_status: this.tiltStatus,
      cprRate: this.cprRate,
      rate: this.cprRate,
      rateStatus: this.rateStatus,
      rate_status: this.rateStatus,
      rateAvailable: this.rateAvailable,
      compressionCount: this.compressionCount,
      compInCycle: this.compInCycle,
      comp_in_cycle: this.compInCycle,
      targetCount: this.targetCount,
      totalCompressions: this.totalCompressions,
      total_compressions: this.totalCompressions,
      cycle: this.cycle,
      tilt: this.tilt,
      acceleration: this.instantaneousAcc,
      peakAcceleration: this.peakAcceleration,
      status: this.cprStatus,
      sessionState: this.sessionState,
      session: this.sessionState,
      helloInfo: this.helloInfo || undefined,
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
