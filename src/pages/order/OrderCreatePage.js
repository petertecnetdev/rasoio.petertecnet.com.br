// src/pages/order/OrderCreatePage.jsx
import React, { useState } from "react";
import { Container, Spinner, Alert } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";

import GlobalNav from "../../components/GlobalNav";
import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import OrderCreateForm from "../../components/order/OrderCreateForm";
import useOrderCreate from "../../hooks/useOrderCreate";
import { appId } from "../../config";

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

    loading,
    submitting,
    apiError,
    createOrder,
  } = useOrderCreate(identifier);

  const [selectedClient, setSelectedClient] = useState(null);

const handleSubmit = async (payload) => {
  if (!establishment) return;

  try {
    const response = await createOrder({
      ...payload,

      app_id: appId,
      entity_name: "establishment",
      entity_id: establishment.id,

      origin: payload.mode === "appointment" ? "online" : "local",
      fulfillment: payload.mode === "appointment" ? "scheduled" : "immediate",
      payment_status: "pending",
      payment_method: "cash",
    });

    if (response?.order?.id) {
      navigate(`/order/${response.order.id}`);
    }
  } catch (e) {
    // erro já vem tratado no hook via apiError
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
  onSubmit={handleSubmit}
  isSubmitting={submitting}
/>

          </>
        )}
      </Container>
    </>
  );
}
