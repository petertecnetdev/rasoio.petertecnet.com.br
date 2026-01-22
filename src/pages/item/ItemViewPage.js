// src/pages/item/ItemViewPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios"; // ✅ FIX: axios import

import { apiBaseUrl, appId } from "../../config";

import useItemView from "../../hooks/useItemView";
import useAppointment from "../../hooks/useAppointment";
import useImageUtils from "../../hooks/useImageUtils";
import useSchedulePopup from "../../hooks/useSchedulePopup";
import useWhatsappLink from "../../hooks/useWhatsappLink";

import GlobalPageHeader from "../../components/GlobalPageHeader";
import GlobalCarousel from "../../components/GlobalCarousel";
import GlobalMap from "../../components/GlobalMap";
import GlobalProfileHero from "../../components/GlobalProfileHero";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";
import ShareButton from "../../components/ShareButton";

import "./ItemView.css";

const PLACEHOLDER = "/images/logo.png";

const getEstImages = (e = {}) => ({
  logo:
    e?.images?.logo ||
    e?.logo ||
    e?.logoImage ||
    e?.files?.find?.((f) => f?.type === "logo")?.public_url ||
    null,
  background:
    e?.images?.background ||
    e?.background ||
    e?.files?.find?.((f) => f?.type === "background")?.public_url ||
    null,
});

