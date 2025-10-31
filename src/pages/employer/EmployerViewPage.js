// src/pages/employer/EmployerViewPage.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Badge,
  Table,
} from "react-bootstrap";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaUserTie,
  FaChartBar,
  FaUsers,
  FaCalendarCheck,
  FaRegCalendarAlt,
  FaEye,
  FaClock,
  FaStore,
  FaWhatsapp,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaPhone,
  FaChartPie,
  FaCheckCircle,
  FaTimesCircle,
  FaRegClock,
  FaExternalLinkAlt,
  FaIdBadge,
} from "react-icons/fa";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./EmployerViewPage.css";

export default function EmployerViewPage() {
  const { user_name } = useParams();
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [loading, setLoading] = useState(true);
  const [employer, setEmployer] = useState(null);
  const [establishment, setEstablishment] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [appointments, setAppointments] = useState([]);
  const topRef = useRef(null);

  const ph = "/images/logo.png";
  const imageUrl = useCallback((path) => {
    if (!path) return ph;
    return `${storageUrl}/${path}`;
  }, []);
  const handleImgError = useCallback((e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = ph;
  }, []);
  const fmtDate = (d) => (!d ? "—" : new Date(d).toLocaleString("pt-BR"));
  const fmtPrice = (v) =>
    `R$ ${Number(v || 0)
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const fetchEmployer = async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/employer/view/${user_name}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = res.data;
        setEmployer(data.employer);
        setEstablishment(data.establishment);
        setInteractions(data.user_interactions || []);
        setMetrics(data.metrics || {});
        setAppointments(data.appointments_recent || []);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text:
            err.response?.data?.error ||
            "Não foi possível carregar as informações do colaborador.",
        }).then(() => navigate(-1));
      } finally {
        setLoading(false);
      }
    };
    fetchEmployer();
  }, [user_name, token, navigate]);

  if (loading)
    return (
      <div className="evp-loading">
        <Spinner animation="border" variant="light" />
      </div>
    );

  if (!employer) return null;

  const user = employer.user || {};
  const avatarUrl = user.avatar ? imageUrl(user.avatar) : ph;
  const backgroundUrl = establishment?.background
    ? imageUrl(establishment.background)
    : null;
  const logoUrl = establishment?.logo ? imageUrl(establishment.logo) : ph;

  const whatsappUrl = establishment?.phone
    ? `https://wa.me/55${establishment.phone.replace(/\D/g, "")}?text=Olá, estou entrando em contato pelo perfil de ${user.first_name}`
    : null;

  return (
    <div className="evp-root" ref={topRef}>
      <NavlogComponent />

      <div
        className="evp-hero"
        style={{
          backgroundImage: backgroundUrl ? `url("${backgroundUrl}")` : "none",
        }}
      >
        <div className="evp-overlay">
          <Container>
            <Row className="align-items-center">
              <Col md={4} className="text-center mb-4 mb-md-0">
                <img
                  src={avatarUrl}
                  alt={user.first_name}
                  className="evp-avatar"
                  onError={handleImgError}
                />
              </Col>
              <Col md={8}>
                <h1 className="evp-title d-flex align-items-center">
                  <FaUserTie className="me-2 text-warning" />
                  {user.first_name} {user.last_name || ""}
                </h1>
                <p className="evp-role mb-2">
                  {employer.role || "Colaborador"} em{" "}
                  <strong>{establishment?.name}</strong>
                </p>
                {user.user_name && (
                  <p className="text-muted small">
                    <FaIdBadge className="me-2 text-info" />
                    <strong>user_name:</strong> @{user.user_name}
                  </p>
                )}

                <div className="evp-actions mt-3">
                  {whatsappUrl && (
                    <Button
                      variant="success"
                      href={whatsappUrl}
                      target="_blank"
                      className="me-2"
                    >
                      <FaWhatsapp className="me-2" />
                      Contatar via WhatsApp
                    </Button>
                  )}
                  {establishment && (
                    <Button
                      variant="dark"
                      as={Link}
                      to={`/establishment/view/${establishment.slug}`}
                    >
                      <FaStore className="me-2" />
                      Ver Estabelecimento
                    </Button>
                  )}
                </div>
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      <Container className="evp-content py-5">
        <Row className="gy-4">
          <Col md={8}>
            <Card className="evp-card glass">
              <Card.Header>
                <h4 className="m-0 d-flex align-items-center">
                  <FaInfoCircle className="me-2 text-info" />
                  Detalhes do Colaborador
                </h4>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p>
                      <FaChartBar className="me-2 text-info" />
                      <strong>Visualizações Totais:</strong>{" "}
                      {employer.views_total ?? 0}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p>
                      <FaUsers className="me-2 text-light" />
                      <strong>Usuários Únicos:</strong>{" "}
                      {employer.views_unique ?? 0}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p>
                      <FaCalendarCheck className="me-2 text-success" />
                      <strong>Total de Atendimentos:</strong>{" "}
                      {metrics.total_appointments ?? 0}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p>
                      <FaChartPie className="me-2 text-warning" />
                      <strong>Valor Total:</strong>{" "}
                      {fmtPrice(metrics.total_value ?? 0)}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p>
                      <FaCheckCircle className="me-2 text-success" />
                      <strong>Concluídos:</strong> {metrics.attended ?? 0}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p>
                      <FaTimesCircle className="me-2 text-danger" />
                      <strong>Cancelados:</strong> {metrics.cancelled ?? 0}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p>
                      <FaRegCalendarAlt className="me-2 text-primary" />
                      <strong>Cadastrado há:</strong>{" "}
                      {employer.created_since || "—"}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p>
                      <FaClock className="me-2 text-primary" />
                      <strong>Última atualização:</strong>{" "}
                      {employer.last_updated_at || "—"}
                    </p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {interactions.length > 0 && (
              <Card className="evp-card glass mt-4">
                <Card.Header>
                  <h4 className="m-0 d-flex align-items-center">
                    <FaEye className="me-2 text-warning" />
                    Interações dos Usuários
                  </h4>
                </Card.Header>
                <Card.Body>
                  <Table striped hover responsive variant="dark" size="sm">
                    <thead>
                      <tr>
                        <th>Usuário</th>
                        <th>Visualizações</th>
                        <th>Primeiro Acesso</th>
                        <th>Último Acesso</th>
                        <th>IP</th>
                        <th>Navegador</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interactions.map((i, idx) => (
                        <tr key={idx}>
                          <td className="d-flex align-items-center">
                            <img
                              src={i.user_avatar ? imageUrl(i.user_avatar) : ph}
                              alt={i.user_name}
                              className="rounded-circle me-2"
                              style={{
                                width: 26,
                                height: 26,
                                objectFit: "cover",
                              }}
                              onError={handleImgError}
                            />
                            {i.user_name || "Visitante"}
                          </td>
                          <td>{i.total_views}</td>
                          <td>{fmtDate(i.first_view)}</td>
                          <td>{fmtDate(i.last_view)}</td>
                          <td>{i.ip || "—"}</td>
                          <td
                            className="text-truncate"
                            title={i.user_agent || ""}
                          >
                            {i.user_agent
                              ? i.user_agent.slice(0, 45) + "..."
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}
          </Col>

          <Col md={4}>
            {establishment && (
              <Card className="evp-card glass">
                <Card.Header>
                  <h4 className="m-0 d-flex align-items-center">
                    <FaStore className="me-2" />
                    Estabelecimento
                  </h4>
                </Card.Header>
                <Card.Body className="text-center">
                  <img
                    src={logoUrl}
                    alt={establishment.name}
                    className="rounded-circle mb-3"
                    style={{ width: 80, height: 80, objectFit: "cover" }}
                    onError={handleImgError}
                  />
                  <h5 className="fw-bold">{establishment.name}</h5>
                  <p className="small text-muted">
                    <FaMapMarkerAlt className="me-2" />
                    {establishment.address}
                  </p>
                  <p className="small text-muted">
                    <FaPhone className="me-2" />
                    {establishment.phone}
                  </p>
                  {whatsappUrl && (
                    <Button
                      href={whatsappUrl}
                      target="_blank"
                      variant="success"
                      className="mt-2"
                    >
                      <FaWhatsapp className="me-2" />
                      WhatsApp
                    </Button>
                  )}
                </Card.Body>
              </Card>
            )}

            {appointments.length > 0 && (
              <Card className="evp-card glass mt-4">
                <Card.Header>
                  <h4 className="m-0 d-flex align-items-center">
                    <FaRegClock className="me-2" />
                    Últimos Atendimentos
                  </h4>
                </Card.Header>
                <Card.Body>
                  {appointments.map((a) => (
                    <div key={a.id} className="mb-3 border-bottom pb-2">
                      <div className="fw-bold">{a.customer_name}</div>
                      <div className="small text-muted">
                        {fmtDate(a.order_datetime)}
                      </div>
                      <div className="small">
                        <Badge
                          bg={
                            a.appointment_status === "pending"
                              ? "secondary"
                              : a.appointment_status === "attended"
                              ? "success"
                              : "danger"
                          }
                        >
                          {a.appointment_status}
                        </Badge>{" "}
                        {fmtPrice(a.total_price)}
                      </div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}
