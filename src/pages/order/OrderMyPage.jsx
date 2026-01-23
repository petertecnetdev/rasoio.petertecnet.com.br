import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSyncAlt,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaStore,
  FaUser,
  FaHashtag,
  FaMoneyBillWave,
  FaInfoCircle,
  FaChevronRight,
} from "react-icons/fa";

import useOrdersMy from "../../hooks/useOrderMy";
import useImageUtils from "../../hooks/useImageUtils";
import GlobalProfileHero from "../../components/GlobalProfileHero";

import "./OrderMyPage.css";

const PLACEHOLDER = "/images/logo.png";

function safeText(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function toDate(iso) {
  const d = new Date(iso || "");
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateBR(iso) {
  const d = toDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatDateFullBR(iso) {
  const d = new Date((iso || "") + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimeBR(iso) {
  const d = toDate(iso);
  if (!d) return "—";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatBRL(v) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dayKey(iso) {
  const d = toDate(iso);
  if (!d) return "sem-data";
  return d.toISOString().slice(0, 10);
}

function titleForDayKey(key) {
  if (!key || key === "sem-data") return "Sem data";

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);

  if (key === todayKey) return "Hoje";
  if (key === tomorrowKey) return "Amanhã";

  const d = new Date(key + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "Data";
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function normalizeStatus(s) {
  const raw = safeText(s).trim().toLowerCase();
  if (!raw) return { label: "Indefinido", tone: "neutral" };

  if (raw.includes("confirm")) return { label: "Confirmado", tone: "success" };
  if (raw.includes("pend") || raw.includes("aguard"))
    return { label: "Pendente", tone: "warning" };
  if (raw.includes("cancel")) return { label: "Cancelado", tone: "danger" };
  if (raw.includes("final") || raw.includes("concl") || raw.includes("attended"))
    return { label: "Finalizado", tone: "info" };

  return { label: safeText(s), tone: "neutral" };
}

export default function OrderMyPage() {
  const navigate = useNavigate();
  const { orders, loading, error, refresh } = useOrdersMy();
  const { imageUrl } = useImageUtils();

  const grouped = useMemo(() => {
    const safe = Array.isArray(orders) ? orders : [];

    const sorted = safe
      .slice()
      .sort(
        (a, b) =>
          (toDate(b?.order_datetime)?.getTime() || 0) -
          (toDate(a?.order_datetime)?.getTime() || 0)
      );

    const map = new Map();

    for (const o of sorted) {
      const k = dayKey(o?.order_datetime);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(o);
    }

    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([k, items]) => ({
        key: k,
        title: titleForDayKey(k),
        dateText: k !== "sem-data" ? formatDateFullBR(k) : "",
        items,
      }));
  }, [orders]);

  const stats = useMemo(() => {
    const safe = Array.isArray(orders) ? orders : [];
    const total = safe.length;

    let confirmed = 0;
    let pending = 0;
    let canceled = 0;

    safe.forEach((o) => {
      const st = normalizeStatus(o?.appointment_status || o?.status);
      if (st.tone === "success") confirmed++;
      else if (st.tone === "warning") pending++;
      else if (st.tone === "danger") canceled++;
    });

    return { total, confirmed, pending, canceled };
  }, [orders]);

  const heroBg = useMemo(() => {
    const safe = Array.isArray(orders) ? orders : [];
    const bg = safe.find((o) => o?.establishment?.files?.background)?.establishment
      ?.files?.background;
    return bg?.path || bg?.url || null;
  }, [orders]);

  const heroLogo = useMemo(() => {
    const safe = Array.isArray(orders) ? orders : [];
    const logo = safe.find((o) => o?.establishment?.files?.logo)?.establishment?.files
      ?.logo;
    return logo?.path || logo?.url || null;
  }, [orders]);

  const chips = useMemo(() => {
    const c = [];
    c.push({ label: `${stats.total} agendamentos`, title: "Total" });
    if (stats.confirmed) c.push({ label: `${stats.confirmed} confirmados`, variant: "rating" });
    if (stats.pending) c.push({ label: `${stats.pending} pendentes` });
    if (stats.canceled) c.push({ label: `${stats.canceled} cancelados` });
    return c;
  }, [stats]);

  const openEstablishment = useCallback(
    (o) => {
      const slug = o?.establishment?.slug;
      if (!slug) return;
      navigate(`/establishment/view/${slug}`);
    },
    [navigate]
  );

  const openEmployer = useCallback(
    (o) => {
      const userName = o?.employer?.user?.user_name;
      if (!userName) return;
      navigate(`/employer/view/${userName}`);
    },
    [navigate]
  );

  const renderCard = useCallback(
    (o) => {
      const st = normalizeStatus(o?.appointment_status || o?.status);

      const estName = o?.establishment?.name || "Estabelecimento";
      const estCity = o?.establishment?.city || "";
      const estUF = o?.establishment?.uf || "";

      const logo = o?.establishment?.files?.logo;
      const bg = o?.establishment?.files?.background;

      const logoSrc = logo?.path || logo?.url || null;
      const bgSrc = bg?.path || bg?.url || null;

      const emp = o?.employer?.user;
      const empName =
        `${safeText(emp?.first_name)} ${safeText(emp?.last_name)}`.trim() || "Profissional";

      const avatar = emp?.files?.avatar;
      const avatarSrc = avatar?.path || avatar?.url || null;

      return (
        <article className="omp-card" key={o?.id}>
          <div className="omp-cardBg">
            {bgSrc ? (
              <img
                className="omp-cardBgImg"
                src={imageUrl(bgSrc)}
                alt="bg"
                draggable={false}
              />
            ) : (
              <div className="omp-cardBgFallback" />
            )}
            <div className="omp-cardBgOverlay" />
          </div>

          <div className="omp-cardBody">
            <div className="omp-cardTop">
              <div className="omp-cardTopLeft">
                <div className="omp-logoWrap">
                  {logoSrc ? (
                    <img
                      className="omp-logo"
                      src={imageUrl(logoSrc)}
                      alt={estName}
                      draggable={false}
                      onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                    />
                  ) : (
                    <div className="omp-logoFallback" />
                  )}
                </div>

                <div className="omp-titleBlock">
                  <div className="omp-estName" title={estName}>
                    <FaStore /> {estName}
                  </div>

                  {(estCity || estUF) && (
                    <div className="omp-sub" title={`${estCity} - ${estUF}`}>
                      <FaMapMarkerAlt /> {estCity}
                      {estCity && estUF ? " - " : ""}
                      {estUF}
                    </div>
                  )}
                </div>
              </div>

              <div className={`omp-status omp-status--${st.tone}`}>{st.label}</div>
            </div>

            <div className="omp-datetime">
              <div className="omp-date">
                <FaCalendarAlt /> {formatDateBR(o?.order_datetime)}
              </div>
              <div className="omp-time">
                <FaClock /> {formatTimeBR(o?.order_datetime)}
              </div>
            </div>

            <div className="omp-grid">
              <div className="omp-item">
                <span className="omp-label">
                  <FaHashtag /> Pedido
                </span>
                <b className="omp-value">#{o?.order_number || o?.id}</b>
              </div>

              <div className="omp-item">
                <span className="omp-label">
                  <FaMoneyBillWave /> Total
                </span>
                <b className="omp-value">{formatBRL(o?.total_price)}</b>
              </div>

              <div className="omp-item omp-item--wide">
                <span className="omp-label">
                  <FaUser /> Profissional
                </span>

                <div className="omp-emp">
                  <div className="omp-avatarWrap">
                    {avatarSrc ? (
                      <img
                        className="omp-avatar"
                        src={imageUrl(avatarSrc)}
                        alt={empName}
                        draggable={false}
                        onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                      />
                    ) : (
                      <div className="omp-avatarFallback" />
                    )}
                  </div>

                  <div className="omp-empText">
                    <div className="omp-empName">{empName}</div>
                    {!!emp?.user_name && <div className="omp-empUser">@{emp.user_name}</div>}
                  </div>
                </div>
              </div>
            </div>

            {!!o?.notes && (
              <div className="omp-notes">
                <div className="omp-notesTitle">
                  <FaInfoCircle /> Observação
                </div>
                <div className="omp-notesText">{safeText(o.notes)}</div>
              </div>
            )}

            <div className="omp-actions">
              <button
                className="omp-btn"
                type="button"
                onClick={() => openEstablishment(o)}
                disabled={!o?.establishment?.slug}
              >
                Ver Estabelecimento <FaChevronRight />
              </button>

              <button
                className="omp-btn omp-btn--ghost"
                type="button"
                onClick={() => openEmployer(o)}
                disabled={!o?.employer?.user?.user_name}
              >
                Ver Profissional <FaChevronRight />
              </button>
            </div>
          </div>
        </article>
      );
    },
    [imageUrl, openEmployer, openEstablishment]
  );

  return (
    <div className="omp">
      <GlobalProfileHero
        title="Minha Agenda"
        logoSrc={heroLogo || PLACEHOLDER}
        chips={chips}
        stats={[
          { label: "Total", value: stats.total },
          { label: "Confirmados", value: stats.confirmed },
          { label: "Pendentes", value: stats.pending },
          { label: "Cancelados", value: stats.canceled },
        ]}
        primaryAction={{
          label: loading ? "Atualizando..." : "Atualizar",
          onClick: refresh,
          disabled: loading,
          title: "Atualizar agendamentos",
        }}
        secondaryAction={{
          label: "Voltar",
          onClick: () => navigate(-1),
          title: "Voltar",
        }}
        imageUrl={imageUrl}
        aside={{
          title: "Organize sua agenda",
          subtitle: "Aqui você acompanha todos seus horários marcados",
          image: heroLogo || null,
          meta: ["Agendamentos", "Status", "Profissionais"],
          clickable: false,
        }}
      />

      <div className="omp-wrap">
        <div className="omp-toolbar">
          <button className="omp-toolBtn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Voltar
          </button>

          <button className="omp-toolBtn omp-toolBtn--primary" onClick={refresh} disabled={loading}>
            <FaSyncAlt /> {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {loading && (
          <div className="omp-loading">
            <div className="omp-loadingTitle">Carregando sua agenda...</div>
            <div className="omp-loadingSub">Aguarde um instante 😉</div>
          </div>
        )}

        {!!error && !loading && (
          <div className="omp-error">
            <b>Ops! Não conseguimos carregar sua agenda.</b>
            <div className="omp-errorText">{error}</div>
          </div>
        )}

        {!loading && !error && (!orders || orders.length === 0) && (
          <div className="omp-empty">
            <div className="omp-emptyTitle">Nenhum agendamento encontrado</div>
            <div className="omp-emptySub">
              Quando você marcar um atendimento, ele vai aparecer aqui com todos os detalhes.
            </div>
          </div>
        )}

        {!loading && !error && orders?.length > 0 && (
          <div className="omp-timeline">
            {grouped.map((g) => (
              <section className="omp-day" key={g.key}>
                <div className="omp-dayHeader">
                  <div className="omp-dayTitle">{g.title}</div>
                  <div className="omp-daySub">{g.dateText}</div>
                </div>

                <div className="omp-gridWrap">{g.items.map(renderCard)}</div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
