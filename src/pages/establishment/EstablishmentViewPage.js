// src/pages/establishment/EstablishmentViewPage.jsx
import React, { useMemo, useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import NavlogComponent from "../../components/NavlogComponent";
import GlobalHero from "../../components/GlobalHero";
import EstablishmentSidebar from "../../components/establishment/EstablishmentSidebar";

import GlobalCarousel from "../../components/GlobalCarousel";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";
import { apiBaseUrl } from "../../config";
import useAppointment from "../../hooks/useAppointment";
import useEstablishmentView from "../../hooks/useEstablishmentView";
import useItemsFilter from "../../hooks/useItemsFilter";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import useImageUtils from "../../hooks/useImageUtils";
import useScrollControl from "../../hooks/useScrollControl";
import useAuthPrompt from "../../hooks/useAuthPrompt";
import "./EstablishmentView.css";

const PLACEHOLDER = "/images/logo.png";
const APP_ID = 3;

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  const {
    establishment,
    metrics,
    interactionSummary,
    userInteractions,
    otherEstablishments,
    items,
    employers,
    ordersSummary,
    isLoading,
  } = useEstablishmentView(apiBaseUrl, slug, token, navigate);

  const { services, products } = useItemsFilter(items);
  const whatsappLink = useWhatsappLink(establishment);
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);
  const { ref: serviceRef, handleScroll: handleServiceScroll } = useScrollControl();
  const { ref: productRef, handleScroll: handleProductScroll } = useScrollControl();
  const { loadAvailableTimes, handleCreateAppointment } = useAppointment(apiBaseUrl, APP_ID, token, establishment);

  useAuthPrompt();

  const [showWizard, setShowWizard] = useState(false);
  const [wizardOptions, setWizardOptions] = useState({});

  const openSchedulePopup = (target = {}) => {
    const opts = {};
    if (target?.type === "service" || target?.price || target?.duration)
      opts.preselectedService = target;
    if (target?.user || (target?.id && target?.establishment_id))
      opts.preselectedEmployer = target;
    setWizardOptions(opts);
    setTimeout(() => setShowWizard(true), 50);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  if (isLoading)
    return (
      <div className="estv-root d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <NavlogComponent />
        <div className="text-center text-light mt-5">
          <div className="spinner-border text-info" role="status"></div>
          <p className="mt-3">Carregando estabelecimento...</p>
        </div>
      </div>
    );

  if (!establishment) return null;

  const fmtBRL = (v) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  return (
    <div className="estv-root">
      <NavlogComponent />

      <GlobalHero
  entity="establishment"
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
            {services.length > 0 && (
              <GlobalCarousel
                title="Serviços"
                items={services}
                carouselActive
                trackRef={serviceRef}
                handleScroll={handleServiceScroll}
                fmtBRL={fmtBRL}
                apiBaseUrl={apiBaseUrl}
                openSchedulePopup={openSchedulePopup}
                navigate={navigate}
                showSchedule
              />
            )}

            {products.length > 0 && (
              <GlobalCarousel
                title="Produtos"
                items={products}
                carouselActive
                trackRef={productRef}
                handleScroll={handleProductScroll}
                fmtBRL={fmtBRL}
                apiBaseUrl={apiBaseUrl}
                openSchedulePopup={() => {}}
                navigate={navigate}
                showSchedule={false}
              />
            )}
          </Col>

          <Col md={4}>
            <EstablishmentSidebar
  establishment={establishment}
  metrics={metrics}
  ordersSummary={ordersSummary}
  userInteractions={userInteractions}
  otherEstablishments={otherEstablishments}
  imageUrl={imageUrl}
  handleImgError={handleImgError}
  navigate={navigate}
  openSchedulePopup={openSchedulePopup}
/>

          </Col>
        </Row>
      </Container>

      <AppointmentWizardModal
        show={showWizard}
        onHide={() => setShowWizard(false)}
        employers={employers}
        services={services}
        loadAvailableTimes={loadAvailableTimes}
        handleCreateAppointment={handleCreateAppointment}
        imageUrl={imageUrl}
        preselectedService={wizardOptions.preselectedService || null}
        preselectedEmployer={wizardOptions.preselectedEmployer || null}
      />

      {whatsappLink && (
        <a href={whatsappLink} target="_blank" rel="noreferrer" className="estv-whatsapp-fab" title="Chamar no WhatsApp">
          <FaWhatsapp className="estv-whatsapp-icon" />
        </a>
      )}
    </div>
  );
}
