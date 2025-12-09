// src/components/appointment/AppointmentWizardModal.jsx
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
      } catch (err) {
        console.error("Erro ao carregar usuário:", err);
        setCustomerCpf("");
        setCustomerPhone("");
      }
    } else {
      setCustomerCpf("");
      setCustomerPhone("");
    }
  }, [show, preselectedService, preselectedEmployer]);

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
    setSelectedServices((prev) => {
      const exists = prev.some((s) => (s.id || s.item_id) === id);
      return exists
        ? prev.filter((s) => (s.id || s.item_id) !== id)
        : [...prev, service];
    });
  };

  const fmtBRL = (v) =>
    `R$ ${Number(v || 0)
      .toFixed(2)
      .replace(".", ",")}`;

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
        const dateSP =
          typeof selectedDate === "string"
            ? selectedDate
            : dayjs(selectedDate).format("YYYY-MM-DD");
        const times = await loadAvailableTimes(
          dateSP,
          selectedEmployer || preselectedEmployer,
          totalDuration
        );
        setAvailableTimes(Array.isArray(times) ? times : []);
      } catch (err) {
        console.error("Erro ao carregar horários:", err);
        setAvailableTimes([]);
      } finally {
        setLoading(false);
      }

      setStep((prev) => prev + 1);
      return;
    }

    if (step === (hasPreselectedEmployer ? 3 : 4)) {
      if (!selectedTime) return;
      setStep(finalStep);
      return;
    }

    if (step === finalStep) {
      if (!customerCpf || !customerPhone) {
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

        const dateBase =
          typeof selectedDate === "string"
            ? selectedDate
            : dayjs(selectedDate).format("YYYY-MM-DD");

        const dateString = `${dateBase} ${selectedTime}`;
        const datetimeSP = dayjs.tz(
          dateString,
          "YYYY-MM-DD HH:mm",
          "America/Sao_Paulo"
        );
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
          mode: "appointment",
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
            text:
              data?.message ||
              data?.error ||
              "Não foi possível criar o agendamento.",
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
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const stepsArray = hasPreselectedEmployer ? [1, 2, 3, 4] : [1, 2, 3, 4, 5];

  const renderServicesStep = () => {
    const preId = preselectedService
      ? preselectedService.id || preselectedService.item_id
      : null;

    const listBase = Array.isArray(services) ? services : [];
    const hasPreInList =
      preId &&
      listBase.some((s) => (s.id || s.item_id) === preId);

    const list = hasPreInList || !preselectedService
      ? listBase
      : [preselectedService, ...listBase];

    return (
      <div className="wizard-step">
        <h4>Escolha os Serviços</h4>
        <div className="grid">
          {list && list.length ? (
            list.map((s) => {
              const id = s.id || s.item_id;
              const active = selectedServices.some(
                (x) => (x.id || x.item_id) === id
              );
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
            })
          ) : (
            <div className="step-empty">
              <p>Nenhum serviço disponível.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEmployersStep = () => {
    if (hasPreselectedEmployer) return null;

    return (
      <div className="wizard-step">
        <h4>Escolha o Profissional</h4>
        <div className="grid">
          {employers && employers.length ? (
            employers.map((e) => (
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
                  onError={(ev) => (ev.currentTarget.src = "/images/logo.png")}
                />
                <strong>{e.user?.first_name}</strong>
              </div>
            ))
          ) : (
            <div className="step-empty">
              <p>Nenhum profissional disponível.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDateStep = () => (
    <div className="wizard-step">
      <h4>Escolha a Data</h4>
      <GlobalDateCarousel
        selectedDate={selectedDate}
        onChange={(d) => setSelectedDate(d)}
        daysToShow={14}
      />
    </div>
  );

  const renderTimeStep = () => (
    <div className="wizard-step">
      <h4>Escolha o Horário</h4>
      {availableTimes && availableTimes.length ? (
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
          <Button variant="dark" onClick={handleBack} className="mt-3">
            Voltar
          </Button>
        </div>
      )}
    </div>
  );

  const renderConfirmStep = () => {
    const dateBase =
      typeof selectedDate === "string"
        ? selectedDate
        : selectedDate
        ? dayjs(selectedDate).format("YYYY-MM-DD")
        : "";

    return (
      <div className="wizard-step">
        <h4>Confirmar Agendamento</h4>
        <div className="confirm-box">
          <p>
            <b>Profissional:</b>{" "}
            {selectedEmployer?.user?.first_name ||
              preselectedEmployer?.user?.first_name ||
              "-"}
          </p>
          <p>
            <b>Data:</b>{" "}
            {dateBase ? dateBase.split("-").reverse().join("/") : "-"}
          </p>
          <p>
            <b>Horário:</b> {selectedTime || "-"}
          </p>

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
              <li key={s.id || s.item_id}>
                {s.name} - {fmtBRL(s.price)}
              </li>
            ))}
          </ul>
          <hr />
          <p>
            <b>Total:</b> {fmtBRL(totalValue)} | <b>Duração:</b>{" "}
            {totalDuration} min
          </p>
        </div>
      </div>
    );
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      backdrop="static"
      className="neon-modal"
    >
      <Modal.Body className="wizard-body" style={{ pointerEvents: "auto" }}>
        <div className="wizard-steps">
          {stepsArray.map((n) => (
            <div
              key={n}
              className={`step-dot ${step >= n ? "active" : ""}`}
            />
          ))}
        </div>

        {hasPreselectedEmployer && preselectedEmployer && (
          <div className="employer-selected-header">
            <div className="d-flex align-items-center gap-3 mb-3">
              <img
                src={imageUrl(preselectedEmployer.user?.avatar)}
                alt={preselectedEmployer.user?.first_name}
                className="rounded-circle"
                width="60"
                height="60"
                onError={(e) => (e.currentTarget.src = "/images/logo.png")}
              />
              <div>
                <h5 className="mb-0 text-light">
                  {preselectedEmployer.user?.first_name}
                </h5>
                <small className="text-muted">Profissional selecionado</small>
              </div>
            </div>
            <hr className="mb-4" />
          </div>
        )}

        {step === 1 && renderServicesStep()}
        {!hasPreselectedEmployer && step === 2 && renderEmployersStep()}
        {step === (hasPreselectedEmployer ? 2 : 3) && renderDateStep()}
        {step === (hasPreselectedEmployer ? 3 : 4) && renderTimeStep()}
        {step === finalStep && renderConfirmStep()}
      </Modal.Body>

      <Modal.Footer className="wizard-footer">
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        {step > 1 && (
          <Button variant="dark" onClick={handleBack}>
            Voltar
          </Button>
        )}
        <Button variant="info" onClick={handleNext} disabled={loading}>
          {loading
            ? "Enviando..."
            : step === finalStep
            ? "Confirmar"
            : "Avançar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
