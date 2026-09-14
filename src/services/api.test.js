import { safeLocalStorageGet, safeLocalStorageRemove } from "./api";

describe("safe localStorage access for API revenue flows", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns null instead of throwing when localStorage reads are blocked", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(() => safeLocalStorageGet("token")).not.toThrow();
    expect(safeLocalStorageGet("token")).toBeNull();
  });

  test("returns false instead of throwing when localStorage cleanup is blocked", () => {
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(() => safeLocalStorageRemove("token")).not.toThrow();
    expect(safeLocalStorageRemove("token")).toBe(false);
  });

  test("keeps normal token reads working", () => {
    window.localStorage.setItem("token", "rasoio-test-token");

    expect(safeLocalStorageGet("token")).toBe("rasoio-test-token");

    window.localStorage.removeItem("token");
  });
});
