import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";  // Adicionado useNavigate
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";
import GradientBorder from "examples/GradientBorder";
import radialGradient from "assets/theme/functions/radialGradient";
import palette from "assets/theme/base/colors";
import borders from "assets/theme/base/borders";
import CoverLayout from "layouts/authentication/components/CoverLayout";
import bgSignIn from "assets/images/signInImage.png";
import authService from "services/AuthService"; // Importar o authService para verificar e reenviar código

function EmailVerify() {
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Hook para navegação

  // Função para verificar o email
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const emailVerified = await authService.emailVerify(verificationCode);
      if (emailVerified) {
        setSuccessMessage("Email verificado com sucesso! Redirecionando...");
        setTimeout(() => {
          window.location.href = "/dashboard"; // Redireciona para o dashboard
        }, 1500);
      } else {
        setError("Erro na verificação de email. Insira o código correto.");
      }
    } catch (error) {
      setError("Erro durante a verificação de email. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Função para reenviar o código de verificação
  const handleResendVerificationCode = async () => {
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const codeResent = await authService.resendCodeEmailVerification();
      if (codeResent) {
        setSuccessMessage("Código de verificação reenviado com sucesso.");
      } else {
        setError("Erro ao reenviar o código de verificação.");
      }
    } catch (error) {
      setError("Erro ao reenviar o código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Função para redirecionar para a rota /logout
  const handleLogoutRedirect = () => {
    navigate("/logout");
  };

  return (
    <CoverLayout
      title="Verificação de Email"
      description="Insira o código de verificação que foi enviado para seu email"
      premotto="CONFIRME SEU EMAIL"
      motto="RASOIO - GERENCIAMENTO DE BARBEARIAS"
      image={bgSignIn}
    >
      <VuiBox
        component="form"
        role="form"
        onSubmit={handleVerifyEmail} // Manipulador de envio de verificação
      >
        {error && (
          <VuiBox mb={2}>
            <VuiTypography color="error" fontWeight="bold">
              {error}
            </VuiTypography>
          </VuiBox>
        )}
        {successMessage && (
          <VuiBox mb={2}>
            <VuiTypography color="success" fontWeight="bold">
              {successMessage}
            </VuiTypography>
          </VuiBox>
        )}
        <VuiBox mb={2}>
          <VuiBox mb={1} ml={0.5}>
            <VuiTypography component="label" variant="button" color="white" fontWeight="medium">
              Código de Verificação
            </VuiTypography>
          </VuiBox>
          <GradientBorder
            minWidth="100%"
            padding="1px"
            borderRadius={borders.borderRadius.lg}
            backgroundImage={radialGradient(
              palette.gradients.borderLight.main,
              palette.gradients.borderLight.state,
              palette.gradients.borderLight.angle
            )}
          >
            <VuiInput
              type="text"
              placeholder="Insira o código enviado ao seu email"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              fontWeight="500"
            />
          </GradientBorder>
        </VuiBox>

        <VuiBox mt={4} mb={1}>
          <VuiButton
            color="info"
            fullWidth
            type="submit"
            disabled={loading} // Desabilitar o botão enquanto carrega
          >
            {loading ? "Verificando..." : "Verificar Email"}
          </VuiButton>
        </VuiBox>

        <VuiBox mt={3} textAlign="center">
          <VuiTypography variant="button" color="text" fontWeight="regular">
            Não recebeu o código?{" "}
            <VuiTypography
              variant="button"
              color="white"
              fontWeight="medium"
              onClick={handleResendVerificationCode}
              sx={{ cursor: "pointer" }}
            >
              Reenviar Código
            </VuiTypography>
          </VuiTypography>
        </VuiBox>

        {/* Botão de Logout */}
        <VuiBox mt={4} textAlign="center">
          <VuiButton color="error" onClick={handleLogoutRedirect} fullWidth>
            Sair
          </VuiButton>
        </VuiBox>
      </VuiBox>
    </CoverLayout>
  );
}

export default EmailVerify;
