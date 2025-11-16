import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ItemUpdateForm from "../../components/item/ItemUpdateForm";
import useItemUpdate from "../../hooks/useItemUpdate";
import "./ItemUpdatePage.css";

export default function ItemUpdatePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const {
    loading,
    imagePreview,
    backgroundPreview,
    handleImageChange,
    handleRemoveImage,
    handleBackgroundChange,
    handleImageError,
    submitUpdate,
  } = useItemUpdate(id, navigate, reset, setValue);

  if (loading) return <NavlogComponent />;

  return (
    <div className="item-update-root">
      <NavlogComponent />

      <div className="item-update-page">
        <h2 className="item-title mb-3">Editar Item</h2>

        <ItemUpdateForm
          register={register}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          imagePreview={imagePreview}
          backgroundPreview={backgroundPreview}
          handleImageChange={handleImageChange}
          handleBackgroundChange={handleBackgroundChange}
          handleRemoveImage={handleRemoveImage}
          handleImageError={handleImageError}
          onSubmit={submitUpdate}
        />
      </div>
    </div>
  );
}
