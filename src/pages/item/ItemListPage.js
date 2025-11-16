// src/pages/item/ItemListPage.js
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Container } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

import NavlogComponent from "../../components/NavlogComponent";
import GlobalHeroList from "../../components/GlobalHeroList";
import GlobalSectionList from "../../components/GlobalSectionList";

import {
  ItemListHeader,
  ItemDeleteModal,
  ItemListSkeleton,
} from "../../components/item";

import useItemsFilter from "../../hooks/useItemsFilter";
import useImageUtils from "../../hooks/useImageUtils";

import { apiBaseUrl } from "../../config";
import "./ItemListPage.css";

export default function ItemListPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const ph = "/images/logo.png";
  const { imageUrl, handleImgError } = useImageUtils(ph);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let active = true;

    (async () => {
      try {
        const { data: userData } = await axios.get(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!active) return;
        setUser(userData.user);

        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/view/${slug}`,

          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!active) return;

        const estObj = data.establishment ?? null;
        const estItems = data.items ?? [];

        if (!estObj) {
          navigate("/404");
          return;
        }

        if (userData.user.id !== estObj.user_id) {
          Swal.fire({
            icon: "warning",
            title: "Acesso negado",
            text: "Você não tem permissão para acessar os itens deste estabelecimento.",
          }).then(() => navigate("/dashboard"));
          return;
        }

        setEstablishment(estObj);
        setItems(estItems);
      } catch (e) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível carregar os itens.",
        }).then(() => navigate("/dashboard"));
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => (active = false);
  }, [slug, token, navigate]);

  const { services, products } = useItemsFilter(items);

  const fmtPrice = useCallback(
    (v) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`,
    []
  );

  const askDelete = (item) => setDeleteTarget(item);
  const closeDelete = () => setDeleteTarget(null);

  const confirmDelete = async () => {
    try {
      await axios.delete(`${apiBaseUrl}/item/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));

      Swal.fire({
        icon: "success",
        title: "Excluído",
        text: `O item "${deleteTarget.name}" foi removido.`,
      });

      closeDelete();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível excluir.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="iteml-root">
        <NavlogComponent />
        <Container fluid className="mt-5">
          <ItemListSkeleton />
        </Container>
      </div>
    );
  }

  if (!establishment) return null;

  return (
    <>
      <NavlogComponent />

      {/* ======= HERO SIMPLES, ELEGANTE E LIMPO ======= */}
     <GlobalHeroList
  title={`Itens de ${establishment.name}`}
  subtitle={establishment.description}
  logo={establishment.logo}
  background={establishment.background}
  servicesCount={services.length}
  productsCount={products.length}
  imageUrl={imageUrl}
  handleImgError={handleImgError}
/>


      {/* ======= CONTAINER PRINCIPAL ======= */}
      <Container fluid className="mt-4 iteml-container">

        <ItemListHeader
          servicesCount={services.length}
          productsCount={products.length}
        />

        <GlobalSectionList
          title="Serviços"
          items={services}
          fmtBRL={fmtPrice}
          navigate={navigate}
          onEdit={(it) => navigate(`/item/update/${it.id}`)}
          onDelete={askDelete}
          openSchedulePopup={() => {}}
        />

        <GlobalSectionList
          title="Produtos"
          items={products}
          fmtBRL={fmtPrice}
          navigate={navigate}
          onEdit={(it) => navigate(`/item/update/${it.id}`)}
          onDelete={askDelete}
          openSchedulePopup={() => {}}
        />
      </Container>

      <ItemDeleteModal
        show={Boolean(deleteTarget)}
        item={deleteTarget}
        onHide={closeDelete}
        onConfirm={confirmDelete}
      />
    </>
  );
}