export default function ItemViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [slug]);

  const { item, establishment, employers, otherItems, isLoading, error } =
    useItemView(apiBaseUrl, slug, token, navigate);

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
    wizardEstablishment,
  );

  const whatsappLink = useWhatsappLink(establishment || item || null);

  const safeNavigate = useMemo(
    () => (path) => (window.location.href = path),
    [],
  );

  const isProduct = useMemo(() => {
    const t = item?.item_type || item?.type || null;
    return (
      t === "product" ||
      item?.is_product === true ||
      item?.isProduct === true ||
      !!item?.product_id ||
      !!item?.productId
    );
  }, [item]);

  const headerMeta = useMemo(() => {
    const kind = isProduct ? "Produto" : "Serviço";
    const cityUf =
      establishment?.city && establishment?.uf
        ? `${establishment.city} - ${establishment.uf}`
        : establishment?.city || establishment?.uf || "";
    const estName = establishment?.name || "";
    return [kind, cityUf, estName].filter(Boolean);
  }, [establishment, isProduct]);

  const heroLogo = useMemo(() => {
    return (
      item?.imageUrl ||
      item?.image ||
      item?.image_url ||
      item?.files?.find((f) => f?.type === "image")?.public_url ||
      item?.files?.find((f) => f?.type === "cover")?.public_url ||
      null
    );
  }, [item]);

  const heroBg = useMemo(() => {
    return (
      establishment?.images?.background ||
      establishment?.background ||
      establishment?.files?.find((f) => f?.type === "background")?.public_url ||
      null
    );
  }, [establishment]);

  const chips = useMemo(() => {
    const price =
      item?.price != null && item?.price !== ""
        ? `R$ ${Number(item.price).toFixed(2).replace(".", ",")}`
        : null;

    const duration =
      !isProduct && item?.duration != null && item?.duration !== ""
        ? `${item.duration} min`
        : null;

    return [
      isProduct ? { label: "Produto" } : { label: "Serviço" },
      establishment?.name ? { label: establishment.name } : null,
      price ? { label: price } : null,
      duration ? { label: duration } : null,
    ].filter(Boolean);
  }, [item, establishment, isProduct]);

  const heroStats = useMemo(() => {
    const m = item?.metrics || null;
    if (!m) return [];
    const stats = [];
    if (m?.total_views != null)
      stats.push({ label: "Visualizações", value: m.total_views });
    if (!isProduct && m?.completed_orders != null)
      stats.push({ label: "Atendimentos", value: m.completed_orders });
    return stats.slice(0, 6);
  }, [item, isProduct]);

  const handleOpenScheduleFromItem = useCallback(async () => {
    try {
      if (isProduct) {
        Swal.fire({
          icon: "info",
          title: "Produto",
          text: "Produtos não possuem agendamento.",
        });
        return;
      }

      await openSchedulePopup({
        service: item,
        establishment: establishment || null,
        filteredEmployers: Array.isArray(employers) ? employers : [],
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível abrir o agendamento agora.",
      });
    }
  }, [openSchedulePopup, item, establishment, employers, isProduct]);

  const handleOpenFromEstablishment = useCallback(
    async (est) => {
      try {
        await openSchedulePopup({
          establishment: est,
          filteredEmployers: [],
        });
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível abrir o agendamento agora.",
        });
      }
    },
    [openSchedulePopup],
  );

  const asideEstablishment = useMemo(() => {
    if (!establishment) return null;

    const title =
      establishment?.name || establishment?.fantasy || "Estabelecimento";
    const subtitle =
      establishment?.city || establishment?.uf
        ? `${establishment?.city || ""}${
            establishment?.city && establishment?.uf ? " - " : ""
          }${establishment?.uf || ""}`
        : "";

    const image = getEstImages(establishment).logo;


    const canGoDetails = !!establishment?.slug;

    return {
      title,
      subtitle,
      image,
      clickable: canGoDetails,
      onClick: () => {
        if (canGoDetails) navigate(`/establishment/view/${establishment.slug}`);
      }
    };
  }, [establishment, navigate, isProduct]);

  const [otherEstablishments, setOtherEstablishments] = useState([]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        if (!establishment) {
          if (active) setOtherEstablishments([]);
          return;
        }

        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const entityKey = establishment?.slug || establishment?.id || null;

        if (!entityKey) {
          if (active) setOtherEstablishments([]);
          return;
        }

        const res = await axios.get(
          `${apiBaseUrl}/establishment/list-others/${entityKey}`,
          {
            headers,
          },
        );

        if (!active) return;

        const list = Array.isArray(res?.data?.establishments)
          ? res.data.establishments
          : Array.isArray(res?.data)
            ? res.data
            : [];

        setOtherEstablishments(
          list.map((e) => ({
            ...e,
            type: "establishment",
            images: getEstImages(e),
          })),
        );
      } catch (e) {
        if (active) setOtherEstablishments([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, token, establishment]);

  if (isLoading) {
    return (
      <div className="wrapper">
        <GlobalPageHeader
          title="Item"
          variant="item"
          description="Carregando item..."
          meta={headerMeta}
          compact
        />
        <div className="loading">Carregando…</div>
      </div>
    );
  }

  if (!item || error) {
    const msg =
      error?.message ||
      error?.error ||
      (typeof error === "string" ? error : null) ||
      "Não foi possível carregar este item.";

    return (
      <div className="wrapper">
        <GlobalPageHeader
          title="Item"
          variant="item"
          description="Não foi possível carregar este item."
          meta={headerMeta}
          compact
        />
        <div className="loading">{msg}</div>
      </div>
    );
  }

  return (
    <>
      <div className="wrapper">
        <GlobalProfileHero
          title={item?.name || item?.title || "Item"}
          logoSrc={heroLogo}
          bgSrc={heroBg}
          imageUrl={imageUrl}
          placeholder={PLACEHOLDER}
          chips={chips}
          stats={heroStats}
          primaryAction={
            isProduct
              ? {
                  label: "Produto",
                  disabled: true,
                  title: "Produto não possui agendamento",
                  onClick: () => {},
                }
              : {
                  label: "Agendar agora",
                  onClick: handleOpenScheduleFromItem,
                }
          }
          secondaryAction={{
            label: "WhatsApp",
            href: whatsappLink || undefined,
            disabled: !whatsappLink,
            title: !whatsappLink ? "Telefone não informado" : undefined,
          }}
          aside={asideEstablishment}
        />

        <div className="sections">
          {!isProduct && Array.isArray(employers) && employers.length > 0 && (
            <GlobalCarousel
              title="Profissionais"
              subtitle="Escolha com quem você quer agendar"
              items={employers}
              fmtBRL={(v) => v}
              navigate={navigate}
              openSchedulePopup={(emp) => {
                try {
                  openSchedulePopup({
                    employer: emp,
                    establishment: establishment || null,
                    service: item,
                    filteredEmployers: [emp],
                  });
                } catch (e) {
                  console.error(e);
                  Swal.fire({
                    icon: "error",
                    title: "Erro",
                    text: "Não foi possível abrir o agendamento agora.",
                  });
                }
              }}
              showSchedule
              showDots
            />
          )}

          {Array.isArray(otherItems) && otherItems.length > 0 && (
            <GlobalCarousel
              title={isProduct ? "Outros produtos" : "Outros serviços"}
              subtitle={
                isProduct
                  ? "Veja outros produtos deste estabelecimento"
                  : "Veja outros serviços deste estabelecimento"
              }
              items={otherItems.map((it) => ({
                ...it,
                type: "item",
                item_type: it?.item_type || it?.type || null,
                image: it?.imageUrl || it?.image || it?.image_url || null,
              }))}
              fmtBRL={(v) => v}
              navigate={safeNavigate}
              openSchedulePopup={(it) => {
                const t = it?.item_type || it?.type;
                if (t === "product") return;
                try {
                  openSchedulePopup({
                    service: it,
                    establishment: establishment || null,
                    filteredEmployers: Array.isArray(employers)
                      ? employers
                      : [],
                  });
                } catch (e) {
                  console.error(e);
                  Swal.fire({
                    icon: "error",
                    title: "Erro",
                    text: "Não foi possível abrir o agendamento agora.",
                  });
                }
              }}
              showSchedule={!isProduct}
              showDots
            />
          )}

          {establishment && (
            <GlobalMap
              location={establishment?.location}
              address={establishment?.address}
              city={establishment?.city}
              uf={establishment?.uf}
            />
          )}

          {Array.isArray(otherEstablishments) &&
            otherEstablishments.length > 0 && (
              <GlobalCarousel
                title="Outros estabelecimentos"
                subtitle="Descubra outras opções"
                items={otherEstablishments}
                fmtBRL={(v) => v}
                navigate={safeNavigate}
                openSchedulePopup={handleOpenFromEstablishment}
                showSchedule
                showDots
              />
            )}
        </div>
      </div>

      <ShareButton />

      <AppointmentWizardModal
        show={showWizard}
        onHide={() => setShowWizard(false)}
        employers={wizardEmployers}
        services={wizardServices}
        loadAvailableTimes={loadAvailableTimes}
        handleCreateAppointment={handleCreateAppointment}
        imageUrl={imageUrl}
        preselectedServiceId={preselectedServiceId}
        preselectedEmployer={preselectedEmployer}
        establishment={wizardEstablishment}
      />
    </>
  );
}
