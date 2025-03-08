import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Card, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";

const ItemUpdatePage = () => {
  const { id } = useParams(); // Obtém o ID do item da URL
  const navigate = useNavigate(); // Hook para navegação
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [itemData, setItemData] = useState({
    image: null,
    name: "",
    type: "",
    price: "",
    stock: "",
    availability_start: "",
    availability_end: "",
    discount: "",
    expiration_date: "",
    description: "",
    category: "",
    subcategory: "",
    brand: "",
    is_featured: false,
    limited_by_user: 0,
    notes: ""
  });
  const [originalData, setOriginalData] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchItemData = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/item/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        // Os dados do item já vêm em response.data
        const data = response.data;
        setItemData({
          image: data.image || null,
          name: data.name || "",
          type: data.type || "",
          price: data.price || "",
          stock: data.stock || "",
          availability_start: data.availability_start || "",
          availability_end: data.availability_end || "",
          discount: data.discount || "",
          expiration_date: data.expiration_date || "",
          description: data.description || "",
          category: data.category || "",
          subcategory: data.subcategory || "",
          brand: data.brand || "",
          is_featured: data.is_featured || false,
          limited_by_user: data.limited_by_user || 0,
          notes: data.notes || ""
        });
        setOriginalData(data);
        if (data.image) {
          setImagePreview(storageUrl + "/" + data.image);
        }
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

  // Função para redimensionar a imagem e atualizar a pré-visualização
  const handleImageResize = (file, setPreview, width, height) => {
    const reader = new FileReader();
    if (!file || !file.type.startsWith("image/")) {
      Swal.fire({
        title: "Formato de imagem inválido",
        text: "Por favor, selecione uma imagem.",
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
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

  const handleItemImageChange = (e) => {
    const file = e.target.files[0];
    handleImageResize(file, setImagePreview, 150, 150);
    setItemData((prevData) => ({
      ...prevData,
      image: file,
    }));
  };

  const handleImageError = (e) => {
    // Define imagem padrão caso ocorra erro
    if (e.target.src.includes("/images/itemdefault.png")) return;
    e.target.src = "/images/itemdefault.png";
  };

  // Validações antes do submit (exceto as de data, que serão tratadas no backend)
  const validateFields = () => {
    const errors = [];

    // Valida preço (valor monetário)
    const price = parseFloat(itemData.price);
    if (isNaN(price) || price < 0) {
      errors.push("O preço deve ser um valor monetário válido.");
    }

    // Valida estoque (número inteiro)
    const stock = parseInt(itemData.stock, 10);
    if (isNaN(stock) || stock < 0) {
      errors.push("O estoque deve ser um número inteiro válido.");
    }

    // Valida desconto (valor monetário)
    const discount = parseFloat(itemData.discount);
    if (isNaN(discount) || discount < 0) {
      errors.push("O desconto deve ser um valor monetário válido.");
    }

    // Valida tipo de item
    if (itemData.type !== "Produto" && itemData.type !== "Serviço") {
      errors.push("O tipo de item deve ser 'Produto' ou 'Serviço'.");
    }

    if (errors.length > 0) {
      Swal.fire({
        title: "Erro de validação",
        text: errors.join("\n"),
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateFields()) {
      return;
    }

    setIsProcessing(true);
    setMessages(["Aguarde enquanto atualizamos o item..."]);

    const formData = new FormData();

    // Adiciona a imagem caso haja nova imagem selecionada
    if (imagePreview && itemData.image && typeof itemData.image !== "string") {
      try {
        const imageBlob = await fetch(imagePreview).then((res) => res.blob());
        formData.append("image", imageBlob, "item.png");
      } catch (err) {
        console.error("Erro ao converter a imagem:", err);
      }
    }

    // Adiciona os demais campos somente se foram alterados
    Object.keys(itemData).forEach((key) => {
      if (key !== "image" && itemData[key] !== originalData[key]) {
        // Converte o booleano is_featured para inteiro (0 ou 1)
        if (key === "is_featured") {
          formData.append(key, itemData[key] ? 1 : 0);
        } else {
          formData.append(key, itemData[key]);
        }
      }
    });

    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      };

      await axios.post(`${apiBaseUrl}/item/${id}`, formData, { headers });
      
      Swal.fire({
        title: "Sucesso!",
        text: "Item atualizado com sucesso!",
        icon: "success",
        confirmButtonText: "OK",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          // Volta para a página anterior
          navigate(-1);
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
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      } else {
        Swal.fire({
          title: "Erro",
          text: "Ocorreu um erro ao tentar atualizar o item. Tente novamente mais tarde.",
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
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
      <p className="labeltitle h2 text-center text-uppercase">Atualizar Item</p>
      <Container>
        {isProcessing ? (
          <ProcessingIndicatorComponent messages={messages} />
        ) : (
          <Card>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={12}>
                    <div className="text-center">
                      <label htmlFor="imageInput" style={{ cursor: "pointer", display: "block" }}>
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Preview da Imagem"
                            className="img-fluid rounded"
                            onError={handleImageError}
                            style={{ margin: "0 auto", display: "block", width: "150px", height: "150px" }}
                          />
                        ) : (
                          <img
                            src="/images/logo.png"
                            alt="Imagem Padrão"
                            className="img-fluid rounded"
                            onError={handleImageError}
                            style={{ margin: "0 auto", display: "block", width: "150px", height: "150px" }}
                          />
                        )}
                      </label>
                      <Button
                        variant="secondary"
                        className="w-50 m-2"
                        onClick={() => document.getElementById("imageInput").click()}
                      >
                        Adicionar imagem
                      </Button>
                      <Form.Control
                        id="imageInput"
                        type="file"
                        accept="image/*"
                        onChange={handleItemImageChange}
                        style={{ display: "none" }}
                      />
                    </div>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="formName">
                      <Form.Label>Nome</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={itemData.name || ""}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="formType">
                      <Form.Label>Tipo</Form.Label>
                      <Form.Control
                        as="select"
                        name="type"
                        value={itemData.type || ""}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Selecione</option>
                        <option value="Produto">Produto</option>
                        <option value="Serviço">Serviço</option>
                      </Form.Control>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="formPrice">
                      <Form.Label>Preço</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="price"
                        value={itemData.price || ""}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="formStock">
                      <Form.Label>Estoque</Form.Label>
                      <Form.Control
                        type="number"
                        name="stock"
                        value={itemData.stock || ""}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="formDiscount">
                      <Form.Label>Desconto</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="discount"
                        value={itemData.discount || ""}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="formAvailabilityStart">
                      <Form.Label>Início</Form.Label>
                      <Form.Control
                        type="date"
                        name="availability_start"
                        value={itemData.availability_start || ""}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="formAvailabilityEnd">
                      <Form.Label>Término</Form.Label>
                      <Form.Control
                        type="date"
                        name="availability_end"
                        value={itemData.availability_end || ""}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="formExpirationDate">
                      <Form.Label>Expiração</Form.Label>
                      <Form.Control
                        type="date"
                        name="expiration_date"
                        value={itemData.expiration_date || ""}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="formCategory">
                      <Form.Label>Categoria</Form.Label>
                      <Form.Control
                        type="text"
                        name="category"
                        value={itemData.category || ""}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="formSubcategory">
                      <Form.Label>Subcategoria</Form.Label>
                      <Form.Control
                        type="text"
                        name="subcategory"
                        value={itemData.subcategory || ""}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="formBrand">
                      <Form.Label>Marca</Form.Label>
                      <Form.Control
                        type="text"
                        name="brand"
                        value={itemData.brand || ""}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group controlId="formDescription">
                      <Form.Label>Descrição</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="description"
                        value={itemData.description || ""}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group controlId="formNotes">
                      <Form.Label>Notas</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="notes"
                        value={itemData.notes || ""}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="text-center">
                  <Button variant="primary m-2" type="submit">
                    Atualizar Item
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

export default ItemUpdatePage;
