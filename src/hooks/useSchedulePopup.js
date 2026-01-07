// src/hooks/useSchedulePopup.js
import { useState } from "react";

export default function useSchedulePopup(apiBaseUrl, token, placeholder) {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardEstablishment, setWizardEstablishment] = useState(null);
  const [wizardEmployers, setWizardEmployers] = useState([]);
  const [wizardServices, setWizardServices] = useState([]);
  const [preselectedEmployer, setPreselectedEmployer] = useState(null);
  const [preselectedService, setPreselectedService] = useState(null);

const openSchedulePopup = async ({ establishment = null, employer = null, service = null, filteredEmployers = null }) => {
  setPreselectedEmployer(employer || null);
  setPreselectedService(service || null);

  const estId = establishment?.id || service?.establishment_id || employer?.establishment_id;

  if (!estId) {
    setWizardEstablishment(null);
    setWizardEmployers(filteredEmployers || []);
    setWizardServices(service ? [service] : []);
    setShowWizard(true);
    return;
  }

  try {
    // Buscar serviços do establishment
    const itemRes = await fetch(`${apiBaseUrl}/item/list-by-entity/${estId}?token=${token}`);
    const itemData = await itemRes.json();

    const getFileUrlByType = (files, type) =>
      Array.isArray(files) ? files.find(f => f.type === type)?.public_url || null : null;

    const mappedServices = (itemData.items || []).map(item => ({
      ...item,
      type: item.type === "product" ? "product" : "service",
      image: getFileUrlByType(item.files, "image"),
    }));

    setWizardServices(mappedServices);
    setWizardEstablishment(establishment || { id: estId, name: "Estabelecimento" });

    // Se vier filteredEmployers, usa; senão busca da API
    if (filteredEmployers) {
      setWizardEmployers(filteredEmployers);
    } else {
      const empRes = await fetch(`${apiBaseUrl}/employer/home/2?establishment_id=${estId}&token=${token}`);
      const empData = await empRes.json();
      setWizardEmployers(empData.employers || []);
    }

  } catch (err) {
    console.error("Erro ao carregar dados do wizard:", err);
    setWizardEstablishment(null);
    setWizardEmployers(filteredEmployers || []);
    setWizardServices(service ? [service] : []);
  }

  setShowWizard(true);
};


  return {
    showWizard,
    setShowWizard,
    wizardEstablishment,
    wizardEmployers,
    wizardServices,
    preselectedEmployer,
    preselectedService,
    openSchedulePopup,
  };
}
