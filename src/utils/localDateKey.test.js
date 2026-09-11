import { toLocalDateKey } from "./localDateKey";

describe("toLocalDateKey", () => {
  it("preserva valores de input date sem reinterpretar em UTC", () => {
    expect(toLocalDateKey("2026-09-09")).toBe("2026-09-09");
  });

  it("formata Date usando o calendário local", () => {
    const localDate = new Date(2026, 8, 9, 23, 45, 0);

    expect(toLocalDateKey(localDate)).toBe("2026-09-09");
  });

  it("retorna vazio para uma data inválida", () => {
    expect(toLocalDateKey("data-invalida")).toBe("");
  });
});
