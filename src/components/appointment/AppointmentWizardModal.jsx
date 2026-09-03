import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

import api from "../../services/api";
import schedulingApi from "../../services/schedulingApi";
import "./AppointmentWizardModal.css";

dayjs.extend(utc);
dayjs.extend(tz);

const TZ = "America/Sao_Paulo";
const DAYS_TO_CHECK = 30;

const FALLBACK_RESOURCE_LABELS = {
  professional: "Profissional",
  room: "Sala",
  station: "Estação / box",
  equipment: "Equipamento",
  vehicle: "Veículo",
  space: "Espaço",
  other: "Outro recurso",
};

const serviceId = (service) => Number(service?.item_id ?? service?.id ?? 0);
const employerId = (employer) => Number(employer?.employer_id ?? employer?.id ?? 0) || null;

const professionalName = (resourceOrEmployer) => {
  const employer = resourceOrEmployer?.employer || resourceOrEmployer || {};
  const user = employer?.user || {};
  return (
    `${user.first_name || employer.first_name || ""} ${user.last_name || employer.last_name || ""}`.trim() ||
    user.user_name ||
    employer.user_name ||
    resourceOrEmployer?.name ||
    "Profissional"
  );
};

const apiErrorMessage = (error, fallback) => {
  const errors = error?.response?.data?.errors;
  if (errors && typeof errors === "object") {
    const first = Object.values(errors).flat().filter(Boolean)[0];
    if (first) return String(first);
  }
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
};

