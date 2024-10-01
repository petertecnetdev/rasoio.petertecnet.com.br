import React, { Component } from "react";
import authService from "../../services/AuthService";
import { Button, Card, Col, Container, Row, Form } from "react-bootstrap"; 
import Swal from "sweetalert2"; // Importando SweetAlert
import backgroundImage from "../../images/background-2.png";

class RegisterPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      first_name: "",
      email: "",
      password: "",
      confirmPassword: "",
      loading: false,
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
      const modalMessage = registrationResponse?.data?.message || "Registro bem-sucedido";

      Swal.fire({
        title: "Sucesso!",
        text: modalMessage,
        icon: "success",
        confirmButtonText: "Ok",
        customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
        },
        iconColor: '#28a745', // Verde para sucesso
      });

      this.setState({ loading: false });
    } catch (error) {
      console.log(error);
      let errorMessages = "";

      if (error.email || error.first_name || error.password) {
        if (error.email) {
          errorMessages += error.email[0] + " ";
        }
        if (error.first_name) {
          errorMessages += error.first_name[0] + " ";
        }
        if (error.password) {
          errorMessages += error.password[0] + " ";
        }
      } else {
        errorMessages = "Erro desconhecido ao tentar se registrar.";
      }

      Swal.fire({
        title: "Erro!",
        text: errorMessages,
        icon: "error",
        confirmButtonText: "Ok",
        customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
        },
        iconColor: '#dc3545', // Vermelho para erro
      });

      this.setState({ loading: false });
    }
  };

  render() {
    const { loading } = this.state;
    return (
      <Container fluid>
        <Row style={{
            background: `url(${backgroundImage}) no-repeat center center`,
            backgroundSize: 'cover',
            height: '100vh'
          }}>
          <Col md={6} className="d-flex align-items-center justify-content-center">
            <Card className="card-1 " >
              <Card.Body>
                <Card.Title className="text-center text-lowcase h1 ">RASOIO</Card.Title>
                <Card.Text className="text-center text-primary">
                  <p className="text-light">No Rasoio, o registro de usuários é essencial para os barbeiros que desejam otimizar sua rotina de trabalho.</p>
                  <p>Ao se cadastrar, você terá acesso a uma plataforma projetada para facilitar o gerenciamento de agendamentos e serviços, permitindo que você foque no que faz de melhor: atender seus clientes.</p>
                  <p>Com o Rasoio, você poderá visualizar suas agendas, interagir com clientes e aprimorar sua performance, tornando o dia a dia na barbearia mais produtivo e organizado.</p>
                  <p>Cadastre-se hoje mesmo e transforme a sua experiência profissional!</p>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} className="d-flex align-items-center justify-content-center">
            <Card >
              <Card.Body>
                <div className="text-center">
                  <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="logo rounded-circle img-thumbnail"
                    style={{ width: "150px", height: "150px" }}
                  />
                </div>

                <Card.Title className="text-center mb-2 h2">REGISTRE-SE</Card.Title>
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

                  <Button type="submit" disabled={loading} className="btn btn-primary w-100">
                    {loading ? "Registrando..." : "Registrar"}
                  </Button>
                  <p className="forgot-password text-right text-center mt-3">
                    Já está registrado? <a href="/login" className="auth-link">Entrar</a>
                  </p>
                  <p className="forgot-password text-right text-center mt-3">
                    Esqueceu a senha? <a href="/password-email" className="auth-link">Recuperar senha</a>
                  </p>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default RegisterPage;
