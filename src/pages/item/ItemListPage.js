import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";
import Swal from "sweetalert2";
import { Link, useParams } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

const ItemListPage = () => {
  const { slug } = useParams();
  const [barbershop, setBarbershop] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarbershop = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${apiBaseUrl}/barbershop/view/${slug}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setBarbershop(response.data.barbershop);
        setItems(response.data.items);
        window.scrollTo(0, 0);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text:
            error.response?.data?.error ||
            "Erro ao carregar informações da barbearia.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBarbershop();
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
    Swal.fire({
      title: "Tem certeza?",
      text: "Você realmente deseja excluir este item?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "custom-swal",
        title: "custom-swal-title",
        content: "custom-swal-text",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(`${apiBaseUrl}/item/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          setItems(items.filter((item) => item.id !== id));
          Swal.fire("Deletado!", response.data.message, "success");
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Erro!",
            text:
              error.response?.data?.error || "Erro ao excluir o item.",
            customClass: {
              popup: "custom-swal",
              title: "custom-swal-title",
              content: "custom-swal-text",
            },
          });
        }
      }
    });
  };

  return (
    <>
      <NavlogComponent />

      <Container>
        <Row className="text-center">
          
          <Col md={12}>
            {barbershop && (
              <>
                <p className="labeltitle text-uppercase">{barbershop.name}</p>
                <Link
                  to={`/barbershop/view/${barbershop.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <img
                    src={
                      barbershop.logo
                        ? `${storageUrl}/${barbershop.logo}`
                        : "/images/barbershoplogo.png"
                    }
                    alt={barbershop.name}
                    className="rounded-circle mb-3"
                    style={{
                      height: "50px",
                      width: "50px",
                      objectFit: "cover",
                    }}
                  />
                </Link>
              </>
            )}
          </Col>
        </Row>

        {loading ? (
          <ProcessingIndicatorComponent
            messages={[
              "Carregando itens da barbearia...",
              "Quase pronto! Apenas um momento.",
            ]}
          />
        ) : (
          <Row>
            {items.length === 0 ? (
              <Col xs={12} className="text-center">
                <p>Nenhum item encontrado.</p>
              </Col>
            ) : (
              items.map((item) => (
                <Col key={item.id} md={3} sm={6} xs={12} className="mb-4">
                  <Card className="text-center shadow-sm p-3">
                    <Link to={`/item/view/${item.slug}`} className="text-dark">
                      <img
                        src={getItemImage(item)}
                        alt={item.name}
                        className="item-image"
                        onError={handleImageError}
                        style={{
                          maxHeight: "150px",
                          objectFit: "cover",
                        }}
                      />
                    </Link>
                    <Card.Body>
                      <p className="text-white">{item.name}</p>
                      <p className="text-white">R${item.price}</p>
                      <div className="d-flex justify-content-between">
                        <Link to={`/item/update/${item.id}`}>
                          <Button variant="warning" size="sm">Editar</Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          Deletar
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        )}
      </Container>
    </>
  );
};

export default ItemListPage;
