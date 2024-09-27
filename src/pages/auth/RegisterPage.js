import React, { Component } from "react";
import authService from "../../services/AuthService";
import {
  Button,
  Card,
  Col,
  Container,
  Row,
  Form,
  Alert,
} from "react-bootstrap"; // Adicionando o componente Alert
import backgroundImage from "../../images/background-2.png";

class RegisterPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      first_name: "",
      email: "",
      password: "",
      confirmPassword: "",
      showAlert: false,
      alertType: "success",
      alertMessage: "",
      loading: false,
      timerId: null, // Adicione o ID do temporizador ao estado
    };
  }

  onChangefirst_name = (e) => {
    this.setState({ first_name: e.target.value });
  };

  onChangeemail = (e) => {
    this.setState({ email: e.target.value });
  };

  onChangePassword = (e) => {
    this.setState({ password: e.target.value });
  };

  onChangeConfirmPassword = (e) => {
    this.setState({ confirmPassword: e.target.value });
  };

  onSubmit = async (e) => {
    e.preventDefault();

    const { first_name, email, password } = this.state;

    this.setState({ loading: true });

    try {
      const userObject = {
        first_name: first_name,
        email: email,
        password: password,
      };

      const registrationResponse = await authService.register(userObject);

      const modalMessage =
        registrationResponse?.data?.message || "Registro bem-sucedido";

      this.setState({
        showAlert: true,
        alertMessage: modalMessage,
        alertType: "success",
        loading: false,
      });

      // Iniciar temporizador para ocultar o alerta após 5 segundos
      const timerId = setTimeout(() => {
        this.setState({ showAlert: false });
      }, 5000); // 5000 milissegundos = 5 segundos

      // Salvar o ID do temporizador no estado
      this.setState({ timerId: timerId });
    } catch (error) {
      console.log(error);
      let errorMessages = "";

      if (error.email || error.first_name || error.password) {
        if (error.email) {
          errorMessages += error.email[0];
        }
        if (error.first_name) {
          errorMessages += error.first_name[0];
        }
        if (error.password) {
          errorMessages += error.password[0];
        }
      } else {
        errorMessages = "Erro desconhecido ao tentar se registrar.";
      }

      this.setState({
        showAlert: true,
        alertMessage: errorMessages,
        alertType: "danger",
        loading: false,
      });
    }
  };

  render() {
    const { loading } = this.state;
    return (
      <Container fluid>
        <Row>
          {/* Coluna com a imagem de fundo */}
          <Col md={6} className="d-none d-md-block position-relative" style={{
            background: `url(${backgroundImage}) no-repeat center center`,
            backgroundSize: 'cover',
            height: '100vh'
          }}>
            {/* Card sobre a imagem de fundo */}
            <Card className="text-white position-absolute" style={{ top: '20%', left: '10%', width: '80%', opacity: 0.8 }}>
              <Card.Body>
                <Card.Title className="text-center text-lowcase h1">RASOIO</Card.Title>
                <Card.Text className="text-center">
                <p> No Rasoio, o registro de usuários é essencial para os barbeiros que desejam otimizar sua rotina de trabalho.</p>
                <p> Ao se cadastrar, você terá acesso a uma plataforma projetada para facilitar o gerenciamento de agendamentos e serviços, permitindo que você foque no que faz de melhor: atender seus clientes. </p>
                <p>  Com o Rasoio, você poderá visualizar suas agendas, interagir com clientes e aprimorar sua performance, tornando o dia a dia na barbearia mais produtivo e organizado. </p>
                <p>  Cadastre-se hoje mesmo e transforme a sua experiência profissional!    </p>
                 </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          {/* Coluna com o formulário de registro */}
          <Col md={6} className="d-flex align-items-center justify-content-center">
            <Card style={{ width: "100%", maxWidth: "500px" }}>
              <Card.Body>
                <div className="text-center">
                  {/* Logo centralizada */}
                  <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="logo rounded-circle img-thumbnail"
                    style={{ width: "150px", height: "150px" }}
                  />
                </div>

                <Card.Title className="text-center mb-2 h2">
                  REGISTRE-SE
                </Card.Title>
                <Form onSubmit={this.onSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Nome"
                      onChange={this.onChangefirst_name}
                      value={this.state.first_name}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="email"
                      placeholder="Insira o Email"
                      onChange={this.onChangeemail}
                      value={this.state.email}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="password"
                      placeholder="Insira a Senha"
                      onChange={this.onChangePassword}
                      value={this.state.password}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="password"
                      placeholder="Confirme a Senha"
                      onChange={this.onChangeConfirmPassword}
                      value={this.state.confirmPassword}
                    />
                  </Form.Group>
                  
                  <Button type="submit" disabled={loading}  className="btn btn-primary w-100">
                    {loading ? "Registrando..." : "Registrar"}
                  </Button>
                  <p className="forgot-password text-right text-center mt-3">
                    Já está registrado? <a href="/login">Entrar</a>
                  </p>
                  <p className="forgot-password text-right text-center mt-3">
                    Esqueceu a senha?{" "}
                    <a href="/password-email">Recuperar senha</a>
                  </p>
                </Form>
                <Alert
                  show={this.state.showAlert}
                  variant={this.state.alertType}
                  onClose={() => {
                    clearTimeout(this.state.timerId); // Limpar temporizador ao fechar manualmente
                    this.setState({ showAlert: false });
                  }}
                  dismissible
                  style={{
                    position: "fixed",
                    top: "10px",
                    right: "10px",
                    zIndex: "1050",
                  }}
                >
                  {this.state.alertMessage}
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default RegisterPage;
