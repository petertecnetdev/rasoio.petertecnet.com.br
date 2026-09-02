import { describe, expect, test } from "vitest";
import { appId, appSlug, linkApp } from "./config";

describe("Rasoio application identity", () => {
  test("keeps the canonical application contract", () => {
    expect(appId).toBe(1);
    expect(appSlug).toBe("rasoio");
    expect(linkApp).toBe("https://rasoio.petertecnet.com.br");
  });
});
