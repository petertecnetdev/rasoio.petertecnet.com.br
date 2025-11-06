import React, { useMemo, useCallback, useState } from "react";
import { Card, Button, Badge, Modal } from "react-bootstrap";
import PropTypes from "prop-types";
import LoginFormComponent from "../auth/LoginFormComponent";
import "./EmployerSidebar.css";

export default function EmployerSidebar({
  employer,
  metrics,
  interactionSummary,
  userInteractions,
  relatedEmployers,
  imageUrl,
  handleImgError,
  navigate,
  openSchedulePopup,
}) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingEmployer, setPendingEmployer] = useState(null);

  const isAuthenticated = () => !!localStorage.getItem("token");

  const handleScheduleClick = (emp) => {
    if (!isAuthenticated()) {
      setPendingEmployer(emp);
      setShowLoginModal(true);
      return;
    }
    openSchedulePopup(emp);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (pendingEmployer) {
      setTimeout(() => {
        openSchedulePopup(pendingEmployer);
        setPendingEmployer(null);
      }, 300);
    }
  };

  const isValid = useCallback(
    (v) =>
      v !== null &&
      v !== undefined &&
      v !== "" &&
      v !== "null" &&
      !(typeof v === "number" && isNaN(v)),
    []
  );

  if (!employer) return <div className="sidebar-loading-skeleton"></div>;

  const establishment = employer.establishment || {};
  const u = employer.user || {};
  const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();

  return (
    <>
      <div className="emp-sidebar">
        <Card className="emp-card">
          <Card.Header>💈 Colaborador</Card.Header>
          <Card.Body>
            <div className="d-flex align-items-center">
              <div className="position-relative me-3">
                <div className="emp-avatar-frame">
                  {isValid(u.avatar) ? (
                    <img
                      src={imageUrl(u.avatar)}
                      onError={handleImgError}
                      className="emp-avatar-img"
                      alt={fullName}
                    />
                  ) : (
                    <div className="emp-avatar-placeholder">
                      {u.first_name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div className="fw-semibold text-light fs-6">{fullName}</div>
                {isValid(employer.role) && (
                  <div className="text-info small">{employer.role}</div>
                )}
                {establishment?.name && (
                  <div
                    className="text-secondary small cursor-pointer mt-1"
                    onClick={() =>
                      establishment.slug
                        ? navigate(`/establishment/view/${establishment.slug}`)
                        : null
                    }
                  >
                    🏪 {establishment.name}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 d-flex justify-content-center">
              <Button
                size="sm"
                variant="outline-warning"
                className="px-3"
                onClick={() => handleScheduleClick(employer)}
              >
                Agendar com {u.first_name}
              </Button>
            </div>
          </Card.Body>
        </Card>

        {interactionSummary && (
          <Card className="emp-card">
            <Card.Header>👁️ Resumo de Interações</Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Total de Visualizações</span>
                <strong>{interactionSummary.total_views || 0}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Usuários Únicos</span>
                <strong>{interactionSummary.unique_users || 0}</strong>
              </div>
              {interactionSummary.most_active_user && (
                <div className="text-secondary small mt-2">
                  🔥 Mais ativo:{" "}
                  <span
                    className="text-info cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/user/view/${interactionSummary.most_active_user.user_name}`
                      )
                    }
                  >
                    {interactionSummary.most_active_user.name}
                  </span>
                </div>
              )}
              {interactionSummary.last_view_user && (
                <div className="text-secondary small mt-1">
                  🕓 Última visita:{" "}
                  <span
                    className="text-info cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/user/view/${interactionSummary.last_view_user.user_name}`
                      )
                    }
                  >
                    {interactionSummary.last_view_user.name}
                  </span>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {userInteractions?.length > 0 && (
          <Card className="emp-card">
            <Card.Header>👥 Usuários que Interagiram</Card.Header>
            <Card.Body>
              {userInteractions.slice(0, 5).map((u) => (
                <div key={u.user_id} className="emp-user-card mb-3">
                  <div className="d-flex align-items-center">
                    <div className="position-relative me-3">
                      <div className="emp-avatar-frame">
                        {isValid(u.avatar) ? (
                          <img
                            src={imageUrl(u.avatar)}
                            onError={handleImgError}
                            className="emp-avatar-img"
                            alt={u.name}
                          />
                        ) : (
                          <div className="emp-avatar-placeholder">
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

        {relatedEmployers?.length > 0 && (
          <Card className="emp-card">
            <Card.Header>🤝 Outros Colaboradores</Card.Header>
            <Card.Body>
              {relatedEmployers.slice(0, 5).map((emp) => {
                const ru = emp.user || {};
                const name = `${ru.first_name || ""} ${ru.last_name || ""}`.trim();
                return (
                  <div
                    key={emp.id}
                    className="emp-related-card mb-3 cursor-pointer"
                    onClick={() =>
                      ru.user_name ? navigate(`/employer/view/${ru.user_name}`) : null
                    }
                  >
                    <div className="d-flex align-items-center">
                      <div className="position-relative me-3">
                        <div className="emp-avatar-frame">
                          {isValid(ru.avatar) ? (
                            <img
                              src={imageUrl(ru.avatar)}
                              onError={handleImgError}
                              className="emp-avatar-img"
                              alt={name}
                            />
                          ) : (
                            <div className="emp-avatar-placeholder">
                              {ru.first_name?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="fw-semibold text-light">{name}</div>
                        {isValid(emp.role) && (
                          <div className="text-info small">{emp.role}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card.Body>
          </Card>
        )}
      </div>

      <Modal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        centered
        size="md"
        backdrop="static"
        className="login-modal"
      >
        <Modal.Body className="bg-dark text-light p-4 rounded-3">
          <h5 className="text-center mb-3">Faça login para continuar</h5>
          <LoginFormComponent onSuccess={handleLoginSuccess} />
        </Modal.Body>
      </Modal>
    </>
  );
}

EmployerSidebar.propTypes = {
  employer: PropTypes.object,
  metrics: PropTypes.object,
  interactionSummary: PropTypes.object,
  userInteractions: PropTypes.array,
  relatedEmployers: PropTypes.array,
  imageUrl: PropTypes.func.isRequired,
  handleImgError: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  openSchedulePopup: PropTypes.func.isRequired,
};
