// src/pages/user/UserUpdatePage.jsx
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";

import useUserUpdate from "../../hooks/useUserUpdate";

import GlobalNav from "../../components/GlobalNav";
import GlobalPageHeader from "../../components/GlobalPageHeader";
import UserUpdateForm from "../../components/user/UserUpdateForm";

import "./UserUpdate.css";

export default function UserUpdatePage({ loadingMenu = false, handleLogout = () => {} }) {
  const { register, handleSubmit, reset, formState } = useForm();

  const {
    loading,
    avatarPreview,
    handleAvatarChange,
    userName,
    setUserName,
    isBarber,
    setIsBarber,
    email,
    submitUpdate,
  } = useUserUpdate(reset);

  const meta = useMemo(() => {
    const parts = [];
    if (email) parts.push(email);
    if (userName) parts.push(`@${userName}`);
    if (isBarber) parts.push("Perfil: Barbeiro");
    return parts;
  }, [email, userName, isBarber]);

  return (
    <div className="uup-page">
      <GlobalNav loadingMenu={loadingMenu} handleLogout={handleLogout} />

      <div className="uup-container">
        <GlobalPageHeader
          title="Meu perfil"
          variant="default"
          description="Atualize seus dados e sua foto de perfil."
          meta={meta}
          compact
        />

        <div className="uup-card">
          {loading ? (
            <div className="uup-loading">Carregando…</div>
          ) : (
            <UserUpdateForm
              register={register}
              errors={formState?.errors}
              handleSubmit={handleSubmit} // ✅ FIX: passa handleSubmit pro form
              submitUpdate={submitUpdate} // ✅ FIX: form chama handleSubmit(submitUpdate)
              avatarPreview={avatarPreview}
              handleAvatarChange={handleAvatarChange}
              userName={userName}
              setUserName={setUserName}
              isBarber={isBarber}
              setIsBarber={setIsBarber}
              email={email}
            />
          )}
        </div>
      </div>
    </div>
  );
}
