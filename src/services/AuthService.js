import axios from "axios";
import api from "./api";
import { apiBaseUrl } from "../config";

const apiServiceUrl = "auth";

const authService = {
  getToken: () => localStorage.getItem("token"),
  setToken: (token) => localStorage.setItem("token", token),

  login: async (email, password) => {
    try {
      const response = await axios.post(`${apiBaseUrl}/${apiServiceUrl}/login`, { email, password });
      if (response.status !== 200) throw new Error("Credenciais inválidas");
      const { token, user, message } = response.data;
      const accessToken = token?.original?.access_token || token?.access_token || response.data?.access_token;
      if (!accessToken) throw new Error("A API não retornou um token de acesso.");
      authService.setToken(accessToken);
      console.log(message);
      window.location.href = "/dashboard";
      return { success: true, user };
    } catch (error) {
      if (error.response?.data?.error) throw new Error(error.response.data.error);
      if (error.response?.data?.errors) throw error.response.data.errors;
      throw new Error(error?.message || "Erro durante o login. Por favor, tente novamente.");
    }
  },

  register: async (userObject) => {
    try {
      const response = await axios.post(`${apiBaseUrl}/${apiServiceUrl}/register`, userObject);
      if (response.data.message === "Registro bem-sucedido") {
        await authService.login(userObject.email, userObject.password);
        return true;
      }
      return false;
    } catch (error) {
      if (error.response?.data?.errors) throw error.response.data.errors;
      throw new Error("Erro durante o registro. Por favor, tente novamente.");
    }
  },

  logout: async () => {
    if (window.PeterIdentity?.logoutCurrentApp) {
      await window.PeterIdentity.logoutCurrentApp();
      window.location.href = "/login";
      return true;
    }

    try {
      await api.post(`/${apiServiceUrl}/logout`);
    } finally {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return true;
  },

  emailVerify: async (verificationCode) => {
    await api.post(`/${apiServiceUrl}/email-verify`, { verification_code: verificationCode });
    window.location.href = "/dashboard";
    return true;
  },

  changePassword: async (current_password, new_password, confirm_password) => {
    if (!authService.getToken()) throw new Error("Usuário não autenticado.");
    try {
      await api.post(`/${apiServiceUrl}/change-password`, {
        current_password,
        new_password,
        confirm_password,
      });
      return true;
    } catch (error) {
      console.error(error);
      throw new Error("Erro ao alterar a senha. Por favor, tente novamente.");
    }
  },

  me: async () => {
    if (!authService.getToken()) throw new Error("Usuário não autenticado.");
    try {
      const response = await api.get(`/${apiServiceUrl}/me`);
      return response.data?.user ?? response.data;
    } catch (error) {
      console.error("Erro ao obter os dados do usuário:", error);
      throw new Error("Erro ao obter os dados do usuário.");
    }
  },

  passwordEmail: async (email) => {
    try {
      const response = await axios.post(`${apiBaseUrl}/${apiServiceUrl}/password-email`, { email });
      return response.data;
    } catch (error) {
      if (!error.response) throw new Error("Houve uma falha na comunicação com o servidor. Por favor, tente novamente.");
      return error.response.data;
    }
  },

  passwordReset: async (email, resetCode, newPassword) => {
    try {
      return await axios.post(`${apiBaseUrl}/${apiServiceUrl}/password-reset`, {
        email,
        reset_password_code: resetCode,
        password: newPassword,
      });
    } catch (error) {
      if (error.response) {
        const message = error.response.data.message || "Erro durante a redefinição de senha.";
        throw new Error(`${message} (Status: ${error.response.status})`);
      }
      throw new Error("Erro durante a redefinição de senha. Por favor, tente novamente.");
    }
  },

  resendCodeEmailVerification: async () => {
    if (!authService.getToken()) throw new Error("Usuário não autenticado.");
    try {
      await api.post(`/${apiServiceUrl}/resend-code-email-verification`, {});
      return true;
    } catch (error) {
      console.error(error);
      throw new Error("Erro ao reenviar o código de verificação. Por favor, tente novamente.");
    }
  },
};

export default authService;
