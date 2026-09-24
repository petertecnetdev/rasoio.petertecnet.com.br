// src/components/auth/InviteFormComponent.jsx
import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import { appId } from "../../config";
import api from "../../services/api";
import ProcessingIndicatorComponent from "../ProcessingIndicatorComponent";
import "./InviteFormComponent.css";

export default function InviteFormComponent({ redirectTo }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    email: "",
    app_id: appId,
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      await api.post("/invite", form);

      await Swal.fire({
        title: "Convite enviado!",
        text: "O usuário recebeu o código por email.",
        icon: "success",
        confirmButtonText: "OK",
      });

      if (redirectTo) {
        window.location.href = redirectTo;
      }
    } catch (error) {
      const msg =
        error?.response?.data?.message || "Erro ao enviar convite.";
      await Swal.fire("Erro", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="invite-form-component" aria-busy={loading}>
      {loading && (
        <ProcessingIndicatorComponent
          blocking={false}
          messages={["Enviando convite…"]}
        />
      )}

      <Form.Group className="mb-3" controlId="inviteFirstName">
        <Form.Label>Nome</Form.Label>
        <Form.Control
          type="text"
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          placeholder="Nome do usuário"
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
          required
          disabled={loading}
        />
      </Form.Group>

      <Button
        type="submit"
        variant="primary"
        className="w-100 mt-2"
        disabled={loading}
      >
        {loading ? "Enviando..." : "Enviar convite"}
      </Button>
    </Form>
  );
}
