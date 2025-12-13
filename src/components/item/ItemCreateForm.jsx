// src/components/item/ItemCreateForm.jsx
import React from "react";
import { Row, Col, Form, Button } from "react-bootstrap";
import GlobalHeroEditorPreview from "../GlobalHeroEditorPreview";
import { appId } from "../../config";
import "./ItemCreateForm.css";

export default function ItemCreateForm({
  register,
  handleSubmit,
  watch,
  isSubmitting,
  imagePreview,
  handleImageChange,
  handleRemoveImage,
  onSubmit,
}) {
  const type = watch("type");

  return (
    <>
      <GlobalHeroEditorPreview
        entity="item"
        title={watch("name") || "Novo Item"}
        subtitle="Visualização do cadastro"
        logoPreview={imagePreview ?? null}
        data={{ name: watch("name") }}
      />

      <div className="d-flex justify-content-center gap-3 my-3">
        <Button
          variant="secondary"
          className="action-button"
          onClick={() => document.getElementById("itemImageInput")?.click()}
        >
          Adicionar Imagem
        </Button>

        {imagePreview && (
          <Button
            variant="secondary"
            className="action-button"
            onClick={handleRemoveImage}
          >
            Remover Imagem
          </Button>
        )}
      </div>

      <Form.Control
        id="itemImageInput"
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        style={{ display: "none" }}
      />

      <Form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" value={appId} {...register("app_id")} />

        <Row className="gy-3 mt-3">
          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Nome*</label>
              <input type="text" {...register("name", { required: true })} required />
            </div>
          </Col>

          <Col xs={12} md={6} lg={3}>
            <div className="form-group">
              <label>Tipo*</label>
              <select {...register("type", { required: true })} required>
                <option value="">Selecione</option>
                <option value="service">Serviço</option>
                <option value="product">Produto</option>
              </select>
            </div>
          </Col>

          {type === "service" && (
            <Col xs={12} md={4} lg={2}>
              <div className="form-group">
                <label>Duração (minutos)*</label>
                <input
                  type="number"
                  min="1"
                  {...register("duration", { required: true })}
                />
              </div>
            </Col>
          )}

          <Col xs={12} md={6} lg={3}>
            <div className="form-group">
              <label>Preço*</label>
              <input
                type="text"
                inputMode="decimal"
                {...register("price", { required: true })}
              />
            </div>
          </Col>

          <Col xs={12} md={6} lg={2}>
            <div className="form-group">
              <label>Estoque</label>
              <input type="number" min="0" {...register("stock")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={3}>
            <div className="form-group">
              <label>Status</label>
              <select {...register("status")} defaultValue={1}>
                <option value={1}>Ativo</option>
                <option value={0}>Inativo</option>
              </select>
            </div>
          </Col>

          <Col xs={12} md={6} lg={3}>
            <div className="form-group">
              <label>Limitar p/ Usuário</label>
              <select {...register("limited_by_user")} defaultValue={0}>
                <option value={0}>Não</option>
                <option value={1}>Sim</option>
              </select>
            </div>
          </Col>

          <Col xs={12} md={6} lg={3}>
            <div className="form-group">
              <label>Categoria</label>
              <input type="text" {...register("category")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={3}>
            <div className="form-group">
              <label>Subcategoria</label>
              <input type="text" {...register("subcategory")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Marca</label>
              <input type="text" {...register("brand")} />
            </div>
          </Col>

          <Col xs={12}>
            <div className="form-group">
              <label>Descrição</label>
              <textarea rows={3} {...register("description")} />
            </div>
          </Col>

          <Col xs={12} className="text-end">
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Criar Item"}
            </button>
          </Col>
        </Row>
      </Form>
    </>
  );
}
