export function isRequestCanceled(error) {
  return error?.code === "ERR_CANCELED" || error?.name === "CanceledError";
}

export function getApiErrorMessage(error, fallback = "Ocorreu um erro inesperado.") {
  if (isRequestCanceled(error)) return "Operação cancelada.";

  const data = error?.response?.data;
  const validationErrors = data?.errors;

  if (validationErrors && typeof validationErrors === "object") {
    const first = Object.values(validationErrors).flat().find(Boolean);
    if (first) return String(first);
  }

  if (data?.message) return data.message;
  if (data?.error) return data.error;

  if (error?.code === "ECONNABORTED") {
    return "A API demorou demais para responder. Tente novamente.";
  }

  if (!error?.response && error?.message) {
    return "Não foi possível conectar à API. Verifique sua conexão e tente novamente.";
  }

  return fallback;
}
