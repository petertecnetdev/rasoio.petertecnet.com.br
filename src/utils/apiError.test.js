import { getApiErrorMessage, isRequestCanceled } from "./apiError";

describe("apiError", () => {
  test("prioritiza a mensagem devolvida pela API", () => {
    expect(
      getApiErrorMessage({ response: { status: 422, data: { message: "Horário indisponível." } } })
    ).toBe("Horário indisponível.");
  });

  test("traduz timeout e indisponibilidade de rede", () => {
    expect(getApiErrorMessage({ code: "ECONNABORTED" })).toMatch(/demorou demais/i);
    expect(getApiErrorMessage({ request: {} })).toMatch(/conectar ao servidor/i);
  });

  test("traduz os principais códigos HTTP", () => {
    expect(getApiErrorMessage({ response: { status: 401, data: {} } })).toMatch(/sessão expirou/i);
    expect(getApiErrorMessage({ response: { status: 403, data: {} } })).toMatch(/permissão/i);
    expect(getApiErrorMessage({ response: { status: 404, data: {} } })).toMatch(/não foi encontrado/i);
    expect(getApiErrorMessage({ response: { status: 409, data: {} } })).toMatch(/conflito/i);
    expect(getApiErrorMessage({ response: { status: 429, data: {} } })).toMatch(/muitas tentativas/i);
    expect(getApiErrorMessage({ response: { status: 500, data: {} } })).toMatch(/indisponível/i);
  });

  test("identifica cancelamentos do Axios", () => {
    expect(isRequestCanceled({ code: "ERR_CANCELED" })).toBe(true);
    expect(isRequestCanceled({ name: "CanceledError" })).toBe(true);
    expect(isRequestCanceled(new Error("falha"))).toBe(false);
  });
});
