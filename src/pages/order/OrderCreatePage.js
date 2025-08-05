// src/pages/order/OrderCreatePage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Form, Button, Spinner } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./Order.css";

export default function OrderCreatePage() {
  const { entityId } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [estName, setEstName] = useState("");
  const [estLogo, setEstLogo] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_cpf: "",
    notes: "",
    payment_status: "pending",
    payment_method: "Fiado",
  });
  const [orderLines, setOrderLines] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      try {
        const [resItems, resEst] = await Promise.all([
          axios.get(`${apiBaseUrl}/item`, {
            params: { entity_name: "establishment", entity_id: entityId },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiBaseUrl}/establishment/show/${entityId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setItems(resItems.data);
        const est = resEst.data.establishment;
        setEstName(est.name.toUpperCase());
        setEstLogo(est.logo || "");
      } catch {
        Swal.fire("Erro", "Não foi possível carregar dados.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [entityId]);

  const total = useMemo(
    () =>
      orderLines.reduce(
        (sum, line) => sum + line.quantity * Number(line.product.price),
        0
      ),
    [orderLines]
  );

  const formattedTotal = `R$${total.toFixed(2).replace(".", ",")}`;

  const getItemsHtml = (category) => {
    const filtered = items.filter(
      (p) =>
        ["service", "product"].includes(p.type) &&
        (p.category || "Outros") === category
    );
    if (!filtered.length) {
      return '<div class="order-modal__empty">Nenhum item nesta categoria.</div>';
    }
    return filtered
      .map(
        (p) => `
      <div class="col-12 col-sm-6 col-md-3 mb-3">
        <div class="order-modal__item">
          <div class="order-modal__item-info">
            <span class="order-modal__item-name">${p.name}</span>
            <span class="order-modal__item-price">
              R$ ${Number(p.price).toFixed(2).replace(".", ",")}
            </span>
          </div>
          <button class="order-modal__item-add" data-id="${p.id}">
            Adicionar
          </button>
        </div>
      </div>
    `
      )
      .join("");
  };

  const handleAddItem = async () => {
    const categories = Array.from(
      new Set(items.map((p) => p.category || "Outros"))
    );
    let idx = 0,
      dir = null;

    const getHtml = () => {
      const mobile = window.innerWidth <= 600;
      const cat = categories[idx];
      const trans =
        dir === "left"
          ? "order-modal__slide-left"
          : dir === "right"
          ? "order-modal__slide-right"
          : "";
      return `
        <div class="order-modal d-flex flex-column h-100">
          ${
            mobile
              ? `<div class="order-modal__category-title">${cat}</div>`
              : `<nav class="order-modal__tabs">${categories
                  .map(
                    (c, i) =>
                      `<button class="order-modal__tab${
                        i === idx ? " order-modal__tab--active" : ""
                      }" data-index="${i}">${c}</button>`
                  )
                  .join("")}</nav>`
          }
          <div class="container-fluid flex-grow-1 overflow-auto p-3">
            <div class="row order-modal__items-grid ${trans}">
              ${getItemsHtml(cat)}
            </div>
          </div>
        </div>
      `;
    };

    await Swal.fire({
      html: getHtml(),
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      width: "100vw",
      heightAuto: false,
      background: "#000",
      padding: 0,
      customClass: {
        container: "order-modal__container-fullscreen",
        popup: "order-modal__swal-fullscreen",
        htmlContainer: "order-modal__content-fullscreen",
        cancelButton: "order-modal__swal-btn-cancel",
      },
      didOpen: () => {
        let startX = 0,
          touching = false;
        const attach = () => {
          const grid = document.querySelector(".order-modal__items-grid");
          if (grid) {
            grid.addEventListener("touchstart", (e) => {
              touching = true;
              startX = e.touches[0].clientX;
            });
            grid.addEventListener("touchend", (e) => {
              if (!touching) return;
              touching = false;
              const diff = e.changedTouches[0].clientX - startX;
              if (Math.abs(diff) < 40) return;
              if (diff < 0 && idx < categories.length - 1) {
                dir = "left";
                idx++;
              } else if (diff > 0 && idx > 0) {
                dir = "right";
                idx--;
              } else if (diff < 0 && idx === categories.length - 1) {
                dir = "left";
                idx = 0;
              } else if (diff > 0 && idx === 0) {
                dir = "right";
                idx = categories.length - 1;
              }
              Swal.update({ html: getHtml() });
              setTimeout(attach, 180);
            });
          }
          document.querySelectorAll(".order-modal__tab").forEach((btn) => {
            btn.onclick = () => {
              dir = null;
              idx = Number(btn.dataset.index);
              Swal.update({ html: getHtml() });
              setTimeout(attach, 120);
            };
          });
          document.querySelectorAll(".order-modal__item-add").forEach((btn) => {
            btn.onclick = (e) => {
              const id = Number(e.currentTarget.dataset.id);
              const prod = items.find((x) => x.id === id);
              if (!prod) return;
              setOrderLines((ls) => [...ls, { product: prod, quantity: 1 }]);
              Swal.close();
            };
          });
        };
        attach();
      },
    });
  };

  const removeLine = (i) => setOrderLines((ls) => ls.filter((_, j) => j !== i));
  const updateLine = (i, v) =>
    setOrderLines((ls) =>
      ls.map((ln, j) => (j === i ? { ...ln, quantity: v } : ln))
    );

  // handleSubmit completo com status e método
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // se método for 'Fiado', força status 'pending'
    let payment_status = form.payment_status;
    let payment_method = form.payment_method;
    if (payment_method === "Fiado") {
      payment_status = "pending";
    }
    // se status for pending, define método 'Fiado'
    if (payment_status === "pending") {
      payment_method = "Fiado";
    }

    const payload = {
  app_id: 2,
  entity_name: "establishment",
  entity_id: Number(entityId),
  origin: "Balcão",
  fulfillment: "dine-in",
  payment_status,
  payment_method,
  items: orderLines.map((l) => ({
    item_id: l.product.id,
    quantity: l.quantity,
  })),
  ...form, // já inclui customer_name, phone, cpf, notes
};


    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${apiBaseUrl}/order`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ord = data.order;
      await Swal.fire(
        "Registro Salvo",
        `Pedido #${ord.order_number} — ${new Date(
          ord.order_datetime
        ).toLocaleString("pt-BR", { hour12: false })}`,
        "success"
      );
      navigate(`/order/list/${entityId}`);
    } catch (err) {
      if (err.response?.status === 422) {
        const msgs = Object.values(err.response.data.errors || {}).flat();
        Swal.fire("Erro de Validação", msgs.join("\n"), "warning");
      } else {
        Swal.fire("Erro", "Não foi possível registrar atendimento.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner animation="border" className="order-loading__spinner" />;
  }

  return (
    <>
      <NavlogComponent />
      <Container className="order-create__container">
        <div className="order-create__header">
          {estLogo && (
            <img
              src={`${storageUrl}/${estLogo}`}
              alt={`${estName} logo`}
              className="order-create__logo"
              onError={(e) => (e.currentTarget.src = "/images/logo.png")}
            />
          )}
          <p className="order-create__establishment-name">
            <strong>{estName}</strong>
          </p>
          <Button
            as={Link}
            to={`/order/list/${entityId}`}
            variant="info"
            size="sm"
            className="order-create__btn-orders"
          >
            Ver Pedidos
          </Button>
        </div>

        <Button
          variant="success"
          onClick={handleAddItem}
          className="order-create__btn-add-item"
        >
          + Adicionar Item
        </Button>

        <div className="order-create__total">
          <h5>Total: {formattedTotal}</h5>
        </div>

        <div className="order-lines__block">
          <p className="order-lines__title">Itens do Pedido</p>
          <Row className="order-lines__list">
            {orderLines.map((line, i) => (
              <Row key={i} className="order-line__row">
                <Col xs={12} lg={6} className="order-line__product">
                  <span className="order-line__product-name">
                    {line.product.name} – R$ {line.product.price}
                  </span>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => removeLine(i)}
                  >
                    ×
                  </Button>
                </Col>
                <Col xs={12} sm={4} lg={2} className="order-line__quantity">
                  <Button
                    size="sm"
                    variant="outline-info"
                    onClick={() =>
                      updateLine(i, Math.max(1, line.quantity - 1))
                    }
                  >
                    −
                  </Button>
                  <span className="order-line__quantity-value">
                    {line.quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline-info"
                    onClick={() => updateLine(i, line.quantity + 1)}
                  >
                    +
                  </Button>
                </Col>
              </Row>
            ))}
          </Row>
        </div>

        <Form onSubmit={handleSubmit} className="order-create__form">
          <Row className="order-create__form-row g-3 mb-3">
            <Col md={4}>
              <Form.Group controlId="customer_name">
                <Form.Label>Cliente</Form.Label>
                <Form.Control
                  required
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_name: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="customer_phone">
                <Form.Label>Telefone</Form.Label>
                <Form.Control
                  value={form.customer_phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_phone: e.target.value }))
                  }
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="customer_cpf">
                <Form.Label>CPF</Form.Label>
                <Form.Control
                  value={form.customer_cpf}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_cpf: e.target.value }))
                  }
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mb-4">
            <Col xs={12} md={6} lg={3}>
              <Form.Group controlId="payment_status">
                <Form.Label>Status Pagamento</Form.Label>
                <Form.Select
                  value={form.payment_status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      payment_status: e.target.value,
                    }))
                  }
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="failed">Falhou</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={6} lg={3}>
              <Form.Group controlId="payment_method">
                <Form.Label>Método Pagamento</Form.Label>
                <Form.Select
                  value={form.payment_method}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      payment_method: e.target.value,
                    }))
                  }
                >
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Pix">Pix</option>
                  <option value="Crédito">Crédito</option>
                  <option value="Débito">Débito</option>
                  <option value="Fiado">Fiado</option>
                  <option value="Cortesia">Cortesia</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col className="d-flex justify-content-center">
              <Button
                type="submit"
                className="order-create__btn-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  "Criar Pedido"
                )}
              </Button>
            </Col>
          </Row>
        </Form>
      </Container>
    </>
  );
}
