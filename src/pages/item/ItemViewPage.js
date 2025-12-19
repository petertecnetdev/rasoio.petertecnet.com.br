import React, { useMemo, useEffect } from "react";
import { Container, Row, Col, Card, Image } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";

import NavlogComponent from "../../components/NavlogComponent";
import GlobalHero from "../../components/GlobalHero";
import ItemSidebar from "../../components/item/ItemSidebar";
import ItemMetrics from "../../components/item/ItemMetrics";
import GlobalRotativity from "../../components/GlobalRotativity";

import { apiBaseUrl } from "../../config";
import useItemView from "../../hooks/useItemView";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import useImageUtils from "../../hooks/useImageUtils";
import useAuthPrompt from "../../hooks/useAuthPrompt";

import "./ItemView.css";

const PLACEHOLDER = "/images/logo.png";

export default function ItemViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  const {
    item,
    establishment,
    metrics,
    interactionSummary,
    userInteractions,
    ordersSummary,
    otherEstablishments,
    otherEmployers,
    otherItems,
    isLoading,
  } = useItemView(apiBaseUrl, slug, token, navigate);

  const whatsappLink = useWhatsappLink(establishment);
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);

  useAuthPrompt();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  if (isLoading || !item) return null;

  const fmtBRL = (v) =>
    `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  return (
    <div className="itemv-root">
      <NavlogComponent />

      <GlobalHero
        entity="item"
        title={item.name}
        description={item.description}
        background={establishment?.background}
        logo={item.image_url || item.image || establishment?.logo}
        imageUrl={imageUrl}
        handleImgError={handleImgError}
        establishment={establishment}
        interactionSummary={interactionSummary}
      />

      <Container fluid className="itemv-main">
        <Row className="gx-3 gy-4">
          <Col md={8}>
            <GlobalRotativity
              otherEstablishments={otherEstablishments}
              otherEmployers={otherEmployers}
              otherItems={otherItems}
              navigate={navigate}
              fmtBRL={fmtBRL}
            />

            <h5 className="mt-4">Outros itens deste estabelecimento</h5>
            <Row className="gy-3">
              {otherItems.map((oi) => (
                <Col key={oi.id} md={4}>
                  <Card
                    onClick={() => navigate(`/item/view/${oi.slug}`)}
                    className="cursor-pointer"
                  >
                    <Card.Img
                      variant="top"
                      src={oi.image || PLACEHOLDER}
                      onError={(e) => (e.target.src = PLACEHOLDER)}
                    />
                    <Card.Body>
                      <Card.Title>{oi.name}</Card.Title>
                      <Card.Text>{fmtBRL(oi.price)}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            <h5 className="mt-4">Outros estabelecimentos na cidade</h5>
            <Row className="gy-3">
              {otherEstablishments.map((oe) => (
                <Col key={oe.id} md={4}>
                  <Card
                    onClick={() => navigate(`/establishment/view/${oe.slug}`)}
                    className="cursor-pointer text-center"
                  >
                    <Image
                      src={oe.logo || PLACEHOLDER}
                      onError={(e) => (e.target.src = PLACEHOLDER)}
                      roundedCircle
                      width={80}
                      height={80}
                      className="mx-auto mt-3"
                    />
                    <Card.Body>
                      <Card.Title>{oe.name}</Card.Title>
                      <Card.Text>
                        {oe.city}, {oe.uf}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            <h5 className="mt-4">Profissionais que atendem este item</h5>
            <Row className="gy-3">
              {otherEmployers.map((oe) => (
                <Col key={oe.employer_id} md={4}>
                  <Card className="text-center">
                    <Image
                      src={oe.avatar || PLACEHOLDER}
                      onError={(e) => (e.target.src = PLACEHOLDER)}
                      roundedCircle
                      width={80}
                      height={80}
                      className="mx-auto mt-3"
                    />
                    <Card.Body>
                      <Card.Title>
                        {oe.first_name} {oe.last_name}
                      </Card.Title>
                      <Card.Text>@{oe.user_name}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>

          <Col md={4}>
            <ItemSidebar
              item={item}
              establishment={establishment}
              metrics={metrics}
              ordersSummary={ordersSummary}
              userInteractions={userInteractions}
              imageUrl={imageUrl}
              handleImgError={handleImgError}
              navigate={navigate}
            />

            {metrics && <ItemMetrics metrics={metrics} />}
          </Col>
        </Row>
      </Container>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="itemv-whatsapp-fab"
          title="Chamar no WhatsApp"
        >
          <FaWhatsapp className="itemv-whatsapp-icon" />
        </a>
      )}
    </div>
  );
}
