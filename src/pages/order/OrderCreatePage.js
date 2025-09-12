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
  const [products, setProducts] = useState([]);
  const [estName, setEstName] = useState("");
  const [estLogo, setEstLogo] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    origin: "Balcão",
    fulfillment: "dine-in",
    payment_status: "pending",
    payment_method: "Dinheiro",
    notes: "",
  });
  const [orderLines, setOrderLines] = useState([]);

  const originLabels = {
    Balcão: "Balcão",
    WhatsApp: "WhatsApp",
    Telefone: "Telefone",
    App: "Aplicativo",
  };
  const fulfillmentLabels = {
    "dine-in": "Local",
    "take-away": "Levar",
    delivery: "Delivery",
  };

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
        setProducts(resItems.data);
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

  const total = useMemo(() => {
    let t = 0;
    orderLines.forEach((line) => {
      t += line.quantity * Number(line.product.price);
      line.additions.forEach((a) => {
        const prod = products.find((p) => p.id === a.id);
        if (prod) t += Number(prod.price) * a.quantity;
      });
    });
    return t;
  }, [orderLines, products]);

  const formattedTotal = `R$${total.toFixed(2).replace(".", ",")}`;

  const buildReceipt = (order) => {
    const WIDTH = 32;
    const center = (text) =>
      text.padStart(Math.floor((WIDTH + text.length) / 2)).padEnd(WIDTH);
    const line = (char = "-") => char.repeat(WIDTH);
    const fmt = (v) => `R$${Number(v).toFixed(2).replace(".", ",")}`;
    const pad = (l, r) => {
      const dots = ".".repeat(Math.max(WIDTH - (l.length + r.length), 0));
      return `${l}${dots}${r}`;
    };
    const consLabel = fulfillmentLabels[order.fulfillment] || order.fulfillment;
    const origLabel = originLabels[order.origin] || order.origin;
    const L = [];
    L.push("");
    L.push("─".repeat(WIDTH));
    L.push(center(estName));
    L.push("─".repeat(WIDTH));
    L.push("");
    L.push(`👤 Cliente: ${(order.customer_name || "").toUpperCase()}`);
    L.push(`📦 Origem: ${origLabel.toUpperCase()}`);
    L.push(`🍽️ Consumo: ${consLabel.toUpperCase()}`);
    L.push(line());
    L.push(center("ITENS DO PEDIDO"));
    L.push(line());
    let totalRec = 0;
    order.items.forEach((it) => {
      const unitPrice = Number(it.item.price);
      const itemSubtotal = unitPrice * it.quantity;
      totalRec += itemSubtotal;
      L.push(pad(`${it.quantity}x ${it.item.name}`, fmt(itemSubtotal)));
      it.modifiers
        .filter((m) => m.type === "addition")
        .forEach((m) => {
          const prod = products.find((p) => p.id === m.modifier_id);
          if (prod) {
            const addUnit = Number(prod.price);
            const addQty = m.quantity || 1;
            const addSubtotal = addUnit * addQty;
            totalRec += addSubtotal;
            L.push(pad(`  + ${prod.name}`, fmt(addSubtotal)));
          }
        });
      it.modifiers
        .filter((m) => m.type === "removal")
        .forEach((m) => {
          const prod = products.find((p) => p.id === m.modifier_id);
          if (prod) {
            L.push(`  - ${prod.name}`);
          }
        });
    });
    L.push(line());
    L.push(pad("TOTAL", fmt(totalRec)));
    L.push("");
    L.push(
      `Data: ${new Date(order.order_datetime).toLocaleString("pt-BR", {
        hour12: false,
      })}`
    );
    L.push("");
    L.push("");
    return L.join("\n");
  };

  const getItemsHtml = (category) => {
    const items = products.filter((p) => (p.category || "Outros") === category);
    if (!items.length) {
      return '<div class="order-modal__empty">Nenhum item nesta categoria.</div>';
    }
    return items
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
      new Set(products.map((p) => p.category || "Outros"))
    );
    let currentIndex = 0;
    let lastDirection = null;

    const getHtml = () => {
      const isMobile = window.innerWidth <= 600;
      const currentCat = categories[currentIndex];
      const transitionClass =
        lastDirection === "left"
          ? "order-modal__slide-left"
          : lastDirection === "right"
          ? "order-modal__slide-right"
          : "";

      return `
      <div class="order-modal d-flex flex-column h-100">
        ${
          isMobile
            ? `<div class="order-modal__category-title">${currentCat}</div>`
            : `
              <nav class="order-modal__tabs">
                ${categories
                  .map(
                    (cat, idx) => `
                      <button
                        class="order-modal__tab${
                          idx === currentIndex ? " order-modal__tab--active" : ""
                        }"
                        data-cat-index="${idx}"
                      >${cat}</button>
                    `
                  )
                  .join("")}
              </nav>
            `
        }
        <div class="container-fluid flex-grow-1 overflow-auto p-3">
          <div class="row order-modal__items-grid ${transitionClass}">
            ${getItemsHtml(currentCat)}
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
      padding: "0",
      customClass: {
        container: "order-modal__container-fullscreen",
        popup: "order-modal__swal-fullscreen",
        htmlContainer: "order-modal__content-fullscreen",
        cancelButton: "order-modal__swal-btn-cancel",
      },
      didOpen: () => {
        let startX = 0;
        let isTouching = false;

        const attachListeners = () => {
          const grid = document.querySelector(".order-modal__items-grid");
          if (grid) {
            grid.addEventListener("touchstart", (e) => {
              isTouching = true;
              startX = e.touches[0].clientX;
            });
            grid.addEventListener("touchend", (e) => {
              if (!isTouching) return;
              isTouching = false;
              const diff = e.changedTouches[0].clientX - startX;
              if (Math.abs(diff) < 40) return;
              if (diff < 0 && currentIndex < categories.length - 1) {
                lastDirection = "left";
                currentIndex++;
                Swal.update({ html: getHtml() });
                setTimeout(attachListeners, 180);
              } else if (diff > 0 && currentIndex > 0) {
                lastDirection = "right";
                currentIndex--;
                Swal.update({ html: getHtml() });
                setTimeout(attachListeners, 180);
              } else if (diff < 0 && currentIndex === categories.length - 1) {
                lastDirection = "left";
                currentIndex = 0;
                Swal.update({ html: getHtml() });
                setTimeout(attachListeners, 180);
              } else if (diff > 0 && currentIndex === 0) {
                lastDirection = "right";
                currentIndex = categories.length - 1;
                Swal.update({ html: getHtml() });
                setTimeout(attachListeners, 180);
              }
            });
          }
          document.querySelectorAll(".order-modal__tab").forEach((btn) => {
            btn.onclick = () => {
              lastDirection = null;
              currentIndex = Number(btn.dataset.catIndex);
              Swal.update({ html: getHtml() });
              setTimeout(attachListeners, 120);
            };
          });
          document.querySelectorAll(".order-modal__item-add").forEach((btn) => {
            btn.onclick = (e) => {
              const id = Number(e.currentTarget.dataset.id);
              const prod = products.find((p) => p.id === id);
              if (!prod) return;
              setOrderLines((lines) => [
                ...lines,
                { product: prod, quantity: 1, additions: [], removals: [] },
              ]);
              Swal.close();
            };
          });
        };
        attachListeners();
      },
    });
  };

  const removeLine = (i) =>
    setOrderLines((lines) => lines.filter((_, idx) => idx !== i));
  const updateLine = (i, field, v) =>
    setOrderLines((lines) => {
      const copy = [...lines];
      copy[i][field] = v;
      return copy;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      app_id: 3,
      entity_name: "establishment",
      entity_id: +entityId,
      items: orderLines.map((l) => ({
        item_id: l.product.id,
        quantity: l.quantity,
        additions: l.additions.flatMap((a) => Array(a.quantity).fill(a.id)),
        removals: l.removals,
      })),
      ...form,
    };
    try {
      const token = localStorage.getItem("token");
      const { data: created } = await axios.post(
        `${apiBaseUrl}/order`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { data: fetched } = await axios.get(
        `${apiBaseUrl}/order/${created.order.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const receiptText = buildReceipt(fetched.order);
      await Swal.fire({
        title: `Recibo Pedido #${fetched.order.order_number}`,
        html: `<pre>${receiptText}</pre>`,
        showCancelButton: true,
        confirmButtonText: "Imprimir",
      });
      navigate(`/order/list/${entityId}`);
    } catch (err) {
      if (err.response?.status === 422) {
        const msgs = Object.values(err.response.data.errors || {}).flat();
        Swal.fire("Erro de Validação", msgs.join("\n"), "warning");
      } else {
        Swal.fire("Erro", "Não foi possível criar pedido.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <Spinner animation="border" className="order-loading__spinner" />;

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
                    className="order-line__btn-remove"
                    onClick={() => removeLine(i)}
                  >
                    ×
                  </Button>
                </Col>
                <Col xs={12} sm={6} lg={3} className="order-line__quantity">
                  <Button
                    size="sm"
                    variant="outline-info"
                    className="order-line__btn-minus"
                    onClick={() =>
                      updateLine(i, "quantity", Math.max(1, line.quantity - 1))
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
                    className="order-line__btn-plus"
                    onClick={() => updateLine(i, "quantity", line.quantity + 1)}
                  >
                    +
                  </Button>
                </Col>
              </Row>
            ))}
          </Row>
        </div>
        <Form onSubmit={handleSubmit} className="order-create__form">
          <Row className="order-create__form-row">
            <Col md={4}>
              <Form.Group
                controlId="customer"
                className="order-create__form-group"
              >
                <Form.Label className="order-create__label">Cliente</Form.Label>
                <Form.Control
                  required
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_name: e.target.value }))
                  }
                  className="order-create__input"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="order-create__form-row">
            <Col md={2}>
              <Form.Group
                controlId="origin"
                className="order-create__form-group"
              >
                <Form.Label className="order-create__label">Origem</Form.Label>
                <Form.Select
                  value={form.origin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, origin: e.target.value }))
                  }
                  className="order-create__select"
                >
                  {Object.keys(originLabels).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group
                controlId="fulfillment"
                className="order-create__form-group"
              >
                <Form.Label className="order-create__label">Consumo</Form.Label>
                <Form.Select
                  value={form.fulfillment}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fulfillment: e.target.value }))
                  }
                  className="order-create__select"
                >
                  {Object.entries(fulfillmentLabels).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group
                controlId="payment_status"
                className="order-create__form-group"
              >
                <Form.Label className="order-create__label">
                  Status Pagamento
                </Form.Label>
                <Form.Select
                  value={form.payment_status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, payment_status: e.target.value }))
                  }
                  className="order-create__select"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="failed">Falhou</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group
                controlId="payment_method"
                className="order-create__form-group"
              >
                <Form.Label className="order-create__label">
                  Método Pagamento
                </Form.Label>
                <Form.Select
                  value={form.payment_method}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, payment_method: e.target.value }))
                  }
                  className="order-create__select"
                >
                  <option>Dinheiro</option>
                  <option>Pix</option>
                  <option>Crédito</option>
                  <option>Débito</option>
                  <option>Fiado</option>
                  <option>Cortesia</option>
                  <option>Transferência bancária</option>
                  <option>Vale-refeição</option>
                  <option>Cheque</option>
                  <option>PayPal</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row className="order-create__form-row">
            <Col md={12}>
              <Form.Group
                controlId="notes"
                className="order-create__form-group"
              >
                <Form.Label className="order-create__label">
                  Observações
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="order-create__textarea"
                />
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
