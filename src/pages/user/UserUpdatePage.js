import React from "react";
import { useForm } from "react-hook-form";
import NavlogComponent from "../../components/NavlogComponent";
import useUserUpdate from "../../hooks/useUserUpdate";
import UserUpdateForm from "../../components/user/UserUpdateForm";

export default function UserUpdatePage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const {
    loading,
    avatarPreview,
    handleAvatarChange,
    userName,
    setUserName,
    email,
    submitUpdate,
  } = useUserUpdate(reset);

  if (loading) return <NavlogComponent />;

  return (
    <div className="user-root">
      <NavlogComponent />

      <div className="user-update-page">
        <h2 className="title mb-3">Editar Perfil</h2>

        <UserUpdateForm
          register={register}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          avatarPreview={avatarPreview}
          handleAvatarChange={handleAvatarChange}
          userName={userName}
          setUserName={setUserName}
          email={email}
          onSubmit={submitUpdate}
        />
      </div>
    </div>
  );
}
