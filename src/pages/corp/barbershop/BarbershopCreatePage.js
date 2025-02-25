  import React, { useState } from "react";
  import { Form, Button, Container, Row, Card, Col } from "react-bootstrap";
  import NavlogComponent from "../../../components/NavlogComponent";

  import ProcessingIndicatorComponent from '../../../components/ProcessingIndicatorComponent';
  import Swal from "sweetalert2";
  import axios from "axios";
  import { apiBaseUrl } from "../../../config";

  const BarbershopCreatePage = () => {
   
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]); // Inicializa o estado 'messages'
    const [barbershopData, setBarbershopData] = useState({
      logo: null,
      background_image: null,
      name: "",
      email: "",
      address: "",
      city: "",
      description: "",
      phone: "",
      state: "",
      zipcode: "",
      website: "",
      facebook: "",
      instagram: "",
      location: "",
    });

    const [logoPreview, setLogoPreview] = useState(null);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setBarbershopData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    };

    const handleImageChange = (file, setPreview, width, height) => {

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

    const handleLogoChange = (e) => {
      const file = e.target.files[0];
      handleImageChange(file, setLogoPreview, 150, 150);
      setBarbershopData((prevData) => ({
        ...prevData,
        logo: file,
      }));
    };


    const handleSubmit = async (event) => {
      setIsProcessing(true);
      setMessages(['Aguarde enquanto cadastramos sua barbearia...',]);
      event.preventDefault();

      const formData = new FormData();
      setMessages(['Verificando logo enviada']);
      if (barbershopData.logo) {
        formData.append("logo", barbershopData.logo);
      }
      if (barbershopData.background_image) {
        formData.append("background_image", barbershopData.background_image);
      }

      // Adiciona os campos de texto ao FormData
      Object.keys(barbershopData).forEach((key) => {
        if (key !== "logo" && key !== "background_image") {
          formData.append(key, barbershopData[key]);
        }
      });

      try {
        
      setMessages(['Enviando dados']);
        const headers = {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        };

        await axios.post(`${apiBaseUrl}/barbershop`, formData, { headers });
        Swal.fire({
          title: "Sucesso!",
          text: "Barbearia criada com sucesso!",
          icon: "success",
          confirmButtonText: "OK",
          customClass: {
            popup: 'custom-swal',
            title: 'custom-swal-title',
            content: 'custom-swal-text',
          },
        }).then((result) => {
          if (result.isConfirmed) {
            // Redireciona para a dashboard após clicar em "OK"
            window.location.href = "/barbershop";
          }
        });
        
      } catch (error) {
        console.error("Erro ao criar barbearia:", error);

        if (error.response && error.response.status === 422) {
          const validationErrors = error.response.data.errors;
          let errorMessage = "";

          for (const field in validationErrors) {
            errorMessage += ` ${validationErrors[field].join(", ")}\n`;
          }

          Swal.fire({
            title: "Ups",
            text: errorMessage,
            icon: "error",
            confirmButtonText: "OK", customClass: {
              popup: 'custom-swal',
              title: 'custom-swal-title',
              content: 'custom-swal-text',
            },
          });
        } else {
          Swal.fire({
            title: "Erro",
            text: "Ocorreu um erro ao tentar criar a barbearia. Tente novamente mais tarde.",
            icon: "error",
            confirmButtonText: "OK", customClass: {
              popup: 'custom-swal',
              title: 'custom-swal-title',
              content: 'custom-swal-text',
            },
          });
        }
      }
    };

    return (
      <>
        <NavlogComponent />
        <p className="labeltitle h2 text-center text-uppercase">
          Criar Barbearia
        </p>
        <Container>
        {isProcessing ? (
          <ProcessingIndicatorComponent messages={messages} />
        ) :(
          <Card>
            <Card.Body>
              <div className="text-center">
              <label
                htmlFor="logoInput"
                style={{ cursor: "pointer", display: "block" }}
              >  
              
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Preview da Logo"
                    className="img-fluid rounded-circle img-logo-barbershop"
                  />
                ) : (
                  <img
                    src="/images/barbershoplogo.png"
                    alt="Preview da Logo"
                    className="img-fluid rounded-circle img-logo-barbershop"
                  />
                )}
              </label>
              <Button
                      variant="secondary"
                      className="w-50 m-2"
                      onClick={() =>
                        document.getElementById("logoInput").click()
                      }
                    >
                      Adicionar logo
                    </Button>
              <Form.Control
                id="logoInput"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ display: "none" }}
                required
              />
  </div>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={3}>
                    <Form.Group controlId="formName">
                      <Form.Label>Nome</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={barbershopData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="formEmail">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={barbershopData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="formPhone">
                      <Form.Label>Telefone</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={barbershopData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="formCity">
                      <Form.Label>Cidade</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={barbershopData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group controlId="formAddress">
                      <Form.Label>Endereço</Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={barbershopData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="formZipcode">
                      <Form.Label>CEP</Form.Label>
                      <Form.Control
                        type="text"
                        name="zipcode"
                        value={barbershopData.zipcode}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="formState">
                      <Form.Label>UF</Form.Label>
                      <Form.Control
                        type="text"
                        name="state"
                        value={barbershopData.state}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                <Col md={4}>
                    <Form.Group controlId="formWebsite">
                      <Form.Label>Localização</Form.Label>
                      <Form.Control
                        type="text"
                        name="location"
                        value={barbershopData.location}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group controlId="formWebsite">
                      <Form.Label>Website</Form.Label>
                      <Form.Control
                        type="text"
                        name="website"
                        value={barbershopData.website}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="formFacebook">
                      <Form.Label>Facebook</Form.Label>
                      <Form.Control
                        type="text"
                        name="facebook"
                        value={barbershopData.facebook}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="formInstagram">
                      <Form.Label>Instagram</Form.Label>

                      <Form.Control
                        type="text"
                        name="instagram"
                        value={barbershopData.instagram}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Form.Group controlId="formDescription">
                      <Form.Label>Descrição</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="description"
                        value={barbershopData.description}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="text-center">
                <Button variant="primary m-2" type="submit">
                  Incluir nova Barbearia
                </Button>
                </div>
                </Form>
            </Card.Body>
          </Card>
        )}
      </Container>
    </>
  );
};

  export default BarbershopCreatePage;
