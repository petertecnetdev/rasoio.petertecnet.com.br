// src/pages/establishment/EstablishmentItemPage.jsx
import React from "react";
import { Alert, Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import GlobalButton from "../../components/GlobalButton";
import GlobalCard from "../../components/GlobalCard";
import useEstablishmentItemsBySlug from "../../hooks/useEstablishmentItemsBySlug";
import api from "../../services/api";

const fmtBRL = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function EstablishmentItemPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { establishment, items, count, loading, apiError, reload } =
    useEstablishmentItemsBySlug(slug);

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Excluir item?",
      text: `Deseja excluir “${item.name}”?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/item/${item.id}`);
      await reload();
      await Swal.fire({
        icon: "success",
        title: "Item removido",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Erro",
        text:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Não foi possível excluir o item.",
      });
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center" aria-live="polite">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (apiError || !establishment) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          {apiError || "Barbearia não encontrada ou você não possui acesso a ela."}
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <EstablishmentHero
        title={establishment.fantasy || establishment.name}
        subtitle="Serviços e produtos"
        description="Gerencie o catálogo da barbearia. A duração dos serviços é usada para calcular a agenda dos barbeiros."
        city={establishment.city}
        uf={establishment.uf}
        logo={establishment?.images?.logo || establishment.logo}
        background={establishment?.images?.background || establishment.background}
        showBack
      />

      <Container className="mt-4">
        <div className="d-flex justify-content-end mb-4">
          <GlobalButton
            variant="success"
            onClick={() =>
              navigate(`/item/create/${establishment.slug}`, {
                state: { establishment },
              })
            }
          >
            + Novo item
          </GlobalButton>
        </div>

        {count === 0 ? (
          <Alert variant="secondary">
            Nenhum serviço ou produto cadastrado para esta barbearia.
          </Alert>
        ) : (
          <Row className="g-4">
            {items.map((item) => (
              <Col key={item.id} xs={12} md={6} lg={4}>
                <GlobalCard
                  item={{ ...item, establishment }}
                  fmtBRL={fmtBRL}
                  navigate={navigate}
                  actions={
                    <div className="d-flex gap-2 flex-wrap">
                      {item.slug && (
                        <GlobalButton
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/item/view/${item.slug}`)}
                        >
                          Ver
                        </GlobalButton>
                      )}
                      <GlobalButton
                        variant="warning"
                        size="sm"
                        onClick={() => navigate(`/item/update/${item.id}`)}
                      >
                        Editar
                      </GlobalButton>
                      <GlobalButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(item)}
                      >
                        Excluir
                      </GlobalButton>
                    </div>
                  }
                />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  );
}
