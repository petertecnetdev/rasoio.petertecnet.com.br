import React, { useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import { appId } from "../../config";
import api from "../../services/api";
import "./InviteFormComponent.css";

export default function InviteFormComponent({ redirectTo, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ first_name: "", email: "", app_id: appId });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post("/invite", {
        ...form,
        first_name: form.first_name.trim(),
        email: form.email.trim().toLowerCase(),
      });
      setLoading(false);

      if (typeof onSuccess === "function") {
        onSuccess(data);
      } else {
        await Swal.fire({
          title: "Convite enviado!",
          text: data?.message || "O usuário recebeu o código por e-mail.",
          icon: "success",
          confirmButtonText: "OK",
        });
      }

      setForm({ first_name: "", email: "", app_id: appId });
      if (redirectTo) window.location.assign(redirectTo);
    } catch (error) {
      setLoading(false);
      const validation = error?.response?.data?.errors;
      const firstValidationMessage = validation
        ? Object.values(validation).flat().find(Boolean)
        : null;
      const message =
        firstValidationMessage ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Erro ao enviar convite.";
      await Swal.fire("Erro", String(message), "error");
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
          autoComplete="name"
          maxLength={100}
          required
          disabled={loading}
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
          maxLength={255}
          required
          disabled={loading}
        />
      </Form.Group>

      <Button type="submit" variant="primary" className="w-100 mt-2" disabled={loading}>
        {loading ? (
          <>
            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
            Enviando...
          </>
        ) : (
          "Enviar convite"
        )}
      </Button>
    </Form>
  );
}
