// src/pages/establishment/EstablishmentSchedulePage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
} from "react-bootstrap";

import Global from "../../components/Global.jsx";
import {
  GlobalHero,
  GlobalDatePicker,
  GlobalTimePicker,
  GlobalServiceCard,
} from "../../components/";
import useImageUtils from "../../hooks/useImageUtils";

import { apiBaseUrl } from "../../config";
import "./EstablishmentSchedulePage.css";

const MySwal = withReactContent(Swal);
const APP_ID = 2;
const TZ = "America/Sao_Paulo";

const fmtBRL = (v) =>
  `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

const toDateKey = (d) =>
  new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });

export default function EstablishmentSchedulePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { imageUrl, handleImgError } = useImageUtils();

  const [loading, setLoading] = useState(true);
  const [establishment, setEstablishment] = useState(null);
  const [services, setServices] = useState([]);
  const [collaborators, setCollaborators] = useState([]);

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);

  const totalDuration = useMemo(
    () =>
      selectedServices.reduce(
        (sum, s) => sum + (Number(s.duration) || 0),
        0
      ),
    [selectedServices]
  );

  const totalPrice = useMemo(
    () =>
      selectedServices.reduce(
        (sum, s) => sum + (Number(s.price) || 0),
        0
      ),
    [selectedServices]
  );

  const futureDays = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      days.push({
        key: toDateKey(d),
        label: d.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          timeZone: TZ,
        }),
      });
    }
    return days;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/view/${slug}`
        );

        if (!mounted) return;

        setEstablishment(data.establishment || null);
        setServices(
          (data.items || []).filter(
            (i) => i.type === "service" && String(i.status) === "1"
          )
        );
        setCollaborators(data.collaborators || []);
      } catch {
        await MySwal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível carregar o estabelecimento.",
        });
        navigate("/");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, [slug, navigate]);

  const loadAvailableTimes = useCallback(
    async (dayKey, collaborator, duration) => {
      try {
        setAvailableTimes([]);
        if (!dayKey || !collaborator || !duration) return;

        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const { data } = await axios.get(
          `${apiBaseUrl}/employer-schedule/available`,
          {
            params: {
              employer_id: collaborator.id,
              date: dayKey,
              duration,
            },
            headers,
          }
        );

        setAvailableTimes(data.available_times || []);
      } catch {
        await MySwal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível carregar os horários disponíveis.",
        });
      }
    },
    []
  );

  useEffect(() => {
    if (selectedCollaborator && selectedDateKey && totalDuration > 0) {
      loadAvailableTimes(
        selectedDateKey,
        selectedCollaborator,
        totalDuration
      );
    }
  }, [
    selectedCollaborator,
    selectedDateKey,
    totalDuration,
    loadAvailableTimes,
  ]);

  const handleCreateAppointment = async (time) => {
    try {
      const [h, m] = time.split(":").map(Number);
      const [y, mo, d] = selectedDateKey.split("-").map(Number);
      const start = new Date(y, mo - 1, d, h, m, 0);

      const user = JSON.parse(localStorage.getItem("user") || "null");
      let customerName =
        user &&
        `${user.first_name || ""} ${user.last_name || ""}`.trim();

      if (!customerName) {
        const { value } = await MySwal.fire({
          title: "Informe seu nome",
          input: "text",
          inputValidator: (v) =>
            !v ? "Informe seu nome para continuar." : undefined,
        });
        if (!value) return;
        customerName = value;
      }

      const payload = {
        app_id: APP_ID,
        entity_name: "establishment",
        entity_id: establishment.id,
        items: selectedServices.map((s) => ({
          item_id: s.id,
          quantity: 1,
          additions: [],
          removals: [],
        })),
        customer_name: customerName,
        origin: "App",
        fulfillment: "dine-in",
        payment_status: "pending",
        payment_method: "Dinheiro",
        order_datetime: start.toLocaleString("sv-SE").replace(" ", "T"),
        attendant_id: selectedCollaborator.id,
      };

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post(`${apiBaseUrl}/order`, payload, { headers });

      await MySwal.fire({
        icon: "success",
        title: "Agendamento confirmado",
      });

      navigate(`/establishment/view/${slug}`);
    } catch (err) {
      await MySwal.fire({
        icon: "error",
        title: "Erro",
        text:
          err.response?.data?.message ||
          "Não foi possível criar o agendamento.",
      });
    }
  };

  if (loading)
    return (
      <div className="estv-root">
        <Global />
      </div>
    );

  if (!establishment) return null;

  return (
    <div className="estv-root">
      <Global />

      <GlobalHero
        title={`Agendar com ${establishment.name}`}
        background={establishment.background}
        logo={establishment.logo}
        imageUrl={imageUrl}
        handleImgError={handleImgError}
        actions={
          <>
            <div className="d-flex flex-wrap gap-2 mt-2">
              <Button
                size="sm"
                className="bg-black"
                onClick={() =>
                  MySwal.fire({
                    title: "Escolha um colaborador",
                    input: "select",
                    inputOptions: Object.fromEntries(
                      collaborators.map((c) => [
                        c.id,
                        `${c.user?.first_name || ""} ${
                          c.user?.last_name || ""
                        }`,
                      ])
                    ),
                    inputValidator: (v) =>
                      !v ? "Selecione um colaborador." : undefined,
                  }).then((res) => {
                    if (res.value) {
                      const col = collaborators.find(
                        (c) => String(c.id) === String(res.value)
                      );
                      setSelectedCollaborator(col);
                      setSelectedServices([]);
                      setSelectedDateKey(null);
                      setAvailableTimes([]);
                    }
                  })
                }
              >
                Selecionar Colaborador
              </Button>

              <Button
                size="sm"
                className="bg-black"
                onClick={() =>
                  MySwal.fire({
                    title: "Selecione os serviços",
                    html: services
                      .map(
                        (s) => `
                        <div style="margin-bottom:6px">
                          <input type="checkbox" value="${s.id}" id="s${s.id}">
                          <label for="s${s.id}">${s.name} (${fmtBRL(
                          s.price
                        )})</label>
                        </div>`
                      )
                      .join(""),
                    preConfirm: () =>
                      services.filter((s) =>
                        document.getElementById(`s${s.id}`)?.checked
                      ),
                  }).then((res) => {
                    if (res.value) {
                      setSelectedServices(res.value);
                      setAvailableTimes([]);
                    }
                  })
                }
              >
                Selecionar Serviços
              </Button>
            </div>

            <div className="mt-3">
              <Badge bg={selectedCollaborator ? "info" : "secondary"}>
                {selectedCollaborator
                  ? `Colaborador: ${selectedCollaborator.user?.first_name} ${selectedCollaborator.user?.last_name}`
                  : "Nenhum colaborador"}
              </Badge>{" "}
              <Badge bg={selectedServices.length ? "success" : "secondary"}>
                {selectedServices.length
                  ? `${selectedServices.length} serviço(s)`
                  : "Nenhum serviço"}
              </Badge>
              <div className="mt-2">
                <Badge bg="warning" text="dark">
                  Duração: {totalDuration} min
                </Badge>{" "}
                <Badge bg="warning" text="dark">
                  Total: {fmtBRL(totalPrice)}
                </Badge>
              </div>
            </div>
          </>
        }
      />

      <Container fluid className="estv-main">
        <Card bg="dark" text="light" className="mb-3">
          <Card.Header>Escolha uma data</Card.Header>
          <Card.Body className="d-flex flex-wrap gap-2">
            <GlobalDatePicker
              days={futureDays}
              selectedKey={selectedDateKey}
              disabled={!selectedCollaborator || !selectedServices.length}
              onSelect={(key) => setSelectedDateKey(key)}
            />
          </Card.Body>
        </Card>

        <Card bg="dark" text="light" className="mb-3">
          <Card.Header>Horários disponíveis</Card.Header>
          <Card.Body className="d-flex flex-wrap gap-2">
            <GlobalTimePicker
              times={availableTimes}
              disabled={!selectedDateKey}
              onSelect={handleCreateAppointment}
            />
          </Card.Body>
        </Card>

        <Card bg="dark" text="light">
          <Card.Header>Serviços selecionados</Card.Header>
          <Card.Body>
            <Row className="gx-3 gy-3">
              {selectedServices.map((s) => (
                <Col key={s.id} lg={3} md={4} sm={6} xs={12}>
                  <GlobalServiceCard
                    service={s}
                    onRemove={(sv) =>
                      setSelectedServices((prev) =>
                        prev.filter((x) => x.id !== sv.id)
                      )
                    }
                  />
                </Col>
              ))}
              {!selectedServices.length && (
                <div className="text-muted text-center w-100">
                  Nenhum serviço selecionado.
                </div>
              )}
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
