import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Container, Row, Col, Card, Button, Carousel, Badge } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaWhatsapp, FaInstagram } from "react-icons/fa";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./EstablishmentView.css";

const MySwal = withReactContent(Swal);
const TZ = "America/Sao_Paulo";
const PLACEHOLDER = "/images/logo.png";
const APP_ID = 3;

const fmtBRL = (v) =>
  `R$ ${Number(v || 0)
    .toFixed(2)
    .replace(".", ",")}`;
const toDateKey = (d) =>
  new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);
    const [serviceIndex, setServiceIndex] = useState(0); // ✅ mover pra cá
  const [establishment, setEstablishment] = useState(null);
  const [metrics, setMetrics] = useState(null);
const [interactionSummary, setInteractionSummary] = useState(null);
const [userInteractions, setUserInteractions] = useState([]);
const [otherEstablishments, setOtherEstablishments] = useState([]);
  const [items, setItems] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const imageUrl = (path) => (!path ? PLACEHOLDER : `${storageUrl}/${path}`);
  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = PLACEHOLDER;
  };

 
// 🧩 Atualize o useEffect principal:
useEffect(() => {
  let active = true;
  (async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/establishment/view/${slug}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!active) return;

      const est = res.data?.establishment || null;
      const its = Array.isArray(res.data?.items) ? res.data.items : [];
      const cols = Array.isArray(res.data?.collaborators)
        ? res.data.collaborators
        : [];

      // 🔹 Dados adicionais retornados da API (opcional)
      const met = res.data?.metrics || null;
      const inter = res.data?.interaction_summary || null;
      const users = Array.isArray(res.data?.user_interactions)
        ? res.data.user_interactions
        : [];
      const others = Array.isArray(res.data?.other_establishments)
        ? res.data.other_establishments
        : [];

      setEstablishment(est);
      setItems(its);
      setEmployers(cols);
      setMetrics(met);
      setInteractionSummary(inter);
      setUserInteractions(users);
      setOtherEstablishments(others);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível carregar o estabelecimento.",
      }).then(() => navigate("/"));
    } finally {
      if (active) setIsLoading(false);
    }
  })();

  return () => {
    active = false;
  };
}, [slug, navigate, token]);

  // 🧩 Filtra serviços e produtos
const services = useMemo(
  () =>
    items.filter(
      (i) =>
        String(i.status) === "1" &&
        String(i.type).toLowerCase().includes("serv")
    ),
  [items]
);

