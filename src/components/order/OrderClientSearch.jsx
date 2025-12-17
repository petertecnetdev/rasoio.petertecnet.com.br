// src/components/order/OrderClientSearch.jsx
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Form, ListGroup, Spinner } from "react-bootstrap";

import OrderSelectedClientCard from "./OrderSelectedClientCard";

export default function OrderClientSearch({
  searchClients,
  clients = [],
  searching,
  selectedClient,
  onSelect,
  onClear,
}) {
  const [query, setQuery] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query || query.length < 2 || selectedClient) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      searchClients(query);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedClient, searchClients]);

  const handleSelect = (client) => {
    onSelect(client);
    setQuery(
      `${client.first_name || ""} ${client.last_name || ""}`.trim()
    );
  };

  const clear = () => {
    setQuery("");
    onClear();
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>Cliente</Form.Label>

      {!selectedClient && (
        <>
          <Form.Control
            type="text"
            placeholder="Buscar por nome, email, CPF ou telefone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {searching && (
            <div className="mt-2">
              <Spinner size="sm" animation="border" />
            </div>
          )}

          {!searching && clients.length > 0 && (
            <ListGroup className="mt-2">
              {clients.map((client) => (
                <ListGroup.Item
                  key={client.id}
                  action
                  onClick={() => handleSelect(client)}
                  style={{ cursor: "pointer" }}
                >
                  <strong>
                    {client.first_name} {client.last_name}
                  </strong>
                  <div className="text-muted small">
                    {client.email || client.phone || client.cpf}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </>
      )}

      {selectedClient && (
        <OrderSelectedClientCard
          client={selectedClient}
          onClear={clear}
        />
      )}
    </Form.Group>
  );
}

OrderClientSearch.propTypes = {
  searchClients: PropTypes.func.isRequired,
  clients: PropTypes.array,
  searching: PropTypes.bool,
  selectedClient: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};
