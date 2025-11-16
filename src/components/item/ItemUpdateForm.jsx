import React from "react";
import { Row, Col, Form, Button } from "react-bootstrap";
import GlobalHeroEditorPreview from "../GlobalHeroEditorPreview";
import "./ItemUpdateForm.css";

export default function ItemUpdateForm({
  register,
  handleSubmit,
  isSubmitting,
  imagePreview,
  backgroundPreview,
  handleImageChange,
  handleRemoveImage,
  handleImageError,
  onSubmit,
}) {
  return (
    <>
      {/* PREVIEW GLOBAL */}
      <GlobalHeroEditorPreview
        backgroundPreview={backgroundPreview}  // VEM DO ESTABLISHMENT
        logoPreview={imagePreview}            // É A IMAGEM DO ITEM
        segments={[]}
        title="Pré-visualização do Item"
        subtitle="As alterações serão refletidas aqui..."
      />

      {/* BOTÕES DE TROCA DE IMAGEM */}
      <div className="d-flex justify-content-center gap-3 my-3">

        <Button
          variant="secondary"
          className="action-button"
          onClick={() => document.getElementById("itemImageInput").click()}
        >
          Alterar Imagem
        </Button>

        {imagePreview && (
          <Button
            variant="danger"
            className="action-button"
            onClick={handleRemoveImage}
          >
            Remover Imagem
          </Button>
        )}
      </div>

      {/* INPUT REAL (ESCONDIDO) */}
      <Form.Control
        id="itemImageInput"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: "none" }}
      />

      {/* HIDDEN PARA REMOVER IMAGEM */}
      <input type="hidden" {...register("remove_image")} />

      {/* FORMULÁRIO */}
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row className="gy-3 mt-2">

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Nome*</label>
              <input type="text" {...register("name", { required: true })} required />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Tipo</label>
              <input type="text" {...register("type")} />
            </div>
          </Col>

          <Col xs={6} md={4} lg={2}>
            <div className="form-group">
              <label>Preço</label>
              <input type="number" step="0.01" {...register("price")} />
            </div>
          </Col>

          <Col xs={6} md={4} lg={2}>
            <div className="form-group">
              <label>Estoque</label>
              <input type="number" {...register("stock")} />
            </div>
          </Col>

          <Col xs={6} md={4} lg={2}>
            <div className="form-group">
              <label>Status</label>
              <select {...register("status")}>
                <option value="1">Ativo</option>
                <option value="0">Inativo</option>
              </select>
            </div>
          </Col>

          <Col xs={6} md={4} lg={2}>
            <div className="form-group">
              <label>Limitar p/ Usuário</label>
              <select {...register("limited_by_user")}>
                <option value="0">Não</option>
                <option value="1">Sim</option>
              </select>
            </div>
          </Col>

          <Col xs={12} md={4} lg={3}>
            <div className="form-group">
              <label>Categoria</label>
              <input type="text" {...register("category")} />
            </div>
          </Col>

          <Col xs={12} md={4} lg={3}>
            <div className="form-group">
              <label>Subcategoria</label>
              <input type="text" {...register("subcategory")} />
            </div>
          </Col>

          <Col xs={12} md={4} lg={3}>
            <div className="form-group">
              <label>Marca</label>
              <input type="text" {...register("brand")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Disponível a partir de</label>
              <input type="datetime-local" {...register("availability_start")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Disponível até</label>
              <input type="datetime-local" {...register("availability_end")} />
            </div>
          </Col>

          <Col xs={12} md={6} lg={4}>
            <div className="form-group">
              <label>Tags</label>
              <input type="text" {...register("tags")} />
            </div>
          </Col>

          <Col xs={12} md={4} lg={2}>
            <div className="form-group">
              <label>Desconto (%)</label>
              <input type="number" step="0.01" {...register("discount")} />
            </div>
          </Col>

          <Col xs={12} md={4} lg={3}>
            <div className="form-group">
              <label>Validade</label>
              <input type="date" {...register("expiration_date")} />
            </div>
          </Col>

          <Col xs={12} md={4} lg={3}>
            <div className="form-group">
              <label>Destaque</label>
              <select {...register("is_featured")}>
                <option value="0">Não</option>
                <option value="1">Sim</option>
              </select>
            </div>
          </Col>

          <Col xs={12}>
            <div className="form-group">
              <label>Descrição</label>
              <textarea rows={3} {...register("description")} />
            </div>
          </Col>

          <Col xs={12}>
            <div className="form-group">
              <label>Notas Internas</label>
              <textarea rows={3} {...register("notes")} />
            </div>
          </Col>

          <Col xs={12} className="text-end">
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </Col>

        </Row>
      </Form>
    </>
  );
}
