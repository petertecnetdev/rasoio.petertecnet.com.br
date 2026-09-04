import React from "react";
import PropTypes from "prop-types";

import { formatCurrencyBr, formatDatePtBr } from "../../utils/dateTime";
import "./steps.css";

export default function StepConfirm({ services = [], employer, date, time, total = 0, duration = 0 }) {
  const formattedDate = formatDatePtBr(date);
  const professionalName =
    employer?.user?.first_name || employer?.first_name || employer?.name || "Profissional não informado";

  return (
    <section className="step-container" aria-labelledby="appointment-confirm-title">
      <h4 id="appointment-confirm-title">Confirmar Agendamento</h4>
      <p><b>Profissional:</b> {professionalName}</p>
      <p><b>Data:</b> {formattedDate || "Data não informada"}</p>
      <p><b>Horário:</b> {time || "Horário não informado"}</p>

      <ul aria-label="Serviços selecionados">
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
    </section>
  );
}

StepConfirm.propTypes = {
  services: PropTypes.array,
  employer: PropTypes.object,
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  time: PropTypes.string,
  total: PropTypes.number,
  duration: PropTypes.number,
};
