import React from 'react';
import VuiBox from 'components/VuiBox';
import VuiTypography from 'components/VuiTypography';
import loadingImage from 'assets/images/logo.png'; // Imagem do logo

const LoadingComponent = () => {
  return (
    <VuiBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      height="100vh"
      backgroundColor="background.default"
    >
      <VuiBox mb={3}>
        <img src={loadingImage} alt="Carregando..." style={{ borderRadius: '80%', width: '150px', height: '150px' }} />
      </VuiBox>
      <VuiTypography variant="h6" color="white" fontWeight="bold">
        Carregando...
      </VuiTypography>
    </VuiBox>
  );
}

export default LoadingComponent;
