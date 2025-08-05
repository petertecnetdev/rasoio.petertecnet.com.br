// src/pages/order/OrderListPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Table,
  ButtonGroup,
} from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./Order.css";

function getFirstDayOfLastMonth(dt) {
  return new Date(dt.getFullYear(), dt.getMonth() - 1, 1);
}
function getLastDayOfLastMonth(dt) {
  return new Date(dt.getFullYear(), dt.getMonth(), 0);
}
function getMonday(d) {
  d = new Date(d);
  const day = d.getDay(),
        diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export default function OrderListPage() {
  const { entityId } = useParams();
  const todayObj = new Date();
  const today = todayObj.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

  // datas auxiliares
  const dt = new Date();
  const ont = new Date(dt); ont.setDate(dt.getDate() - 1);
  const ontDate = ont.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const lastMonday = getMonday(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - 7));
  const lastSunday = new Date(lastMonday); lastSunday.setDate(lastMonday.getDate() + 6);
  const weekStart = lastMonday.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const weekEnd   = lastSunday.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const lastMonthFirst = getFirstDayOfLastMonth(dt);
  const lastMonthLast  = getLastDayOfLastMonth(dt);
  const monthStart = lastMonthFirst.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const monthEnd   = lastMonthLast.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const thisMonthStartObj = new Date(dt.getFullYear(), dt.getMonth(), 1);
  const thisMonthStart = thisMonthStartObj.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const thisMonthEnd   = today;

  // state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estName, setEstName] = useState("");
  const [estLogo, setEstLogo] = useState("");
  const [quickFilter, setQuickFilter] = useState("hoje");
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    startTime: "00:00",
    endTime: "23:59",
    customer: "",
    item: "",
  });

  // calcula total (sempre número)
  const computeTotal = o =>
    o.items.reduce((sum, it) => sum + Number(it.subtotal || 0), 0);

  // pedidos filtrados
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const dtObj = new Date(o.order_datetime);
      const date = dtObj.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      const time = dtObj.toLocaleTimeString("pt-BR", {
        hour12: false, hour: "2-digit", minute: "2-digit", timeZone:"America/Sao_Paulo"
      });
      return date >= filters.startDate
        && date <= filters.endDate
        && time >= filters.startTime
        && time <= filters.endTime
        && o.customer_name.toLowerCase().includes(filters.customer.toLowerCase())
        && (!filters.item || o.items.some(i => i.item.name.toLowerCase().includes(filters.item.toLowerCase())));
    });
  }, [orders, filters]);

  // resumo
  const summary = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const rawTotal = filteredOrders.reduce((sum, o) => sum + computeTotal(o), 0);
    const totalValue = Number(rawTotal) || 0;
    return { totalOrders, totalValue };
  }, [filteredOrders]);

  // carregamento inicial
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    axios.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("token")}`;

    // busca atendimentos
    axios.get(`${apiBaseUrl}/order/listbyentity`, {
      params: { app_id: 3, entity_name: "establishment", entity_id: entityId }
    })
      .then(res => mounted && setOrders(res.data.orders || []))
      .catch(() => mounted && Swal.fire("Erro", "Falha ao buscar atendimentos.", "error"));

    // busca estabelecimento
    axios.get(`${apiBaseUrl}/establishment/show/${entityId}`)
      .then(res => {
        if (!mounted) return;
        setEstName(res.data.establishment.name.toUpperCase());
        setEstLogo(res.data.establishment.logo || "");
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [entityId]);

  // quick filters
  const handleQuickFilter = mode => {
    let startDate, endDate;
    switch(mode) {
      case "hoje":    startDate = endDate = today; break;
      case "ontem":   startDate = endDate = ontDate; break;
      case "semana":  startDate = weekStart; endDate = weekEnd; break;
      case "mes":     startDate = monthStart; endDate = monthEnd; break;
      case "esteMes": startDate = thisMonthStart; endDate = thisMonthEnd; break;
      default:        startDate = endDate = today;
    }
    setFilters(f => ({
      ...f,
      startDate,
      endDate,
      startTime: "00:00",
      endTime: "23:59"
    }));
    setQuickFilter(mode);
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <>
      <NavlogComponent />
      <Container className="mt-4">
        {/* header */}
        <Row className="mb-3 align-items-center">
          {estLogo && (
            <Col xs="auto">
              <img
                src={`${storageUrl}/${estLogo}`}
                alt={`${estName} logo`}
                className="order-list__logo"
                onError={e => (e.currentTarget.src = "/images/logo.png")}
              />
            </Col>
          )}
          <Col><h3>{estName}</h3></Col>
          <Col className="text-end">
            <Link to={`/order/create/${entityId}`}>
              <Button variant="success">Novo Atendimento</Button>
            </Link>
          </Col>
        </Row>

        {/* quick filters */}
        <Row className="mb-4">
          <Col>
            <ButtonGroup>
              <Button size="sm" variant={quickFilter==="hoje" ? "warning" : "dark"} onClick={()=>handleQuickFilter("hoje")}>Hoje</Button>
              <Button size="sm" variant={quickFilter==="ontem" ? "warning" : "dark"} onClick={()=>handleQuickFilter("ontem")}>Ontem</Button>
              <Button size="sm" variant={quickFilter==="semana" ? "warning" : "dark"} onClick={()=>handleQuickFilter("semana")}>Semana</Button>
              <Button size="sm" variant={quickFilter==="mes" ? "warning" : "dark"} onClick={()=>handleQuickFilter("mes")}>Mês</Button>
              <Button size="sm" variant={quickFilter==="esteMes" ? "warning" : "dark"} onClick={()=>handleQuickFilter("esteMes")}>Este Mês</Button>
            </ButtonGroup>
          </Col>
        </Row>

        {/* summary */}
        <Row className="mb-4">
          <Col xs={6} md={3}>
            <Card bg="dark" text="light" className="text-center">
              <Card.Body>
                <Card.Title>Total Atendimentos</Card.Title>
                <Card.Text>{summary.totalOrders}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card bg="dark" text="light" className="text-center">
              <Card.Body>
                <Card.Title>Valor Total</Card.Title>
                <Card.Text>R${summary.totalValue.toFixed(2).replace(".",",")}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* tabela desktop */}
        <Table striped hover variant="dark" responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Data / Hora</th>
              <th>Cliente</th>
              <th>Provider</th>
              <th>Status Pagamento</th>
              <th>Método Pagamento</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-4">
                  Nenhum atendimento encontrado.
                </td>
              </tr>
            ) : filteredOrders.map(o => (
              <tr key={o.id}>
                <td>{o.order_number}</td>
                <td>{new Date(o.order_datetime).toLocaleString("pt-BR", {hour12:false})}</td>
                <td>{o.customer_name}</td>
                <td>{o.attendant?.first_name || "—"}</td>
                <td>{o.payment_status === "pending" ? "Pendente" : "Pago"}</td>
                <td>{o.payment_method}</td>
                <td>{o.items.map(i => `${i.quantity}x ${i.item.name}`).join(", ")}</td>
                <td>R${computeTotal(o).toFixed(2).replace(".",",")}</td>
                <td>
                  <Link to={`/order/edit/${entityId}/${o.id}`}>
                    <Button size="sm" variant="warning">Editar</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </>
  );
}
