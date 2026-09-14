import { safeLocalStorage } from "./safeStorage";

describe("safeLocalStorage", () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(window, "localStorage");

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(window, "localStorage", originalDescriptor);
    }
  });

  const installBlockedStorage = () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: jest.fn(() => {
          throw new DOMException("blocked", "SecurityError");
        }),
        setItem: jest.fn(() => {
          throw new DOMException("blocked", "SecurityError");
        }),
        removeItem: jest.fn(() => {
          throw new DOMException("blocked", "SecurityError");
        }),
      },
    });
  };

  test("keeps pending checkout state in memory when localStorage is blocked", () => {
    installBlockedStorage();

    expect(() => safeLocalStorage.setItem("pending_subscription_plan", "intent-123")).not.toThrow();
    expect(safeLocalStorage.getItem("pending_subscription_plan")).toBe("intent-123");
  });

  test("cleanup does not throw when localStorage is blocked", () => {
    installBlockedStorage();
    safeLocalStorage.setItem("pending_subscription_plan", "intent-456");

    expect(() => safeLocalStorage.removeItem("pending_subscription_plan")).not.toThrow();
    expect(safeLocalStorage.getItem("pending_subscription_plan")).toBeNull();
  });

  test("uses browser localStorage normally when it is available", () => {
    const storage = {
      getItem: jest.fn(() => "token-abc"),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: storage,
    });

    expect(safeLocalStorage.getItem("token")).toBe("token-abc");
    safeLocalStorage.setItem("key", "value");
    safeLocalStorage.removeItem("key");

    expect(storage.setItem).toHaveBeenCalledWith("key", "value");
    expect(storage.removeItem).toHaveBeenCalledWith("key");
  });
});
