// src/pages/establishment/EstablishmentViewPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Container, Row, Col, Card, Button, Spinner, Badge } from "react-bootstrap";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaWhatsapp } from "react-icons/fa";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./EstablishmentView.css";

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const fmtPrice = useCallback((v) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`, []);
  const ph = "/images/logo.png";

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

  const todayKey = useMemo(
    () =>
      new Date().toLocaleDateString("en-CA", {
        timeZone: "America/Sao_Paulo",
      }),
    []
  );

  const handleImgError = useCallback((e) => {
    // eslint-disable-next-line no-param-reassign
    e.currentTarget.onerror = null;
    // eslint-disable-next-line no-param-reassign
    e.currentTarget.src = ph;
  }, []);

  const imageUrl = useCallback(
    (path) => {
      if (!path) return ph;
      return `${storageUrl}/${path}`;
    },
    [storageUrl]
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/establishment/view/${slug}`);
        const est = res.data?.establishment || null;
        const its = Array.isArray(res.data?.items) ? res.data.items : [];
        const cols = Array.isArray(res.data?.collaborators) ? res.data.collaborators : [];
        if (!est) {
          navigate("/404");
          return;
        }
        if (String(est.category || "").toLowerCase() !== "barbershop") {
          navigate("/404");
          return;
        }
        if (!isMounted) return;
        setEstablishment(est);
        setItems(its);
        setBarbers(cols);
      } catch (err) {
        const status = err.response?.status;
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: status === 404 ? "Barbearia não encontrada." : "Não foi possível carregar.",
        }).then(() => navigate("/404"));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [slug, navigate]);

  useEffect(() => {
    if (!token || !establishment?.id) return;
    let isMounted = true;
    (async () => {
      try {
        const { data: res } = await axios.get(`${apiBaseUrl}/order/listbyentity`, {
          params: { app_id: 3, entity_name: "establishment", entity_id: establishment.id },
          headers: { Authorization: `Bearer ${token}` },
        });
        const rawOrders = Array.isArray(res.orders) ? res.orders : [];
        const dayOrders = rawOrders.filter((o) => {
          const d = new Date(o.order_datetime).toLocaleDateString("en-CA", {
            timeZone: "America/Sao_Paulo",
          });
          return d === todayKey;
        });
        const totalOrders = dayOrders.length;
        const totalValue = dayOrders.reduce((sum, o) => {
          const orderSum = (o.items || []).reduce((s, it) => {
            let sub = Number(it.subtotal || 0);
            (it.modifiers || [])
              .filter((m) => m.type === "addition")
              .forEach((m) => {
                const prod = (it.modifiers || []).find((p) => p.id === m.modifier_id);
                sub += (prod ? Number(prod.price) : 0) * (m.quantity || 1);
              });
            return s + sub;
          }, 0);
          return sum + orderSum;
        }, 0);
        const itemCounts = {};
        dayOrders.forEach((o) =>
          (o.items || []).forEach((it) => {
            const nm = it.item?.name || "-";
            itemCounts[nm] = (itemCounts[nm] || 0) + (it.quantity || 0);
          })
        );
        const mostOrderedItem =
          Object.entries(itemCounts).reduce(
            (max, [name, qty]) => (qty > max[1] ? [name, qty] : max),
            ["-", 0]
          )[0] || "-";
        const customerSums = {};
        dayOrders.forEach((o) => {
          const sum = (o.items || []).reduce((s, it) => {
            let sub = Number(it.subtotal || 0);
            (it.modifiers || [])
              .filter((m) => m.type === "addition")
              .forEach((m) => {
                const prod = (it.modifiers || []).find((p) => p.id === m.modifier_id);
                sub += (prod ? Number(prod.price) : 0) * (m.quantity || 1);
              });
            return s + sub;
          }, 0);
          const cname = o.customer_name || "-";
          customerSums[cname] = (customerSums[cname] || 0) + sum;
        });
        const topCustomer =
          Object.entries(customerSums).reduce(
            (max, [name, sum]) => (sum > max[1] ? [name, sum] : max),
            ["-", 0]
          )[0] || "-";
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const now = new Date();
        const hoursElapsed = Math.max((now - start) / 36e5, 1);
        const avgOrdersPerHour = (totalOrders / hoursElapsed).toFixed(2);
        const avgTicket = totalOrders ? (totalValue / totalOrders).toFixed(2) : "0.00";
        if (isMounted) {
          setMetrics({
            totalOrders,
            totalValue: totalValue.toFixed(2),
            mostOrderedItem,
            topCustomer,
            avgOrdersPerHour,
            avgTicket,
          });
        }
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, [token, establishment, todayKey]);

  const segs = useMemo(() => parseSegments(establishment?.segments), [establishment, parseSegments]);

  const services = useMemo(
    () => items.filter((i) => String(i.status) === "1" && String(i.type) === "service"),
    [items]
  );
  const products = useMemo(
    () => items.filter((i) => String(i.status) === "1" && String(i.type) === "product"),
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
        <Container className="text-center mt-5">
          <Spinner animation="border" variant="warning" />
        </Container>
      </div>
    );
  }

  if (!establishment) return null;

  return (
    <div className="estv-root">
      <NavlogComponent />
      <div className="estv-hero" style={{ backgroundImage: `url("${imageUrl(establishment.background)}")` }}>
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
            <div className="estv-tags">
              {segs.map((s) => (
                <Badge bg="warning" text="white" key={s} className="me-2 mb-2 estv-badge">
                  {s}
                </Badge>
              ))}
            </div>
            <div className="estv-actions">
              {whatsappLink && (
                <Button as="a" href={whatsappLink} target="_blank" rel="noreferrer" size="sm" className="bg-black me-2">
                  WhatsApp
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
                  Instagram
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
                  Como chegar
                </Button>
              )}
              {token && (
                <>
                
                </>
              )}
            </div>
          </div>
        </Container>
      </div>

      <Container fluid className="estv-main">
        {token && (
          <Card bg="dark" text="light" className="mb-4">
            <Card.Header className="bg-dark text-light">
              <strong>Retrato de hoje</strong>
            </Card.Header>
            <Card.Body className="p-2">
              <Row className="gx-2 gy-2 text-center">
                <Col md={3} sm={6} xs={12}>
                  <Card bg="black" text="light">
                    <Card.Body className="p-2">
                      <div className="fs-6">Mais pedido</div>
                      <div className="fs-6 fw-bold">{metrics?.mostOrderedItem || "-"}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} sm={6} xs={12}>
                  <Card bg="black" text="light">
                    <Card.Body className="p-2">
                      <div className="fs-6">Cliente top</div>
                      <div className="fs-6 fw-bold">{metrics?.topCustomer || "-"}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={1} sm={6} xs={6}>
                  <Card bg="black" text="light">
                    <Card.Body className="p-2">
                      <div className="fs-6">Média/h</div>
                      <div className="fs-5 fw-bold">{metrics?.avgOrdersPerHour || "0.00"}</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        <Row className="gx-3 gy-4">
          <Col md={8}>
            {services.length > 0 && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header className="bg-dark text-light">
                  <strong>Serviços</strong>
                </Card.Header>
                <Card.Body>
                  <Row className="gx-3 gy-3">
                    {services.map((sv) => (
                      <Col key={`sv-${sv.id}`} lg={4} md={6} sm={6} xs={12}>
                        <Card className="estv-card h-100" bg="black" text="light">
                          <div className="estv-media-wrap">
                            <img
                              src={imageUrl(sv.image)}
                              alt={sv.name}
                              className="estv-media"
                              onError={handleImgError}
                              loading="lazy"
                            />
                          </div>
                          <Card.Body className="p-3">
                            <div className="estv-item-name">{sv.name}</div>
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="estv-item-price">{fmtPrice(sv.price)}</div>
                              {sv.duration ? <Badge bg="warning" text="dark">{`${sv.duration} min`}</Badge> : null}
                            </div>
                            {sv.description ? <div className="estv-item-desc mt-2">{sv.description}</div> : null}
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            )}

            {products.length > 0 && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header className="bg-dark text-light">
                  <strong>Produtos</strong>
                </Card.Header>
                <Card.Body>
                  <Row className="gx-3 gy-3">
                    {products.map((pd) => (
                      <Col key={`pd-${pd.id}`} lg={4} md={6} sm={6} xs={12}>
                        <Card className="estv-card h-100" bg="black" text="light">
                          <div className="estv-media-wrap">
                            <img
                              src={imageUrl(pd.image)}
                              alt={pd.name}
                              className="estv-media"
                              onError={handleImgError}
                              loading="lazy"
                            />
                          </div>
                          <Card.Body className="p-3">
                            <div className="estv-item-name">{pd.name}</div>
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="estv-item-price">{fmtPrice(pd.price)}</div>
                              {pd.stock !== undefined && pd.stock !== null ? (
                                <Badge bg={Number(pd.stock) > 0 ? "success" : "secondary"}>
                                  {Number(pd.stock) > 0 ? "Em estoque" : "Indisponível"}
                                </Badge>
                              ) : null}
                            </div>
                            {pd.description ? <div className="estv-item-desc mt-2">{pd.description}</div> : null}
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
            <Card bg="dark" text="light" className="mb-4">
              <Card.Header className="bg-dark text-light">
                <strong>Informações</strong>
              </Card.Header>
              <Card.Body>
                <div className="estv-info">
                  {establishment.phone ? <div className="estv-info-line">📞 {establishment.phone}</div> : null}
                  {establishment.email ? <div className="estv-info-line">✉️ {establishment.email}</div> : null}
                  {establishment.address ? <div className="estv-info-line">📍 {establishment.address}</div> : null}
                  {establishment.city ? <div className="estv-info-line">🏙️ {establishment.city}</div> : null}
                </div>
              </Card.Body>
            </Card>

            {barbers.length > 0 && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header className="bg-dark text-light">
                  <strong>Colaboradores</strong>
                </Card.Header>
                <Card.Body>
                  <Row className="gx-3 gy-3">
                    {barbers.map((b, idx) => {
                      const nm = `${b.user?.first_name || ""} ${b.user?.last_name || ""}`.trim() || "Colaborador";
                      return (
                        <Col key={`br-${idx}`} md={12}>
                          <div className="estv-collab">
                            <img
                              src={imageUrl(b.user?.avatar)}
                              alt={nm}
                              className="estv-collab-avatar"
                              onError={handleImgError}
                              loading="lazy"
                            />
                            <div className="estv-collab-meta">
                              <div className="estv-collab-name">{nm}</div>
                              {b.role ? <div className="estv-collab-role">{b.role}</div> : null}
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </Card.Body>
              </Card>
            )}

            
 {establishment.description ?
            <Card bg="dark" text="light" className="mb-4">
              <Card.Header className="bg-dark text-light">
                <strong>Sobre</strong>
              </Card.Header>
              <Card.Body>
               {establishment.description}
              </Card.Body>
            </Card>
            : null}
          </Col>
        </Row>
      </Container>

      {whatsappLink ? (
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
      ) : null}
    </div>
  );
}
