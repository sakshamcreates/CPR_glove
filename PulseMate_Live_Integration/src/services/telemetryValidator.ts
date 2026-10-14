import { CPRStatus, ESP32TelemetryMessage } from '../types/cpr';

const VALID_STATUSES = new Set([
  'OPTIMAL',
  'SLOW',
  'FAST',
  'TILT',
  'PAUSED',
  'STANDBY',
  'CRITICAL',
  'TOO_SLOW',
  'TOO_FAST',
  'POSITION_ALERT',
  'PAUSE_WARNING',
]);

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Normalizes either the original demo/gateway contract or the PulseMate
 * ESP32-S3 firmware packet into the UI's internal telemetry contract.
 *
 * Firmware telemetry sample:
 * {
 *   "type": "telemetry",
 *   "t": 452777,
 *   "sample_seq": 112285,
 *   "sensor_ok": true,
 *   "sample_age_ms": 3,
 *   "ax": 0.131,
 *   "ay": 0.169,
 *   "az": 1.105,
 *   "vert_g": 0,
 *   "tilt_deg": 5.4,
 *   "tilt_status": "ok",
 *   "rate": null,
 *   "rate_status": "none",
 *   "comp_in_cycle": 23,
 *   "total_compressions": 62,
 *   "session": "measuring"
 * }
 */
