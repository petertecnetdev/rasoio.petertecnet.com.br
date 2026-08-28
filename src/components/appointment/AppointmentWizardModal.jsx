import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { appId } from "../../config";
import api from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";
import GlobalButton from "../GlobalButton";
import GlobalModal from "../GlobalModal";
import ProcessingIndicatorComponent from "../ProcessingIndicatorComponent";

import "./AppointmentWizardModal.css";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "America/Sao_Paulo";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const employerUserId = (employer) =>
  employer?.user_id ?? employer?.user?.id ?? employer?.account_id ?? null;

const employerName = (employer) => {
  const firstName = employer?.user?.first_name || employer?.first_name || "";
  const lastName = employer?.user?.last_name || employer?.last_name || "";
  return employer?.name || `${firstName} ${lastName}`.trim() || "Profissional";
};

const serviceId = (service) => service?.id ?? service?.item_id ?? null;

const serviceDuration = (service) => Math.max(1, Number(service?.duration) || 30);

const money = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function AppointmentWizardModal({
  show,
  onHide,
  employers = [],
  services = [],
  loadAvailableTimes,
  imageUrl,
  preselectedService = null,
  preselectedServiceId = null,
  preselectedEmployer = null,
  establishment = null,
}) {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerCpf, setCustomerCpf] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const authUser = useMemo(() => (show ? getStoredUser() : null), [show]);

  const resolvedEstablishment = useMemo(
    () =>
      establishment ||
      preselectedEmployer?.establishment ||
      selectedEmployer?.establishment ||
      null,
    [establishment, preselectedEmployer, selectedEmployer]
  );

  const selectableEmployers = useMemo(
    () =>
      (Array.isArray(employers) ? employers : []).filter(
        (employer) => Number(employerUserId(employer)) !== Number(authUser?.id)
      ),
    [employers, authUser?.id]
  );

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, service) => sum + serviceDuration(service), 0),
    [selectedServices]
  );

  const totalValue = useMemo(
    () => selectedServices.reduce((sum, service) => sum + Number(service?.price || 0), 0),
    [selectedServices]
  );

  const maxStep = preselectedEmployer ? 4 : 5;

  useEffect(() => {
    if (!show) return;

    const selectedId =
      preselectedServiceId ?? serviceId(preselectedService) ?? null;
    const serviceFromList = selectedId
      ? services.find((service) => Number(serviceId(service)) === Number(selectedId))
      : null;

    setStep(1);
    setSelectedServices(serviceFromList ? [serviceFromList] : preselectedService ? [preselectedService] : []);
    setSelectedEmployer(preselectedEmployer || null);
    setSelectedDate("");
    setSelectedTime("");
    setAvailableTimes([]);

    const profile = authUser?.profile || {};
    setCustomerCpf(profile?.cpf || authUser?.cpf || "");
    setCustomerPhone(profile?.phone || authUser?.phone || "");
  }, [
    show,
    preselectedService,
    preselectedServiceId,
    preselectedEmployer,
    services,
    authUser,
  ]);

  useEffect(() => {
    setSelectedTime("");
    setAvailableTimes([]);
  }, [selectedEmployer?.id, selectedDate]);

  const toggleService = useCallback((service) => {
    const id = serviceId(service);
    if (!id) return;

    setSelectedServices((current) =>
      current.some((entry) => Number(serviceId(entry)) === Number(id))
        ? current.filter((entry) => Number(serviceId(entry)) !== Number(id))
        : [...current, service]
    );
  }, []);

  const loadTimes = useCallback(async () => {
    if (!selectedEmployer?.id || !selectedDate || !selectedServices.length) return false;

    setLoadingTimes(true);
    setAvailableTimes([]);
    setSelectedTime("");

    try {
      const times = await loadAvailableTimes(
        selectedDate,
        selectedEmployer,
        Math.max(1, totalDuration)
      );
      setAvailableTimes(Array.isArray(times) ? times : []);
      return true;
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Erro ao carregar horários",
        text: getApiErrorMessage(error, "Não foi possível carregar os horários disponíveis."),
      });
      return false;
    } finally {
      setLoadingTimes(false);
    }
  }, [loadAvailableTimes, selectedDate, selectedEmployer, selectedServices.length, totalDuration]);

  const next = async () => {
    if (step === 1) {
      if (!selectedServices.length) return;
      setStep(2);
      return;
    }

    if (!preselectedEmployer && step === 2) {
      if (!selectedEmployer) return;
      setStep(3);
      return;
    }

    const dateStep = preselectedEmployer ? 2 : 3;
    const timeStep = dateStep + 1;

    if (step === dateStep) {
      if (!selectedDate || !selectedEmployer) return;
      const loaded = await loadTimes();
      if (loaded) setStep(timeStep);
      return;
    }

    if (step === timeStep) {
      if (!selectedTime) return;
      setStep(maxStep);
    }
  };

  const submit = async () => {
    if (saving) return;

    if (!authUser?.id) {
      await Swal.fire("Entre para agendar", "Faça login antes de confirmar o agendamento.", "info");
      return;
    }

    if (!resolvedEstablishment?.id) {
      await Swal.fire("Barbearia não identificada", "Não foi possível identificar a barbearia.", "error");
      return;
    }

    if (!selectedEmployer?.id) {
      await Swal.fire("Profissional não identificado", "Selecione um profissional.", "warning");
      return;
    }

    if (Number(employerUserId(selectedEmployer)) === Number(authUser.id)) {
      await Swal.fire(
        "Agendamento inválido",
        "Você não pode criar um agendamento em que cliente e profissional sejam a mesma pessoa.",
        "warning"
      );
      return;
    }

    if (!customerCpf.trim() || !customerPhone.trim()) {
      await Swal.fire("Dados incompletos", "Informe CPF e telefone para continuar.", "warning");
      return;
    }

    const datetime = dayjs.tz(
      `${selectedDate} ${selectedTime}`,
      "YYYY-MM-DD HH:mm",
      TZ
    );

    if (!datetime.isValid() || datetime.isBefore(dayjs().tz(TZ))) {
      await Swal.fire("Horário inválido", "Selecione um horário futuro disponível.", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        mode: "appointment",
        app_id: appId,
        entity_name: "establishment",
        entity_id: resolvedEstablishment.id,
        items: selectedServices.map((service) => ({
          item_id: serviceId(service),
          quantity: 1,
        })),
        client_id: authUser.id,
        customer_name:
          `${authUser?.first_name || ""} ${authUser?.last_name || ""}`.trim() ||
          authUser?.name ||
          "Cliente App",
        customer_phone: customerPhone.trim(),
        customer_cpf: customerCpf.trim(),
        order_datetime: datetime.format("YYYY-MM-DDTHH:mm:ssZ"),
        attendant_id: selectedEmployer.id,
        origin: "App",
        fulfillment: "dine-in",
        payment_status: "pending",
        payment_method: "Pix",
        notes: "Agendamento feito pelo aplicativo.",
      };

      const { data } = await api.post("/order", payload);
      await Swal.fire({
        icon: "success",
        title: "Agendamento confirmado",
        text: data?.message || "Seu horário foi reservado com sucesso.",
      });
      onHide?.();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Não foi possível agendar",
        text: getApiErrorMessage(error, "Revise os dados e tente novamente."),
      });
    } finally {
      setSaving(false);
    }
  };

  const renderServiceStep = () => (
    <div className="d-grid gap-2">
      <p className="text-secondary mb-2">Escolha um ou mais serviços.</p>
      {services.map((service) => {
        const id = serviceId(service);
        const active = selectedServices.some(
          (entry) => Number(serviceId(entry)) === Number(id)
        );
        return (
          <button
            type="button"
            key={id}
            className={`btn text-start ${active ? "btn-info" : "btn-outline-secondary"}`}
            onClick={() => toggleService(service)}
          >
            <strong>{service?.name || "Serviço"}</strong>
            <span className="d-block small mt-1">
              {money(service?.price)} · {serviceDuration(service)} min
            </span>
          </button>
        );
      })}
      {!services.length && <div className="alert alert-warning mb-0">Nenhum serviço disponível.</div>}
    </div>
  );

  const renderEmployerStep = () => (
    <div className="d-grid gap-2">
      <p className="text-secondary mb-2">Escolha quem fará o atendimento.</p>
      {selectableEmployers.map((employer) => (
        <button
          type="button"
          key={employer.id}
          className={`btn d-flex align-items-center gap-3 text-start ${
            selectedEmployer?.id === employer.id ? "btn-info" : "btn-outline-secondary"
          }`}
          onClick={() => setSelectedEmployer(employer)}
        >
          {typeof imageUrl === "function" && (
            <img
              src={imageUrl(employer?.user?.avatar) || "/images/logo.png"}
              alt=""
              width="42"
              height="42"
              className="rounded-circle object-fit-cover"
            />
          )}
          <span>{employerName(employer)}</span>
        </button>
      ))}
      {!selectableEmployers.length && (
        <div className="alert alert-warning mb-0">Nenhum profissional disponível para este atendimento.</div>
      )}
    </div>
  );

  const dateStep = preselectedEmployer ? 2 : 3;
  const timeStep = dateStep + 1;

  return (
    <GlobalModal
      show={show}
      onHide={saving ? undefined : onHide}
      title="Agendar atendimento"
      subtitle={resolvedEstablishment?.name || "Rasoio"}
      centered
      size="lg"
      backdrop="static"
      closeOnEsc={!saving}
      closeButton={!saving}
      footer={null}
    >
      <div className="position-relative">
        {(saving || loadingTimes) && (
          <ProcessingIndicatorComponent
            messages={[saving ? "Confirmando agendamento..." : "Carregando horários..."]}
            blocking
          />
        )}

        <div className="small text-secondary mb-3">Etapa {step} de {maxStep}</div>

        {step === 1 && renderServiceStep()}
        {!preselectedEmployer && step === 2 && renderEmployerStep()}

        {step === dateStep && (
          <div>
            <label htmlFor="appointment-date" className="form-label">Data do atendimento</label>
            <input
              id="appointment-date"
              type="date"
              className="form-control"
              min={dayjs().tz(TZ).format("YYYY-MM-DD")}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
        )}

        {step === timeStep && (
          <div>
            <p className="text-secondary">Escolha um horário disponível.</p>
            <div className="d-flex flex-wrap gap-2">
              {availableTimes.map((time) => (
                <button
                  type="button"
                  key={time}
                  className={`btn ${selectedTime === time ? "btn-info" : "btn-outline-info"}`}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
            {!availableTimes.length && (
              <div className="alert alert-warning mt-3 mb-0">Nenhum horário disponível para esta data.</div>
            )}
          </div>
        )}

        {step === maxStep && (
          <div className="d-grid gap-3">
            <div className="card card-body bg-transparent">
              <strong>{resolvedEstablishment?.name || "Barbearia"}</strong>
              <span>{employerName(selectedEmployer)}</span>
              <span>{selectedDate} às {selectedTime}</span>
              <span>{selectedServices.length} serviço(s) · {totalDuration} min · {money(totalValue)}</span>
            </div>
            <div>
              <label htmlFor="appointment-cpf" className="form-label">CPF</label>
              <input
                id="appointment-cpf"
                className="form-control"
                value={customerCpf}
                onChange={(event) => setCustomerCpf(event.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="appointment-phone" className="form-label">Telefone</label>
              <input
                id="appointment-phone"
                className="form-control"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>
        )}

        <div className="d-flex justify-content-between gap-2 mt-4">
          <GlobalButton
            variant="secondary"
            disabled={saving || step === 1}
            onClick={() => setStep((current) => Math.max(1, current - 1))}
          >
            Voltar
          </GlobalButton>

          {step < maxStep ? (
            <GlobalButton variant="primary" disabled={saving || loadingTimes} onClick={next}>
              Continuar
            </GlobalButton>
          ) : (
            <GlobalButton variant="primary" disabled={saving} onClick={submit}>
              Confirmar agendamento
            </GlobalButton>
          )}
        </div>
      </div>
    </GlobalModal>
  );
}

AppointmentWizardModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  employers: PropTypes.array,
  services: PropTypes.array,
  loadAvailableTimes: PropTypes.func.isRequired,
  imageUrl: PropTypes.func,
  preselectedService: PropTypes.object,
  preselectedServiceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  preselectedEmployer: PropTypes.object,
  establishment: PropTypes.object,
};
