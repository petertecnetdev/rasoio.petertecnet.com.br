// src/hooks/useEstablishmentUpdate.js
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import api from "../services/api";

const resolveImageFromEstablishment = (establishment, type) => {
  const files = Array.isArray(establishment?.files) ? establishment.files : [];
  return files.find((file) => file?.type === type)?.public_url || establishment?.[type] || null;
};

const safeMessage = (value) => (typeof value === "string" && value.trim() ? value.trim() : null);

const apiErrorMessage = (error, fallback) => {
  const payload = error?.response?.data;
  if (payload?.errors && typeof payload.errors === "object") {
    const messages = Object.values(payload.errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map(safeMessage)
      .filter(Boolean);
    if (messages.length) return messages.join("\n");
  }
  return safeMessage(payload?.message) || safeMessage(payload?.error) || safeMessage(error?.message) || fallback;
};

export default function useEstablishmentUpdate(id, navigate, reset, setValue) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [segments, setSegments] = useState([]);
  const [files, setFiles] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/establishment/show/${id}`);
        if (!active) return;

        const establishment = data?.establishment || data || {};
        reset({
          name: establishment.name || "",
          fantasy: establishment.fantasy || "",
          cnpj: establishment.cnpj || "",
          phone: establishment.phone || "",
          email: establishment.email || "",
          description: establishment.description || "",
          address: establishment.address || "",
          city: establishment.city || "",
          uf: establishment.uf || "",
          cep: establishment.cep || "",
          location: establishment.location || "",
          instagram_url: establishment.instagram_url || "",
          facebook_url: establishment.facebook_url || "",
          twitter_url: establishment.twitter_url || "",
          youtube_url: establishment.youtube_url || "",
          website_url: establishment.website_url || "",
          segments: [],
        });

        let nextSegments = [];
        if (Array.isArray(establishment.segments)) nextSegments = establishment.segments;
        else if (typeof establishment.segments === "string" && establishment.segments.trim()) {
          try {
            const parsed = JSON.parse(establishment.segments);
            nextSegments = Array.isArray(parsed) ? parsed : [];
          } catch {
            nextSegments = establishment.segments.split(",").map((value) => value.trim()).filter(Boolean);
          }
        }

        setSegments(nextSegments);
        setValue("segments", nextSegments);
        setLogoPreview(resolveImageFromEstablishment(establishment, "logo"));
        setBackgroundPreview(resolveImageFromEstablishment(establishment, "background"));
        setSlug(establishment.slug || "");
      } catch (error) {
        await Swal.fire(
          "Não foi possível carregar o estabelecimento",
          apiErrorMessage(error, "Verifique sua conexão e tente novamente."),
          "error"
        );
        navigate("/establishment/my");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [id, navigate, reset, setValue]);

  const processAndResizeImage = (file, width, height, setPreview, key) =>
    new Promise((resolve, reject) => {
      if (!file || !file.type?.startsWith("image/")) {
        reject(new Error("Selecione uma imagem válida."));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error("A imagem deve ter no máximo 10 MB."));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Seu navegador não conseguiu processar a imagem."));
            return;
          }

          const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
          const drawWidth = img.naturalWidth * scale;
          const drawHeight = img.naturalHeight * scale;
          context.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);

          setPreview(canvas.toDataURL("image/jpeg", 0.88));
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Não foi possível converter a imagem."));
              return;
            }
            const resized = new File([blob], `${key}.jpg`, { type: "image/jpeg" });
            setFiles((previous) => ({ ...previous, [key]: resized }));
            resolve(resized);
          }, "image/jpeg", 0.88);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await processAndResizeImage(file, 512, 512, setLogoPreview, "logo");
    } catch (error) {
      await Swal.fire("Erro na logo", safeMessage(error?.message) || "Não foi possível processar a imagem.", "error");
    } finally {
      event.target.value = "";
    }
  };

  const handleBackgroundChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await processAndResizeImage(file, 1920, 600, setBackgroundPreview, "background");
    } catch (error) {
      await Swal.fire("Erro na capa", safeMessage(error?.message) || "Não foi possível processar a imagem.", "error");
    } finally {
      event.target.value = "";
    }
  };

  const handleSegmentsChange = (event) => {
    const { value, checked } = event.target;
    const updated = checked
      ? Array.from(new Set([...segments, value]))
      : segments.filter((segment) => segment !== value);
    setSegments(updated);
    setValue("segments", updated, { shouldDirty: true });
  };

  const submitUpdate = async (dataInput) => {
    if (saving) return;
    setSaving(true);

    const formData = new FormData();
    Object.entries(dataInput || {}).forEach(([key, value]) => {
      if (key === "segments") return;
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    segments.forEach((segment) => formData.append("segments[]", segment));
    if (files.logo) formData.append("logo", files.logo);
    if (files.background) formData.append("background", files.background);

    try {
      const { data } = await api.post(`/establishment/${id}`, formData);
      await Swal.fire("Estabelecimento atualizado", safeMessage(data?.message) || "Alterações salvas com sucesso.", "success");
      navigate(`/establishment/view/${data?.establishment?.slug || slug}`);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Não foi possível salvar",
        text: apiErrorMessage(error, "Ocorreu um erro ao atualizar o estabelecimento."),
        confirmButtonText: "Corrigir dados",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    segments,
    logoPreview,
    backgroundPreview,
    handleLogoChange,
    handleBackgroundChange,
    handleSegmentsChange,
    submitUpdate,
  };
}
