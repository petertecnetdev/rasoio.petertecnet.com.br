// src/components/auth/LoginFormComponent.jsx
import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { GoogleLogin } from "@react-oauth/google";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import api from "../../services/api";
import ProcessingIndicatorComponent from "../ProcessingIndicatorComponent";
import "./LoginFormComponent.css";

export default function LoginFormComponent({ onSuccess, redirectTo }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const setToken = (token) => localStorage.setItem("token", token);
  const extractToken = (p) =>
    p.token?.access_token ??
    p.token?.original?.access_token ??
    p.access_token ??
    p.token;

  const showError = (msg) =>
    Swal.fire({
      title: "Erro",
      text: msg,
      icon: "error",
      confirmButtonText: "Ok",
      customClass: {
        popup: "custom-swal",
        title: "custom-swal-title",
        content: "custom-swal-text",
      },
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { username, password });
      const token = extractToken(data);
      if (!token) throw new Error("Token não recebido");
      setToken(token);
      window.dispatchEvent(new Event("authChanged"));
      if (onSuccess) onSuccess(token);
      else window.location.href = redirectTo;
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Falha no login.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async ({ credential }) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/google", { token_id: credential });
      const token = extractToken(data);
      if (!token) throw new Error("Token Google não recebido");
      setToken(token);
      window.dispatchEvent(new Event("authChanged"));
      if (onSuccess) onSuccess(token);
      else window.location.href = redirectTo;
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Falha no login com Google.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => showError("Falha no login com Google.");

  return (
    <>
      {loading && (
        <ProcessingIndicatorComponent
          messages={["Autenticando...", "Aguarde..."]}
        />
      )}
      {!loading && (
        <Form onSubmit={handleSubmit} className="login-form-component mt-4">
          <Form.Control
            type="text"
            placeholder="Usuário ou e-mail"
            className="neon-input mb-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Form.Control
            type="password"
            placeholder="Senha"
            className="neon-input mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="neon-button w-100 mb-3">
            Entrar
          </Button>

          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            render={(props) => (
              <Button
                onClick={props.onClick}
                disabled={props.disabled}
                className="google-button w-100 mb-3"
              >
                Continuar com Google
              </Button>
            )}
          />

          <div className="login-links">
            <a href="/register">Registrar-se</a>
            <span className="sep">|</span>
            <a href="/password-email">Recuperar senha</a>
          </div>
        </Form>
      )}
    </>
  );
}

LoginFormComponent.propTypes = {
  onSuccess: PropTypes.func,
  redirectTo: PropTypes.string,
};

LoginFormComponent.defaultProps = {
  redirectTo: "/",
};
