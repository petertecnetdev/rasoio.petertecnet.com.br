import React, { useMemo, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
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
    entity,
    metrics,
    interactionSummary,
    userInteractions,
    ordersSummary,
    otherEstablishments,
    otherEmployers,
    otherItems,
    isLoading,
  } = useItemView(apiBaseUrl, slug, token, navigate);

  const whatsappLink = useWhatsappLink(entity);
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);

  useAuthPrompt();

  const openSchedulePopup = () => {};

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
        background={entity?.background}
        logo={item.image_url || item.image || entity?.logo}
        imageUrl={imageUrl}
        handleImgError={handleImgError}
        establishment={entity}
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
              openSchedulePopup={openSchedulePopup}
              fmtBRL={fmtBRL}
            />
          </Col>

          <Col md={4}>
            <ItemSidebar
              item={item}
              entity={entity}
              metrics={metrics}
              ordersSummary={ordersSummary}
              userInteractions={userInteractions}
              imageUrl={imageUrl}
              handleImgError={handleImgError}
              navigate={navigate}
              openSchedulePopup={openSchedulePopup}
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
