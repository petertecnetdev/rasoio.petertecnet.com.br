import React from "react";
import { Card, Button } from "react-bootstrap";
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
  openSchedulePopup,
}) {
  const employers = entity?.employers?.filter((emp) => emp?.user) || [];
  const orders = entity?.orders_summary;

  const isValid = (v) =>
    v !== null &&
    v !== undefined &&
    v !== "" &&
    v !== "null" &&
    !(typeof v === "number" && isNaN(v));

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
              const fullName = `${u.first_name || ""} ${
                isNaN(u.last_name) ? u.last_name || "" : ""
              }`.trim();
              if (!isValid(fullName)) return null;

              return (
                <div
                  key={emp.id}
                  className="d-flex align-items-center mb-3 global-related-item"
                >
                  {isValid(u.avatar) && (
                    <img
                      src={imageUrl(u.avatar)}
                      onError={handleImgError}
                      className="rounded-circle me-3 global-avatar"
                    />
                  )}
                  <div className="flex-grow-1">
                    <div
                      className="fw-semibold text-light"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        u.user_name
                          ? navigate(`/employer/view/${u.user_name}`)
                          : null
                      }
                    >
                      {fullName || "Profissional"}
                    </div>
                    {isValid(u.user_name || emp.role) && (
                      <div className="text-primary small mb-2">
                        {u.user_name || emp.role}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline-warning"
                      className="w-100"
                      onClick={() => openSchedulePopup(emp)}
                    >
                      Agendar
                    </Button>
                  </div>
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
  openSchedulePopup: PropTypes.func.isRequired,
};
