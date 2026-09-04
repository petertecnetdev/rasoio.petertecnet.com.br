import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import GlobalNav from "../../components/GlobalNav";
import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import ItemCreateForm from "../../components/item/ItemCreateForm";
import useItemCreate from "../../hooks/useItemCreate";

export default function ItemCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const establishmentFromState = location.state?.establishment || null;
  const initialItemType = location.state?.itemType === "product" ? "product" : "service";

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      type: initialItemType,
      status: 1,
      limited_by_user: 0,
    },
  });

  const {
    loading,
    establishment,
    imagePreview,
    handleImageChange,
    handleRemoveImage,
    submitCreate,
  } = useItemCreate(navigate, reset, setValue, establishmentFromState);

  if (loading) return <GlobalNav />;

  const currentEstablishment = establishmentFromState || establishment;
  const isService = watch("type") !== "product";

  return (
    <div className="item-root">
      <GlobalNav />

      {currentEstablishment && (
        <EstablishmentHero
          logo={currentEstablishment.logo}
          background={currentEstablishment.background}
          title={currentEstablishment.fantasy || currentEstablishment.name}
          subtitle={isService ? "Criar novo serviço" : "Criar novo produto"}
          description={
            isService
              ? "Cadastre o serviço e informe obrigatoriamente sua duração. Esse tempo é utilizado no cálculo automático da agenda e dos horários disponíveis."
              : "Cadastre um produto disponível neste estabelecimento. Produtos ficam separados dos serviços e não interferem na duração dos atendimentos."
          }
          city={currentEstablishment.city}
          uf={currentEstablishment.uf}
          showBack
        />
      )}

      <div className="item-create-page container mt-4">
        <ItemCreateForm
          register={register}
          handleSubmit={handleSubmit}
          watch={watch}
          isSubmitting={isSubmitting}
          imagePreview={imagePreview}
          handleImageChange={handleImageChange}
          handleRemoveImage={handleRemoveImage}
          onSubmit={submitCreate}
        />
      </div>
    </div>
  );
}
