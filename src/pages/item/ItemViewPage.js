// src/pages/item/ItemViewPage.jsx
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
  Modal,
  Form,
  Table,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaInfoCircle,
  FaClock,
  FaChartBar,
  FaUsers,
  FaCalendarCheck,
  FaTag,
  FaRegCalendarAlt,
  FaEye,
  FaUserClock,
  FaListAlt,
  FaCut,
  FaBoxOpen,
  FaWhatsapp,
  FaStore,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
  FaHeart,
  FaRegHeart,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaCamera,
  FaImage,
  FaCheck,
  FaChartLine,
  FaShoppingCart,
  FaTools,
  FaCubes,
  FaUserTie,
  FaClipboardList,
  FaGift,
  FaTrophy,
  FaChartPie,
  FaBullseye,
  FaBullhorn,
  FaQuoteLeft,
  FaRegSmile,
  FaRegThumbsUp,
  FaLink,
} from "react-icons/fa";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./ItemViewPage.css";

export default function ItemViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  /* ===============================
     STATES
  =============================== */
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [establishment, setEstablishment] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [related, setRelated] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState("");
  const topRef = useRef(null);

  /* ===============================
     HELPERS
  =============================== */
  const ph = "/images/logo.png";
  const imageUrl = useCallback((path) => {
    if (!path) return ph;
    return `${storageUrl}/${path}`;
  }, []);
  const handleImgError = useCallback((e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = ph;
  }, []);
  const fmtPrice = (v) =>
    `R$ ${Number(v || 0)
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("pt-BR");
  };

  /* ===============================
     FETCH ITEM
  =============================== */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const fetchItem = async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/item/view/${slug}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = res.data;
        setItem(data.item);
        setEstablishment(data.establishment);
        setEmployers(data.employers || []);
        setRelated(data.related_items || []);
        setInteractions(data.user_interactions || []);
        setMetrics({
          total_views: data.item?.views_total ?? 0,
          unique_users: data.item?.views_unique ?? 0,
          appointments: data.item?.appointments ?? 0,
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text:
            err.response?.data?.error ||
            "Não foi possível carregar as informações do item.",
        }).then(() => navigate(-1));
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [slug, token, navigate]);

  /* ===============================
     SCHEDULE HANDLER
  =============================== */
  const handleSchedule = () => {
    if (!selectedEmployer) {
      Swal.fire({
        icon: "warning",
        title: "Selecione o profissional",
        text: "Escolha um colaborador antes de agendar.",
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Agendamento iniciado",
      text: `Profissional escolhido: ${selectedEmployer}. Continue para confirmar o agendamento.`,
    });
    setShowModal(false);
  };

  if (loading)
    return (
      <div className="ivp-loading">
        <Spinner animation="border" variant="light" />
      </div>
    );

  if (!item) return null;

  /* ===============================
     TYPE & IMAGE HANDLING
  =============================== */
  const isService =
    String(item.type || "").toLowerCase().includes("serv") ||
    String(item.type || "").toLowerCase() === "serviço";

  const mainImage =
    item.image && item.image !== "null"
      ? imageUrl(item.image)
      : establishment?.logo
      ? imageUrl(establishment.logo)
      : ph;

  /* ===============================
     RENDER PAGE
  =============================== */
  return (
    <div className="ivp-root" ref={topRef}>
      <NavlogComponent />

      {/* ===============================
          HERO SECTION
      =============================== */}
      <div
        className="ivp-hero"
        style={{
          backgroundImage: `url("${imageUrl(establishment?.background)}")`,
        }}
      >
        <div className="ivp-overlay">
          <Container>
            <Row className="align-items-center">
              <Col md={4} className="text-center mb-4 mb-md-0">
                {mainImage && (
                  <img
                    src={mainImage}
                    alt={item.name}
                    className="ivp-item-image"
                    onError={handleImgError}
                  />
                )}
              </Col>
              <Col md={8}>
                <h1 className="ivp-title d-flex align-items-center">
                  {isService ? (
                    <FaCut className="me-2 text-warning" />
                  ) : (
                    <FaBoxOpen className="me-2 text-info" />
                  )}
                  {item.name}
                </h1>
                {item.description && (
                  <p className="ivp-description">{item.description}</p>
                )}
                <div className="ivp-meta">
                  {item.category && (
                    <Badge bg="secondary" className="me-2">
                      {item.category}
                    </Badge>
                  )}
                  <Badge bg={item.is_available ? "success" : "danger"}>
                    {item.is_available ? "Disponível" : "Indisponível"}
                  </Badge>
                </div>
                <h2 className="ivp-price mt-3">{fmtPrice(item.price)}</h2>

                <div className="ivp-actions mt-3">
                  {establishment?.whatsapp_url && (
                    <Button
                      variant="success"
                      href={establishment.whatsapp_url}
                      target="_blank"
                      className="me-2"
                    >
                      <FaWhatsapp className="me-2" />
                      Contatar via WhatsApp
                    </Button>
                  )}
                  {isService && employers.length > 0 && (
                    <Button
                      variant="primary"
                      onClick={() => setShowModal(true)}
                      className="me-2"
                    >
                      <FaCalendarCheck className="me-2" />
                      Agendar Atendimento
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

      {/* ===============================
          DETALHES DO ITEM
      =============================== */}
      <Container className="ivp-content py-5">
        <Row className="gy-4">
          {/* COLUNA PRINCIPAL */}
          <Col md={8}>
            <Card className="ivp-card glass">
              <Card.Header>
                <h4 className="m-0 d-flex align-items-center">
                  <FaInfoCircle className="me-2 text-info" />
                  Detalhes do {isService ? "Serviço" : "Produto"}
                </h4>
              </Card.Header>
              <Card.Body>
                <Row>
                  {isService && (
                    <Col md={6}>
                      <p>
                        <FaClock className="me-2 text-warning" />
                        <strong>Duração:</strong> {item.duration} min
                      </p>
                    </Col>
                  )}
                  <Col md={6}>
                    <p>
                      <FaChartBar className="me-2 text-info" />
                      <strong>Visualizações Totais:</strong>{" "}
                      {metrics.total_views ?? 0}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p>
                      <FaUsers className="me-2 text-light" />
                      <strong>Usuários Únicos:</strong>{" "}
                      {metrics.unique_users ?? 0}
                    </p>
                  </Col>
                  {isService && (
                    <Col md={6}>
                      <p>
                        <FaCalendarCheck className="me-2 text-success" />
                        <strong>Atendimentos Realizados:</strong>{" "}
                        {metrics.appointments ?? 0}
                      </p>
                    </Col>
                  )}
                  <Col md={6}>
                    <p>
                      <FaTag className="me-2 text-secondary" />
                      <strong>Categoria:</strong>{" "}
                      {item.category || "Não definida"}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p>
                      <FaRegCalendarAlt className="me-2 text-primary" />
                      <strong>Cadastrado há:</strong>{" "}
                      {item.created_since || "—"}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p>
                      <FaRegCalendarAlt className="me-2 text-primary" />
                      <strong>Última atualização:</strong>{" "}
                      {item.last_updated_at || "—"}
                    </p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* INTERAÇÕES */}
            {interactions.length > 0 && (
              <Card className="ivp-card glass mt-4">
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
                              src={
                                i.user_avatar
                                  ? imageUrl(i.user_avatar)
                                  : ph
                              }
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
                          <td className="text-truncate" title={i.user_agent}>
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

          {/* COLUNA LATERAL */}
          <Col md={4}>
            {/* PROFISSIONAIS */}
           {/* PROFISSIONAIS */}
{isService && employers.length > 0 && (
  <Card className="ivp-card glass">
    <Card.Header>
      <h4 className="m-0 d-flex align-items-center">
        <FaUserClock className="me-2" />
        Profissionais Associados
      </h4>
    </Card.Header>
    <Card.Body>
      {employers.map((emp) => {
        const user = emp.user || {};
        const nome = `${user.first_name || ""} ${user.last_name || ""}`.trim();
        const avatarUrl = user.avatar ? imageUrl(user.avatar) : ph;

        return (
          <Link
            key={emp.id}
            to={`/employer/view/${user.user_name}`}
            className="ivp-employer d-flex align-items-center mb-3 text-decoration-none text-light"
          >
            <div className="ivp-avatar me-3">
              <img
                src={avatarUrl}
                alt={nome}
                onError={handleImgError}
                className="rounded-circle"
                style={{
                  width: 50,
                  height: 50,
                  objectFit: "cover",
                  border: "2px solid #333",
                }}
              />
            </div>
            <div>
              <div className="ivp-name fw-bold">{nome}</div>
              <div className="text-muted small">{emp.role}</div>
            </div>
            <FaExternalLinkAlt className="ms-auto text-secondary" />
          </Link>
        );
      })}
    </Card.Body>
  </Card>
)}

          </Col>
        </Row>

        {/* ===============================
            ITENS RELACIONADOS
        =============================== */}
        {related.length > 0 && (
          <div className="ivp-related mt-5">
            <h3 className="mb-4 d-flex align-items-center">
              <FaListAlt className="me-2 text-info" />
              Itens Relacionados
            </h3>
            <Row>
              {related.map((r) => (
                <Col md={4} lg={3} key={r.id} className="mb-4">
                  <Card
                    className="ivp-card-related h-100 clickable"
                    onClick={() => {
                      navigate(`/item/view/${r.slug}`);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    {r.image && (
                      <div className="ivp-related-img-wrap">
                        <img
                          src={imageUrl(r.image)}
                          alt={r.name}
                          className="ivp-related-img"
                          onError={handleImgError}
                        />
                      </div>
                    )}
                    <Card.Body>
                      <Card.Title className="fw-bold">{r.name}</Card.Title>
                      {r.description && (
                        <Card.Text className="text-muted small mb-2">
                          {r.description.slice(0, 60)}...
                        </Card.Text>
                      )}
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-semibold text-light">
                          {fmtPrice(r.price)}
                        </span>
                        <OverlayTrigger
                          overlay={<Tooltip>Ver detalhes</Tooltip>}
                        >
                          <Button
                            variant="outline-light"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/item/view/${r.slug}`);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            <FaExternalLinkAlt size={13} />
                          </Button>
                        </OverlayTrigger>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Container>

      {/* ===============================
          MODAL DE AGENDAMENTO
      =============================== */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Agendar Atendimento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Selecione o Profissional</Form.Label>
              <Form.Select
                value={selectedEmployer}
                onChange={(e) => setSelectedEmployer(e.target.value)}
              >
                <option value="">Selecione...</option>
                {employers.map((emp) => (
                  <option key={emp.id} value={emp.user?.first_name}>
                    {emp.user?.first_name} {emp.user?.last_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSchedule}>
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
