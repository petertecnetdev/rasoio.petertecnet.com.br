// src/pages/employer/EmployerSchedulesPage.jsx
import React from "react";
import { Alert, Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import EmployerHero from "../../components/employer/EmployerHero";
import EmployerScheduleAddForm from "../../components/employer/EmployerScheduleAddForm";
import useEmployerSchedules, { EMPLOYER_DAYS } from "../../hooks/useEmployerSchedules";

export default function EmployerSchedulesPage() {
  const {
    employerId,
    schedulesByDay,
    addDay,
    setAddDay,
    addStart,
    setAddStart,
    addEnd,
    setAddEnd,
    loading,
    saving,
    deleting,
    apiError,
    actionMessage,
    handleAddScheduleLocal,
    handleSaveSchedules,
    handleRemoveSchedule,
  } = useEmployerSchedules();

  const confirmRemove = async (schedule) => {
    const result = await Swal.fire({
      title: "Remover horário?",
      text: `${schedule.start_time} – ${schedule.end_time}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (result.isConfirmed) await handleRemoveSchedule(schedule);
  };

  const confirmSave = async () => {
    const result = await Swal.fire({
      title: "Salvar disponibilidade?",
      text: "Os horários serão usados para calcular quando clientes podem agendar.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Salvar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (result.isConfirmed) await handleSaveSchedules();
  };

  if (loading) {
    return (
      <Container className="py-5 text-center" aria-live="polite">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!employerId) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          Seu perfil de barbeiro não foi encontrado ou não está vinculado a uma barbearia.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <EmployerHero
        title="Disponibilidade"
        subtitle="Defina os dias e horários em que clientes podem agendar com você."
        badge="Área do barbeiro"
      />

      {apiError && <Alert variant="danger">{apiError}</Alert>}
      {actionMessage && <Alert variant="success">{actionMessage}</Alert>}

      <EmployerScheduleAddForm
        days={EMPLOYER_DAYS}
        addDay={addDay}
        setAddDay={setAddDay}
        addStart={addStart}
        setAddStart={setAddStart}
        addEnd={addEnd}
        setAddEnd={setAddEnd}
        onAdd={handleAddScheduleLocal}
      />

      {EMPLOYER_DAYS.map((day) => {
        const schedules = schedulesByDay[day.key] || [];
        return (
          <Card key={day.key} className="mb-3 bg-dark text-light border-secondary">
            <Card.Header className="fw-bold">{day.label}</Card.Header>
            <Card.Body>
              {schedules.length === 0 && (
                <div className="text-secondary">Nenhum horário cadastrado.</div>
              )}

              {schedules.map((schedule) => (
                <Row
                  key={schedule.id}
                  className="align-items-center py-2 border-bottom border-secondary"
                >
                  <Col md={8} className="fw-medium">
                    {schedule.start_time} – {schedule.end_time}
                    {schedule.__local && (
                      <span className="text-warning small ms-2">não salvo</span>
                    )}
                  </Col>
                  <Col md={4} className="text-md-end mt-2 mt-md-0">
                    <Button
                      size="sm"
                      variant="outline-danger"
                      disabled={deleting || saving}
                      onClick={() => confirmRemove(schedule)}
                    >
                      Remover
                    </Button>
                  </Col>
                </Row>
              ))}
            </Card.Body>
          </Card>
        );
      })}

      <div className="d-flex justify-content-end mt-4">
        <Button size="lg" disabled={saving || deleting} onClick={confirmSave}>
          {saving ? "Salvando..." : "Salvar disponibilidade"}
        </Button>
      </div>
    </Container>
  );
}
