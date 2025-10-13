import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Container, Row, Col, Card, Badge, Button, Spinner } from "react-bootstrap";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaWhatsapp } from "react-icons/fa";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./ItemListPage.css";

export default function ItemListPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const fmtPrice = useCallback((v) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`, []);
  const ph = "/images/logo.png";

  const handleImgError = useCallback((e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = ph;
  }, []);

  const imageUrl = useCallback((path) => (path ? `${storageUrl}/${path}` : ph), []);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        const { data: userData } = await axios.get(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!isMounted) return;
        setUser(userData.user);

        const { data: estData } = await axios.get(`${apiBaseUrl}/establishment/view/${slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!isMounted) return;

        const estObj = estData.establishment;
        const estItems = Array.isArray(estData.items) ? estData.items : [];

        if (!estObj) {
          navigate("/404");
          return;
        }

        if (userData.user.id !== estObj.user_id) {
          Swal.fire({
            icon: "warning",
            title: "Acesso negado",
            text: "Você não tem permissão para acessar os itens deste estabelecimento.",
            confirmButtonText: "Ok",
          }).then(() => navigate("/dashboard"));
          return;
        }

        setEstablishment(estObj);
        setItems(estItems);
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível carregar os itens.",
          confirmButtonText: "Ok",
        }).then(() => navigate("/dashboard"));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [slug, token, navigate]);

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

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Excluir item",
      text: `Tem certeza que deseja excluir o item "${item.name}"?`,
      showCancelButton: true,
      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${apiBaseUrl}/item/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire({
          icon: "success",
          title: "Excluído",
          text: `O item "${item.name}" foi excluído.`,
        });
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível excluir o item.",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="iteml-root">
        <NavlogComponent />
        <Container className="text-center mt-5">
          <Spinner animation="border" variant="warning" />
        </Container>
      </div>
    );
  }

  if (!establishment) return null;

  return (
    <div className="iteml-root">
      <NavlogComponent />

      <div className="iteml-hero" style={{ backgroundImage: `url("${imageUrl(establishment.background)}")` }}>
        <div className="iteml-hero-overlay" />
        <Container fluid className="iteml-hero-content">
          <div className="iteml-hero-left">
            <img
              src={imageUrl(establishment.logo)}
              alt={establishment.name}
              className="iteml-logo"
              onError={handleImgError}
            />
          </div>
          <div className="iteml-hero-right">
            <h1 className="iteml-title">{establishment.name}</h1>
            <div className="iteml-slug">@{establishment.slug}</div>
            <div className="iteml-desc">{establishment.description || ""}</div>
          </div>
        </Container>
      </div>

      <Container fluid className="iteml-main mt-4">
        {services.length > 0 && (
          <Card bg="dark" text="light" className="mb-4">
            <Card.Header className="bg-dark text-light">
              <strong>Serviços</strong>
            </Card.Header>
            <Card.Body>
              <Row className="gx-3 gy-3">
                {services.map((sv) => (
                  <Col key={sv.id} md={3}>
                    <Card className="iteml-card h-100" bg="black" text="light">
                      <div className="iteml-media-wrap">
                        <img
                          src={imageUrl(sv.image)}
                          alt={sv.name}
                          className="iteml-media"
                          onError={handleImgError}
                          loading="lazy"
                        />
                      </div>
                      <Card.Body className="p-3 d-flex flex-column">
                        <div className="iteml-item-name">{sv.name}</div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="iteml-item-price">{fmtPrice(sv.price)}</div>
                          {sv.duration ? <Badge bg="warning" text="dark">{`${sv.duration} min`}</Badge> : null}
                        </div>
                        {sv.description && <div className="iteml-item-desc mt-2">{sv.description}</div>}
                        <div className="mt-3 d-flex gap-2">
                          <Button as={Link} to={`/item/update/${sv.id}`} variant="outline-warning" size="sm">
                            Editar
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(sv)}>
                            Excluir
                          </Button>
                        </div>
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
                  <Col key={pd.id} md={3} >
                    <Card className="iteml-card h-100" bg="black" text="light">
                      <div className="iteml-media-wrap">
                        <img
                          src={imageUrl(pd.image)}
                          alt={pd.name}
                          className="iteml-media"
                          onError={handleImgError}
                          loading="lazy"
                        />
                      </div>
                      <Card.Body className="p-3 d-flex flex-column">
                        <div className="iteml-item-name">{pd.name}</div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="iteml-item-price">{fmtPrice(pd.price)}</div>
                          {pd.stock !== undefined && pd.stock !== null ? (
                            <Badge bg={Number(pd.stock) > 0 ? "success" : "secondary"}>
                              {Number(pd.stock) > 0 ? "Em estoque" : "Indisponível"}
                            </Badge>
                          ) : null}
                        </div>
                        {pd.description && <div className="iteml-item-desc mt-2">{pd.description}</div>}
                        <div className="mt-3 d-flex gap-2">
                          <Button as={Link} to={`/item/update/${pd.id}`} variant="outline-warning" size="sm">
                            Editar
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(pd)}>
                            Excluir
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        )}
      </Container>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="iteml-whatsapp-fab"
          aria-label={`Chamar ${establishment.name} no WhatsApp`}
          title="Chamar no WhatsApp"
        >
          <FaWhatsapp className="iteml-whatsapp-icon" />
        </a>
      )}
    </div>
  );
}
