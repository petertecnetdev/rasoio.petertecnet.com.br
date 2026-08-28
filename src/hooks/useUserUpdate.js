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

export default function useUserUpdate(reset) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");

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
    } catch (error) {
      const message = error?.response?.data?.error || error?.response?.data?.message || "Não foi possível carregar seus dados.";
      await Swal.fire("Erro", message, "error");
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleResizeAvatar = (file) => new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith("image/")) {
      Swal.fire("Formato inválido", "Selecione uma imagem válida.", "error");
      reject(new Error("invalid-image"));
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      Swal.fire("Imagem muito grande", "Escolha uma imagem de até 8 MB.", "error");
      reject(new Error("image-too-large"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("file-read-failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("image-load-failed"));
      img.onload = () => {
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = Math.max(0, (img.naturalWidth - side) / 2);
        const sy = Math.max(0, (img.naturalHeight - side) / 2);
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("canvas-unavailable"));
          return;
        }

        ctx.drawImage(img, sx, sy, side, side, 0, 0, 512, 512);
        setAvatarPreview(canvas.toDataURL("image/jpeg", 0.9));
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("image-conversion-failed"));
            return;
          }
          const resized = new File([blob], "avatar.jpg", { type: "image/jpeg" });
          setAvatarFile(resized);
          resolve(resized);
        }, "image/jpeg", 0.9);
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
      console.error("Falha ao preparar avatar:", error);
    } finally {
      event.target.value = "";
    }
  };

  const submitUpdate = async (data) => {
    if (!userId || saving) return;

    const formData = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      formData.append(key, value ?? "");
    });
    if (avatarFile) formData.append("avatar", avatarFile);
    formData.append("user_name", userName.trim());

    setSaving(true);
    try {
      const response = await api.post(`/user/${userId}`, formData);
      const updatedUser = response?.data?.user;

      if (updatedUser) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setAvatarPreview(resolveAvatar(updatedUser) || avatarPreview);
        setUserName(updatedUser.user_name || userName);
        setEmail(updatedUser.email || email);
      }

      setAvatarFile(null);
      window.dispatchEvent(new Event("authChanged"));

      await Swal.fire(
        "Perfil atualizado",
        response?.data?.message || "Suas alterações foram salvas com sucesso.",
        "success"
      );
      await loadUser();
    } catch (error) {
      const payload = error?.response?.data;
      let message = payload?.error || payload?.message || "Não foi possível atualizar o perfil.";
      if (payload?.errors) message = Object.values(payload.errors).flat().join("\n");
      await Swal.fire("Erro", message, "error");
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
    submitUpdate,
  };
}
