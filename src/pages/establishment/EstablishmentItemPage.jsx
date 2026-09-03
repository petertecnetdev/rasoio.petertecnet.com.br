// src/pages/establishment/EstablishmentItemPage.jsx
import React from "react";
import { Alert, Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";

import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import GlobalButton from "../../components/GlobalButton";
import GlobalCard from "../../components/GlobalCard";
import useEstablishmentItemsBySlug from "../../hooks/useEstablishmentItemsBySlug";
import { deleteManagedItem } from "../../services/platformManagementApi";
import { getApiErrorMessage } from "../../utils/apiError";

const fmtBRL = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function EstablishmentItemPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const itemType = searchParams.get("type") === "product" ? "product" : "service";

  const {
    establishment,
    items,
    count,
    serviceCount,
    productCount,
    loading,
    apiError,
    reload,
  } = useEstablishmentItemsBySlug(slug, itemType);

  const isService = itemType === "service";
  const singular = isService ? "serviço" : "produto";

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: `Excluir ${singular}?`,
      text: `Deseja excluir “${item.name}”?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteManagedItem(item.id);
      await reload();
      await Swal.fire({
        icon: "success",
        title: `${isService ? "Serviço" : "Produto"} removido`,
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Erro",
        text: getApiErrorMessage(
          error,
          `Não foi possível excluir o ${singular}.`
        ),
      });
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center" aria-live="polite">
        <Spinner animation="border" />
        <p className="mt-3 mb-0">Carregando catálogo do estabelecimento...</p>
      </Container>
    );
  }

  if (apiError || !establishment) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Não foi possível abrir o catálogo</Alert.Heading>
          <p>{apiError || "Estabelecimento não encontrado ou você não possui acesso a ele."}</p>
          <div className="d-flex gap-2 flex-wrap">
            <GlobalButton variant="primary" onClick={() => reload()}>
              Tentar novamente
            </GlobalButton>
            <GlobalButton variant="outline" onClick={() => navigate("/establishment/my")}>
              Voltar aos estabelecimentos
            </GlobalButton>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <EstablishmentHero
        title={establishment.fantasy || establishment.name}
        subtitle={isService ? "Serviços" : "Produtos"}
        description={
          isService
            ? "Gerencie os serviços oferecidos pelo estabelecimento. Todo serviço possui duração, usada para calcular corretamente os horários disponíveis na agenda."
            : "Gerencie os produtos vendidos pelo estabelecimento separadamente dos serviços de atendimento."
        }
        city={establishment.city}
        uf={establishment.uf}
        logo={establishment?.images?.logo || establishment.logo}
        background={establishment?.images?.background || establishment.background}
        showBack
      />

      <Container className="mt-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
          <div className="d-flex flex-wrap gap-2">
            <GlobalButton
              variant={isService ? "primary" : "outline"}
              onClick={() => navigate(`/establishment/item/${establishment.slug}`)}
            >
              Serviços ({serviceCount})
            </GlobalButton>
            <GlobalButton
              variant={!isService ? "primary" : "outline"}
              onClick={() => navigate(`/establishment/item/${establishment.slug}?type=product`)}
            >
              Produtos ({productCount})
            </GlobalButton>
          </div>

          <GlobalButton
            variant="success"
            onClick={() =>
              navigate(`/item/create/${establishment.slug}`, {
                state: { establishment, itemType },
              })
            }
          >
            + Novo {singular}
          </GlobalButton>
        </div>

        {count === 0 ? (
          <Alert variant="secondary">
            Nenhum {singular} cadastrado para este estabelecimento.
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
