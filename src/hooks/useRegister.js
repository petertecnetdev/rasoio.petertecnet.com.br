// src/hooks/useRegister.js
import { useCallback, useMemo, useState } from "react";
import Swal from "sweetalert2";
import api from "../services/api";

const fieldLabelMap = {
  first_name: "Nome",
  username: "Nome",
  user_name: "Usuário",
  name: "Nome",
  email: "E-mail",
  cpf: "CPF",
  password: "Senha",
  password_confirmation: "Confirmar senha",
};

const normalizeApiErrors = (data) => {
  const errors = data?.errors;

  if (errors && typeof errors === "object") {
    const items = [];
    Object.entries(errors).forEach(([field, messages]) => {
      const label = fieldLabelMap[field] || field;
      const arr = Array.isArray(messages) ? messages : [messages];
      arr
        .filter(Boolean)
        .forEach((m) => items.push({ field, label, message: String(m) }));
    });
    return items;
  }

  const msg = data?.error || data?.message || "Ocorreu um erro.";
  return [{ field: null, label: "Erro", message: String(msg) }];
};

const buildTextListErrors = (items = []) => {
  if (!items.length) return "Verifique os dados informados.";
  return items.map((item) => `${item.label}: ${item.message}`).join("\n");
};

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const getSafeRedirectPath = (value, fallback = "/login") => {
  if (!value || typeof value !== "string") return fallback;

  try {
    const target = new URL(value, window.location.origin);
    if (target.origin !== window.location.origin) return fallback;

    return `${target.pathname}${target.search}${target.hash}` || fallback;
  } catch {
    return fallback;
  }
};

export default function useRegister({ redirectTo = "/login" } = {}) {
  const [form, setForm] = useState({
    first_name: "",
    email: "",
    cpf: "",
    password: "",
    password_confirmation: "",
  });

  const [ui, setUi] = useState({
    showPass: false,
    showPass2: false,
    loading: false,
  });

  const setField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const togglePass = useCallback(() => {
    setUi((prev) => ({ ...prev, showPass: !prev.showPass }));
  }, []);

  const togglePass2 = useCallback(() => {
    setUi((prev) => ({ ...prev, showPass2: !prev.showPass2 }));
  }, []);

  const canSubmit = useMemo(() => {
    const nameOk = String(form.first_name || "").trim().length >= 3;
    const emailOk = String(form.email || "").trim().length > 0;

    // CPF é opcional
    const cpfDigits = onlyDigits(form.cpf);
    const cpfOk = cpfDigits.length === 0 || cpfDigits.length === 11;

    const passOk = String(form.password || "").trim().length >= 6;
    const pass2Ok = String(form.password_confirmation || "").trim().length >= 6;

    return nameOk && emailOk && cpfOk && passOk && pass2Ok;
  }, [form]);

  const passwordMatchStatus = useMemo(() => {
    if (!form.password_confirmation?.length) return "empty";
    return form.password === form.password_confirmation ? "match" : "mismatch";
  }, [form.password, form.password_confirmation]);

  const submit = useCallback(
    async (callbacks = {}) => {
      const { onSuccess, onError, onStart } = callbacks;

      if (ui.loading) return;

      // validação local
      if (form.password !== form.password_confirmation) {
        await Swal.fire({
          title: "Erro",
          text: buildTextListErrors([
            { label: "Confirmar senha", message: "As senhas não coincidem." },
          ]),
          icon: "error",
          confirmButtonText: "Ok",
        });
        return;
      }

      const cpfDigits = onlyDigits(form.cpf);
      if (cpfDigits.length > 0 && cpfDigits.length !== 11) {
        await Swal.fire({
          title: "Erro",
          text: buildTextListErrors([
            { label: "CPF", message: "O CPF deve conter 11 números." },
          ]),
          icon: "error",
          confirmButtonText: "Ok",
        });
        return;
      }

      setUi((prev) => ({ ...prev, loading: true }));
      onStart?.();

      try {
        // ✅ ALINHADO COM BACKEND AuthController@register
        await api.post("/auth/register", {
          first_name: String(form.first_name || "").trim(),
          email: String(form.email || "").trim(),
          password: form.password,
          cpf: cpfDigits.length ? cpfDigits : null,
        });

        await Swal.fire({
          title: "Sucesso",
          text: "Cadastro realizado com sucesso! Verifique seu e-mail para confirmar o código.",
          icon: "success",
          confirmButtonText: "Entrar",
        });

        onSuccess?.();
        window.location.assign(getSafeRedirectPath(redirectTo));
      } catch (err) {
        const data = err?.response?.data || null;
        const list = normalizeApiErrors(data);

        await Swal.fire({
          title: "Erro ao cadastrar",
          text: buildTextListErrors(list),
          icon: "error",
          confirmButtonText: "Ok",
        });

        onError?.(err);
      } finally {
        setUi((prev) => ({ ...prev, loading: false }));
      }
    },
    [form, redirectTo, ui.loading]
  );

  return {
    form,
    ui,
    setField,
    togglePass,
    togglePass2,
    canSubmit,
    passwordMatchStatus,
    submit,
  };
}
