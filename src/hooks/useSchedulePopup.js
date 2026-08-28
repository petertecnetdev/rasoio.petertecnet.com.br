// src/hooks/useSchedulePopup.js
import { useCallback, useState } from "react";
import { appId as rasoioAppId } from "../config";
import api from "../services/api";

const getFileUrlByType = (files, type) =>
  Array.isArray(files) ? files.find((file) => file?.type === type)?.public_url ?? null : null;

const mapEmployer = (employer) => {
  const firstName = employer?.user?.first_name || employer?.first_name || "";
  const lastName = employer?.user?.last_name || employer?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const avatar =
    getFileUrlByType(employer?.user?.files, "avatar") ||
    getFileUrlByType(employer?.files, "avatar") ||
    getFileUrlByType(employer?.files, "image") ||
    null;

  return {
    ...employer,
    type: "employer",
    name: employer?.name || fullName || firstName || "Barbeiro",
    first_name: firstName,
    last_name: lastName,
    avatar,
    image: employer?.image || avatar || null,
    user: employer?.user,
  };
};

const mapEstablishment = (establishment) => {
  if (!establishment) return null;

  const logo =
    establishment?.images?.logo ||
    establishment?.logo ||
    establishment?.image ||
    getFileUrlByType(establishment?.files, "logo") ||
    getFileUrlByType(establishment?.files, "image") ||
    null;
  const background =
    establishment?.images?.background ||
    getFileUrlByType(establishment?.files, "background") ||
    getFileUrlByType(establishment?.files, "cover") ||
    null;

  return {
    ...establishment,
    type: "establishment",
    id:
      establishment?.id ??
      establishment?.establishment_id ??
      establishment?.entity_id ??
      establishment?.entityId ??
      null,
    name: establishment?.name || establishment?.title || "Barbearia",
    app_id: rasoioAppId,
    image: logo || background || establishment?.image || null,
    images: {
      ...(establishment?.images || {}),
      logo: establishment?.images?.logo || logo,
      background: establishment?.images?.background || background,
    },
  };
};

const getEntityAppId = (...entities) => {
  for (const entity of entities) {
    const value = entity?.app_id ?? entity?.application_id ?? entity?.app?.id ?? null;
    if (value != null) return Number(value);
  }
  return null;
};

export default function useSchedulePopup(_apiBaseUrl, _token, _appId = rasoioAppId) {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardEstablishment, setWizardEstablishment] = useState(null);
  const [wizardEmployers, setWizardEmployers] = useState([]);
  const [wizardServices, setWizardServices] = useState([]);
  const [preselectedEmployer, setPreselectedEmployer] = useState(null);
  const [preselectedServiceId, setPreselectedServiceId] = useState(null);

  const openSchedulePopup = useCallback(
    async ({
      establishment = null,
      employer = null,
      service = null,
      filteredEmployers = null,
    }) => {
      const declaredAppId = getEntityAppId(
        establishment,
        employer,
        employer?.establishment,
        service,
        service?.establishment
      );

      if (declaredAppId != null && declaredAppId !== Number(rasoioAppId)) {
        setPreselectedEmployer(null);
        setPreselectedServiceId(null);
        setWizardEstablishment(null);
        setWizardEmployers([]);
        setWizardServices([]);
        setShowWizard(true);
        return;
      }

      const mappedPreEmployer = employer ? mapEmployer(employer) : null;
      setPreselectedEmployer(mappedPreEmployer);
      setPreselectedServiceId(
        service?.id ?? service?.item_id ?? service?.itemId ?? service?.service_id ?? null
      );

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

      if (!entityId) {
        setWizardEstablishment(null);
        setWizardEmployers([]);
        setWizardServices([]);
        setShowWizard(true);
        return;
      }

      const normalizedEstablishment =
        mapEstablishment(establishment) ||
        mapEstablishment(employer?.establishment) ||
        mapEstablishment(service?.establishment) ||
        mapEstablishment({
          id: entityId,
          name:
            establishment?.name ||
            employer?.establishment_name ||
            employer?.establishmentName ||
            employer?.establishment?.name ||
            service?.establishment?.name ||
            "Barbearia",
        });

      setWizardEstablishment(normalizedEstablishment);
      setWizardEmployers([]);
      setWizardServices([]);
      setShowWizard(true);

      try {
        const itemRequest = api.get(`/item/list-by-entity/${entityId}`);
        const employerRequest = Array.isArray(filteredEmployers)
          ? Promise.resolve(null)
          : api.get(`/employer/home/${rasoioAppId}`, {
              params: { establishment_id: entityId },
            });

        const [itemResponse, employerResponse] = await Promise.all([
          itemRequest,
          employerRequest,
        ]);

        const items = Array.isArray(itemResponse?.data?.items)
          ? itemResponse.data.items
          : [];
        setWizardServices(
          items
            .filter((item) => {
              const itemAppId = item?.app_id ?? item?.establishment?.app_id ?? null;
              return (
                item?.type !== "product" &&
                (itemAppId == null || Number(itemAppId) === Number(rasoioAppId))
              );
            })
            .map((item) => ({
              ...item,
              type: "service",
              image:
                getFileUrlByType(item?.files, "image") ||
                getFileUrlByType(item?.files, "photo") ||
                getFileUrlByType(item?.files, "cover") ||
                null,
            }))
        );

        const employerSource = Array.isArray(filteredEmployers)
          ? filteredEmployers
          : Array.isArray(employerResponse?.data?.employers)
            ? employerResponse.data.employers
            : [];

        setWizardEmployers(
          employerSource
            .filter((item) => {
              const employerAppId = item?.app_id ?? item?.establishment?.app_id ?? null;
              return (
                Number(item?.establishment_id ?? item?.establishment?.id) === Number(entityId) &&
                (employerAppId == null || Number(employerAppId) === Number(rasoioAppId))
              );
            })
            .map(mapEmployer)
        );
      } catch {
        setWizardEstablishment(normalizedEstablishment);
        setWizardEmployers([]);
        setWizardServices([]);
      }
    },
    []
  );

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
