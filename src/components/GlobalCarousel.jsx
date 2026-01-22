  // src/components/GlobalCarousel.jsx
  import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
  import PropTypes from "prop-types";
  import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

  import GlobalModal from "./GlobalModal";
  import LoginFormComponent from "./auth/LoginFormComponent";
  import GlobalCard from "./GlobalCard";

  import "./GlobalCarousel.css";

  export default function GlobalCarousel({
    title,
    items,
    fmtBRL,
    openSchedulePopup,
    navigate,
    showSchedule,

    subtitle = null,
    loginTitle = "Faça login para continuar",
    loginSubtitle = "Entre na sua conta para agendar.",
    modalSize = "md",
    modalLogoSrc = null,
    modalLogoAlt = "",

    // ✅ dots estilo iOS
    showDots = true,
    dotsMax = 12, // limita a quantidade de pontos
  }) {
    const trackRef = useRef(null);
    const rafRef = useRef(null);

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [pendingSchedule, setPendingSchedule] = useState(null);

    const [hasOverflow, setHasOverflow] = useState(false);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    // ✅ dots
    const [activeIndex, setActiveIndex] = useState(0);

    const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);
    const canSchedule = !!showSchedule && typeof openSchedulePopup === "function";
    const isAuthenticated = useCallback(() => !!localStorage.getItem("token"), []);

    const updateArrows = useCallback(() => {
      const el = trackRef.current;
      if (!el) return;

      const overflow = el.scrollWidth > el.clientWidth + 2;
      const leftOk = el.scrollLeft > 2;
      const rightOk = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;

      setHasOverflow(overflow);
      setCanLeft(overflow && leftOk);
      setCanRight(overflow && rightOk);
    }, []);

    const computeActiveIndex = useCallback(() => {
      const el = trackRef.current;
      if (!el) return;

      const children = Array.from(el.children || []);
      if (!children.length) {
        setActiveIndex(0);
        return;
      }

      // pega o card mais próximo do "left padding" do track
      const leftEdge = el.scrollLeft + 18;
      let bestIdx = 0;
      let bestDist = Number.POSITIVE_INFINITY;

      for (let i = 0; i < children.length; i += 1) {
        const node = children[i];
        const dist = Math.abs(node.offsetLeft - leftEdge);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      setActiveIndex(bestIdx);
    }, []);

    const scrollByPage = useCallback(
      (dir) => {
        const el = trackRef.current;
        if (!el) return;

        const amt = Math.max(260, Math.floor(el.clientWidth * 0.85));
        el.scrollBy({ left: dir === "left" ? -amt : amt, behavior: "smooth" });

        requestAnimationFrame(() => {
          updateArrows();
          computeActiveIndex();
        });
      },
      [updateArrows, computeActiveIndex]
    );

    const scrollToIndex = useCallback(
      (idx) => {
        const el = trackRef.current;
        if (!el) return;

        const children = Array.from(el.children || []);
        const node = children[idx];
        if (!node) return;

        // centraliza o item
        const left =
          node.offsetLeft - Math.max(0, Math.floor(el.clientWidth / 2 - node.clientWidth / 2));
        el.scrollTo({ left, behavior: "smooth" });

        requestAnimationFrame(() => {
          updateArrows();
          computeActiveIndex();
        });
      },
      [updateArrows, computeActiveIndex]
    );

    const handleScheduleClick = useCallback(
      (source) => {
        if (!canSchedule) return;

        if (!isAuthenticated()) {
          setPendingSchedule(source);
          setShowLoginModal(true);
          return;
        }

        openSchedulePopup(source);
      },
      [canSchedule, isAuthenticated, openSchedulePopup]
    );

    const handleLoginSuccess = useCallback(() => {
      setShowLoginModal(false);
      if (pendingSchedule && canSchedule) {
        openSchedulePopup(pendingSchedule);
        setPendingSchedule(null);
      }
    }, [pendingSchedule, canSchedule, openSchedulePopup]);

    const handleCloseLogin = useCallback(() => {
      setShowLoginModal(false);
      setPendingSchedule(null);
    }, []);

    // reset quando trocar lista
    useEffect(() => {
      const el = trackRef.current;
      if (!el) return;

      el.scrollTo({ left: 0, behavior: "auto" });
      setActiveIndex(0);

      rafRef.current = requestAnimationFrame(() => {
        updateArrows();
        computeActiveIndex();
      });

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [title, safeItems.length, updateArrows, computeActiveIndex]);

    // scroll/resize watchers
    useEffect(() => {
      const el = trackRef.current;
      if (!el) return;

      const onScroll = () => {
        updateArrows();
        computeActiveIndex();
      };

      el.addEventListener("scroll", onScroll, { passive: true });

      const onResize = () => {
        updateArrows();
        computeActiveIndex();
      };

      window.addEventListener("resize", onResize);

      updateArrows();
      computeActiveIndex();

      return () => {
        el.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
      };
    }, [updateArrows, computeActiveIndex]);

    // drag desktop
    useEffect(() => {
      const el = trackRef.current;
      if (!el) return;

      let isDown = false;
      let startX = 0;
      let startLeft = 0;

      const onDown = (e) => {
        const tag = (e.target?.tagName || "").toLowerCase();
        if (
          tag === "button" ||
          tag === "a" ||
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          e.target?.closest("button") ||
          e.target?.closest("a")
        )
          return;

        isDown = true;
        startX = e.pageX;
        startLeft = el.scrollLeft;
        el.classList.add("gcarousel-dragging");
      };

      const onMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const dx = e.pageX - startX;
        el.scrollLeft = startLeft - dx;
      };

      const onUp = () => {
        isDown = false;
        el.classList.remove("gcarousel-dragging");
        updateArrows();
        computeActiveIndex();
      };

      el.addEventListener("mousedown", onDown);
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);

      return () => {
        el.removeEventListener("mousedown", onDown);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
    }, [updateArrows, computeActiveIndex]);

    // wheel -> horizontal
    const handleWheel = useCallback((e) => {
      const el = trackRef.current;
      if (!el) return;

      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, []);

    // ✅ dots (agrupa quando tem muitos)
    const dots = useMemo(() => {
      const total = safeItems.length;
      if (!showDots || total <= 1) return null;

      const max = Math.max(3, Math.min(dotsMax, total));

      // se cabe tudo, mostra tudo
      if (total <= max) {
        return Array.from({ length: total }, (_, i) => ({ key: `d-${i}`, index: i, small: false }));
      }

      // senão, janela ao redor do active
      const windowSize = max;
      const half = Math.floor(windowSize / 2);

      let start = Math.max(0, activeIndex - half);
      let end = start + windowSize - 1;

      if (end > total - 1) {
        end = total - 1;
        start = Math.max(0, end - (windowSize - 1));
      }

      const out = [];
      for (let i = start; i <= end; i += 1) {
        out.push({ key: `d-${i}`, index: i, small: false });
      }

      // marca pontinhos “menores” nas pontas para indicar que tem mais
      if (start > 0 && out.length) out[0].small = true;
      if (end < total - 1 && out.length) out[out.length - 1].small = true;

      return out;
    }, [safeItems.length, showDots, dotsMax, activeIndex]);

    if (!safeItems.length) return null;

    return (
      <>
        <section className="gcarousel text-center">
          <header className="gcarousel-header">
            <div className="gcarousel-header__titles">
              <div className="gcarousel-title">{title}</div>
              {!!subtitle && <div className="gcarousel-subtitle">{subtitle}</div>}
            </div>
          </header>

          <div className="gcarousel-body">
            {hasOverflow && (
              <>
                <button
                  type="button"
                  className={`gcarousel-nav left ${canLeft ? "" : "is-disabled"}`}
                  onClick={() => scrollByPage("left")}
                  disabled={!canLeft}
                  aria-label="Anterior"
                  title="Anterior"
                >
                  <FaChevronLeft />
                </button>

                <button
                  type="button"
                  className={`gcarousel-nav right ${canRight ? "" : "is-disabled"}`}
                  onClick={() => scrollByPage("right")}
                  disabled={!canRight}
                  aria-label="Próximo"
                  title="Próximo"
                >
                  <FaChevronRight />
                </button>
              </>
            )}

            <div className={`gcarousel-fade left ${canLeft ? "show" : ""}`} />
            <div className={`gcarousel-fade right ${canRight ? "show" : ""}`} />

            <div
              ref={trackRef}
              className="gcarousel-track"
              onWheel={handleWheel}
              role="list"
              aria-label={title}
            >
              {safeItems.map((it, idx) => (
                <div key={it?.id ?? it?.slug ?? idx} className="gcarousel-item" role="listitem">
                  <GlobalCard
                    item={it}
                    fmtBRL={fmtBRL}
                    navigate={navigate}
                    showSchedule={canSchedule}
                    openSchedulePopup={canSchedule ? handleScheduleClick : null}
                    actions={null}
                  />
                </div>
              ))}
            </div>

            {/* ✅ iOS dots */}
            {!!dots && (
              <div className="gcarousel-dots" aria-label="Indicador do carrossel">
                {dots.map((d) => {
                  const active = d.index === activeIndex;
                  return (
                    <button
                      key={d.key}
                      type="button"
                      className={`gcarousel-dot ${active ? "is-active" : ""} ${
                        d.small ? "is-small" : ""
                      }`}
                      onClick={() => scrollToIndex(d.index)}
                      aria-label={`Ir para item ${d.index + 1}`}
                      title={`Item ${d.index + 1}`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <GlobalModal
          show={showLoginModal}
          onHide={handleCloseLogin}
          title={loginTitle}
          subtitle={loginSubtitle}
          size={modalSize}
          centered
          backdrop="static"
          closeOnEsc
          closeButton
          logoSrc={modalLogoSrc}
          logoAlt={modalLogoAlt}
          className="gcarousel-login-modal"
          footer={null}
        >
          <div className="gcarousel-login-body">
            <LoginFormComponent onSuccess={handleLoginSuccess} />
          </div>
        </GlobalModal>
      </>
    );
  }

  GlobalCarousel.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    items: PropTypes.array.isRequired,
    fmtBRL: PropTypes.func.isRequired,
    openSchedulePopup: PropTypes.func,
    navigate: PropTypes.func.isRequired,
    showSchedule: PropTypes.bool,

    loginTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    loginSubtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    modalSize: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
    modalLogoSrc: PropTypes.string,
    modalLogoAlt: PropTypes.string,

    showDots: PropTypes.bool,
    dotsMax: PropTypes.number,
  };

  GlobalCarousel.defaultProps = {
    subtitle: null,
    showSchedule: false,
    openSchedulePopup: null,

    loginTitle: "Faça login para continuar",
    loginSubtitle: "Entre na sua conta para agendar.",
    modalSize: "md",
    modalLogoSrc: null,
    modalLogoAlt: "",

    showDots: true,
    dotsMax: 12,
  };
