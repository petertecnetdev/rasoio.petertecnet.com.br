import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaCalendarAlt,
  FaClock,
  FaCut,
  FaHourglassHalf,
  FaReceipt,
  FaStore,
  FaUser,
  FaUserTie,
} from "react-icons/fa";
import api from "../../services/api";
import "./OrderViewPage.css";

const money = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const asDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const dateTime = (value) => {
  const date = asDate(value);
  if (!date) return "Não informado";
  return date.toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const shortDate = (value) => {
  const date = asDate(value);
  if (!date) return "-";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const shortTime = (value) => {
  const date = asDate(value);
  if (!date) return "-";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusMeta = (value) =>
  ({
    pending: ["Solicitado", "warning"],
    confirmed: ["Confirmado", "success"],
    completed: ["Concluído", "done"],
    attended: ["Concluído", "done"],
    rejected: ["Recusado", "danger"],
    cancelled: ["Cancelado", "danger"],
    canceled: ["Cancelado", "danger"],
    no_show: ["Não compareceu", "muted"],
    not_attended: ["Não compareceu", "muted"],
  })[String(value || "").toLowerCase()] || [value || "Indefinido", "muted"];

const fullName = (person, fallback = "Usuário") =>
  [person?.first_name, person?.last_name].filter(Boolean).join(" ") ||
  person?.name ||
  person?.user_name ||
  fallback;

function remainingLabel(targetValue, nowMs) {
  const target = asDate(targetValue);
  if (!target) return "Horário não informado";

  const diff = target.getTime() - nowMs;
  const abs = Math.abs(diff);
  const totalMinutes = Math.floor(abs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${minutes}min`);

  if (Math.abs(diff) < 60000) return "É agora";
  return diff > 0 ? `Faltam ${parts.join(" ")}` : `Horário passou há ${parts.join(" ")}`;
}

function roleIcon(roleKey) {
  if (roleKey === "barber") return <FaCut />;
  if (roleKey === "manager") return <FaUserTie />;
  return <FaUser />;
}

export default function OrderViewPage() {
  const { id } = useParams();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/rasoio/orders/${id}`, {
          signal: controller.signal,
        });
        setPayload(data || null);
      } catch (requestError) {
        if (requestError?.code === "ERR_CANCELED") return;
        setError(
          requestError?.response?.data?.message ||
            requestError?.response?.data?.error ||
            "Não foi possível carregar o agendamento."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    if (id) load();
    return () => controller.abort();
  }, [id]);

  const order = payload?.order || null;
  const audit = payload?.audit || {};
  const establishment = payload?.establishment || null;

  const customer = useMemo(() => {
    const source = order?.client || order?.customer || {};
    return {
      ...source,
      name: fullName(source, order?.customer_name || "Cliente"),
    };
  }, [order]);

  const attendant = order?.attendant?.user || order?.attendant_user || null;
  const creator = audit?.created_by || order?.creator || null;
  const scheduledAt = audit?.scheduled_at || order?.scheduled_start || order?.order_datetime;
  const requestedAt = audit?.requested_at || order?.created_at;
  const [statusLabel, statusTone] = statusMeta(order?.appointment_status || order?.status);
  const items = Array.isArray(order?.items) ? order.items : [];
  const totalDuration = Number(order?.total_duration || 0);

  if (loading) {
    return <div className="ovp-state">Carregando detalhes do agendamento...</div>;
  }

  if (error || !order) {
    return <div className="ovp-state ovp-state--error">{error || "Agendamento não encontrado."}</div>;
  }

  return (
    <main className="ovp-page">
      <section className="ovp-hero">
        <div className="ovp-heroMain">
          <div className="ovp-kicker"><FaReceipt /> Agendamento #{order.order_number || order.id}</div>
          <h1>{customer.name}</h1>
          <div className="ovp-heroMeta">
            <span><FaCalendarAlt /> {shortDate(scheduledAt)}</span>
            <span><FaClock /> {shortTime(scheduledAt)}</span>
            {establishment?.name && <span><FaStore /> {establishment.name}</span>}
          </div>
        </div>
        <div className="ovp-heroSide">
          <span className={`ovp-status ovp-status--${statusTone}`}>{statusLabel}</span>
          <div className="ovp-countdown"><FaHourglassHalf /><strong>{remainingLabel(scheduledAt, nowMs)}</strong></div>
        </div>
      </section>

      <section className="ovp-auditGrid">
        <article className="ovp-auditCard ovp-auditCard--requested">
          <div className="ovp-auditIcon"><FaClock /></div>
          <span>Agendamento feito em</span>
          <strong>{dateTime(requestedAt)}</strong>
          <small>Momento em que a solicitação foi registrada no sistema.</small>
        </article>

        <article className="ovp-auditCard ovp-auditCard--scheduled">
          <div className="ovp-auditIcon"><FaCalendarAlt /></div>
          <span>Data solicitada para atendimento</span>
          <strong>{dateTime(scheduledAt)}</strong>
          <small>{remainingLabel(scheduledAt, nowMs)}</small>
        </article>

        <article className={`ovp-auditCard ovp-auditCard--creator ovp-auditCard--${creator?.role_key || "user"}`}>
          <div className="ovp-auditIcon">{roleIcon(creator?.role_key)}</div>
          <span>Agendamento criado por</span>
          <strong>{fullName(creator, "Origem não identificada")}</strong>
          <small>{creator?.role || "Usuário"}</small>
          {creator?.user_name && <Link to={`/user/${creator.user_name}`}>Ver perfil</Link>}
        </article>
      </section>

      <section className="ovp-grid">
        <div className="ovp-column">
          <article className="ovp-panel">
            <header><div><span>Atendimento</span><h2>Serviços e produtos</h2></div></header>
            {items.length === 0 ? (
              <div className="ovp-empty">Nenhum item informado.</div>
            ) : (
              <div className="ovp-items">
                {items.map((row, index) => {
                  const item = row.item || row;
                  const quantity = Number(row.quantity || row.pivot?.quantity || 1);
                  const unitPrice = Number(row.unit_price || row.pivot?.unit_price || item.price || 0);
                  const subtotal = Number(row.subtotal || row.pivot?.subtotal || quantity * unitPrice);
                  return (
                    <div className="ovp-item" key={row.id || item.id || index}>
                      <div><strong>{item.name || "Item"}</strong><span>{quantity} × {money(unitPrice)}</span></div>
                      <b>{money(subtotal)}</b>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          {order.notes && (
            <article className="ovp-panel">
              <header><div><span>Observações</span><h2>Informações adicionais</h2></div></header>
              <p className="ovp-notes">{order.notes}</p>
            </article>
          )}
        </div>

        <div className="ovp-column">
          <article className="ovp-panel">
            <header><div><span>Pessoas</span><h2>Participantes</h2></div></header>
            <div className="ovp-personList">
              <div className="ovp-person">
                <div className="ovp-personIcon"><FaUser /></div>
                <div><span>Cliente</span><strong>{customer.name}</strong>{customer.user_name && <Link to={`/user/${customer.user_name}`}>@{customer.user_name}</Link>}</div>
              </div>
              {attendant && (
                <div className="ovp-person">
                  <div className="ovp-personIcon"><FaCut /></div>
                  <div><span>Barbeiro responsável</span><strong>{fullName(attendant, "Profissional")}</strong>{attendant.user_name && <Link to={`/user/${attendant.user_name}`}>@{attendant.user_name}</Link>}</div>
                </div>
              )}
            </div>
          </article>

          <article className="ovp-panel">
            <header><div><span>Resumo</span><h2>Dados do agendamento</h2></div></header>
            <div className="ovp-summary">
              <div><span>Valor</span><strong>{money(order.total_price)}</strong></div>
              <div><span>Duração</span><strong>{totalDuration ? `${totalDuration} min` : "-"}</strong></div>
              <div><span>Pagamento</span><strong>{order.payment_status || "-"}</strong></div>
              <div><span>Status</span><strong>{statusLabel}</strong></div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
