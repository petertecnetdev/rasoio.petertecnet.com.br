import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

import api from "../services/api";

const resolveAvatar = (user) => {
  if (!user) return null;
  if (user.avatar) return user.avatar;
  if (user.images?.avatar) return user.images.avatar;

  const files = Array.isArray(user.files) ? user.files : [];
  const avatar = files.find((file) => file?.type === "avatar");
  return avatar?.public_url || avatar?.url || null;
};

const apiErrorMessage = (error, fallback) => {
  const payload = error?.response?.data;

  if (payload?.errors && typeof payload.errors === "object") {
    const messages = Object.values(payload.errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter(Boolean);
    if (messages.length) return messages.join("\n");
  }

  return payload?.error || payload?.message || error?.message || fallback;
};

export default function useUserUpdate(reset) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/auth/me");
      const user = data?.user || {};

      reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        cpf: user.cpf || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        uf: user.uf || "",
        postal_code: user.postal_code || "",
        birthdate: user.birthdate ? String(user.birthdate).slice(0, 10) : "",
        gender: user.gender || "",
        occupation: user.occupation || "",
        about: user.about || "",
      });

      setAvatarPreview(resolveAvatar(user));
      setAvatarFile(null);
      setUserId(user.id ?? null);
      setUserName(user.user_name || "");
      setEmail(user.email || "");
      setOriginalEmail(user.email || "");
    } catch (error) {
      await Swal.fire("Erro", apiErrorMessage(error, "Não foi possível carregar seus dados."), "error");
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleResizeAvatar = (file) =>
    new Promise((resolve, reject) => {
      if (!file || !file.type?.startsWith("image/")) {
        Swal.fire("Formato inválido", "Selecione uma imagem JPG, PNG ou WEBP.", "error");
        reject(new Error("invalid-image"));
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        Swal.fire("Imagem muito grande", "Escolha uma imagem de até 8 MB.", "error");
        reject(new Error("image-too-large"));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem selecionada."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Não foi possível abrir a imagem selecionada."));
        img.onload = () => {
          const side = Math.min(img.naturalWidth, img.naturalHeight);
          const sx = Math.max(0, (img.naturalWidth - side) / 2);
          const sy = Math.max(0, (img.naturalHeight - side) / 2);
          const canvas = document.createElement("canvas");
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Seu navegador não conseguiu processar a imagem."));
            return;
          }

          ctx.drawImage(img, sx, sy, side, side, 0, 0, 512, 512);
          setAvatarPreview(canvas.toDataURL("image/jpeg", 0.9));

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Não foi possível converter a imagem para envio."));
                return;
              }

              const resized = new File([blob], "avatar.jpg", { type: "image/jpeg" });
              setAvatarFile(resized);
              resolve(resized);
            },
            "image/jpeg",
            0.9
          );
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await handleResizeAvatar(file);
    } catch (error) {
      await Swal.fire("Erro ao preparar avatar", error?.message || "Não foi possível preparar esta imagem.", "error");
    } finally {
      event.target.value = "";
    }
  };

  const requestAndConfirmEmailChange = async (newEmail) => {
    const requestResponse = await api.post("/account/email/request-change", {
      email: newEmail,
    });

    const { value: code, isConfirmed } = await Swal.fire({
      icon: "info",
      title: "Confirme o novo e-mail",
      text:
        requestResponse?.data?.message ||
        `Enviamos um código de confirmação para ${newEmail}.`,
      input: "text",
      inputLabel: "Código de 6 dígitos",
      inputPlaceholder: "000000",
      inputAttributes: {
        inputmode: "numeric",
        maxlength: "6",
        autocomplete: "one-time-code",
      },
      showCancelButton: true,
      confirmButtonText: "Confirmar e alterar",
      cancelButtonText: "Agora não",
      preConfirm: (value) => {
        const clean = String(value || "").replace(/\D/g, "");
        if (clean.length !== 6) {
          Swal.showValidationMessage("Digite os 6 dígitos enviados para o novo e-mail.");
          return false;
        }
        return clean;
      },
    });

    if (!isConfirmed || !code) return false;

    const confirmResponse = await api.post("/account/email/confirm-change", {
      code,
    });

    const updatedUser = confirmResponse?.data?.user;
    if (updatedUser) {
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setEmail(updatedUser.email || newEmail);
      setOriginalEmail(updatedUser.email || newEmail);
    }

    await Swal.fire(
      "E-mail alterado",
      confirmResponse?.data?.message || "Seu novo e-mail foi confirmado com sucesso.",
      "success"
    );

    return true;
  };

  const submitUpdate = async (data) => {
    if (!userId || saving) return;

    const newEmail = String(email || "").trim().toLowerCase();
    const currentEmail = String(originalEmail || "").trim().toLowerCase();

    if (!newEmail) {
      await Swal.fire("E-mail inválido", "Informe um endereço de e-mail válido.", "warning");
      return;
    }

    const formData = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      formData.append(key, value ?? "");
    });
    if (avatarFile) formData.append("avatar", avatarFile);
    formData.append("user_name", userName.trim());

    setSaving(true);
    try {
      const response = await api.post("/account/profile", formData);
      const updatedUser = response?.data?.user;

      if (updatedUser) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setAvatarPreview(resolveAvatar(updatedUser) || avatarPreview);
        setUserName(updatedUser.user_name || userName);
      }

      setAvatarFile(null);

      if (newEmail !== currentEmail) {
        try {
          await requestAndConfirmEmailChange(newEmail);
        } catch (emailError) {
          await Swal.fire({
            icon: "error",
            title: "Perfil salvo, mas o e-mail não foi alterado",
            text: apiErrorMessage(
              emailError,
              "Não foi possível confirmar a alteração do e-mail. O e-mail atual foi mantido."
            ),
          });
        }
      } else {
        await Swal.fire(
          "Perfil atualizado",
          response?.data?.message || "Suas alterações foram salvas com sucesso.",
          "success"
        );
      }

      window.dispatchEvent(new Event("authChanged"));
      await loadUser();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Não foi possível salvar seus dados",
        text: apiErrorMessage(error, "Não foi possível atualizar o perfil."),
        confirmButtonText: "Corrigir dados",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    avatarPreview,
    handleAvatarChange,
    userName,
    setUserName,
    email,
    setEmail,
    originalEmail,
    submitUpdate,
  };
}
