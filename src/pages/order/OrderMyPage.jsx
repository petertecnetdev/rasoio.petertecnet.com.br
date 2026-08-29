import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft, FaSyncAlt, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaStore,
  FaUser, FaHashtag, FaMoneyBillWave, FaChevronRight, FaCut, FaSearch,
  FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaHistory, FaBoxOpen,
} from "react-icons/fa";

import useOrdersMy from "../../hooks/useOrderMy";
import useImageUtils from "../../hooks/useImageUtils";
import "./OrderMyPage.css";

const PLACEHOLDER = "/images/logo.png";

const safeText = (v) => (typeof v === "string" ? v : v == null ? "" : String(v));
const toDate = (v) => { const d = new Date(v || ""); return Number.isNaN(d.getTime()) ? null : d; };
const formatBRL = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatTime = (v) => toDate(v)?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) || "—";
const formatDay = (v) => toDate(v)?.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }) || "—";

function statusMeta(value) {
  const raw = safeText(value).trim().toLowerCase();
  if (["pending", "pendente"].includes(raw) || raw.includes("aguard")) return { key: "pending", label: "Pendente", tone: "warning" };
  if (["confirmed", "confirmado"].includes(raw) || raw.includes("confirm")) return { key: "confirmed", label: "Confirmado", tone: "success" };
  if (["completed", "attended", "finalizado", "concluido", "concluído"].includes(raw)) return { key: "completed", label: "Concluído", tone: "info" };
  if (["rejected", "recusado"].includes(raw) || raw.includes("reject")) return { key: "rejected", label: "Recusado", tone: "danger" };
  if (["cancelled", "canceled", "cancelado"].includes(raw) || raw.includes("cancel")) return { key: "cancelled", label: "Cancelado", tone: "danger" };
  if (["no_show", "not_attended"].includes(raw)) return { key: "no_show", label: "Não compareceu", tone: "muted" };
  return { key: "other", label: "Indefinido", tone: "neutral" };
}

