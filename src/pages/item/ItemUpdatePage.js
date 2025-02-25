import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Card, Col } from "react-bootstrap";
import NavlogComponent from "../../components/NavlogComponent";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl } from "../../config";
import { storageUrl } from "../../config";
import { useParams } from "react-router-dom";

const ItemUpdatePage = () => {
  const { id } = useParams(); // Obtém o ID do item da URL
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [itemData, setItemData] = useState({
    image: null,
    name: "",
    description: "",
    price: "",
    type: "", // Campo para tipo do item (ex: ingresso, comida, bebida, etc)
    status: "",
    stock: "",
    availability_start: "",
    availability_end: "",
    discount: "",
    expiration_date: "",
  });

  const [originalData, setOriginalData] = useState({});
  const [imageItemPreview, setImageItemPreview] = useState(null);

  useEffect(() => {
    const fetchItemData = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/item/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setItemData({
          image: response.data.image || null,
          name: response.data.name || "",
          description: response.data.description || "",
          price: response.data.price || "",
          type: response.data.type || "",
          status: response.data.status || "",
          stock: response.data.stock || "",
          availability_start: response.data.availability_start || "",
          availability_end: response.data.availability_end || "",
          discount: response.data.discount || "",
          expiration_date: response.data.expiration_date || "",
        });
        setOriginalData(response.data);
        setImageItemPreview(storageUrl + "/" + response.data.image);
      } catch (error) {
        console.error("Erro ao buscar dados do item:", error);
        Swal.fire({
          title: "Erro",
          text: "Ocorreu um erro ao buscar os dados do item.",
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      }
    };

    fetchItemData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setItemData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };


   const handleImageItemChange = (e) => {
    const file = e.target.files[0];
    handleImageItemChange(file, setImageItemPreview, 150, 150);
    setItemData((prevData) => ({
      ...prevData,
      logo: file,
    }));
  };


  const handleDateChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = new Date(value).toISOString(); // Garantir que a data esteja no formato ISO

    // Validação de Data de Início
    if (name === "availability_start") {
      const currentDate = new Date();
      const startDate = new Date(formattedValue);

      if (startDate < currentDate) {
        Swal.fire({
          title: "Data de Início Inválida",
          text: "A data de início não pode ser anterior à data atual.",
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
        return; // Não atualiza a data
      }
    }

    // Validação de Data de Expiração
    if (name === "expiration_date" || name === "availability_end") {
      const currentDate = new Date();
      const expirationDate = new Date(formattedValue);

      // Verificar se a data de expiração é anterior à data de início
      if (
        name === "expiration_date" &&
        formattedValue < itemData.availability_start
      ) {
        Swal.fire({
          title: "Data de Expiração Inválida",
          text: "A data de expiração não pode ser anterior à data de início.",
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
        return; // Não atualiza a data
      }

      // Verificar se a data de expiração é anterior à data atual
      if (expirationDate < currentDate) {
        Swal.fire({
          title: "Data de Expiração Inválida",
          text: "A data de expiração não pode ser anterior à data atual.",
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
        return; // Não atualiza a data
      }
    }

    // Atualiza a data no estado se for válida
    setItemData((prevData) => ({
      ...prevData,
      [name]: formattedValue,
    }));
  };

  const handleSubmit = async (event) => {
    setIsProcessing(true);
    setMessages(["Aguarde enquanto atualizamos este item..."]);
    event.preventDefault();
  
    const formData = new FormData();
  
    // Adicionando a imagem ao formData
    if (imageItemPreview) {
      try {
        const imageItemBlob = await fetch(imageItemPreview).then((res) => res.blob());
        formData.append("imageItem", imageItemBlob, "imageItem.png");
      } catch (err) {
        console.error("Erro ao converter a imagem do item:", err);
      }
    }
  
    // Adicionando os outros campos ao formData
    Object.keys(itemData).forEach((key) => {
      if (key !== "logo" && itemData[key] !== originalData[key]) {
        formData.append(key, itemData[key]);
      }
    });
  
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      };
  
      const response = await axios.post(`${apiBaseUrl}/item/${id}`, formData, { headers });
      console.log("Response:", response.data); // Verifique a resposta da API
  
      Swal.fire({
        title: "Sucesso!",
        text: "Item atualizado com sucesso!",
        icon: "success",
        confirmButtonText: "OK",    customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
        },
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/item";
        }
      });
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
  
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
          text: "Ocorreu um erro ao tentar atualizar o item. Tente novamente mais tarde.",
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
    <Container>
      <NavlogComponent />
      <Row className="justify-content-center">
        <Col md={12}>
          <Card>
            <Card.Body>
              <p>Editar Item</p>

                   <div className="text-center">
                              <label
                                htmlFor="logoInput"
                                style={{ cursor: "pointer", display: "block" }}
                              >  
                              
                                {imageItemPreview ? (
                                  <img
                                    src={imageItemPreview}
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
                                onChange={handleImageItemChange}
                                style={{ display: "none" }}
                                required
                              />
                  </div>
              <Form onSubmit={handleSubmit}>
      <Row>
        {/* Coluna dos Inputs */}
        <Col md={8}>
          <Row>
            <Col md={4}>
              <Form.Group controlId="name">
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={itemData.name}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="price">
                <Form.Label>Preço</Form.Label>
                <Form.Control
                  type="number"
                  name="price"
                  value={itemData.price}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="type">
                <Form.Label>Tipo</Form.Label>
                <Form.Control
                  type="text"
                  name="type"
                  value={itemData.type}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="status">
                <Form.Label>Status</Form.Label>
                <Form.Control
                  type="text"
                  name="status"
                  value={itemData.status}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="stock">
                <Form.Label>Estoque</Form.Label>
                <Form.Control
                  type="number"
                  name="stock"
                  value={itemData.stock}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="discount">
                <Form.Label>Desconto</Form.Label>
                <Form.Control
                  type="number"
                  name="discount"
                  value={itemData.discount}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="availability_start">
                <Form.Label>Data de Início</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="availability_start"
                  value={itemData.availability_start}
                  onChange={handleDateChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="availability_end">
                <Form.Label>Data de Término</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="availability_end"
                  value={itemData.availability_end}
                  onChange={handleDateChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="expiration_date">
                <Form.Label>Data de Expiração</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="expiration_date"
                  value={itemData.expiration_date}
                  onChange={handleDateChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group controlId="description">
                <Form.Label>Descrição</Form.Label>
                <Form.Control
                  as="textarea"
                  name="description"
                  value={itemData.description}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
        </Col>

        {/* Coluna da Imagem */}
     
      </Row>

      <Button variant="primary" type="submit" disabled={isProcessing} className="mt-3">
        {isProcessing ? 'Atualizando...' : 'Atualizar Item'}
      </Button>

      {messages.length > 0 && (
        <div className="mt-3">
          {messages.map((message, index) => (
            <div key={index} className="alert alert-info">
              {message}
            </div>
          ))}
        </div>
      )}
    </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ItemUpdatePage;
