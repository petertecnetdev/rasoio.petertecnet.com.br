import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import loadingImage from '../images/logo.png';

const ProcessingIndicatorComponent = ({ messages = [], interval = 1500 }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!messages.length) return; // Evita erros se não houver mensagens
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
    }, interval);

    return () => clearInterval(messageInterval);
  }, [messages, interval]);

  return (
    <div className="processing-indicator-container">
      <img
        src={loadingImage}
        alt="Loading Rosaio"
        className="processing-indicator-image"
      />
      <div className="processing-indicator-message">
        {messages.length > 0
          ? messages[currentMessageIndex]
          : 'Processando, por favor aguarde...'}
      </div>
    </div>
  );
};

ProcessingIndicatorComponent.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.string),
  interval: PropTypes.number,
};

export default ProcessingIndicatorComponent;
