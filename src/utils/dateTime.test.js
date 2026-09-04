import { formatCurrencyBr, formatDatePtBr } from "./dateTime";

describe("dateTime", () => {
  test("formats plain dates without timezone drift", () => {
    expect(formatDatePtBr("2026-09-04")).toBe("04/09/2026");
  });

  test("returns an empty value for invalid dates", () => {
    expect(formatDatePtBr("not-a-date")).toBe("");
  });

  test("formats BRL consistently", () => {
    expect(formatCurrencyBr(12.5)).toContain("12,50");
  });
});
