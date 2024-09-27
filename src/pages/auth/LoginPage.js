import React, { Component } from "react";
import authService from "../../services/AuthService";
import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import './css/Auth.css'; // Estilos adicionais
import backgroundImage from "../../images/background.png";

class LoginPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      senha: "",
      showAlert: false,
      alertType: "success",
      alertMessage: "",
    };
    this.alertTimer = null;
  }

  onChangeEmailUsuario = (e) => {
    this.setState({ email: e.target.value });
  };

  onChangeSenha = (e) => {
    this.setState({ senha: e.target.value });
  };

  onSubmit = async (e) => {
    e.preventDefault();

    try {
      await authService.login(this.state.email, this.state.senha);
      this.showAlert("success", "Login realizado com sucesso!");
    } catch (error) {
      console.error(error);
      this.showAlert("danger", "Erro no login");
    }
  };

  showAlert = (type, message) => {
    this.setState({
      showAlert: true,
      alertType: type,
      alertMessage: message,
    });

    this.alertTimer = setTimeout(() => {
      this.setState({ showAlert: false });
    }, 5000);
  };

  componentWillUnmount() {
    clearTimeout(this.alertTimer);
  }

  render() {
    return (
      <Container fluid className="login-container">
        <Row className="vh-100">
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
                  O Rasoio é um aplicativo inovador que oferece uma experiência única para gerenciamento de barbearias. 
                  Facilite o agendamento de serviços, interaja com clientes e gerencie suas operações de forma eficiente!
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} className="d-flex align-items-center justify-content-center">
            <Card className="login-card">
              <Card.Body>
                <div className="text-center mb-4">
                  <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="logo rounded-circle img-thumbnail"
                    style={{ width: "120px", height: "120px" }}
                  />
                </div>
                <Card.Title className="text-center mb-4">LOGIN</Card.Title>
                <Form onSubmit={this.onSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="email"
                      placeholder="Insira o email"
                      onChange={this.onChangeEmailUsuario}
                      value={this.state.email}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="password"
                      placeholder="Insira a senha"
                      onChange={this.onChangeSenha}
                      value={this.state.senha}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="formBasicCheckbox">
                    <Form.Check
                      type="checkbox"
                      label="Lembrar-me"
                      id="customCheck1"
                    />
                  </Form.Group>
                  <Button type="submit" className="btn btn-primary w-100">
                    Entrar
                  </Button>
                  <p className="forgot-password text-center mt-3">
                    Não tem registro? <a href="/register">Registrar</a>
                  </p>
                  <p className="forgot-password text-center">
                    Esqueceu a senha?{" "}
                    <a href="/password-email">Recuperar senha</a>
                  </p>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Alert */}
        <Alert
          show={this.state.showAlert}
          variant={this.state.alertType}
          onClose={() => {
            clearTimeout(this.alertTimer);
            this.setState({ showAlert: false });
          }}
          dismissible
          className="alert-position"
        >
          {this.state.alertType === "success" ? "Sucesso" : "Erro"}
          <p>{this.state.alertMessage}</p>
        </Alert>
      </Container>
    );
  }
}

export default LoginPage;
