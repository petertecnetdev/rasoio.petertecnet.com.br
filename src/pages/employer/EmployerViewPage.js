// src/pages/employer/EmployerViewPage.jsx
import React, { useMemo, useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import NavlogComponent from "../../components/NavlogComponent";
import GlobalHero from "../../components/GlobalHero";
import EmployerSidebar from "../../components/employer/EmployerSidebar";
import EmployerMetrics from "../../components/employer/EmployerMetrics";
import GlobalCarousel from "../../components/GlobalCarousel";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";
import { apiBaseUrl } from "../../config";
import useAppointment from "../../hooks/useAppointment";
import useImageUtils from "../../hooks/useImageUtils";
import useScrollControl from "../../hooks/useScrollControl";
import useAuthPrompt from "../../hooks/useAuthPrompt";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import "./EmployerView.css";

const PLACEHOLDER = "/images/logo.png";
const APP_ID = 3;

export default function EmployerViewPage() {
  const { user_name } = useParams();
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [employer, setEmployer] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [interactionSummary, setInteractionSummary] = useState(null);
  const [userInteractions, setUserInteractions] = useState([]);
  const [relatedEmployers, setRelatedEmployers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useAuthPrompt();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/employer/view/${user_name}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data?.employer) {
          const cleanedMetrics = {};
          if (data.metrics && typeof data.metrics === "object") {
            for (const [k, v] of Object.entries(data.metrics)) {
              if (
                v !== null &&
                v !== undefined &&
                typeof v !== "object" &&
                typeof v !== "function"
              ) {
                cleanedMetrics[k] = v;
              }
            }
          }
          setEmployer(data.employer);
          setMetrics(cleanedMetrics);
          setInteractionSummary(data.interaction_summary);
          setUserInteractions(data.user_interactions || []);
          setRelatedEmployers(data.related_employers || []);
        }
      } catch (error) {
        console.error("Erro ao carregar colaborador:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user_name, token]);

  const establishment = employer?.establishment || {};
  const items = establishment?.items || [];
  const services = items.filter((i) => i.type === "service");
  const products = items.filter((i) => i.type === "product");

  const whatsappLink = useWhatsappLink(employer?.user || employer);
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);
  const { ref: serviceRef, handleScroll: handleServiceScroll } = useScrollControl();
  const { ref: productRef, handleScroll: handleProductScroll } = useScrollControl();
  const { loadAvailableTimes, handleCreateAppointment } = useAppointment(
    apiBaseUrl,
    APP_ID,
    token,
    establishment
  );

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
  }, [user_name]);

  if (!employer || isLoading) return null;

  const fmtBRL = (v) =>
    `R$ ${Number(v || 0)
      .toFixed(2)
      .replace(".", ",")}`;

  return (
    <div className="empv-root">
      <NavlogComponent />

      <GlobalHero
        entity="employer"
        title={`${employer?.user?.first_name || ""} ${employer?.user?.last_name || ""}`}
        description={establishment?.name || "Colaborador do estabelecimento"}
        background={establishment?.background}
        logo={employer?.user?.avatar || establishment?.logo}
        imageUrl={imageUrl}
        handleImgError={handleImgError}
        user={employer?.user}
        establishment={establishment}
        interactionSummary={interactionSummary}
      />

      <Container fluid className="empv-main">
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
            <EmployerSidebar
              employer={employer}
              metrics={metrics}
              interactionSummary={interactionSummary}
              userInteractions={userInteractions}
              relatedEmployers={relatedEmployers}
              imageUrl={imageUrl}
              handleImgError={handleImgError}
              navigate={navigate}
              openSchedulePopup={openSchedulePopup}
            />
            {metrics && <EmployerMetrics metrics={metrics} />}
          </Col>
        </Row>
      </Container>

      <AppointmentWizardModal
        show={showWizard}
        onHide={() => setShowWizard(false)}
        employers={[employer]}
        services={services}
        loadAvailableTimes={loadAvailableTimes}
        handleCreateAppointment={handleCreateAppointment}
        imageUrl={imageUrl}
        preselectedService={wizardOptions.preselectedService || null}
        preselectedEmployer={wizardOptions.preselectedEmployer || null}
      />

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="empv-whatsapp-fab"
          title={`Conversar com ${employer?.user?.first_name || "colaborador"} no WhatsApp`}
        >
          <FaWhatsapp className="empv-whatsapp-icon" />
        </a>
      )}
    </div>
  );
}
