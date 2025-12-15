// src/pages/establishment/EstablishmentEmployersPage.jsx
import React from "react";
import {
  Container,
  Row,
  Col,
  Spinner,
  Alert,
  Card,
  Badge,
  Button,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import GlobalNav from "../../components/GlobalNav";
import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import GlobalCard from "../../components/GlobalCard";
import useEstablishmentEmployersBySlug from "../../hooks/useEstablishmentEmployersBySlug";
import api from "../../services/api";

export default function EstablishmentEmployersPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const {
    establishment,
    employers,
    count,
    loading,
    apiError,
  } = useEstablishmentEmployersBySlug(slug);

  const handleDetach = async (employer) => {
    const res = await Swal.fire({
      title: "Remover colaborador?",
      text: `Deseja remover ${employer.user?.first_name} do estabelecimento?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      background: "#0b1220",
      color: "#e5e7eb",
    });

    if (!res.isConfirmed) return;

    try {
      await api.post("/employer/detach", {
        employer_id: employer.id,
        establishment_id: establishment.id,
      });

      Swal.fire({
        icon: "success",
        title: "Removido",
        text: "Colaborador removido com sucesso.",
        timer: 1600,
        showConfirmButton: false,
        background: "#0b1220",
        color: "#e5e7eb",
      });

      window.location.reload();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text:
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Erro ao remover colaborador.",
        background: "#0b1220",
        color: "#e5e7eb",
      });
    }
  };

  if (loading) {
    return (
      <>
        <GlobalNav />
        <Container className="py-5 text-center">
          <Spinner animation="border" />
        </Container>
      </>
    );
  }

  if (!establishment) {
    return (
      <>
        <GlobalNav />
        <Container className="py-4">
          <Alert variant="danger">
            Estabelecimento não encontrado.
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <GlobalNav />

      <Container className="py-4">
        <EstablishmentHero
          title={establishment.fantasy || establishment.name}
          subtitle="Gestão de colaboradores"
          city={establishment.city}
          uf={establishment.uf}
          icon="bi-people-fill"
        />

        {apiError && <Alert variant="danger">{apiError}</Alert>}

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div style={{ color: "#e5e7eb" }}>
            Total de colaboradores
          </div>

          <Button
            variant="primary"
            onClick={() =>
              navigate(`/employer/create/${establishment.slug}`)
            }
          >
            <i className="bi bi-plus-lg me-2" />
            Adicionar colaborador
          </Button>
        </div>

        <Card
          style={{
            background: "#0b1220",
            border: "1px solid rgba(148,163,184,.12)",
            borderRadius: 14,
          }}
        >
          <Card.Header
            className="d-flex justify-content-between align-items-center"
            style={{
              background: "transparent",
              color: "#e5e7eb",
            }}
          >
            <span>Equipe</span>
            <Badge bg="secondary">{count}</Badge>
          </Card.Header>

          <Card.Body>
            {employers.length === 0 && (
              <Alert variant="secondary">
                Nenhum colaborador vinculado.
              </Alert>
            )}

            <Row className="g-3">
              {employers.map((emp) => {
                const fullName = `${emp.user?.first_name || ""} ${
                  emp.user?.last_name || ""
                }`.trim();

                return (
                  <Col key={emp.id} xl={3} lg={4} md={6} xs={12}>
                    <GlobalCard
                      item={{
                        type: "employer",
                        id: emp.id,
                        name: fullName || emp.user?.user_name,
                        slug: emp.user?.user_name,
                        city: emp.user?.city,
                        uf: emp.user?.uf,
                        avatar: emp.user?.images?.avatar,
                        images: {
                          avatar: emp.user?.images?.avatar,
                        },
                      }}
                      navigate={(path) => navigate(path)}
                      actions={
                        <Button
                          size="sm"
                          variant="outline-danger"
                          className="w-100"
                          onClick={() => handleDetach(emp)}
                        >
                          Remover vínculo
                        </Button>
                      }
                    />
                  </Col>
                );
              })}
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
}
