// src/pages/establishment/EstablishmentUpdatePage.js
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl, storageUrl } from "../../config";
import NavlogComponent from "../../components/NavlogComponent";
import { Button, Col, Row, Form, Spinner, Badge } from "react-bootstrap";
import "./EstablishmentUpdate.css";

const segmentOptions = [
  { value: "corte_masculino", label: "Corte Masculino" },
  { value: "barba", label: "Barba" },
  { value: "sobrancelha", label: "Sobrancelha" },
  { value: "pintura", label: "Pintura" },
  { value: "hidratacao", label: "Hidratação" },
  { value: "alisamento", label: "Alisamento" },
];

function resolveImage(img) {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${storageUrl || apiBaseUrl.replace("/api", "")}/${img.replace(/^\//, "")}`;
}

export default function EstablishmentUpdatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [segments, setSegments] = useState([]);
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    let mounted = true;
    async function fetchEstablishment() {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${apiBaseUrl}/establishment/show/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!mounted) return;

        const est = res.data.establishment || {};

        reset({
          name: est.name || "",
          fantasy: est.fantasy || "",
          cnpj: est.cnpj || "",
          phone: est.phone || "",
          email: est.email || "",
          description: est.description || "",
          address: est.address || "",
          city: est.city || "",
          cep: est.cep || "",
          location: est.location || "",
          instagram_url: est.instagram_url || "",
          facebook_url: est.facebook_url || "",
          twitter_url: est.twitter_url || "",
          youtube_url: est.youtube_url || "",
          website_url: est.website_url || "",
        });

        setSegments(
          Array.isArray(est.segments)
            ? est.segments
            : est.segments
            ? JSON.parse(est.segments)
            : []
        );

        setLogoPreview(resolveImage(est.logo));
        setBackgroundPreview(resolveImage(est.background));
        setSlug(est.slug || "");
      } catch (err) {
        Swal.fire("Erro", "Não foi possível carregar o estabelecimento.", "error");
        navigate("/dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchEstablishment();
    return () => {
      mounted = false;
    };
  }, [id, navigate, reset]);

  const processAndResizeImage = async (file, maxWidth, maxHeight, setPreview, key) => {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        Swal.fire("Formato inválido", "Selecione uma imagem válida.", "error");
        return reject(new Error("invalid file"));
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const aspect = width / height;

          if (width > maxWidth) {
            width = maxWidth;
            height = Math.round(width / aspect);
          }
          if (height > maxHeight) {
            height = maxHeight;
            width = Math.round(height * aspect);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const dataURL = canvas.toDataURL("image/png");
          setPreview(dataURL);

          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("Erro ao criar imagem tratada."));
              const resizedFile = new File([blob], "upload.png", { type: "image/png" });
              setFiles((prev) => ({ ...prev, [key]: resizedFile }));
              resolve(resizedFile);
            },
            "image/png",
            0.9
          );
        };
        img.onerror = () => reject(new Error("Erro ao carregar imagem."));
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo."));
      reader.readAsDataURL(file);
    });
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) await processAndResizeImage(file, 150, 150, setLogoPreview, "logo");
  };

  const handleBackgroundChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) await processAndResizeImage(file, 1920, 600, setBackgroundPreview, "background");
  };

  const handleSegmentsChange = (e) => {
    const { value, checked } = e.target;
    const updated = checked ? [...segments, value] : segments.filter((s) => s !== value);
    setSegments(updated);
    setValue("segments", updated);
  };

  const onSubmit = async (dataInput) => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("Erro", "Você precisa estar autenticado.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("_method", "POST");

    Object.keys(dataInput).forEach((key) => {
      if (key === "segments") {
        segments.forEach((seg) => formData.append("segments[]", seg));
      } else {
        const v = dataInput[key];
        formData.append(key, v === undefined || v === null ? "" : v);
      }
    });

    if (files.logo) formData.append("logo", files.logo);
    if (files.background) formData.append("background", files.background);

    try {
      const res = await axios.post(`${apiBaseUrl}/establishment/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.fire("Sucesso", res.data.message || "Atualizado com sucesso", "success").then(
        (result) => {
          if (result.isConfirmed || result.isDismissed) {
            Swal.close();
            const slugResp = res.data?.establishment?.slug || slug;
            navigate(`/establishment/view/${slugResp}`);
          }
        }
      );
    } catch (err) {
      console.error(err);
      let msg = "Ocorreu um erro ao atualizar o estabelecimento.";
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.errors) msg = Object.values(data.errors).flat().join("\n");
        else if (data.error) msg = data.error;
        else if (data.message) msg = data.message;
      }
      Swal.fire("Erro", msg, "error");
    }
  };

  if (loading) {
    return (
      <div className="establishment-root">
        <NavlogComponent />
        <div
          className="establishment-create-page d-flex justify-content-center align-items-center"
          style={{ minHeight: 400 }}
        >
          <Spinner animation="border" variant="warning" />
        </div>
      </div>
    );
  }

  return (
    <div className="establishment-root">
      <NavlogComponent />
      <div className="establishment-create-page">
        <h2 className="title mb-3">Editar Estabelecimento</h2>

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
              {logoPreview && <img src={logoPreview} alt="Logo Preview" className="estab-logo" />}
            </div>
            <div className="estab-info-block">
              <h1 className="estab-title">Visualização da Edição</h1>
              <div className="estab-description">As alterações serão refletidas aqui...</div>
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
                  {segmentOptions.map((opt) => (
                    <div className="form-check segment-check" key={opt.value}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`segment-${opt.value}`}
                        value={opt.value}
                        checked={segments.includes(opt.value)}
                        onChange={handleSegmentsChange}
                      />
                      <label
                        className="form-check-label mr-2"
                        htmlFor={`segment-${opt.value}`}
                      >
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
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}
