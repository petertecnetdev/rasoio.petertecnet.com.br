import React, { useCallback, useEffect, useRef, useState } from "react";
import { Form, Button, Spinner, Row, Col, Card } from "react-bootstrap";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaCalendarAlt, FaClock, FaUser } from "react-icons/fa";

const MySwal = withReactContent(Swal);
const PLACEHOLDER = "/images/logo.png";

export default function AppointmentSelector({
  employers = [],
  services = [],
  loadAvailableTimes,
  handleCreateAppointment,
  imageUrl,
}) {
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const availabilityRequestRef = useRef(0);
  const submitInFlightRef = useRef(false);

  const today = new Date().toISOString().split("T")[0];

  const fmtBRL = (v) =>
    `R$ ${Number(v || 0)
      .toFixed(2)
      .replace(".", ",")}`;

  const toDateKey = (d) => {
    const date = new Date(d);
    return date.toISOString().split("T")[0];
  };

  const totalDuration = selectedServices.reduce(
    (sum, s) => sum + (parseInt(s.duration) || 0),
    0
  );

  const handleServiceToggle = (service) => {
    const exists = selectedServices.find((s) => s.id === service.id);
    if (exists) {
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const fetchTimes = useCallback(async () => {
    if (!selectedEmployer || !selectedDate || !selectedServices.length) {
      availabilityRequestRef.current += 1;
      setAvailableTimes([]);
      setLoadingTimes(false);
      return;
    }

    const requestId = availabilityRequestRef.current + 1;
    availabilityRequestRef.current = requestId;

    try {
      setLoadingTimes(true);

      const duration = totalDuration > 0 ? totalDuration : 30;
      const date = toDateKey(selectedDate);
      const times = await loadAvailableTimes(date, selectedEmployer, duration);

      if (availabilityRequestRef.current !== requestId) return;

      setAvailableTimes(Array.isArray(times) ? times : []);
    } catch (err) {
      if (availabilityRequestRef.current !== requestId) return;

      console.error("Erro ao carregar horários disponíveis:", err);
      setAvailableTimes([]);
    } finally {
      if (availabilityRequestRef.current === requestId) {
        setLoadingTimes(false);
      }
    }
  }, [
    loadAvailableTimes,
    selectedDate,
    selectedEmployer,
    selectedServices.length,
    totalDuration,
  ]);

  const handleConfirm = async () => {
    if (submitInFlightRef.current) return;

    if (!selectedEmployer || !selectedDate || !selectedTime || !selectedServices.length) {
      await MySwal.fire({
        background: "#0a0a0c",
        color: "#fff",
        icon: "warning",
        title: "Dados incompletos",
        text: "Selecione profissional, serviços, data e horário.",
        confirmButtonColor: "#00ffff",
      });
      return;
    }

    submitInFlightRef.current = true;
    setSubmitting(true);

    try {
      await handleCreateAppointment(
        selectedServices,
        selectedEmployer,
        toDateKey(selectedDate),
        selectedTime
      );
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setSelectedTime("");
    fetchTimes();

    return () => {
      availabilityRequestRef.current += 1;
    };
  }, [fetchTimes]);

  return (
    <Card className="bg-dark text-light border-0 rounded-4 shadow-lg mt-4">
      <Card.Header className="bg-black text-center py-3 border-0">
        <strong className="text-uppercase">Agendar Atendimento</strong>
      </Card.Header>

      <Card.Body className="p-4">
        <Form>
          {/* PROFISSIONAL */}
          <Form.Group className="mb-4">
            <Form.Label>
              <FaUser className="me-2 text-info" />
              Profissional
            </Form.Label>
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {employers.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className={`p-2 text-center rounded-3 ${
                    selectedEmployer?.id === e.id
                      ? "bg-info text-dark"
                      : "bg-secondary text-light"
                  }`}
                  style={{
                    cursor: "pointer",
                    width: "110px",
                    border: "1px solid #00ffff44",
                    transition: "0.3s",
                  }}
                  aria-pressed={selectedEmployer?.id === e.id}
                  onClick={() => setSelectedEmployer(e)}
                >
                  <img
                    src={imageUrl(e.user?.avatar)}
                    onError={(ev) => (ev.target.src = PLACEHOLDER)}
                    alt={e.user?.first_name || "Profissional"}
                    className="rounded-circle mb-2"
                    width={60}
                    height={60}
                    style={{ objectFit: "cover" }}
                  />
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      lineHeight: "14px",
                    }}
                  >
                    {e.user?.first_name || "Profissional"}
                  </div>
                </button>
              ))}
            </div>
          </Form.Group>

          {/* SERVIÇOS */}
          <Form.Group className="mb-4">
            <Form.Label>
              <FaCalendarAlt className="me-2 text-info" />
              Serviços
            </Form.Label>
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {services.map((s) => {
                const selected = selectedServices.some((x) => x.id === s.id);

                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`p-2 rounded-3 ${
                      selected ? "bg-info text-dark" : "bg-secondary text-light"
                    }`}
                    style={{
                      cursor: "pointer",
                      width: "150px",
                      border: "1px solid #00ffff44",
                      transition: "0.3s",
                    }}
                    aria-pressed={selected}
                    onClick={() => handleServiceToggle(s)}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        lineHeight: "14px",
                      }}
                    >
                      {s.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#00ffff" }}>
                      {fmtBRL(s.price)}
                    </div>
                    <div style={{ fontSize: "11px", color: "#999" }}>
                      {s.duration || 30} min
                    </div>
                  </button>
                );
              })}
            </div>
          </Form.Group>

          {/* DATA */}
          <Form.Group className="mb-4">
            <Form.Label>
              <FaCalendarAlt className="me-2 text-info" />
              Data
            </Form.Label>
            <Form.Control
              type="date"
              value={selectedDate}
              min={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-black text-light border-0"
            />
          </Form.Group>

          {/* HORÁRIOS */}
          <Form.Group className="mb-4">
            <Form.Label>
              <FaClock className="me-2 text-info" />
              Horário
            </Form.Label>
            {loadingTimes ? (
              <div className="text-center my-3" role="status" aria-live="polite">
                <Spinner animation="border" variant="info" />
                <span className="visually-hidden">Carregando horários disponíveis</span>
              </div>
            ) : (
              <Row className="g-2">
                {availableTimes.length > 0 ? (
                  availableTimes.map((t) => (
                    <Col xs={4} md={3} key={t}>
                      <Button
                        type="button"
                        size="sm"
                        className={`w-100 ${
                          selectedTime === t
                            ? "btn-info text-dark"
                            : "btn-outline-info"
                        }`}
                        aria-pressed={selectedTime === t}
                        onClick={() => setSelectedTime(t)}
                      >
                        {t}
                      </Button>
                    </Col>
                  ))
                ) : (
                  <Col>
                    <div className="text-muted small text-center" aria-live="polite">
                      {selectedEmployer && selectedDate && selectedServices.length
                        ? "Nenhum horário disponível."
                        : "Selecione profissional, serviços e data."}
                    </div>
                  </Col>
                )}
              </Row>
            )}
          </Form.Group>

          {/* DURAÇÃO TOTAL */}
          <div className="text-center mb-4 text-info">
            Tempo estimado total: <strong>{totalDuration || 0} min</strong>
          </div>

          {/* CONFIRMAR */}
          <div className="text-center">
            <Button
              type="button"
              size="lg"
              variant="info"
              className="text-dark fw-bold px-4 py-2 rounded-pill"
              onClick={handleConfirm}
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Confirmando...
                </>
              ) : (
                "Confirmar Agendamento"
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
