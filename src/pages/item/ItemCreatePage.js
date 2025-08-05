// src/pages/item/ItemCreatePage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Form, Button, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./Item.css";

export default function ItemCreatePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      stock: 0,
      status: "1",
      limited_by_user: "0",
      is_featured: "0",
    },
  });

  const [establishment, setEstablishment] = useState({});
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/view/${slug}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEstablishment(data.establishment);
      } catch {
        Swal.fire("Erro", "Não foi possível carregar o estabelecimento.", "error");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return Swal.fire("Formato inválido", "Selecione uma imagem válida.", "error");
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const W = 150, H = 150;
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, W, H);
        setImagePreview(canvas.toDataURL("image/png"));
      };
      img.onerror = () =>
        Swal.fire("Erro", "Falha ao processar a imagem.", "error");
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    data.stock = data.stock ?? 0;
    const token = localStorage.getItem("token");
    if (!token) {
      return Swal.fire("Erro", "Você precisa estar autenticado.", "error");
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("type", data.type);
    formData.append("price", data.price);
    formData.append("stock", data.stock);
    formData.append("description", data.description || "");
    formData.append("category", data.category || "");
    formData.append("subcategory", data.subcategory || "");
    formData.append("brand", data.brand || "");
    formData.append("availability_start", data.availability_start || "");
    formData.append("availability_end", data.availability_end || "");
    formData.append("expiration_date", data.expiration_date || "");
    formData.append("status", data.status);
    formData.append("limited_by_user", data.limited_by_user);
    formData.append("discount", data.discount || "");
    formData.append("is_featured", data.is_featured);
    formData.append("notes", data.notes || "");
    formData.append("entity_id", establishment.id);
    formData.append("entity_name", "establishment");
    formData.append("app_id", "2");

    if (imagePreview && imagePreview.startsWith("data:")) {
      const blob = await fetch(imagePreview).then((res) => res.blob());
      formData.append("image", blob, "image.png");
    }

    try {
      await axios.post(`${apiBaseUrl}/item`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      Swal.fire("Sucesso", "Item cadastrado com sucesso.", "success");
      navigate(-1);
    } catch (err) {
      if (err.response?.status === 422) {
        const msgs = Object.values(err.response.data.errors || {}).flat();
        Swal.fire("Erro de Validação", msgs.join("\n"), "warning");
      } else {
        Swal.fire("Erro", "Não foi possível criar o item.", "error");
      }
    }
  };

  if (loading) {
    return <Spinner animation="border" className="item-loading__spinner" />;
  }

  return (
    <>
      <NavlogComponent />
      <Container className="item-create__container">
        <div className="item-create__header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            {establishment.logo && (
              <img
                src={`${storageUrl}/${establishment.logo}`}
                alt="logo"
                className="item-establishment-logo me-3"
                onError={(e) => (e.currentTarget.src = "/images/logo.png")}
              />
            )}
            <h4 className="mb-0 text-uppercase">{establishment.name}</h4>
          </div>
          <Button as={Link} to={`/item/list/${slug}`} variant="info" size="sm">
            Ver Itens
          </Button>
        </div>

        <Form
          noValidate
          encType="multipart/form-data"
          onSubmit={handleSubmit(onSubmit)}
          className="item-create__form mt-4"
        >
          <Row className="mb-4">
            <Col xs={12} sm={6} md={4} className="text-center">
              <label
                htmlFor="imageInput"
                style={{ cursor: "pointer" }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="img-thumbnail"
                    width={150}
                    height={150}
                  />
                ) : (
                  <div className="border p-4">Clique para adicionar imagem</div>
                )}
              </label>
              <Form.Control
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </Col>
            <Col xs={12} md={8}>
              <Row className="g-3">
                <Col xs={12} md={6} lg={3}>
                  <Form.Group controlId="name">
                    <Form.Label>Nome*</Form.Label>
                    <Form.Control {...register("name", { required: true })} />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={3}>
                  <Form.Group controlId="type">
                    <Form.Label>Tipo*</Form.Label>
                    <Form.Select {...register("type", { required: true })}>
                      <option value="">Selecione...</option>
                      <option value="product">Produto</option>
                      <option value="service">Serviço</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={3}>
                  <Form.Group controlId="price">
                    <Form.Label>Preço (R$)*</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      {...register("price", { required: true })}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={3}>
                  <Form.Group controlId="stock">
                    <Form.Label>Estoque</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      {...register("stock", { valueAsNumber: true })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3 mt-3">
                <Col xs={12} md={4}>
                  <Form.Group controlId="availability_start">
                    <Form.Label>Disponível de</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      {...register("availability_start")}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Group controlId="availability_end">
                    <Form.Label>até</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      {...register("availability_end")}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Group controlId="expiration_date">
                    <Form.Label>Expira em</Form.Label>
                    <Form.Control
                      type="date"
                      {...register("expiration_date")}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Col>
          </Row>

          <Row className="g-3 mb-4">
            <Col>
              <Form.Group controlId="description">
                <Form.Label>Descrição</Form.Label>
                <Form.Control as="textarea" rows={2} {...register("description")} />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mb-4">
            <Col xs={12} md={4}>
              <Form.Group controlId="category">
                <Form.Label>Categoria</Form.Label>
                <Form.Control {...register("category")} />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group controlId="subcategory">
                <Form.Label>Subcategoria</Form.Label>
                <Form.Control {...register("subcategory")} />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group controlId="brand">
                <Form.Label>Marca</Form.Label>
                <Form.Control {...register("brand")} />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mb-4">
            <Col xs={12} md={6} lg={3}>
              <Form.Group controlId="status">
                <Form.Label>Status</Form.Label>
                <Form.Select {...register("status")}>
                  <option value="1">Ativo</option>
                  <option value="0">Inativo</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={6} lg={3}>
              <Form.Group controlId="limited_by_user">
                <Form.Label>Limitado por usuário</Form.Label>
                <Form.Select {...register("limited_by_user")}>
                  <option value="0">Não</option>
                  <option value="1">Sim</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={6} lg={3}>
              <Form.Group controlId="discount">
                <Form.Label>Desconto (%)</Form.Label>
                <Form.Control type="number" step="0.01" {...register("discount")} />
              </Form.Group>
            </Col>
            <Col xs={12} md={6} lg={3}>
              <Form.Group controlId="is_featured">
                <Form.Label>Destaque</Form.Label>
                <Form.Select {...register("is_featured")}>
                  <option value="0">Não</option>
                  <option value="1">Sim</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mb-4">
            <Col>
              <Form.Group controlId="notes">
                <Form.Label>Notas</Form.Label>
                <Form.Control as="textarea" rows={2} {...register("notes")} />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col className="text-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner animation="border" size="sm" /> : "Criar Item"}
              </Button>
            </Col>
          </Row>
        </Form>
      </Container>
    </>
  );
}
