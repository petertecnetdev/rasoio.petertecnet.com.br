// src/hooks/useSchedulePopup.js
import { useState } from "react";

export default function useSchedulePopup(apiBaseUrl, token) {
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
    setPreselectedEmployer(employer || null);
    setPreselectedServiceId(service?.id || service?.item_id || null);

    const entityId =
      establishment?.id ||
      employer?.establishment_id ||
      service?.entity_id ||
      service?.establishment_id;

    if (!entityId) {
      setWizardEstablishment(null);
      setWizardEmployers([]);
      setWizardServices([]);
      return;
    }

    setWizardEstablishment(
      establishment || {
        id: entityId,
        name: "Estabelecimento",
      }
    );

    try {
      const itemRes = await fetch(
        `${apiBaseUrl}/item/list-by-entity/${entityId}?token=${token}`
      );
      const itemData = await itemRes.json();

      const getFileUrlByType = (files, type) =>
        Array.isArray(files)
          ? files.find((f) => f.type === type)?.public_url || null
          : null;

      const mappedServices = (itemData.items || []).map((item) => ({
        ...item,
        type: item.type === "product" ? "product" : "service",
        image: getFileUrlByType(item.files, "image"),
      }));

      setWizardServices(mappedServices);

      if (filteredEmployers) {
        setWizardEmployers(
          filteredEmployers.filter(
            (e) => e.establishment_id === entityId
          )
        );
      } else {
        const empRes = await fetch(
          `${apiBaseUrl}/employer/home/2?establishment_id=${entityId}&token=${token}`
        );
        const empData = await empRes.json();
        setWizardEmployers(
          (empData.employers || []).filter(
            (e) => e.establishment_id === entityId
          )
        );
      }
    } catch (err) {
      setWizardEstablishment(null);
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
