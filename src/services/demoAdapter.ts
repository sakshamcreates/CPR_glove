import { CPRData, CPRSession, CPRStatus, ConnectionStatus, DataAdapter } from '../types/cpr';

type Listener = (data: CPRData) => void;

class DemoAdapter implements DataAdapter {
  private listeners: Set<Listener> = new Set();
  private timer: number | null = null;
  private isRunning: boolean = false;
  private isStreamPaused: boolean = false;

  // Waveform buffer (fixed size rolling window of acceleration values in g)
  private readonly BUFFER_SIZE = 80;
  private waveformBuffer: number[] = [];

  // CPR Simulation state
  private strokePhase: number = 0; // 0.0 to 1.0 within single compression stroke
  private compressionRate: number = 112; // CPM
  private strokeDurationMs: number = (60 / 112) * 1000; // ~535 ms
  private compressionCount: number = 18;
  private targetCount: number = 30;
  private cycle: number = 1;
  private totalCompressions: number = 18;
  private currentTilt: number = 15;
  private currentInstantAcc: number = 1.0;
  private currentPeakAcc: number = 6.65;
  private currentStatus: CPRStatus = 'OPTIMAL';

  // Realistic peak pool
  private peakPool: number[] = [3.5, 4.8, 5.6, 6.2, 6.65, 7.1, 5.8, 6.4];
  private peakIndex: number = 4;

  // Active Session Tracking
  private isSessionActive: boolean = false;
  private sessionStartedAt: number = 0;
  private sessionRateSamples: number[] = [];
  private sessionTiltSamples: number[] = [];
  private sessionPeaks: number[] = [];
  private sessionCompressionsStart: number = 0;

  constructor() {
    // Pre-populate waveform buffer with baseline ~1.0g
    for (let i = 0; i < this.BUFFER_SIZE; i++) {
      this.waveformBuffer.push(1.0);
    }
  }

  public async connect(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isStreamPaused = false;

    // Run tick at ~30Hz (every 33ms)
    const tickInterval = 33;
    let lastTime = Date.now();

    this.timer = window.setInterval(() => {
      const now = Date.now();
      const dt = now - lastTime;
      lastTime = now;

      if (!this.isStreamPaused) {
        this.stepSimulation(dt);
      }

      this.notifyListeners();
    }, tickInterval);
  }

