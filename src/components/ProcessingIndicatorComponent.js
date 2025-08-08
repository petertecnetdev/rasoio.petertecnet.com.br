import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import "./ProcessingIndicatorComponent.css";

const ProcessingIndicatorComponent = ({
  messages = ["Carregando..."],
  interval = 1000,
  gifSrc = "/images/logo.gif",
}) => {
  const msgRef = useRef(0);
  const [current, setCurrent] = useState(messages[0] || "");

  useEffect(() => {
    if (messages.length === 0) return;
    const iv = setInterval(() => {
      msgRef.current = (msgRef.current + 1) % messages.length;
      setCurrent(messages[msgRef.current]);
    }, interval);
    return () => clearInterval(iv);
  }, [messages, interval]);

  return (
    <div className="processing-overlay">
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
