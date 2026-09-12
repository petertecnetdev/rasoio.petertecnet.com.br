// src/components/employer/EmployerCreateForm.jsx
import React, { useMemo, useState } from "react";
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

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export default function EmployerCreateForm({
  users,
  role,
  loading,
  searching,
  errors,
  onSearch,
  onAssociate,
  onInvite,
  onDetach,
  setRole,
}) {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const canInvite = useMemo(
    () => searched && !searching && users.length === 0 && isEmail(query),
    [query, searched, searching, users.length]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSearched(true);
    await onSearch(parseSearchInput(query));
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    if (!canInvite || !inviteName.trim() || loading) return;

    await onInvite({
      firstName: inviteName.trim(),
      email: query.trim().toLowerCase(),
    });
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
                    setInviteName("");
                  }}
                  autoComplete="off"
                />
                <Form.Text className="text-muted">
                  Pesquise uma conta Peter Tecnet. Se o profissional ainda não tiver cadastro, pesquise pelo e-mail para convidá-lo sem interromper a configuração da agenda.
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

      {searched && !searching && users.length === 0 && !canInvite && (
        <Alert variant="info" className="mb-4">
          <Alert.Heading>Nenhum usuário encontrado</Alert.Heading>
          <p className="mb-0">
            Confira o nome, CPF, telefone ou @usuário. Para adicionar alguém que ainda não possui conta Peter Tecnet, pesquise pelo e-mail profissional.
          </p>
        </Alert>
      )}

      {canInvite && (
        <Alert variant="info" className="mb-4">
          <Alert.Heading>Este profissional ainda não tem conta?</Alert.Heading>
          <p>
            Convide <strong>{query.trim().toLowerCase()}</strong>. A Rasoio prepara o vínculo com este estabelecimento, envia o código de acesso por e-mail e você já pode configurar os horários para começar a receber agendamentos.
          </p>
          <Form onSubmit={handleInvite}>
            <Row className="gy-2 align-items-end">
              <Col md={8}>
                <Form.Group controlId="collaborator-invite-name">
                  <Form.Label>Nome do profissional</Form.Label>
                  <Form.Control
                    value={inviteName}
                    onChange={(event) => setInviteName(event.target.value)}
                    placeholder="Ex.: Maria Silva"
                    maxLength={100}
                    isInvalid={Boolean(errors?.first_name)}
                    autoComplete="name"
                  />
                  <Form.Control.Feedback type="invalid">
                    {Array.isArray(errors?.first_name)
                      ? errors.first_name[0]
                      : errors?.first_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <GlobalButton
                  type="submit"
                  variant="success"
                  className="w-100"
                  disabled={loading || !inviteName.trim() || !role.trim()}
                >
                  {loading ? "Enviando convite..." : "Convidar e continuar"}
                </GlobalButton>
              </Col>
            </Row>
          </Form>
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
