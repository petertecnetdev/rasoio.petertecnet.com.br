import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiBaseUrl, appId } from "../config";
import useHome from "../hooks/useHome";
import useSelectedCity from "../hooks/useSelectedCity";
import GlobalPageHeader from "../components/GlobalPageHeader";
import GlobalCarousel from "../components/GlobalCarousel";
import "./homepage.css";

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();

const matches = (item, query) => {
  if (!query) return true;

  const values = [
    item?.name,
    item?.description,
    item?.city,
    item?.uf,
    item?.user?.first_name,
    item?.user?.last_name,
    item?.establishment?.name,
  ];

  return values.some((value) => normalize(value).includes(query));
};

export default function SearchPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const queryText = String(params.get("q") || "").trim();
  const query = normalize(queryText);
  const { cityLabel } = useSelectedCity();

  const { establishments, employers, serviceItems, productItems, isLoading, error } =
    useHome(apiBaseUrl, appId);

  const results = useMemo(
    () => ({
      establishments: establishments.filter((item) => matches(item, query)),
      employers: employers.filter((item) => matches(item, query)),
      services: serviceItems.filter((item) => matches(item, query)),
      products: productItems.filter((item) => matches(item, query)),
    }),
    [establishments, employers, serviceItems, productItems, query]
  );

  const total =
    results.establishments.length +
    results.employers.length +
    results.services.length +
    results.products.length;

  if (isLoading) {
    return (
      <div className="hp-wrapper">
        <GlobalPageHeader title="Busca" description="Buscando opções para você..." compact />
        <div className="hp-loading">Carregando…</div>
      </div>
    );
  }

  return (
    <div className="hp-wrapper">
      <GlobalPageHeader
        title={queryText ? `Busca: ${queryText}` : "Busca"}
        description={
          error
            ? error
            : queryText
              ? `${total} resultado${total === 1 ? "" : "s"}${cityLabel ? ` em ${cityLabel}` : ""}.`
              : "Digite algo na busca para encontrar barbearias, barbeiros, serviços e produtos."
        }
        meta={[cityLabel].filter(Boolean)}
      />

      {!error && queryText && total === 0 && (
        <div className="hp-loading">
          Nenhum resultado encontrado. Tente outro nome, serviço ou localização.
        </div>
      )}

      <div className="hp-sections">
        <GlobalCarousel
          title="Barbearias"
          items={results.establishments}
          fmtBRL={(value) => value}
          navigate={navigate}
          showDots
        />
        <GlobalCarousel
          title="Barbeiros"
          items={results.employers}
          fmtBRL={(value) => value}
          navigate={navigate}
          showDots
        />
        <GlobalCarousel
          title="Serviços"
          items={results.services}
          fmtBRL={(value) => value}
          navigate={navigate}
          showDots
        />
        <GlobalCarousel
          title="Produtos"
          items={results.products}
          fmtBRL={(value) => value}
          navigate={navigate}
          showDots
        />
      </div>
    </div>
  );
}
