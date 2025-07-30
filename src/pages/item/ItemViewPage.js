// src/pages/item/ItemViewPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  ButtonGroup,
  Tabs,
  Tab,
  ListGroup,
  Table,
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import NavlogComponent from '../../components/NavlogComponent';
import ProcessingIndicatorComponent from '../../components/ProcessingIndicatorComponent';
import { apiBaseUrl, storageUrl } from '../../config';
import './Item.css';

export default function ItemViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    async function fetchData() {
      if (!slug) {
        Swal.fire('Erro', 'Slug não encontrado.', 'error');
        navigate('/');
        return;
      }
      try {
        const { data } = await axios.get(
          `${apiBaseUrl}/item/view/${slug}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setItem(data.item);
        setShop(data.barbershop);
      } catch (error) {
        Swal.fire('Erro', error.response?.data?.error || 'Falha ao carregar.', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug, navigate]);

  if (loading) {
    return (
      <>
        <NavlogComponent />
        <ProcessingIndicatorComponent
          messages={[
            'Carregando item...',
            'Um momento, por favor...',
            'Já já estará pronto!',
          ]}
        />
      </>
    );
  }

  if (!item) {
    return (
      <>
        <NavlogComponent />
        <Container className="main-container my-5 text-center">
          <h3>Item não encontrado.</h3>
        </Container>
      </>
    );
  }

  const {
    name,
    description,
    price,
    discount,
    category,
    subcategory,
    duration,
    stock,
    status,
    image,
    updated_at,
    type,
    nutrition,
    reviews,
  } = item;

  const baseImage = shop?.background_image
    ? `${storageUrl}/${shop.background_image}`
    : shop?.logo
    ? `${storageUrl}/${shop.logo}`
    : '/images/logo.png';

  const coverImage = image ? `${storageUrl}/${image}` : null;
  const effectivePrice = parseFloat(price);
  const finalPrice = (effectivePrice * (1 - (discount || 0) / 100)).toFixed(2);

  return (
    <>
      <NavlogComponent />
      <Container fluid className="item-page p-4">
        {/* Hero */}
        <Card className="position-relative mb-4 hero-card">
          <div
            className="hero-bg"
            style={{ backgroundImage: `url(${baseImage})` }}
          />
          {coverImage && (
            <img
              src={coverImage}
              alt={name}
              className="hero-overlay-img"
            />
          )}
          <Card.Body className="hero-body text-center text-md-start">
            <h1 className="display-5 text-white mb-2">{name}</h1>
            <div className="mb-3">
              <Badge bg="primary" className="me-2">{category}</Badge>
              <Badge bg="secondary">{subcategory}</Badge>
            </div>
            <div className="mb-3 fs-4">
              {discount > 0 && (
                <span className="text-decoration-line-through text-white-50 me-2">
                  R${effectivePrice.toFixed(2)}
                </span>
              )}
              <span className="fw-bold text-white">R${finalPrice}</span>
            </div>
            <div className="mb-3">
              {duration && (
                <Badge bg="info" className="me-2">⏱️ {duration} min</Badge>
              )}
              <Badge bg={stock > 0 ? 'success' : 'danger'} className="me-2">
                {stock > 0 ? 'Em estoque' : 'Indisponível'}
              </Badge>
              <Badge bg={status ? 'primary' : 'dark'}>
                {status ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <ButtonGroup>
              <Button
                variant="light"
                size="lg"
                className="me-2"
                onClick={() =>
                  window.open(
                    `https://wa.me/${shop?.phone}?text=Olá!%20Tenho%20interesse%20no%20${encodeURIComponent(
                      name
                    )}`,
                    '_blank'
                  )
                }
              >
                {type === 'service' ? 'Agendar' : 'Comprar'}
              </Button>
              <Button
                variant="outline-light"
                size="lg"
                onClick={() => navigate(`/item/${slug}`)}
              >
                Detalhes
              </Button>
            </ButtonGroup>
            <p className="text-white-50 small mt-3">
              Atualizado em {new Date(updated_at).toLocaleDateString('pt-BR')}
            </p>
          </Card.Body>
        </Card>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-4"
        >
          <Tab eventKey="details" title="Detalhes">
            <Card className="page-card mb-4">
              <Card.Body>
                <p>{description}</p>
                {nutrition && (
                  <Table striped bordered responsive className="mt-4">
                    <thead>
                      <tr><th>Nutriente</th><th>Valor</th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(nutrition).map(([nutr, val]) => (
                        <tr key={nutr}><td>{nutr}</td><td>{val}</td></tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="reviews" title={`Avaliações (${reviews?.length || 0})`}>
            <Card className="page-card mb-4">
              <Card.Body>
                {reviews && reviews.length > 0 ? (
                  reviews.map((r) => (
                    <ListGroup key={r.id} className="mb-3">
                      <ListGroup.Item>
                        <div className="d-flex justify-content-between">
                          <strong>{r.user.name}</strong>
                          <Badge bg="warning">{'★'.repeat(r.rating)}</Badge>
                        </div>
                        <p className="mt-2 mb-0">{r.comment}</p>
                      </ListGroup.Item>
                    </ListGroup>
                  ))
                ) : (
                  <p>Sem avaliações.</p>
                )}
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>

        {/* Shop Info */}
        {shop && (
          <Card className="page-card mb-4">
            <Card.Header>Barbearia</Card.Header>
            <Card.Body>
              <Row className="align-items-center">
                <Col md={3} className="text-center">
                  <img
                    src={shop.logo ? `${storageUrl}/${shop.logo}` : '/images/logo.png'}
                    alt={shop.name}
                    className="shop-logo"
                  />
                </Col>
                <Col md={6}>
                  <h5>{shop.name}</h5>
                  <p className="mb-1">{shop.address}, {shop.city}</p>
                  <p className="mb-1">Telefone: <a href={`tel:${shop.phone}`}>{shop.phone}</a></p>
                </Col>
                <Col md={3} className="text-end">
                  <ButtonGroup vertical>
                    <Button onClick={() => navigate(`/appointment/create/${shop.slug}`)}>
                      Agendar
                    </Button>
                    <Button onClick={() => window.open(shop.location, '_blank')}>
                      Ver Mapa
                    </Button>
                  </ButtonGroup>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}
      </Container>
    </>
  );
}
