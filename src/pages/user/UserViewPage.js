import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaCalendarCheck,
  FaCalendarTimes,
  FaCheckCircle,
  FaClock,
  FaCut,
  FaMapMarkerAlt,
  FaStore,
  FaTimesCircle,
  FaUser,
  FaUserTie,
} from "react-icons/fa";
import api from "../../services/api";
import useImageUtils from "../../hooks/useImageUtils";
import "./User.css";

const metricCards = (metrics, kind) => {
  if (!metrics) return [];
  if (kind === "barber") {
    return [
      ["Solicitados", metrics.requested, <FaClock key="requested" />],
      ["Confirmados", metrics.confirmed, <FaCalendarCheck key="confirmed" />],
      ["Concluídos", metrics.completed, <FaCheckCircle key="completed" />],
      ["Recusados", metrics.rejected, <FaTimesCircle key="rejected" />],
      ["Cancelados", metrics.cancelled, <FaCalendarTimes key="cancelled" />],
    ];
  }
  return [
    ["Solicitados", metrics.requested, <FaClock key="requested" />],
    ["Concluídos", metrics.completed, <FaCheckCircle key="completed" />],
    ["Cancelados", metrics.cancelled, <FaCalendarTimes key="cancelled" />],
    ["Não compareceu", metrics.no_show, <FaTimesCircle key="no-show" />],
  ];
};

export default function UserViewPage() {
  const { userName } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { imageUrl } = useImageUtils("/images/user.png");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    api
      .get(`/rasoio/users/${encodeURIComponent(userName)}`, { signal: controller.signal })
      .then(({ data: response }) => setData(response))
      .catch((err) => {
        if (err?.code === "ERR_CANCELED") return;
        setError(err?.response?.data?.message || err?.response?.data?.error || "Não foi possível carregar este perfil.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [userName]);

  const user = data?.user;
  const fullName = useMemo(
    () => [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.user_name || "Usuário",
    [user]
  );

  if (loading) return <div className="uvp-state">Carregando perfil...</div>;
  if (error || !user) return <div className="uvp-state uvp-state--error">{error || "Perfil indisponível."}</div>;

  const avatar = imageUrl(user?.avatar || user?.files?.find?.((f) => f.type === "avatar")?.path);
  const roles = Array.isArray(data?.roles) ? data.roles : ["Cliente"];
  const clientCards = metricCards(data?.client_metrics, "client");
  const barberCards = metricCards(data?.barber_metrics, "barber");

  return (
    <main className="uvp-page">
      <section className="uvp-hero">
        <div className="uvp-avatarWrap">
          <img src={avatar || "/images/user.png"} alt={fullName} className="uvp-avatar" />
        </div>
        <div className="uvp-identity">
          <div className="uvp-kicker">Perfil Rasoio</div>
          <h1>{fullName}</h1>
          <div className="uvp-username">@{user.user_name}</div>
          {(user.city || user.uf) && (
            <div className="uvp-location"><FaMapMarkerAlt /> {[user.city, user.uf].filter(Boolean).join(" - ")}</div>
          )}
          <div className="uvp-roles">
            {roles.map((role) => (
              <span key={role} className={`uvp-role uvp-role--${role.toLowerCase()}`}>
                {role === "Barbeiro" ? <FaCut /> : role === "Gerente" ? <FaUserTie /> : <FaUser />}
                {role}
              </span>
            ))}
          </div>
        </div>
      </section>

      {user.about && <section className="uvp-about"><h2>Sobre</h2><p>{user.about}</p></section>}

      <section className="uvp-section">
        <div className="uvp-sectionHead"><div><span>Como cliente</span><h2>Histórico de agendamentos</h2></div></div>
        <div className="uvp-metrics">
          {clientCards.map(([label, value, icon]) => (
            <article className="uvp-metric" key={label}><div className="uvp-metricIcon">{icon}</div><strong>{Number(value || 0)}</strong><span>{label}</span></article>
          ))}
        </div>
      </section>

      {data?.barber_metrics && (
        <section className="uvp-section uvp-section--barber">
          <div className="uvp-sectionHead"><div><span>Como profissional</span><h2>Desempenho do barbeiro</h2></div></div>
          <div className="uvp-metrics">
            {barberCards.map(([label, value, icon]) => (
              <article className="uvp-metric uvp-metric--barber" key={label}><div className="uvp-metricIcon">{icon}</div><strong>{Number(value || 0)}</strong><span>{label}</span></article>
            ))}
          </div>
        </section>
      )}

      {Array.isArray(data?.employments) && data.employments.length > 0 && (
        <section className="uvp-section">
          <div className="uvp-sectionHead"><div><span>Equipe</span><h2>Barbearias onde trabalha</h2></div></div>
          <div className="uvp-establishments">
            {data.employments.map((employment) => {
              const est = employment.establishment;
              if (!est) return null;
              return (
                <Link className="uvp-establishment" to={`/establishment/view/${est.slug}`} key={`${employment.id}-${est.id}`}>
                  <FaStore />
                  <div><strong>{est.name}</strong><span>{[est.city, est.uf].filter(Boolean).join(" - ")}</span></div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {Array.isArray(data?.managed_establishments) && data.managed_establishments.length > 0 && (
        <section className="uvp-section uvp-section--manager">
          <div className="uvp-sectionHead"><div><span>Gestão</span><h2>Barbearias administradas</h2></div></div>
          <div className="uvp-establishments">
            {data.managed_establishments.map((est) => (
              <Link className="uvp-establishment uvp-establishment--manager" to={`/establishment/view/${est.slug}`} key={est.id}>
                <FaUserTie />
                <div><strong>{est.name}</strong><span>{[est.city, est.uf].filter(Boolean).join(" - ")}</span></div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
