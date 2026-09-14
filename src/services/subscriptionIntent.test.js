import api from "./api";
import {
  createSubscriptionPixCheckout,
  getSubscriptionIntentIdempotencyKey,
  syncSubscriptionPayment,
} from "./subscriptionIntent";
import { trackTelemetryEvent } from "../telemetry";

jest.mock("./api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock("../telemetry", () => ({
  trackTelemetryEvent: jest.fn(),
}));

describe("subscription billing storage resilience", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  const blockSessionStorage = () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(function getItem(key) {
      if (this === window.sessionStorage) throw new DOMException("Storage blocked", "SecurityError");
      return null;
    });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem() {
      if (this === window.sessionStorage) throw new DOMException("Storage blocked", "SecurityError");
    });
  };

  test("keeps a stable idempotency key in memory when sessionStorage is unavailable", () => {
    blockSessionStorage();

    const first = getSubscriptionIntentIdempotencyKey("pro-storage-test");
    const second = getSubscriptionIntentIdempotencyKey("pro-storage-test");

    expect(first).toBeTruthy();
    expect(second).toBe(first);
  });

  test("still creates PIX checkout and reuses the idempotency key on a transient retry", async () => {
    blockSessionStorage();
    api.post
      .mockRejectedValueOnce(new Error("temporary network failure"))
      .mockResolvedValueOnce({
        data: {
          payment: {
            status: "pending",
            pix: { qr_code: "000201-test" },
          },
        },
      });

    const result = await createSubscriptionPixCheckout("intent-storage-test");

    expect(result?.payment?.pix?.qr_code).toBe("000201-test");
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(api.post.mock.calls[0][2].headers["Idempotency-Key"]).toBe(
      api.post.mock.calls[1][2].headers["Idempotency-Key"]
    );
  });

  test("retries a transient payment sync failure and returns an active entitlement", async () => {
    api.post
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockResolvedValueOnce({
        data: {
          payment: { status: "approved" },
          subscription: { status: "active" },
          entitlement: { status: "active" },
        },
      });

    const result = await syncSubscriptionPayment("intent-paid-test");

    expect(api.post).toHaveBeenCalledTimes(2);
    expect(result?.subscription?.status).toBe("active");
    expect(result?.entitlement?.status).toBe("active");
    expect(trackTelemetryEvent).toHaveBeenCalledWith(
      "subscription_sync_retry",
      expect.objectContaining({
        metadata: expect.objectContaining({ attempt: 1, http_status: 503 }),
      })
    );
    expect(trackTelemetryEvent).toHaveBeenCalledWith(
      "subscription_activated",
      expect.objectContaining({
        metadata: expect.objectContaining({ attempt: 2 }),
      })
    );
  });

  test("does not retry a definitive payment sync client error", async () => {
    api.post.mockRejectedValueOnce({
      response: { status: 422, data: { message: "invalid intent" } },
    });

    const result = await syncSubscriptionPayment("intent-invalid-test");

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ message: "invalid intent" });
    expect(trackTelemetryEvent).toHaveBeenCalledWith(
      "subscription_sync_failed",
      expect.objectContaining({
        metadata: expect.objectContaining({
          attempt: 1,
          http_status: 422,
          retryable: false,
        }),
      })
    );
  });
});
