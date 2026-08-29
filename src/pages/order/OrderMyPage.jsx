import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSyncAlt,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaStore,
  FaUser,
  FaHashtag,
  FaChevronRight,
  FaCut,
  FaSearch,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaHistory,
  FaBoxOpen,
  FaList,
} from "react-icons/fa";

import useOrdersMy from "../../hooks/useOrderMy";
import useImageUtils from "../../hooks/useImageUtils";
import "./OrderMyPage.css";

const PLACEHOLDER = "/images/logo.png";

const safeText = (value) =>
  typeof value === "string" ? value : value == null ? "" : String(value);

const toDate = (value) => {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatBRL = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatTime = (value) =>
  toDate(value)?.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }) || "—";

const formatDay = (value) =>
  toDate(value)?.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }) || "—";

function statusMeta(value) {
  const raw = safeText(value).trim().toLowerCase();

  if (["pending", "pendente"].includes(raw) || raw.includes("aguard"))
    return { key: "pending", label: "Pendente", tone: "warning" };
  if (["confirmed", "confirmado"].includes(raw) || raw.includes("confirm"))
    return { key: "confirmed", label: "Confirmado", tone: "success" };
  if (["completed", "attended", "finalizado", "concluido", "concluído"].includes(raw))
    return { key: "completed", label: "Concluído", tone: "info" };
  if (["rejected", "recusado"].includes(raw) || raw.includes("reject"))
    return { key: "rejected", label: "Recusado", tone: "danger" };
  if (["cancelled", "canceled", "cancelado"].includes(raw) || raw.includes("cancel"))
    return { key: "cancelled", label: "Cancelado", tone: "danger" };
  if (["no_show", "not_attended"].includes(raw))
    return { key: "no_show", label: "Não compareceu", tone: "muted" };

  return { key: "other", label: "Indefinido", tone: "neutral" };
}

function isUpcoming(order) {
  const time = toDate(order?.order_datetime)?.getTime();
  const status = statusMeta(order?.appointment_status || order?.status).key;
  return Boolean(time && time >= Date.now() && ["pending", "confirmed"].includes(status));
}

