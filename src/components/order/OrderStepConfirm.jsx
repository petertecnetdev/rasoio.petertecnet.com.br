// src/components/order/OrderStepConfirm.jsx
import React from "react";
import PropTypes from "prop-types";

import { formatCurrencyBr, formatDatePtBr } from "../../utils/dateTime";
import "./OrderStepConfirm.css";

export default function OrderStepConfirm({
  services = [],
  employer = null,
  date,
  time,
  total = 0,
  duration = 0,
  customerCpf,
  customerPhone,
  onCpfChange,
  onPhoneChange,
}) {
  const formattedDate = formatDatePtBr(date);
  const professionalName =
    employer?.user?.first_name || employer?.first_name || employer?.name || "Profissional não informado";

  return (
    <section className="order-step-container" aria-labelledby="order-confirm-title">
      <h4 id="order-confirm-title">Confirmar Ordem de Serviço</h4>

      <div className="order-confirm-box">
        <p><b>Profissional:</b> {professionalName}</p>
        <p><b>Data:</b> {formattedDate || "Data não informada"}</p>
        <p><b>Horário:</b> {time || "Horário não informado"}</p>

        <ul className="order-confirm-services" aria-label="Serviços selecionados">
          {services.map((service) => (
            <li key={service.id || service.item_id}>
              {service.name} — {formatCurrencyBr(service.price)}
            </li>
          ))}
        </ul>

        <hr />

        <p>
          <b>Total:</b> {formatCurrencyBr(total)} | <b>Duração:</b> {duration} min
        </p>

        <div className="order-confirm-inputs">
          <label htmlFor="order-customer-cpf">
            <span>CPF do cliente</span>
            <input
              id="order-customer-cpf"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              value={customerCpf}
              onChange={(event) => onCpfChange(event.target.value)}
            />
          </label>

          <label htmlFor="order-customer-phone">
            <span>Telefone do cliente</span>
            <input
              id="order-customer-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              value={customerPhone}
              onChange={(event) => onPhoneChange(event.target.value)}
            />
          </label>
        </div>
      </div>
    </section>
  );
}

OrderStepConfirm.propTypes = {
  services: PropTypes.array.isRequired,
  employer: PropTypes.object,
  date: PropTypes.string,
  time: PropTypes.string,
  total: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  customerCpf: PropTypes.string.isRequired,
  customerPhone: PropTypes.string.isRequired,
  onCpfChange: PropTypes.func.isRequired,
  onPhoneChange: PropTypes.func.isRequired,
};
