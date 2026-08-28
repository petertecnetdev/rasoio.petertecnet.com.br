import { escapeHtml } from "./html";

describe("escapeHtml", () => {
  test("escapa conteúdo que poderia virar marcação executável", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
  });

  test("aceita valores nulos sem quebrar", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});