export default function AppointmentWizardModal({
  show,
  onHide,
  employers = [],
  services = [],
  preselectedService = null,
  preselectedServiceId = null,
  preselectedEmployer = null,
  establishment = null,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [resources, setResources] = useState([]);
  const [resourceTypeLabels, setResourceTypeLabels] = useState(FALLBACK_RESOURCE_LABELS);
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [selectedPhysical, setSelectedPhysical] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [loadingResources, setLoadingResources] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedServices = useMemo(
    () => services.filter((service) => selectedServiceIds.includes(serviceId(service))),
    [services, selectedServiceIds]
  );

  const totalDuration = useMemo(
    () =>
      selectedServices.reduce(
        (sum, service) => sum + Math.max(5, Number.parseInt(service?.duration, 10) || 30),
        0
      ),
    [selectedServices]
  );

  const totalValue = useMemo(
    () => selectedServices.reduce((sum, service) => sum + (Number(service?.price) || 0), 0),
    [selectedServices]
  );

  const resourceMatchesServices = useCallback(
    (resource) => {
      if (!selectedServiceIds.length) return false;
      const linkedIds = Array.isArray(resource?.items)
        ? resource.items.map((item) => Number(item?.id ?? item?.item_id ?? 0)).filter(Boolean)
        : [];
      return linkedIds.some((id) => selectedServiceIds.includes(id));
    },
    [selectedServiceIds]
  );

  const professionalResources = useMemo(() => {
    const matched = resources.filter(
      (resource) => resource.type === "professional" && resourceMatchesServices(resource)
    );

    if (preselectedEmployer) {
      const preselectedId = employerId(preselectedEmployer);
      if (
        preselectedId &&
        !matched.some((resource) => Number(resource?.employer_id) === preselectedId)
      ) {
        return [
          ...matched,
          {
            id: `preselected-${preselectedId}`,
            type: "professional",
            employer_id: preselectedId,
            employer: preselectedEmployer,
            name: professionalName(preselectedEmployer),
          },
        ];
      }
    }

    return matched;
  }, [resources, resourceMatchesServices, preselectedEmployer]);

  const physicalGroups = useMemo(() => {
    const groups = {};
    resources
      .filter((resource) => resource.type !== "professional" && resourceMatchesServices(resource))
      .forEach((resource) => {
        if (!groups[resource.type]) groups[resource.type] = [];
        groups[resource.type].push(resource);
      });
    return groups;
  }, [resources, resourceMatchesServices]);

  const physicalResourceIds = useMemo(
    () => Object.values(selectedPhysical).map(Number).filter(Boolean),
    [selectedPhysical]
  );

  const providerRequired = professionalResources.length > 0;
  const resourceGroupsReady = useMemo(
    () =>
      Object.keys(physicalGroups).every(
        (type) => Number(selectedPhysical[type] || 0) > 0
      ),
    [physicalGroups, selectedPhysical]
  );

  const resourcesReady =
    (!providerRequired || Number(selectedProviderId || 0) > 0) &&
    resourceGroupsReady &&
    (providerRequired || Object.keys(physicalGroups).length > 0);

  const selectedProvider = useMemo(() => {
    const resource = professionalResources.find(
      (item) => Number(item?.employer_id) === Number(selectedProviderId)
    );
    if (resource?.employer) return resource.employer;
    return employers.find((item) => employerId(item) === Number(selectedProviderId)) || null;
  }, [professionalResources, selectedProviderId, employers]);

  const selectedProviderLabel = selectedProvider ? professionalName(selectedProvider) : null;

  const resetAvailability = useCallback(() => {
    setAvailableDates([]);
    setSelectedDate("");
    setAvailableTimes([]);
    setSelectedTime("");
  }, []);

  useEffect(() => {
    if (!show) return;

    const token = localStorage.getItem("token");
    if (!token) {
      onHide?.();
      navigate("/login", {
        state: {
          from: `${location.pathname}${location.search || ""}`,
          resumeAppointment: true,
        },
      });
      return;
    }

    const initialId = Number(preselectedServiceId || serviceId(preselectedService) || 0);
    setSelectedServiceIds(initialId ? [initialId] : []);
    setSelectedProviderId(employerId(preselectedEmployer));
    setSelectedPhysical({});
    setStep(1);
    setError("");
    resetAvailability();

    let storedUser = {};
    try {
      storedUser = JSON.parse(localStorage.getItem("user") || "{}") || {};
    } catch {
      storedUser = {};
    }

    setCustomer({
      name:
        `${storedUser.first_name || ""} ${storedUser.last_name || ""}`.trim() ||
        storedUser.user_name ||
        "",
      phone: storedUser.phone || storedUser?.profile?.phone || "",
      email: storedUser.email || "",
    });
  }, [show, preselectedService, preselectedServiceId, preselectedEmployer, navigate, location.pathname, location.search, onHide, resetAvailability]);

  useEffect(() => {
    if (!show || !establishment?.id) return undefined;
    let active = true;

    setLoadingResources(true);
    Promise.all([
      schedulingApi.resources.list(establishment.id),
      schedulingApi.catalog.resourceTypes().catch(() => null),
      api.get("/auth/me").catch(() => null),
    ])
      .then(([resourcesResponse, typesResponse, meResponse]) => {
        if (!active) return;
        setResources(
          Array.isArray(resourcesResponse?.data?.data) ? resourcesResponse.data.data : []
        );

        const types = Array.isArray(typesResponse?.data?.data) ? typesResponse.data.data : [];
        if (types.length) {
          setResourceTypeLabels(
            Object.fromEntries(types.map((item) => [item.key, item.label]))
          );
        }

        const user = meResponse?.data?.user;
        if (user) {
          setCustomer({
            name:
              `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
              user.user_name ||
              "",
            phone: user.phone || user?.profile?.phone || "",
            email: user.email || "",
          });
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(
            apiErrorMessage(
              loadError,
              "Não foi possível carregar os profissionais e recursos deste estabelecimento."
            )
          );
        }
      })
      .finally(() => {
        if (active) setLoadingResources(false);
      });

    return () => {
      active = false;
    };
  }, [show, establishment?.id]);

  useEffect(() => {
    if (!selectedServiceIds.length) return;

    setSelectedPhysical((current) => {
      const next = {};
      Object.entries(physicalGroups).forEach(([type, options]) => {
        const existing = Number(current[type] || 0);
        if (options.some((item) => Number(item.id) === existing)) next[type] = existing;
        else if (options.length === 1) next[type] = Number(options[0].id);
      });
      return next;
    });

    if (professionalResources.length === 1 && !selectedProviderId) {
      setSelectedProviderId(Number(professionalResources[0].employer_id));
    } else if (
      selectedProviderId &&
      !professionalResources.some(
        (resource) => Number(resource.employer_id) === Number(selectedProviderId)
      )
    ) {
      setSelectedProviderId(null);
    }

    resetAvailability();
  }, [selectedServiceIds, physicalGroups, professionalResources, selectedProviderId, resetAvailability]);

  const toggleService = (service) => {
    const id = serviceId(service);
    if (!id) return;
    setSelectedServiceIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
    setSelectedPhysical({});
    resetAvailability();
  };

  const availabilityParams = useCallback(
    (extra = {}) => ({
      establishment_id: Number(establishment?.id),
      provider_id: selectedProviderId ? Number(selectedProviderId) : undefined,
      resource_ids: physicalResourceIds.length ? physicalResourceIds : undefined,
      duration: totalDuration,
      ...extra,
    }),
    [establishment?.id, selectedProviderId, physicalResourceIds, totalDuration]
  );

  const loadDates = async () => {
    if (!resourcesReady || !totalDuration) return;
    setLoadingAvailability(true);
    setError("");
    resetAvailability();
    try {
      const { data } = await schedulingApi.availability.dates(
        availabilityParams({
          start_date: dayjs().tz(TZ).format("YYYY-MM-DD"),
          days: DAYS_TO_CHECK,
        })
      );
      const dates = Array.isArray(data?.data?.available_dates)
        ? data.data.available_dates
        : [];
      setAvailableDates(dates);
      if (dates.length === 1) setSelectedDate(dates[0]);
      setStep(3);
    } catch (availabilityError) {
      setError(
        apiErrorMessage(
          availabilityError,
          "Não foi possível consultar as datas disponíveis."
        )
      );
    } finally {
      setLoadingAvailability(false);
    }
  };

  const chooseDate = async (date) => {
    setSelectedDate(date);
    setSelectedTime("");
    setAvailableTimes([]);
    setLoadingAvailability(true);
    setError("");
    try {
      const { data } = await schedulingApi.availability.times(
        availabilityParams({ date })
      );
      setAvailableTimes(
        Array.isArray(data?.data?.available_times) ? data.data.available_times : []
      );
      setStep(4);
    } catch (availabilityError) {
      setError(
        apiErrorMessage(
          availabilityError,
          "Não foi possível consultar os horários disponíveis."
        )
      );
    } finally {
      setLoadingAvailability(false);
    }
  };

  const submitAppointment = async () => {
    if (!selectedDate || !selectedTime || !selectedServiceIds.length || !resourcesReady) return;
    setSubmitting(true);
    setError("");

    try {
      const freshTimesResponse = await schedulingApi.availability.times(
        availabilityParams({ date: selectedDate })
      );
      const freshTimes = Array.isArray(freshTimesResponse?.data?.data?.available_times)
        ? freshTimesResponse.data.data.available_times
        : [];

      if (!freshTimes.includes(selectedTime)) {
        setAvailableTimes(freshTimes);
        setSelectedTime("");
        setStep(4);
        await Swal.fire(
          "Horário indisponível",
          "Esse horário acabou de ser ocupado. Escolha outro horário.",
          "warning"
        );
        return;
      }

      const scheduledAt = dayjs.tz(
        `${selectedDate} ${selectedTime}`,
        "YYYY-MM-DD HH:mm",
        TZ
      );

      await schedulingApi.appointments.create({
        establishment_id: Number(establishment.id),
        items: selectedServiceIds.map((itemId) => ({ item_id: itemId, quantity: 1 })),
        provider_id: selectedProviderId ? Number(selectedProviderId) : undefined,
        resource_ids: physicalResourceIds.length ? physicalResourceIds : undefined,
        scheduled_at: scheduledAt.format("YYYY-MM-DDTHH:mm:ssZ"),
        customer_name: customer.name.trim() || undefined,
        customer_phone: customer.phone.trim() || undefined,
        customer_email: customer.email.trim() || undefined,
        notes: "Agendamento criado pela Rasoio.",
      });

      await Swal.fire({
        icon: "success",
        title: "Agendamento solicitado",
        text: "O horário foi reservado e está aguardando confirmação do estabelecimento.",
        confirmButtonText: "Concluir",
      });
      onHide?.();
    } catch (submitError) {
      setError(apiErrorMessage(submitError, "Não foi possível criar o agendamento."));
    } finally {
      setSubmitting(false);
    }
  };

  const fmtBRL = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <Modal
      show={show}
      onHide={() => !submitting && onHide?.()}
      centered
      size="lg"
      contentClassName="awm-modal"
    >
      <Modal.Header closeButton closeVariant="white">
        <div>
          <span className="awm-kicker">Agendamento inteligente</span>
          <Modal.Title>
            {establishment?.fantasy || establishment?.name || "Agendar serviço"}
          </Modal.Title>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="d-flex flex-wrap gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <Badge key={item} bg={step === item ? "info" : step > item ? "success" : "secondary"}>
              {item}
            </Badge>
          ))}
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {loadingResources && (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="mt-3 mb-0">Carregando capacidade de atendimento…</p>
          </div>
        )}

        {!loadingResources && step === 1 && (
          <section>
            <h3>1. Escolha os serviços</h3>
            <p>Você pode combinar mais de um serviço no mesmo atendimento.</p>
            <div className="d-grid gap-2">
              {services.map((service) => {
                const id = serviceId(service);
                const checked = selectedServiceIds.includes(id);
                return (
                  <label key={id} className="awm-choice-card">
                    <Form.Check
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(service)}
                      label={`${service.name || service.title || "Serviço"} · ${service.duration || 30} min · ${fmtBRL(service.price)}`}
                    />
                  </label>
                );
              })}
              {!services.length && (
                <Alert variant="secondary">Este estabelecimento ainda não possui serviços agendáveis.</Alert>
              )}
            </div>
            <div className="d-flex justify-content-end mt-4">
              <Button disabled={!selectedServiceIds.length} onClick={() => setStep(2)}>
                Continuar
              </Button>
            </div>
          </section>
        )}

        {!loadingResources && step === 2 && (
          <section>
            <h3>2. Quem e o que precisa estar disponível</h3>
            <p>
              A Rasoio combina automaticamente a agenda do profissional com salas, equipamentos,
              veículos ou outros recursos configurados para os serviços escolhidos.
            </p>

            {providerRequired && (
              <Form.Group className="mb-3">
                <Form.Label>Profissional</Form.Label>
                <Form.Select
                  value={selectedProviderId || ""}
                  onChange={(event) => {
                    setSelectedProviderId(Number(event.target.value) || null);
                    resetAvailability();
                  }}
                >
                  <option value="">Selecione</option>
                  {professionalResources.map((resource) => (
                    <option key={resource.id} value={resource.employer_id}>
                      {professionalName(resource)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {Object.entries(physicalGroups).map(([type, options]) => (
              <Form.Group className="mb-3" key={type}>
                <Form.Label>{resourceTypeLabels[type] || FALLBACK_RESOURCE_LABELS[type] || type}</Form.Label>
                <Form.Select
                  value={selectedPhysical[type] || ""}
                  onChange={(event) => {
                    setSelectedPhysical((current) => ({
                      ...current,
                      [type]: Number(event.target.value) || "",
                    }));
                    resetAvailability();
                  }}
                >
                  <option value="">Selecione</option>
                  {options.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                      {Number(resource.capacity || 1) > 1 ? ` · capacidade ${resource.capacity}` : ""}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            ))}

            {!providerRequired && Object.keys(physicalGroups).length === 0 && (
              <Alert variant="warning">
                Os serviços escolhidos ainda não estão vinculados a nenhum profissional ou recurso agendável.
                O responsável pelo estabelecimento precisa configurar a capacidade de atendimento antes de receber reservas.
              </Alert>
            )}

            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={() => setStep(1)}>Voltar</Button>
              <Button disabled={!resourcesReady || loadingAvailability} onClick={loadDates}>
                {loadingAvailability ? "Consultando…" : "Ver datas disponíveis"}
              </Button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h3>3. Escolha a data</h3>
            <p>Mostramos apenas dias em que toda a capacidade necessária está disponível ao mesmo tempo.</p>
            {loadingAvailability ? (
              <div className="text-center py-4"><Spinner animation="border" /></div>
            ) : (
              <Row className="g-2">
                {availableDates.map((date) => (
                  <Col key={date} xs={6} md={4}>
                    <Button
                      className="w-100"
                      variant={selectedDate === date ? "info" : "outline-light"}
                      onClick={() => chooseDate(date)}
                    >
                      {dayjs(date).format("DD/MM/YYYY")}
                    </Button>
                  </Col>
                ))}
                {!availableDates.length && (
                  <Col xs={12}>
                    <Alert variant="warning">Nenhuma data disponível nos próximos {DAYS_TO_CHECK} dias.</Alert>
                  </Col>
                )}
              </Row>
            )}
            <div className="mt-4">
              <Button variant="outline-secondary" onClick={() => setStep(2)}>Voltar</Button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <h3>4. Escolha o horário</h3>
            <p>{selectedDate ? `Disponibilidade de ${dayjs(selectedDate).format("DD/MM/YYYY")}.` : ""}</p>
            {loadingAvailability ? (
              <div className="text-center py-4"><Spinner animation="border" /></div>
            ) : (
              <div className="d-flex flex-wrap gap-2">
                {availableTimes.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "info" : "outline-light"}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
                {!availableTimes.length && <Alert variant="warning">Nenhum horário disponível nesta data.</Alert>}
              </div>
            )}
            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={() => setStep(3)}>Voltar</Button>
              <Button disabled={!selectedTime} onClick={() => setStep(5)}>Continuar</Button>
            </div>
          </section>
        )}

        {step === 5 && (
          <section>
            <h3>5. Confirme o agendamento</h3>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  value={customer.name}
                  onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))}
                />
              </Col>
              <Col md={6}>
                <Form.Label>Telefone</Form.Label>
                <Form.Control
                  value={customer.phone}
                  onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
                />
              </Col>
              <Col xs={12}>
                <Form.Label>E-mail</Form.Label>
                <Form.Control
                  type="email"
                  value={customer.email}
                  onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))}
                />
              </Col>
            </Row>

            <div className="awm-summary mt-4">
              <p><strong>Serviços:</strong> {selectedServices.map((service) => service.name || service.title).join(", ")}</p>
              {selectedProviderLabel && <p><strong>Profissional:</strong> {selectedProviderLabel}</p>}
              {Object.entries(selectedPhysical).map(([type, id]) => {
                const resource = resources.find((item) => Number(item.id) === Number(id));
                return resource ? (
                  <p key={type}><strong>{resourceTypeLabels[type] || type}:</strong> {resource.name}</p>
                ) : null;
              })}
              <p><strong>Data:</strong> {dayjs(selectedDate).format("DD/MM/YYYY")} às {selectedTime}</p>
              <p><strong>Duração:</strong> {totalDuration} min</p>
              <p><strong>Valor dos serviços:</strong> {fmtBRL(totalValue)}</p>
            </div>

            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" disabled={submitting} onClick={() => setStep(4)}>Voltar</Button>
              <Button disabled={submitting} onClick={submitAppointment}>
                {submitting ? "Agendando…" : "Confirmar agendamento"}
              </Button>
            </div>
          </section>
        )}
      </Modal.Body>
    </Modal>
  );
}
