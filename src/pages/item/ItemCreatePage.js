// src/pages/item/ItemCreatePage.jsx
import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import GlobalNav from "../../components/GlobalNav";
import ItemCreateForm from "../../components/item/ItemCreateForm";
import useItemCreate from "../../hooks/useItemCreate.js";

export default function ItemCreatePage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm();

  const {
    loading,
    imagePreview,
    handleImageChange,
    handleRemoveImage,
    submitCreate,
  } = useItemCreate(navigate, reset, setValue);

  if (loading) return <GlobalNav />;

  return (
    <div className="item-root">
      <GlobalNav />

      <div className="item-create-page">
        <h2 className="title mb-3">Criar Item</h2>

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
