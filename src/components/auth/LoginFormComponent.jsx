// src/components/auth/LoginFormComponent.jsx
import React, { useMemo, useState } from "react";
import { Form, Button } from "react-bootstrap";
import { GoogleLogin } from "@react-oauth/google";
import PropTypes from "prop-types";
import useLogin from "../../hooks/useLogin";
import "./LoginFormComponent.css";

export default function LoginFormComponent({
  onStart,
  onSuccess,
  onError,
  redirectTo,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return String(username || "").trim().length > 0 && String(password || "").trim().length > 0;
  }, [username, password]);

  const { login, loginGoogle } = useLogin(
    (token) => {
      onSuccess?.(token);
    },
    redirectTo
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit || submitting) return;

    setSubmitting(true);
    onStart?.();

    try {
      await login(username, password);
    } catch (err) {
      onError?.(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (submitting) return;

    setSubmitting(true);
    onStart?.();

    try {
      await loginGoogle(credentialResponse?.credential || null);
    } catch (err) {
      onError?.(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="login-form-component">
      <div className="lfg">
        {/* USERNAME */}
        <div className="lfg__field">
          <label className="lfg__label" htmlFor="login-username">
            Usuário ou e-mail
          </label>

          <div className="lfg__inputWrap">
            <span className="lfg__icon" aria-hidden="true">
              ✉
            </span>

            <Form.Control
              id="login-username"
              type="text"
              autoComplete="username"
              placeholder="Digite seu usuário ou e-mail"
              className="lfg__input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="lfg__field">
          <label className="lfg__label" htmlFor="login-password">
            Senha
          </label>

          <div className="lfg__inputWrap">
            <span className="lfg__icon" aria-hidden="true">
              🔒
            </span>

            <Form.Control
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              className="lfg__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
        </div>

        {/* SUBMIT */}
        <Button
          type="submit"
          className="lfg__submit"
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <span className="lfg__loading">
              <span className="lfg__spinner" aria-hidden="true" />
              Entrando...
            </span>
          ) : (
            "Entrar"
          )}
        </Button>

        {/* DIVIDER */}
        <div className="lfg__divider">
          <span>ou</span>
        </div>

        {/* GOOGLE */}
        <div className="lfg__googleSlot">
          <div className="">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={onError}
              width="320"
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              locale="pt-BR"
            />
          </div>
        </div>

        {/* LINKS */}
        <div className="lfg__links">
          <a className="lfg__link" href="/register">
            Criar conta
          </a>

          <span className="lfg__sep">•</span>

          <a className="lfg__link" href="/password-email">
            Esqueci minha senha
          </a>
        </div>
      </div>
    </Form>
  );
}

LoginFormComponent.propTypes = {
  onStart: PropTypes.func,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  redirectTo: PropTypes.string,
};
