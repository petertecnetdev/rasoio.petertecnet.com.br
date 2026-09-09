import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import "./ProcessingIndicatorComponent.css";

const DEFAULT_MESSAGES = [
  "Preparando sua experiência no Rasoio…",
  "Organizando serviços e horários…",
  "Conectando sua operação…",
  "Quase lá — tudo está ficando pronto.",
];

const ProcessingIndicatorComponent = ({
  messages = DEFAULT_MESSAGES,
  interval = 2600,
  gifSrc = "/images/logo.png",
  blocking = true,
}) => {
  const safeMessages = useMemo(
    () => (Array.isArray(messages) && messages.filter(Boolean).length ? messages.filter(Boolean) : DEFAULT_MESSAGES),
    [messages],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (safeMessages.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeMessages.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [interval, safeMessages]);

  const current = safeMessages[index] || safeMessages[0] || "Carregando…";

  return (
    <div
      className={`processing-overlay${blocking ? "" : " processing-overlay--passive"}`}
      aria-live="polite"
      aria-busy="true"
      aria-label={current}
      role="status"
    >
      <div className="processing-ambient" aria-hidden="true">
        <i className="processing-spark processing-spark--one" />
        <i className="processing-spark processing-spark--two" />
        <i className="processing-spark processing-spark--three" />
      </div>

      <div className="processing-card">
        <div className="processing-scene" aria-hidden="true">
          <span className="processing-ring processing-ring--outer" />
          <span className="processing-ring processing-ring--inner" />
          <span className="processing-pulse" />
          <div className="processing-logo-shell">
            {gifSrc ? <img className="processing-gif" src={gifSrc} alt="" draggable={false} /> : <span className="processing-monogram">R</span>}
          </div>
        </div>

        <div className="processing-text">
          <span className="processing-kicker">Peter Tecnet</span>
          <strong>Rasoio</strong>
          <span className="processing-message" key={current}>{current}</span>
        </div>

        <div className="processing-progress" aria-hidden="true"><span /></div>
        <div className="processing-beat" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      </div>
    </div>
  );
};

ProcessingIndicatorComponent.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.string),
  interval: PropTypes.number,
  gifSrc: PropTypes.string,
  blocking: PropTypes.bool,
};

export default ProcessingIndicatorComponent;
