
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  ButtonGroup,
  Badge,
} from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import { useParams, useNavigate, Link } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./BarbershopViewPage.css";

export default function BarbershopViewPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [shop, setShop] = useState(null);
  const [owner, setOwner] = useState({});
  const [items, setItems] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [others, setOthers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${apiBaseUrl}/barbershop/view/${slug}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setShop(data.barbershop);
        setOwner(data.owner); // corrigido: usar data.owner em vez de data.user
        setItems(data.items);
        setBarbers(data.barbers);
        setOthers(data.otherBarbershops);
        window.scrollTo(0, 0);
      } catch (e) {
        Swal.fire({ icon: "error", title: "Erro!", text: e.response?.data?.message || "Falha ao carregar." });
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading || !shop) {
    return (
      <ProcessingIndicatorComponent
        messages={[
          "Carregando barbearia...",
          "Aguarde um instante...",
          "Quase lá!",
        ]}
      />
    );
  }

  const services = items.filter((i) => i.type === "service");
  const rating = parseFloat(shop.rating) || 0;

  return (
    <>
      <NavlogComponent />
      <Container fluid className="barbershop-container p-4">

        {/* Header */}
        <Card className="barbershop-header background-gradient mb-4 shadow-lg">
          <div
            className="card-bg"
            style={{
              backgroundImage: `url(${shop.background_image ? `${storageUrl}/${shop.background_image}` : shop.logo ? `${storageUrl}/${shop.logo}` : "/images/logo.png"})`,
            }}
          />
          <Card.Body className="barbershop-body">
            <Row className="align-items-center">

              {/* Logo & Rating */}
              <Col md={3} className="text-center mb-3 mb-md-0">
                <img
                  src={shop.logo ? `${storageUrl}/${shop.logo}` : "/images/logo.png"}
                  alt={shop.name}
                  onError={(e) => { if (!e.target.src.includes("logo.png")) e.target.src = "/images/logo.png"; }}
                  className="barbershop-logo"
                />
                <div className="mt-2">
                  <Badge bg="warning" text="dark">
                    ⭐ {rating.toFixed(1)}/5
                  </Badge>
                </div>
              </Col>

              {/* Basic Info */}
              <Col md={6} className="text-center text-md-start">
                <h2 className="barbershop-title mb-2">{shop.name}</h2>
                <div className="manager-info mb-2">
                  <img
                    src={owner.avatar ? `${storageUrl}/${owner.avatar}` : "/images/user.png"}
                    alt={owner.first_name}
                    onError={(e) => { if (!e.target.src.includes("user.png")) e.target.src = "/images/user.png"; }}
                    className="manager-avatar-sm"
                  />
                  <span>
                    Gerente: <strong>{owner.first_name} {owner.last_name}</strong>
                  </span>
                </div>
                <p className="barbershop-address mb-1">
                  <i className="bi bi-geo-alt-fill"/> {shop.address}, {shop.city} - {shop.state} <br />
                  CEP: {shop.zipcode}
                </p>
                <p className="mb-1">
                  <i className="bi bi-telephone-fill"/> <a href={`tel:${shop.phone}`}>{shop.phone}</a>
                </p>
                <p className="mb-1">
                  <i className="bi bi-envelope-fill"/> <a href={`mailto:${shop.email}`}>{shop.email}</a>
                </p>
                {shop.website && (
                  <p className="mb-0">
                    <i className="bi bi-globe"/> <a href={shop.website} target="_blank" rel="noopener noreferrer">{new URL(shop.website).hostname}</a>
                  </p>
                )}
              </Col>

              {/* Actions */}
              <Col md={3} className="text-center text-md-end">
                <ButtonGroup vertical className="barbershop-actions">
                  <Button onClick={() => navigate(`/appointment/create/${shop.slug}`)}>Agendar</Button>
                  <Button onClick={() => window.open(shop.location, "_blank")}>Ver Mapa</Button>
                  <Button onClick={() => window.open(shop.instagram, "_blank")}>Instagram</Button>
                  <Button onClick={() => window.open(`https://wa.me/${shop.phone}?text=Olá!`, "_blank")}>WhatsApp</Button>
                </ButtonGroup>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Descrição & Metadados */}
        <Card className="description-card text-white mb-4 shadow-sm">
          <Card.Header >Descrição & Metadados</Card.Header>
          <Card.Body>
            <Card.Text>{shop.description}</Card.Text>
            <ul>
              <li><strong>Criado em:</strong> {new Date(shop.created_at).toLocaleDateString("pt-BR")}</li>
              <li><strong>Atualizado em:</strong> {new Date(shop.updated_at).toLocaleDateString("pt-BR")}</li>
            </ul>
          </Card.Body>
        </Card>

        {/* Serviços */}
        <Row>
          <Col lg={6} className="mb-4">
            <Card className="services-card shadow-sm">
              <Card.Header className="services-header">Serviços</Card.Header>
              <Card.Body className="p-0">
                <Table hover responsive className="services-table mb-0">
                  <thead>
                    <tr>
                      <th>Serviço</th>
                      <th>Descrição</th>
                      <th className="text-end">Preço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.length ? (
                      services.map((s) => (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          <td>{s.description}</td>
                          <td className="text-end">R${s.price}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">
                          Nenhum serviço encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          {/* Equipe */}
          <Col lg={6} className="mb-4">
            <Card className="barbers-card shadow-sm">
              <Card.Header className="barbers-header">Equipe de Barbeiros</Card.Header>
              <Card.Body>
                {barbers.length ? (
                  <Row>
                    {barbers.map((b) => (
                      <Col xs={6} key={b.id} className="barber-col">
                        <Link to={`/barber/view/${b.user_name}`} className="text-decoration-none text-body">
                          <img
                            src={b.avatar ? `${storageUrl}/${b.avatar}` :"/images/barber.png"}
                            alt={b.first_name}
                            onError={(e) => { if (!e.target.src.includes("user.png")) e.target.src = "/images/barber.png"; }}
                            className="barber-avatar  mb-2"
                          />
                          <div>
                            <strong className="text-white">{b.first_name}</strong>
                          </div>
                        </Link>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <p className="text-center mb-0">Nenhum barbeiro encontrado.</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Outras Barbearias */}
        {others.length > 0 && (
          <Card className="mb-4 shadow-sm bg-dark text-white">
            <Card.Header>Outras Barbearias</Card.Header>
            <Card.Body>
              <Row>
                {others.map((o, i) => (
                  <Col xs={6} md={3} key={i} className="text-center mb-3">
                    <Link to={`/barbershop/view/${o.slug}`} className="text-decoration-none text-body">
                      <img
                        src={`${storageUrl}/${o.logo}`}
                        alt={o.name}
                        className="barbershop-logo mb-2 rounded-circle"
                      />
                      <div>
                        <strong>{o.name}</strong>
                      </div>
                    </Link>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        )}

      </Container>
    </>
  );
}