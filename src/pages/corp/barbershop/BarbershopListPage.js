import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import NavlogComponent from "../../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../../components/ProcessingIndicatorComponent";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../../config";

const BarbershopListPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [barbershops, setBarbershops] = useState([]);

  const fetchBarbershops = async () => {
    setMessages(["Carregando barbearias..."]);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      };

      const response = await axios.get(`${apiBaseUrl}/barbershop/user`, {
        headers,
      });

      setBarbershops(response.data.barbershops.data);
    } catch (error) {
      console.error("Erro ao carregar barbearias:", error.response?.data);
      setMessages([
        "Ocorreu um erro ao carregar as barbearias. Tente novamente mais tarde.",
      ]);
      Swal.fire({
        title: "Erro",
        text:
          error.response?.data?.error ||
          "Não foi possível carregar as barbearias. Tente novamente mais tarde.",
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
    fetchBarbershops();
  }, []);

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Você tem certeza?",
        text: "Esta ação não pode ser desfeita!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, deletar!",
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

        // Requisição de deleção para a API
        await axios.delete(`${apiBaseUrl}/barbershop/${id}`, { headers });

        Swal.fire({
          title: "Deletado!",
          text: "A barbearia foi deletada com sucesso.",
          icon: "success",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });

        // Atualiza a lista de barbearias removendo a barbearia deletada
        setBarbershops(
          barbershops.filter((barbershop) => barbershop.id !== id)
        );
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao deletar barbearia.",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
    }
  };
  const handleBarbershopLogoError = (e) => {
    e.target.src = "images/logo.png";
  };

  return (
    <>
      <NavlogComponent />
      <Container>
        <Row className="">
          <Col>
            <p className="labellight text-center ">Minhas barbearias</p>
            {isLoading ? (
              <ProcessingIndicatorComponent messages={messages} />
            ) : (
              <>
                <Link to={`/barbershop/create`}>
                  <Button className="btn btn-primary w-50">
                    Cadastrar nova barbearia
                  </Button>
                </Link>

                {barbershops.map((barbershop) => (
                  <Col md={12} key={barbershop.id} className="">
                    <Card className="card-barbershop-show p-4">
                      <Row>
                        <Col md={4} className="">
                          <div
                            className="background-image"
                            style={{
                              backgroundImage: `url('${storageUrl}/${
                                barbershop.logo || "images/logo.png"
                              }')`,
                            }}
                          />
                          <Link
                            to={`/barbershop/view/${barbershop.slug}`}
                            style={{ textDecoration: "none" }}
                          >
                            <img
                              src={`${storageUrl}/${
                                barbershop.logo || "images/logo.png"
                              }`}
                              className="rounded-circle img-logo-barbershop-show"
                              style={{
                                margin: "0 auto",
                                display: "block",
                                width: "60px", // Define o tamanho menor para a logo
                                height: "60px", // Define o tamanho menor para a logo
                              }}
                              alt={barbershop.name}
                              onError={handleBarbershopLogoError}
                            />
                          </Link>
                        </Col>

                        <Col md={6} className="">
                          <Link
                            to={`/barber/include/${barbershop.slug}`}
                            style={{ textDecoration: "none" }}
                            className=" m-2 w-100"
                          >
                            <Button className="primary m-1 ">Barbeiros</Button>
                          </Link>
                          <Link
                            to={`/item/list/${barbershop.slug}`}
                            style={{ textDecoration: "none" }}
                            className=" m-2 w-100"
                          >
                            <Button className="primary m-1 ">Itens</Button>
                          </Link>
                          <Link
                            to={`/scheduling/list/${barbershop.slug}`}
                            style={{ textDecoration: "none" }}
                            className=" m-2 w-100"
                          >
                            <Button className="primary m-1 ">
                              Agendamentos
                            </Button>
                          </Link>{" "}
                          <Link
                            to={`/barbershop/update/${barbershop.id}`}
                            style={{ textDecoration: "none" }}
                            className=" m-2 w-100"
                          >
                            <Button className="primary m-1 ">Editar</Button>
                          </Link>{" "}
                          <Link
                            onClick={() => handleDelete(barbershop.id)}
                            style={{ textDecoration: "none" }}
                            className=" m-2 w-100 "
                          >
                            <Button className="bg-danger primary m-1 ">
                              {" "}
                              Deletar{" "}
                            </Button>
                          </Link>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                ))}
              </>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default BarbershopListPage;
