import api from "./api";
import { getApiErrorMessage } from "../utils/apiError";

const extractToken = (payload = {}) =>
  payload?.token?.access_token ??
  payload?.token?.original?.access_token ??
  payload?.access_token ??
  (typeof payload?.token === "string" ? payload.token : null);

const authService = {
  getToken: () => localStorage.getItem("token"),
  setToken: (token) => localStorage.setItem("token", token),

  login: async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", {
        username: email,
        password,
      });
      const token = extractToken(data);
      if (!token) throw new Error("Token de autenticação não recebido pela API.");

      authService.setToken(token);
      window.dispatchEvent(new Event("authChanged"));
      return { success: true, user: data?.user ?? null, message: data?.message };
    } catch (error) {
      if (error?.response?.data?.errors) throw error.response.data.errors;
      throw new Error(getApiErrorMessage(error, "Erro durante o login. Por favor, tente novamente."));
    }
  },

  register: async (userObject) => {
    try {
      const { data } = await api.post("/auth/register", userObject);
      return data;
    } catch (error) {
      if (error?.response?.data?.errors) throw error.response.data.errors;
      throw new Error(getApiErrorMessage(error, "Erro durante o cadastro. Por favor, tente novamente."));
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      if (error?.response?.status && error.response.status !== 401) {
        throw new Error(getApiErrorMessage(error, "Erro ao encerrar a sessão."));
      }
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("employer");
      window.dispatchEvent(new Event("authChanged"));
    }
    return true;
  },

  emailVerify: async (verificationCode) => {
    try {
      const { data } = await api.post("/auth/email-verify", {
        verification_code: verificationCode,
      });
      window.dispatchEvent(new Event("authChanged"));
      return data ?? true;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Erro durante a verificação do e-mail."));
    }
  },

  changePassword: async (current_password, new_password, confirm_password) => {
    try {
      const { data } = await api.post("/auth/change-password", {
        current_password,
        new_password,
        password_confirmation: confirm_password,
      });
      return data ?? true;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Erro ao alterar a senha. Por favor, tente novamente."));
    }
  },

  me: async () => {
    try {
      const { data } = await api.get("/auth/me");
      return data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Erro ao obter os dados do usuário."));
    }
  },

  passwordEmail: async (email) => {
    try {
      const { data } = await api.post("/auth/password-email", { email });
      return data;
    } catch (error) {
      if (error?.response?.data) return error.response.data;
      throw new Error(getApiErrorMessage(error, "Falha na comunicação com o servidor."));
    }
  },

  passwordReset: async (email, resetCode, newPassword) => {
    try {
      return await api.post("/auth/password-reset", {
        email,
        reset_password_code: resetCode,
        password: newPassword,
      });
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Erro durante a redefinição de senha."));
    }
  },

  resendCodeEmailVerification: async () => {
    try {
      const { data } = await api.post("/auth/resend-code-email-verification", {});
      return data ?? true;
    } catch (error) {
      throw new Error(
        getApiErrorMessage(error, "Erro ao reenviar o código de verificação. Por favor, tente novamente.")
      );
    }
  },
};

export default authService;
