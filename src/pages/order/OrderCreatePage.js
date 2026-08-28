import React, { useState } from "react";
import { Container, Spinner, Alert } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";

import GlobalNav from "../../components/GlobalNav";
import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import OrderCreateForm from "../../components/order/OrderCreateForm";
import useOrderCreate from "../../hooks/useOrderCreate";
import GlobalModal from "../../components/GlobalModal";
import api from "../../services/api";
import { appId } from "../../config";
import { getApiErrorMessage } from "../../utils/apiError";
import { escapeHtml } from "../../utils/html";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function OrderCreatePage() {
  const { slug: identifier } = useParams();
  const navigate = useNavigate();

  const {
    establishment,
    items,
    employers,
    clients,
    searchingClients,
    searchClients,
    fetchAvailableTimes,
    loading,
    submitting,
    apiError,
  } = useOrderCreate(identifier);

  const [selectedClient, setSelectedClient] = useState(null);

  const handleSubmit = async (payload) => {
    if (!establishment) return;

    try {
      GlobalModal.loading("Confirmando pedido...");

      const res = await api.post("/order", {
        ...payload,
        app_id: appId,
        entity_name: "establishment",
        entity_id: establishment.id,
        origin: payload.mode === "appointment" ? "online" : "local",
        fulfillment: payload.mode === "appointment" ? "scheduled" : "immediate",
        payment_status: "pending",
        payment_method: "cash",
      });

      const order = res.data?.order;
      if (!order?.id) throw new Error("A API não retornou o pedido criado.");

      GlobalModal.close();

      GlobalModal.open({
        title: "Pedido criado com sucesso",
        icon: "success",
        html: `
          <div style="text-align:left">
            <p><strong>${escapeHtml(res.data?.message || "Pedido criado com sucesso.")}</strong></p>
            <hr/>
            <p><strong>Nº do pedido:</strong> ${escapeHtml(order.order_number || order.id)}</p>
            <p><strong>Status:</strong> ${escapeHtml(order.status || "pendente")}</p>
            <p><strong>Início:</strong> ${escapeHtml(
              formatDateTime(order.scheduled_start || order.order_datetime)
            )}</p>
            <p><strong>Término:</strong> ${escapeHtml(formatDateTime(order.scheduled_end))}</p>
          </div>
        `,
        confirmText: "Ver pedido",
        showCancel: false,
        onConfirm: () => {
          navigate(`/order/view/${order.id}`);
        },
      });
    } catch (err) {
      GlobalModal.close();
      const message = getApiErrorMessage(err, err?.message || "Erro ao criar pedido.");

      GlobalModal.open({
        title: "Erro",
        icon: "error",
        html: `<p>${escapeHtml(message)}</p>`,
        confirmText: "Fechar",
        showCancel: false,
      });
    }
  };

  return (
    <>
      <GlobalNav />

      <Container className="mt-4">
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        )}

        {apiError && <Alert variant="danger">{apiError}</Alert>}

        {!loading && establishment && (
          <>
            <EstablishmentHero
              title="Novo Pedido"
              subtitle={establishment.fantasy || establishment.name}
              city={establishment.city}
              uf={establishment.uf}
              icon="bi-receipt"
              backLabel="Voltar"
            />

            <OrderCreateForm
              establishment={establishment}
              items={items}
              employers={employers}
              clients={clients}
              searchingClients={searchingClients}
              searchClients={searchClients}
              selectedClient={selectedClient}
              setSelectedClient={setSelectedClient}
              fetchAvailableTimes={fetchAvailableTimes}
              onSubmit={handleSubmit}
              isSubmitting={submitting}
            />
          </>
        )}
      </Container>
    </>
  );
}
