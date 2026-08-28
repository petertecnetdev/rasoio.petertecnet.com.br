// src/pages/establishment/EstablishmentCreatePage.js
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Badge } from "react-bootstrap";

import api from "../../services/api";
import { appId } from "../../config";
import "./Establishment.css";
import "./EstablishmentCreatePage.css";

const segmentOptions = [
  { value: "corte_masculino", label: "Corte Masculino" },
  { value: "barba", label: "Barba" },
  { value: "sobrancelha", label: "Sobrancelha" },
  { value: "pintura", label: "Pintura" },
  { value: "hidratacao", label: "Hidratação" },
  { value: "alisamento", label: "Alisamento" },
];

export default function EstablishmentCreatePage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm();

  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [segments, setSegments] = useState([]);
  const [files, setFiles] = useState({});

  const handleResizeImage = (file, setPreview, width, height, key) =>
    new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        Swal.fire("Formato inválido", "Selecione uma imagem válida.", "error");
        reject(new Error("Invalid image"));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const previewDataURL = canvas.toDataURL("image/png");
          setPreview(previewDataURL);

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Could not process image"));
              return;
            }
            const filename = `${file.name.replace(/\.[^/.]+$/, "")}.png`;
            const resizedFile = new File([blob], filename, { type: "image/png" });
            setFiles((prev) => ({ ...prev, [key]: resizedFile }));
            resolve(resizedFile);
          }, "image/png", 0.95);
        };
        img.onerror = () => reject(new Error("Could not load image"));
      };
      reader.readAsDataURL(file);
    });

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) await handleResizeImage(file, setLogoPreview, 150, 150, "logo");
  };

  const handleBackgroundChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) await handleResizeImage(file, setBackgroundPreview, 1920, 600, "background");
  };

  const handleSegmentsChange = (event) => {
    const { value, checked } = event.target;
    const updated = checked
      ? [...segments, value]
      : segments.filter((segment) => segment !== value);

    setSegments(updated);
    setValue("segments", updated);
  };

  const onSubmit = async (dataInput) => {
    const formData = new FormData();
    formData.append("app_id", appId);
    formData.append("category", "barbershop");
    formData.append("type", "");

    Object.entries(dataInput).forEach(([key, value]) => {
      if (key === "segments") return;
      formData.append(key, value || "");
    });

    segments.forEach((segment) => formData.append("segments[]", segment));
    if (files.logo) formData.append("logo", files.logo);
    if (files.background) formData.append("background", files.background);

    try {
      const { data } = await api.post("/establishment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await Swal.fire("Sucesso", data?.message || "Barbearia criada com sucesso.", "success");
      navigate(`/establishment/view/${data.establishment.slug}`);
    } catch (err) {
      const payload = err?.response?.data;
      const message = payload?.errors
        ? Object.values(payload.errors).flat().join("\n")
        : payload?.error || payload?.message || "Ocorreu um erro ao criar a barbearia.";

      Swal.fire("Erro", message, "error");
    }
  };

  return (
    <div className="establishment-create-shell">
      <section className="establishment-create-header">
        <span className="establishment-create-eyebrow">Gestão da barbearia</span>
        <h1>Cadastrar barbearia</h1>
        <p>Preencha os dados principais. Você poderá editar as informações depois.</p>
      </section>

      <section className="establishment-create-card establishment-create-preview-card">
        <div
          className="establishment-create-preview"
          style={
            backgroundPreview
              ? {
                  backgroundImage: `linear-gradient(90deg, rgba(3,8,17,.92), rgba(3,8,17,.58)), url('${backgroundPreview}')`,
                }
              : undefined
          }
        >
          <div className="establishment-create-logo">
            {logoPreview ? <img src={logoPreview} alt="Prévia do logo" /> : <span>R</span>}
          </div>
          <div className="establishment-create-preview-copy">
            <span className="establishment-create-preview-label">Prévia pública</span>
            <h2>Nome da barbearia</h2>
            <p>A descrição da sua barbearia aparecerá aqui.</p>
            {segments.length > 0 && (
              <div className="establishment-create-badges">
                {segments.map((segment) => (
                  <Badge key={segment} className="establishment-create-badge">
                    {segmentOptions.find((item) => item.value === segment)?.label || segment}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="establishment-create-upload-actions">
          <label className="establishment-create-upload-btn" htmlFor="backgroundInput">
            Alterar capa
          </label>
          <label className="establishment-create-upload-btn" htmlFor="logoInput">
            Alterar logo
          </label>
          <input id="backgroundInput" type="file" accept="image/*" onChange={handleBackgroundChange} />
          <input id="logoInput" type="file" accept="image/*" onChange={handleLogoChange} />
        </div>
      </section>

      <form
        className="establishment-create-card establishment-create-form"
        onSubmit={handleSubmit(onSubmit)}
        encType="multipart/form-data"
      >
        <div className="establishment-create-section-heading">
          <h2>Informações da barbearia</h2>
          <p>Os campos com * são obrigatórios.</p>
        </div>

        <div className="establishment-create-grid">
          <Field label="Nome *" className="span-4">
            <input type="text" {...register("name", { required: true })} />
          </Field>
          <Field label="Nome fantasia" className="span-4">
            <input type="text" {...register("fantasy")} />
          </Field>
          <Field label="CNPJ" className="span-4">
            <input type="text" {...register("cnpj")} />
          </Field>

          <Field label="Telefone" className="span-4">
            <input type="text" {...register("phone")} />
          </Field>
          <Field label="E-mail" className="span-4">
            <input type="email" {...register("email")} />
          </Field>
          <Field label="CEP" className="span-4">
            <input type="text" {...register("cep")} />
          </Field>

          <Field label="Descrição" className="span-12">
            <textarea rows="4" {...register("description")} />
          </Field>

          <Field label="Endereço" className="span-8">
            <input type="text" {...register("address")} />
          </Field>
          <Field label="Cidade" className="span-4">
            <input type="text" {...register("city")} />
          </Field>

          <Field label="Localização (Google Maps)" className="span-12">
            <input type="text" {...register("location")} />
          </Field>
        </div>

        <div className="establishment-create-divider" />

        <div className="establishment-create-section-heading">
          <h2>Redes e presença digital</h2>
          <p>Opcional. Informe apenas os canais que você utiliza.</p>
        </div>

        <div className="establishment-create-grid">
          <Field label="Instagram" className="span-4">
            <input type="url" {...register("instagram_url")} />
          </Field>
          <Field label="Facebook" className="span-4">
            <input type="url" {...register("facebook_url")} />
          </Field>
          <Field label="Site" className="span-4">
            <input type="url" {...register("website_url")} />
          </Field>
          <Field label="X / Twitter" className="span-6">
            <input type="url" {...register("twitter_url")} />
          </Field>
          <Field label="YouTube" className="span-6">
            <input type="url" {...register("youtube_url")} />
          </Field>
        </div>

        <div className="establishment-create-divider" />

        <div className="establishment-create-section-heading">
          <h2>Serviços oferecidos</h2>
          <p>Selecione os segmentos que representam a barbearia.</p>
        </div>

        <div className="establishment-create-segments">
          {segmentOptions.map((option) => (
            <label
              key={option.value}
              className={`establishment-create-segment ${segments.includes(option.value) ? "is-selected" : ""}`}
            >
              <input
                type="checkbox"
                value={option.value}
                checked={segments.includes(option.value)}
                onChange={handleSegmentsChange}
              />
              <span className="establishment-create-check" aria-hidden="true" />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        <input type="hidden" {...register("segments")} value={segments.join(",")} />

        <div className="establishment-create-actions">
          <button type="button" className="establishment-create-cancel" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button type="submit" className="establishment-create-submit" disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar barbearia"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, className = "", children }) {
  return (
    <label className={`establishment-create-field ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
