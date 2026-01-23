// src/components/auth/RegisterFormComponent.jsx
import React, { useMemo } from "react";
import { Form, Button } from "react-bootstrap";
import PropTypes from "prop-types";
import ProcessingIndicatorComponent from "../ProcessingIndicatorComponent";
import useRegister from "../../hooks/useRegister";
import "./RegisterFormComponent.css";

// util simples pra máscara de CPF
const formatCPF = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9
  )}-${digits.slice(9, 11)}`;
};

export default function RegisterFormComponent({ redirectTo }) {
  const {
    form,
    ui,
    setField,
    togglePass,
    togglePass2,
    canSubmit,
    passwordMatchStatus,
    submit,
  } = useRegister({ redirectTo });

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  const cpfValue = useMemo(() => formatCPF(form.cpf), [form.cpf]);

  return (
    <>
      {ui.loading && (
        <ProcessingIndicatorComponent
          messages={["Criando sua conta...", "Aguarde..."]}
        />
      )}

      {!ui.loading && (
        <Form onSubmit={handleSubmit} className="register-form-component">
          <div className="rfg">
            {/* NOME */}
            <div className="rfg__field">
              <label className="rfg__label" htmlFor="register-first-name">
                Nome
              </label>

              <div className="rfg__inputWrap">
                <span className="rfg__icon" aria-hidden="true">
                  👤
                </span>

                <Form.Control
                  id="register-first-name"
                  type="text"
                  placeholder="Seu nome"
                  autoComplete="name"
                  className="rfg__input"
                  value={form.first_name}
                  onChange={(e) => setField("first_name", e.target.value)}
                  required
                />
              </div>

              <div className="rfg__hint">
                Apenas letras e espaços. Mínimo 3 caracteres.
              </div>
            </div>

            {/* EMAIL */}
            <div className="rfg__field">
              <label className="rfg__label" htmlFor="register-email">
                E-mail
              </label>

              <div className="rfg__inputWrap">
                <span className="rfg__icon" aria-hidden="true">
                  ✉
                </span>

                <Form.Control
                  id="register-email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  autoComplete="email"
                  className="rfg__input"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* CPF (OPCIONAL) */}
            <div className="rfg__field">
              <label className="rfg__label" htmlFor="register-cpf">
                CPF <span className="rfg__optional">(opcional)</span>
              </label>

              <div className="rfg__inputWrap">
                <span className="rfg__icon" aria-hidden="true">
                  🪪
                </span>

                <Form.Control
                  id="register-cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  className="rfg__input"
                  value={cpfValue}
                  onChange={(e) => setField("cpf", e.target.value)}
                />
              </div>

              <div className="rfg__hint">
                Se informado, deve conter exatamente 11 números.
              </div>
            </div>

            {/* PASSWORD */}
            <div className="rfg__field">
              <label className="rfg__label" htmlFor="register-password">
                Senha
              </label>

              <div className="rfg__inputWrap rfg__inputWrap--password">
                <span className="rfg__icon" aria-hidden="true">
                  🔒
                </span>

                <Form.Control
                  id="register-password"
                  type={ui.showPass ? "text" : "password"}
                  placeholder="Crie uma senha"
                  autoComplete="new-password"
                  className="rfg__input"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="rfg__toggle"
                  onClick={togglePass}
                  aria-label={ui.showPass ? "Ocultar senha" : "Mostrar senha"}
                  title={ui.showPass ? "Ocultar senha" : "Mostrar senha"}
                >
                  {ui.showPass ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              <div className="rfg__hint">
                Precisa conter: 1 maiúscula, 1 minúscula, 1 número e 1 caractere
                especial.
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="rfg__field">
              <label
                className="rfg__label"
                htmlFor="register-password-confirmation"
              >
                Confirmar senha
              </label>

              <div className="rfg__inputWrap rfg__inputWrap--password">
                <span className="rfg__icon" aria-hidden="true">
                  ✅
                </span>

                <Form.Control
                  id="register-password-confirmation"
                  type={ui.showPass2 ? "text" : "password"}
                  placeholder="Digite novamente"
                  autoComplete="new-password"
                  className="rfg__input"
                  value={form.password_confirmation}
                  onChange={(e) => setField("password_confirmation", e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="rfg__toggle"
                  onClick={togglePass2}
                  aria-label={ui.showPass2 ? "Ocultar senha" : "Mostrar senha"}
                  title={ui.showPass2 ? "Ocultar senha" : "Mostrar senha"}
                >
                  {ui.showPass2 ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              <div className="rfg__match">
                {passwordMatchStatus !== "empty" ? (
                  passwordMatchStatus === "match" ? (
                    <span className="rfg__ok">Senhas conferem ✓</span>
                  ) : (
                    <span className="rfg__bad">Senhas não conferem</span>
                  )
                ) : (
                  <span className="rfg__muted">Confirme sua senha</span>
                )}
              </div>
            </div>

            {/* SUBMIT */}
            <Button type="submit" className="rfg__submit" disabled={!canSubmit}>
              Criar conta
            </Button>

            {/* LINKS */}
            <div className="rfg__links">
              <a className="rfg__link" href="/login">
                Já tenho conta
              </a>
              <span className="rfg__sep">•</span>
              <a className="rfg__link" href="/password-email">
                Recuperar senha
              </a>
            </div>
          </div>
        </Form>
      )}
    </>
  );
}

RegisterFormComponent.propTypes = {
  redirectTo: PropTypes.string,
};

RegisterFormComponent.defaultProps = {
  redirectTo: "/login",
};
