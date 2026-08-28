export const isRequestCanceled = (error) =>
  error?.code === "ERR_CANCELED" || error?.name === "CanceledError";

export function getApiErrorMessage(error, fallback = "Não foi possível concluir a operação.") {
  const apiMessage = error?.response?.data?.message || error?.response?.data?.error;

  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage.trim();
  }

  if (error?.code === "ECONNABORTED") {
    return "A conexão com o servidor demorou demais. Tente novamente.";
  }

  if (!error?.response) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
  }

  switch (error.response.status) {
    case 400:
      return "A solicitação enviada é inválida. Revise os dados e tente novamente.";
    case 401:
      return "Sua sessão expirou. Entre novamente para continuar.";
    case 403:
      return "Você não tem permissão para realizar esta ação.";
    case 404:
      return "O conteúdo solicitado não foi encontrado.";
    case 409:
      return "Esta operação entrou em conflito com os dados atuais. Atualize a página e tente novamente.";
    case 422:
      return "Alguns dados informados são inválidos. Revise o formulário e tente novamente.";
    case 429:
      return "Muitas tentativas em pouco tempo. Aguarde um momento e tente novamente.";
    default:
      if (error.response.status >= 500) {
        return "O serviço está temporariamente indisponível. Tente novamente em instantes.";
      }
      return fallback;
  }
}
