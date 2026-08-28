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

const onlyDigits = (value = "") => String(value).replace(/\D/g, "");

const formatCep = (value = "") => {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

const formatCnpj = (value = "") => {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const buildAddress = ({ street, number, complement, neighborhood }) =>
  [
    street,
    number,
    complement,
    neighborhood,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");

const buildMapsUrl = ({ address, city, uf, cep }) => {
  const query = [address, city, uf, cep].filter(Boolean).join(", ");
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
};

const getApiErrorMessage = (error) => {
  const payload = error?.response?.data;

  if (payload?.errors && typeof payload.errors === "object") {
    const messages = Object.values(payload.errors)
      .flatMap((item) => (Array.isArray(item) ? item : [item]))
      .filter(Boolean);
    if (messages.length) return messages.join("\n");
  }

  if (payload?.error) return payload.error;
  if (payload?.message) return payload.message;

  if (!error?.response) {
    return "Não foi possível se comunicar com a API. Verifique sua conexão e tente novamente.";
  }

  return `Não foi possível criar a barbearia (erro ${error.response.status}).`;
};

export default function EstablishmentCreatePage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      cnpj: "",
      name: "",
      fantasy: "",
      phone: "",
      email: "",
      cep: "",
      description: "",
      address: "",
      city: "",
      uf: "",
      location: "",
      instagram_url: "",
      facebook_url: "",
      website_url: "",
      twitter_url: "",
      youtube_url: "",
      segments: [],
    },
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [segments, setSegments] = useState([]);
  const [files, setFiles] = useState({});
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const establishmentName = watch("name");
  const description = watch("description");

  const handleResizeImage = (file, setPreview, width, height, key) =>
    new Promise((resolve, reject) => {
      if (!file || !file.type?.startsWith("image/")) {
        Swal.fire("Formato inválido", "Selecione uma imagem válida.", "error");
        reject(new Error("invalid-image"));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error("file-read-failed"));
      reader.onloadend = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("image-load-failed"));
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("canvas-unavailable"));
            return;
          }

          const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
          const drawWidth = img.naturalWidth * scale;
          const drawHeight = img.naturalHeight * scale;
          const x = (width - drawWidth) / 2;
          const y = (height - drawHeight) / 2;
          ctx.drawImage(img, x, y, drawWidth, drawHeight);

          setPreview(canvas.toDataURL("image/jpeg", 0.9));
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("image-conversion-failed"));
                return;
              }
              const resized = new File([blob], `${key}.jpg`, { type: "image/jpeg" });
              setFiles((prev) => ({ ...prev, [key]: resized }));
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

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await handleResizeImage(file, setLogoPreview, 512, 512, "logo");
    } catch (error) {
      await Swal.fire("Erro", "Não foi possível processar a logo.", "error");
    } finally {
      event.target.value = "";
    }
  };

  const handleBackgroundChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await handleResizeImage(file, setBackgroundPreview, 1920, 600, "background");
    } catch (error) {
      await Swal.fire("Erro", "Não foi possível processar a imagem de capa.", "error");
    } finally {
      event.target.value = "";
    }
  };

  const applyAddress = ({ cep, street, number, complement, neighborhood, city, uf }) => {
    const address = buildAddress({ street, number, complement, neighborhood });
    const formattedCep = formatCep(cep);

    if (formattedCep) setValue("cep", formattedCep, { shouldDirty: true });
    if (address) setValue("address", address, { shouldDirty: true });
    if (city) setValue("city", city, { shouldDirty: true });
    if (uf) setValue("uf", String(uf).toUpperCase().slice(0, 2), { shouldDirty: true });

    const mapsUrl = buildMapsUrl({ address, city, uf, cep: formattedCep });
    if (mapsUrl) setValue("location", mapsUrl, { shouldDirty: true });
  };

  const lookupCep = async (rawCep, { silent = false } = {}) => {
    const cep = onlyDigits(rawCep);
    if (cep.length !== 8) {
      if (!silent) setError("cep", { type: "manual", message: "Informe um CEP com 8 dígitos." });
      return null;
    }

    clearErrors("cep");
    setCepLoading(true);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data?.message || "CEP não encontrado.");

      applyAddress({
        cep: data.cep || cep,
        street: data.street,
        neighborhood: data.neighborhood,
        city: data.city,
        uf: data.state,
      });

      return data;
    } catch (error) {
      if (!silent) {
        setError("cep", { type: "manual", message: error.message || "CEP não encontrado." });
      }
      return null;
    } finally {
      setCepLoading(false);
    }
  };

  const lookupCnpj = async (rawCnpj, { silent = false } = {}) => {
    const cnpj = onlyDigits(rawCnpj);
    if (cnpj.length !== 14) {
      if (!silent) setError("cnpj", { type: "manual", message: "Informe um CNPJ com 14 dígitos." });
      return null;
    }

    clearErrors("cnpj");
    setCnpjLoading(true);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data?.message || "CNPJ não encontrado.");

      setValue("cnpj", formatCnpj(data.cnpj || cnpj), { shouldDirty: true });
      setValue("name", data.nome_fantasia || data.razao_social || "", { shouldDirty: true });
      setValue("fantasy", data.nome_fantasia || "", { shouldDirty: true });
      if (data.telefone1) setValue("phone", data.telefone1, { shouldDirty: true });
      if (data.email) setValue("email", String(data.email).toLowerCase(), { shouldDirty: true });

      applyAddress({
        cep: data.cep,
        street: data.logradouro,
        number: data.numero,
        complement: data.complemento,
        neighborhood: data.bairro,
        city: data.municipio,
        uf: data.uf,
      });

      // Complementa endereço/geo pelo CEP quando a base do CNPJ vier incompleta.
      if (data.cep) await lookupCep(data.cep, { silent: true });

      if (!silent && data.descricao_situacao_cadastral && data.descricao_situacao_cadastral !== "ATIVA") {
        await Swal.fire(
          "Atenção",
          `A situação cadastral retornada para este CNPJ é: ${data.descricao_situacao_cadastral}.`,
          "warning"
        );
      }

      return data;
    } catch (error) {
      if (!silent) {
        setError("cnpj", { type: "manual", message: error.message || "CNPJ não encontrado." });
        await Swal.fire("CNPJ não encontrado", error.message || "Não foi possível consultar este CNPJ.", "error");
      }
      return null;
    } finally {
      setCnpjLoading(false);
    }
  };

  const handleCnpjChange = (event) => {
    const formatted = formatCnpj(event.target.value);
    setValue("cnpj", formatted, { shouldDirty: true, shouldValidate: true });
    clearErrors("cnpj");
    if (onlyDigits(formatted).length === 14) lookupCnpj(formatted, { silent: true });
  };

  const handleCepChange = (event) => {
    const formatted = formatCep(event.target.value);
    setValue("cep", formatted, { shouldDirty: true, shouldValidate: true });
    clearErrors("cep");
    if (onlyDigits(formatted).length === 8) lookupCep(formatted, { silent: true });
  };

  const handleSegmentsChange = (event) => {
    const { value, checked } = event.target;
    const updated = checked
      ? Array.from(new Set([...segments, value]))
      : segments.filter((segment) => segment !== value);

    setSegments(updated);
    setValue("segments", updated, { shouldDirty: true });
  };

  const onInvalid = async (formErrors) => {
    const first = Object.values(formErrors)?.[0];
    await Swal.fire(
      "Revise o formulário",
      first?.message || "Existem campos obrigatórios ou inválidos que precisam ser corrigidos.",
      "warning"
    );
  };

  const onSubmit = async (dataInput) => {
    const formData = new FormData();
    formData.append("app_id", String(appId));
    formData.append("category", "barbershop");

    Object.entries(dataInput).forEach(([key, value]) => {
      if (key === "segments") return;
      if (value !== undefined && value !== null && value !== "") formData.append(key, value);
    });

    segments.forEach((segment) => formData.append("segments[]", segment));
    if (files.logo) formData.append("logo", files.logo);
    if (files.background) formData.append("background", files.background);

    try {
      const { data } = await api.post("/establishment", formData);
      await Swal.fire("Barbearia criada", data?.message || "Cadastro realizado com sucesso.", "success");
      navigate(`/establishment/view/${data.establishment.slug}`);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Não foi possível criar a barbearia",
        text: getApiErrorMessage(error),
        confirmButtonText: "Corrigir dados",
      });
    }
  };

  return (
    <div className="establishment-create-shell">
      <section className="establishment-create-header">
        <span className="establishment-create-eyebrow">Gestão da barbearia</span>
        <h1>Cadastrar barbearia</h1>
        <p>Comece pelo CNPJ. Quando encontrado, os dados da empresa e o endereço serão preenchidos automaticamente.</p>
      </section>

      <section className="establishment-create-card establishment-create-preview-card">
        <div
          className="establishment-create-preview"
          style={
            backgroundPreview
              ? { backgroundImage: `linear-gradient(90deg, rgba(3,8,17,.92), rgba(3,8,17,.58)), url('${backgroundPreview}')` }
              : undefined
          }
        >
          <div className="establishment-create-logo">
            {logoPreview ? <img src={logoPreview} alt="Prévia da logo" /> : <span>R</span>}
          </div>
          <div className="establishment-create-preview-copy">
            <span className="establishment-create-preview-label">Prévia pública</span>
            <h2>{establishmentName || "Nome da barbearia"}</h2>
            <p>{description || "A descrição da sua barbearia aparecerá aqui."}</p>
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
          <label className="establishment-create-upload-btn" htmlFor="backgroundInput">Alterar capa</label>
          <label className="establishment-create-upload-btn" htmlFor="logoInput">Alterar logo</label>
          <input id="backgroundInput" type="file" accept="image/*" onChange={handleBackgroundChange} />
          <input id="logoInput" type="file" accept="image/*" onChange={handleLogoChange} />
        </div>
      </section>

      <form
        className="establishment-create-card establishment-create-form"
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        encType="multipart/form-data"
      >
        <div className="establishment-create-section-heading">
          <h2>Dados da empresa</h2>
          <p>Digite primeiro o CNPJ para preencher automaticamente os dados disponíveis.</p>
        </div>

        <div className="establishment-create-grid">
          <Field label="CNPJ" className="span-12" error={errors.cnpj?.message} hint={cnpjLoading ? "Consultando dados da empresa..." : "Ao completar 14 dígitos, a consulta é feita automaticamente."}>
            <div className="establishment-create-inline-field">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                {...register("cnpj")}
                onChange={handleCnpjChange}
                onBlur={(event) => lookupCnpj(event.target.value, { silent: true })}
                placeholder="00.000.000/0000-00"
              />
              <button type="button" onClick={() => lookupCnpj(watch("cnpj"))} disabled={cnpjLoading}>
                {cnpjLoading ? "Consultando..." : "Buscar CNPJ"}
              </button>
            </div>
          </Field>

          <Field label="Nome da barbearia *" className="span-4" error={errors.name?.message}>
            <input type="text" {...register("name", { required: "Informe o nome da barbearia." })} />
          </Field>
          <Field label="Razão / nome fantasia" className="span-4">
            <input type="text" {...register("fantasy")} />
          </Field>
          <Field label="Telefone" className="span-4">
            <input type="text" {...register("phone")} />
          </Field>

          <Field label="E-mail" className="span-6" error={errors.email?.message}>
            <input type="email" {...register("email", { pattern: { value: /^\S+@\S+\.\S+$/, message: "Informe um e-mail válido." } })} />
          </Field>
          <Field label="CEP" className="span-6" error={errors.cep?.message} hint={cepLoading ? "Buscando endereço..." : "O endereço será preenchido automaticamente."}>
            <div className="establishment-create-inline-field">
              <input
                type="text"
                inputMode="numeric"
                {...register("cep")}
                onChange={handleCepChange}
                onBlur={(event) => lookupCep(event.target.value, { silent: true })}
                placeholder="00000-000"
              />
              <button type="button" onClick={() => lookupCep(watch("cep"))} disabled={cepLoading}>
                {cepLoading ? "Buscando..." : "Buscar CEP"}
              </button>
            </div>
          </Field>

          <Field label="Endereço" className="span-8">
            <input type="text" {...register("address")} />
          </Field>
          <Field label="Cidade" className="span-2">
            <input type="text" {...register("city")} />
          </Field>
          <Field label="UF" className="span-2">
            <input type="text" maxLength="2" {...register("uf")} />
          </Field>

          <Field label="Google Maps" className="span-12" hint="Gerado automaticamente a partir do endereço. Você pode alterar se necessário.">
            <input type="url" {...register("location")} />
          </Field>

          <Field label="Descrição" className="span-12">
            <textarea rows="4" {...register("description", { maxLength: { value: 2500, message: "A descrição pode ter no máximo 2500 caracteres." } })} />
          </Field>
        </div>

        <div className="establishment-create-divider" />

        <div className="establishment-create-section-heading">
          <h2>Redes e presença digital</h2>
          <p>Opcional. Informe apenas os canais que a barbearia utiliza.</p>
        </div>

        <div className="establishment-create-grid">
          <Field label="Instagram" className="span-4"><input type="url" {...register("instagram_url")} /></Field>
          <Field label="Facebook" className="span-4"><input type="url" {...register("facebook_url")} /></Field>
          <Field label="Site" className="span-4"><input type="url" {...register("website_url")} /></Field>
          <Field label="X / Twitter" className="span-6"><input type="url" {...register("twitter_url")} /></Field>
          <Field label="YouTube" className="span-6"><input type="url" {...register("youtube_url")} /></Field>
        </div>

        <div className="establishment-create-divider" />

        <div className="establishment-create-section-heading">
          <h2>Serviços oferecidos</h2>
          <p>Selecione os segmentos que representam a barbearia.</p>
        </div>

        <div className="establishment-create-segments">
          {segmentOptions.map((option) => (
            <label key={option.value} className={`establishment-create-segment ${segments.includes(option.value) ? "is-selected" : ""}`}>
              <input type="checkbox" value={option.value} checked={segments.includes(option.value)} onChange={handleSegmentsChange} />
              <span className="establishment-create-check" aria-hidden="true" />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        <input type="hidden" {...register("segments")} />

        <div className="establishment-create-actions">
          <button type="button" className="establishment-create-cancel" onClick={() => navigate(-1)}>Cancelar</button>
          <button type="submit" className="establishment-create-submit" disabled={isSubmitting || cnpjLoading || cepLoading}>
            {isSubmitting ? "Criando..." : "Criar barbearia"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, className = "", children, error, hint }) {
  return (
    <label className={`establishment-create-field ${className} ${error ? "has-error" : ""}`}>
      <span>{label}</span>
      {children}
      {hint && <small className="establishment-create-field-hint">{hint}</small>}
      {error && <small className="establishment-create-field-error">{error}</small>}
    </label>
  );
}
