import React, { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { FaCalendarAlt, FaClock, FaImage, FaShoppingBag, FaStore, FaTools, FaWhatsapp } from "react-icons/fa";

import { apiBaseUrl, appId } from "../../config";
import useItemView from "../../hooks/useItemView";
import useAppointment from "../../hooks/useAppointment";
import useImageUtils from "../../hooks/useImageUtils";
import usePublicEntitySeo from "../../hooks/usePublicEntitySeo";
import useSchedulePopup from "../../hooks/useSchedulePopup";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import { canScheduleItem } from "../../utils/schedulingCapabilities";
import GlobalCarousel from "../../components/GlobalCarousel";
import GlobalMap from "../../components/GlobalMap";
import GlobalWhatsappButton from "../../components/GlobalWhatsappButton";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";
import ShareButton from "../../components/ShareButton";
import "./ItemView.css";

const PLACEHOLDER = "/images/logo.png";

export default function ItemViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }), [slug]);

  const { item, establishment, employers, otherItems, isLoading, error } = useItemView(
    apiBaseUrl,
    slug,
    token,
    navigate
  );
  const { imageUrl } = useImageUtils(PLACEHOLDER);
  const {
    showWizard,
    setShowWizard,
    wizardEstablishment,
    wizardEmployers,
    wizardServices,
    preselectedEmployer,
    preselectedServiceId,
    openSchedulePopup,
  } = useSchedulePopup(apiBaseUrl, token, appId);
  const { loadAvailableTimes, handleCreateAppointment } = useAppointment(
    apiBaseUrl,
    appId,
    token,
    wizardEstablishment
  );
  const whatsappLink = useWhatsappLink(establishment || item || null);
  const whatsappMessage = `Olá, gostaria de saber mais informações sobre o item "${item?.name || item?.title || "selecionado"}". Você poderia me ajudar?`;
  const safeNavigate = useMemo(() => (path) => (window.location.href = path), []);

  const isProduct = useMemo(() => {
    const type = item?.item_type || item?.type || null;
    return (
      type === "product" ||
      item?.is_product === true ||
      item?.isProduct === true ||
      Boolean(item?.product_id) ||
      Boolean(item?.productId)
    );
  }, [item]);

  const canSchedule = Boolean(
    item &&
      !isProduct &&
      canScheduleItem({
        item,
        establishment,
        employers,
        services: [item],
      })
  );

  const itemImage =
    item?.imageUrl ||
    item?.image ||
    item?.image_url ||
    item?.files?.find?.((file) => ["image", "cover"].includes(file?.type))?.public_url ||
    null;
  const price =
    item?.price != null && item?.price !== ""
      ? `R$ ${Number(item.price).toFixed(2).replace(".", ",")}`
      : "Consulte";
  const duration = !isProduct ? `${Number(item?.duration || 30)} min` : null;
  const description =
    item?.description ||
    item?.details ||
    (isProduct
      ? "Produto disponível neste estabelecimento."
      : "Serviço com horário reservado especialmente para você.");
  const estLogo =
    establishment?.images?.logo ||
    establishment?.logo ||
    establishment?.files?.find?.((file) => file?.type === "logo")?.public_url ||
    null;

  usePublicEntitySeo({
    title: item?.name || item?.title,
    description,
    canonicalPath: slug ? `/item/view/${encodeURIComponent(slug)}` : null,
    image: itemImage || undefined,
  });

  const handleOpenScheduleFromItem = useCallback(async () => {
    if (!canSchedule) return;
    try {
      await openSchedulePopup({
        service: item,
        establishment: establishment || null,
        filteredEmployers: employers,
      });
    } catch (scheduleError) {
      console.error(scheduleError);
      Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível abrir o agendamento agora." });
    }
  }, [openSchedulePopup, item, establishment, employers, canSchedule]);

  if (isLoading) return <div className="iv-state">Carregando item…</div>;
  if (!item || error) {
    return (
      <div className="iv-state">
        {error?.message || error?.error || (typeof error === "string" ? error : "Item indisponível.")}
      </div>
    );
  }

  return (
    <>
      <main className={`iv-page ${isProduct ? "iv-page--product" : "iv-page--service"}`}>
        <div className="iv-shell">
          <section className={`iv-stage ${!itemImage ? "iv-stage--noImage" : ""}`}>
            <div className="iv-mediaPanel">
              <span className="iv-typeBadge">{isProduct ? <FaShoppingBag /> : <FaTools />} {isProduct ? "PRODUTO" : "SERVIÇO"}</span>
              {itemImage ? (
                <img src={imageUrl(itemImage)} alt={item?.name || "Item"} />
              ) : (
                <div className="iv-mediaFallback" aria-label="Item sem imagem cadastrada">
                  <div className="iv-fallbackMark">{isProduct ? <FaShoppingBag /> : <FaTools />}</div>
                  <strong>{isProduct ? "Produto" : "Serviço"}</strong>
                  <span>{establishment?.name || "Rasoio"}</span>
                  <small><FaImage /> Imagem ainda não cadastrada</small>
                </div>
              )}
              <div className="iv-mediaShade" />
            </div>

            <div className="iv-infoPanel">
              {establishment?.name && (
                <button
                  type="button"
                  className="iv-establishment"
                  onClick={() => establishment?.slug && navigate(`/establishment/view/${establishment.slug}`)}
                >
                  {estLogo && <img src={imageUrl(estLogo)} alt="" />}
                  <span><small>Disponível em</small><strong>{establishment.name}</strong></span>
                  <FaStore />
                </button>
              )}
              <span className="iv-eyebrow">{isProduct ? "PRODUTO" : "RESERVE SEU HORÁRIO"}</span>
              <h1>{item?.name || item?.title || "Item"}</h1>
              <p className="iv-description">{description}</p>
              <div className="iv-purchaseRow">
                <div className="iv-price"><small>Valor</small><strong>{price}</strong></div>
                {duration && <div className="iv-duration"><FaClock /><span><small>Duração</small><strong>{duration}</strong></span></div>}
              </div>
              <div className="iv-actions">
                {canSchedule && <button type="button" className="iv-primary" onClick={handleOpenScheduleFromItem}><FaCalendarAlt /> Agendar este serviço</button>}
                {isProduct && whatsappLink && <a className="iv-primary" href={whatsappLink} target="_blank" rel="noreferrer"><FaWhatsapp /> Consultar no WhatsApp</a>}
                {!isProduct && whatsappLink && <a className="iv-secondary" href={whatsappLink} target="_blank" rel="noreferrer"><FaWhatsapp /> Dúvidas</a>}
              </div>
              <div className="iv-note">
                {isProduct
                  ? "Consulte disponibilidade diretamente com o estabelecimento."
                  : canSchedule
                    ? "Você poderá escolher o profissional e os horários disponíveis no próximo passo."
                    : "Este serviço ainda não possui agenda online disponível."}
              </div>
            </div>
          </section>

          {!isProduct && canSchedule && (
            <section className="iv-section">
              <div className="iv-heading"><span>QUEM REALIZA</span><h2>Escolha seu profissional</h2><p>Selecione quem você prefere para realizar este serviço.</p></div>
              <GlobalCarousel title="" subtitle="" items={employers.map((employer) => ({ ...employer, can_schedule: true }))} fmtBRL={(value) => value} navigate={navigate} openSchedulePopup={(employer) => openSchedulePopup({ employer, establishment: establishment || null, service: item, filteredEmployers: [employer] })} showSchedule showDots />
            </section>
          )}

          {Array.isArray(otherItems) && otherItems.length > 0 && (
            <section className="iv-section iv-section--related">
              <div className="iv-heading"><span>VOCÊ TAMBÉM PODE GOSTAR</span><h2>{isProduct ? "Outros produtos" : "Outros serviços"}</h2></div>
              <GlobalCarousel
                title=""
                subtitle="Mais opções deste estabelecimento"
                items={otherItems.map((otherItem) => ({
                  ...otherItem,
                  type: "item",
                  item_type: otherItem?.item_type || otherItem?.type || null,
                  image: otherItem?.imageUrl || otherItem?.image || otherItem?.image_url || null,
                  can_schedule: canSchedule && (otherItem?.item_type || otherItem?.type) !== "product",
                }))}
                fmtBRL={(value) => value}
                navigate={safeNavigate}
                openSchedulePopup={(otherItem) => {
                  const type = otherItem?.item_type || otherItem?.type;
                  if (type === "product" || !canSchedule) return;
                  openSchedulePopup({ service: otherItem, establishment: establishment || null, filteredEmployers: employers });
                }}
                showSchedule={!isProduct && canSchedule}
                showDots
              />
            </section>
          )}

          {establishment && <section className="iv-section iv-map"><div className="iv-heading"><span>LOCAL</span><h2>Onde encontrar</h2><p>{[establishment?.address, establishment?.city, establishment?.uf].filter(Boolean).join(" · ")}</p></div><GlobalMap location={establishment?.location} address={establishment?.address} city={establishment?.city} uf={establishment?.uf} /></section>}
        </div>
      </main>

      {canSchedule && <div className="iv-mobileAction"><button type="button" onClick={handleOpenScheduleFromItem}><FaCalendarAlt /> Agendar este serviço · {price}</button></div>}
      <GlobalWhatsappButton link={whatsappLink} message={whatsappMessage} />
      <ShareButton />
      <AppointmentWizardModal show={showWizard} onHide={() => setShowWizard(false)} employers={wizardEmployers} services={wizardServices} loadAvailableTimes={loadAvailableTimes} handleCreateAppointment={handleCreateAppointment} imageUrl={imageUrl} preselectedServiceId={preselectedServiceId} preselectedEmployer={preselectedEmployer} establishment={wizardEstablishment} />
    </>
  );
}
