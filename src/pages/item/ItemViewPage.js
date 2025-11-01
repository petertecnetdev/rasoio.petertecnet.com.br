// src/pages/item/ItemViewPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaWhatsapp, FaMapMarkedAlt, FaInstagram, FaStore } from "react-icons/fa";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./ItemView.css";

export default function ItemViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [establishment, setEstablishment] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [relatedItems, setRelatedItems] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [interactionSummary, setInteractionSummary] = useState(null);
  const [nextSlots, setNextSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const ph = "/images/logo.png";

  // Sempre rola para o topo quando o slug muda
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  const fmtPrice = useCallback(
    (v) =>
      `R$ ${Number(v || 0)
        .toFixed(2)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`,
    []
  );

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
        const res = await axios.get(`${apiBaseUrl}/item/view/${slug}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!active) return;

        setItem(res.data?.item || null);
        setEstablishment(res.data?.establishment || null);
        setEmployers(res.data?.employers || []);
        setRelatedItems(res.data?.related_items || []);
        setMetrics(res.data?.metrics || null);
        setNextSlots(res.data?.next_slots || []);
        setInteractionSummary(res.data?.interactions?.summary || null);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text:
            err.response?.status === 404
              ? "Item não encontrado."
              : "Não foi possível carregar os dados do item.",
        }).then(() => navigate("/404"));
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, navigate, token]);

  const whatsappLink = useMemo(() => {
    const raw = String(establishment?.phone || "").replace(/\D/g, "");
    if (!raw) return null;
    const withCc = raw.startsWith("55") ? raw : `55${raw}`;
    return `https://wa.me/${withCc}`;
  }, [establishment]);

  if (isLoading) {
    return (
      <div className="itemv-root">
        <NavlogComponent />
      </div>
    );
  }

  if (!item || !establishment) return null;

  return (
    <div className="itemv-root">
      <NavlogComponent />

      {/* HERO */}
      <div
        className="itemv-hero"
        style={{
          backgroundImage: `url("${imageUrl(item.image)}")`,
        }}
      >
        <div className="itemv-hero-overlay" />
        <Container fluid className="itemv-hero-content">
          <div className="itemv-hero-left">
            <img
              src={imageUrl(establishment.logo)}
              alt={establishment.name}
              className="itemv-logo"
              onError={handleImgError}
            />
          </div>
          <div className="itemv-hero-right">
            <h1 className="itemv-title">{item.name}</h1>
            <div className="itemv-category">
              {item.category && <Badge bg="primary">{item.category}</Badge>}
              {"  "}
              {item.type && <Badge bg="secondary">{item.type}</Badge>}
            </div>
            <div className="itemv-price mt-2">{fmtPrice(item.price)}</div>
            {item.description && (
              <div className="itemv-desc mt-3">{item.description}</div>
            )}<div className="item-actions">
  {whatsappLink && (
    <Button as="a" href={whatsappLink} size="sm" className="btn-action">
      WhatsApp
    </Button>
  )}

  {establishment.instagram_url && (
    <Button as="a" href={establishment.instagram_url} size="sm" className="btn-action">
      Instagram
    </Button>
  )}

  {establishment.location && (
    <Button as="a" href={establishment.location} size="sm" className="btn-action">
      Como chegar
    </Button>
  )}

  <Button
    onClick={() => navigate(`/establishment/${establishment.slug}/schedule`)}
    size="sm"
    className="btn-action"
  >
    Agendar
  </Button>

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
        {establishment.address && <div className="estv-mini-address">{establishment.address}</div>}
      </div>
    </Button>
  )}
</div>


                        
          </div>
        </Container>
      </div>

      {/* MAIN */}
      <Container fluid className="itemv-main">
        <Row className="gx-3 gy-4">
          <Col md={8}>
            {employers.length > 0 && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Profissionais Disponíveis</strong>
                </Card.Header>
                <Card.Body>
                  {employers.map((emp, idx) => {
                    const user = emp.user || {};
                    const nome = `${user.first_name || ""} ${user.last_name || ""}`.trim();
                    const avatar = user.avatar ? imageUrl(user.avatar) : ph;
                    return (
                      <div
                        key={idx}
                        className="itemv-collab d-flex align-items-center mb-2 clickable"
                        onClick={() =>
                          user.user_name &&
                          navigate(`/employer/view/${user.user_name}`)
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

            {relatedItems.length > 0 && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Outros Itens</strong>
                </Card.Header>
                <Card.Body>
                  <Row className="gx-3 gy-3">
                    {relatedItems.map((r) => (
                      <Col key={r.id} lg={4} md={6} sm={6} xs={12}>
                        <Card
                          className="itemv-card h-100 clickable"
                          bg="black"
                          text="light"
                          onClick={() => navigate(`/item/view/${r.slug || ""}`)}
                        >
                          {r.image && (
                            <div className="itemv-media-wrap">
                              <img
                                src={imageUrl(r.image)}
                                alt={r.name}
                                className="itemv-media"
                                onError={handleImgError}
                              />
                            </div>
                          )}
                          <Card.Body className="p-3">
                            <div className="itemv-item-name">{r.name}</div>
                            <div className="itemv-item-price">
                              {fmtPrice(r.price)}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
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
                      <h5>{metrics.total_views}</h5>
                      <div className="text-white small">Visualizações</div>
                    </div>
                    <div className="p-2 flex-fill">
                      <h5>{metrics.unique_users}</h5>
                      <div className="text-white small">Usuários únicos</div>
                    </div>
                    <div className="p-2 flex-fill">
                      <h5>{metrics.appointments}</h5>
                      <div className="text-white small">Agendamentos</div>
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

            {nextSlots.length > 0 && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Próximos horários disponíveis</strong>
                </Card.Header>
                <Card.Body>
                  {nextSlots.slice(0, 5).map((slot, i) => (
                    <div key={i} className="text-white small mb-1">
                      {new Date(slot).toLocaleString("pt-BR")}
                    </div>
                  ))}
                </Card.Body>
              </Card>
            )}

            <Card bg="dark" text="light" className="mb-4">
              <Card.Header>
                <strong>Informações adicionais</strong>
              </Card.Header>
              <Card.Body>
                {item.created_since && (
                  <div className="text-white small mb-1">
                    Criado há {item.created_since}
                  </div>
                )}
                {item.last_updated_at && (
                  <div className="text-white small mb-1">
                    Última atualização: {item.last_updated_at}
                  </div>
                )}
                {item.creator_name && (
                  <div className="text-white small mb-1">
                    Criado por: {item.creator_name}
                  </div>
                )}
                {item.updater_name && (
                  <div className="text-white small mb-1">
                    Atualizado por: {item.updater_name}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="itemv-whatsapp-fab"
          aria-label={`Chamar ${establishment.name} no WhatsApp`}
          title="Chamar no WhatsApp"
        >
          <FaWhatsapp className="itemv-whatsapp-icon" />
        </a>
      )}
    </div>
  );
}
