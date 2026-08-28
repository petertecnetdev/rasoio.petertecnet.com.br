import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import "./ProcessingIndicatorComponent.css";

const hasOpenAlert = () => {
  if (typeof document === "undefined") return false;

  return Boolean(
    document.querySelector(
      ".swal2-container, [role='alertdialog']"
    )
  );
};

const ProcessingIndicatorComponent = ({
  messages = ["Carregando..."],
  interval = 1000,
  gifSrc = "/images/logo.mp4",
}) => {
  const msgRef = useRef(0);
  const [current, setCurrent] = useState(messages[0] || "");
  const [alertOpen, setAlertOpen] = useState(hasOpenAlert);

  useEffect(() => {
    if (messages.length === 0) return undefined;

    const iv = setInterval(() => {
      msgRef.current = (msgRef.current + 1) % messages.length;
      setCurrent(messages[msgRef.current]);
    }, interval);

    return () => clearInterval(iv);
  }, [messages, interval]);

  useEffect(() => {
    if (typeof document === "undefined" || !document.body) return undefined;

    const syncAlertState = () => {
      setAlertOpen(hasOpenAlert());
    };

    syncAlertState();

    const observer = new MutationObserver(syncAlertState);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "role"],
    });

    return () => observer.disconnect();
  }, []);

  // Regra global: indicador de processamento nunca pode ficar por cima
  // de um modal de alerta. Enquanto o alerta existir, mantemos o
  // componente montado, mas sem renderizar o overlay.
  if (alertOpen) return null;

  return (
    <div className="processing-overlay" aria-live="polite" aria-busy="true">
      <div className="processing-inner">
        {gifSrc && (
          <img
            className="processing-gif"
            src={gifSrc}
            alt="Carregando"
            aria-label="Indicador de carregamento"
          />
        )}
        <div className="processing-text">
          <div className="processing-message">{current}</div>
        </div>
      </div>
    </div>
  );
};

ProcessingIndicatorComponent.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.string),
  interval: PropTypes.number,
  gifSrc: PropTypes.string,
};

export default ProcessingIndicatorComponent;
