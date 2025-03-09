import React, { useState } from "react";
import { Form, Button, Container, Row, Card, Col } from "react-bootstrap";
import NavlogComponent from "../../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../../components/ProcessingIndicatorComponent";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl } from "../../../config";

const BarberCreatePage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [barberData, setBarberData] = useState({
    avatar: null,
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    description: "",
    facebook: "",
    instagram: "",
  });

  const [avatarPreview, setAvatarPreview] = useState(null);

  // Função para lidar com mudança de valor nos inputs de texto
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBarberData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Função genérica para redimensionar a imagem e exibir preview
  const handleImageChange = (file, setPreview, width, height) => {
    if (!file || !file.type.startsWith("image/")) {
      Swal.fire({
        title: "Formato de imagem inválido",
        text: "Por favor, selecione uma imagem.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataURL = canvas.toDataURL("image/png");
        setPreview(resizedDataURL);
      };
    };
    reader.readAsDataURL(file);
  };

  // Função para lidar com a escolha de avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    handleImageChange(file, setAvatarPreview, 150, 150);
    setBarberData((prevData) => ({
      ...prevData,
      avatar: file,
    }));
  };

  // Função para submeter o formulário
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsProcessing(true);
    setMessages(["Aguarde enquanto cadastramos seu barbeiro..."]);

    const formData = new FormData();
    // Adicionando avatar se existir
    if (barberData.avatar) {
      formData.append("avatar", barberData.avatar);
    }

    // Adicionando demais campos de texto
    Object.keys(barberData).forEach((key) => {
      if (key !== "avatar") {
        formData.append(key, barberData[key]);
      }
    });

    try {
      setMessages(["Enviando dados"]);
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      };

      await axios.post(`${apiBaseUrl}/barber`, formData, { headers });
      Swal.fire({
        title: "Sucesso!",
        text: "Barbeiro criado com sucesso!",
        icon: "success",
        confirmButtonText: "OK",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/barber";
        }
      });
    } catch (error) {
      console.error("Erro ao criar barbeiro:", error);

      if (error.response && error.response.status === 422) {
        const validationErrors = error.response.data.errors;
        let errorMessage = "";

        for (const field in validationErrors) {
          errorMessage += `${validationErrors[field].join(", ")}\n`;
        }

        Swal.fire({
          title: "Ups",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "OK",
        });
      } else {
        Swal.fire({
          title: "Erro",
          text: "Ocorreu um erro ao tentar criar o barbeiro. Tente novamente mais tarde.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <NavlogComponent />
      <Container className="main-container" fluid>
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="section-col">
            <Card className="card-component shadow-sm">
              <p className="section-title text-center">Criar Barbeiro</p>
              <Card.Body className="card-body">
                {isProcessing ? (
                  <Col xs={12} className="loading-section">
                    <ProcessingIndicatorComponent messages={messages} />
                  </Col>
                ) : (
                  <>
                    {/* Avatar Preview e Upload */}
                    <div className="text-center mb-4">
                      <label htmlFor="avatarInput" style={{ cursor: "pointer" }}>
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Preview do Avatar"
                            className="img-component"
                          />
                        ) : (
                          <img
                            src="/images/user.png"
                            alt="Preview do Avatar"
                            className="img-component"
                          />
                        )}
                      </label>
                      <div className="mt-3">
                        <Button
                          variant="secondary"
                          className="action-button"
                          onClick={() => document.getElementById("avatarInput").click()}
                        >
                          Adicionar Avatar
                        </Button>
                      </div>
                      <Form.Control
                        id="avatarInput"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        style={{ display: "none" }}
                      />
                    </div>

                    <Form onSubmit={handleSubmit}>
                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Group controlId="formFirstName">
                            <Form.Label>Primeiro Nome</Form.Label>
                            <Form.Control
                              type="text"
                              name="first_name"
                              value={barberData.first_name}
                              onChange={handleInputChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Group controlId="formLastName">
                            <Form.Label>Último Nome</Form.Label>
                            <Form.Control
                              type="text"
                              name="last_name"
                              value={barberData.last_name}
                              onChange={handleInputChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={4} className="mb-3">
                          <Form.Group controlId="formEmail">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={barberData.email}
                              onChange={handleInputChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Group controlId="formPhone">
                            <Form.Label>Telefone</Form.Label>
                            <Form.Control
                              type="text"
                              name="phone"
                              value={barberData.phone}
                              onChange={handleInputChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Group controlId="formDescription">
                            <Form.Label>Descrição</Form.Label>
                            <Form.Control
                              type="text"
                              name="description"
                              value={barberData.description}
                              onChange={handleInputChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Group controlId="formFacebook">
                            <Form.Label>Facebook</Form.Label>
                            <Form.Control
                              type="text"
                              name="facebook"
                              value={barberData.facebook}
                              onChange={handleInputChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Group controlId="formInstagram">
                            <Form.Label>Instagram</Form.Label>
                            <Form.Control
                              type="text"
                              name="instagram"
                              value={barberData.instagram}
                              onChange={handleInputChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="text-center">
                        <Button variant="primary" type="submit" className="action-button">
                          Incluir novo Barbeiro
                        </Button>
                      </div>
                    </Form>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default BarberCreatePage;
