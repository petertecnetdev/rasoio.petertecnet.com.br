import React, { useEffect, useMemo, useState } from "react";
import { Alert, Card, Container, Spinner } from "react-bootstrap";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import { getApiErrorMessage, isRequestCanceled } from "../../utils/apiError";

const resolveAvatar = (user) => {
  if (!user) return "/images/logo.png";
  if (user.avatar) return user.avatar;
  if (user.images?.avatar) return user.images.avatar;
  const file = Array.isArray(user.files)
    ? user.files.find((entry) => entry?.type === "avatar")
    : null;
  return file?.public_url || file?.url || "/images/logo.png";
};

export default function UserViewPage() {
  const { userName } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userName) {
      setError("Usuário não identificado.");
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get(`/user/${encodeURIComponent(userName)}`, {
          signal: controller.signal,
        });
        setUser(data?.user ?? data ?? null);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;
        setError(getApiErrorMessage(requestError, "Não foi possível carregar este perfil."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [userName]);

  const fullName = useMemo(() => {
    const name = user?.name;
    if (name) return name;
    return `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Usuário Rasoio";
  }, [user]);

  if (loading) {
    return (
      <Container className="py-5 text-center" aria-live="polite">
        <Spinner animation="border" />
        <span className="visually-hidden">Carregando perfil</span>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="py-4">
        <Alert variant="warning">Perfil não encontrado.</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: 760 }}>
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4 p-md-5">
          <div className="d-flex flex-column flex-sm-row align-items-center align-items-sm-start gap-4">
            <img
              src={resolveAvatar(user)}
              alt={`Foto de ${fullName}`}
              width="112"
              height="112"
              className="rounded-circle object-fit-cover"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/images/logo.png";
              }}
            />
            <div className="text-center text-sm-start flex-grow-1">
              <h1 className="h3 mb-1">{fullName}</h1>
              {user?.user_name && <p className="text-secondary mb-3">@{user.user_name}</p>}
              {user?.about && <p className="mb-3">{user.about}</p>}
              <div className="d-flex flex-wrap justify-content-center justify-content-sm-start gap-2 text-secondary small">
                {user?.city && user?.uf && <span>{user.city} - {user.uf}</span>}
                {user?.occupation && <span>• {user.occupation}</span>}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
