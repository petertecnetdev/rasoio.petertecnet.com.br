import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiBaseUrl, storageUrl } from "../../config";

const ItemListPage = () => {
  const { slug } = useParams();
  const [barbershop, setBarbershop] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  // Formata a data para o padrão brasileiro (dd/mm/yyyy)
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  // Verifica se o item está disponível (se a data atual está entre o início e fim da disponibilidade)
  const isItemAvailable = (item) => {
    if (!item.availability_start || !item.availability_end) return true;
    const now = new Date();
    const start = new Date(item.availability_start);
    const end = new Date(item.availability_end);
    return now >= start && now <= end;
  };

  const fetchBarbershopAndItems = async () => {
    setMessages(["Carregando itens da barbearia..."]);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      };

      const response = await axios.get(`${apiBaseUrl}/barbershop/view/${slug}`, { headers });
      setBarbershop(response.data.barbershop);
      setItems(response.data.items);
    } catch (error) {
      console.error("Erro ao carregar itens:", error.response?.data);
      Swal.fire({
        title: "Erro",
        text: error.response?.data?.error || "Erro ao carregar informações da barbearia.",
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbershopAndItems();
  }, [slug]);

  const handleImageError = (e) => {
    e.target.src = "/images/user.png";
  };

  const getItemImage = (item) => {
    if (item.image) {
      return `${storageUrl}/${item.image}`;
    }
    if (barbershop?.logo) {
      return `${storageUrl}/${barbershop.logo}`;
    }
    return "/images/user.png";
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Tem certeza?",
        text: "Você realmente deseja excluir este item?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, excluir!",
        cancelButtonText: "Cancelar",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        await axios.delete(`${apiBaseUrl}/item/${id}`, { headers });

        Swal.fire({
          title: "Deletado!",
          text: "O item foi deletado com sucesso.",
          icon: "success",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });

        setItems(items.filter((item) => item.id !== id));
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: error.response?.data?.error || "Erro ao excluir o item.",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
    }
  };

  return (
    <>
      <NavlogComponent />
      <Container>
        <Row>
          <Col>
            {barbershop && (
              <>
                <p className="labellight text-center">Itens de {barbershop.name}</p>
                <Link to={`/item/create/${barbershop.slug}`}>
                  <Button className="btn btn-primary w-50">Cadastrar novo item</Button>
                </Link>
              </>
            )}
            {isLoading ? (
              <ProcessingIndicatorComponent messages={messages} />
            ) : (
              <>
                {items.length === 0 ? (
                  <p className="text-center">Nenhum item encontrado.</p>
                ) : (
                  <Row>
                    {items.map((item) => (
                      <Col md={3}  key={item.id} className="m-4">
                        <Card
                          className="card-barbershop-show"
                          style={{
                            // Se o período de disponibilidade não incluir a data atual, o card fica amarelo
                            backgroundColor: isItemAvailable(item) ? "" : "#fff3cd",
                          }}
                        >
                          <Link to={`/item/view/${item.slug}`} style={{ textDecoration: "none" }}>
                            <Card.Img
                              variant="top"
                              src={getItemImage(item)}
                              onError={handleImageError}
                              style={{ height: "200px", objectFit: "cover" }}
                            />
                          </Link>
                          <Card.Body className="p-2">
                          <p className="labellight text-center">{item.name}</p>
                            <p className="text-white mb-1">
                              <strong>Preço:</strong> R${item.price}
                            </p>
                            <p className="text-white mb-1">
                              <strong>Tipo:</strong> {item.type === "produto" ? "Produto" : "Serviço"}
                            </p>
                            <p className="text-white mb-1">
                              <strong>Categoria:</strong> {item.category} / {item.subcategory}
                            </p>
                            <p className="text-white mb-1">
                              <strong>Marca:</strong> {item.brand}
                            </p>
                            <p className="text-white mb-1">
                              <strong>Disponível:</strong> {formatDate(item.availability_start)} - {formatDate(item.availability_end)}
                            </p>
                            <div className="d-flex justify-content-between mt-2">
                              <Link to={`/item/update/${item.id}`} style={{ textDecoration: "none" }} className="w-50 me-1">
                                <Button className="primary w-100">Editar</Button>
                              </Link>
                              <Link onClick={() => handleDelete(item.id)} style={{ textDecoration: "none" }} className="w-50 ms-1">
                                <Button className="bg-danger primary w-100">Deletar</Button>
                              </Link>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ItemListPage;
