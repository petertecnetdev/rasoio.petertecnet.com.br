import React, { useMemo, useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";

import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl } from "../../config";

import "./EstablishmentView.css";
import GlobalHero from "../../components/GlobalHero";
import GlobalSidebar from "../../components/GlobalSidebar";
import GlobalCarousel from "../../components/GlobalCarousel";

import AppointmentSelector from "../../components/AppointmentSelector";
import useAppointment from "../../components/useAppointment";

import useEstablishmentView from "../../hooks/useEstablishmentView";
import useItemsFilter from "../../hooks/useItemsFilter";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import useImageUtils from "../../hooks/useImageUtils";
import useScrollControl from "../../hooks/useScrollControl";
import useAuthPrompt from "../../hooks/useAuthPrompt";

const PLACEHOLDER = "/images/logo.png";
const APP_ID = 3;

const fmtBRL = (v) =>
  `R$ ${Number(v || 0)
    .toFixed(2)
    .replace(".", ",")}`;

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  const {
    establishment,
    metrics,
    interactionSummary,
    userInteractions,
    otherEstablishments,
    items,
    employers,
    itemsInteractions,
    isLoading,
  } = useEstablishmentView(apiBaseUrl, slug, token, navigate);

  const { services, products } = useItemsFilter(items);
  const whatsappLink = useWhatsappLink(establishment);
  const { loadAvailableTimes, handleCreateAppointment } = useAppointment(
    apiBaseUrl,
    APP_ID,
    token,
    establishment
  );

  const { ref: serviceRef, handleScroll: handleServiceScroll } = useScrollControl();
  const { ref: productRef, handleScroll: handleProductScroll } = useScrollControl();

  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);
  useAuthPrompt();

  const appointmentSelector = AppointmentSelector({
    service: null,
    employers,
    loadAvailableTimes,
    handleCreateAppointment,
    imageUrl,
  });

  if (isLoading)
    return (
      <div
        className="estv-root d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <NavlogComponent />
        <div className="text-center text-light mt-5">
          <div className="spinner-border text-info" role="status"></div>
          <p className="mt-3">Carregando estabelecimento...</p>
        </div>
      </div>
    );

  if (!establishment) return null;

  // 🔧 injeta o estabelecimento dentro de cada item
  const servicesWithEstablishment = services.map((s) => ({
    ...s,
    establishment,
  }));

  const productsWithEstablishment = products.map((p) => ({
    ...p,
    establishment,
  }));

  return (
    <div className="estv-root">
      <NavlogComponent />

      <GlobalHero
        title={establishment.name}
        description={establishment.description}
        background={establishment.background}
        logo={establishment.logo}
        imageUrl={imageUrl}
        handleImgError={handleImgError}
        user={establishment.user}
        establishment={establishment}
        interactionSummary={interactionSummary}
      />

      <Container fluid className="estv-main">
        <Row className="gx-3 gy-4">
          <Col md={8}>
            {/* ===== SERVIÇOS ===== */}
            {servicesWithEstablishment.length > 0 && (
              <div className="mb-4">
                <GlobalCarousel
                  title="Serviços"
                  items={servicesWithEstablishment}
                  itemsInteractions={itemsInteractions}
                  imageUrl={imageUrl}
                  handleImgError={handleImgError}
                  carouselActive={true}
                  handleScroll={handleServiceScroll}
                  trackRef={serviceRef}
                  fmtBRL={fmtBRL}
                  apiBaseUrl={apiBaseUrl}
                  openSchedulePopup={(service) =>
                    appointmentSelector.open(service)
                  }
                  navigate={navigate}
                  showSchedule={true}
                />
              </div>
            )}

            {/* ===== PRODUTOS ===== */}
            {productsWithEstablishment.length > 0 && (
              <div className="mb-4">
                <GlobalCarousel
                  title="Produtos"
                  items={productsWithEstablishment}
                  itemsInteractions={itemsInteractions}
                  imageUrl={imageUrl}
                  handleImgError={handleImgError}
                  carouselActive={true}
                  handleScroll={handleProductScroll}
                  trackRef={productRef}
                  fmtBRL={fmtBRL}
                  apiBaseUrl={apiBaseUrl}
                  openSchedulePopup={() => {}}
                  navigate={navigate}
                  showSchedule={false}
                />
              </div>
            )}
          </Col>

          <Col md={4}>
            <GlobalSidebar
              entity={establishment}
              metrics={metrics}
              interactionSummary={interactionSummary}
              userInteractions={userInteractions}
              relatedEntities={otherEstablishments}
              imageUrl={imageUrl}
              handleImgError={handleImgError}
              navigate={navigate}
            />
          </Col>
        </Row>
      </Container>

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
