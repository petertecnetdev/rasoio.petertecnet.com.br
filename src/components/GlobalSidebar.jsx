// src/components/GlobalSidebar.jsx
import React from "react";
import { Card } from "react-bootstrap";
import PropTypes from "prop-types";
import "./GlobalSidebar.css";

export default function GlobalSidebar({
  entity,
  metrics,
  interactionSummary,
  userInteractions,
  relatedEntities,
  imageUrl,
  handleImgError,
  navigate,
}) {
  const employers = entity?.employers?.filter((emp) => emp?.user) || [];

  const isValid = (v) =>
    v !== null &&
    v !== undefined &&
    v !== "" &&
    v !== "null" &&
    !(typeof v === "number" && isNaN(v));

  const orders = entity?.orders_summary;

  return (
    <>
      {/* 🌍 LOCALIZAÇÃO */}
      {isValid(entity?.location) && (
        <Card bg="dark" text="light" className="mb-4 global-card">
          <Card.Header>📍 Localização</Card.Header>
          <Card.Body>
            <div
              className="global-map ratio ratio-16x9 rounded overflow-hidden"
              dangerouslySetInnerHTML={{ __html: entity.location }}
            />
          </Card.Body>
        </Card>
      )}

      {/* 💈 PROFISSIONAIS */}
      {employers.length > 0 && (
        <Card bg="dark" text="light" className="mb-4 global-card">
          <Card.Header>💈 Profissionais</Card.Header>
          <Card.Body>
            {employers.map((emp) => {
              const u = emp.user || {};
              const firstName = isValid(u.first_name) ? u.first_name : "";
              const lastName =
                isValid(u.last_name) && isNaN(u.last_name)
                  ? ` ${u.last_name}`
                  : "";
              const fullName = `${firstName}${lastName}`.trim();

              if (!isValid(fullName)) return null;

              return (
                <div
                  key={emp.id}
                  className="d-flex align-items-center mb-1 global-related-item"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    u.user_name
                      ? navigate(`/employer/view/${u.user_name}`)
                      : null
                  }
                >
                
                  <div>
                    <div className="fw-semibold text-light">
                      {fullName || "Profissional"}
                    </div>
                    {isValid(u.user_name || emp.role) && (
                      <div className="text-primary small">
                        {u.user_name || emp.role}
                      </div>
                    )}
                    
                  </div>{isValid(u.avatar) && (
                    <img
                      src={imageUrl(u.avatar)}
                      onError={handleImgError}
                      className="rounded-circle  global-avatar"
                    />
                  )}
                    
                </div>
                
              );
            })}
          </Card.Body>
        </Card>
      )}
{/* 📈 DESEMPENHO DO ESTABELECIMENTO */}
{orders && (
  <Card bg="dark" text="light" className="mb-4 global-card">
    <Card.Header>📈 Desempenho do Estabelecimento</Card.Header>
    <Card.Body>
      {isValid(orders.completion_rate) && (
        <div className="mb-3">
          <div className="d-flex justify-content-between">
            <span>✅ Conclusão</span>
            <span>{orders.completion_rate}%</span>
          </div>
          <div className="progress progress-sm bg-secondary">
            <div
              className="progress-bar bg-success"
              role="progressbar"
              style={{ width: `${orders.completion_rate}%` }}
            ></div>
          </div>
        </div>
      )}

      {isValid(orders.cancellation_rate) && (
        <div className="mb-3">
          <div className="d-flex justify-content-between">
            <span>❌ Cancelamento</span>
            <span>{orders.cancellation_rate}%</span>
          </div>
          <div className="progress progress-sm bg-secondary">
            <div
              className="progress-bar bg-danger"
              role="progressbar"
              style={{ width: `${orders.cancellation_rate}%` }}
            ></div>
          </div>
        </div>
      )}

      {isValid(orders.efficiency_rate) && (
        <div className="mb-3">
          <div className="d-flex justify-content-between">
            <span>⚙️ Eficiência</span>
            <span>{orders.efficiency_rate}%</span>
          </div>
          <div className="progress progress-sm bg-secondary">
            <div
              className="progress-bar bg-info"
              role="progressbar"
              style={{ width: `${orders.efficiency_rate}%` }}
            ></div>
          </div>
        </div>
      )}

      {isValid(orders.return_rate) && (
        <div className="mb-3">
          <div className="d-flex justify-content-between">
            <span>🔁 Clientes recorrentes</span>
            <span>{orders.return_rate}%</span>
          </div>
          <div className="progress progress-sm bg-secondary">
            <div
              className="progress-bar bg-warning"
              role="progressbar"
              style={{ width: `${orders.return_rate}%` }}
            ></div>
          </div>
        </div>
      )}

      {isValid(orders.average_service_time) && (
        <p className="mt-3">
          ⏱️ <strong>Tempo médio de atendimento:</strong>{" "}
          {orders.average_service_time} min
        </p>
      )}

      {isValid(orders.active_days) && (
        <p>
          📅 <strong>Dias de atividade:</strong> {orders.active_days}
        </p>
      )}
    </Card.Body>
  </Card>
)}

      {/* 📊 ESTATÍSTICAS */}
      {metrics && (metrics.total_items || metrics.total_employers || metrics.total_views) && (
        <Card bg="dark" text="light" className="mb-4 global-card">
          <Card.Header>📊 Estatísticas</Card.Header>
          <Card.Body>
            {metrics.total_items > 0 && (
              <p><strong>Itens:</strong> {metrics.total_items}</p>
            )}
            {metrics.total_employers > 0 && (
              <p><strong>Colaboradores:</strong> {metrics.total_employers}</p>
            )}
            {metrics.total_views > 0 && (
              <p><strong>Visualizações:</strong> {metrics.total_views}</p>
            )}
            {metrics.unique_users > 0 && (
              <p><strong>Usuários únicos:</strong> {metrics.unique_users}</p>
            )}
          </Card.Body>
        </Card>
      )}

      {/* 🧾 PEDIDOS */}
      {orders && (
        <Card bg="dark" text="light" className="mb-4 global-card">
          <Card.Header>🧾 Pedidos</Card.Header>
          <Card.Body>
            <p><strong>Total:</strong> {orders.total_orders || 0}</p>
            <p><strong>Concluídos:</strong> {orders.completed_orders || 0}</p>
            <p><strong>Cancelados:</strong> {orders.cancelled_orders || 0}</p>
            <p><strong>Pendentes:</strong> {orders.pending_orders || 0}</p>
            
          </Card.Body>
        </Card>
      )}

      {/* 🏆 CLIENTE DESTAQUE */}
      {orders?.top_client_by_value && (
        <Card bg="dark" text="light" className="mb-4 global-card">
          <Card.Header>🏆 Cliente Destaque</Card.Header>
          <Card.Body className="d-flex align-items-center">
            {isValid(orders.top_client_by_value.avatar) && (
              <img
                src={imageUrl(orders.top_client_by_value.avatar)}
                onError={handleImgError}
                className="rounded-circle me-3 global-avatar"
              />
            )}
            <div>
              <div className="fw-semibold text-light">
                {orders.top_client_by_value.name}
              </div>
              <div className="text-white small">
                Total gasto: R${" "}
                {Number(orders.top_client_by_value.total_spent || 0)
                  .toFixed(2)
                  .replace(".", ",")}
              </div>
              <div className="text-muted small">
                Pedidos: {orders.top_client_by_value.total_orders}
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* 👁️ INTERAÇÕES */}
      {interactionSummary && (
        <Card bg="dark" text="light" className="mb-4 global-card">
          <Card.Header>👁️ Interações</Card.Header>
          <Card.Body>
            {isValid(interactionSummary.total_views) && (
              <p><strong>Total:</strong> {interactionSummary.total_views}</p>
            )}
            {isValid(interactionSummary.unique_users) && (
              <p><strong>Usuários únicos:</strong> {interactionSummary.unique_users}</p>
            )}
            {isValid(interactionSummary.most_active_user?.name) && (
              <p><strong>Mais ativo:</strong> {interactionSummary.most_active_user.name}</p>
            )}
            {isValid(interactionSummary.last_view_user?.name) && (
              <p><strong>Último visitante:</strong> {interactionSummary.last_view_user.name}</p>
            )}
          </Card.Body>
        </Card>
      )}

      {/* 🧑‍💻 USUÁRIOS RECENTES */}
      {userInteractions?.filter((u) => isValid(u.name)).length > 0 && (
        <Card bg="dark" text="light" className="mb-4 global-card">
          <Card.Header>🧑‍💻 Usuários Recentes</Card.Header>
          <Card.Body>
            {userInteractions
              .filter((u) => isValid(u.name))
              .slice(0, 5)
              .map((u) => (
                <div
                  key={u.user_id}
                  className="d-flex align-items-center mb-3 global-user-item"
                  onClick={() => navigate(`/user/view/${u.user_id}`)}
                  style={{ cursor: "pointer" }}
                >
                  
                  <div>
                    <div className="fw-semibold text-light">{u.name}</div>
                    {isValid(u.email) && (
                      <div className="text-white small">{u.email}</div>
                    )}
                  </div>
                  {isValid(u.avatar) && (
                    <img
                      src={imageUrl(u.avatar)}
                      onError={handleImgError}
                      className="rounded-circle m-2 global-avatar"
                    />
                  )}
                </div>
              ))}
          </Card.Body>
        </Card>
      )}

      {/* 🔗 RELACIONADOS */}
      {relatedEntities?.filter((e) => isValid(e.name)).length > 0 && (
        <Card bg="dark" text="light" className="mb-4 global-card">
          <Card.Header>🏪 Relacionados</Card.Header>
          <Card.Body>
            {relatedEntities
              .filter((e) => isValid(e.name))
              .slice(0, 5)
              .map((e) => (
                <div
                  key={e.id}
                  className="d-flex align-items-center mb-3 global-related-item"
                  onClick={() =>
                    e.slug
                      ? navigate(`/establishment/view/${e.slug}`)
                      : null
                  }
                  style={{ cursor: "pointer" }}
                >
                  {isValid(e.logo || e.image) && (
                    <img
                      src={imageUrl(e.logo || e.image)}
                      onError={handleImgError}
                      className="rounded m-3 global-avatar"
                    />
                  )}
                  <div>
                    <div className="fw-semibold text-light">{e.name}</div>
                    {isValid(e.city || e.subtitle) && (
                      <div className="text-light small">
                        {e.city || e.subtitle}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </Card.Body>
        </Card>
      )}
    </>
  );
}

GlobalSidebar.propTypes = {
  entity: PropTypes.object,
  metrics: PropTypes.object,
  interactionSummary: PropTypes.object,
  userInteractions: PropTypes.array,
  relatedEntities: PropTypes.array,
  imageUrl: PropTypes.func.isRequired,
  handleImgError: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
};
