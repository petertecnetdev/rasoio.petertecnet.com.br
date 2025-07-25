import React, { Component } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Button, Card, Col, Container, Row, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import { apiBaseUrl } from "../../config";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { GoogleLogin } from "@react-oauth/google";

class LoginPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      loading: false
    };
  }

  setToken = token => localStorage.setItem("token", token);

  onChangeusername = e => this.setState({ username: e.target.value });

  onChangePassword = e => this.setState({ password: e.target.value });

  onSubmit = async e => {
    e.preventDefault();
    const { username, password } = this.state;
    this.setState({ loading: true });
    try {
      const response = await axios.post(`${apiBaseUrl}/auth/login`, { username, password });
      const token = response.data.access_token;
      if (token) {
        this.setToken(token);
      }
      window.location.href = "/dashboard";
    } catch (error) {
      let errorMessage = "Ocorreu um erro. Por favor, tente novamente.";
      const { data } = error.response || {};
      errorMessage = data.error || data.password || data.username || errorMessage;
      Swal.fire({
        title: "Erro!",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "Ok",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text"
        }
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleGoogleSuccess = async credentialResponse => {
    this.setState({ loading: true });
    try {
       const res = await axios.post(`${apiBaseUrl}/auth/google`, {
        token_id: credentialResponse.credential,
      });
      const token = res.data.access_token;
      if (token) {
        this.setToken(token);
      }
      window.location.href = "/dashboard";
    } catch (error) {
      Swal.fire({
        title: "Erro!",
        text: error.response?.data?.error || "Falha no login com Google",
        icon: "error",
        confirmButtonText: "Ok",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text"
        }
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleGoogleError = () => {
    Swal.fire({
      title: "Erro!",
      text: "Falha no login com Google",
      icon: "error",
      confirmButtonText: "Ok",
      customClass: {
        popup: "custom-swal",
        title: "custom-swal-title",
        content: "custom-swal-text"
      }
    });
  };

  render() {
    const { loading, username, password } = this.state;
    return (
      <Container fluid className="page-container">
        {loading && <ProcessingIndicatorComponent messages={["Autenticando...", "Por favor, aguarde..."]} />}
        {!loading && (
          <Row className="page-row">
            <Col md={12} className="page-col">
              <Card className="card-container">
                <p className="page-header text-uppercase">Rasoio</p>
                <Card.Body className="card-body">
                  <div className="logo-container">
                    <Link to="/">
                      <img src="/images/logo.png" alt="Logo" className="logo-image" />
                    </Link>
                  </div>
                  <Form onSubmit={this.onSubmit} className="form-container">
                    <Form.Group className="form-group">
                      <Form.Control
                        type="username"
                        placeholder="Insira o username"
                        onChange={this.onChangeusername}
                        value={username}
                        className="input-username"
                      />
                    </Form.Group>
                    <Form.Group className="form-group">
                      <Form.Control
                        type="password"
                        placeholder="Insira a Senha"
                        onChange={this.onChangePassword}
                        value={password}
                        className="input-password"
                      />
                    </Form.Group>
                    <Button type="submit" disabled={loading} className="submit-btn">
                      {loading ? "Entrando..." : "Entrar"}
                    </Button>
                  </Form>
                  <div className="google-login-container submit-btn">
                    <GoogleLogin onSuccess={this.handleGoogleSuccess} onError={this.handleGoogleError} />
                  </div>
                  <p className="footer-text">
                    Não tem conta?{' '}
                    <Link to="/register" className="footer-link">
                      Registrar-se
                    </Link>
                  </p>
                  <p className="footer-text">
                    Esqueceu a senha?{' '}
                    <Link to="/password-email" className="footer-link">
                      Recuperar senha
                    </Link>
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    );
  }
}

export default LoginPage;
