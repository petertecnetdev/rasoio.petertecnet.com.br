// src/components/auth/LoginFormComponent.jsx
import React, { useMemo, useState } from "react";
import { Form, Button } from "react-bootstrap";
import { GoogleLogin } from "@react-oauth/google";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import useLogin from "../../hooks/useLogin";
import "./LoginFormComponent.css";

export default function LoginFormComponent({ onSuccess, onLoadingChange }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.trim().length > 0,
    [username, password]
  );

  const { loading, login, loginGoogle } = useLogin(onSuccess);

  React.useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || loading) return;

    try {
      await login(username.trim(), password);
    } catch {
      // O hook já exibe a mensagem da API.
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (loading) return;

    try {
      await loginGoogle(credentialResponse?.credential || null);
    } catch {
      // O hook já exibe a mensagem da API.
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="login-form-component" noValidate>
      <div className="lfg">
        <div className="lfg__field">
          <label className="lfg__label" htmlFor="login-username">
            Usuário ou e-mail
          </label>
          <div className="lfg__inputWrap">
            <span className="lfg__icon" aria-hidden="true">✉</span>
            <Form.Control
              id="login-username"
              type="text"
              autoComplete="username"
              placeholder="Digite seu usuário ou e-mail"
              className="lfg__input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="lfg__field">
          <label className="lfg__label" htmlFor="login-password">Senha</label>
          <div className="lfg__inputWrap">
            <span className="lfg__icon" aria-hidden="true">🔒</span>
            <Form.Control
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              className="lfg__input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        <Button type="submit" className="lfg__submit" disabled={!canSubmit || loading}>
          {loading ? (
            <span className="lfg__loading">
              <span className="lfg__spinner" aria-hidden="true" />
              Entrando...
            </span>
          ) : (
            "Entrar"
          )}
        </Button>

        <div className="lfg__divider"><span>ou</span></div>

        <div className="lfg__googleSlot">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {}}
            width="320"
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            locale="pt-BR"
          />
        </div>

        <div className="lfg__links">
          <Link className="lfg__link" to="/register">Criar conta</Link>
          <span className="lfg__sep">•</span>
          <Link className="lfg__link" to="/password-email">Esqueci minha senha</Link>
        </div>
      </div>
    </Form>
  );
}

LoginFormComponent.propTypes = {
  onSuccess: PropTypes.func,
  onLoadingChange: PropTypes.func,
};
