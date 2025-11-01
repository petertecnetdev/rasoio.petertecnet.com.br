// src/pages/establishment/EstablishmentCreatePage.js
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl,appId  } from "../../config";
import NavlogComponent from "../../components/NavlogComponent";
import { Button, Col, Row, Form, Badge } from "react-bootstrap";
import "./Establishment.css";

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
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm();

  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [segments, setSegments] = useState([]);
  const [files, setFiles] = useState({});

  const handleResizeImage = (file, setPreview, width, height, key) => {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        Swal.fire("Formato inválido", "Selecione uma imagem válida.", "error");
        reject();
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
          canvas.toBlob(blob => {
            const filename = file.name.replace(/\.[^/.]+$/, "") + ".png";
            const resizedFile = new File([blob], filename, { type: "image/png" });
            setFiles(prev => ({ ...prev, [key]: resizedFile }));
            resolve(resizedFile);
          }, "image/png", 0.95);
        };
        img.onerror = () => reject();
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLogoChange = async e => {
    const file = e.target.files[0];
    if (file) await handleResizeImage(file, setLogoPreview, 150, 150, "logo");
  };

  const handleBackgroundChange = async e => {
    const file = e.target.files[0];
    if (file) await handleResizeImage(file, setBackgroundPreview, 1920, 600, "background");
  };

  const handleSegmentsChange = e => {
    const { value, checked } = e.target;
    const updated = checked
      ? [...segments, value]
      : segments.filter(s => s !== value);
    setSegments(updated);
    setValue("segments", updated);
  };

  const onSubmit = async dataInput => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("Erro", "Você precisa estar autenticado.", "error");
      return;
    }

   const formData = new FormData();
formData.append("app_id", appId); // ✅ adiciona automaticamente o ID do app
formData.append("category", "barbershop");
formData.append("type", "");

    Object.keys(dataInput).forEach(key => {
      if (key === "segments") {
        segments.forEach(seg => formData.append("segments[]", seg));
      } else {
        formData.append(key, dataInput[key] || "");
      }
    });

    if (files.logo) formData.append("logo", files.logo);
    if (files.background) formData.append("background", files.background);

    try {
  const res = await axios.post(
    `${apiBaseUrl}/establishment`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    }
  );
Swal.fire("Sucesso", res.data.message, "success").then((result) => {
  if (result.isConfirmed || result.isDismissed) {
    Swal.close(); // garante que não vai reaparecer
    navigate(`/establishment/view/${res.data.establishment.slug}`);
  }
});


} catch (err) {
  console.error("Erro ao criar estabelecimento:", err);

  let msg = "Ocorreu um erro ao criar o estabelecimento.";

  if (err.response) {
    const data = err.response.data;

    if (data.errors) {
      msg = Object.values(data.errors).flat().join("\n");
    } else if (data.error) {
      msg = data.error;
    } else if (data.message) {
      msg = data.message;
    }
  }

  Swal.fire("Erro", msg, "error");
}

  };

  return (
    <div className="establishment-root">
      <NavlogComponent />
      <div className="establishment-create-page">
        <h2 className="title mb-3">Criar Estabelecimento</h2>

        {/* Preview estilo ViewPage */}
        <div
          className="estab-hero"
          style={{
            background: backgroundPreview
              ? `linear-gradient(90deg, rgba(18,18,18,0.87) 55%, rgba(36,36,36,0.70)), url('${backgroundPreview}') center/cover no-repeat`
              : "linear-gradient(90deg, rgba(18,18,18,0.87) 55%, rgba(36,36,36,0.70)), #333",
          }}
        >
          <div className="estab-hero-inner">
            <div className="estab-logo-bubble">
              {logoPreview && (
                <img src={logoPreview} alt="Logo Preview" className="estab-logo" />
              )}
            </div>
            <div className="estab-info-block">
              <h1 className="estab-title">Nome do Estabelecimento</h1>
              <div className="estab-description">A descrição aparecerá aqui...</div>
              <div>
                {segments.map((seg) => (
                  <Badge key={seg} bg="warning" text="dark" className="me-1">
                    {seg.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upload dos arquivos */}
        <div className="d-flex justify-content-center gap-3 my-3">
          <Button
            variant="secondary"
            className="action-button"
            onClick={() => document.getElementById("backgroundInput").click()}
          >
            Alterar Background
          </Button>
          <Button
            variant="secondary"
            className="action-button"
            onClick={() => document.getElementById("logoInput").click()}
          >
            Alterar Logo
          </Button>
        </div>
        <Form.Control
          id="backgroundInput"
          type="file"
          accept="image/*"
          onChange={handleBackgroundChange}
          style={{ display: "none" }}
        />
        <Form.Control
          id="logoInput"
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          style={{ display: "none" }}
        />

        {/* Formulário */}
        <Form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
          <Row className="gy-3 mt-2">
            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Nome*</label>
                <input type="text" {...register("name", { required: true })} />
              </div>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Nome Fantasia</label>
                <input type="text" {...register("fantasy")} />
              </div>
            </Col>
            <Col xs={6} md={3} lg={2}>
              <div className="form-group">
                <label>CNPJ</label>
                <input type="text" {...register("cnpj")} />
              </div>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Telefone</label>
                <input type="text" {...register("phone")} />
              </div>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" {...register("email")} />
              </div>
            </Col>
            <Col xs={12}>
              <div className="form-group">
                <label>Descrição</label>
                <textarea {...register("description")} />
              </div>
            </Col>
            <Col xs={12} md={7} lg={6}>
              <div className="form-group">
                <label>Endereço</label>
                <input type="text" {...register("address")} />
              </div>
            </Col>
            <Col xs={6} md={3} lg={2}>
              <div className="form-group">
                <label>Cidade</label>
                <input type="text" {...register("city")} />
              </div>
            </Col>
            <Col xs={6} md={2} lg={2}>
              <div className="form-group">
                <label>CEP</label>
                <input type="text" {...register("cep")} />
              </div>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Localização (Google Maps)</label>
                <input type="text" {...register("location")} />
              </div>
            </Col>

            {/* Redes sociais */}
            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Instagram</label>
                <input type="url" {...register("instagram_url")} />
              </div>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Facebook</label>
                <input type="url" {...register("facebook_url")} />
              </div>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Twitter</label>
                <input type="url" {...register("twitter_url")} />
              </div>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>YouTube</label>
                <input type="url" {...register("youtube_url")} />
              </div>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Site</label>
                <input type="url" {...register("website_url")} />
              </div>
            </Col>

            {/* Segmentos */}
            <Col md={7}>
              <div className="form-group">
                <label>Segmentos Atendidos</label>
                <div className="segments-checkbox-grid">
                  {segmentOptions.map(opt => (
                    <div className="form-check segment-check" key={opt.value}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`segment-${opt.value}`}
                        value={opt.value}
                        checked={segments.includes(opt.value)}
                        onChange={handleSegmentsChange}
                      />
                      <label className="form-check-label mr-2" htmlFor={`segment-${opt.value}`}>
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </div>
                <input type="hidden" {...register("segments")} value={segments} />
              </div>
            </Col>

            <Col xs={12} className="text-end">
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Criar Estabelecimento"}
              </button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}
