import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaCalendarCheck,
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaExternalLinkAlt,
  FaSyncAlt,
  FaTimes,
  FaUserClock,
} from "react-icons/fa";
import EmployerHero from "../../components/employer/EmployerHero";
import useEmployerOrders from "../../hooks/useEmployerOrders";
import "./EmployerOrdersPage.css";

const asDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const fmtDate = (value) => {
  const date = asDate(value);
  return date ? date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }) : "Sem data";
};

const fmtTime = (value) => {
  const date = asDate(value);
  return date ? date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--";
};

const statusMeta = (status) => ({
  pending: ["Solicitado", "warning"],
  confirmed: ["Confirmado", "success"],
  completed: ["Concluído", "done"],
  attended: ["Concluído", "done"],
  rejected: ["Recusado", "danger"],
  cancelled: ["Cancelado", "danger"],
  canceled: ["Cancelado", "danger"],
  no_show: ["Não compareceu", "muted"],
  not_attended: ["Não compareceu", "muted"],
}[status] || [status || "Indefinido", "muted"]);

const customerName = (order) => {
  const customer = order?.client || order?.customer || {};
  return [customer.first_name, customer.last_name].filter(Boolean).join(" ") || order?.customer_name || "Cliente";
};

export default function EmployerOrdersPage() {
  const { orders, employer, loading, apiError, actionLoading, updateOrderStatus, refetch } = useEmployerOrders();
  const now = Date.now();

  const sortedOrders = useMemo(() => {
    const rows = Array.isArray(orders) ? [...orders] : [];
    return rows.sort((a, b) => {
      const aStatus = a?.appointment_status || a?.status;
      const bStatus = b?.appointment_status || b?.status;
      const aTime = asDate(a?.order_datetime)?.getTime() || 0;
      const bTime = asDate(b?.order_datetime)?.getTime() || 0;
      const aActive = ["pending", "confirmed"].includes(aStatus) && aTime >= now;
      const bActive = ["pending", "confirmed"].includes(bStatus) && bTime >= now;
      if (aActive !== bActive) return aActive ? -1 : 1;
      if (aActive && bActive) return aTime - bTime;
      return bTime - aTime;
    });
  }, [orders, now]);

  const stats = useMemo(() => {
    const result = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    (orders || []).forEach((order) => {
      const status = order?.appointment_status || order?.status;
      if (status === "pending") result.pending += 1;
      else if (status === "confirmed") result.confirmed += 1;
      else if (["completed", "attended"].includes(status)) result.completed += 1;
      else if (["cancelled", "canceled", "rejected", "no_show", "not_attended"].includes(status)) result.cancelled += 1;
    });
    return result;
  }, [orders]);

  const statusChart = useMemo(() => [
    { label: "Solicitados", value: stats.pending },
    { label: "Confirmados", value: stats.confirmed },
    { label: "Concluídos", value: stats.completed },
    { label: "Encerrados", value: stats.cancelled },
  ], [stats]);

  const dailyChart = useMemo(() => {
    const buckets = new Map();
    (orders || []).forEach((order) => {
      const date = asDate(order?.order_datetime);
      if (!date) return;
      const key = date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      const current = buckets.get(key) || { key, label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), total: 0, completed: 0 };
      current.total += 1;
      if (["completed", "attended"].includes(order?.appointment_status || order?.status)) current.completed += 1;
      buckets.set(key, current);
    });
    return Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key)).slice(-14);
  }, [orders]);

  const runAction = async (order, action) => {
    const labels = {
      accept: ["Aceitar este agendamento?", "O horário ficará confirmado para o cliente.", "Aceitar"],
      reject: ["Recusar solicitação?", "O cliente verá o agendamento como recusado.", "Recusar"],
      cancel: ["Cancelar agendamento?", "Use esta ação quando o atendimento confirmado não poderá acontecer.", "Cancelar"],
      complete: ["Concluir atendimento?", "Confirme somente após o atendimento ter sido realizado.", "Concluir"],
      no_show: ["Cliente não compareceu?", "O histórico do cliente registrará a ausência.", "Confirmar ausência"],
    };
    const copy = labels[action];
    if (!copy) return;

    const result = await Swal.fire({
      icon: action === "accept" || action === "complete" ? "question" : "warning",
      title: copy[0],
      text: copy[1],
      showCancelButton: true,
      confirmButtonText: copy[2],
      cancelButtonText: "Voltar",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      await updateOrderStatus(order.id, action);
      await Swal.fire({ icon: "success", title: "Agenda atualizada", timer: 1100, showConfirmButton: false });
    } catch (error) {
      await Swal.fire({ icon: "error", title: "Não foi possível atualizar", text: error.message });
    }
  };

  return (
    <main className="eop-page">
      <EmployerHero title="Minha agenda" subtitle="Solicitações, atendimentos e evolução visual da sua rotina" employer={employer} />

      <section className="eop-toolbar">
        <div className="eop-stats">
          <div><span>Solicitados</span><strong>{stats.pending}</strong></div>
          <div><span>Confirmados</span><strong>{stats.confirmed}</strong></div>
          <div><span>Concluídos</span><strong>{stats.completed}</strong></div>
          <div><span>Encerrados</span><strong>{stats.cancelled}</strong></div>
        </div>
        <button className="eop-refresh" type="button" onClick={refetch} disabled={loading}><FaSyncAlt /> Atualizar</button>
      </section>

      {!loading && !apiError && (orders || []).length > 0 && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: "16px", margin: "0 0 24px" }} aria-label="Análises visuais da agenda profissional">
          <peter-insight-chart type="donut" title="Situação da minha agenda" subtitle="Distribuição dos seus atendimentos por status para leitura rápida da carga de trabalho." data={JSON.stringify(statusChart)} primary-label="Atendimentos" />
          <peter-insight-chart type="line" title="Ritmo dos últimos dias" subtitle="Agendamentos registrados por dia comparados aos atendimentos concluídos." data={JSON.stringify(dailyChart)} label-key="label" value-key="total" secondary-key="completed" primary-label="Agendados" secondary-label="Concluídos" />
        </section>
      )}

      {apiError && <div className="eop-message eop-message--error"><FaExclamationCircle /> {apiError}</div>}
      {loading && <div className="eop-message"><FaUserClock /> Carregando agenda...</div>}
      {!loading && !apiError && sortedOrders.length === 0 && <div className="eop-message">Nenhum agendamento encontrado.</div>}

      {!loading && sortedOrders.length > 0 && (
        <section className="eop-list" aria-label="Lista de agendamentos">
          {sortedOrders.map((order, index) => {
            const status = order?.appointment_status || order?.status || "pending";
            const [statusLabel, tone] = statusMeta(status);
            const start = asDate(order?.order_datetime);
            const end = start ? new Date(start.getTime() + Number(order?.total_duration || 30) * 60000) : null;
            const future = start && start.getTime() > now;
            const canAccept = status === "pending" && future;
            const canReject = status === "pending" && future;
            const canCancel = status === "confirmed" && future;
            const canFinish = status === "confirmed" && end && end.getTime() <= now;
            const client = order?.client || {};
            const username = client?.user_name;
            const serviceNames = (order?.items || []).map((row) => row?.name || row?.item?.name).filter(Boolean).join(" • ");
            const isNext = index === 0 && ["pending", "confirmed"].includes(status) && future;

            return (
              <article className={`eop-row ${isNext ? "eop-row--next" : ""}`} key={order.id}>
                <div className="eop-time"><strong>{fmtTime(order.order_datetime)}</strong><span>{fmtDate(order.order_datetime)}</span></div>
                <div className="eop-main">
                  <div className="eop-titleLine">
                    <div><strong>{customerName(order)}</strong>{isNext && <span className="eop-next">Próximo</span>}</div>
                    <span className={`eop-status eop-status--${tone}`}>{statusLabel}</span>
                  </div>
                  <div className="eop-sub">{serviceNames || "Atendimento"}</div>
                  <div className="eop-meta"><span>#{order.order_number || order.id}</span><span>{Number(order.total_duration || 30)} min</span></div>
                </div>
                <div className="eop-actions">
                  {canAccept && <button className="eop-btn eop-btn--accept" disabled={actionLoading === order.id} onClick={() => runAction(order, "accept")}><FaCheck /> Aceitar</button>}
                  {canReject && <button className="eop-btn eop-btn--reject" disabled={actionLoading === order.id} onClick={() => runAction(order, "reject")}><FaTimes /> Recusar</button>}
                  {canCancel && <button className="eop-btn eop-btn--reject" disabled={actionLoading === order.id} onClick={() => runAction(order, "cancel")}><FaTimes /> Cancelar</button>}
                  {canFinish && <button className="eop-btn eop-btn--accept" disabled={actionLoading === order.id} onClick={() => runAction(order, "complete")}><FaCheckCircle /> Concluir</button>}
                  {canFinish && <button className="eop-btn" disabled={actionLoading === order.id} onClick={() => runAction(order, "no_show")}><FaClock /> Não compareceu</button>}
                  {username && <Link className="eop-btn" to={`/user/${username}`}>Perfil <FaExternalLinkAlt /></Link>}
                  <Link className="eop-btn" to={`/order/view/${order.id}`}><FaCalendarCheck /> Detalhes</Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}