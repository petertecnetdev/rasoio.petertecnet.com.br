import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import "./ProcessingIndicatorComponent.css";

const ProcessingIndicatorComponent = ({
  messages = ["Carregando..."],
  interval = 1000,
  gifSrc = "/images/logo.gif",
  blocking = true,
}) => {
  const msgRef = useRef(0);
  const [current, setCurrent] = useState(messages[0] || "");

  useEffect(() => {
    if (messages.length <= 1) {
      setCurrent(messages[0] || "");
      return undefined;
    }

    const timer = window.setInterval(() => {
      msgRef.current = (msgRef.current + 1) % messages.length;
      setCurrent(messages[msgRef.current]);
    }, interval);

    return () => window.clearInterval(timer);
  }, [messages, interval]);

  return (
    <div
      className={`processing-overlay${blocking ? "" : " processing-overlay--passive"}`}
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="processing-inner">
        {gifSrc && (
          <img
            className="processing-gif"
            src={gifSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        )}
        {current && (
          <div className="processing-text">
            <div className="processing-message">{current}</div>
          </div>
        )}
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
