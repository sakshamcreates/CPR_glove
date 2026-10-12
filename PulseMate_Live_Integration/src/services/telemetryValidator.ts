import { CPRStatus, ESP32TelemetryMessage } from '../types/cpr';

const VALID_STATUSES = new Set(['OPTIMAL', 'SLOW', 'FAST', 'TILT', 'PAUSED', 'STANDBY', 'CRITICAL']);

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Normalizes either the original demo/gateway contract or the current PulseMate
 * ESP32 firmware packet into the UI's internal telemetry contract.
 *
 * Current firmware sample:
 * { type: "telemetry", t: 690586, sample_seq: 171710, sensor_ok: true, sample_age_ms: 1,
 *   ax: 0.110, ay: 0.358, az: 1.042, vert_g: -0.014, tilt_deg: 0.4, tilt_status: "ok",
 *   rate: null, rate_status: "none", comp_in_cycle: 0, total_compressions: 0, session: "standby" }
 */
export function validateTelemetryMessage(raw: unknown): ESP32TelemetryMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (obj.type !== 'telemetry') return null;

  // Current PulseMate firmware payload.
  if (
    'sample_seq' in obj ||
    'total_compressions' in obj ||
    'tilt_deg' in obj ||
    'sensor_ok' in obj ||
    'ax' in obj ||
    'vert_g' in obj
  ) {
    const sensorOk = obj.sensor_ok !== false;
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

    // Handle rate: null as unavailable, not as zero
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
    } else if (rateStatus === 'slow') {
      status = 'SLOW';
    } else if (rateStatus === 'fast') {
      status = 'FAST';
    } else if (rateStatus === 'optimal' || rateStatus === 'ok') {
      status = 'OPTIMAL';
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

  // Backwards-compatible contract for the older simulator/gateway.
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

  const legacyRate = Math.round(obj.cprRate);
  const rateAvailable = legacyRate > 0;
  const legacyStatus = obj.status as CPRStatus;

  return {
    type: 'telemetry',
    timestamp: obj.timestamp,
    compressionCount: Math.round(obj.compressionCount),
    comp_in_cycle: Math.round(obj.compressionCount),
    totalCompressions: finiteNumber(obj.totalCompressions) ? Math.round(obj.totalCompressions) : Math.round(obj.compressionCount),
    total_compressions: finiteNumber(obj.totalCompressions) ? Math.round(obj.totalCompressions) : Math.round(obj.compressionCount),
    cprRate: rateAvailable ? legacyRate : null,
    rate: rateAvailable ? legacyRate : null,
    rateAvailable,
    rateStatus: rateAvailable ? (legacyRate >= 100 && legacyRate <= 120 ? 'optimal' : legacyRate < 100 ? 'slow' : 'fast') : 'none',
    rate_status: rateAvailable ? (legacyRate >= 100 && legacyRate <= 120 ? 'optimal' : legacyRate < 100 ? 'slow' : 'fast') : 'none',
    peakAcceleration: Number(obj.peakAcceleration.toFixed(2)),
    acceleration: finiteNumber(obj.acceleration) ? Number(obj.acceleration.toFixed(3)) : Number(obj.peakAcceleration.toFixed(2)),
    ax: 0,
    ay: 0,
    az: finiteNumber(obj.acceleration) ? Number(obj.acceleration.toFixed(3)) : Number(obj.peakAcceleration.toFixed(2)),
    vertG: 0,
    vert_g: 0,
    tiltDeg: Number(obj.tilt.toFixed(1)),
    tilt_deg: Number(obj.tilt.toFixed(1)),
    tilt: Number(obj.tilt.toFixed(1)),
    tiltStatus: obj.tilt > 18 ? 'tilt' : 'ok',
    tilt_status: obj.tilt > 18 ? 'tilt' : 'ok',
    sensorOk: true,
    sensor_ok: true,
    sampleAgeMs: 0,
    sample_age_ms: 0,
    status: legacyStatus,
  };
}
