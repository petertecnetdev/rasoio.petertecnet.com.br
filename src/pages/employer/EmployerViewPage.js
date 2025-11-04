// src/pages/employer/EmployerViewPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaWhatsapp, FaMapMarkedAlt, FaInstagram, FaStore } from "react-icons/fa";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./EmployerView.css";

export default function EmployerViewPage() {
  const { user_name } = useParams();
  const navigate = useNavigate();

  const [employer, setEmployer] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [interactionSummary, setInteractionSummary] = useState(null);
  const [userInteractions, setUserInteractions] = useState([]);
  const [appointmentsRecent, setAppointmentsRecent] = useState([]);
  const [establishment, setEstablishment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const ph = "/images/logo.png";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [user_name]);

  const handleImgError = useCallback((e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = ph;
  }, []);

  const imageUrl = useCallback((path) => {
    if (!path) return ph;
    return `${storageUrl}/${path}`;
  }, []);

  const fmtBRL = useCallback(
    (v) =>
      `R$ ${Number(v || 0)
        .toFixed(2)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`,
    []
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/employer/view/${user_name}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!active) return;
        const data = res.data?.employer || null;

        setEmployer(data);
        setMetrics(data?.metrics || null);
        setInteractionSummary(data?.interaction_summary || null);
        setUserInteractions(data?.user_interactions || []);
        setAppointmentsRecent(data?.appointments_recent || []);
        setEstablishment(data?.establishment || null);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text:
            err.response?.status === 404
              ? "Colaborador não encontrado."
              : "Não foi possível carregar os dados do colaborador.",
        }).then(() => navigate("/404"));
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user_name, navigate, token]);

  const whatsappLink = useMemo(() => {
    const raw = String(employer?.user?.phone || "").replace(/\D/g, "");
    if (!raw) return null;
    const withCc = raw.startsWith("55") ? raw : `55${raw}`;
    const msg = encodeURIComponent(
      `Olá ${employer?.user?.first_name || ""}! Gostaria de agendar um atendimento com você.`
    );
    return `https://wa.me/${withCc}?text=${msg}`;
  }, [employer]);

  if (isLoading) {
    return (
      <div className="employerv-root">
        <NavlogComponent />
      </div>
    );
  }

  if (!employer || !employer.user) return null;

  const user = employer.user;
  const nome = `${user.first_name || ""} ${user.last_name || ""}`.trim();

  return (
    <div className="employerv-root">
      <NavlogComponent />

      {/* HERO */}
      <div
        className="employerv-hero"
        style={{
          backgroundImage: `url("${imageUrl(
            establishment?.background || user.cover_image
          )}")`,
        }}
      >
        <div className="employerv-hero-overlay" />
        <Container fluid className="employerv-hero-content">
          <div className="employerv-hero-left">
            <img
              src={imageUrl(user.avatar)}
              alt={nome}
              className="employerv-avatar"
              onError={handleImgError}
            />
          </div>
          <div className="employerv-hero-right">
            <h1 className="employerv-title">{nome}</h1>
            {employer.role && (
              <div className="employerv-role">
                <Badge bg="primary">{employer.role}</Badge>
              </div>
            )}

            <div className="employerv-actions">
              {whatsappLink && (
                <Button
                  as="a"
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  size="sm"
                  className="btn-action"
                >
                  <FaWhatsapp /> WhatsApp
                </Button>
              )}
              {user.instagram_url && (
                <Button
                  as="a"
                  href={user.instagram_url}
                  size="sm"
                  className="btn-action"
                >
                  <FaInstagram /> Instagram
                </Button>
              )}
              {establishment?.location && (
                <Button
                  as="a"
                  href={establishment.location}
                  size="sm"
                  className="btn-action"
                >
                  <FaMapMarkedAlt /> Como chegar
                </Button>
              )}
              {establishment && (
                <Button
                  onClick={() => navigate(`/establishment/view/${establishment.slug}`)}
                  size="sm"
                  className="btn-establishment"
                >
                  <img
                    src={imageUrl(establishment.logo)}
                    alt={establishment.name}
                    onError={handleImgError}
                    className="estv-mini-logo"
                  />
                  <div className="estv-mini-info">
                    <div className="estv-mini-name">{establishment.name}</div>
                    {establishment.address && (
                      <div className="estv-mini-address">
                        {establishment.address}
                      </div>
                    )}
                  </div>
                </Button>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* MAIN */}
      <Container fluid className="employerv-main">
        <Row className="gx-3 gy-4">
          <Col md={8}>
            {appointmentsRecent.length > 0 && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Últimos Atendimentos</strong>
                </Card.Header>
                <Card.Body>
                  {appointmentsRecent.map((a) => (
                    <div key={a.id} className="employerv-appointment mb-3 p-2 rounded">
                      <div className="fw-bold text-light">{a.customer_name}</div>
                      <div className="text-white-50 small">
                        {new Date(a.order_datetime).toLocaleString("pt-BR")}
                      </div>
                      <div className="text-white small mt-1">
                        Nº {a.order_number} -{" "}
                        <Badge bg="info" className="me-1">
                          {a.appointment_status}
                        </Badge>{" "}
                      </div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            )}

            {userInteractions.length > 0 && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Usuários que visualizaram</strong>
                </Card.Header>
                <Card.Body>
                  {userInteractions.map((ui, i) => (
                    <div
                      key={i}
                      className="employerv-user d-flex align-items-center mb-3"
                    >
                      <img
                        src={ui.user_avatar ? imageUrl(ui.user_avatar) : ph}
                        alt={ui.user_name}
                        className="rounded-circle me-3"
                        onError={handleImgError}
                        style={{
                          width: 45,
                          height: 45,
                          objectFit: "cover",
                          border: "2px solid #333",
                        }}
                      />
                      <div>
                        <div className="fw-bold text-light">{ui.user_name}</div>
                        <div className="text-white-50 small">
                          {ui.total_views} views - Última:{" "}
                          {new Date(ui.last_view).toLocaleString("pt-BR")}
                        </div>
                      </div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            )}
          </Col>

          <Col md={4}>
            {metrics && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Métricas</strong>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex flex-wrap justify-content-between text-center">
                    <div className="p-2 flex-fill">
                      <h5>{metrics.total_appointments}</h5>
                      <div className="text-white small">Atendimentos</div>
                    </div>
                    <div className="p-2 flex-fill">
                      <h5>{metrics.attended}</h5>
                      <div className="text-white small">Concluídos</div>
                    </div>
                    <div className="p-2 flex-fill">
                      <h5>{metrics.cancelled}</h5>
                      <div className="text-white small">Cancelados</div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            {interactionSummary && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Interações</strong>
                </Card.Header>
                <Card.Body>
                  <div className="text-white small mb-2">
                    Visualizações totais: {interactionSummary.total_views}
                  </div>
                  <div className="text-white small mb-2">
                    Usuários únicos: {interactionSummary.unique_users}
                  </div>
                  {interactionSummary.most_active_user && (
                    <div className="text-white small mb-2">
                      Mais ativo: {interactionSummary.most_active_user.name} (
                      {interactionSummary.most_active_user.views} views)
                    </div>
                  )}
                  {interactionSummary.last_view_user && (
                    <div className="text-white small">
                      Última visita: {interactionSummary.last_view_user.name} em{" "}
                      {new Date(
                        interactionSummary.last_view_user.last_view
                      ).toLocaleString("pt-BR")}
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="employerv-whatsapp-fab"
          aria-label={`Chamar ${nome} no WhatsApp`}
          title="Chamar no WhatsApp"
        >
          <FaWhatsapp className="employerv-whatsapp-icon" />
        </a>
      )}
    </div>
  );
}
