import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Card, Col } from "react-bootstrap";
import NavlogComponent from "../../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../../components/ProcessingIndicatorComponent";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl } from "../../../config";
import { storageUrl } from "../../../config";
import { useParams } from "react-router-dom";

const BarbershopUpdatePage = () => {
  const { id } = useParams(); // Obtém o ID da barbearia da URL
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [barbershopData, setBarbershopData] = useState({
    logo: null,
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

  const [originalData, setOriginalData] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  useEffect(() => {
    const fetchBarbershopData = async () => {
      try {
        const response = await axios.get(
          `${apiBaseUrl}/barbershop/show/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setBarbershopData({
          logo: response.data.barbershop.logo || null,
          name: response.data.barbershop.name || "",
          email: response.data.barbershop.email || "",
          address: response.data.barbershop.address || "",
          city: response.data.barbershop.city || "",
          description: response.data.barbershop.description || "",
          phone: response.data.barbershop.phone || "",
          state: response.data.barbershop.state || "",
          zipcode: response.data.barbershop.zipcode || "",
          website: response.data.barbershop.website || "",
          facebook: response.data.barbershop.facebook || "",
          instagram: response.data.barbershop.instagram || "",
          location: response.data.barbershop.location || "",
        });
        setOriginalData(response.data.barbershop);
        setLogoPreview(storageUrl + "/" + response.data.barbershop.logo);
      } catch (error) {
        console.error("Erro ao buscar dados da barbearia:", error);
        Swal.fire({
          title: "Erro",
          text: "Ocorreu um erro ao buscar os dados da barbearia.",
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: 'custom-swal',
            title: 'custom-swal-title',
            content: 'custom-swal-text',
          },
        });
      }
    };
  
    fetchBarbershopData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBarbershopData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImageChange = (file, setPreview, width, height) => {
    const reader = new FileReader();

    if (!file || !file.type.startsWith("image/")) {
      Swal.fire({
        title: "Formato de imagem inválido",
        text: "Por favor, selecione uma imagem.",
        icon: "error",
        confirmButtonText: "OK",    customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
        },
      });
      return;
    }

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
    setMessages(["Aguarde enquanto atualizamos sua barbearia..."]);
    event.preventDefault();
  
    const formData = new FormData();
  
    // Adicionando a logo ao formData
    if (logoPreview) {
      try {
        const logoBlob = await fetch(logoPreview).then((res) => res.blob());
        formData.append("logo", logoBlob, "logo.png");
      } catch (err) {
        console.error("Erro ao converter a imagem da logo:", err);
      }
    }
  
    // Adicionando os outros campos ao formData
    Object.keys(barbershopData).forEach((key) => {
      if (key !== "logo" && barbershopData[key] !== originalData[key]) {
        formData.append(key, barbershopData[key]);
      }
    });
  
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      };
  
      const response = await axios.post(`${apiBaseUrl}/barbershop/${id}`, formData, { headers });
      console.log("Response:", response.data); // Verifique a resposta da API
  
      Swal.fire({
        title: "Sucesso!",
        text: "Barbearia atualizada com sucesso!",
        icon: "success",
        confirmButtonText: "OK",    customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
        },
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/barbershop";
        }
      });
    } catch (error) {
      console.error("Erro ao atualizar barbearia:", error);
  
      if (error.response && error.response.status === 422) {
        const validationErrors = error.response.data.errors;
        let errorMessage = "Os seguintes campos têm erros:\n";
  
        for (const field in validationErrors) {
          errorMessage += `${field}: ${validationErrors[field].join(", ")}\n`;
        }
  
        Swal.fire({
          title: "Validação Falhou",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "OK",    customClass: {
            popup: 'custom-swal',
            title: 'custom-swal-title',
            content: 'custom-swal-text',
          },
        });
      } else {
        Swal.fire({
          title: "Erro",
          text: "Ocorreu um erro ao tentar atualizar a barbearia. Tente novamente mais tarde.",
          icon: "error",
          confirmButtonText: "OK",    customClass: {
            popup: 'custom-swal',
            title: 'custom-swal-title',
            content: 'custom-swal-text',
          },
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };
  

  return (
    <>
      <NavlogComponent />
      <p className="labeltitle h2 text-center text-uppercase">
        Atualizar Barbearia
      </p>
      <Container>
        {isProcessing ? (
          <ProcessingIndicatorComponent messages={messages} />
        ) : (
          <Card>
          <Card.Body>
         
            <Form onSubmit={handleSubmit}>
              <Row>
              <Col md={12}>
              <Col md={12}>   <div className="text-center">
            <label
              htmlFor="logoInput"
              style={{ cursor: "pointer", display: "block" }}
            >  
            
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Preview da Logo"
                  className="img-fluid rounded-circle img-user-avatar"
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
</div></Col>
              <Col md={4}>
                  <Form.Group controlId="formName">
                    <Form.Label>Nome</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={barbershopData.name || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="formEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={barbershopData.email || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="formPhone">
                    <Form.Label>Telefone</Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={barbershopData.phone || ""}
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
                      value={barbershopData.city || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="formAddress">
                    <Form.Label>Endereço</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={barbershopData.address || ""}
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
                      value={barbershopData.zipcode || ""}
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
                      value={barbershopData.state || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                
              <Col md={12}>
                  <Form.Group controlId="formState">
                    <Form.Label>URL Google Maps</Form.Label>
                    <Form.Control
                      type="text"
                      name="location"
                      value={barbershopData.location || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="formWebsite">
                    <Form.Label>Website</Form.Label>
                    <Form.Control
                      type="text"
                      name="website"
                      value={barbershopData.website || ""}
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
                      value={barbershopData.facebook || ""}
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
                      value={barbershopData.instagram || ""}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="formDescription">
                    <Form.Label>Descrição</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={barbershopData.description || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                  </Col>
                  </Col>
              </Row>
              <div className="text-center">
              <Button variant="primary m-2" type="submit">
              Atualizar Barbearia
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

export default BarbershopUpdatePage;

