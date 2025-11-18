import React, { useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl, appId } from "../../config";
import "./InviteFormComponent.css";

export default function InviteFormComponent({ redirectTo }) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    email: "",
    app_id: appId
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${apiBaseUrl}/invite`, form);
      Swal.fire("Convite enviado!", "O usuário recebeu o código por email.", "success");
      window.location.href = redirectTo;
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Erro ao enviar convite.";
      Swal.fire("Erro", msg, "error");
    }

    setLoading(false);
  };

  return (
    <Form onSubmit={handleSubmit} className="text-start text-white">
      <Form.Group className="mb-3">
        <Form.Label>Nome</Form.Label>
        <Form.Control
          type="text"
          name="first_name"
          placeholder="Digite o nome"
          value={form.first_name}
          onChange={handleChange}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>E-mail</Form.Label>
        <Form.Control
          type="email"
          name="email"
          placeholder="Digite o e-mail"
          value={form.email}
          onChange={handleChange}
        />
      </Form.Group>

      <Button
        type="submit"
        className="w-100 mt-2 login-btn"
        disabled={loading}
      >
        {loading ? <Spinner size="sm" /> : "Enviar convite"}
      </Button>
    </Form>
  );
}
