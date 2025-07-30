import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl } from "../../config";
import NavlogComponent from "../../components/NavlogComponent";
import { Button, Col, Row, Form } from "react-bootstrap";
import "./Establishment.css";

const segmentOptions = [
  { value: "corte_masculino", label: "Corte Masculino" },
  { value: "corte_feminino", label: "Corte Feminino" },
  { value: "barba", label: "Barba" },
  { value: "sobrancelha", label: "Sobrancelha" },
  { value: "tratamento_de_cabelo", label: "Tratamento de Cabelo" },
  { value: "massagem_capilar", label: "Massagem Capilar" },
  { value: "coloracao", label: "Coloração" },
  { value: "alisamento", label: "Alisamento" }
];

export default function EstablishmentCreatePage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting }
  } = useForm();

  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [segments, setSegments] = useState([]);
  const [files, setFiles] = useState({});

  useEffect(() => {
    setValue("category", "barbershop");
  }, [setValue]);

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
    await handleResizeImage(file, setLogoPreview, 150, 150, "logo");
  };

  const handleBackgroundChange = async e => {
    const file = e.target.files[0];
    await handleResizeImage(file, setBackgroundPreview, 1920, 600, "background");
  };

  const handleSegmentsChange = e => {
    const { value, checked } = e.target;
    const updated = checked ? [...segments, value] : segments.filter(s => s !== value);
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
      Swal.fire("Sucesso", res.data.message, "success");
      navigate(`/establishment/view/${res.data.establishment.slug}`);
    } catch (err) {
      const msg = err.response?.data?.error
        || err.response?.data?.message
        || "Ocorreu um erro ao criar o estabelecimento.";
      Swal.fire("Erro", msg, "error");
    }
  };

  return (
    <div className="establishment-root">
      <NavlogComponent />
      <div className="establishment-create-page">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="title">Criar Barbearia</h2>
        </div>
        <Form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
          <input type="hidden" defaultValue="barbershop" {...register("category")} />
          <Row>
            <Col xs={12} className="text-center">
              <div className="image-preview-container">
                {backgroundPreview && (
                  <label htmlFor="backgroundInput" style={{ cursor: "pointer" }}>
                    <img
                      src={backgroundPreview}
                      alt="Background Preview"
                      className="background-preview"
                    />
                  </label>
                )}
                {logoPreview && (
                  <label htmlFor="logoInput" className="logo-preview-wrapper" style={{ cursor: "pointer" }}>
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="logo-preview"
                    />
                  </label>
                )}
              </div>
              <div className="d-flex justify-content-center gap-3 mb-4">
                <Button
                  variant="secondary"
                  className="action-button mt-2"
                  onClick={() => document.getElementById("backgroundInput").click()}
                >
                  Enviar imagem de Background
                </Button>
                <Button
                  variant="secondary"
                  className="action-button mt-2"
                  onClick={() => document.getElementById("logoInput").click()}
                >
                  Enviar  Logo
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
            </Col>
          </Row>
          <div className="form">
            <Row className="gy-3">
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
              <Col xs={6} md={3} lg={2}>
                <div className="form-group">
                  <label>Tipo</label>
                  <input type="text" {...register("type")} />
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
              <Col xs={12} md={12} lg={6}>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea {...register("description")} />
                </div>
              </Col>
              <Col xs={12} md={7} lg={4}>
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
                        <label className="form-check-label mr-2" htmlFor={`segment-${opt.value}`}>{opt.label}</label>
                      </div>
                    ))}
                  </div>
                  <input type="hidden" {...register("segments")} value={segments} />
                </div>
              </Col>
              <Col xs={12} className="text-end">
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? <> Salvando...</> : "Criar Barbearia"}
                </button>
              </Col>
            </Row>
          </div>
        </Form>
      </div>
    </div>
  );
}
