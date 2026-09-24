import axios from "axios";
import { apiBaseUrl } from "../config";
import { safeLocalStorage as localStorage } from "../utils/safeStorage";

const apiServiceUrl = "auth";

const authService = {
  getToken: () => localStorage.getItem("token"),
  setToken: (token) => localStorage.setItem("token", token),

  login: async (email, password) => {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/login`,
        {
          email,
          password,
        }
      );

      if (response.status === 200) {
        const { token, user, message } = response.data;
        authService.setToken(token.original.access_token);
        console.log(message);
        window.location.href = "/dashboard";
        return { success: true, user };
      } else {
        throw new Error("Credenciais inválidas");
      }
    } catch (error) {
      if (error.response && error.response.data.error) {
        throw new Error(error.response.data.error);
      } else if (error.response && error.response.data.errors) {
        throw error.response.data.errors;
      } else {
        throw new Error("Erro durante o login. Por favor, tente novamente.");
      }
    }
  },

  register: async (userObject) => {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/register`,
        userObject
      );

      if (response.data.message === "Registro bem-sucedido") {
        await authService.login(userObject.email, userObject.password);
        return true;
      }
    } catch (error) {
      if (error.response && error.response.data.errors) {
        throw error.response.data.errors;
      } else {
        throw new Error("Erro durante o registro. Por favor, tente novamente.");
      }
    }
  },

  logout: async () => {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/logout`
      );

      if (response.status === 200) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return true;
      } else if (response.status === 401) {
        throw new Error(response.data.error);
      } else {
        throw new Error("Erro ao fazer logout. Por favor, tente novamente.");
      }
    } catch (error) {
      console.error(error);
      throw new Error("Erro ao fazer logout. Por favor, tente novamente.");
    }
  },

  emailVerify: async (verificationCode) => {
    try {
      const headers = {
        Authorization: `Bearer ${authService.getToken()}`,
      };

      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/email-verify`,
        { verification_code: verificationCode },
        { headers }
      );

      if (response.status === 200) {
        window.location.href = "/dashboard";
        return true;
      }
    } catch (error) {
      console.error(error);
      throw new Error("Erro durante a verificação do e-mail");
    }
  },

  changePassword: async (current_password, new_password, confirm_password) => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Usuário não autenticado.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/change-password`,
        {
          current_password,
          new_password,
          confirm_password,
        },
        { headers }
      );

      if (response.status === 200) {
        return true;
      }
      throw new Error("Erro ao alterar a senha. Por favor, tente novamente.");
    } catch (error) {
      console.error(error);
      throw new Error("Erro ao alterar a senha. Por favor, tente novamente.");
    }
  },

  me: async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Usuário não autenticado.");
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      const response = await axios.get(`${apiBaseUrl}/${apiServiceUrl}/me`, { headers });
      return response.data;
    } catch (error) {
      console.error("Erro ao obter os dados do usuário:", error);
      window.location.href = "/login";
      throw new Error("Erro ao obter os dados do usuário.");
    }
  },

  passwordEmail: async (email) => {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/password-email`,
        { email }
      );
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error("Houve uma falha na comunicação com o servidor. Por favor, tente novamente.");
      }
      return error.response.data;
    }
  },

  passwordReset: async (email, resetCode, newPassword) => {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/password-reset`,
        {
          email,
          reset_password_code: resetCode,
          password: newPassword,
        }
      );
      return response;
    } catch (error) {
      if (error.response) {
        const message = error.response.data.message || "Erro durante a redefinição de senha.";
        const status = error.response.status;
        throw new Error(`${message} (Status: ${status})`);
      }
      throw new Error("Erro durante a redefinição de senha. Por favor, tente novamente.");
    }
  },

  resendCodeEmailVerification: async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Usuário não autenticado.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/resend-code-email-verification`,
        {},
        { headers }
      );

      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      console.error(error);
      throw new Error(
        "Erro ao reenviar o código de verificação. Por favor, tente novamente."
      );
    }
  },
};

export default authService;
