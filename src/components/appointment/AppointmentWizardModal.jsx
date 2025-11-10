import React, { useState, useMemo, useLayoutEffect, useEffect } from "react";

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

  useLayoutEffect(() => {
    if (!show) return;
    setSelectedDate(null);
    setAvailableTimes([]);
    setSelectedTime(null);
    setCustomerCpf("");
    setCustomerPhone("");
    setLoading(false);

    requestAnimationFrame(() => {
      if (preselectedService) setSelectedServices([preselectedService]);
      else setSelectedServices([]);

      if (preselectedEmployer) {
        setSelectedEmployer(preselectedEmployer);
        setStep(1);
      } else {
        setSelectedEmployer(null);
        setStep(1);
      }
    });
  }, [show, preselectedService, preselectedEmployer]);


  useEffect(() => {
  const userData = localStorage.getItem("user");
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      const profile = parsed.profile || {};

      // 🔹 Preenche CPF e Telefone automaticamente se existirem
      if (profile.cpf || parsed.cpf) {
        setCustomerCpf(profile.cpf || parsed.cpf || "");
      }
      if (profile.phone || parsed.phone) {
        setCustomerPhone(profile.phone || parsed.phone || "");
      }
    } catch (err) {
      console.error("Erro ao carregar dados do usuário:", err);
    }
  }
}, [show]);



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
      return exists ? prev.filter((s) => (s.id || s.item_id) !== id) : [...prev, service];
    });
  };

  const fmtBRL = (v) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  const handleNext = async () => {
    if (loading) return;

    if (step === 1 && selectedServices.length === 0) {
      console.warn("Nenhum serviço selecionado — não avançar");
      return;
    }

    if ((step === 2 && !preselectedEmployer) && !selectedEmployer) {
      console.warn("Nenhum profissional selecionado — não avançar");
      return;
    }

    if (step === (preselectedEmployer ? 2 : 3) && selectedDate) {
      const dateSP = dayjs(selectedDate).format("YYYY-MM-DD");
      const times = await loadAvailableTimes(
        dateSP,
        selectedEmployer || preselectedEmployer,
        totalDuration
      );
      setAvailableTimes(times || []);
    }

    if (step === (preselectedEmployer ? 3 : 4) && !selectedTime) {
      console.warn("Nenhum horário selecionado — não avançar");
      return;
    }

    if (step === (preselectedEmployer ? 4 : 5)) {
      if (!customerPhone || !customerCpf) {
        MySwal.fire({
          icon: "warning",
          title: "Preencha os campos",
          text: "Informe seu CPF e telefone para continuar.",
          background: "#0a0a0c",
          color: "#fff",
          confirmButtonColor: "#00bcd4",
        });
        return;
      }

      try {
        setLoading(true);
        const dateString = `${selectedDate} ${selectedTime}`;
        const datetimeSP = dayjs.tz(dateString, "YYYY-MM-DD HH:mm", "America/Sao_Paulo");
        const isoDatetime = datetimeSP.format("YYYY-MM-DDTHH:mm:ssZ");

        let customerName = "Cliente App";
        let clientId = null;
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          clientId = parsed.id || null;
          customerName =
            `${parsed.first_name || ""} ${parsed.last_name || ""}`.trim() ||
            parsed.user_name ||
            "Cliente App";
        }

        const payload = {
          app_id: 2,
          entity_name: "establishment",
          entity_id:
            selectedEmployer?.establishment_id ||
            preselectedEmployer?.establishment_id ||
            7,
          items: selectedServices.map((s) => ({
            item_id: s.id || s.item_id,
            quantity: 1,
          })),
          client_id: clientId,
          customer_name: customerName,
          origin: "App",
          fulfillment: "dine-in",
          payment_status: "pending",
          payment_method: "Pix",
          notes: "Agendamento feito pelo aplicativo.",
          customer_phone: customerPhone,
          customer_cpf: customerCpf,
          order_datetime: isoDatetime,
          attendant_id: selectedEmployer?.id || preselectedEmployer?.id,
        };

        const token = localStorage.getItem("token");
        const res = await fetch(`${apiBaseUrl}/order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok) {
          await MySwal.fire({
            icon: "success",
            title: "Agendamento registrado com sucesso!",
            text: "Seu pedido foi enviado para o profissional.",
            background: "#0a0a0c",
            color: "#fff",
            confirmButtonColor: "#00bcd4",
          });
          onHide();
        } else {
          MySwal.fire({
            icon: "error",
            title: "Erro ao agendar",
            text: data?.message || "Não foi possível criar o agendamento.",
            background: "#0a0a0c",
            color: "#fff",
            confirmButtonColor: "#00bcd4",
          });
        }
      } catch (error) {
        console.error("Erro inesperado:", error);
      } finally {
        setLoading(false);
      }
      return;
    }

    const maxStep = preselectedEmployer ? 4 : 5;
    setStep((prev) => Math.min(maxStep, prev + 1));
  };

  const handleBack = () => setStep((prev) => Math.max(1, prev - 1));
  const showEmployerHeader = !!preselectedEmployer;

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static" className="neon-modal">
      <Modal.Body className="wizard-body">
        <div className="wizard-steps">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`step-dot ${step >= n ? "active" : ""}`} />
          ))}
        </div>

        {showEmployerHeader && (
          <div className="employer-selected-header">
            <div className="d-flex align-items-center gap-3 mb-3">
              <img
                src={imageUrl(preselectedEmployer?.user?.avatar)}
                alt={preselectedEmployer?.user?.first_name}
                className="rounded-circle"
                width="60"
                height="60"
                onError={(e) => (e.currentTarget.src = "/images/logo.png")}
              />
              <div>
                <h5 className="mb-0 text-light">{preselectedEmployer?.user?.first_name}</h5>
                <small className="text-muted">Profissional selecionado</small>
              </div>
            </div>
            <hr className="mb-4" />
          </div>
        )}

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

        {!preselectedEmployer && step === 2 && (
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

        {step === (preselectedEmployer ? 2 : 3) && (
          <div className="wizard-step fade-in">
            <h4>Escolha a Data</h4>
            <GlobalDateCarousel
              selectedDate={selectedDate}
              onChange={(d) => setSelectedDate(d)}
              daysToShow={14}
            />
          </div>
        )}

       {step === (preselectedEmployer ? 3 : 4) && (
  <div className="wizard-step fade-in">
    <h4>Escolha o Horário</h4>

    {availableTimes.length ? (
      <div className="grid-times">
        {availableTimes.map((t) => (
          <button
            key={t}
            className={`time-btn ${selectedTime === t ? "active" : ""}`}
            onClick={() => setSelectedTime(t)}
          >
            {t}
          </button>
        ))}
      </div>
    ) : (
      <div className="step-empty">
        <p>Nenhum horário disponível para esta data.</p>
        <Button
          variant="dark"
          onClick={handleBack}
          className="mt-3"
        >
          Voltar
        </Button>
      </div>
    )}
  </div>
)}


        {step === (preselectedEmployer ? 4 : 5) && (
          <div className="wizard-step fade-in">
            <h4>Confirmar Agendamento</h4>
            <div className="confirm-box">
              <p><b>Profissional:</b> {selectedEmployer?.user?.first_name || preselectedEmployer?.user?.first_name}</p>
              <p><b>Data:</b> {selectedDate?.split("-").reverse().join("/")}</p>
              <p><b>Horário:</b> {selectedTime}</p>

             <Row className="mb-3">
  <Col md={6}>
    <Form.Group>
      <Form.Label>CPF</Form.Label>
      <Form.Control
        type="text"
        placeholder="Digite seu CPF"
        value={customerCpf}
        onChange={(e) => setCustomerCpf(e.target.value)}
      />
    </Form.Group>
  </Col>

  <Col md={6}>
    <Form.Group>
      <Form.Label>Telefone</Form.Label>
      <Form.Control
        type="text"
        placeholder="Digite seu telefone"
        value={customerPhone}
        onChange={(e) => setCustomerPhone(e.target.value)}
      />
    </Form.Group>
  </Col>
</Row>


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
          {loading ? "Enviando..." : step === (preselectedEmployer ? 4 : 5) ? "Confirmar" : "Avançar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
