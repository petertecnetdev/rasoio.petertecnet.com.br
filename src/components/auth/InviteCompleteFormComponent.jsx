import React, { useMemo, useState } from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../services/api";

const passwordIsStrong = (value) =>
  value.length >= 8 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /\d/.test(value) &&
  /[^A-Za-z0-9]/.test(value);

export default function InviteCompleteFormComponent({ redirectTo = "/login" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: searchParams.get("email") || "",
    verification_code: searchParams.get("code") || searchParams.get("verification_code") || "",
    password: "",
    password_confirmation: "",
  });

  const passwordValid = useMemo(() => passwordIsStrong(form.password), [form.password]);
  const passwordsMatch = form.password === form.password_confirmation;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!passwordValid) {
      await Swal.fire("Senha inválida", "Use pelo menos 8 caracteres, com maiúscula, minúscula, número e símbolo.", "warning");
      return;
    }

    if (!passwordsMatch) {
      await Swal.fire("Senhas diferentes", "A confirmação precisa ser igual à senha.", "warning");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/invite-complete", {
        email: form.email.trim(),
        verification_code: form.verification_code.trim(),
        password: form.password,
      });

      setLoading(false);
      await Swal.fire({
        title: "Acesso liberado!",
        text: data?.message || "Sua senha foi criada. Você já pode entrar na Rasoio.",
        icon: "success",
        confirmButtonText: "Ir para o login",
      });
      navigate(redirectTo, { replace: true });
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
        "Não foi possível concluir o convite.";
      await Swal.fire("Erro", String(message), "error");
    }
  };

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <Form.Group className="mb-3" controlId="inviteCompleteEmail">
        <Form.Label>E-mail</Form.Label>
        <Form.Control
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          required
          disabled={loading}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="inviteCompleteCode">
        <Form.Label>Código do convite</Form.Label>
        <Form.Control
          type="text"
          name="verification_code"
          value={form.verification_code}
          onChange={handleChange}
          inputMode="numeric"
          autoComplete="one-time-code"
          minLength={4}
          maxLength={12}
          required
          disabled={loading}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="inviteCompletePassword">
        <Form.Label>Nova senha</Form.Label>
        <Form.Control
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
          minLength={8}
          required
          disabled={loading}
        />
        <Form.Text className="text-muted">
          Mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3" controlId="inviteCompletePasswordConfirmation">
        <Form.Label>Confirmar senha</Form.Label>
        <Form.Control
          type="password"
          name="password_confirmation"
          value={form.password_confirmation}
          onChange={handleChange}
          autoComplete="new-password"
          minLength={8}
          required
          disabled={loading}
        />
      </Form.Group>

      {form.password_confirmation && !passwordsMatch && (
        <Alert variant="warning" className="py-2">
          As senhas não coincidem.
        </Alert>
      )}

      <Button type="submit" className="w-100" disabled={loading || !form.email || !form.verification_code}>
        {loading ? (
          <>
            <Spinner as="span" animation="border" size="sm" className="me-2" />
            Finalizando...
          </>
        ) : (
          "Finalizar convite"
        )}
      </Button>
    </Form>
  );
}
