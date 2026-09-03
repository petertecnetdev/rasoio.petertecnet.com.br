// src/components/employer/EmployerCreateForm.jsx
import React, { useState } from "react";
import { Row, Col, Form, Card, Badge } from "react-bootstrap";
import GlobalButton from "../GlobalButton";
import GlobalCard from "../GlobalCard";

function parseSearchInput(value) {
  const v = value.trim();
  if (!v) return {};

  const onlyNumbers = v.replace(/\D/g, "");

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { email: v };
  if (onlyNumbers.length === 11) return { cpf: onlyNumbers };
  if (onlyNumbers.length >= 10 && onlyNumbers.length <= 13) return { phone: onlyNumbers };
  if (v.startsWith("@")) return { user_name: v.replace("@", "") };

  return { first_name: v };
}

const ROLE_OPTIONS = [
  ["professional", "Profissional / prestador"],
  ["manager", "Gerente"],
  ["receptionist", "Recepção"],
  ["assistant", "Assistente"],
  ["other", "Outra função"],
];

export default function EmployerCreateForm({
  users,
  role,
  loading,
  searching,
  errors,
  onSearch,
  onAssociate,
  onDetach,
  setRole,
}) {
  const [query, setQuery] = useState("");

  return (
    <>
      <Card className="p-4 mb-4">
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(parseSearchInput(query));
          }}
        >
          <Row className="gy-3">
            <Col md={8}>
              <Form.Label>Localizar usuário</Form.Label>
              <Form.Control
                placeholder="Nome, e-mail, CPF, telefone ou @username"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Label>Função no estabelecimento</Form.Label>
              <Form.Select value={role} onChange={(event) => setRole(event.target.value)}>
                {ROLE_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Form.Select>
              {errors?.role?.[0] && <Form.Text className="text-danger">{errors.role[0]}</Form.Text>}
            </Col>
          </Row>

          <div className="mt-3">
            <GlobalButton type="submit" disabled={searching}>
              {searching ? "Buscando..." : "Buscar usuário"}
            </GlobalButton>
          </div>
        </Form>
      </Card>

      {users.length > 0 && (
        <Row className="gy-2">
          {users.map((user) => {
            const linkedEmployer = user?.employer || null;
            const isLinked = Boolean(user?.is_employer && linkedEmployer?.id);

            return (
              <Col xs={12} sm={6} md={4} lg={3} key={user.id}>
                <GlobalCard
                  item={{
                    id: user.id,
                    type: "employer",
                    name: user.first_name,
                    slug: user.user_name,
                    city: user.city,
                    uf: user.uf,
                    image: user.avatar,
                    total_views: user.total_views ?? 0,
                  }}
                  navigate={() => {}}
                  showSchedule={false}
                  actions={
                    <>
                      <div className="mt-2 text-center small text-light-50">
                        <div>{user.email}</div>
                        <div>CPF: {user.cpf || "—"}</div>
                        <div>Tel: {user.phone || "—"}</div>
                      </div>

                      <div className="mt-2 d-flex justify-content-center gap-2 flex-wrap">
                        {isLinked ? (
                          <Badge bg="info">Profissional deste estabelecimento</Badge>
                        ) : (
                          <Badge bg="secondary">Não vinculado</Badge>
                        )}
                      </div>

                      <div className="mt-3 d-flex justify-content-center">
                        {isLinked ? (
                          <GlobalButton
                            size="sm"
                            variant="danger"
                            disabled={loading}
                            onClick={() => onDetach(linkedEmployer.id)}
                          >
                            {loading ? "Removendo..." : "Remover profissional"}
                          </GlobalButton>
                        ) : (
                          <GlobalButton
                            size="sm"
                            variant="success"
                            disabled={loading}
                            onClick={() => onAssociate(user)}
                          >
                            {loading ? "Associando..." : "Associar profissional"}
                          </GlobalButton>
                        )}
                      </div>
                    </>
                  }
                />
              </Col>
            );
          })}
        </Row>
      )}
    </>
  );
}
