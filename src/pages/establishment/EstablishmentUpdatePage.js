import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import EstablishmentUpdateForm from "../../components/establishment/EstablishmentUpdateForm";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import useEstablishmentUpdate from "../../hooks/useEstablishmentUpdate";

import "../../components/establishment/EstablishmentUpdateForm.css";

export default function EstablishmentUpdatePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { isSubmitting, errors },
  } = useForm();

  const {
    loading,
    saving,
    segments,
    logoPreview,
    backgroundPreview,
    handleLogoChange,
    handleBackgroundChange,
    handleSegmentsChange,
    submitUpdate,
  } = useEstablishmentUpdate(id, navigate, reset, setValue);

  if (loading) {
    return (
      <ProcessingIndicatorComponent
        interval={1200}
        messages={["Carregando dados do estabelecimento..."]}
        gifSrc="/images/logo.gif"
      />
    );
  }

  return (
    <div className="eup">
      <div className="eup__bg" aria-hidden="true" />
      <div className="eup__grid" aria-hidden="true" />
      <div className="eup__orb eup__orb--a" aria-hidden="true" />
      <div className="eup__orb eup__orb--b" aria-hidden="true" />

      <main className="eup__container">
        <header className="eup__header">
          <span className="eup__eyebrow">Gestão do estabelecimento</span>
          <h1>Editar estabelecimento</h1>
          <p>Atualize os dados públicos, imagens, localização e informações de contato.</p>
        </header>

        <section className="eup__card">
          <EstablishmentUpdateForm
            register={register}
            handleSubmit={handleSubmit}
            errors={errors}
            isSubmitting={saving || isSubmitting}
            segments={segments}
            logoPreview={logoPreview}
            backgroundPreview={backgroundPreview}
            handleLogoChange={handleLogoChange}
            handleBackgroundChange={handleBackgroundChange}
            handleSegmentsChange={handleSegmentsChange}
            onSubmit={submitUpdate}
            watch={watch}
          />
        </section>
      </main>
    </div>
  );
}