  public disconnect(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  public subscribe(callback: Listener): () => void {
    this.listeners.add(callback);
    // Immediately emit current state
    callback(this.getCurrentData());

    // Auto-start if not running
    if (!this.isRunning) {
      this.connect();
    }

    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  public getStatus(): ConnectionStatus {
    return 'DEMO';
  }

  public pause(): void {
    this.isStreamPaused = true;
    this.currentStatus = 'PAUSED';
    this.notifyListeners();
  }

  public resume(): void {
    this.isStreamPaused = false;
    this.updateStatus();
    this.notifyListeners();
  }

  public reset(): void {
    this.compressionCount = 0;
    this.cycle = 1;
    this.totalCompressions = 0;
    this.strokePhase = 0;
    this.notifyListeners();
  }

  public isPaused(): boolean {
    return this.isStreamPaused;
  }

  public startSession(): void {
    this.isSessionActive = true;
    this.sessionStartedAt = Date.now();
    this.sessionRateSamples = [];
    this.sessionTiltSamples = [];
    this.sessionPeaks = [];
    this.sessionCompressionsStart = this.totalCompressions;
  }

  public stopSession(): CPRSession | null {
    if (!this.isSessionActive) return null;

    const endedAt = Date.now();
    const duration = Math.max(1, Math.round((endedAt - this.sessionStartedAt) / 1000));
    const totalCompressions = Math.max(0, this.totalCompressions - this.sessionCompressionsStart);

    // Calculate metrics
    const avgRate = this.sessionRateSamples.length > 0
      ? Math.round(this.sessionRateSamples.reduce((a, b) => a + b, 0) / this.sessionRateSamples.length)
      : this.compressionRate;

    const inTargetCount = this.sessionRateSamples.filter((r) => r >= 100 && r <= 120).length;
    const targetRangePercentage = this.sessionRateSamples.length > 0
      ? Math.round((inTargetCount / this.sessionRateSamples.length) * 100)
      : 92;

    const avgTilt = this.sessionTiltSamples.length > 0
      ? Number((this.sessionTiltSamples.reduce((a, b) => a + b, 0) / this.sessionTiltSamples.length).toFixed(1))
      : 14.5;

    const maxPeak = this.sessionPeaks.length > 0
      ? Math.max(...this.sessionPeaks)
      : this.currentPeakAcc;

    const session: CPRSession = {
      id: `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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

  /**
   * Internal simulation physics step
   */
  private stepSimulation(dtMs: number): void {
    // Advance stroke phase (0 to 1)
    const phaseDelta = dtMs / this.strokeDurationMs;
    const prevPhase = this.strokePhase;
    this.strokePhase = (this.strokePhase + phaseDelta) % 1.0;

    // Check if compression event triggered (apex occurs at phase ~0.25)
    if (prevPhase < 0.25 && this.strokePhase >= 0.25) {
      this.onCompressionEvent();
    }

    // Generate instantaneous acceleration curve based on phase:
    // Baseline is 1.0g (gravity)
    // 0.0 - 0.25: Downward acceleration spike (pushes from 1.0g to peakAcc)
    // 0.25 - 0.50: Sharp recoil / rebound dip (from peak down to ~0.5g)
    // 0.50 - 0.85: Recovery towards baseline with subtle mechanical damping
    // 0.85 - 1.00: Rest baseline before next cycle
    let acc = 1.0;
    const peak = this.currentPeakAcc;

    if (this.strokePhase < 0.25) {
      // Downstroke
      const t = this.strokePhase / 0.25;
      // Exponential rise to peak
      acc = 1.0 + (peak - 1.0) * Math.sin(t * Math.PI * 0.5);
    } else if (this.strokePhase < 0.50) {
      // Recoil
      const t = (this.strokePhase - 0.25) / 0.25;
      acc = peak - (peak - 0.45) * Math.sin(t * Math.PI * 0.5);
    } else if (this.strokePhase < 0.80) {
      // Rebound settle
      const t = (this.strokePhase - 0.50) / 0.30;
      acc = 0.45 + (1.0 - 0.45) * Math.sin(t * Math.PI * 0.5);
    } else {
      // Small baseline tremor (±0.05g)
      acc = 1.0 + (Math.sin(Date.now() / 120) * 0.04);
    }

    this.currentInstantAcc = Number(acc.toFixed(2));

    // Push into rolling buffer
    this.waveformBuffer.push(this.currentInstantAcc);
    if (this.waveformBuffer.length > this.BUFFER_SIZE) {
      this.waveformBuffer.shift();
    }

    // Subtle natural tilt drift (11° to 17°)
    const tiltNoise = Math.sin(Date.now() / 1500) * 2.5 + Math.cos(Date.now() / 800) * 1.0;
    this.currentTilt = Number(Math.max(8, Math.min(22, 14.5 + tiltNoise)).toFixed(1));

    // Record session metrics if session active
    if (this.isSessionActive) {
      this.sessionRateSamples.push(this.compressionRate);
      this.sessionTiltSamples.push(this.currentTilt);
    }

    this.updateStatus();
  }

  /**
   * Called exactly when downstroke compression apex occurs
   */
  private onCompressionEvent(): void {
    this.compressionCount++;
    this.totalCompressions++;

    if (this.compressionCount > this.targetCount) {
      this.compressionCount = 1;
      this.cycle++;
    }

    // Select next realistic peak from varying pool
    this.peakIndex = (this.peakIndex + 1) % this.peakPool.length;
    // Add ±0.15g micro-variance
    const variance = (Math.random() - 0.5) * 0.3;
    this.currentPeakAcc = Number((this.peakPool[this.peakIndex] + variance).toFixed(2));

    if (this.isSessionActive) {
      this.sessionPeaks.push(this.currentPeakAcc);
    }

    // Realistic slight rate fluctuation between 108 and 116 CPM
    const rateOffset = Math.sin(this.totalCompressions * 0.4) * 4;
    this.compressionRate = Math.round(112 + rateOffset);
    this.strokeDurationMs = (60 / this.compressionRate) * 1000;
  }

  private updateStatus(): void {
    if (this.isStreamPaused) {
      this.currentStatus = 'PAUSED';
      return;
    }

    if (this.currentTilt > 20) {
      this.currentStatus = 'TILT';
    } else if (this.compressionRate < 100) {
      this.currentStatus = 'SLOW';
    } else if (this.compressionRate > 120) {
      this.currentStatus = 'FAST';
    } else {
      this.currentStatus = 'OPTIMAL';
    }
  }

  private getCurrentData(): CPRData {
    return {
      timestamp: Date.now(),
      cprRate: this.compressionRate,
      rate: this.compressionRate,
      compressionCount: this.compressionCount,
      targetCount: this.targetCount,
      totalCompressions: this.totalCompressions,
      cycle: this.cycle,
      tilt: this.currentTilt,
      acceleration: this.currentInstantAcc,
      peakAcceleration: this.currentPeakAcc,
      status: this.currentStatus,
      waveformBuffer: [...this.waveformBuffer],
    };
  }

  private notifyListeners(): void {
    const data = this.getCurrentData();
    for (const listener of this.listeners) {
      listener(data);
    }
  }
}

export const demoAdapter = new DemoAdapter();
