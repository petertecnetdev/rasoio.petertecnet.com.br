// src/components/GlobalProfileHero.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import "./GlobalProfileHero.css";

const DEFAULT_PLACEHOLDER = "/images/logo.png";

export default function GlobalProfileHero({
  title,
  logoSrc,
  bgSrc,
  chips = [],
  stats = [],
  primaryAction,
  secondaryAction,
  imageUrl,
  placeholder = DEFAULT_PLACEHOLDER,

  // ✅ agora o aside NÃO é GlobalCard: é um "mini profile" do establishment/item
  aside,
}) {
  const safeTitle = title || "Perfil";
  const resolvedLogo = useMemo(() => logoSrc || placeholder, [logoSrc, placeholder]);

  const img = (src) => (imageUrl ? imageUrl(src) : src);

  const renderAction = (action, kind = "primary") => {
    if (!action) return null;

    const isLink = !!action.href;
    const disabled = !!action.disabled;

    const className = kind === "primary" ? "gph-primaryBtn" : "gph-secondaryBtn";

    if (isLink) {
      return (
        <a
          className={className}
          href={action.href}
          target={action.target || "_blank"}
          rel={action.rel || "noreferrer"}
          title={action.title}
          aria-disabled={disabled ? "true" : "false"}
          onClick={(e) => {
            if (disabled) e.preventDefault();
            action.onClick?.(e);
          }}
        >
          {action.label}
        </a>
      );
    }

    return (
      <button
        className={className}
        type="button"
        onClick={action.onClick}
        disabled={disabled}
        title={action.title}
      >
        {action.label}
      </button>
    );
  };

  const renderChips = () => {
    const cleaned = (Array.isArray(chips) ? chips : [])
      .filter(Boolean)
      .map((c) => (typeof c === "string" ? { label: c } : c))
      .filter((c) => c?.label);

    if (!cleaned.length) return null;

    return (
      <div className="gph-sub">
        {cleaned.map((c, idx) => (
          <span
            key={`${c.label}-${idx}`}
            className={`gph-chip ${c.variant === "rating" ? "gph-chip--rating" : ""}`}
            title={c.title}
          >
            {c.icon ? <span className="gph-chipIcon">{c.icon}</span> : null}
            {c.label}
          </span>
        ))}
      </div>
    );
  };

  const renderStats = () => {
    const cleaned = (Array.isArray(stats) ? stats : [])
      .filter(Boolean)
      .map((s) => ({
        label: s?.label || "",
        value: s?.value ?? "—",
      }))
      .filter((s) => s.label);

    if (!cleaned.length) return null;

    return (
      <div className="gph-stats">
        {cleaned.map((s, idx) => (
          <div key={`${s.label}-${idx}`} className="gph-statCard">
            <span className="gph-statLabel">{s.label}</span>
            <span className="gph-statValue">{s.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderAside = () => {
    if (!aside) return null;

    // ✅ aceita:
    // 1) ReactNode (custom)
    // 2) objeto no formato { title, subtitle, image, meta, primaryAction, secondaryAction, onClick }
    if (React.isValidElement(aside)) return <aside className="gph-aside">{aside}</aside>;

    const a = typeof aside === "object" ? aside : null;
    if (!a) return null;

    const asideTitle = a?.title || "Estabelecimento";
    const asideSub = a?.subtitle || "";
    const asideMeta = Array.isArray(a?.meta) ? a.meta.filter(Boolean) : [];
    const asideImg = a?.image || null;

    const pAction = a?.primaryAction || null;
    const sAction = a?.secondaryAction || null;

    return (
      <aside className="gph-aside">
        <div
          className={`gph-asideCard ${a?.clickable ? "is-clickable" : ""}`}
          role={a?.clickable ? "button" : undefined}
          tabIndex={a?.clickable ? 0 : undefined}
          onClick={a?.onClick}
          onKeyDown={(e) => {
            if (!a?.clickable) return;
            if (e.key === "Enter" || e.key === " ") a?.onClick?.(e);
          }}
        >
          <div className="gph-asideHeader">
            <div className="gph-asideMedia">
              {asideImg ? (
                <img
                  src={img(asideImg)}
                  alt={asideTitle}
                  className="gph-asideImg"
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.src = placeholder;
                  }}
                />
              ) : (
                <div className="gph-asideImgFallback" />
              )}
            </div>

            <div className="gph-asideText">
              <div className="gph-asideTitle" title={asideTitle}>
                {asideTitle}
              </div>
              {asideSub ? (
                <div className="gph-asideSub" title={asideSub}>
                  {asideSub}
                </div>
              ) : null}

              {asideMeta.length ? (
                <div className="gph-asideMeta">
                  {asideMeta.slice(0, 4).map((m, idx) => (
                    <span key={`${m}-${idx}`} className="gph-asidePill" title={m}>
                      {m}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {(pAction || sAction) && (
            <div className="gph-asideActions" onClick={(e) => e.stopPropagation()}>
              {pAction ? (
                pAction.href ? (
                  <a
                    className="gph-asideBtn gph-asideBtn--primary"
                    href={pAction.href}
                    target={pAction.target || "_blank"}
                    rel={pAction.rel || "noreferrer"}
                    title={pAction.title}
                    aria-disabled={pAction.disabled ? "true" : "false"}
                    onClick={(e) => {
                      if (pAction.disabled) e.preventDefault();
                      pAction.onClick?.(e);
                    }}
                  >
                    {pAction.label}
                  </a>
                ) : (
                  <button
                    className="gph-asideBtn gph-asideBtn--primary"
                    type="button"
                    disabled={!!pAction.disabled}
                    title={pAction.title}
                    onClick={pAction.onClick}
                  >
                    {pAction.label}
                  </button>
                )
              ) : null}

              {sAction ? (
                sAction.href ? (
                  <a
                    className="gph-asideBtn"
                    href={sAction.href}
                    target={sAction.target || "_blank"}
                    rel={sAction.rel || "noreferrer"}
                    title={sAction.title}
                    aria-disabled={sAction.disabled ? "true" : "false"}
                    onClick={(e) => {
                      if (sAction.disabled) e.preventDefault();
                      sAction.onClick?.(e);
                    }}
                  >
                    {sAction.label}
                  </a>
                ) : (
                  <button
                    className="gph-asideBtn"
                    type="button"
                    disabled={!!sAction.disabled}
                    title={sAction.title}
                    onClick={sAction.onClick}
                  >
                    {sAction.label}
                  </button>
                )
              ) : null}
            </div>
          )}
        </div>
      </aside>
    );
  };

  return (
    <section className={`gph-hero ${aside ? "gph-hero--withAside" : ""}`}>
      <div className="gph-heroBg">
        {bgSrc ? (
          <img src={img(bgSrc)} alt="Capa" className="gph-heroBgImg" draggable={false} />
        ) : (
          <div className="gph-heroBgFallback" />
        )}
        <div className="gph-heroOverlay" />
      </div>

      <div className="gph-heroContent">
        <div className="gph-grid">
          <div className="gph-left">
            <div className="gph-heroTop">
              <div className="gph-heroIdentity">
                <div className="gph-heroLogoWrap">
                  <img
                    src={img(resolvedLogo)}
                    alt={safeTitle || "Logo"}
                    className="gph-heroLogo"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.src = placeholder;
                    }}
                  />
                </div>

                <div className="gph-heroText">
                  <h1 className="gph-heroTitle">{safeTitle}</h1>
                  {renderChips()}
                </div>
              </div>

              <div className="gph-heroActions">
                {renderAction(primaryAction, "primary")}
                {renderAction(secondaryAction, "secondary")}
              </div>
            </div>

            {renderStats()}
          </div>

          {renderAside()}
        </div>
      </div>
    </section>
  );
}

GlobalProfileHero.propTypes = {
  title: PropTypes.string,
  logoSrc: PropTypes.string,
  bgSrc: PropTypes.string,
  imageUrl: PropTypes.func,
  placeholder: PropTypes.string,

  chips: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        variant: PropTypes.oneOf(["default", "rating"]),
        title: PropTypes.string,
        icon: PropTypes.node,
      }),
    ])
  ),

  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),

  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    href: PropTypes.string,
    target: PropTypes.string,
    rel: PropTypes.string,
    disabled: PropTypes.bool,
    title: PropTypes.string,
  }),

  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    href: PropTypes.string,
    target: PropTypes.string,
    rel: PropTypes.string,
    disabled: PropTypes.bool,
    title: PropTypes.string,
  }),

  // ✅ agora aceita ReactNode OU objeto do mini profile
  aside: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.shape({
      title: PropTypes.string,
      subtitle: PropTypes.string,
      image: PropTypes.string,
      meta: PropTypes.arrayOf(PropTypes.string),
      clickable: PropTypes.bool,
      onClick: PropTypes.func,
      primaryAction: PropTypes.shape({
        label: PropTypes.string.isRequired,
        onClick: PropTypes.func,
        href: PropTypes.string,
        target: PropTypes.string,
        rel: PropTypes.string,
        disabled: PropTypes.bool,
        title: PropTypes.string,
      }),
      secondaryAction: PropTypes.shape({
        label: PropTypes.string.isRequired,
        onClick: PropTypes.func,
        href: PropTypes.string,
        target: PropTypes.string,
        rel: PropTypes.string,
        disabled: PropTypes.bool,
        title: PropTypes.string,
      }),
    }),
  ]),
};

GlobalProfileHero.defaultProps = {
  aside: null,
};
