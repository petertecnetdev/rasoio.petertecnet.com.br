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
    setEmail,
    originalEmail,
    submitUpdate,
  } = useUserUpdate(reset);

  const meta = useMemo(() => {
    const parts = [];
    if (originalEmail) parts.push(originalEmail);
    if (userName) parts.push(`@${userName}`);
    return parts;
  }, [originalEmail, userName]);

  return (
    <div className="uup-page">
      <div className="uup-container">
        <GlobalPageHeader
          title="Meus dados"
          variant="default"
          description="Atualize seus dados pessoais, sua foto de perfil e, quando necessário, confirme um novo e-mail por código."
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
              setEmail={setEmail}
              originalEmail={originalEmail}
            />
          )}
        </div>
      </div>
    </div>
  );
}
