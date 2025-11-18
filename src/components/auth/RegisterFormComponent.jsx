// src/components/auth/RegisterFormComponent.jsx
import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import PropTypes from "prop-types";
import Swal from "sweetalert2";
import api from "../../services/api";
import ProcessingIndicatorComponent from "../ProcessingIndicatorComponent";
import "./RegisterFormComponent.css";

export default function RegisterFormComponent({ redirectTo }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== passwordConfirmation) {
      Swal.fire({
        title: "Erro",
        text: "As senhas não coincidem.",
        icon: "error",
        confirmButtonText: "Ok",
      });
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        username,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      Swal.fire({
        title: "Sucesso",
        text: "Cadastro realizado com sucesso!",
        icon: "success",
        confirmButtonText: "Entrar",
      }).then(() => {
        window.location.href = redirectTo;
      });
    } catch (err) {
      let msg = "Ocorreu um erro.";
      if (err.response) {
        msg =
          err.response.data.error ||
          err.response.data.message ||
          (err.response.data.errors
            ? Object.values(err.response.data.errors).flat().join(" ")
            : msg);
      }

      Swal.fire({
        title: "Erro",
        text: msg,
        icon: "error",
        confirmButtonText: "Ok",
      });

      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <ProcessingIndicatorComponent
          messages={["Registrando...", "Aguarde..."]}
        />
      )}

      {!loading && (
        <Form onSubmit={handleSubmit} className="login-form-component mt-4">
          <Form.Control
            type="text"
            placeholder="Usuário"
            className="neon-input mb-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <Form.Control
            type="email"
            placeholder="E-mail"
            className="neon-input mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Form.Control
            type="password"
            placeholder="Senha"
            className="neon-input mb-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Form.Control
            type="password"
            placeholder="Confirmar Senha"
            className="neon-input mb-4"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
          />

          <Button type="submit" className="neon-button w-100 mb-3">
            Registrar
          </Button>

          <div className="login-links">
            <a href="/login">Já tenho conta</a>
            <span className="sep">|</span>
            <a href="/password-email">Recuperar senha</a>
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
