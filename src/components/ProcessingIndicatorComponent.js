// src/components/ProcessingIndicatorComponent.jsx
import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./ProcessingIndicatorComponent.css";

const ProcessingIndicatorComponent = ({ messages = [], interval = 1000, videoSrc }) => {
  const msgRef = useRef(0);
  const [current, setCurrent] = React.useState(messages[0] || "");

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
        {videoSrc && (
          <video
            className="processing-video"
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
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
  videoSrc: PropTypes.string,
};

export default ProcessingIndicatorComponent;
