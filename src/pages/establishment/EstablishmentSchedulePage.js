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
  Spinner,
} from "react-bootstrap";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./EstablishmentSchedulePage.css";

const MySwal = withReactContent(Swal);
const APP_ID = 2;
const PLACEHOLDER = "/images/logo.png";
const TZ = "America/Sao_Paulo";

const fmtBRL = (v) =>
  `R$ ${Number(v || 0)
    .toFixed(2)
    .replace(".", ",")}`;

const toDateKey = (d) =>
  new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });

export default function EstablishmentSchedulePage() {
  const { slug } = useParams();
  const navigate = useNavigate();

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
      selectedServices.reduce((sum, s) => sum + (Number(s.duration) || 0), 0),
    [selectedServices]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0),
    [selectedServices]
  );

  const futureDays = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const key = toDateKey(d);
      const label = d.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        timeZone: TZ,
      });
      days.push({ key, date: d, label });
    }
    return days;
  }, []);

  const imageUrl = useCallback((path) => {
    if (!path) return PLACEHOLDER;
    return `${storageUrl}/${path}`;
  }, []);

  const handleImgError = useCallback((e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = PLACEHOLDER;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/view/${slug}`
        );
        const est = data?.establishment || null;
        const items = Array.isArray(data?.items) ? data.items : [];
        const cols = Array.isArray(data?.collaborators)
          ? data.collaborators
          : [];
        if (!est) {
          await MySwal.fire({
            icon: "error",
            title: "Erro",
            text: "Não foi possível carregar o estabelecimento.",
          });
          navigate("/");
          return;
        }
        if (!mounted) return;
        setEstablishment(est);
        setServices(
          items.filter(
            (i) => String(i.type) === "service" && String(i.status) === "1"
          )
        );
        setCollaborators(cols);
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
    async (dayKey, collaborator, durationMin) => {
      try {
        setAvailableTimes([]);
        if (!dayKey || !collaborator || !durationMin) return;

        console.log("🔹 Buscando horários disponíveis:", {
          collaborator: collaborator.id,
          date: dayKey,
          duration: durationMin,
        });

        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const { data } = await axios.get(
          `${apiBaseUrl}/employer-schedule/available`,
          {
            params: {
              employer_id: collaborator.id,
              date: dayKey,
              duration: durationMin,
            },
            headers,
          }
        );

        setAvailableTimes(
          Array.isArray(data.available_times) ? data.available_times : []
        );
      } catch (err) {
        console.error(
          "❌ Erro ao carregar horários disponíveis:",
          err.response || err
        );
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
      console.log("⚙️ Atualizando horários disponíveis...");
      loadAvailableTimes(selectedDateKey, selectedCollaborator, totalDuration);
    }
  }, [
    selectedCollaborator,
    selectedDateKey,
    totalDuration,
    loadAvailableTimes,
  ]);

  const openCollaboratorPicker = async () => {
    if (!collaborators.length) {
      await MySwal.fire({
        icon: "info",
        title: "Aviso",
        text: "Nenhum colaborador disponível.",
      });
      return;
    }
    const html = `
      <style>
        .swal-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}
        .selbtn{border:1px solid #444;border-radius:10px;padding:10px;background:#111;color:#fff;cursor:pointer;transition:all 0.2s}
        .selbtn:hover{background:#222}
        .selbtn.active{outline:2px solid #ffc107;background:#1b1b1b}
        .small{font-size:12px;color:#bbb}
      </style>
      <div class="swal-grid">
        ${collaborators
          .map((c) => {
            const nm =
              `${c.user?.first_name || ""} ${c.user?.last_name || ""}`.trim() ||
              "Colaborador";
            return `<button type="button" class="selbtn" data-id="${c.id}">
              <div style="display:flex;align-items:center;gap:10px;">
                <img src="${imageUrl(
                  c.user?.avatar
                )}" style="width:36px;height:36px;border-radius:50%;object-fit:cover" onerror="this.src='${PLACEHOLDER}'" />
                <div><div>${nm}</div><div class="small">${
              c.role || ""
            }</div></div>
              </div>
            </button>`;
          })
          .join("")}
      </div>`;
    await MySwal.fire({
      title: "Escolha um colaborador",
      html,
      showConfirmButton: false,
      didOpen: () => {
        const root = MySwal.getHtmlContainer();
        root.querySelectorAll(".selbtn").forEach((btn) => {
          btn.addEventListener("click", () => {
            root
              .querySelectorAll(".selbtn")
              .forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const id = Number(btn.getAttribute("data-id"));
            const col = collaborators.find((c) => Number(c.id) === id);
            setSelectedCollaborator(col || null);
            setAvailableTimes([]);
            setSelectedDateKey(null);
            setSelectedServices([]);
            Swal.close();
          });
        });
      },
    });
  };

  const openServicePicker = async () => {
    if (!services.length) {
      await MySwal.fire({
        icon: "info",
        title: "Aviso",
        text: "Nenhum serviço disponível.",
      });
      return;
    }
    const selectedIds = new Set(selectedServices.map((s) => s.id));
    const html = `
      <style>
        .swal-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}
        .selbtn{border:1px solid #444;border-radius:12px;padding:10px;background:#111;color:#fff;cursor:pointer;text-align:left;transition:all 0.2s}
        .selbtn:hover{background:#222}
        .selbtn.active{outline:2px solid #0dcaf0;background:#1b1b1b}
        .rowtop{display:flex;justify-content:space-between;align-items:center}
        .small{font-size:12px;color:#bbb}
      </style>
      <div class="swal-grid">
        ${services
          .map((sv) => {
            const activeClass = selectedIds.has(sv.id) ? "active" : "";
            return `<button type="button" class="selbtn ${activeClass}" data-id="${
              sv.id
            }">
              <div class="rowtop"><strong>${sv.name}</strong><span>${fmtBRL(
              sv.price
            )}</span></div>
              <div class="small">${sv.duration || 0} min</div>
            </button>`;
          })
          .join("")}
      </div>`;
    await MySwal.fire({
      title: "Selecione os serviços",
      html,
      showConfirmButton: false,
      didOpen: () => {
        const root = MySwal.getHtmlContainer();
        const chosen = new Set(selectedIds);
        const refresh = () => {
          const ids = [...chosen];
          const chosenServices = services.filter((s) => ids.includes(s.id));
          setSelectedServices(chosenServices);
          setAvailableTimes([]);
        };
        root.querySelectorAll(".selbtn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = Number(btn.getAttribute("data-id"));
            if (chosen.has(id)) {
              chosen.delete(id);
              btn.classList.remove("active");
            } else {
              chosen.add(id);
              btn.classList.add("active");
            }
            refresh();
            setTimeout(() => Swal.close(), 400);
          });
        });
      },
    });
  };

  const handleCreateAppointment = async (timeStr) => {
    try {
      if (!selectedCollaborator || !selectedDateKey || !selectedServices.length)
        return;

      const collaboratorName = `${
        selectedCollaborator.user?.first_name || ""
      } ${selectedCollaborator.user?.last_name || ""}`.trim();
      const servicesList = selectedServices
        .map((s) => `• ${s.name} (${fmtBRL(s.price)})`)
        .join("<br>");
      const dateFormatted = new Date(selectedDateKey).toLocaleDateString(
        "pt-BR"
      );

      const confirm = await MySwal.fire({
        icon: "question",
        title: "Confirmar agendamento",
        html: `
        <div style="text-align:left;">
          <b>Colaborador:</b> ${collaboratorName}<br>
          <b>Data:</b> ${dateFormatted}<br>
          <b>Horário:</b> ${timeStr}<br>
          <b>Serviços:</b><br>${servicesList}<br>
          <b>Total:</b> ${fmtBRL(totalPrice)}
        </div>
      `,
        showCancelButton: true,
        confirmButtonText: "Confirmar",
        cancelButtonText: "Cancelar",
        reverseButtons: true,
      });

      if (!confirm.isConfirmed) return;

      const [h, m] = timeStr.split(":").map((n) => parseInt(n, 10));
      const [year, month, day] = selectedDateKey.split("-").map(Number);
const start = new Date(year, month - 1, day, h, m, 0);


      const user = JSON.parse(localStorage.getItem("user") || "null");

      let customerName = user
        ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
        : "";

      if (!customerName) {
        const { value: name } = await MySwal.fire({
          title: "Informe seu nome",
          input: "text",
          inputLabel: "Como devemos chamar você?",
          inputPlaceholder: "Ex: João Silva",
          confirmButtonText: "Continuar",
          cancelButtonText: "Cancelar",
          inputValidator: (v) =>
            !v ? "Por favor, informe seu nome para continuar." : undefined,
        });

        if (!name) return;
        customerName = name.trim();
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
        notes: "",
       order_datetime: start.toLocaleString("sv-SE").replace(" ", "T"),
        attendant_id: selectedCollaborator.id,
      };

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const { data } = await axios.post(`${apiBaseUrl}/order`, payload, {
        headers,
      });

      await MySwal.fire({
        icon: "success",
        title: "Agendamento confirmado!",
        text: data?.message || "Seu agendamento foi registrado com sucesso.",
      });

      navigate(`/establishment/view/${slug}`);
    } catch (err) {
      const data = err.response?.data || {};
      const baseMsg =
        data.error || data.message || "Não foi possível criar o agendamento.";

      if (data.suggestion) {
        const result = await MySwal.fire({
          icon: "warning",
          title: "Conflito de horário",
          html: `
          <div style="text-align:left;">
            <p>${baseMsg}</p>
            <p><b>${data.suggestion}</b></p>
            ${data.tip ? `<p class="text-muted small">${data.tip}</p>` : ""}
          </div>
        `,
          showCancelButton: true,
          confirmButtonText: "Agendar no horário sugerido",
          cancelButtonText: "Cancelar",
          reverseButtons: true,
        });

        if (result.isConfirmed) {
          const suggestion = data.suggestion.match(/\d{2}:\d{2}/);
          if (suggestion) {
            const newTime = suggestion[0];
            await loadAvailableTimes(
              selectedDateKey,
              selectedCollaborator,
              totalDuration
            );
            const isValidTime = availableTimes.includes(newTime);

            if (!isValidTime) {
              await MySwal.fire({
                icon: "info",
                title: "Horário incompatível",
                text: `O horário sugerido (${newTime}) não está dentro do período de atendimento do colaborador.`,
              });
              return;
            }

            await handleCreateAppointment(newTime);
          }
        }
      } else {
        await MySwal.fire({ icon: "error", title: "Erro", text: baseMsg });
      }
    }
  };

  if (loading)
    return (
      <div className="estv-root">
        <NavlogComponent />
        <Container className="text-center mt-5">
          <Spinner animation="border" variant="warning" />
        </Container>
      </div>
    );

  if (!establishment) return null;

  const title = `Agendar com ${establishment.name || ""}`;

  return (
    <div className="estv-root">
      <NavlogComponent />
      <div
        className="estv-hero text-center text-md-start"
        style={{
          backgroundImage: `url("${imageUrl(establishment.background)}")`,
        }}
      >
        <div className="estv-hero-overlay" />
        <Container
          fluid
          className="estv-hero-content d-flex flex-column flex-md-row align-items-center justify-content-between"
        >
          <div className="mb-3 mb-md-0">
            <img
              src={imageUrl(establishment.logo)}
              alt={establishment.name}
              className="estv-logo"
              onError={handleImgError}
            />
          </div>
          <div>
            <h1 className="estv-title">{title}</h1>
            <div className="d-flex flex-wrap gap-2 mt-2 justify-content-center justify-content-md-start">
              <Button
                size="sm"
                className="bg-black"
                onClick={openCollaboratorPicker}
              >
                Selecionar Colaborador
              </Button>
              <Button
                size="sm"
                className="bg-black"
                onClick={openServicePicker}
              >
                Selecionar Serviços
              </Button>
            </div>
            <div className="mt-3 text-center text-md-start">
              <Badge
                bg={selectedCollaborator ? "info" : "secondary"}
                text="dark"
                className="me-2"
              >
                {selectedCollaborator
                  ? `Colaborador: ${
                      (selectedCollaborator.user?.first_name || "") +
                      " " +
                      (selectedCollaborator.user?.last_name || "")
                    }`
                  : "Nenhum colaborador"}
              </Badge>
              <Badge bg={selectedServices.length ? "success" : "secondary"}>
                {selectedServices.length
                  ? `${selectedServices.length} serviço(s)`
                  : "Nenhum serviço"}
              </Badge>
              <div className="mt-2">
                <Badge bg="warning" text="dark" className="me-2">
                  Duração total: {totalDuration} min
                </Badge>
                <Badge bg="warning" text="dark">
                  Total: {fmtBRL(totalPrice)}
                </Badge>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container fluid className="estv-main">
        <Row className="gx-3 gy-3">
          <Col xs={12}>
            <Card bg="dark" text="light" className="mb-3">
              <Card.Header>
                <strong>Escolha uma data</strong>
              </Card.Header>
              <Card.Body className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start">
                {futureDays.map((d) => (
                  <Button
                    key={d.key}
                    size="sm"
                    variant={
                      selectedDateKey === d.key ? "warning" : "secondary"
                    }
                    onClick={() => {
                      setSelectedDateKey(d.key);
                      if (selectedCollaborator && selectedServices.length) {
                        loadAvailableTimes(
                          d.key,
                          selectedCollaborator,
                          totalDuration
                        );
                      }
                    }}
                    disabled={!selectedCollaborator || !selectedServices.length}
                  >
                    {d.label}
                  </Button>
                ))}
              </Card.Body>
            </Card>

            <Card bg="dark" text="light" className="mb-3">
              <Card.Header>
                <strong>Horários disponíveis</strong>
              </Card.Header>
              <Card.Body className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start">
                {!selectedCollaborator ||
                !selectedDateKey ||
                !selectedServices.length ? (
                  <div className="text-muted">
                    Selecione colaborador, serviços e uma data.
                  </div>
                ) : availableTimes.length ? (
                  availableTimes.map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      className="bg-black"
                      onClick={() => handleCreateAppointment(t)}
                    >
                      {t}
                    </Button>
                  ))
                ) : (
                  <div className="text-muted">Nenhum horário disponível.</div>
                )}
              </Card.Body>
            </Card>

            <Card bg="dark" text="light">
              <Card.Header>
                <strong>Serviços selecionados</strong>
              </Card.Header>
              <Card.Body>
                {selectedServices.length ? (
                  <Row className="gx-3 gy-3 justify-content-center justify-content-md-start">
                    {selectedServices.map((s) => (
                      <Col key={s.id} lg={3} md={4} sm={6} xs={12}>
                        <Card bg="black" text="light" className="h-100">
                          <Card.Body>
                            <div className="d-flex justify-content-between">
                              <strong>{s.name}</strong>
                              <span>{fmtBRL(s.price)}</span>
                            </div>
                            <div className="small text-muted">
                              {s.duration || 0} min
                            </div>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              className="mt-2 w-100"
                              onClick={() =>
                                setSelectedServices((prev) =>
                                  prev.filter(
                                    (x) => Number(x.id) !== Number(s.id)
                                  )
                                )
                              }
                            >
                              Remover
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div className="text-muted text-center">
                    Nenhum serviço selecionado.
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
