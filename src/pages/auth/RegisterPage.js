import React, { Component } from "react";
import axios from "axios";
import { Button, Card, Col, Container, Row, Form } from "react-bootstrap";
import Swal from "sweetalert2"; // Importando SweetAlert
import { apiBaseUrl } from "../../config"; // Importando a configuração da URL base da API
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent"; // Importando o componente de indicador de processamento

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
    const { first_name, email, password, confirmPassword } = this.state;

    // Verificando se a senha e a confirmação de senha coincidem
    if (password !== confirmPassword) {
      Swal.fire({
        title: "Erro!",
        text: "As senhas não coincidem. Por favor, tente novamente.",
        icon: "error",
        confirmButtonText: "Ok",
        iconColor: "#dc3545",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        }, // Vermelho para erro
      });
      return;
    }

    this.setState({ loading: true });

    try {
      const userObject = {
        first_name,
        email,
        password,
      };

      // Realizando a requisição diretamente à API
      const response = await axios.post(
        `${apiBaseUrl}/auth/register`,
        userObject
      );

      const modalMessage = response?.data?.message || "Registro bem-sucedido";

      Swal.fire({
        title: "Sucesso!",
        text: modalMessage,
        icon: "success",
        confirmButtonText: "Ok",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
        iconColor: "#28a745", // Verde para sucesso
      }).then(() => {
        // Redirecionando para a página de login após o clique no "Ok"
        window.location.href = "/login";
      });

      this.setState({ loading: false });
    } catch (error) {
      console.log(error);
      let errorMessages = "";

      if (error.response && error.response.data.errors) {
        const errors = error.response.data.errors;
        if (errors.email) {
          errorMessages += errors.email[0] + " ";
        }
        if (errors.first_name) {
          errorMessages += errors.first_name[0] + " ";
        }
        if (errors.password) {
          errorMessages += errors.password[0] + " ";
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
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
        iconColor: "#dc3545", // Vermelho para erro
      });

      this.setState({ loading: false });
    }
  };

  render() {
    const { loading } = this.state;

    return (
      <Container fluid>
        {loading && (
          <ProcessingIndicatorComponent
            messages={["Registrando usuário...", "Por favor, aguarde..."]}
          />
        )}{" "}
        {/* Exibindo o indicador de processamento */}
        {/* Condicional para esconder os elementos enquanto o formulário estiver carregando */}
        {!loading && (
          <Row>
            <Col
              md={12}
              className="d-flex align-items-center justify-content-center"
            >
              <Card>
                <p className="labeltitle h7 text-uppercase">Registre-se</p>
                <Card.Body>
                  <div className="text-center">
                    <img
                      src="/images/logo.png"
                      alt="Logo"
                      className="logo rounded-circle img-thumbnail m-4"
                      style={{ width: "80px", height: "80px" }}
                    />
                  </div>
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

                    <Button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary w-100"
                    >
                      {loading ? "Registrando..." : "Registrar"}
                    </Button>
                    <p className="forgot-password text-right text-center mt-3">
                      Já está registrado?{" "}
                      <a href="/login" className="auth-link">
                        Entrar
                      </a>
                    </p>
                    <p className="forgot-password text-right text-center mt-3">
                      Esqueceu a senha?{" "}
                      <a href="/password-email" className="auth-link">
                        Recuperar senha
                      </a>
                    </p>
                    
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    );
  }
}

export default RegisterPage;
