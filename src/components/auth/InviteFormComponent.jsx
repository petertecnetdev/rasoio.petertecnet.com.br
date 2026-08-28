// src/components/auth/InviteFormComponent.jsx
import React, { useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import { appId } from "../../config";
import api from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";
import "./InviteFormComponent.css";

export default function InviteFormComponent({ redirectTo }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    email: "",
  });

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await api.post("/invite", {
        first_name: form.first_name.trim(),
        email: form.email.trim().toLowerCase(),
        app_id: appId,
      });

      await Swal.fire({
        title: "Convite enviado!",
        text: "O usuário recebeu o código por e-mail.",
        icon: "success",
        confirmButtonText: "OK",
      });

      if (redirectTo) window.location.assign(redirectTo);
    } catch (error) {
      await Swal.fire(
        "Erro",
        getApiErrorMessage(error, "Erro ao enviar convite."),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="invite-form-component">
      <Form.Group className="mb-3" controlId="inviteFirstName">
        <Form.Label>Nome</Form.Label>
        <Form.Control
          type="text"
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          placeholder="Nome do usuário"
          autoComplete="given-name"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="inviteEmail">
        <Form.Label>E-mail</Form.Label>
        <Form.Control
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="email@exemplo.com"
          autoComplete="email"
          required
        />
      </Form.Group>

      <Button
        type="submit"
        variant="primary"
        className="w-100 mt-2"
        disabled={loading}
      >
        {loading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Enviando...
          </>
        ) : (
          "Enviar convite"
        )}
      </Button>
    </Form>
  );
}
