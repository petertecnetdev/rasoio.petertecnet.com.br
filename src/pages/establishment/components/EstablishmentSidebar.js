// src/pages/establishment/components/EstablishmentSidebar.jsx
import React from "react";
import { Card } from "react-bootstrap";
import PropTypes from "prop-types";
import "../../establishment/EstablishmentView.css";

export default function EstablishmentSidebar({
  establishment,
  metrics,
  interactionSummary,
  userInteractions,
  otherEstablishments,
  imageUrl,
  handleImgError,
  navigate,
}) {
  return (
    <>
      {/* 📍 LOCALIZAÇÃO NO MAPA */}
      {establishment?.location && (
        <Card bg="dark" text="light" className="mb-4">
          <Card.Header>📍 Localização</Card.Header>
          <Card.Body>
            <div
              className="estv-map-container ratio ratio-16x9 rounded overflow-hidden"
              dangerouslySetInnerHTML={{ __html: establishment.location }}
            />
          </Card.Body>
        </Card>
      )}

      {/* 📊 MÉTRICAS GERAIS */}
      {metrics && (
        <Card bg="dark" text="light" className="mb-4">
          <Card.Header>📊 Métricas Gerais</Card.Header>
          <Card.Body>
            <ul className="list-unstyled mb-0">
              <li>
                <strong>Itens:</strong> {metrics.total_items || 0}
              </li>
              <li>
                <strong>Serviços:</strong> {metrics.total_services || 0}
              </li>
              <li>
                <strong>Produtos:</strong> {metrics.total_products || 0}
              </li>
              <li>
                <strong>Visualizações:</strong> {metrics.total_views || 0}
              </li>
              <li>
                <strong>Usuários únicos:</strong> {metrics.unique_users || 0}
              </li>
            </ul>
          </Card.Body>
        </Card>
      )}

      {/* 👁️ INTERAÇÕES */}
      {interactionSummary && (
        <Card bg="dark" text="light" className="mb-4">
          <Card.Header>👁️ Interações</Card.Header>
          <Card.Body>
            <p>
              <strong>Total de visualizações:</strong>{" "}
              {interactionSummary.total_views || 0}
            </p>
            <p>
              <strong>Usuários únicos:</strong>{" "}
              {interactionSummary.unique_users || 0}
            </p>

            {interactionSummary.most_active_user && (
              <p>
                <strong>Mais ativo:</strong>{" "}
                {interactionSummary.most_active_user.name} (
                {interactionSummary.most_active_user.views} visualizações)
              </p>
            )}

            {interactionSummary.last_view_user && (
              <p>
                <strong>Último visitante:</strong>{" "}
                {interactionSummary.last_view_user.name} em{" "}
                {interactionSummary.last_view_user.last_view
                  ? new Date(
                      interactionSummary.last_view_user.last_view
                    ).toLocaleString("pt-BR")
                  : "—"}
              </p>
            )}
          </Card.Body>
        </Card>
      )}

      {/* 🧑‍💻 USUÁRIOS RECENTES */}
      {userInteractions?.length > 0 && (
        <Card bg="dark" text="light" className="mb-4">
          <Card.Header>🧑‍💻 Usuários Recentes</Card.Header>
          <Card.Body>
            {userInteractions.slice(0, 5).map((user) => (
              <div
                key={user.user_id}
                className="d-flex align-items-center mb-3 estv-employer-item"
              >
                <img
                  src={imageUrl(user.user_avatar)}
                  onError={handleImgError}
                  className="rounded-circle me-3"
                  style={{
                    width: 45,
                    height: 45,
                    objectFit: "cover",
                    border: "2px solid rgba(255,255,255,0.1)",
                  }}
                />
                <div>
                  <div className="fw-semibold text-light">
                    {user.user_name || "Usuário"}
                  </div>
                  <div className="text-muted small">
                    {user.last_view
                      ? new Date(user.last_view).toLocaleDateString("pt-BR")
                      : "—"}
                  </div>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* 🏪 OUTROS ESTABELECIMENTOS */}
      {otherEstablishments?.length > 0 && (
        <Card bg="dark" text="light" className="mb-4">
          <Card.Header>🏪 Outros Estabelecimentos</Card.Header>
          <Card.Body>
            {otherEstablishments.slice(0, 5).map((est) => (
              <div
                key={est.id}
                className="d-flex align-items-center mb-3 estv-employer-item"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/establishment/view/${est.slug}`)}
              >
                <img
                  src={imageUrl(est.logo)}
                  onError={handleImgError}
                  className="rounded-circle me-3"
                  style={{
                    width: 45,
                    height: 45,
                    objectFit: "cover",
                    border: "2px solid rgba(255,255,255,0.1)",
                  }}
                />
                <div>
                  <div className="fw-semibold text-light">
                    {est.name || "Estabelecimento"}
                  </div>
                  <div className="text-muted small">
                    {est.city || "Local desconhecido"}
                  </div>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* ℹ️ INFORMAÇÕES COMPLEMENTARES */}
      {establishment && (
        <Card bg="dark" text="light" className="mb-4">
          <Card.Header>ℹ️ Informações</Card.Header>
          <Card.Body>
            <p>
              <strong>Categoria:</strong> {establishment.category || "—"}
            </p>
            <p>
              <strong>Cidade:</strong> {establishment.city || "—"}
            </p>
            <p>
              <strong>Criado em:</strong>{" "}
              {establishment.created_at
                ? new Date(establishment.created_at).toLocaleDateString("pt-BR")
                : "—"}
            </p>
            <p>
              <strong>Atualizado em:</strong>{" "}
              {establishment.updated_at
                ? new Date(establishment.updated_at).toLocaleDateString("pt-BR")
                : "—"}
            </p>
          </Card.Body>
        </Card>
      )}
    </>
  );
}

EstablishmentSidebar.propTypes = {
  establishment: PropTypes.object,
  metrics: PropTypes.object,
  interactionSummary: PropTypes.object,
  userInteractions: PropTypes.array,
  otherEstablishments: PropTypes.array,
  imageUrl: PropTypes.func.isRequired,
  handleImgError: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
};
