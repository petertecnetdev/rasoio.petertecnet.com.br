// src/pages/item/ItemUpdatePage.jsx
import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ItemUpdateForm from "../../components/item/ItemUpdateForm";
import useItemUpdate from "../../hooks/useItemUpdate";

export default function ItemUpdatePage() {
  const { id } = useParams();
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
    item,
    imagePreview,
    handleImageChange,
    handleRemoveImage,
    submitUpdate,
  } = useItemUpdate(id, navigate, reset, setValue);

  if (loading) return <NavlogComponent />;

  return (
    <div className="item-root">
      <NavlogComponent />

      <div className="item-update-page">
        <h2 className="title mb-3">Editar Item</h2>

        <ItemUpdateForm
          register={register}
          handleSubmit={handleSubmit}
          watch={watch}
          isSubmitting={isSubmitting}
          item={item}
          imagePreview={imagePreview}
          handleImageChange={handleImageChange}
          handleRemoveImage={handleRemoveImage}
          onSubmit={submitUpdate}
        />
      </div>
    </div>
  );
}
