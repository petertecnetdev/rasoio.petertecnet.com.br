import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
<<<<<<< HEAD
import loadingImage from '../images/logo.png';
=======
import ReactDOM from 'react-dom';
import loadingImage from '../images/logo.gif';
>>>>>>> b6dc8a5d0af000183a529371eabcd70a64f359c4

const ProcessingIndicatorComponent = ({ messages = [], interval = 1500 }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
<<<<<<< HEAD
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
=======
    if (!messages.length) return;
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % messages.length);
    }, interval);
    return () => clearInterval(messageInterval);
  }, [messages, interval]);

  const indicator = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      <img
        src={loadingImage}
        alt="Loading"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
      {messages.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          width: '100%',
          textAlign: 'center',
          color: '#FFFFFF',
          fontSize: '1.2rem',
          padding: '0 20px'
        }}>
          {messages[currentMessageIndex]}
        </div>
      )}
    </div>
  );

  return ReactDOM.createPortal(indicator, document.body);
>>>>>>> b6dc8a5d0af000183a529371eabcd70a64f359c4
};

ProcessingIndicatorComponent.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.string),
  interval: PropTypes.number,
};

export default ProcessingIndicatorComponent;
