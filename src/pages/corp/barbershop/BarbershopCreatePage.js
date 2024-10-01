import React, { useState } from "react";
import { Form, Button, Container, Row, Col, Card } from "react-bootstrap";
import Swal from "sweetalert2";
import barbershopService from "../../../services/BarbershopService";
import NavlogComponent from "../../../components/NavlogComponent";
import LoadingComponent from "../../../components/LoadingComponent";

const BarbershopCreatePage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
    website: "",
    latitude: "",
    longitude: "",
    status: 1,
    logo: null,
    background_image: null,
    social_media_links: null,
  });

  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      logo: file,
    });

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 150;
        canvas.height = 150;
        ctx.drawImage(img, 0, 0, 150, 150);
        const resizedDataURL = canvas.toDataURL("image/png");
        setLogoPreview(resizedDataURL);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleBackgroundChange = (e) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      background: file,
    });

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 1920;
        canvas.height = 600;
        ctx.drawImage(img, 0, 0, 1920, 600);
        const resizedDataURL = canvas.toDataURL("image/png");
        setBackgroundPreview(resizedDataURL);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });

    try {
      const response = await barbershopService.store(formDataToSend);
      Swal.fire({
        icon: "success",
        title: "Sucesso!",
        text: response.data.message ,
        timer: 5000,
        showConfirmButton: false,
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || " SPA Erro ao criar a barbearia. Por favor, tente novamente.";
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <>
      <NavlogComponent />
      <p className="labeltitle h2 text-center text-uppercase">Adicionar nova barbearia</p>

      <label htmlFor="backgroundInput" style={{ cursor: "pointer", display: "block" }}>
        {backgroundPreview ? (
          <img src={backgroundPreview} alt="Preview da Background" className="img-fluid img-background-barbershop" />
        ) : (
          <img src="/images/barbershopbackground.png" alt="Preview da Background" className="img-fluid img-background-barbershop" />
        )}
      </label>
      <Form.Control
        id="backgroundInput"
        type="file"
        accept="image/*"
        onChange={handleBackgroundChange}
        style={{ display: "none" }}
        required
      />

      <label htmlFor="logoInput" style={{ cursor: "pointer", display: "block" }}>
        {logoPreview ? (
          <img src={logoPreview} alt="Preview da Logo" className="img-fluid rounded-circle img-logo-barbershop" />
        ) : (
          <img src="/images/barbershoplogo.png" alt="Preview da Logo" className="img-fluid rounded-circle img-logo-barbershop" />
        )}
      </label>
      <Form.Control
        id="logoInput"
        type="file"
        accept="image/*"
        onChange={handleLogoChange}
        style={{ display: "none" }}
        required
      />

      <Container>
        <Row className="justify-content-md-center">
          <Col md={12}>
            <Card>
              <p className="labeltitle h4 text-center text-uppercase">Informações básicas</p>
              <Row>
                <Col md={6} className="mt-2">
                  <Form.Group controlId="formName">
                    <Form.Control
                      type="text"
                      name="name"
                      placeholder="Digite o nome da barbearia"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="mt-3"
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mt-2">
                  <Form.Group controlId="formEmail">
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="mt-3"
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mt-2">
                  <Form.Group controlId="formPhone">
                    <Form.Control
                      type="text"
                      name="phone"
                      placeholder="Telefone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="mt-3"
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mt-2">
                  <Form.Group controlId="formAddress">
                    <Form.Control
                      type="text"
                      name="address"
                      placeholder="Endereço"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="mt-3"
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mt-2">
                  <Form.Group controlId="formCity">
                    <Form.Control
                      type="text"
                      name="city"
                      placeholder="Cidade"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="mt-3"
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mt-2">
                  <Form.Group controlId="formState">
                    <Form.Control
                      type="text"
                      name="state"
                      placeholder="Estado"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="mt-3"
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mt-2">
                  <Form.Group controlId="formZipcode">
                    <Form.Control
                      type="text"
                      name="zipcode"
                      placeholder="CEP"
                      value={formData.zipcode}
                      onChange={handleInputChange}
                      required
                      className="mt-3"
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mt-2">
                  <Form.Group controlId="formWebsite">
                    <Form.Control
                      type="text"
                      name="website"
                      placeholder="Website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="mt-3"
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mt-2">
                  <Form.Group controlId="formLatitude">
                    <Form.Control
                      type="number"
                      name="latitude"
                      placeholder="Latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      className="mt-3"
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mt-2">
                  <Form.Group controlId="formLongitude">
                    <Form.Control
                      type="number"
                      name="longitude"
                      placeholder="Longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      className="mt-3"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Row className="justify-content-md-center mt-4">
          <Col md={6}>
            <Button variant="success" type="submit" onClick={handleSubmit} className="w-100">
              Criar Barbearia
            </Button>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default BarbershopCreatePage;
