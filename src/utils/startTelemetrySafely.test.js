import { startTelemetry } from "../telemetry";
import { startTelemetrySafely } from "./startTelemetrySafely";

jest.mock("../telemetry", () => ({
  startTelemetry: jest.fn(),
}));

describe("startTelemetrySafely", () => {
  beforeEach(() => {
    startTelemetry.mockReset();
  });

  it("returns the telemetry cleanup when startup succeeds", () => {
    const cleanup = jest.fn();
    startTelemetry.mockReturnValue(cleanup);

    const result = startTelemetrySafely({ apiBaseUrl: "https://api.example.com", appSlug: "rasoio", appId: 1 });

    expect(result).toBe(cleanup);
    expect(startTelemetry).toHaveBeenCalledTimes(1);
    expect(startTelemetry.mock.calls[0][0].getToken).toEqual(expect.any(Function));
  });

  it("fails open when telemetry startup throws", () => {
    startTelemetry.mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });

    const cleanup = startTelemetrySafely({ apiBaseUrl: "https://api.example.com", appSlug: "rasoio", appId: 1 });

    expect(() => cleanup()).not.toThrow();
  });

  it("preserves an explicitly supplied token resolver", () => {
    const getToken = jest.fn(() => "token");
    startTelemetry.mockReturnValue(jest.fn());

    startTelemetrySafely({ appSlug: "rasoio", getToken });

    expect(startTelemetry.mock.calls[0][0].getToken).toBe(getToken);
  });
});
