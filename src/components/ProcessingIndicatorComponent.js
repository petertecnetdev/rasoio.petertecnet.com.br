import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types'; // Importando PropTypes
import loadingImage from '../images/logo.gif';

const ProcessingIndicatorComponent = ({ messages = [], interval = 1500 }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!messages.length) return; // Evitar erros se não houver mensagens
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => 
        (prevIndex + 1) % messages.length
      );
    }, interval);

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(messageInterval);
  }, [messages, interval]);

  return (
    <div style={{
      background: `url('/images/background-2.png') no-repeat center center`,
      backgroundSize: 'cover',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '450px',
      padding: '0 10px',
      boxSizing: 'border-box'
    }}>
      <img
        src={loadingImage}
        alt="Loading Rosaio"
        style={{
          borderRadius: '50%',
          width: '50%',
          maxWidth: '100px',
          height: 'auto'
        }}
      />
      <div style={{
        marginTop: '1px',
        padding: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '10px',
        fontSize: '15px',
        textAlign: 'center',
        color: '#333',
        maxWidth: '80%',
      }}>
        {messages.length > 0 
          ? messages[currentMessageIndex]
          : 'Processando, por favor aguarde...'}
      </div>
    </div>
  );
};

// Definindo validações de props
ProcessingIndicatorComponent.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.string), // 'messages' deve ser um array de strings
  interval: PropTypes.number // 'interval' deve ser um número
};

export default ProcessingIndicatorComponent;