function relativeLabel(value) {
  const date = toDate(value);
  if (!date) return "Horário não informado";

  const diff = date.getTime() - Date.now();
  const minutes = Math.floor(Math.abs(diff) / 60000);

  if (Math.abs(diff) < 60000) return "É agora";
  if (minutes < 60) return diff > 0 ? `Em ${minutes} min` : `Há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours < 24)
    return diff > 0 ? `Em ${hours}h ${restMinutes}min` : `Há ${hours}h ${restMinutes}min`;

  const days = Math.floor(hours / 24);
  return diff > 0
    ? `Em ${days} dia${days > 1 ? "s" : ""}`
    : `Há ${days} dia${days > 1 ? "s" : ""}`;
}

function servicesLabel(order) {
  const rows = Array.isArray(order?.items) ? order.items : [];
  const names = rows
    .map((row) => row?.item?.name || row?.name)
    .filter(Boolean);

  if (!names.length) return "Detalhes do atendimento";
  if (names.length <= 2) return names.join(" + ");
  return `${names.slice(0, 2).join(" + ")} +${names.length - 2}`;
}

export default function OrderMyPage() {
  const navigate = useNavigate();
  const { orders, loading, error, refresh } = useOrdersMy();
  const { imageUrl } = useImageUtils();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const safeOrders = useMemo(
    () => (Array.isArray(orders) ? orders.filter(Boolean) : []),
    [orders]
  );

  const stats = useMemo(
    () =>
      safeOrders.reduce(
        (acc, order) => {
          const status = statusMeta(order?.appointment_status || order?.status);
          acc.total += 1;
          if (status.key === "pending") acc.pending += 1;
          if (status.key === "confirmed") acc.confirmed += 1;
          if (status.key === "completed") acc.completed += 1;
          if (["cancelled", "rejected", "no_show"].includes(status.key)) acc.history += 1;
          if (isUpcoming(order)) acc.upcoming += 1;
          return acc;
        },
        { total: 0, pending: 0, confirmed: 0, completed: 0, history: 0, upcoming: 0 }
      ),
    [safeOrders]
  );

  const nextAppointment = useMemo(
    () =>
      safeOrders
        .filter(isUpcoming)
        .sort(
          (a, b) =>
            (toDate(a?.order_datetime)?.getTime() || Number.MAX_SAFE_INTEGER) -
            (toDate(b?.order_datetime)?.getTime() || Number.MAX_SAFE_INTEGER)
        )[0] || null,
    [safeOrders]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return safeOrders
      .filter((order) => {
        const status = statusMeta(order?.appointment_status || order?.status);
        const upcoming = isUpcoming(order);

        if (filter === "upcoming" && !upcoming) return false;
        if (filter === "pending" && status.key !== "pending") return false;
        if (filter === "confirmed" && status.key !== "confirmed") return false;
        if (filter === "history" && upcoming) return false;

        if (!term) return true;

        const employer = order?.employer?.user || order?.attendant?.user || order?.attendant_user;
        const haystack = [
          order?.establishment?.name,
          employer?.first_name,
          employer?.last_name,
          employer?.user_name,
          order?.order_number,
          servicesLabel(order),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(term);
      })
      .sort((a, b) => {
        const aUpcoming = isUpcoming(a);
        const bUpcoming = isUpcoming(b);
        const aTime = toDate(a?.order_datetime)?.getTime() || 0;
        const bTime = toDate(b?.order_datetime)?.getTime() || 0;

        if (filter === "history") return bTime - aTime;
        if (filter === "all" && aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
        if (aUpcoming && bUpcoming) return aTime - bTime;
        return bTime - aTime;
      });
  }, [safeOrders, filter, search]);

  const openDetail = useCallback(
    (order) => {
      if (!order?.id) return;
      navigate(`/order/view/${order.id}`);
    },
    [navigate]
  );

  const renderAppointment = (order, featured = false) => {
    if (!order?.id) return null;

    const status = statusMeta(order?.appointment_status || order?.status);
    const employer = order?.employer?.user || order?.attendant?.user || order?.attendant_user;
    const employerName =
      `${safeText(employer?.first_name)} ${safeText(employer?.last_name)}`.trim() ||
      "Profissional a definir";
    const establishment = order?.establishment || {};
    const logo = establishment?.files?.logo?.path || establishment?.files?.logo?.url;

    return (
      <article
        key={`${featured ? "featured-" : ""}${order.id}`}
        className={`omp-appointment ${featured ? "omp-appointment--featured" : ""}`}
        onClick={() => openDetail(order)}
      >
        <div className="omp-datebox">
          <b>{formatTime(order?.order_datetime)}</b>
          <span>{formatDay(order?.order_datetime)}</span>
        </div>

        <div className="omp-businessLogo">
          {logo ? (
            <img
              src={imageUrl(logo)}
              alt={establishment?.name || "Barbearia"}
              onError={(event) => {
                event.currentTarget.src = PLACEHOLDER;
              }}
            />
          ) : (
            <FaStore />
          )}
        </div>

        <div className="omp-mainInfo">
          <div className="omp-rowTitle">
            <strong>{establishment?.name || "Barbearia"}</strong>
            <span className={`omp-status omp-status--${status.tone}`}>{status.label}</span>
          </div>

          <div className="omp-service">
            <FaCut /> {servicesLabel(order)}
          </div>

          <div className="omp-meta">
            <span><FaUser /> {employerName}</span>
            {(establishment?.city || establishment?.uf) && (
              <span>
                <FaMapMarkerAlt /> {[establishment.city, establishment.uf].filter(Boolean).join(" - ")}
              </span>
            )}
            <span><FaHashtag /> {order?.order_number || order.id}</span>
          </div>
        </div>

        <div className="omp-rightInfo">
          <b>{formatBRL(order?.total_price)}</b>
          <span className="omp-relative">{relativeLabel(order?.order_datetime)}</span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openDetail(order);
            }}
          >
            Ver detalhes <FaChevronRight />
          </button>
        </div>
      </article>
    );
  };

  return (
    <main className="omp">
      <div className="omp-shell">
        <header className="omp-header">
          <div>
            <span className="omp-eyebrow">Rasoio • sua agenda</span>
            <h1>Meus agendamentos</h1>
            <p>Veja todos os seus horários, identifique o próximo atendimento e consulte seu histórico.</p>
          </div>
          <div className="omp-headerActions">
            <button type="button" onClick={() => navigate(-1)}><FaArrowLeft /> Voltar</button>
            <button type="button" className="primary" onClick={refresh} disabled={loading}>
              <FaSyncAlt /> {loading ? "Atualizando..." : "Atualizar"}
            </button>
          </div>
        </header>

        {!loading && !error && nextAppointment && (
          <section className="omp-next">
            <div className="omp-nextLabel"><FaClock /> Seu próximo atendimento</div>
            {renderAppointment(nextAppointment, true)}
          </section>
        )}

        <section className="omp-stats">
          <button type="button" onClick={() => setFilter("all")} className={filter === "all" ? "active" : ""}>
            <FaList /><span>Todos</span><b>{stats.total}</b>
          </button>
          <button type="button" onClick={() => setFilter("upcoming")} className={filter === "upcoming" ? "active" : ""}>
            <FaCalendarAlt /><span>Próximos</span><b>{stats.upcoming}</b>
          </button>
          <button type="button" onClick={() => setFilter("pending")} className={filter === "pending" ? "active" : ""}>
            <FaHourglassHalf /><span>Pendentes</span><b>{stats.pending}</b>
          </button>
          <button type="button" onClick={() => setFilter("confirmed")} className={filter === "confirmed" ? "active" : ""}>
            <FaCheckCircle /><span>Confirmados</span><b>{stats.confirmed}</b>
          </button>
          <button type="button" onClick={() => setFilter("history")} className={filter === "history" ? "active" : ""}>
            <FaHistory /><span>Histórico</span><b>{Math.max(0, stats.total - stats.upcoming)}</b>
          </button>
        </section>

        <section className="omp-controls">
          <div className="omp-search">
            <FaSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar barbearia, profissional, serviço ou número..."
            />
          </div>
          <span>{filtered.length} {filtered.length === 1 ? "agendamento" : "agendamentos"}</span>
        </section>

        {loading && (
          <div className="omp-state">
            <FaSyncAlt className="spin" />
            <b>Carregando seus agendamentos...</b>
            <span>Aguarde enquanto buscamos sua agenda.</span>
          </div>
        )}

        {!loading && error && (
          <div className="omp-state omp-state--error">
            <FaTimesCircle />
            <b>Não foi possível carregar seus agendamentos.</b>
            <span>{error}</span>
            <button type="button" onClick={refresh}>Tentar novamente</button>
          </div>
        )}

        {!loading && !error && safeOrders.length === 0 && (
          <div className="omp-state">
            <FaBoxOpen />
            <b>Nenhum agendamento encontrado</b>
            <span>Quando você marcar um atendimento, ele aparecerá aqui.</span>
          </div>
        )}

        {!loading && !error && safeOrders.length > 0 && filtered.length === 0 && (
          <div className="omp-state">
            <FaSearch />
            <b>Nenhum agendamento neste filtro</b>
            <span>Os seus {stats.total} agendamentos continuam disponíveis em “Todos”.</span>
            <button type="button" onClick={() => { setFilter("all"); setSearch(""); }}>
              Mostrar todos
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <section className="omp-list">{filtered.map((order) => renderAppointment(order))}</section>
        )}
      </div>
    </main>
  );
}