const products = useMemo(
  () =>
    items.filter(
      (i) =>
        String(i.status) === "1" &&
        String(i.type).toLowerCase().includes("prod")
    ),
  [items]
);


  const whatsappLink = useMemo(() => {
    const raw = String(establishment?.phone || "").replace(/\D/g, "");
    if (!raw) return null;
    const withCc = raw.startsWith("55") ? raw : `55${raw}`;
    return `https://wa.me/${withCc}`;
  }, [establishment]);

  const loadAvailableTimes = useCallback(
    async (dayKey, collaborator, durationMin) => {
      try {
        if (!dayKey || !collaborator || !durationMin) return [];
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : { "Content-Type": "application/json" };
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

        return Array.isArray(data.available_times) ? data.available_times : [];
      } catch (err) {
        console.error("Erro ao carregar horários:", err);
        return [];
      }
    },
    [token]
  );

  const handleCreateAppointment = async (
    service,
    collaborator,
    dateKey,
    timeStr
  ) => {
    try {
      // 🔒 Verifica autenticação
      if (!token) {
        const { value: loginData } = await MySwal.fire({
          title: "Entrar para agendar",
          html: `
          <input id="swal-username" class="swal2-input" placeholder="Usuário ou e-mail" />
          <input id="swal-password" type="password" class="swal2-input" placeholder="Senha" />
        `,
          focusConfirm: false,
          confirmButtonText: "Entrar",
          showCancelButton: true,
          background: "#0a0a0c",
          color: "#fff",
          preConfirm: async () => {
            const username = document.getElementById("swal-username").value;
            const password = document.getElementById("swal-password").value;
            if (!username || !password) {
              Swal.showValidationMessage("Informe usuário e senha");
              return false;
            }
            try {
              const { data } = await axios.post(`${apiBaseUrl}/auth/login`, {
                username,
                password,
              });
              const token =
                data.token?.access_token ||
                data.token?.original?.access_token ||
                data.access_token ||
                data.token;
              if (!token) throw new Error("Token não recebido");
              localStorage.setItem("token", token);
              localStorage.setItem("user", JSON.stringify(data.user));
              return { token, user: data.user };
            } catch (err) {
              Swal.showValidationMessage(
                err.response?.data?.error ||
                  err.response?.data?.message ||
                  "Falha ao autenticar"
              );
              return false;
            }
          },
        });

        if (!loginData) return;
        window.location.reload();
        return;
      }

      // 🧭 Validação dos parâmetros
      if (!collaborator || !dateKey || !service) return;

      const [h, m] = timeStr.split(":").map((n) => parseInt(n, 10));
      const [year, month, day] = dateKey.split("-").map(Number);
      const start = new Date(year, month - 1, day, h, m, 0);

      const user = JSON.parse(localStorage.getItem("user") || "null");
      let customerName = user
        ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
        : "";

      if (!customerName) {
        const { value: name } = await MySwal.fire({
          title: "Informe seu nome",
          input: "text",
          confirmButtonText: "Continuar",
          inputValidator: (v) =>
            !v ? "Por favor, informe seu nome para continuar." : undefined,
        });
        if (!name) return;
        customerName = name.trim();
      }

      // 🕒 Monta o datetime local no fuso de São Paulo
      const localISO = `${dateKey}T${timeStr}:00-03:00`;

      // 📦 Monta o payload
      const payload = {
        app_id: APP_ID,
        entity_name: "establishment",
        entity_id: establishment.id,
        items: [
          {
            item_id: service.id,
            quantity: 1,
            additions: [],
            removals: [],
          },
        ],
        customer_name: customerName,
        origin: "App",
        fulfillment: "dine-in",
        payment_status: "pending",
        payment_method: "Pix",
        notes: "",
        order_datetime: localISO,
        attendant_id: collaborator.id,
        appointment_status: "pending",
      };

      // 🚀 Envia para API
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };
      const { data } = await axios.post(`${apiBaseUrl}/order`, payload, {
        headers,
      });

      await MySwal.fire({
        icon: "success",
        title: "Agendamento confirmado!",
        text: data?.message || "Seu agendamento foi registrado com sucesso.",
        background: "#0a0a0c",
        color: "#fff",
      });
    } catch (err) {
      const data = err.response?.data || {};
      const msg =
        data.error || data.message || "Não foi possível criar o agendamento.";

      await MySwal.fire({
        icon: "error",
        title: "Horário indisponível",
        html: `
        <div style="color:#fff;text-align:left">
          <p>${msg}</p>
        </div>
      `,
        background: "#0a0a0c",
        color: "#fff",
        confirmButtonText: "Fechar",
      });
    }
  };

  const openSchedulePopup = async (service, preselectedEmployer = null) => {
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
      });
      days.push({ key, label });
    }

    let selectedDateKey = null;
    let selectedEmployer = preselectedEmployer;
    let availableTimes = [];

    await MySwal.fire({
      width: "850px",
      background: "#0a0a0c",
      title: `<div style="font-size:20px;font-weight:700;color:#fff;">Agendar ${
        service ? service.name : "serviço"
      }</div>`,
      html: `
        <style>
          .swl-container{color:#fff;text-align:center}
          .swl-days{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-bottom:10px}
          .swl-day{background:#111;color:#fff;border:1px solid #00aaff;border-radius:8px;padding:8px 10px;cursor:pointer;min-width:65px}
          .swl-day.active{background:#00aaff;color:#000}
          .swl-emps{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:10px}
          .swl-emp{width:90px;padding:5px;background:#111;border-radius:10px;cursor:pointer;color:#fff;transition:0.3s}
          .swl-emp.active{border:2px solid #00ffff;box-shadow:0 0 10px rgba(0,255,255,0.5)}
          .swl-times{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:10px}
          .swl-time{background:#111;color:#fff;border:1px solid #00aaff;border-radius:8px;padding:6px 12px;cursor:pointer}
          .swl-time:hover{background:#00ffff;color:#000}
        </style>
        <div class="swl-container">
          <div class="swl-days">
            ${days
              .map(
                (d) =>
                  `<button class="swl-day" data-key="${d.key}">${d.label}</button>`
              )
              .join("")}
          </div>
          <div>Selecione um profissional</div>
          <div class="swl-emps">
            ${employers
              .map(
                (e) => `
              <div class="swl-emp ${
                preselectedEmployer?.id === e.id ? "active" : ""
              }" data-id="${e.id}">
                <img src="${imageUrl(
                  e.user?.avatar
                )}" onerror="this.src='${PLACEHOLDER}'" style="width:60px;height:60px;border-radius:50%;object-fit:cover;margin-bottom:4px;"/>
                <div style="font-size:13px;">${
                  e.user?.first_name || "Profissional"
                }</div>
              </div>`
              )
              .join("")}
          </div>
          <div>Horários disponíveis</div>
          <div id="swl-times" class="swl-times"></div>
        </div>
      `,
      showConfirmButton: false,
      didOpen: () => {
        const root = MySwal.getHtmlContainer();
        const daysBtns = root.querySelectorAll(".swl-day");
        const empBtns = root.querySelectorAll(".swl-emp");
        const timesDiv = root.querySelector("#swl-times");

        const renderTimes = async () => {
          timesDiv.innerHTML = `<div class="text-muted small">Carregando horários...</div>`;
          if (!selectedDateKey || !selectedEmployer) {
            timesDiv.innerHTML = `<div class="text-muted small">Selecione data e profissional.</div>`;
            return;
          }
          availableTimes = await loadAvailableTimes(
            selectedDateKey,
            selectedEmployer,
            service?.duration || 30
          );
          timesDiv.innerHTML = availableTimes.length
            ? availableTimes
                .map(
                  (t) =>
                    `<button class="swl-time" data-time="${t}">${t}</button>`
                )
                .join("")
            : `<div class="text-muted small">Nenhum horário disponível.</div>`;
          timesDiv.querySelectorAll(".swl-time").forEach((btn) =>
            btn.addEventListener("click", async () => {
              await handleCreateAppointment(
                service,
                selectedEmployer,
                selectedDateKey,
                btn.getAttribute("data-time")
              );
            })
          );
        };

        const updateAndRender = async () => {
          if (selectedDateKey && selectedEmployer) await renderTimes();
        };

        daysBtns.forEach((btn) =>
          btn.addEventListener("click", async () => {
            daysBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            selectedDateKey = btn.getAttribute("data-key");
            await updateAndRender();
          })
        );

        empBtns.forEach((btn) =>
          btn.addEventListener("click", async () => {
            empBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const id = Number(btn.getAttribute("data-id"));
            selectedEmployer = employers.find((e) => e.id === id);
            await updateAndRender();
          })
        );

        updateAndRender();
      },
    });
  };

  if (isLoading)
    return (
      <div className="estv-root">
        <NavlogComponent />
      </div>
    );

  if (!establishment) return null;

  return (
    <div className="estv-root">
      <NavlogComponent />
      <div
        className="estv-hero"
        style={{
          backgroundImage: `url("${imageUrl(establishment.background)}")`,
        }}
      >
        <div className="estv-hero-overlay" />
        <Container fluid className="estv-hero-content">
          <div className="estv-hero-left">
            <img
              src={imageUrl(establishment.logo)}
              alt={establishment.name}
              className="estv-logo"
              onError={handleImgError}
            />
          </div>
          <div className="estv-hero-right">
            <h1 className="estv-title">{establishment.name}</h1>
            <div className="estv-desc">{establishment.description || ""}</div>
          </div>
        </Container>
      </div>

      <Container fluid className="estv-main">
        <Row className="gx-3 gy-4">
         <Col md={8}>
   <Col md={12}>
              {services.length > 0 && (
                <Card bg="dark" text="light" className="mb-4 shadow-lg border-0 rounded-4">
                  <Card.Header className="bg-black text-center py-3 border-0">
                    <strong className="text-uppercase">Serviços</strong>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Carousel
                      activeIndex={serviceIndex}
                      onSelect={(selected) => setServiceIndex(selected)}
                      controls={true}
                      indicators={false}
                      interval={null}
                      fade={false}
                      pause="hover"
                      touch={true}
                      slide={true}
                    >
                      {services.map((sv, idx) => (
                        <Carousel.Item key={sv.id ? `sv-${sv.id}` : `sv-${idx}`}>
                          <div className="d-flex justify-content-center">
                            <Card
                              bg="black"
                              text="light"
                              className="estv-card border-0 rounded-4 shadow w-100"
                              style={{ maxWidth: "22rem" }}
                            >
                              {sv.image ? (
                                <div className="estv-media-wrap">
                                  <img
                                    src={imageUrl(sv.image)}
                                    alt={sv.name}
                                    className="estv-media"
                                    onError={handleImgError}
                                  />
                                </div>
                              ) : null}

                              <Card.Body className="p-3">
                                <div className="estv-item-name fw-bold text-center mb-2">
                                  {sv.name}
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <div className="estv-item-price">{fmtBRL(sv.price)}</div>
                                  {sv.duration ? (
                                    <Badge bg="warning" text="dark">
                                      {sv.duration} min
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="d-flex gap-2">
                                  <Button
                                    size="sm"
                                    className="flex-fill button"
                                    onClick={async () => {
                                      const tk = localStorage.getItem("token");
                                      if (!tk) {
                                        await MySwal.fire({
                                          width: "400px",
                                          background: "#0a0a0c",
                                          title: "Entrar para agendar",
                                          html: `
                                            <div style="text-align:center;">
                                              <img src="/images/logo.png" alt="Rasoio" style="width:120px;margin-bottom:10px;" />
                                              <input id="swal-username" class="swal2-input" placeholder="Usuário ou e-mail" />
                                              <input id="swal-password" type="password" class="swal2-input" placeholder="Senha" />
                                              <button id="swal-login-btn" class="swal2-confirm swal2-styled" style="width:100%;margin-top:10px;background:#00bcd4;border:none;">
                                                Entrar
                                              </button>
                                              <div id="swal-google" style="margin-top:10px;"></div>
                                              <a href="/register" style="display:block;margin-top:10px;color:#00ffff;">Registrar-se</a>
                                              <a href="/password-email" style="display:block;margin-top:4px;color:#888;">Esqueceu a senha?</a>
                                            </div>
                                          `,
                                          showConfirmButton: false,
                                          didOpen: () => {
                                            const container = MySwal.getHtmlContainer();
                                            const loginBtn =
                                              container.querySelector("#swal-login-btn");
                                            const googleDiv =
                                              container.querySelector("#swal-google");

                                            loginBtn.addEventListener("click", async () => {
                                              const username =
                                                container.querySelector("#swal-username").value;
                                              const password =
                                                container.querySelector("#swal-password").value;
                                              if (!username || !password) {
                                                Swal.showValidationMessage("Informe usuário e senha");
                                                return;
                                              }
                                              try {
                                                const { data } = await axios.post(
                                                  `${apiBaseUrl}/auth/login`,
                                                  {
                                                    username,
                                                    password,
                                                  }
                                                );
                                                const tokenFromApi =
                                                  data.token?.access_token ||
                                                  data.token?.original?.access_token ||
                                                  data.access_token ||
                                                  data.token;
                                                if (!tokenFromApi)
                                                  throw new Error("Token não recebido");
                                                localStorage.setItem("token", tokenFromApi);
                                                localStorage.setItem(
                                                  "user",
                                                  JSON.stringify(data.user || {})
                                                );
                                                Swal.close();
                                                window.location.reload();
                                              } catch (err) {
                                                Swal.showValidationMessage(
                                                  err.response?.data?.error ||
                                                    err.response?.data?.message ||
                                                    "Falha ao autenticar"
                                                );
                                              }
                                            });

                                            import("@react-oauth/google").then(
                                              ({ GoogleLogin, GoogleOAuthProvider }) => {
                                                const root = document.createElement("div");
                                                googleDiv.appendChild(root);
                                                const React = require("react");
                                                const ReactDOM = require("react-dom/client");
                                                const rootInstance = ReactDOM.createRoot(root);

                                                rootInstance.render(
                                                  React.createElement(GoogleOAuthProvider, {
                                                    clientId:
                                                      process.env.REACT_APP_GOOGLE_CLIENT_ID,
                                                    children: React.createElement(GoogleLogin, {
                                                      onSuccess: async ({ credential }) => {
                                                        try {
                                                          const { data } = await axios.post(
                                                            `${apiBaseUrl}/auth/google`,
                                                            {
                                                              token_id: credential,
                                                            }
                                                          );
                                                          const tokenFromApi =
                                                            data.token?.access_token ||
                                                            data.token?.original?.access_token ||
                                                            data.access_token ||
                                                            data.token;
                                                          if (!tokenFromApi)
                                                            throw new Error(
                                                              "Token Google não recebido"
                                                            );
                                                          localStorage.setItem(
                                                            "token",
                                                            tokenFromApi
                                                          );
                                                          localStorage.setItem(
                                                            "user",
                                                            JSON.stringify(data.user || {})
                                                          );
                                                          Swal.close();
                                                          window.location.reload();
                                                        } catch (err) {
                                                          Swal.showValidationMessage(
                                                            err.response?.data?.error ||
                                                              err.response?.data?.message ||
                                                              "Falha no login com Google"
                                                          );
                                                        }
                                                      },
                                                      onError: () => {
                                                        Swal.showValidationMessage(
                                                          "Falha no login com Google"
                                                        );
                                                      },
                                                    }),
                                                  })
                                                );
                                              }
                                            );
                                          },
                                        });
                                        return;
                                      }
                                      openSchedulePopup(sv);
                                    }}
                                  >
                                    Agendar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline-light"
                                    className="flex-fill button"
                                    onClick={() => navigate(`/item/view/${sv.slug || ""}`)}
                                  >
                                    Detalhes
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          </div>
                        </Carousel.Item>
                      ))}
                    </Carousel>
                  </Card.Body>
                </Card>
              )}
            </Col>

  <Col md={12}>
    {products.length > 0 && (
      <Card bg="dark" text="light" className="mb-4 shadow-lg border-0 rounded-4">
        <Card.Header className="bg-black text-center py-3 border-0">
          <strong className="text-uppercase">Produtos</strong>
        </Card.Header>
        <Card.Body className="p-0">
          <Carousel
            controls={true}
            indicators={false}
            interval={null}
            fade={false}
            pause="hover"
            touch={true}
          >
            {products.map((pd, idx) => (
              <Carousel.Item key={`${pd.id}-${idx}`}>
                <div className="d-flex justify-content-center">
                  <Card
                    bg="black"
                    text="light"
                    className="estv-card border-0 rounded-4 shadow w-100"
                    style={{ maxWidth: "22rem" }}
                  >
                    {pd.image && (
                      <div className="estv-media-wrap">
                        <img
                          src={imageUrl(pd.image)}
                          alt={pd.name}
                          className="estv-media"
                          onError={handleImgError}
                        />
                      </div>
                    )}
                    <Card.Body className="p-3">
                      <div className="estv-item-name fw-bold text-center mb-2">
                        {pd.name}
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="estv-item-price">{fmtBRL(pd.price)}</div>
                        {pd.stock && (
                          <Badge bg="info" text="dark">
                            {pd.stock} unid.
                          </Badge>
                        )}
                      </div>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-light"
                          className="flex-fill button"
                          onClick={() => navigate(`/item/view/${pd.slug || ""}`)}
                        >
                          Detalhes
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        </Card.Body>
      </Card>
    )}
  </Col>
</Col>


          <Col md={4}>
            {employers.length > 0 && (
              <Card bg="dark" text="light" className="mb-4">
                <Card.Header>
                  <strong>Equipe</strong>
                </Card.Header>
                <Card.Body>
                  {employers.map((emp) => (
                    <div
                      key={emp.id}
                      className="d-flex align-items-center justify-content-between mb-3"
                    >
                      <div
                        className="d-flex align-items-center"
                        onClick={() =>
                          navigate(`/employer/view/${emp.user?.user_name}`)
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <img
                          src={imageUrl(emp.user?.avatar)}
                          onError={handleImgError}
                          className="rounded-circle me-3"
                          style={{
                            width: 50,
                            height: 50,
                            objectFit: "cover",
                            border: "2px solid rgba(255,255,255,0.1)",
                          }}
                        />
                        <div>
                          <div className="fw-semibold text-light">
                            {emp.user?.first_name} {emp.user?.last_name}
                          </div>
                          <div className="text-muted small">
                            {emp.role || "Profissional"}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline-info"
                        onClick={async () => {
                          let token = localStorage.getItem("token");

                          if (!token) {
                            await MySwal.fire({
                              width: "400px",
                              background: "#0a0a0c",
                              title: "Entrar para agendar",
                              html: `
          <div style="text-align:center;">
            <img src="/images/logo.png" alt="Rasoio" style="width:120px;margin-bottom:10px;" />
            <input id="swal-username" class="swal2-input" placeholder="Usuário ou e-mail" />
            <input id="swal-password" type="password" class="swal2-input" placeholder="Senha" />
            <button id="swal-login-btn" class="swal2-confirm swal2-styled" style="width:100%;margin-top:10px;background:#00bcd4;border:none;">
              Entrar
            </button>
            <div id="swal-google" style="margin-top:10px;"></div>
            <a href="/register" style="display:block;margin-top:10px;color:#00ffff;">Registrar-se</a>
            <a href="/password-email" style="display:block;margin-top:4px;color:#888;">Esqueceu a senha?</a>
          </div>
        `,
                              showConfirmButton: false,
                              didOpen: () => {
                                const container = MySwal.getHtmlContainer();
                                const loginBtn =
                                  container.querySelector("#swal-login-btn");
                                const googleDiv =
                                  container.querySelector("#swal-google");

                                loginBtn.addEventListener("click", async () => {
                                  const username =
                                    container.querySelector(
                                      "#swal-username"
                                    ).value;
                                  const password =
                                    container.querySelector(
                                      "#swal-password"
                                    ).value;
                                  if (!username || !password) {
                                    Swal.showValidationMessage(
                                      "Informe usuário e senha"
                                    );
                                    return;
                                  }
                                  try {
                                    const { data } = await axios.post(
                                      `${apiBaseUrl}/auth/login`,
                                      {
                                        username,
                                        password,
                                      }
                                    );
                                    const tk =
                                      data.token?.access_token ||
                                      data.token?.original?.access_token ||
                                      data.access_token ||
                                      data.token;
                                    if (!tk)
                                      throw new Error("Token não recebido");
                                    localStorage.setItem("token", tk);
                                    localStorage.setItem(
                                      "user",
                                      JSON.stringify(data.user || {})
                                    );
                                    Swal.close();
                                    window.location.reload();
                                  } catch (err) {
                                    Swal.showValidationMessage(
                                      err.response?.data?.error ||
                                        err.response?.data?.message ||
                                        "Falha ao autenticar"
                                    );
                                  }
                                });

                                import("@react-oauth/google").then(
                                  ({ GoogleLogin, GoogleOAuthProvider }) => {
                                    const root = document.createElement("div");
                                    googleDiv.appendChild(root);
                                    const React = require("react");
                                    const ReactDOM = require("react-dom/client");
                                    const rootInstance =
                                      ReactDOM.createRoot(root);

                                    rootInstance.render(
                                      React.createElement(GoogleOAuthProvider, {
                                        clientId:
                                          process.env
                                            .REACT_APP_GOOGLE_CLIENT_ID,
                                        children: React.createElement(
                                          GoogleLogin,
                                          {
                                            onSuccess: async ({
                                              credential,
                                            }) => {
                                              try {
                                                const { data } =
                                                  await axios.post(
                                                    `${apiBaseUrl}/auth/google`,
                                                    {
                                                      token_id: credential,
                                                    }
                                                  );
                                                const tk =
                                                  data.token?.access_token ||
                                                  data.token?.original
                                                    ?.access_token ||
                                                  data.access_token ||
                                                  data.token;
                                                if (!tk)
                                                  throw new Error(
                                                    "Token Google não recebido"
                                                  );
                                                localStorage.setItem(
                                                  "token",
                                                  tk
                                                );
                                                localStorage.setItem(
                                                  "user",
                                                  JSON.stringify(
                                                    data.user || {}
                                                  )
                                                );
                                                Swal.close();
                                                window.location.reload();
                                              } catch (err) {
                                                Swal.showValidationMessage(
                                                  err.response?.data?.error ||
                                                    err.response?.data
                                                      ?.message ||
                                                    "Falha no login com Google"
                                                );
                                              }
                                            },
                                            onError: () => {
                                              Swal.showValidationMessage(
                                                "Falha no login com Google"
                                              );
                                            },
                                          }
                                        ),
                                      })
                                    );
                                  }
                                );
                              },
                            });
                            return;
                          }

                          if (services.length === 0) {
                            await MySwal.fire({
                              icon: "info",
                              title: "Nenhum serviço disponível",
                              text: "Este estabelecimento ainda não possui serviços cadastrados.",
                              background: "#0a0a0c",
                              color: "#fff",
                            });
                            return;
                          }

                          // Se estiver logado, abre o seletor de serviços e o popup com o colaborador pré-selecionado
                          const { value: selectedServiceIds } =
                            await MySwal.fire({
                              title: "Selecione os serviços",
                              background: "#0a0a0c",
                              color: "#fff",
                              html: `
        <div style="text-align:left;max-height:300px;overflow-y:auto;padding:6px;">
          ${services
            .map(
              (s) => `
              <div style="margin-bottom:6px;">
                <label style="display:flex;align-items:center;gap:8px;color:#fff;cursor:pointer;">
                  <input type="checkbox" value="${
                    s.id
                  }" style="transform:scale(1.2)" />
                  <span>${s.name} — ${fmtBRL(s.price)} (${
                s.duration || 0
              }min)</span>
                </label>
              </div>
            `
            )
            .join("")}
        </div>
      `,
                              confirmButtonText: "Continuar",
                              cancelButtonText: "Cancelar",
                              showCancelButton: true,
                              focusConfirm: false,
                              preConfirm: () => {
                                const checked = Array.from(
                                  Swal.getPopup().querySelectorAll(
                                    "input[type='checkbox']:checked"
                                  )
                                ).map((el) => Number(el.value));
                                if (checked.length === 0) {
                                  Swal.showValidationMessage(
                                    "Selecione pelo menos um serviço."
                                  );
                                  return false;
                                }
                                return checked;
                              },
                            });

                          if (
                            !selectedServiceIds ||
                            selectedServiceIds.length === 0
                          )
                            return;

                          const selectedServices = services.filter((s) =>
                            selectedServiceIds.includes(s.id)
                          );
                          const totalDuration = selectedServices.reduce(
                            (sum, s) => sum + (s.duration || 0),
                            0
                          );

                          openSchedulePopup(
                            {
                              name: selectedServices
                                .map((s) => s.name)
                                .join(", "),
                              id: selectedServices.map((s) => s.id),
                              duration: totalDuration,
                            },
                            emp
                          );
                        }}
                      >
                        Agendar
                      </Button>
                    </div>
                  ))}
                </Card.Body>
              </Card>





            )}
            {/* 📍 LOCALIZAÇÃO NO MAPA */}
{establishment?.location && (
  <Card bg="dark" text="light" className="mb-4">
    <Card.Header>📍 Localização</Card.Header>
    <Card.Body>
      <div
        className="estv-map-container ratio ratio-16x9 rounded overflow-hidden"
        dangerouslySetInnerHTML={{ __html: establishment.location }}
      />
    </Card.Body>
  </Card>
)}

  {/* 📊 MÉTRICAS GERAIS */}
  {metrics && (
    <Card bg="dark" text="light" className="mb-4">
      <Card.Header>📊 Métricas Gerais</Card.Header>
      <Card.Body>
        <ul className="list-unstyled mb-0">
          <li><strong>Itens:</strong> {metrics.total_items || 0}</li>
          <li><strong>Serviços:</strong> {metrics.total_services || 0}</li>
          <li><strong>Produtos:</strong> {metrics.total_products || 0}</li>
          <li><strong>Visualizações:</strong> {metrics.total_views || 0}</li>
          <li><strong>Usuários únicos:</strong> {metrics.unique_users || 0}</li>
        </ul>
      </Card.Body>
    </Card>
  )}

  {/* 👁️ INTERAÇÕES */}
  {interactionSummary && (
    <Card bg="dark" text="light" className="mb-4">
      <Card.Header>👁️ Interações</Card.Header>
      <Card.Body>
        <p><strong>Total de visualizações:</strong> {interactionSummary.total_views || 0}</p>
        <p><strong>Usuários únicos:</strong> {interactionSummary.unique_users || 0}</p>

        {interactionSummary.most_active_user && (
          <p>
            <strong>Mais ativo:</strong> {interactionSummary.most_active_user.name} (
            {interactionSummary.most_active_user.views} visualizações)
          </p>
        )}

        {interactionSummary.last_view_user && (
          <p>
            <strong>Último visitante:</strong> {interactionSummary.last_view_user.name} em{" "}
            {interactionSummary.last_view_user.last_view
              ? new Date(interactionSummary.last_view_user.last_view).toLocaleString("pt-BR")
              : "—"}
          </p>
        )}
      </Card.Body>
    </Card>
  )}

  {/* 🧑‍💻 USUÁRIOS RECENTES */}
  {userInteractions?.length > 0 && (
    <Card bg="dark" text="light" className="mb-4">
      <Card.Header>🧑‍💻 Usuários Recentes</Card.Header>
      <Card.Body>
        {userInteractions.slice(0, 5).map((user) => (
          <div
            key={user.user_id}
            className="d-flex align-items-center mb-3 estv-employer-item"
          >
            <img
              src={imageUrl(user.user_avatar)}
              onError={handleImgError}
              className="rounded-circle me-3"
              style={{
                width: 45,
                height: 45,
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.1)",
              }}
            />
            <div>
              <div className="fw-semibold text-light">
                {user.user_name || "Usuário"}
              </div>
              <div className="text-muted small">
                {user.last_view
                  ? new Date(user.last_view).toLocaleDateString("pt-BR")
                  : "—"}
              </div>
            </div>
          </div>
        ))}
      </Card.Body>
    </Card>
  )}


  {/* 🏪 OUTROS ESTABELECIMENTOS */}
  {otherEstablishments?.length > 0 && (
    <Card bg="dark" text="light" className="mb-4">
      <Card.Header>🏪 Outros Estabelecimentos</Card.Header>
      <Card.Body>
        {otherEstablishments.slice(0, 5).map((est) => (
          <div
            key={est.id}
            className="d-flex align-items-center mb-3 estv-employer-item"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/establishment/view/${est.slug}`)}
          >
            <img
              src={imageUrl(est.logo)}
              onError={handleImgError}
              className="rounded-circle me-3"
              style={{
                width: 45,
                height: 45,
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.1)",
              }}
            />
            <div>
              <div className="fw-semibold text-light">
                {est.name || "Estabelecimento"}
              </div>
              <div className="text-muted small">
                {est.city || "Local desconhecido"}
              </div>
            </div>
          </div>
        ))}
      </Card.Body>
    </Card>
  )}
  {/* ℹ️ INFORMAÇÕES COMPLEMENTARES */}
  {establishment && (
    <Card bg="dark" text="light" className="mb-4">
      <Card.Header>ℹ️ Informações</Card.Header>
      <Card.Body>
        <p><strong>Categoria:</strong> {establishment.category || "—"}</p>
        <p><strong>Cidade:</strong> {establishment.city || "—"}</p>
        <p>
          <strong>Criado em:</strong>{" "}
          {establishment.created_at
            ? new Date(establishment.created_at).toLocaleDateString("pt-BR")
            : "—"}
        </p>
        <p>
          <strong>Atualizado em:</strong>{" "}
          {establishment.updated_at
            ? new Date(establishment.updated_at).toLocaleDateString("pt-BR")
            : "—"}
        </p>
      </Card.Body>
    </Card>
  )}
          </Col>
        </Row>
      </Container>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="estv-whatsapp-fab"
          aria-label={`Chamar ${establishment.name} no WhatsApp`}
          title="Chamar no WhatsApp"
        >
          <FaWhatsapp className="estv-whatsapp-icon" />
        </a>
      )}
    </div>
  );
}
