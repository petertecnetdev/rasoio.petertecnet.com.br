// src/components/establishment/EstablishmentActionsBar.jsx
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const actions = [
  {
    key: "agenda",
    label: "Agenda",
    description: "Pedidos e horários",
    icon: "📅",
    path: (establishment) => `/establishment/orders/${establishment.slug}`,
    primary: true,
  },
  {
    key: "team",
    label: "Equipe",
    description: "Colaboradores",
    icon: "👥",
    path: (establishment) => `/establishment/employers/${establishment.slug}`,
  },
  {
    key: "items",
    label: "Serviços",
    description: "Itens e preços",
    icon: "✂️",
    path: (establishment) => `/establishment/item/${establishment.slug}`,
  },
  {
    key: "edit",
    label: "Configurações",
    description: "Dados da barbearia",
    icon: "⚙️",
    path: (establishment) => `/establishment/update/${establishment.id}`,
  },
];

export default function EstablishmentActionsBar({ establishment }) {
  return (
    <nav className="barbershop-actions" aria-label={`Gerenciar ${establishment.fantasy || establishment.name || "barbearia"}`}>
      {actions.map((action) => (
        <Link
          key={action.key}
          to={action.path(establishment)}
          className={`barbershop-action${action.primary ? " barbershop-action-primary" : ""}`}
        >
          <span className="barbershop-action-icon" aria-hidden="true">{action.icon}</span>
          <span className="barbershop-action-copy">
            <strong>{action.label}</strong>
            <small>{action.description}</small>
          </span>
          <span className="barbershop-action-arrow" aria-hidden="true">→</span>
        </Link>
      ))}
    </nav>
  );
}

EstablishmentActionsBar.propTypes = {
  establishment: PropTypes.shape({
    id: PropTypes.number.isRequired,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string,
    fantasy: PropTypes.string,
  }).isRequired,
};
