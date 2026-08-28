// src/pages/user/UserUpdatePage.jsx
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";

import useUserUpdate from "../../hooks/useUserUpdate";
import GlobalPageHeader from "../../components/GlobalPageHeader";
import UserUpdateForm from "../../components/user/UserUpdateForm";

import "./UserUpdate.css";

export default function UserUpdatePage() {
  const { register, handleSubmit, reset, formState } = useForm();

  const {
    loading,
    saving,
    avatarPreview,
    handleAvatarChange,
    userName,
    setUserName,
    email,
    submitUpdate,
  } = useUserUpdate(reset);

  const meta = useMemo(() => {
    const parts = [];
    if (email) parts.push(email);
    if (userName) parts.push(`@${userName}`);
    return parts;
  }, [email, userName]);

  return (
    <div className="uup-page">
      <div className="uup-container">
        <GlobalPageHeader
          title="Meus dados"
          variant="default"
          description="Atualize seus dados pessoais e sua foto de perfil."
          meta={meta}
          compact
        />

        <div className="uup-card">
          {loading ? (
            <div className="uup-loading">Carregando…</div>
          ) : (
            <UserUpdateForm
              register={register}
              handleSubmit={handleSubmit}
              onSubmit={submitUpdate}
              isSubmitting={saving || formState.isSubmitting}
              avatarPreview={avatarPreview}
              handleAvatarChange={handleAvatarChange}
              userName={userName}
              setUserName={setUserName}
              email={email}
            />
          )}
        </div>
      </div>
    </div>
  );
}
