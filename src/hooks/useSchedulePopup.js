// src/hooks/useSchedulePopup.js
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

const PENDING_APPOINTMENT_KEY = "rasoio_pending_appointment";
const PENDING_APPOINTMENT_TTL = 30 * 60 * 1000;

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

const mapEstablishment = (establishment, fallbackAppId = 2) => {
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
    app_id: establishment?.app_id || fallbackAppId || 2,
    image: logo || background || establishment?.image || null,
    images: {
      ...(establishment?.images || {}),
      logo: establishment?.images?.logo || logo,
      background: establishment?.images?.background || background,
    },
  };
};

const compactEstablishment = (establishment) => {
  if (!establishment) return null;
  return {
    id: establishment?.id ?? establishment?.establishment_id ?? establishment?.entity_id ?? null,
    slug: establishment?.slug || null,
    name: establishment?.name || establishment?.title || null,
    app_id: establishment?.app_id || null,
    image: establishment?.image || null,
    logo: establishment?.logo || null,
    images: establishment?.images || null,
  };
};

const compactEmployer = (employer) => {
  if (!employer) return null;
  return {
    id: employer?.id || null,
    establishment_id: employer?.establishment_id || employer?.establishmentId || employer?.entity_id || null,
    app_id: employer?.app_id || null,
    name: employer?.name || null,
    first_name: employer?.first_name || employer?.user?.first_name || null,
    last_name: employer?.last_name || employer?.user?.last_name || null,
    image: employer?.image || employer?.avatar || null,
    avatar: employer?.avatar || null,
    user: employer?.user
      ? {
          id: employer.user.id || null,
          first_name: employer.user.first_name || null,
          last_name: employer.user.last_name || null,
          files: employer.user.files || [],
        }
      : null,
    establishment: compactEstablishment(employer?.establishment),
  };
};

const compactService = (service) => {
  if (!service) return null;
  return {
    id: service?.id || service?.item_id || service?.itemId || service?.service_id || null,
    item_id: service?.item_id || service?.id || null,
    establishment_id: service?.establishment_id || service?.entity_id || service?.entityId || null,
    entity_id: service?.entity_id || service?.establishment_id || null,
    app_id: service?.app_id || null,
    name: service?.name || service?.title || null,
    type: service?.type || service?.item_type || "service",
    price: service?.price ?? null,
    duration: service?.duration ?? null,
    image: service?.image || service?.image_url || null,
    establishment: compactEstablishment(service?.establishment),
  };
};

export default function useSchedulePopup(_apiBaseUrl, _token, appId = 2) {
  const navigate = useNavigate();
  const location = useLocation();

  const [showWizard, setShowWizard] = useState(false);
  const [wizardEstablishment, setWizardEstablishment] = useState(null);
  const [wizardEmployers, setWizardEmployers] = useState([]);
  const [wizardServices, setWizardServices] = useState([]);
  const [preselectedEmployer, setPreselectedEmployer] = useState(null);
  const [preselectedServiceId, setPreselectedServiceId] = useState(null);

  const prepareSchedulePopup = useCallback(
    async ({
      establishment = null,
      employer = null,
      service = null,
      filteredEmployers = null,
    } = {}) => {
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

      const resolvedAppId =
        establishment?.app_id || employer?.app_id || service?.app_id || appId || 2;

      if (!entityId) {
        setWizardEstablishment(null);
        setWizardEmployers([]);
        setWizardServices([]);
        setShowWizard(true);
        return;
      }

      const normalizedEstablishment =
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
              "Barbearia",
            app_id: resolvedAppId,
          },
          resolvedAppId
        );

      setWizardEstablishment(normalizedEstablishment);
      setWizardEmployers([]);
      setWizardServices([]);
      setShowWizard(true);

      try {
        const itemRequest = api.get(`/item/list-by-entity/${entityId}`);
        const employerRequest = Array.isArray(filteredEmployers)
          ? Promise.resolve(null)
          : api.get(`/employer/home/${resolvedAppId}`, {
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
            .filter((item) => item?.type !== "product")
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
            .filter((item) => Number(item.establishment_id) === Number(entityId))
            .map(mapEmployer)
        );
      } catch (error) {
        console.error("Erro ao preparar agendamento:", error);
        setWizardEstablishment(normalizedEstablishment);
        setWizardEmployers([]);
        setWizardServices([]);
      }
    },
    [appId]
  );

  const openSchedulePopup = useCallback(
    async ({
      establishment = null,
      employer = null,
      service = null,
      filteredEmployers = null,
    } = {}) => {
      const token = localStorage.getItem("token");

      if (!token) {
        const returnTo = `${location.pathname}${location.search || ""}${location.hash || ""}`;
        const pending = {
          createdAt: Date.now(),
          returnTo,
          payload: {
            establishment: compactEstablishment(establishment),
            employer: compactEmployer(employer),
            service: compactService(service),
          },
        };

        try {
          sessionStorage.setItem(PENDING_APPOINTMENT_KEY, JSON.stringify(pending));
        } catch (error) {
          console.warn("Não foi possível preservar a intenção de agendamento:", error);
        }

        navigate("/login", {
          state: {
            from: {
              pathname: location.pathname,
              search: location.search,
              hash: location.hash,
            },
            resumeAppointment: true,
          },
        });
        return false;
      }

      await prepareSchedulePopup({ establishment, employer, service, filteredEmployers });
      return true;
    },
    [location.hash, location.pathname, location.search, navigate, prepareSchedulePopup]
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let pending = null;
    try {
      const raw = sessionStorage.getItem(PENDING_APPOINTMENT_KEY);
      pending = raw ? JSON.parse(raw) : null;
    } catch {
      sessionStorage.removeItem(PENDING_APPOINTMENT_KEY);
      return;
    }

    if (!pending?.payload) return;

    const expired = Date.now() - Number(pending.createdAt || 0) > PENDING_APPOINTMENT_TTL;
    if (expired) {
      sessionStorage.removeItem(PENDING_APPOINTMENT_KEY);
      return;
    }

    const currentPath = `${location.pathname}${location.search || ""}${location.hash || ""}`;
    if (pending.returnTo && pending.returnTo !== currentPath) return;

    sessionStorage.removeItem(PENDING_APPOINTMENT_KEY);
    prepareSchedulePopup(pending.payload);
  }, [location.hash, location.pathname, location.search, prepareSchedulePopup]);

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
