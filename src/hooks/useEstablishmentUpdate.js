// src/hooks/useEstablishmentUpdate.js
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import api from "../services/api";

const resolveImageFromEstablishment = (est, type) => {
  const files = Array.isArray(est?.files) ? est.files : [];
  return files.find((file) => file?.type === type)?.public_url || est?.[type] || null;
};

const apiErrorMessage = (error, fallback) => {
  const payload = error?.response?.data;
  if (payload?.errors && typeof payload.errors === "object") {
    const messages = Object.values(payload.errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter(Boolean);
    if (messages.length) return messages.join("\n");
  }
  return payload?.message || payload?.error || error?.message || fallback;
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

        const est = data?.establishment || data || {};
        reset({
          name: est.name || "",
          fantasy: est.fantasy || "",
          cnpj: est.cnpj || "",
          phone: est.phone || "",
          email: est.email || "",
          description: est.description || "",
          address: est.address || "",
          city: est.city || "",
          uf: est.uf || "",
          cep: est.cep || "",
          location: est.location || "",
          instagram_url: est.instagram_url || "",
          facebook_url: est.facebook_url || "",
          twitter_url: est.twitter_url || "",
          youtube_url: est.youtube_url || "",
          website_url: est.website_url || "",
          segments: [],
        });

        let nextSegments = [];
        if (Array.isArray(est.segments)) nextSegments = est.segments;
        else if (typeof est.segments === "string" && est.segments.trim()) {
          try {
            const parsed = JSON.parse(est.segments);
            nextSegments = Array.isArray(parsed) ? parsed : [];
          } catch {
            nextSegments = est.segments.split(",").map((value) => value.trim()).filter(Boolean);
          }
        }

        setSegments(nextSegments);
        setValue("segments", nextSegments);
        setLogoPreview(resolveImageFromEstablishment(est, "logo"));
        setBackgroundPreview(resolveImageFromEstablishment(est, "background"));
        setSlug(est.slug || "");
      } catch (error) {
        await Swal.fire(
          "Não foi possível carregar a barbearia",
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
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Seu navegador não conseguiu processar a imagem."));
            return;
          }

          const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
          const drawWidth = img.naturalWidth * scale;
          const drawHeight = img.naturalHeight * scale;
          ctx.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);

          setPreview(canvas.toDataURL("image/jpeg", .9));
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Não foi possível converter a imagem."));
              return;
            }
            const resized = new File([blob], `${key}.jpg`, { type: "image/jpeg" });
            setFiles((prev) => ({ ...prev, [key]: resized }));
            resolve(resized);
          }, "image/jpeg", .9);
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
      await Swal.fire("Erro na logo", error.message, "error");
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
      await Swal.fire("Erro na capa", error.message, "error");
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
      await Swal.fire("Barbearia atualizada", data?.message || "Alterações salvas com sucesso.", "success");
      navigate(`/establishment/view/${data?.establishment?.slug || slug}`);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Não foi possível salvar",
        text: apiErrorMessage(error, "Ocorreu um erro ao atualizar a barbearia."),
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
