// src/hooks/useSchedulePopup.js
import { useState } from "react";

const getFileUrlByType = (files, type) =>
  Array.isArray(files) ? files.find((f) => f?.type === type)?.public_url ?? null : null;

const mapEmployer = (emp) => {
  const firstName = emp?.user?.first_name || emp?.first_name || "";
  const lastName = emp?.user?.last_name || emp?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  const avatar =
    getFileUrlByType(emp?.user?.files, "avatar") ||
    getFileUrlByType(emp?.files, "avatar") ||
    getFileUrlByType(emp?.files, "image") ||
    null;

  return {
    ...emp,
    type: "employer",
    name: emp?.name || fullName || firstName || "Colaborador",
    first_name: firstName,
    last_name: lastName,
    avatar,
    image: emp?.image || avatar || null,
    user: emp?.user,
  };
};

const mapEstablishment = (est, fallbackAppId = 2) => {
  if (!est) return null;

  const logo =
    est?.images?.logo ||
    est?.logo ||
    est?.image ||
    getFileUrlByType(est?.files, "logo") ||
    getFileUrlByType(est?.files, "image") ||
    null;

  const bg =
    est?.images?.background ||
    getFileUrlByType(est?.files, "background") ||
    getFileUrlByType(est?.files, "cover") ||
    null;

  return {
    ...est,
    type: "establishment",
    id: est?.id ?? est?.establishment_id ?? est?.entity_id ?? est?.entityId ?? null,
    name: est?.name || est?.title || "Estabelecimento",
    app_id: est?.app_id || fallbackAppId || 2,
    image: logo || bg || est?.image || null,
    images: {
      ...(est?.images || {}),
      logo: est?.images?.logo || logo,
      background: est?.images?.background || bg,
    },
  };
};

export default function useSchedulePopup(apiBaseUrl, token, appId = 2) {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardEstablishment, setWizardEstablishment] = useState(null);
  const [wizardEmployers, setWizardEmployers] = useState([]);
  const [wizardServices, setWizardServices] = useState([]);
  const [preselectedEmployer, setPreselectedEmployer] = useState(null);
  const [preselectedServiceId, setPreselectedServiceId] = useState(null);

  const openSchedulePopup = async ({
    establishment = null,
    employer = null,
    service = null,
    filteredEmployers = null,
  }) => {
    setShowWizard(true);

    const mappedPreEmployer = employer ? mapEmployer(employer) : null;
    setPreselectedEmployer(mappedPreEmployer);

    const sid =
      service?.id ??
      service?.item_id ??
      service?.itemId ??
      service?.service_id ??
      null;

    setPreselectedServiceId(sid);

    const entityId =
      establishment?.id ||
      employer?.establishment_id ||
      employer?.establishmentId ||
      employer?.entity_id ||
      employer?.entityId ||
      employer?.establishment?.id ||
      service?.establishment_id ||
      service?.entity_id ||
      service?.entityId ||
      service?.establishment?.id ||
      null;

    const resolvedAppId =
      establishment?.app_id || employer?.app_id || service?.app_id || appId || 2;

    if (!entityId) {
      setWizardEstablishment(null);
      setWizardEmployers([]);
      setWizardServices([]);
      return;
    }

    // ✅ garante estabelecimento “completo” quando vier do HomePage (nome+logo)
    const normalizedEst =
      mapEstablishment(establishment, resolvedAppId) ||
      mapEstablishment(employer?.establishment, resolvedAppId) ||
      mapEstablishment(service?.establishment, resolvedAppId) ||
      mapEstablishment(
        {
          id: entityId,
          name:
            establishment?.name ||
            employer?.establishment_name ||
            employer?.establishmentName ||
            employer?.establishment?.name ||
            service?.establishment?.name ||
            "Estabelecimento",
          app_id: resolvedAppId,
        },
        resolvedAppId
      );

    setWizardEstablishment(normalizedEst);

    try {
      const itemRes = await fetch(`${apiBaseUrl}/item/list-by-entity/${entityId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const itemData = await itemRes.json().catch(() => ({}));

      setWizardServices(
        (itemData.items || []).map((item) => ({
          ...item,
          type: item.type === "product" ? "product" : "service",
          image:
            getFileUrlByType(item?.files, "image") ||
            getFileUrlByType(item?.files, "photo") ||
            getFileUrlByType(item?.files, "cover") ||
            null,
        }))
      );

      if (filteredEmployers && Array.isArray(filteredEmployers)) {
        const filtered = filteredEmployers
          .filter((e) => Number(e.establishment_id) === Number(entityId))
          .map(mapEmployer);

        setWizardEmployers(filtered);
        return;
      }

      const empRes = await fetch(
        `${apiBaseUrl}/employer/home/${resolvedAppId}?establishment_id=${entityId}`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }
      );
      const empData = await empRes.json().catch(() => ({}));

      setWizardEmployers(
        (empData.employers || [])
          .filter((e) => Number(e.establishment_id) === Number(entityId))
          .map(mapEmployer)
      );
    } catch {
      setWizardEstablishment(normalizedEst);
      setWizardEmployers([]);
      setWizardServices([]);
    }
  };

  return {
    showWizard,
    setShowWizard,
    wizardEstablishment,
    wizardEmployers,
    wizardServices,
    preselectedEmployer,
    preselectedServiceId,
    openSchedulePopup,
  };
}
