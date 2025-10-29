// src/pages/employer/EmployerDashboardPage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Container, Row, Col, Card, Badge, Button, Form, Dropdown, ButtonGroup } from "react-bootstrap";
import { Calendar3, ArrowRepeat, CheckCircle, XCircle, Clock, Bell, Funnel, ListUl } from "react-bootstrap-icons";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl } from "../../config";
import "./EmployerDashboard.css";

const MySwal = withReactContent(Swal);
const TZ = "America/Sao_Paulo";

/* ==============================
   Utils
   ============================== */
function normalizeDateLike(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  try {
    return new Date(value.includes(" ") ? value.replace(" ", "T") : value);
  } catch {
    return null;
  }
}
function toIsoDate(value) {
  const d = normalizeDateLike(value);
  if (!d) return "";
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}
function toHourMin(value) {
  const d = normalizeDateLike(value);
  if (!d) return "";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}
function money(v) {
  const n = parseFloat(v || 0);
  return n.toFixed(2).replace(".", ",");
}
function translateStatus(status) {
  switch (status) {
    case "pending":
      return "Pendente";
    case "confirmed":
      return "Confirmado";
    case "cancelled":
      return "Cancelado";
    case "attended":
      return "Atendido";
    case "not_attended":
      return "Não Atendido";
    default:
      return status;
  }
}
function weekdayPt(value) {
  const d = normalizeDateLike(value);
  if (!d) return "";
  return d.toLocaleDateString("pt-BR", { weekday: "long", timeZone: TZ });
}
function shortPt(value) {
  const d = normalizeDateLike(value);
  if (!d) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: TZ });
}
function isSameDayISO(a, b) {
  return toIsoDate(a) === toIsoDate(b);
}
function startOfDayISO(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return toIsoDate(date);
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function getWeekdayIndex(d) {
  return normalizeDateLike(d)?.getDay() ?? 0; // 0 dom - 6 sáb
}
const PT_WEEK = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const STATUS_KEYS = ["all", "pending", "confirmed", "attended", "not_attended", "cancelled"];

/* ==============================
   Component
   ============================== */
export default function EmployerDashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // histórico (inclui finalizados) para filtros por status
  const [summary, setSummary] = useState({ total: 0, today: 0, tomorrow: 0, value: 0 });
  const [nextAppointment, setNextAppointment] = useState(null);
  const [lastAppointment, setLastAppointment] = useState(null);
  const [nextPendingAppointment, setNextPendingAppointment] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]); // persistente (não zera quando não houver novos)
  const [filters, setFilters] = useState({ search: "", day: "all", status: "all" });
  const [localLoading, setLocalLoading] = useState(true);
  const [notifQueue, setNotifQueue] = useState([]); // notificações de novas mudanças
  const [flashIds, setFlashIds] = useState(new Set()); // ids com efeito pulse

  const meRef = useRef(null);
  const lastCheckRef = useRef(null);
  const recentStoreRef = useRef([]); // mantém o último estado persistente dos recentes

  const token = useMemo(() => localStorage.getItem("token"), []);
  const safeAxios = useCallback(
    async (fn) => {
      const instance = axios.create();
      instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      return await fn(instance);
    },
    [token]
  );

  const recomputeSummary = useCallback((list) => {
    const todayISO = toIsoDate(new Date());
    const tomorrowISO = toIsoDate(addDays(new Date(), 1));
    const total = list.length;
    const todayCount = list.filter((a) => toIsoDate(a.order_datetime) === todayISO).length;
    const tomorrowCount = list.filter((a) => toIsoDate(a.order_datetime) === tomorrowISO).length;
    const totalValue = list.reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
    setSummary({ total, today: todayCount, tomorrow: tomorrowCount, value: totalValue });
  }, []);

  const computeNexts = useCallback((list) => {
    const now = new Date();
    const upcoming = list
      .filter((a) => ["pending", "confirmed"].includes(a.appointment_status) && normalizeDateLike(a.order_datetime) >= now)
      .sort((a, b) => new Date(a.order_datetime) - new Date(b.order_datetime));

    const prevs = list
      .filter((a) => normalizeDateLike(a.order_datetime) < now)
      .sort((a, b) => new Date(a.order_datetime) - new Date(b.order_datetime));

    setNextAppointment(upcoming[0] || null);
    setLastAppointment(prevs.length ? prevs[prevs.length - 1] : null);

    const onlyPendingUpcoming = upcoming.filter((a) => a.appointment_status === "pending");
    setNextPendingAppointment(onlyPendingUpcoming[0] || null);
  }, []);

  const loadInitial = useCallback(async () => {
    try {
      setLocalLoading(true);
      const { data: me } = await safeAxios((req) => req.get(`${apiBaseUrl}/auth/me`));
      meRef.current = me || {};

      // lista base (pendentes/confirmados) p/ cartões & próximos
      const { data: listResp } = await safeAxios((req) => req.get(`${apiBaseUrl}/employer/appointments`));
      const baseList = Array.isArray(listResp.appointments) ? listResp.appointments : [];

      // histórico completo por status (se disponível)
      let fullOrders = [];
      try {
        const { data: allResp } = await safeAxios((req) => req.get(`${apiBaseUrl}/order/listbyemployer`));
        const arr = Array.isArray(allResp?.orders) ? allResp.orders : [];
        fullOrders = arr.filter((o) => (o.type || "appointment") === "appointment");
      } catch {
        fullOrders = baseList;
      }

      setAppointments(baseList);
      setAllOrders(fullOrders);

      recomputeSummary(baseList);
      computeNexts(baseList);

      // manter recentes inicial com os mais novos dos últimos 3 criados (se houver)
      const recentSeed = [...baseList]
        .sort((a, b) => new Date(b.created_at || b.order_datetime) - new Date(a.created_at || a.order_datetime))
        .slice(0, 3);
      setRecentAppointments(recentSeed);
      recentStoreRef.current = recentSeed;

      lastCheckRef.current = new Date().toISOString();
    } catch (e) {
      console.warn("Falha ao carregar inicial:", e);
    } finally {
      setLocalLoading(false);
    }
  }, [computeNexts, recomputeSummary, safeAxios]);

  const enqueueFlash = useCallback((ids = []) => {
    if (!ids.length) return;
    setFlashIds((prev) => {
      const clone = new Set(prev);
      ids.forEach((id) => clone.add(id));
      return clone;
    });
    setTimeout(() => {
      setFlashIds((prev) => {
        const clone = new Set(prev);
        ids.forEach((id) => clone.delete(id));
        return clone;
      });
    }, 2200);
  }, []);

  const pushNotification = useCallback((title, body, kind = "info", payload = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setNotifQueue((q) => [{ id, title, body, kind, payload }, ...q].slice(0, 6));
    setTimeout(() => {
      setNotifQueue((q) => q.filter((n) => n.id !== id));
    }, 8000);
  }, []);

  const updateRecentPersistent = useCallback((incoming = []) => {
    if (!Array.isArray(incoming) || !incoming.length) return recentStoreRef.current;
    const mapExisting = new Map(recentStoreRef.current.map((r) => [r.id, r]));
    incoming.forEach((i) => mapExisting.set(i.id, i));
    // ordenar por created_at (fallback order_datetime) desc
    const merged = Array.from(mapExisting.values()).sort(
      (a, b) =>
        new Date(b.created_at || b.order_datetime) - new Date(a.created_at || a.order_datetime)
    );
    const limited = merged.slice(0, 6);
    recentStoreRef.current = limited;
    setRecentAppointments(limited);
    return limited;
  }, []);

  const checkUpdates = useCallback(async () => {
    try {
      const employerId = meRef.current?.employer?.id || JSON.parse(localStorage.getItem("employer") || "{}")?.id;
      if (!employerId) return;

      const params = new URLSearchParams();
      params.append("employer_id", employerId);
      if (lastCheckRef.current) params.append("last_check", lastCheckRef.current);

      const { data } = await safeAxios((req) =>
        req.get(`${apiBaseUrl}/employer/check-updates?${params.toString()}`)
      );

      lastCheckRef.current = data?.checked_at || new Date().toISOString();

      const newOnes = Array.isArray(data?.new_appointments) ? data.new_appointments : [];
      const nextApp = data?.next_appointment || null;

      // notificar & piscada para novos
      if (newOnes.length) {
        enqueueFlash(newOnes.map((n) => n.id));
        newOnes.forEach((n) => {
          pushNotification(
            "Novo agendamento recebido",
            `${n.customer_name} — ${shortPt(n.order_datetime)} às ${toHourMin(n.order_datetime)}`,
            "success",
            { id: n.id }
          );
        });
      }

      // atualizar cartões principais com base no que veio
      if (nextApp) setNextAppointment(nextApp);

      // persistir recentes
      const persisted = updateRecentPersistent(newOnes);

      // atualizar lista base (apenas pendentes/confirmados) chamando novamente appointments
      try {
        const { data: listResp } = await safeAxios((req) => req.get(`${apiBaseUrl}/employer/appointments`));
        const base = Array.isArray(listResp.appointments) ? listResp.appointments : [];
        setAppointments(base);
        recomputeSummary(base);
        computeNexts(base);
      } catch {}

      // garantir que, se não vier nada, os recentes permaneçam (persisted já garante)
      if (!newOnes.length && !persisted.length && appointments.length) {
        updateRecentPersistent([appointments[0]]);
      }
    } catch (e) {
      console.warn("Falha ao verificar atualizações:", e);
    }
  }, [appointments.length, computeNexts, enqueueFlash, pushNotification, recomputeSummary, safeAxios, updateRecentPersistent]);

  const handleAction = async (appt, action) => {
    const confirm =
      action === "cancel"
        ? await MySwal.fire({
            title: "Cancelar Agendamento",
            input: "text",
            inputPlaceholder: "Motivo (opcional)",
            showCancelButton: true,
            confirmButtonText: "Confirmar",
            cancelButtonText: "Fechar",
            background: "#121212",
            color: "#fff",
          })
        : { isConfirmed: true };

    if (!confirm.isConfirmed) return;

    try {
      setLocalLoading(true);
      const payload = { action };
      if (confirm.value) payload.reason = confirm.value;

      const { data } = await safeAxios((req) =>
        req.put(`${apiBaseUrl}/order/${appt.id}/update-appointment-status`, payload)
      );

      const msg = data?.message || "Operação concluída com sucesso!";
      await MySwal.fire({
        icon: data?.error ? "error" : "success",
        title: data?.error ? "Erro" : "Sucesso",
        text: msg,
        background: "#121212",
        color: "#fff",
      });

      await loadInitial();
    } catch {
      await MySwal.fire({
        icon: "error",
        title: "Erro",
        text: "Falha ao atualizar status.",
        background: "#121212",
        color: "#fff",
      });
    } finally {
      setLocalLoading(false);
    }
  };

  const timeButtons = useMemo(() => {
    const today = new Date();
    const yesterday = addDays(today, -1);
    const tomorrow = addDays(today, 1);

    const todayIdx = getWeekdayIndex(today);
    const names = PT_WEEK;

    const seq = [
      { key: "yesterday", label: "Ontem", dateISO: startOfDayISO(yesterday) },
      { key: "today", label: "Hoje", dateISO: startOfDayISO(today) },
      { key: "tomorrow", label: "Amanhã", dateISO: startOfDayISO(tomorrow) },
    ];

    // a partir de amanhã, completar semana até fechar 7 dias
    for (let i = 2; i <= 7; i++) {
      const d = addDays(today, i);
      const idx = getWeekdayIndex(d);
      const label = names[idx][0].toUpperCase() + names[idx].slice(1);
      seq.push({ key: `d${i}`, label, dateISO: startOfDayISO(d) });
    }
    return seq;
  }, []);

  const applyFilters = useCallback(
    (list) => {
      const search = (filters.search || "").trim().toLowerCase();
      const stFilter = filters.status || "all";
      const dayKey = filters.day || "all";

      let base = list;

      // filtro por dia exato (ISO)
      if (dayKey !== "all") {
        const button = timeButtons.find((b) => b.key === dayKey);
        if (button) {
          base = base.filter((a) => isSameDayISO(a.order_datetime, button.dateISO));
        }
      }

      // filtro status
      if (stFilter !== "all") {
        base = base.filter((a) => (a.appointment_status || "").toLowerCase() === stFilter);
      }

      // filtro busca cliente e itens
      if (search) {
        base = base.filter((a) => {
          const inName = (a.customer_name || "").toLowerCase().includes(search);
          const inItems =
            Array.isArray(a.items) &&
            a.items.some((i) => (i?.item?.name || "").toLowerCase().includes(search));
          return inName || inItems;
        });
      }

      // ordenar por data
      base = [...base].sort((a, b) => new Date(a.order_datetime) - new Date(b.order_datetime));
      return base;
    },
    [filters.day, filters.search, filters.status, timeButtons]
  );

  const filteredAppointments = useMemo(() => {
    // usa allOrders para permitir filtros por atendido/não_atendido/cancelado
    const source = Array.isArray(allOrders) && allOrders.length ? allOrders : appointments;
    return applyFilters(source);
  }, [allOrders, appointments, applyFilters]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const id = setInterval(() => {
      checkUpdates();
    }, 8000);
    return () => clearInterval(id);
  }, [checkUpdates]);

  /* ==============================
     Render
     ============================== */


  return (
    <div className="dashboard-root">
      <NavlogComponent />
      <Container fluid className="dashboard-container">
        <div className="header-bar">
          <h3 className="header-bar__title">
            <Calendar3 className="me-2" /> Painel do Colaborador
          </h3>
          <div className="header-bar__actions">
            <span className="header-bar__muted">
              <Bell className="me-1 text-warning" /> Atualização silenciosa a cada ~8s
            </span>
            <Button variant="outline-light" size="sm" className="btn-reload" onClick={loadInitial}>
              <ArrowRepeat className="me-2" /> Atualizar agora
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <Row className="mb-4 text-center">
          {[
            { title: "Total de Atendimentos", value: summary.total },
            { title: "Hoje", value: summary.today },
            { title: "Amanhã", value: summary.tomorrow },
            { title: "Valor Total", value: `R$${money(summary.value)}` },
          ].map((card, i) => (
            <Col md={3} sm={6} xs={12} key={i} className="mb-3">
              <Card className="kpi-card kpi-card--dark">
                <Card.Body>
                  <div className="kpi-title">{card.title}</div>
                  <div className="kpi-value">{card.value}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Próximo Agendamento Pendente (ação direta) */}
        <Row className="mb-4">
          <Col lg={6} className="mb-3">
            <Card className={`glass-card card-next-pending ${nextPendingAppointment ? "pulse-card" : ""}`}>
              <Card.Body>
                <h5 className="card-title-underline text-warning">
                  <Clock className="me-2" />
                  Próximo Agendamento Pendente
                </h5>
                {nextPendingAppointment ? (
                  <>
                    <div className="row-info">
                      <div className="row-info__left">
                        <div className="row-info__label">Cliente</div>
                        <div className="row-info__value">{nextPendingAppointment.customer_name}</div>
                      </div>
                      <div className="row-info__right">
                        <Badge bg="warning" className="badge status-pendente">Pendente</Badge>
                      </div>
                    </div>
                    <div className="row-info">
                      <div className="row-info__left">
                        <div className="row-info__label">Data</div>
                        <div className="row-info__value">
                          {weekdayPt(nextPendingAppointment.order_datetime)} — {shortPt(nextPendingAppointment.order_datetime)} às {toHourMin(nextPendingAppointment.order_datetime)}
                        </div>
                      </div>
                      <div className="row-info__right">
                        <Badge bg="dark">#{nextPendingAppointment.order_number}</Badge>
                      </div>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                      <Button size="sm" variant="success" onClick={() => handleAction(nextPendingAppointment, "confirm")}>
                        <CheckCircle className="me-1" /> Confirmar
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleAction(nextPendingAppointment, "cancel")}>
                        <XCircle className="me-1" /> Cancelar
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-muted">Nenhum agendamento pendente a decidir.</div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Próximo Agendamento (pendente ou confirmado) */}
          <Col lg={6} className="mb-3">
            <Card className="glass-card card-next">
              <Card.Body>
                <h5 className="card-title-underline text-info">
                  <Clock className="me-2" />
                  Próximo Agendamento
                </h5>
                {nextAppointment ? (
                  <>
                    <div className="row-info">
                      <div className="row-info__left">
                        <div className="row-info__label">Cliente</div>
                        <div className="row-info__value">{nextAppointment.customer_name}</div>
                      </div>
                      <div className="row-info__right">
                        <Badge
                          bg={
                            nextAppointment.appointment_status === "pending"
                              ? "warning"
                              : nextAppointment.appointment_status === "confirmed"
                              ? "info"
                              : "secondary"
                          }
                          className={
                            nextAppointment.appointment_status === "pending"
                              ? "status-pendente"
                              : nextAppointment.appointment_status === "confirmed"
                              ? "status-confirmado"
                              : "status-nao-atendido"
                          }
                        >
                          {translateStatus(nextAppointment.appointment_status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="row-info">
                      <div className="row-info__left">
                        <div className="row-info__label">Data</div>
                        <div className="row-info__value">
                          {weekdayPt(nextAppointment.order_datetime)} — {shortPt(nextAppointment.order_datetime)} às {toHourMin(nextAppointment.order_datetime)}
                        </div>
                      </div>
                      <div className="row-info__right">
                        <Badge bg="dark">#{nextAppointment.order_number}</Badge>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-muted">Nenhum próximo agendamento.</div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Último Agendamento Marcado + Agendamentos Recentes */}
        <Row className="mb-4">
          <Col lg={9} className="mb-3">
            <Card className="glass-card card-last">
              <Card.Body>
                <h5 className="card-title-underline text-light">
                  📅 Último Agendamento Marcado
                </h5>
                {lastAppointment ? (
                  <>
                    <div className="row-info">
                      <div className="row-info__left">
                        <div className="row-info__label">Cliente</div>
                        <div className="row-info__value">{lastAppointment.customer_name}</div>
                      </div>
                      <div className="row-info__right">
                        <Badge className={
                          lastAppointment.appointment_status === "pending"
                            ? "badge status-pendente"
                            : lastAppointment.appointment_status === "confirmed"
                            ? "badge status-confirmado"
                            : lastAppointment.appointment_status === "attended"
                            ? "badge status-atendido"
                            : lastAppointment.appointment_status === "not_attended"
                            ? "badge status-nao-atendido"
                            : "badge bg-secondary"
                        }>
                          {translateStatus(lastAppointment.appointment_status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="row-info">
                      <div className="row-info__left">
                        <div className="row-info__label">Data</div>
                        <div className="row-info__value">
                          {weekdayPt(lastAppointment.order_datetime)} — {shortPt(lastAppointment.order_datetime)} às {toHourMin(lastAppointment.order_datetime)}
                        </div>
                      </div>
                      <div className="row-info__right">
                        <Badge bg="dark">#{lastAppointment.order_number}</Badge>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-muted">Nenhum atendimento anterior.</div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Agendamentos Recentes (sempre mostra último conhecido; col-md-3) */}
          <Col lg={3} className="mb-3">
            <Card className="glass-card card-recents">
              <Card.Body>
                <h5 className="card-title-underline text-success">
                  🆕 Agendamentos Recentes
                </h5>
                {recentAppointments.length ? (
                  recentAppointments.map((a) => (
                    <div
                      key={a.id}
                      className={`recent-item ${flashIds.has(a.id) ? "pulse-card" : ""}`}
                    >
                      <div className="recent-item__head">
                        <b className="recent-item__client">{a.customer_name}</b>
                        <Badge bg="dark">#{a.order_number}</Badge>
                      </div>
                      <div className="recent-item__body">
                        {weekdayPt(a.order_datetime)} — {shortPt(a.order_datetime)} às {toHourMin(a.order_datetime)}
                      </div>
                      <div className="recent-item__status">
                        <Badge className={
                          a.appointment_status === "pending"
                            ? "badge status-pendente"
                            : a.appointment_status === "confirmed"
                            ? "badge status-confirmado"
                            : a.appointment_status === "attended"
                            ? "badge status-atendido"
                            : a.appointment_status === "not_attended"
                            ? "badge status-nao-atendido"
                            : "badge bg-secondary"
                        }>
                          {translateStatus(a.appointment_status)}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted p-3">Sem novidades por enquanto.</div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filtros */}
        <Card className="glass-card mb-4">
          <Card.Body>
            <div className="filters-bar">
              <div className="filters-bar__block">
                <ListUl className="me-2 text-info" />
                <span className="filters-bar__label">Tempo:</span>
                <ButtonGroup className="filters-time">
                  <Button
                    size="sm"
                    variant={filters.day === "all" ? "light" : "outline-light"}
                    className={`btn-chip ${filters.day === "all" ? "btn-chip--active" : ""}`}
                    onClick={() => setFilters((f) => ({ ...f, day: "all" }))}
                  >
                    Todos
                  </Button>
                  {timeButtons.map((b) => (
                    <Button
                      key={b.key}
                      size="sm"
                      variant={filters.day === b.key ? "light" : "outline-light"}
                      className={`btn-chip ${filters.day === b.key ? "btn-chip--active" : ""}`}
                      onClick={() => setFilters((f) => ({ ...f, day: b.key }))}
                    >
                      {b.label}
                    </Button>
                  ))}
                </ButtonGroup>
              </div>

              <div className="filters-bar__block">
                <Funnel className="me-2 text-info" />
                <span className="filters-bar__label">Status:</span>
                <Dropdown>
                  <Dropdown.Toggle id="dropdown-status-filter" variant="outline-light" size="sm" className="btn-chip">
                    {filters.status === "all" ? "Todos" : translateStatus(filters.status)}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {STATUS_KEYS.map((s) => (
                      <Dropdown.Item key={s} onClick={() => setFilters((f) => ({ ...f, status: s }))}>
                        {s === "all" ? "Todos" : translateStatus(s)}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              <div className="filters-bar__block filters-bar__search">
                <Form.Control
                  placeholder="🔍 Buscar por cliente ou serviço..."
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Lista de Agendamentos */}
        <Card className="glass-card">
          <Card.Body>
            <h5 className="card-title-underline text-light">📋 Lista de Agendamentos</h5>
            <Row>
              {filteredAppointments.map((a) => (
                <Col md={4} sm={6} xs={12} key={a.id} className="mb-3">
                  <Card className="appointment-card">
                    <Card.Body>
                      <div className="appointment-card__head">
                        <div className="appointment-card__client">{a.customer_name}</div>
                        <Badge className={
                          a.appointment_status === "pending"
                            ? "badge status-pendente"
                            : a.appointment_status === "confirmed"
                            ? "badge status-confirmado"
                            : a.appointment_status === "attended"
                            ? "badge status-atendido"
                            : a.appointment_status === "not_attended"
                            ? "badge status-nao-atendido"
                            : "badge bg-secondary"
                        }>
                          {translateStatus(a.appointment_status)}
                        </Badge>
                      </div>

                      <div className="appointment-card__row">
                        <span className="appointment-card__label">Quando</span>
                        <span className="appointment-card__value">
                          {weekdayPt(a.order_datetime)} — {shortPt(a.order_datetime)} às {toHourMin(a.order_datetime)}
                        </span>
                      </div>

                      <div className="appointment-card__row">
                        <span className="appointment-card__label">Pedido</span>
                        <span className="appointment-card__value">#{a.order_number}</span>
                      </div>

                      <div className="appointment-card__row">
                        <span className="appointment-card__label">Valor</span>
                        <span className="appointment-card__value">R${money(a.total_price)}</span>
                      </div>

                      <div className="d-flex gap-2 mt-2">
                        {a.appointment_status === "pending" && (
                          <Button size="sm" variant="success" onClick={() => handleAction(a, "confirm")}>
                            <CheckCircle className="me-1" /> Confirmar
                          </Button>
                        )}
                        {["pending", "confirmed"].includes(a.appointment_status) && (
                          <Button size="sm" variant="danger" onClick={() => handleAction(a, "cancel")}>
                            <XCircle className="me-1" /> Cancelar
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
              {!filteredAppointments.length && (
                <Col xs={12}>
                  <div className="text-center text-muted p-4">
                    Nenhum agendamento encontrado para os filtros selecionados.
                  </div>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>

        {/* Notificações (toasts simplificados) */}
        <div className="notif-stack">
          {notifQueue.map((n) => (
            <div key={n.id} className={`notif ${n.kind === "success" ? "notif--success" : n.kind === "error" ? "notif--error" : "notif--info"}`}>
              <div className="notif__title">{n.title}</div>
              <div className="notif__body">{n.body}</div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
