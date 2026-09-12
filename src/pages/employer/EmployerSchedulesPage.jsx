// src/pages/employer/EmployerSchedulesPage.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import EmployerHero from "../../components/employer/EmployerHero";
import EmployerScheduleAddForm from "../../components/employer/EmployerScheduleAddForm";
import useEmployerSchedules, { EMPLOYER_DAYS } from "../../hooks/useEmployerSchedules";

export default function EmployerSchedulesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isOnboarding = location.state?.onboarding === true;
  const onboardingEstablishment = location.state?.establishment || null;

  const {
    employerId,
    schedulesByDay,
    dayOffByDay,
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
    handleSetDayOff,
    handleAddScheduleLocal,
    handleSaveSchedules,
    handleRemoveSchedule,
  } = useEmployerSchedules();

  const hasAvailability = Object.values(schedulesByDay).some(
    (schedules) => schedules.length > 0
  );

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

  const toggleDayOff = async (day, checked) => {
    if (!checked) {
      handleSetDayOff(day.key, false);
      return;
    }

    const schedules = schedulesByDay[day.key] || [];
    if (schedules.length === 0) {
      handleSetDayOff(day.key, true);
      return;
    }

    const result = await Swal.fire({
      title: `Definir ${day.label} como folga?`,
      text: "Os horários de trabalho deste dia serão removidos. Depois de salvar, nenhuma terça/quarta/etc. futura deste dia da semana ficará disponível para clientes.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sim, é minha folga",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (result.isConfirmed) handleSetDayOff(day.key, true);
  };

  const confirmSave = async () => {
    if (isOnboarding && !hasAvailability) {
      await Swal.fire({
        title: "Adicione pelo menos um horário",
        text: "Para começar a receber agendamentos, deixe pelo menos um dia com disponibilidade antes de concluir esta etapa.",
        icon: "warning",
        confirmButtonText: "Configurar horários",
      });
      return;
    }

    const result = await Swal.fire({
      title: isOnboarding ? "Publicar sua disponibilidade?" : "Salvar disponibilidade?",
      text: isOnboarding
        ? "Ao salvar, seus horários poderão ser usados para oferecer agendamentos aos clientes."
        : "Os dias marcados como folga ficarão indisponíveis em todas as semanas. Os demais usarão os horários configurados abaixo.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: isOnboarding ? "Salvar e abrir minha agenda" : "Salvar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    const saved = await handleSaveSchedules();
    if (!saved || !isOnboarding) return;

    const slug = onboardingEstablishment?.slug;
    await Swal.fire({
      icon: "success",
      title: "Agenda pronta para receber clientes",
      text: slug
        ? "Seu primeiro serviço, perfil profissional e disponibilidade estão configurados. Confira agora como o cliente verá seu estabelecimento."
        : "Seu perfil profissional e disponibilidade estão configurados para receber agendamentos.",
      confirmButtonText: slug ? "Ver agenda pública" : "Concluir",
    });

    if (slug) {
      navigate(`/establishment/view/${slug}?source=onboarding-ready`, {
        replace: true,
      });
    }
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
        title={isOnboarding ? "Defina quando você pode atender" : "Disponibilidade"}
        subtitle={
          isOnboarding
            ? "Esta é a última etapa para deixar sua agenda pronta: escolha os dias e horários em que clientes poderão agendar com você."
            : "Defina sua escala semanal: dias de trabalho, folgas recorrentes e horários em que clientes podem agendar com você."
        }
        badge={isOnboarding ? "Última etapa" : "Área do barbeiro"}
      />

      {apiError && <Alert variant="danger">{apiError}</Alert>}
      {actionMessage && <Alert variant="success">{actionMessage}</Alert>}

      {isOnboarding && (
        <Alert variant="success" className="mb-4">
          <strong>Quase pronto:</strong> ao salvar pelo menos um horário de atendimento, sua agenda estará preparada para receber o primeiro agendamento.
        </Alert>
      )}

      <Alert variant="info" className="mb-4">
        <strong>Folga semanal:</strong> marque “Não trabalho neste dia” quando você não atende em determinado dia da semana. Exemplo: se sua folga é toda terça-feira, todas as terças ficarão automaticamente fora do calendário de agendamento.
      </Alert>

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
        const isDayOff = Boolean(dayOffByDay[day.key]);

        return (
          <Card
            key={day.key}
            className={`mb-3 bg-dark text-light ${isDayOff ? "border-warning" : "border-secondary"}`}
          >
            <Card.Header className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
              <div>
                <div className="fw-bold">{day.label}</div>
                <small className={isDayOff ? "text-warning" : "text-secondary"}>
                  {isDayOff ? "Folga semanal — clientes não podem agendar neste dia" : "Dia de trabalho"}
                </small>
              </div>

              <Form.Check
                type="switch"
                id={`weekly-day-off-${day.key}`}
                label="Não trabalho neste dia"
                checked={isDayOff}
                disabled={saving || deleting}
                onChange={(event) => toggleDayOff(day, event.target.checked)}
              />
            </Card.Header>

            <Card.Body>
              {isDayOff ? (
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                  <div>
                    <strong className="text-warning">Folga recorrente</strong>
                    <div className="text-secondary small mt-1">
                      Nenhum horário será oferecido aos clientes nas {day.label.toLowerCase()}s.
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline-light"
                    disabled={saving || deleting}
                    onClick={() => handleSetDayOff(day.key, false)}
                  >
                    Voltar a trabalhar neste dia
                  </Button>
                </div>
              ) : (
                <>
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
                </>
              )}
            </Card.Body>
          </Card>
        );
      })}

      <div className="d-flex justify-content-end mt-4">
        <Button size="lg" disabled={saving || deleting} onClick={confirmSave}>
          {saving
            ? "Salvando..."
            : isOnboarding
              ? "Salvar e abrir minha agenda"
              : "Salvar disponibilidade"}
        </Button>
      </div>
    </Container>
  );
}
