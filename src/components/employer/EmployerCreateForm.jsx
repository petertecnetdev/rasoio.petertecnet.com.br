// src/components/employer/EmployerCreateForm.jsx
import React, { useState } from "react";
import { Alert, Badge, Card, Col, Form, Row } from "react-bootstrap";
import GlobalButton from "../GlobalButton";
import GlobalCard from "../GlobalCard";

function parseSearchInput(value) {
  const v = value.trim();
  if (!v) return {};

  const onlyNumbers = v.replace(/\D/g, "");

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return { email: v };
  }

  if (onlyNumbers.length === 11) {
    return { cpf: onlyNumbers };
  }

  if (onlyNumbers.length >= 10 && onlyNumbers.length <= 13) {
    return { phone: onlyNumbers };
  }

  if (v.startsWith("@")) {
    return { user_name: v.replace("@", "") };
  }

  return { first_name: v };
}

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
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSearched(true);
    await onSearch(parseSearchInput(query));
  };

  return (
    <>
      <Card className="p-4 mb-4">
        <Form onSubmit={handleSubmit}>
          <Row className="gy-3">
            <Col md={8}>
              <Form.Group controlId="collaborator-search">
                <Form.Label>Quem você quer adicionar à equipe?</Form.Label>
                <Form.Control
                  placeholder="Nome, e-mail, CPF, telefone ou @usuário"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSearched(false);
                  }}
                  autoComplete="off"
                />
                <Form.Text className="text-muted">
                  Pesquise uma conta Peter Tecnet e vincule-a somente a este estabelecimento.
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="collaborator-role">
                <Form.Label>Função no estabelecimento</Form.Label>
                <Form.Control
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  placeholder="Ex.: profissional, atendente, especialista"
                  maxLength={255}
                  isInvalid={Boolean(errors?.role)}
                />
                <Form.Control.Feedback type="invalid">
                  {Array.isArray(errors?.role) ? errors.role[0] : errors?.role}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <div className="mt-3 d-flex gap-2 flex-wrap align-items-center">
            <GlobalButton type="submit" disabled={searching || query.trim().length < 2}>
              {searching ? "Buscando..." : "Buscar pessoa"}
            </GlobalButton>
            <span className="small text-muted">
              Depois da busca, use “Adicionar à equipe” no perfil desejado.
            </span>
          </div>
        </Form>
      </Card>

      {searched && !searching && users.length === 0 && (
        <Alert variant="info" className="mb-4">
          <Alert.Heading>Nenhum usuário encontrado</Alert.Heading>
          <p className="mb-0">
            Confira o nome, e-mail, CPF, telefone ou @usuário. O colaborador precisa possuir uma conta Peter Tecnet para ser vinculado ao estabelecimento.
          </p>
        </Alert>
      )}

      {users.length > 0 && (
        <Row className="gy-3">
          {users.map((user) => {
            const linkedEmployer = user?.employer || user?.team_member || null;
            const isLinked = Boolean(
              (user?.is_employer || user?.is_team_member) && linkedEmployer?.id
            );
            const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

            return (
              <Col xs={12} sm={6} md={4} lg={3} key={user.id}>
                <GlobalCard
                  item={{
                    id: user.id,
                    type: "employer",
                    name: fullName || user.email || "Usuário",
                    user_name: user.user_name,
                    city: user.city,
                    uf: user.uf,
                    image: user.avatar,
                    total_views: user.total_views ?? 0,
                  }}
                  showSchedule={false}
                  actions={
                    <>
                      <div className="mt-2 text-center small text-light-50">
                        <div>{user.email || "E-mail não informado"}</div>
                        <div>{user.phone || "Telefone não informado"}</div>
                      </div>

                      <div className="mt-2 d-flex justify-content-center gap-2 flex-wrap">
                        {isLinked ? (
                          <Badge bg="info">Já faz parte desta equipe</Badge>
                        ) : (
                          <Badge bg="secondary">Disponível para vínculo</Badge>
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
                            {loading ? "Removendo..." : "Remover da equipe"}
                          </GlobalButton>
                        ) : (
                          <GlobalButton
                            size="sm"
                            variant="success"
                            disabled={loading || !role.trim()}
                            onClick={() => onAssociate(user)}
                          >
                            {loading ? "Adicionando..." : "Adicionar à equipe"}
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
