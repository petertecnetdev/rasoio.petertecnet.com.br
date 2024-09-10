import { useState } from "react";
import { Link } from "react-router-dom";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";
import VuiSwitch from "components/VuiSwitch";
import GradientBorder from "examples/GradientBorder";
import radialGradient from "assets/theme/functions/radialGradient";
import palette from "assets/theme/base/colors";
import borders from "assets/theme/base/borders";
import CoverLayout from "layouts/authentication/components/CoverLayout";
import bgSignIn from "assets/images/signInImage.png";
import authService from "services/AuthService"; // Importar o authService

function SignIn() {
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetRememberMe = () => setRememberMe(!rememberMe);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
  
    try {
      const userObject = {
        email: email.trim(),  // Remover espaços em branco
        password: password.trim(),  // Remover espaços em branco
      };
  
      await authService.login(userObject.email, userObject.password); // Alterado para enviar email e senha separadamente
      window.location.href = "/dashboard";
    } catch (error) {
      setError(error.message || "Erro durante o login. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CoverLayout
      title="Rasoio!"
      color="white"
      description="Faça login com seu e-mail e senha para acessar sua conta"
      premotto="INSPIRADO NO FUTURO:"
      motto="RASOIO - GERENCIAMENTO DE BARBEARIAS"
      image={bgSignIn}
    >
      <VuiBox
        component="form"
        role="form"
        onSubmit={handleSubmit} // Adicionar o manipulador de envio
      >
        {error && (
          <VuiBox mb={2}>
            <VuiTypography color="error" fontWeight="bold">
              {error}
            </VuiTypography>
          </VuiBox>
        )}
        <VuiBox mb={2}>
          <VuiBox mb={1} ml={0.5}>
            <VuiTypography component="label" variant="button" color="white" fontWeight="medium">
              E-mail
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
              type="email"
              placeholder="Seu e-mail..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fontWeight="500"
            />
          </GradientBorder>
        </VuiBox>
        <VuiBox mb={2}>
          <VuiBox mb={1} ml={0.5}>
            <VuiTypography component="label" variant="button" color="white" fontWeight="medium">
              Senha
            </VuiTypography>
          </VuiBox>
          <GradientBorder
            minWidth="100%"
            borderRadius={borders.borderRadius.lg}
            padding="1px"
            backgroundImage={radialGradient(
              palette.gradients.borderLight.main,
              palette.gradients.borderLight.state,
              palette.gradients.borderLight.angle
            )}
          >
            <VuiInput
              type="password"
              placeholder="Sua senha..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={({ typography: { size } }) => ({
                fontSize: size.sm,
              })}
            />
          </GradientBorder>
        </VuiBox>
        <VuiBox display="flex" alignItems="center">
          <VuiSwitch color="info" checked={rememberMe} onChange={handleSetRememberMe} />
          <VuiTypography
            variant="caption"
            color="white"
            fontWeight="medium"
            onClick={handleSetRememberMe}
            sx={{ cursor: "pointer", userSelect: "none" }}
          >
            &nbsp;&nbsp;&nbsp;&nbsp;Lembrar de mim
          </VuiTypography>
        </VuiBox>
        <VuiBox mt={4} mb={1}>
          <VuiButton
            color="info"
            fullWidth
            type="submit" // Alterar para type="submit"
            disabled={loading}
          >
            {loading ? "Entrando..." : "ENTRAR"}
          </VuiButton>
        </VuiBox>
        <VuiBox mt={3} textAlign="center">
          <VuiTypography variant="button" color="text" fontWeight="regular">
            Não tem uma conta?{" "}
            <VuiTypography
              component={Link}
              to="/authentication/sign-up"
              variant="button"
              color="white"
              fontWeight="medium"
            >
              Registre-se
            </VuiTypography>
          </VuiTypography>
        </VuiBox>
      </VuiBox>
    </CoverLayout>
  );
}

export default SignIn;
