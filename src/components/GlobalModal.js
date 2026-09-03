// src/components/GlobalModal.jsx
import React, { useEffect, useMemo, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import "./GlobalModal.css";

export default function GlobalModal({
  show,
  onHide,
  title,
  subtitle,
  children,
  footer,
  size = "lg", // sm | md | lg | xl
  centered = true,
  backdrop = "static", // "static" | true | false
  closeOnEsc = true,
  closeButton = true,
  logoSrc = null,
  logoAlt = "",
  className,
}) {
  const dialogRef = useRef(null);

  const canCloseOnBackdrop = backdrop === true;
  const showBackdrop = backdrop !== false;

  const maxWidth = useMemo(() => {
    const map = { sm: 420, md: 560, lg: 860, xl: 1080 };
    return map[size] || map.lg;
  }, [size]);

  const overlayScopedClasses = useMemo(() => {
    if (!className) return "";
    return String(className)
      .split(/\s+/)
      .filter(Boolean)
      .map((name) => `${name}-overlay`)
      .join(" ");
  }, [className]);

  const lockBodyScroll = useCallback((lock) => {
    const body = document.body;
    if (!body) return;
    if (lock) {
      body.dataset.gmodalScrollY = String(window.scrollY || 0);
      body.style.overflow = "hidden";
      body.style.touchAction = "none";
    } else {
      body.style.overflow = "";
      body.style.touchAction = "";
      delete body.dataset.gmodalScrollY;
    }
  }, []);

  const focusDialog = useCallback(() => {
    requestAnimationFrame(() => {
      if (dialogRef.current) dialogRef.current.focus();
    });
  }, []);

  useEffect(() => {
    if (!show) return;

    lockBodyScroll(true);
    focusDialog();

    const onKeyDown = (e) => {
      if (!show) return;

      if (e.key === "Escape" && closeOnEsc) {
        e.preventDefault();
        onHide?.();
        return;
      }

      if (e.key === "Tab") {
        const root = dialogRef.current;
        if (!root) return;

        const focusables = root.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      lockBodyScroll(false);
    };
  }, [show, closeOnEsc, onHide, lockBodyScroll, focusDialog]);

  if (!show) return null;

  const handleBackdropMouseDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (canCloseOnBackdrop) onHide?.();
  };

  const hasLogo = !!logoSrc;

  const content = (
    <div
      className={`gmodal-overlay ${showBackdrop ? "gmodal-backdrop" : "gmodal-nobackdrop"} ${overlayScopedClasses}`}
      onMouseDown={handleBackdropMouseDown}
      aria-hidden={false}
    >
      <div
        className={`gmodal ${centered ? "gmodal-centered" : ""} ${className || ""}`}
        style={{ "--gmodal-maxw": `${maxWidth}px` }}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Modal"}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="gmodal-shell">
          <header className="gmodal-header">
            <div className={`gmodal-brand ${hasLogo ? "" : "gmodal-brand--no-logo"}`}>
              {hasLogo && (
                <div className="gmodal-logo-wrap" aria-hidden="true">
                  <img className="gmodal-logo" src={logoSrc} alt={logoAlt || ""} />
                </div>
              )}

              <div className="gmodal-titles">
                {!!title && <div className="gmodal-title">{title}</div>}
                {!!subtitle && <div className="gmodal-subtitle">{subtitle}</div>}
              </div>
            </div>

            {closeButton && (
              <button
                type="button"
                className="gmodal-close"
                onClick={onHide}
                aria-label="Fechar"
                title="Fechar"
              >
                <span aria-hidden="true">×</span>
              </button>
            )}
          </header>

          <div className="gmodal-body">{children}</div>

          {!!footer && <footer className="gmodal-footer">{footer}</footer>}
        </div>

        <div className="gmodal-glow" aria-hidden="true" />
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

GlobalModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  children: PropTypes.node,
  footer: PropTypes.node,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  centered: PropTypes.bool,
  backdrop: PropTypes.oneOfType([PropTypes.oneOf(["static"]), PropTypes.bool]),
  closeOnEsc: PropTypes.bool,
  closeButton: PropTypes.bool,
  logoSrc: PropTypes.string,
  logoAlt: PropTypes.string,
  className: PropTypes.string,
};
