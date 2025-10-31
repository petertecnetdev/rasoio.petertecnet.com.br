// src/pages/establishment/EstablishmentViewPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaWhatsapp, FaMapMarkedAlt, FaInstagram } from "react-icons/fa";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./EstablishmentView.css";

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [interactionSummary, setInteractionSummary] = useState(null);
  const [otherEstablishments, setOtherEstablishments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const ph = "/images/logo.png";

  const fmtPrice = useCallback(
    (v) =>
      `R$ ${Number(v || 0)
        .toFixed(2)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`,
    []
  );

  const parseSegments = useCallback((seg) => {
    if (!seg) return [];
    if (Array.isArray(seg)) return seg;
    try {
      const parsed = JSON.parse(seg);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return String(seg)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, []);

  const handleImgError = useCallback((e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = ph;
  }, []);

  const imageUrl = useCallback((path) => {
    if (!path) return ph;
    return `${storageUrl}/${path}`;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/establishment/view/${slug}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!active) return;

        const est = res.data?.establishment || null;
        const its = Array.isArray(res.data?.items) ? res.data.items : [];
        const cols = Array.isArray(res.data?.collaborators)
          ? res.data.collaborators
          : [];

        setEstablishment(est);
        setItems(its);
        setEmployers(cols);
        setMetrics(res.data?.metrics || null);
        setInteractionSummary(res.data?.interaction_summary || null);
        setOtherEstablishments(res.data?.other_establishments || []);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text:
            err.response?.status === 404
              ? "Estabelecimento não encontrado."
              : "Não foi possível carregar os dados do estabelecimento.",
        }).then(() => navigate("/404"));
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, navigate, token]);

  const segs = useMemo(
    () => parseSegments(establishment?.segments),
    [establishment, parseSegments]
  );

  const services = useMemo(
    () =>
      items.filter(
        (i) =>
          String(i.status) === "1" &&
          (String(i.type).toLowerCase().includes("serv") ||
            String(i.type).toLowerCase() === "serviço")
      ),
    [items]
  );

  const products = useMemo(
    () =>
      items.filter(
        (i) =>
          String(i.status) === "1" &&
          !(String(i.type).toLowerCase().includes("serv") ||
            String(i.type).toLowerCase() === "serviço")
      ),
    [items]
  );

  const whatsappLink = useMemo(() => {
    const raw = String(establishment?.phone || "").replace(/\D/g, "");
    if (!raw) return null;
    const withCc = raw.startsWith("55") ? raw : `55${raw}`;
    return `https://wa.me/${withCc}`;
  }, [establishment]);

  if (isLoading) {
    return (
      <div className="estv-root">
        <NavlogComponent />
      </div>
    );
  }

  if (!establishment) return null;

  return (
    <div className="estv-root">
      <NavlogComponent />

      {/* HERO */}
      <div
        className="estv-hero"
        style={{
          backgroundImage: `url("${imageUrl(establishment.background)}")`,
        }}
      >
        <div className="estv-hero-overlay" />
        <Container fluid className="estv-hero-content">
          <div className="estv-hero-left">
            <img
              src={imageUrl(establishment.logo)}
              alt={establishment.name}
              className="estv-logo"
              onError={handleImgError}
            />
          </div>
          <div className="estv-hero-right">
            <h1 className="estv-title">{establishment.name}</h1>
            <div className="estv-slug">@{establishment.slug}</div>
            <div className="estv-desc">{establishment.description || ""}</div>

            <div className="estv-actions">
              {whatsappLink && (
                <Button
                  as="a"
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  size="sm"
                  className="bg-black me-2"
                >
                  <FaWhatsapp /> WhatsApp
                </Button>
              )}
              {establishment.instagram_url && (
                <Button
                  as="a"
                  href={establishment.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  size="sm"
                  className="bg-black me-2"
                >
                  <FaInstagram /> Instagram
                </Button>
              )}
              {establishment.location && (
                <Button
                  as="a"
                  href={establishment.location}
                  target="_blank"
                  rel="noreferrer"
                  size="sm"
                  className="bg-black me-2"
                >
                  <FaMapMarkedAlt /> Como chegar
                </Button>
              )}
              <Button
                onClick={() =>
                  navigate(`/establishment/${establishment.slug}/schedule`)
                }
                size="sm"
                className="bg-black"
              >
                Agendar
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* MAIN */}
      <Container fluid className="estv-main">
        <Row className="gx-3 gy-4">
          <Col md={8}>
            {/* SERVIÇOS */}
            {services.length > 0 && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Serviços</strong>
                </Card.Header>
                <Card.Body>
                  <Row className="gx-3 gy-3">
                    {services.map((sv) => (
                      <Col key={sv.id} lg={4} md={6} sm={6} xs={12}>
                        <Card
                          className="estv-card h-100 clickable"
                          bg="black"
                          text="light"
                          onClick={() =>
                            navigate(`/item/view/${sv.slug || ""}`)
                          }
                        >
                          {sv.image && (
                            <div className="estv-media-wrap">
                              <img
                                src={imageUrl(sv.image)}
                                alt={sv.name}
                                className="estv-media"
                                onError={handleImgError}
                              />
                            </div>
                          )}
                          <Card.Body className="p-3">
                            <div className="estv-item-name">{sv.name}</div>
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="estv-item-price">
                                {fmtPrice(sv.price)}
                              </div>
                              {sv.duration && (
                                <Badge bg="warning" text="dark">
                                  {sv.duration} min
                                </Badge>
                              )}
                            </div>
                            {sv.description && (
                              <div className="estv-item-desc mt-2 text-truncate">
                                {sv.description}
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* PRODUTOS */}
            {products.length > 0 && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Produtos</strong>
                </Card.Header>
                <Card.Body>
                  <Row className="gx-3 gy-3">
                    {products.map((pd) => (
                      <Col key={pd.id} lg={4} md={6} sm={6} xs={12}>
                        <Card
                          className="estv-card h-100 clickable"
                          bg="black"
                          text="light"
                          onClick={() =>
                            navigate(`/item/view/${pd.slug || ""}`)
                          }
                        >
                          {pd.image && (
                            <div className="estv-media-wrap">
                              <img
                                src={imageUrl(pd.image)}
                                alt={pd.name}
                                className="estv-media"
                                onError={handleImgError}
                              />
                            </div>
                          )}
                          <Card.Body className="p-3">
                            <div className="estv-item-name">{pd.name}</div>
                            <div className="estv-item-price">
                              {fmtPrice(pd.price)}
                            </div>
                            {pd.description && (
                              <div className="estv-item-desc mt-2 text-truncate">
                                {pd.description}
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* OUTROS ESTABELECIMENTOS */}
            {otherEstablishments?.length > 0 && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Outros Estabelecimentos</strong>
                </Card.Header>
                <Card.Body>
                  <Row className="gx-3 gy-3">
                    {otherEstablishments.map((o) => (
                      <Col key={o.id} lg={6} md={12}>
                        <Card
                          className="estv-other clickable"
                          bg="black"
                          text="light"
                          onClick={() => navigate(`/establishment/${o.slug}`)}
                        >
                          <div className="d-flex align-items-center p-2">
                            <img
                              src={o.logo ? `${storageUrl}/${o.logo}` : ph}
                              alt={o.name}
                              className="rounded-circle me-3"
                              style={{
                                width: 50,
                                height: 50,
                                objectFit: "cover",
                              }}
                              onError={handleImgError}
                            />
                            <div>
                              <div className="fw-bold">{o.name}</div>
                              <div className="text-muted small">{o.city}</div>
                            </div>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Col>

          {/* LATERAL */}
          <Col md={4}>
            {/* INFORMAÇÕES */}
            <Card bg="dark" text="light" className="mb-4">
              <Card.Header>
                <strong>Informações</strong>
              </Card.Header>
              <Card.Body>
                {establishment.phone && (
                  <div className="estv-info-line">📞 {establishment.phone}</div>
                )}
                {establishment.email && (
                  <div className="estv-info-line">✉️ {establishment.email}</div>
                )}
                {establishment.address && (
                  <div className="estv-info-line">
                    📍 {establishment.address}
                  </div>
                )}
                {establishment.city && (
                  <div className="estv-info-line">🏙️ {establishment.city}</div>
                )}
              </Card.Body>
            </Card>

            {/* MÉTRICAS */}
            {metrics && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Desempenho</strong>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex flex-wrap justify-content-between text-center">
                    <div className="p-2 flex-fill">
                      <h5>{metrics.total_views}</h5>
                      <div className="text-white small">Visualizações</div>
                    </div>
                    <div className="p-2 flex-fill">
                      <h5>{metrics.unique_users}</h5>
                      <div className="text-white small">Usuários únicos</div>
                    </div>
                    <div className="p-2 flex-fill">
                      <h5>{metrics.total_items}</h5>
                      <div className="text-white small">Itens totais</div>
                    </div>
                    <div className="p-2 flex-fill">
                      <h5>{metrics.total_services}</h5>
                      <div className="text-white small">Serviços</div>
                    </div>
                    <div className="p-2 flex-fill">
                      <h5>{metrics.total_products}</h5>
                      <div className="text-white small">Produtos</div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* INTERAÇÕES */}
            {interactionSummary && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Interações Recentes</strong>
                </Card.Header>
                <Card.Body>
                  {interactionSummary.most_active_user ? (
                    <>
                      <div className="mb-2">
                        <strong>Mais ativo:</strong>{" "}
                        {interactionSummary.most_active_user.name} (
                        {interactionSummary.most_active_user.views} views)
                      </div>
                      <div className="mb-2">
                        <strong>Último visitante:</strong>{" "}
                        {interactionSummary.last_view_user?.name}
                      </div>
                      <div className="text-white small">
                        Última visita:{" "}
                        {interactionSummary.last_view_user?.last_view
                          ? new Date(
                              interactionSummary.last_view_user.last_view
                            ).toLocaleString("pt-BR")
                          : "—"}
                      </div>
                    </>
                  ) : (
                    <div className="text-muted small">
                      Sem interações registradas ainda.
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* EQUIPE */}
            {employers.length > 0 && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Equipe</strong>
                </Card.Header>
                <Card.Body>
                  {employers.map((emp, idx) => {
                    const user = emp.user || {};
                    const nome = `${user.first_name || ""} ${
                      user.last_name || ""
                    }`.trim();
                    const avatar = user.avatar ? imageUrl(user.avatar) : ph;
                    const slugUser = user.user_name;

                    return (
                      <div
                        key={idx}
                        className="estv-collab d-flex align-items-center mb-2 clickable"
                        onClick={() =>
                          slugUser &&
                          navigate(`/employer/view/${slugUser || ""}`)
                        }
                      >
                        <img
                          src={avatar}
                          alt={nome}
                          className="rounded-circle me-3"
                          onError={handleImgError}
                          style={{
                            width: 50,
                            height: 50,
                            objectFit: "cover",
                            border: "2px solid #333",
                          }}
                        />
                        <div>
                          <div className="fw-bold text-light">{nome}</div>
                          {emp.role && (
                            <div className="text-white small">{emp.role}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </Card.Body>
              </Card>
            )}

            {/* LOCALIZAÇÃO */}
            {establishment.location && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Localização</strong>
                </Card.Header>
                <Card.Body>
                  {establishment.location.includes("<iframe") ? (
                    (() => {
                      const fixedIframe = establishment.location
                        .replace(/width="[^"]*"/g, 'width="100%"')
                        .replace(/height="[^"]*"/g, 'height="300"')
                        .replace(
                          /style="[^"]*"/g,
                          'style="border:0; width:100%; height:300px; border-radius:12px;"'
                        );

                      return (
                        <div
                          className="estv-map-wrap"
                          dangerouslySetInnerHTML={{ __html: fixedIframe }}
                        />
                      );
                    })()
                  ) : establishment.location.includes("embed") ? (
                    <div className="estv-map-wrap">
                      <iframe
                        title="Mapa"
                        src={establishment.location}
                        className="estv-map-frame"
                        allowFullScreen
                        loading="lazy"
                        style={{
                          border: "0",
                          width: "100%",
                          height: "300px",
                          borderRadius: "12px",
                        }}
                      ></iframe>
                    </div>
                  ) : (
                    <Button
                      as="a"
                      href={establishment.location}
                      target="_blank"
                      rel="noreferrer"
                      size="sm"
                      className="bg-black"
                    >
                      Ver localização no mapa
                    </Button>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* INFORMAÇÕES ADICIONAIS */}
            <Card bg="dark" text="light" className="mb-4">
              <Card.Header>
                <strong>Informações adicionais</strong>
              </Card.Header>
              <Card.Body>
                {establishment.created_since && (
                  <div className="text-whtie small mb-1">
                    Criado há {establishment.created_since}
                  </div>
                )}
                {establishment.last_updated_at && (
                  <div className="text-whtie small mb-1">
                    Última atualização: {establishment.last_updated_at}
                  </div>
                )}
                {establishment.creator && (
                  <div className="text-whtie small mb-1">
                    Criado por: {establishment.creator.first_name}{" "}
                    {establishment.creator.last_name}
                  </div>
                )}
                {establishment.updater && (
                  <div className="text-whtie small mb-1">
                    Atualizado por: {establishment.updater.first_name}{" "}
                    {establishment.updater.last_name}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* SEGMENTOS */}
            {segs.length > 0 && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Segmentos</strong>
                </Card.Header>
                <Card.Body>
                  {segs.map((s) => (
                    <Badge
                      bg="primary"
                      key={s}
                      className="me-2 text-white mb-2"
                    >
                      {s}
                    </Badge>
                  ))}
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* WHATSAPP FLOATING BUTTON */}
      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="estv-whatsapp-fab"
          aria-label={`Chamar ${establishment.name} no WhatsApp`}
          title="Chamar no WhatsApp"
        >
          <FaWhatsapp className="estv-whatsapp-icon" />
        </a>
      )}
    </div>
  );
}
