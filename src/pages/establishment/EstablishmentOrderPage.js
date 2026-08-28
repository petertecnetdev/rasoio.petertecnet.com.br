import React, { useMemo, useState } from "react";
import { Alert, Container, Spinner } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { FaCheck, FaCheckCircle, FaClock, FaExchangeAlt, FaTimes } from "react-icons/fa";

import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import GlobalButton from "../../components/GlobalButton";
import useEstablishmentOrdersBySlug from "../../hooks/useEstablishmentOrdersBySlug";
import "./EstablishmentOrderPage.css";
import "../employer/EmployerOrdersPage.css";

const statusOf = (order) => String(order?.appointment_status || order?.status || "pending").toLowerCase();
const asDate = (value) => { const d = value ? new Date(value) : null; return d && !Number.isNaN(d.getTime()) ? d : null; };
const fmtTime = (value) => asDate(value)?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) || "--:--";
const fmtDate = (value) => asDate(value)?.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }) || "Sem data";
const clientName = (order) => [order?.client?.first_name, order?.client?.last_name].filter(Boolean).join(" ") || order?.customer_name || "Cliente";
const employerName = (employer) => [employer?.user?.first_name, employer?.user?.last_name].filter(Boolean).join(" ") || employer?.role || "Colaborador";

export default function EstablishmentOrderPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("active");
  const { establishment, employers, orders, loading, actionLoading, apiError, transitionOrder, assignOrder } = useEstablishmentOrdersBySlug(slug);
  const now = Date.now();

  const summary = useMemo(() => (orders || []).reduce((acc, order) => {
    const status = statusOf(order);
    acc.total += 1;
    if (status === "pending") acc.pending += 1;
    if (status === "confirmed") acc.confirmed += 1;
    if (["completed", "attended"].includes(status)) acc.completed += 1;
    return acc;
  }, { total: 0, pending: 0, confirmed: 0, completed: 0 }), [orders]);

  const filteredOrders = useMemo(() => (orders || []).filter((order) => {
    const status = statusOf(order);
    if (filter === "all") return true;
    if (filter === "active") return ["pending", "confirmed"].includes(status);
    if (filter === "pending") return status === "pending";
    if (filter === "confirmed") return status === "confirmed";
    if (filter === "completed") return ["completed", "attended"].includes(status);
    return true;
  }), [orders, filter]);

  const act = async (order, action) => {
    const copy = { accept: "Aceitar solicitação", reject: "Recusar solicitação", cancel: "Cancelar agendamento", complete: "Concluir atendimento", no_show: "Registrar ausência" }[action];
    const result = await Swal.fire({ icon: ["reject", "cancel", "no_show"].includes(action) ? "warning" : "question", title: `${copy}?`, showCancelButton: true, confirmButtonText: copy, cancelButtonText: "Voltar", reverseButtons: true });
    if (!result.isConfirmed) return;
    try { await transitionOrder(order.id, action); }
    catch (error) { await Swal.fire({ icon: "error", title: "Não foi possível atualizar", text: error.message }); }
  };

  const reassign = async (order, attendantId) => {
    if (!attendantId || Number(attendantId) === Number(order.attendant_id)) return;
    try { await assignOrder(order.id, Number(attendantId)); }
    catch (error) { await Swal.fire({ icon: "error", title: "Não foi possível redirecionar", text: error.message }); }
  };

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  if (apiError || !establishment) return <Container className="py-4"><Alert variant="danger">{apiError || "Barbearia não encontrada."}</Alert></Container>;

  return (
    <main className="establishment-agenda-page eop-page">
      <EstablishmentHero entity={establishment} title={`Agenda da ${establishment.fantasy || establishment.name}`} subtitle="Comando operacional da barbearia" description="Aceite, recuse, cancele, conclua e direcione solicitações entre os colaboradores da sua equipe." showBack />

      <section className="eop-toolbar">
        <div className="eop-stats">
          <button type="button" onClick={() => setFilter("all")}><span>Total</span><strong>{summary.total}</strong></button>
          <button type="button" onClick={() => setFilter("pending")}><span>Solicitados</span><strong>{summary.pending}</strong></button>
          <button type="button" onClick={() => setFilter("confirmed")}><span>Confirmados</span><strong>{summary.confirmed}</strong></button>
          <button type="button" onClick={() => setFilter("completed")}><span>Concluídos</span><strong>{summary.completed}</strong></button>
        </div>
        <div className="agenda-command-actions">
          <GlobalButton variant="outline-light" size="md" onClick={() => navigate(`/establishment/employers/${slug}`)}>Equipe</GlobalButton>
          <GlobalButton variant="primary" size="md" onClick={() => navigate(`/order/create/${slug}`)}>Novo atendimento</GlobalButton>
        </div>
      </section>

      <div className="agenda-results-heading">
        <div><span>Filtro</span><strong>{filter === "active" ? "Próximos agendamentos" : `${filteredOrders.length} registros`}</strong></div>
        <button type="button" onClick={() => setFilter("active")}>Ver próximos →</button>
      </div>

      {filteredOrders.length === 0 ? <Alert variant="info">Nenhum atendimento encontrado neste filtro.</Alert> : (
        <section className="eop-list">
          {filteredOrders.map((order, index) => {
            const status = statusOf(order);
            const start = asDate(order.order_datetime);
            const end = start ? new Date(start.getTime() + Number(order.total_duration || 30) * 60000) : null;
            const future = start && start.getTime() > now;
            const isNext = index === 0 && ["pending", "confirmed"].includes(status) && future;
            const items = (order.items || []).map((row) => row?.name || row?.item?.name).filter(Boolean).join(" • ");
            return (
              <article className={`eop-row ${isNext ? "eop-row--next" : ""}`} key={order.id}>
                <div className="eop-time"><strong>{fmtTime(order.order_datetime)}</strong><span>{fmtDate(order.order_datetime)}</span></div>
                <div className="eop-main">
                  <div className="eop-titleLine"><div><strong>{clientName(order)}</strong>{isNext && <span className="eop-next">Próximo</span>}</div><span className="eop-status">{status}</span></div>
                  <div className="eop-sub">{items || "Atendimento"}</div>
                  <div className="eop-meta"><span>#{order.order_number || order.id}</span><span>{Number(order.total_duration || 30)} min</span></div>
                  {["pending", "confirmed"].includes(status) && (
                    <label className="agenda-assignee"><FaExchangeAlt /> Direcionar para
                      <select value={order.attendant_id || ""} disabled={actionLoading === order.id} onChange={(e) => reassign(order, e.target.value)}>
                        <option value="">Selecione</option>
                        {employers.map((employer) => <option key={employer.id} value={employer.id}>{employerName(employer)}</option>)}
                      </select>
                    </label>
                  )}
                </div>
                <div className="eop-actions">
                  {status === "pending" && future && <button className="eop-btn eop-btn--accept" onClick={() => act(order, "accept")}><FaCheck /> Aceitar</button>}
                  {status === "pending" && future && <button className="eop-btn eop-btn--reject" onClick={() => act(order, "reject")}><FaTimes /> Recusar</button>}
                  {status === "confirmed" && future && <button className="eop-btn eop-btn--reject" onClick={() => act(order, "cancel")}><FaTimes /> Cancelar</button>}
                  {status === "confirmed" && end && end.getTime() <= now && <button className="eop-btn eop-btn--accept" onClick={() => act(order, "complete")}><FaCheckCircle /> Concluir</button>}
                  {status === "confirmed" && end && end.getTime() <= now && <button className="eop-btn" onClick={() => act(order, "no_show")}><FaClock /> Não compareceu</button>}
                  {order?.client?.user_name && <Link className="eop-btn" to={`/user/${order.client.user_name}`}>Perfil do cliente</Link>}
                  <Link className="eop-btn" to={`/order/view/${order.id}`}>Detalhes</Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
