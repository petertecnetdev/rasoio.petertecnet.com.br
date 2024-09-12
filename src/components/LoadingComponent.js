import React from 'react';
import { Card } from '@mui/material';
import VuiBox from 'components/VuiBox';
import VuiTypography from 'components/VuiTypography';
import loadingImage from 'assets/images/logo.gif'; // Imagem do logo

const LoadingComponent = () => {
  return (
    <VuiBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      minHeight="100vh"
      backgroundColor="background.default"
      sx={{ background: 'linear-gradient(to right, #1f1c2c, #928DAB)' }}
    >
        <VuiBox display="flex" flexDirection="column" alignItems="center">
          <VuiBox mb={3}>
            <img src={loadingImage} alt="Carregando..." style={{ borderRadius: '50%', width: '150px', height: '150px' }} />
          </VuiBox>
          <VuiTypography variant="h6" color="white" fontWeight="bold">
            Carregando...
          </VuiTypography>
        </VuiBox>
    </VuiBox>
  );
}

export default LoadingComponent;
