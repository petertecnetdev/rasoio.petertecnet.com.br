import React, { useState, useMemo, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import GlobalDateCarousel from "../GlobalDateCarousel";
import { apiBaseUrl } from "../../config";
import "./AppointmentWizardModal.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(tz);

const MySwal = withReactContent(Swal);

export default function AppointmentWizardModal({
  show,
  onHide,
  employers = [],
  services = [],
  loadAvailableTimes,
  imageUrl,
  preselectedService = null,
  preselectedEmployer = null,
  preselectedEstablishment = null,
}) {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customerCpf, setCustomerCpf] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const hasPreselectedEmployer = !!preselectedEmployer;
  const finalStep = hasPreselectedEmployer ? 4 : 5;

  useEffect(() => {
    if (!show) return;

    setStep(1);
    setSelectedServices(preselectedService ? [preselectedService] : []);
    setSelectedEmployer(preselectedEmployer || null);
    setSelectedDate(null);
    setAvailableTimes([]);
    setSelectedTime(null);
    setLoading(false);

    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const profile = parsed.profile || {};
        setCustomerCpf(profile.cpf || parsed.cpf || "");
        setCustomerPhone(profile.phone || parsed.phone || "");
      } catch {
        setCustomerCpf("");
        setCustomerPhone("");
      }
    }
  }, [show, preselectedService, preselectedEmployer, preselectedEstablishment]);

  const establishmentId = useMemo(() => {
    if (preselectedEstablishment?.id) return preselectedEstablishment.id;
    if (preselectedEmployer?.establishment_id) return preselectedEmployer.establishment_id;
    if (selectedEmployer?.establishment_id) return selectedEmployer.establishment_id;
    if (preselectedService?.establishment_id) return preselectedService.establishment_id;
    if (selectedServices.length && selectedServices[0].establishment_id)
      return selectedServices[0].establishment_id;
    return null;
  }, [
    preselectedEstablishment,
    preselectedEmployer,
    selectedEmployer,
    preselectedService,
    selectedServices,
  ]);

  const filteredServices = useMemo(() => {
    if (!establishmentId) return services;
    return services.filter(
      (s) =>
        s.establishment_id === establishmentId ||
        s.establishment?.id === establishmentId
    );
  }, [services, establishmentId]);

  const filteredEmployers = useMemo(() => {
    if (!establishmentId) return employers;
    return employers.filter(
      (e) => e.establishment_id === establishmentId
    );
  }, [employers, establishmentId]);

  const totalDuration = useMemo(
    () =>
      selectedServices.reduce(
        (sum, s) => sum + (parseInt(s.duration, 10) || 30),
        0
      ),
    [selectedServices]
  );

  const totalValue = useMemo(
    () =>
      selectedServices.reduce(
        (sum, s) => sum + (parseFloat(s.price) || 0),
        0
      ),
    [selectedServices]
  );

  const handleServiceToggle = (service) => {
    const id = service.id || service.item_id;
    setSelectedServices((prev) =>
      prev.some((s) => (s.id || s.item_id) === id)
        ? prev.filter((s) => (s.id || s.item_id) !== id)
        : [...prev, service]
    );
  };

  const fmtBRL = (v) =>
    `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  const handleNext = async () => {
    if (loading) return;

    if (step === 1) {
      if (!selectedServices.length) return;
      setStep(2);
      return;
    }

    if (!hasPreselectedEmployer && step === 2) {
      if (!selectedEmployer) return;
      setStep(3);
      return;
    }

    if (step === (hasPreselectedEmployer ? 2 : 3)) {
      if (!selectedDate) return;

      try {
        setLoading(true);
        const times = await loadAvailableTimes(
          dayjs(selectedDate).format("YYYY-MM-DD"),
          selectedEmployer || preselectedEmployer,
          totalDuration
        );
        setAvailableTimes(Array.isArray(times) ? times : []);
      } finally {
        setLoading(false);
      }

      setStep((s) => s + 1);
      return;
    }

    if (step === (hasPreselectedEmployer ? 3 : 4)) {
      if (!selectedTime) return;
      setStep(finalStep);
      return;
    }

    if (step === finalStep) {
      try {
        setLoading(true);

        const dateString = `${dayjs(selectedDate).format("YYYY-MM-DD")} ${selectedTime}`;
        const isoDatetime = dayjs
          .tz(dateString, "YYYY-MM-DD HH:mm", "America/Sao_Paulo")
          .format("YYYY-MM-DDTHH:mm:ssZ");

        const userData = JSON.parse(localStorage.getItem("user") || "{}");

        const payload = {
          mode: "appointment",
          app_id: 2,
          entity_name: "establishment",
          entity_id: establishmentId,
          items: selectedServices.map((s) => ({
            item_id: s.id || s.item_id,
            quantity: 1,
          })),
          client_id: userData.id || null,
          customer_name:
            `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
            "Cliente App",
          customer_phone: customerPhone,
          customer_cpf: customerCpf,
          origin: "App",
          fulfillment: "dine-in",
          payment_status: "pending",
          payment_method: "Pix",
          notes: "Agendamento feito pelo aplicativo.",
          order_datetime: isoDatetime,
          attendant_id: (selectedEmployer || preselectedEmployer)?.id || null,
        };

        const res = await fetch(`${apiBaseUrl}/order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error();

        await MySwal.fire("Sucesso", "Agendamento criado.", "success");
        onHide();
      } catch {
        MySwal.fire("Erro", "Falha ao criar agendamento.", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Modal.Body>
        {step === 1 && (
          <div className="wizard-step">
            <h4>Escolha os Serviços</h4>
            <div className="grid">
              {filteredServices.map((s) => (
                <div
                  key={s.id || s.item_id}
                  className={`card-service ${
                    selectedServices.some(
                      (x) => (x.id || x.item_id) === (s.id || s.item_id)
                    )
                      ? "active"
                      : ""
                  }`}
                  onClick={() => handleServiceToggle(s)}
                >
                  <h5>{s.name}</h5>
                  <p>{fmtBRL(s.price)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasPreselectedEmployer && step === 2 && (
          <div className="wizard-step">
            <h4>Escolha o Profissional</h4>
            <div className="grid">
              {filteredEmployers.map((e) => (
                <div
                  key={e.id}
                  className={`card-emp ${
                    selectedEmployer?.id === e.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedEmployer(e)}
                >
                  <img
                    src={imageUrl(e.user?.avatar)}
                    alt={e.user?.first_name}
                  />
                  <strong>{e.user?.first_name}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === (hasPreselectedEmployer ? 2 : 3) && (
          <GlobalDateCarousel
            selectedDate={selectedDate}
            onChange={setSelectedDate}
          />
        )}

        {step === (hasPreselectedEmployer ? 3 : 4) && (
          <div className="grid-times">
            {availableTimes.map((t) => (
              <button
                key={t}
                className={selectedTime === t ? "active" : ""}
                onClick={() => setSelectedTime(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={handleBack} disabled={step === 1}>
          Voltar
        </Button>
        <Button onClick={handleNext} disabled={loading}>
          {step === finalStep ? "Confirmar" : "Avançar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
