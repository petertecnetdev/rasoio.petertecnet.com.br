import React, { useState, useMemo } from "react";
import { Modal, Button } from "react-bootstrap";
import GlobalDateCarousel from "../GlobalDateCarousel";
import { apiBaseUrl } from "../../config";
import "./AppointmentWizardModal.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(tz);

export default function AppointmentWizardModal({
  show,
  onHide,
  employers = [],
  services = [],
  loadAvailableTimes,
  handleCreateAppointment,
  imageUrl,
}) {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (parseInt(s.duration) || 30), 0),
    [selectedServices]
  );

  const totalValue = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0),
    [selectedServices]
  );

  const handleServiceToggle = (service) => {
    const id = service.id || service.item_id;
    setSelectedServices((prev) => {
      const exists = prev.some((s) => (s.id || s.item_id) === id);
      if (exists) return prev.filter((s) => (s.id || s.item_id) !== id);
      return [...prev, service];
    });
  };

  const fmtBRL = (v) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  const handleNext = async () => {
    if (loading) return;

    if (step === 1 && !selectedServices.length) return;
    if (step === 2 && !selectedEmployer) return;
    if (step === 3 && selectedDate) {
      const times = await loadAvailableTimes(selectedDate, selectedEmployer, totalDuration);
      setAvailableTimes(times || []);
    }
    if (step === 4 && !selectedTime) return;

    if (step === 5) {
      try {
        setLoading(true);

        const dateString = `${selectedDate} ${selectedTime}`;
        const datetimeSP = dayjs.tz(dateString, "YYYY-MM-DD HH:mm", "America/Sao_Paulo");
        const isoDatetime = datetimeSP.format("YYYY-MM-DDTHH:mm:ssZ");

        const payload = {
          app_id: 2,
          entity_name: "establishment",
          entity_id: selectedEmployer?.establishment_id || 7,
          items: selectedServices.map((s) => ({
            item_id: s.id || s.item_id,
            quantity: 1,
          })),
          customer_name: localStorage.getItem("user_name") || "Cliente App",
          origin: "App",
          fulfillment: "dine-in",
          payment_status: "pending",
          payment_method: "Pix",
          notes: "Agendamento feito pelo aplicativo.",
          customer_phone: localStorage.getItem("user_phone") || "62999999999",
          customer_cpf: localStorage.getItem("user_cpf") || "12345678900",
          order_datetime: isoDatetime,
          attendant_id: selectedEmployer?.id,
        };

        console.log("📅 Payload sendo enviado:", payload);

        const token = localStorage.getItem("token");
        const res = await fetch(`${apiBaseUrl}/order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok) {
          alert("✅ Agendamento registrado com sucesso!");
          onHide();
          setStep(1);
          setSelectedServices([]);
          setSelectedEmployer(null);
          setSelectedDate(null);
          setSelectedTime(null);
        } else {
          console.error("Erro ao agendar:", data);
          alert(data?.message || "Erro ao criar agendamento. Verifique os dados e tente novamente.");
        }
      } catch (error) {
        console.error("Erro ao criar agendamento:", error);
        alert("Erro inesperado ao enviar o agendamento.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setStep((prev) => Math.min(5, prev + 1));
  };

  const handleBack = () => setStep((prev) => Math.max(1, prev - 1));

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      backdrop="static"
      className="neon-modal"
    >
      <Modal.Body className="wizard-body">
        <div className="wizard-steps">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className={`step-dot ${step >= n ? "active" : ""}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="wizard-step fade-in">
            <h4>Escolha os Serviços</h4>
            <div className="grid">
              {services.map((s) => {
                const id = s.id || s.item_id;
                const active = selectedServices.some((x) => (x.id || x.item_id) === id);
                return (
                  <div
                    key={id}
                    className={`card-service ${active ? "active" : ""}`}
                    onClick={() => handleServiceToggle(s)}
                  >
                    <h5>{s.name || "Serviço"}</h5>
                    <p>{fmtBRL(s.price)}</p>
                    <small>{s.duration || 30} min</small>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-step fade-in">
            <h4>Escolha o Profissional</h4>
            <div className="grid">
              {employers.map((e) => (
                <div
                  key={e.id}
                  className={`card-emp ${selectedEmployer?.id === e.id ? "active" : ""}`}
                  onClick={() => setSelectedEmployer(e)}
                >
                  <img
                    src={imageUrl(e.user?.avatar)}
                    alt={e.user?.first_name}
                    onError={(ev) => (ev.currentTarget.src = "/images/logo.png")}
                  />
                  <strong>{e.user?.first_name}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-step fade-in">
            <h4>Escolha a Data</h4>
            <GlobalDateCarousel
              selectedDate={selectedDate}
              onChange={(d) => setSelectedDate(d)}
              daysToShow={14}
            />
          </div>
        )}

        {step === 4 && (
          <div className="wizard-step fade-in">
            <h4>Escolha o Horário</h4>
            <div className="grid-times">
              {availableTimes.length ? (
                availableTimes.map((t) => (
                  <button
                    key={t}
                    className={`time-btn ${selectedTime === t ? "active" : ""}`}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </button>
                ))
              ) : (
                <p className="empty-text">Nenhum horário disponível.</p>
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="wizard-step fade-in">
            <h4>Confirmar Agendamento</h4>
            <div className="confirm-box">
              <p><b>Profissional:</b> {selectedEmployer?.user?.first_name}</p>
              <p><b>Data:</b> {selectedDate ? new Date(selectedDate).toLocaleDateString("pt-BR") : ""}</p>
              <p><b>Horário:</b> {selectedTime}</p>
              <ul>
                {selectedServices.map((s) => (
                  <li key={s.id}>{s.name} - {fmtBRL(s.price)}</li>
                ))}
              </ul>
              <hr />
              <p><b>Total:</b> {fmtBRL(totalValue)} | <b>Duração:</b> {totalDuration} min</p>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="wizard-footer">
        <Button variant="secondary" onClick={onHide}>Cancelar</Button>
        {step > 1 && <Button variant="dark" onClick={handleBack}>Voltar</Button>}
        <Button variant="info" onClick={handleNext} disabled={loading}>
          {loading ? "Enviando..." : step === 5 ? "Confirmar" : "Avançar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
