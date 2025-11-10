import React, { useState, useMemo } from "react";
import { Modal, Button } from "react-bootstrap";
import GlobalDateCarousel from "../GlobalDateCarousel";
import "./AppointmentWizard.css";

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

  const handleNext = async () => {
    if (step === 1 && !selectedServices.length) return;
    if (step === 2 && !selectedEmployer) return;
    if (step === 3 && selectedDate) {
      const times = await loadAvailableTimes(selectedDate, selectedEmployer, totalDuration);
      setAvailableTimes(times || []);
    }
    if (step === 4 && !selectedTime) return;
    if (step === 5) {
      const fixed = selectedServices.map((s) => ({
        id: s.id || s.item_id,
        item_id: s.item_id || s.id,
      }));
      await handleCreateAppointment(fixed, selectedEmployer, selectedDate, selectedTime);
      onHide();
      return;
    }
    setStep((p) => Math.min(5, p + 1));
  };

  const handleBack = () => setStep((p) => Math.max(1, p - 1));

  const fmtBRL = (v) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static" className="neon-modal">
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
                    <h5>{s.name}</h5>
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
              <p><b>Data:</b> {new Date(selectedDate).toLocaleDateString("pt-BR")}</p>
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
        <Button variant="info" onClick={handleNext}>
          {step === 5 ? "Confirmar" : "Avançar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