function relativeLabel(value) {
  const d = toDate(value); if (!d) return "Horário não informado";
  const diff = d.getTime() - Date.now();
  const minutes = Math.floor(Math.abs(diff) / 60000);
  if (Math.abs(diff) < 60000) return "É agora";
  if (minutes < 60) return diff > 0 ? `Em ${minutes} min` : `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60); const mins = minutes % 60;
  if (hours < 24) return diff > 0 ? `Em ${hours}h ${mins}min` : `Há ${hours}h ${mins}min`;
  const days = Math.floor(hours / 24);
  return diff > 0 ? `Em ${days} dia${days > 1 ? "s" : ""}` : `Há ${days} dia${days > 1 ? "s" : ""}`;
}

function servicesLabel(order) {
  const rows = Array.isArray(order?.items) ? order.items : [];
  const names = rows.map((r) => r?.item?.name || r?.name).filter(Boolean);
  if (!names.length) return "Detalhes do atendimento";
  if (names.length <= 2) return names.join(" + ");
  return `${names.slice(0, 2).join(" + ")} +${names.length - 2}`;
}

export default function OrderMyPage() {
  const navigate = useNavigate();
  const { orders, loading, error, refresh } = useOrdersMy();
  const { imageUrl } = useImageUtils();
  const [filter, setFilter] = useState("upcoming");
  const [search, setSearch] = useState("");

  const safeOrders = useMemo(() => Array.isArray(orders) ? orders : [], [orders]);
  const stats = useMemo(() => safeOrders.reduce((acc, o) => {
    const st = statusMeta(o?.appointment_status || o?.status); acc.total++;
    if (st.key === "pending") acc.pending++;
    if (st.key === "confirmed") acc.confirmed++;
    if (st.key === "completed") acc.completed++;
    return acc;
  }, { total: 0, pending: 0, confirmed: 0, completed: 0 }), [safeOrders]);

  const nextAppointment = useMemo(() => safeOrders
    .filter((o) => ["pending", "confirmed"].includes(statusMeta(o?.appointment_status || o?.status).key) && (toDate(o?.order_datetime)?.getTime() || 0) >= Date.now())
    .sort((a, b) => (toDate(a.order_datetime)?.getTime() || Infinity) - (toDate(b.order_datetime)?.getTime() || Infinity))[0] || null, [safeOrders]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return safeOrders.filter((o) => {
      const st = statusMeta(o?.appointment_status || o?.status);
      const when = toDate(o?.order_datetime)?.getTime() || 0;
      const upcoming = when >= Date.now() && ["pending", "confirmed"].includes(st.key);
      if (filter === "upcoming" && !upcoming) return false;
      if (filter === "pending" && st.key !== "pending") return false;
      if (filter === "confirmed" && st.key !== "confirmed") return false;
      if (filter === "history" && upcoming) return false;
      if (!term) return true;
      const haystack = [o?.establishment?.name, o?.employer?.user?.first_name, o?.employer?.user?.last_name, o?.order_number, servicesLabel(o)].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(term);
    }).sort((a, b) => {
      const aTime = toDate(a?.order_datetime)?.getTime() || 0; const bTime = toDate(b?.order_datetime)?.getTime() || 0;
      if (filter === "history") return bTime - aTime;
      return aTime - bTime;
    });
  }, [safeOrders, filter, search]);

  const openDetail = useCallback((o) => navigate(`/order/view/${o.id}`), [navigate]);

  const renderAppointment = (o, featured = false) => {
    const st = statusMeta(o?.appointment_status || o?.status);
    const emp = o?.employer?.user || o?.attendant?.user || null;
    const empName = `${safeText(emp?.first_name)} ${safeText(emp?.last_name)}`.trim() || "Profissional a definir";
    const est = o?.establishment || {};
    const logo = est?.files?.logo?.path || est?.files?.logo?.url;
    return <article key={o.id} className={`omp-appointment ${featured ? "omp-appointment--featured" : ""}`} onClick={() => openDetail(o)}>
      <div className="omp-datebox"><b>{formatTime(o.order_datetime)}</b><span>{formatDay(o.order_datetime)}</span></div>
      <div className="omp-businessLogo">{logo ? <img src={imageUrl(logo)} alt={est.name || "Barbearia"} onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} /> : <FaStore />}</div>
      <div className="omp-mainInfo">
        <div className="omp-rowTitle"><strong>{est.name || "Barbearia"}</strong><span className={`omp-status omp-status--${st.tone}`}>{st.label}</span></div>
        <div className="omp-service"><FaCut /> {servicesLabel(o)}</div>
        <div className="omp-meta">
          <span><FaUser /> {empName}</span>
          {(est.city || est.uf) && <span><FaMapMarkerAlt /> {[est.city, est.uf].filter(Boolean).join(" - ")}</span>}
          <span><FaHashtag /> {o.order_number || o.id}</span>
        </div>
      </div>
      <div className="omp-rightInfo"><b>{formatBRL(o.total_price)}</b><span className="omp-relative">{relativeLabel(o.order_datetime)}</span><button type="button" onClick={(e) => { e.stopPropagation(); openDetail(o); }}>Ver detalhes <FaChevronRight /></button></div>
    </article>;
  };

  return <main className="omp">
    <div className="omp-shell">
      <header className="omp-header">
        <div><span className="omp-eyebrow">Rasoio • sua agenda</span><h1>Meus agendamentos</h1><p>Encontre rapidamente seu próximo atendimento e acompanhe todo o histórico.</p></div>
        <div className="omp-headerActions"><button onClick={() => navigate(-1)}><FaArrowLeft /> Voltar</button><button className="primary" onClick={refresh} disabled={loading}><FaSyncAlt /> {loading ? "Atualizando..." : "Atualizar"}</button></div>
      </header>

      {nextAppointment && <section className="omp-next"><div className="omp-nextLabel"><FaClock /> Seu próximo atendimento</div>{renderAppointment(nextAppointment, true)}</section>}

      <section className="omp-stats">
        <button onClick={() => setFilter("upcoming")} className={filter === "upcoming" ? "active" : ""}><FaCalendarAlt /><span>Próximos</span><b>{safeOrders.filter((o) => (toDate(o.order_datetime)?.getTime() || 0) >= Date.now() && ["pending", "confirmed"].includes(statusMeta(o.appointment_status || o.status).key)).length}</b></button>
        <button onClick={() => setFilter("pending")} className={filter === "pending" ? "active" : ""}><FaHourglassHalf /><span>Pendentes</span><b>{stats.pending}</b></button>
        <button onClick={() => setFilter("confirmed")} className={filter === "confirmed" ? "active" : ""}><FaCheckCircle /><span>Confirmados</span><b>{stats.confirmed}</b></button>
        <button onClick={() => setFilter("history")} className={filter === "history" ? "active" : ""}><FaHistory /><span>Histórico</span><b>{Math.max(0, stats.total - stats.pending - stats.confirmed)}</b></button>
      </section>

      <section className="omp-controls"><div className="omp-search"><FaSearch /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar barbearia, profissional, serviço ou número..." /></div><span>{filtered.length} {filtered.length === 1 ? "agendamento" : "agendamentos"}</span></section>

      {loading && <div className="omp-state"><FaSyncAlt className="spin" /><b>Carregando seus agendamentos...</b></div>}
      {!loading && error && <div className="omp-state omp-state--error"><FaTimesCircle /><b>Não foi possível carregar seus agendamentos.</b><span>{error}</span><button onClick={refresh}>Tentar novamente</button></div>}
      {!loading && !error && filtered.length === 0 && <div className="omp-state"><FaBoxOpen /><b>Nenhum agendamento encontrado</b><span>Altere o filtro ou faça um novo agendamento para vê-lo aqui.</span></div>}
      {!loading && !error && filtered.length > 0 && <section className="omp-list">{filtered.map((o) => renderAppointment(o))}</section>}
    </div>
  </main>;
}
