import React, { useRef, useState } from "react";
import { Container, Spinner, Alert } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import GlobalNav from "../../components/GlobalNav";
import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import OrderCreateForm from "../../components/order/OrderCreateForm";
import useOrderCreate from "../../hooks/useOrderCreate";
import { appId } from "../../config";

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

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const showLoadingModal = () =>
  Swal.fire({
    title: "Confirmando pedido...",
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
  });

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
    createOrder,
    loading,
    submitting,
    apiError,
  } = useOrderCreate(identifier);

  const [selectedClient, setSelectedClient] = useState(null);
  const submitLockRef = useRef(false);

  const handleSubmit = async (payload) => {
    if (!establishment || submitting || submitLockRef.current) return;

    submitLockRef.current = true;

    try {
      showLoadingModal();

      const data = await createOrder({
        ...payload,
        app_id: appId,
        entity_name: "establishment",
        entity_id: establishment.id,
        origin: payload.mode === "appointment" ? "online" : "local",
        fulfillment: payload.mode === "appointment" ? "scheduled" : "immediate",
        payment_status: "pending",
        payment_method: "cash",
      });

      const order = data?.order;
      const apiMessage = data?.message || "Pedido criado com sucesso.";

      await Swal.fire({
        title: "Pedido criado com sucesso",
        icon: "success",
        html: `
          <div style="text-align:left">
            <p><strong>${escapeHtml(apiMessage)}</strong></p>
            <hr/>
            <p><strong>Nº do pedido:</strong> ${escapeHtml(order?.order_number || "-")}</p>
            <p><strong>Status:</strong> ${escapeHtml(order?.status || "-")}</p>
            <p><strong>Início:</strong> ${escapeHtml(
              formatDateTime(order?.scheduled_start || order?.order_datetime)
            )}</p>
            <p><strong>Término:</strong> ${escapeHtml(
              formatDateTime(order?.scheduled_end)
            )}</p>
          </div>
        `,
        confirmButtonText: "Ver pedido",
      });

      if (order?.id) {
        navigate(`/order/view/${order.id}`);
      }
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Erro ao criar pedido.";

      await Swal.fire({
        title: "Erro",
        icon: "error",
        text: String(message),
        confirmButtonText: "Fechar",
      });
    } finally {
      submitLockRef.current = false;
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
