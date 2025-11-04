// src/components/establishment/EstablishmentSidebar.jsx
import React, { useMemo, useCallback } from "react";
import { Card, Button, Badge } from "react-bootstrap";
import PropTypes from "prop-types";
import "./EstablishmentSidebar.css";

const fmtBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function EstablishmentSidebar({
  establishment,
  metrics,
  ordersSummary,
  userInteractions,
  otherEstablishments,
  imageUrl,
  handleImgError,
  navigate,
  openSchedulePopup,
}) {
  const isValid = useCallback(
    (v) =>
      v !== null &&
      v !== undefined &&
      v !== "" &&
      v !== "null" &&
      !(typeof v === "number" && isNaN(v)),
    []
  );

  const employers = useMemo(
    () => establishment?.employers?.filter((emp) => emp?.user) || [],
    [establishment]
  );

  const services = useMemo(
    () => establishment?.items?.filter((it) => it?.type === "service") || [],
    [establishment]
  );

  const products = useMemo(
    () => establishment?.items?.filter((it) => it?.type === "product") || [],
    [establishment]
  );

  if (!establishment) return <div className="sidebar-loading-skeleton"></div>;

  return (
    <div className="est-sidebar">
     {/* 🌍 LOCALIZAÇÃO */}
{(isValid(establishment?.location) || isValid(establishment?.address)) && (
  <Card className="est-card">
    <Card.Header>📍 Localização</Card.Header>
    <Card.Body>
      {isValid(establishment?.location) && (
        <div
          className="est-map ratio ratio-16x9 rounded overflow-hidden"
          dangerouslySetInnerHTML={{ __html: establishment.location }}
        />
      )}

      {isValid(establishment?.address) && (
        <p className="mt-3 small text-secondary">
          {establishment.address}
          {establishment.city ? ` - ${establishment.city}` : ""}
          {establishment.uf ? `/${establishment.uf}` : ""}
          {establishment.cep ? ` - CEP ${establishment.cep}` : ""}
        </p>
      )}
    </Card.Body>
  </Card>
)}


      {employers.length > 0 && (
        <Card className="est-card">
          <Card.Header className="d-flex align-items-center justify-content-between">
            <span>💈 Colaboradores</span>
            <Badge bg="info" className="px-2 py-1">
              {employers.length}
            </Badge>
          </Card.Header>
          <Card.Body>
            {employers.map((emp) => {
              const u = emp.user || {};
              const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
              if (!isValid(fullName)) return null;
              return (
                <div key={emp.id} className="est-employee-card mb-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div
                      className="d-flex align-items-center flex-grow-1 cursor-pointer"
                      onClick={() =>
                        u.user_name ? navigate(`/employer/view/${u.user_name}`) : null
                      }
                    >
                      <div className="position-relative me-3">
                        <div className="est-avatar-frame">
                          {isValid(u.avatar) ? (
                            <img
                              src={imageUrl(u.avatar)}
                              onError={handleImgError}
                              className="est-avatar-img"
                              alt={fullName}
                            />
                          ) : (
                            <div className="est-avatar-placeholder">
                              {u.first_name?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                        <div
                          className={`est-status-dot ${
                            emp.is_available ? "online" : "offline"
                          }`}
                        ></div>
                      </div>
                      <div>
                        <div className="fw-semibold text-light fs-6">{fullName}</div>
                        {isValid(emp.role) && (
                          <div className="text-info small">{emp.role}</div>
                        )}
                        {u.about && (
                          <div className="text-secondary small mt-1 text-truncate">
                            {u.about}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline-warning"
                      title="Agendar horário"
                      className="est-employee-btn"
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

      {(services.length > 0 || products.length > 0) && (
        <Card className="est-card">
          <Card.Header>🧾 Serviços / Produtos</Card.Header>
          <Card.Body>
            {[...services.slice(0, 3), ...products.slice(0, 3)].map((it) => (
              <div
                key={it.id}
                className="est-item-card mb-3 cursor-pointer"
                onClick={() => navigate(`/item/view/${it.slug}`)}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="flex-grow-1">
                    <div className="fw-semibold text-light">{it.name}</div>
                    {it.price && (
                      <div className="text-info small">{fmtBRL.format(it.price)}</div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline-warning"
                    title="Agendar este serviço"
                    className="est-employee-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openSchedulePopup(it);
                    }}
                  >
                    Agendar
                  </Button>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {metrics && (
        <Card className="est-card">
          <Card.Header>📊 Métricas</Card.Header>
          <Card.Body>
            {Object.entries(metrics)
              .filter(([_, v]) => isValid(v))
              .map(([k, v]) => {
                const labels = {
                  total_items: "Itens Cadastrados",
                  total_employers: "Colaboradores",
                  total_orders: "Pedidos Realizados",
                  completed_orders: "Pedidos Concluídos",
                  cancelled_orders: "Pedidos Cancelados",
                  pending_orders: "Pedidos Pendentes",
                  total_revenue: "Receita Total",
                  average_ticket: "Ticket Médio",
                  unique_users: "Usuários Únicos",
                  total_views: "Visualizações",
                };
                const label = labels[k] || k.replace(/_/g, " ");
                return (
                  <div
                    key={k}
                    className="d-flex justify-content-between mb-2 text-white"
                  >
                    <span>{label}</span>
                    <strong>
                      {typeof v === "number"
                        ? v % 1 === 0
                          ? v
                          : v.toFixed(2)
                        : v}
                    </strong>
                  </div>
                );
              })}
          </Card.Body>
        </Card>
      )}

      {ordersSummary && (
        <Card className="est-card">
          <Card.Header>📈 Desempenho</Card.Header>
          <Card.Body>
            {[ 
              { key: "completion_rate", label: "Taxa de Conclusão", color: "bg-success" },
              { key: "cancellation_rate", label: "Taxa de Cancelamento", color: "bg-danger" },
              { key: "return_rate", label: "Clientes Recorrentes", color: "bg-warning" },
              { key: "efficiency_rate", label: "Eficiência", color: "bg-info" },
            ].map(
              ({ key, label, color }) =>
                isValid(ordersSummary[key]) && (
                  <div key={key} className="mb-3">
                    <div className="d-flex justify-content-between text-white">
                      <span>{label}</span>
                      <span>{ordersSummary[key]}%</span>
                    </div>
                    <div className="progress progress-sm bg-secondary">
                      <div
                        className={`progress-bar ${color}`}
                        role="progressbar"
                        style={{ width: `${ordersSummary[key]}%` }}
                      ></div>
                    </div>
                  </div>
                )
            )}
          </Card.Body>
        </Card>
      )}

      {userInteractions?.length > 0 && (
        <Card className="est-card">
          <Card.Header>👥 Usuários que Interagiram</Card.Header>
          <Card.Body>
            {userInteractions.slice(0, 5).map((u) => (
              <div key={u.user_id} className="est-employee-card mb-3">
                <div className="d-flex align-items-center">
                  <div className="position-relative me-3">
                    <div className="est-avatar-frame">
                      {isValid(u.avatar) ? (
                        <img
                          src={imageUrl(u.avatar)}
                          onError={handleImgError}
                          className="est-avatar-img"
                          alt={u.name}
                        />
                      ) : (
                        <div className="est-avatar-placeholder">
                          {u.name?.charAt(0) || "?"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-grow-1">
                    {u.user_name ? (
                      <span
                        onClick={() => navigate(`/user/view/${u.user_name}`)}
                        className="fw-semibold text-info text-decoration-none cursor-pointer"
                      >
                        {u.name}
                      </span>
                    ) : (
                      <span className="fw-semibold text-light">{u.name}</span>
                    )}
                    {u.last_interaction && (
                      <div className="text-white small mt-1">
                        <i className="bi bi-clock-history me-1"></i>
                        Última visita:{" "}
                        <span className="text-info">{u.last_interaction}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {otherEstablishments?.length > 0 && (
        <Card className="est-card">
          <Card.Header>🏪 Outros Estabelecimentos</Card.Header>
          <Card.Body>
            {otherEstablishments.slice(0, 5).map((e) => (
              <div
                key={e.id}
                className="est-employee-card mb-3 cursor-pointer"
                onClick={() => navigate(`/establishment/view/${e.slug}`)}
              >
                <div className="d-flex align-items-center">
                  <div className="position-relative me-3">
                    <div className="est-avatar-frame">
                      {isValid(e.logo || e.image) ? (
                        <img
                          src={imageUrl(e.logo || e.image)}
                          onError={handleImgError}
                          className="est-avatar-img"
                          alt={e.name}
                        />
                      ) : (
                        <div className="est-avatar-placeholder">
                          {e.name?.charAt(0) || "?"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="fw-semibold text-light">{e.name}</div>
                    {e.city && <div className="text-secondary small">{e.city}</div>}
                    {e.category && (
                      <Badge bg="info" className="text-dark small mt-1">
                        {e.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

EstablishmentSidebar.propTypes = {
  establishment: PropTypes.object,
  metrics: PropTypes.object,
  ordersSummary: PropTypes.object,
  userInteractions: PropTypes.array,
  otherEstablishments: PropTypes.array,
  imageUrl: PropTypes.func.isRequired,
  handleImgError: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  openSchedulePopup: PropTypes.func.isRequired,
};
