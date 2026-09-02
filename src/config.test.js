import { describe, expect, test } from "vitest";
import { apiBaseUrl, appId, appSlug, linkApp } from "./config";

describe("Rasoio production configuration", () => {
  test("uses the canonical application identity and HTTPS endpoints", () => {
    expect(appSlug).toBe("rasoio");
    expect(appId).toBe(1);
    expect(apiBaseUrl).toBe("https://api.petertecnet.com.br/api");
    expect(linkApp).toBe("https://rasoio.petertecnet.com.br");
    expect(apiBaseUrl.startsWith("https://")).toBe(true);
    expect(linkApp.startsWith("https://")).toBe(true);
  });
});