export function validateTelemetryMessage(raw: unknown): ESP32TelemetryMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  // Check if packet is explicit telemetry or contains firmware telemetry signature
  const isTelemetryType = obj.type === 'telemetry';
  const hasTelemetryFields =
    'sample_seq' in obj ||
    'total_compressions' in obj ||
    'tilt_deg' in obj ||
    'sensor_ok' in obj ||
    ('ax' in obj && 'ay' in obj) ||
    'comp_in_cycle' in obj;

  if (!isTelemetryType && !hasTelemetryFields) {
    return null;
  }

  // Current PulseMate firmware payload
  if (hasTelemetryFields || 'ax' in obj || 'vert_g' in obj) {
    const sensorOk = obj.sensor_ok !== false && obj.sensorOk !== false;

    const count = finiteNumber(obj.comp_in_cycle)
      ? obj.comp_in_cycle
      : finiteNumber(obj.compressionCount)
      ? obj.compressionCount
      : 0;

    const total = finiteNumber(obj.total_compressions)
      ? obj.total_compressions
      : finiteNumber(obj.totalCompressions)
      ? obj.totalCompressions
      : count;

    // Handle rate: null as unavailable data, never automatically coerce to zero
    const hasRate = finiteNumber(obj.rate) && obj.rate > 0;
    const rateVal = hasRate ? Math.round(obj.rate as number) : null;

    const tiltVal = finiteNumber(obj.tilt_deg)
      ? obj.tilt_deg
      : finiteNumber(obj.tilt)
      ? obj.tilt
      : 0;

    const ax = finiteNumber(obj.ax) ? obj.ax : 0;
    const ay = finiteNumber(obj.ay) ? obj.ay : 0;
    const az = finiteNumber(obj.az) ? obj.az : 0;
    const vertG = finiteNumber(obj.vert_g) ? obj.vert_g : 0;
    const rawMagnitude = Math.sqrt(ax * ax + ay * ay + az * az);
    const acceleration = Number(rawMagnitude.toFixed(3));
    const peakAcceleration = finiteNumber(obj.peakAcceleration)
      ? Number(obj.peakAcceleration.toFixed(2))
      : Number(rawMagnitude.toFixed(2));

    const tiltStatus = typeof obj.tilt_status === 'string' ? obj.tilt_status.toLowerCase() : 'ok';
    const rateStatus = typeof obj.rate_status === 'string' ? obj.rate_status.toLowerCase() : 'none';
    const sessionStr = typeof obj.session === 'string' ? obj.session : undefined;

    let status: CPRStatus = 'STANDBY';
    if (!sensorOk) {
      status = 'CRITICAL';
    } else if (tiltStatus !== 'ok' && tiltStatus !== 'none' && tiltStatus !== 'valid') {
      status = 'TILT';
    } else if (rateVal !== null && rateVal > 0) {
      if (rateVal >= 100 && rateVal <= 120) status = 'OPTIMAL';
      else if (rateVal < 100) status = 'SLOW';
      else status = 'FAST';
    } else if (rateStatus === 'slow' || rateStatus === 'too_slow') {
      status = 'SLOW';
    } else if (rateStatus === 'fast' || rateStatus === 'too_fast') {
      status = 'FAST';
    } else if (rateStatus === 'optimal' || rateStatus === 'ok') {
      status = 'OPTIMAL';
    } else if (typeof obj.status === 'string' && VALID_STATUSES.has(obj.status.toUpperCase())) {
      status = obj.status.toUpperCase() as CPRStatus;
    } else if (sessionStr === 'standby') {
      status = 'STANDBY';
    } else {
      status = 'PAUSED';
    }

    const t = finiteNumber(obj.t) ? obj.t : undefined;
    const sampleSeq = finiteNumber(obj.sample_seq)
      ? obj.sample_seq
      : finiteNumber(obj.sampleSeq)
      ? obj.sampleSeq
      : undefined;

    const sampleAgeMs = finiteNumber(obj.sample_age_ms)
      ? obj.sample_age_ms
      : finiteNumber(obj.sampleAgeMs)
      ? obj.sampleAgeMs
      : 0;

    return {
      type: 'telemetry',
      t,
      timestamp: Date.now(),
      sampleSeq,
      sample_seq: sampleSeq,
      sensorOk,
      sensor_ok: sensorOk,
      sampleAgeMs,
      sample_age_ms: sampleAgeMs,
      ax: Number(ax.toFixed(3)),
      ay: Number(ay.toFixed(3)),
      az: Number(az.toFixed(3)),
      vertG: Number(vertG.toFixed(3)),
      vert_g: Number(vertG.toFixed(3)),
      tiltDeg: Number(tiltVal.toFixed(1)),
      tilt_deg: Number(tiltVal.toFixed(1)),
      tiltStatus: typeof obj.tilt_status === 'string' ? obj.tilt_status : 'ok',
      tilt_status: typeof obj.tilt_status === 'string' ? obj.tilt_status : 'ok',
      cprRate: rateVal,
      rate: rateVal,
      rateStatus: typeof obj.rate_status === 'string' ? obj.rate_status : 'none',
      rate_status: typeof obj.rate_status === 'string' ? obj.rate_status : 'none',
      rateAvailable: hasRate,
      compressionCount: Math.max(0, Math.round(count)),
      comp_in_cycle: Math.max(0, Math.round(count)),
      totalCompressions: Math.max(0, Math.round(total)),
      total_compressions: Math.max(0, Math.round(total)),
      acceleration,
      peakAcceleration,
      tilt: Number(tiltVal.toFixed(1)),
      status,
      session: sessionStr,
    };
  }

  // Backwards-compatible contract for simulator/gateway
  if (
    !finiteNumber(obj.timestamp) || obj.timestamp <= 0 ||
    !finiteNumber(obj.compressionCount) || obj.compressionCount < 0 ||
    !finiteNumber(obj.cprRate) || obj.cprRate < 0 ||
    !finiteNumber(obj.peakAcceleration) || obj.peakAcceleration < 0 ||
    !finiteNumber(obj.tilt) ||
    typeof obj.status !== 'string' || !VALID_STATUSES.has(obj.status)
  ) {
    if (import.meta.env?.DEV) {
      console.warn('[TelemetryValidator] Rejected unsupported telemetry payload:', obj);
    }
    return null;
  }

  const rate = Math.round(obj.cprRate as number);
  const compCount = Math.max(0, Math.round(obj.compressionCount as number));

  return {
    type: 'telemetry',
    timestamp: Date.now(),
    sensorOk: true,
    sensor_ok: true,
    sampleAgeMs: 0,
    sample_age_ms: 0,
    ax: 0,
    ay: 0,
    az: 1.0,
    vertG: 0,
    vert_g: 0,
    tiltDeg: Number((obj.tilt as number).toFixed(1)),
    tilt_deg: Number((obj.tilt as number).toFixed(1)),
    tiltStatus: 'ok',
    tilt_status: 'ok',
    cprRate: rate,
    rate: rate,
    rateStatus: rate >= 100 && rate <= 120 ? 'optimal' : rate < 100 ? 'slow' : 'fast',
    rate_status: rate >= 100 && rate <= 120 ? 'optimal' : rate < 100 ? 'slow' : 'fast',
    rateAvailable: true,
    compressionCount: compCount,
    comp_in_cycle: compCount,
    totalCompressions: compCount,
    total_compressions: compCount,
    acceleration: 1.0,
    peakAcceleration: Number((obj.peakAcceleration as number).toFixed(2)),
    tilt: Number((obj.tilt as number).toFixed(1)),
    status: obj.status as CPRStatus,
  };
}
