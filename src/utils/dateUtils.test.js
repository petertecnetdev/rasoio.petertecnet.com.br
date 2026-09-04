import { formatDatePtBr, getWeekdayIndex, toIsoDate } from "./dateUtils";
import { formatCurrencyBr } from "./moneyUtils";

describe("date and money utilities", () => {
  test("formats plain dates without timezone drift", () => {
    expect(formatDatePtBr("2026-09-04")).toBe("04/09/2026");
    expect(toIsoDate("2026-09-04")).toBe("2026-09-04");
  });

  test("returns empty output for invalid dates", () => {
    expect(formatDatePtBr("not-a-date")).toBe("");
  });

  test("keeps weekday indexing compatible with Sunday-first lists", () => {
    expect(getWeekdayIndex("2026-09-06")).toBe(0);
    expect(getWeekdayIndex("2026-09-07")).toBe(1);
  });

  test("formats BRL consistently", () => {
    expect(formatCurrencyBr(12.5)).toContain("12,50");
  });
});
