import React, { useState } from "react";
import { Container, Card, Form, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiBaseUrl } from "../../config";

const ItemCreatePage = () => {
  const [itemData, setItemData] = useState({
    name: "",
    type: "",
    price: "",
    quantity: "",
    image: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setItemData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleImageChange = (e) => {
    setItemData((prevData) => ({ ...prevData, image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", itemData.name);
    formData.append("type", itemData.type);
    formData.append("price", itemData.price);
    formData.append("quantity", itemData.quantity);
    if (itemData.image) {
      formData.append("image", itemData.image);
    }

    try {
      setIsProcessing(true);

      await axios.post(`${apiBaseUrl}/items`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.fire({
        icon: "success",
        title: "Item Criado!",
        text: "O item foi criado com sucesso.",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });

      navigate("/items");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Erro ao criar o item.";
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: errorMessage,
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <ProcessingIndicatorComponent
        messages={[
          "Enviando dados...",
          "Salvando informações...",
          "Quase lá, aguarde um instante...",
        ]}
      />
    );
  }

  return (
    <Container className="py-4">
      <Card className="shadow-sm">
        <Card.Body>
          <h4 className="mb-4">Criar Novo Item</h4>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nome do Item</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={itemData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo</Form.Label>
              <Form.Control
                type="text"
                name="type"
                value={itemData.type}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Preço</Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={itemData.price}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Quantidade</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={itemData.quantity}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Imagem</Form.Label>
              <Form.Control
                type="file"
                onChange={handleImageChange}
                accept="image/*"
              />
            </Form.Group>
            <Button type="submit" variant="primary" className="w-100">
              Criar Item
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ItemCreatePage;
