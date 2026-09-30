import { ESP32TelemetryMessage } from '../types/cpr';

const VALID_STATUSES = new Set(['OPTIMAL', 'SLOW', 'FAST', 'TILT', 'PAUSED']);

/**
 * Validates incoming WebSocket JSON messages against the ESP32 telemetry contract.
 * Returns the typed payload if valid, or null if malformed.
 */
export function validateTelemetryMessage(raw: unknown): ESP32TelemetryMessage | null {
  if (!raw || typeof raw !== 'object') {
    if (import.meta.env?.DEV) {
      console.warn('[TelemetryValidator] Invalid message: Expected object, received', typeof raw);
    }
    return null;
  }

  const obj = raw as Record<string, unknown>;

  if (obj.type !== 'telemetry') {
    if (import.meta.env?.DEV) {
      console.warn('[TelemetryValidator] Invalid message: Expected type "telemetry", received', obj.type);
    }
    return null;
  }

  if (typeof obj.timestamp !== 'number' || !Number.isFinite(obj.timestamp) || obj.timestamp <= 0) {
    if (import.meta.env?.DEV) {
      console.warn('[TelemetryValidator] Invalid timestamp:', obj.timestamp);
    }
    return null;
  }

  if (typeof obj.compressionCount !== 'number' || !Number.isFinite(obj.compressionCount) || obj.compressionCount < 0) {
    if (import.meta.env?.DEV) {
      console.warn('[TelemetryValidator] Invalid compressionCount:', obj.compressionCount);
    }
    return null;
  }

  if (typeof obj.cprRate !== 'number' || !Number.isFinite(obj.cprRate) || obj.cprRate < 0) {
    if (import.meta.env?.DEV) {
      console.warn('[TelemetryValidator] Invalid cprRate:', obj.cprRate);
    }
    return null;
  }

  if (typeof obj.peakAcceleration !== 'number' || !Number.isFinite(obj.peakAcceleration) || obj.peakAcceleration < 0) {
    if (import.meta.env?.DEV) {
      console.warn('[TelemetryValidator] Invalid peakAcceleration:', obj.peakAcceleration);
    }
    return null;
  }

  if (typeof obj.tilt !== 'number' || !Number.isFinite(obj.tilt)) {
    if (import.meta.env?.DEV) {
      console.warn('[TelemetryValidator] Invalid tilt:', obj.tilt);
    }
    return null;
  }

  if (typeof obj.status !== 'string' || !VALID_STATUSES.has(obj.status)) {
    if (import.meta.env?.DEV) {
      console.warn('[TelemetryValidator] Invalid status:', obj.status);
    }
    return null;
  }

  return {
    type: 'telemetry',
    timestamp: obj.timestamp,
    compressionCount: Math.round(obj.compressionCount),
    cprRate: Math.round(obj.cprRate),
    peakAcceleration: Number(obj.peakAcceleration.toFixed(2)),
    tilt: Number(obj.tilt.toFixed(1)),
    status: obj.status as ESP32TelemetryMessage['status'],
  };
}
