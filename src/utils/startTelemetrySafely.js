import { startTelemetry } from "../telemetry";
import { safeLocalStorage } from "./safeStorage";

const noop = () => {};

/**
 * Telemetry must never be allowed to block the application bootstrap.
 * Browsers, PWAs and WebViews can deny access to browser storage; in that
 * scenario revenue flows are more important than analytics collection.
 */
export function startTelemetrySafely(options = {}) {
  const getToken = options.getToken || (() => safeLocalStorage.getItem("token"));

  try {
    return startTelemetry({ ...options, getToken }) || noop;
  } catch {
    return noop;
  }
}

export default startTelemetrySafely;
