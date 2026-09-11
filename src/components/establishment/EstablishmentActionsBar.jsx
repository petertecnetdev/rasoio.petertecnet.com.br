// src/components/establishment/EstablishmentActionsBar.jsx
import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const actions = [
  {
    key: "agenda",
    label: "Agenda",
    description: "Atendimentos e horários",
    icon: "📅",
    path: (establishment) => `/establishment/orders/${establishment.slug}`,
  },
  {
    key: "team",
    label: "Equipe",
    description: "Colaboradores",
    icon: "👥",
    path: (establishment) => `/establishment/employers/${establishment.slug}`,
  },
  {
    key: "services",
    label: "Serviços",
    description: "Duração e preços",
    icon: "🧰",
    path: (establishment) => `/establishment/item/${establishment.slug}`,
  },
  {
    key: "products",
    label: "Produtos",
    description: "Produtos e disponibilidade",
    icon: "📦",
    path: (establishment) => `/establishment/item/${establishment.slug}?type=product`,
  },
  {
    key: "edit",
    label: "Configurações",
    description: "Dados do estabelecimento",
    icon: "⚙️",
    path: (establishment) => `/establishment/update/${establishment.id}`,
  },
];

const buildPublicUrl = (slug) => {
  const encodedSlug = encodeURIComponent(slug);
  const path = `/establishment/view/${encodedSlug}`;
  const params = new URLSearchParams({
    source: "shared-agenda",
    ref: slug,
    utm_source: "rasoio",
    utm_medium: "product_share",
    utm_campaign: "agenda_distribution",
  });

  if (typeof window === "undefined") return `${path}?${params.toString()}`;
  return `${window.location.origin}${path}?${params.toString()}`;
};

const buildWhatsappUrl = (name, publicUrl) => {
  const message = [
    `Agende seu horário em ${name}.`,
    "Escolha o serviço, o profissional e o melhor horário disponível:",
    publicUrl,
  ].join("\n");

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

export default function EstablishmentActionsBar({ establishment }) {
  const name = establishment.fantasy || establishment.name || "estabelecimento";
  const [shareFeedback, setShareFeedback] = useState("");

  const handleShare = useCallback(async () => {
    const url = buildPublicUrl(establishment.slug);
    const shareData = {
      title: `Agende seu horário em ${name}`,
      text: `Escolha o serviço, profissional e horário disponível em ${name}.`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareFeedback("Agenda compartilhada");
        return;
      }

      const whatsappWindow = window.open(
        buildWhatsappUrl(name, url),
        "_blank",
        "noopener,noreferrer"
      );

      if (whatsappWindow) {
        setShareFeedback("WhatsApp aberto");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareFeedback("Link copiado");
        return;
      }

      window.prompt("Copie o link público da agenda:", url);
      setShareFeedback("Link pronto para copiar");
    } catch (error) {
      if (error?.name === "AbortError") return;

      try {
        await navigator.clipboard?.writeText?.(url);
        setShareFeedback("Link copiado");
      } catch {
        window.prompt("Copie o link público da agenda:", url);
        setShareFeedback("Link pronto para copiar");
      }
    }
  }, [establishment.slug, name]);

  return (
    <nav className="barbershop-actions" aria-label={`Gerenciar ${name}`}>
      <button
        type="button"
        className="barbershop-action barbershop-action-primary"
        onClick={handleShare}
        aria-label={`Compartilhar agenda pública de ${name}`}
      >
        <span className="barbershop-action-icon" aria-hidden="true">↗</span>
        <span className="barbershop-action-copy">
          <strong>Compartilhar agenda</strong>
          <small>{shareFeedback || "WhatsApp e outros apps"}</small>
        </span>
        <span className="barbershop-action-arrow" aria-hidden="true">→</span>
      </button>

      {actions.map((action) => (
        <Link key={action.key} to={action.path(establishment)} className="barbershop-action">
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
