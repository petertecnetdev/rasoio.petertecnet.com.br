import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import NavlogComponent from "../../../components/NavlogComponent";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";

import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../../config";

const BarbershopDashboardPage = () => {
  const { slug } = useParams();
  const [formData, setFormData] = useState({
    logo: null,
    background_image: null,
    name: "",
    email: "",
    phone: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
    website: "",
    opening_hours: "",
    facebook: "",
    instagram: "",
  });

  useEffect(() => {
    const fetchBarbershop = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/barbershop/view/${slug}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const barbershop = response.data.barbershop;
        setFormData({
          ...formData,
          ...barbershop,
        });

      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          "Erro ao carregar informações da barbearia.";
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: errorMessage,  customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      }
    };

    fetchBarbershop();
  }, [slug]);

  return (
    <>
      <NavlogComponent />
      <p className="labeltitle h2 text-center text-uppercase">
        {formData.name}
      </p>
      <Container>
      <Card>
  <Card.Body>
    <Row className="d-flex align-items-center justify-content-center">
      {/* Coluna para a imagem, centralizada */}
      <Col md={4} className="d-flex justify-content-center">
        <img
          src={`${storageUrl}/${formData.logo}`}
          className="rounded-circle img-fluid img-logo-barbershop-dashboard m-2"
          alt={formData.name}
          style={{ maxWidth: "150px", height: "auto" }}
        />
      </Col>

      {/* Coluna para os botões, centralizados */}
      <Col md={4} className="d-flex flex-column align-items-center">
      <Link
                            to={`/barber/create/${slug}`}
                            style={{ textDecoration: "none" }}
                             className="danger m-2 w-100"
                          >
                            <Button className="primary mr-2 w-50">
                              Editar
                            </Button>
                          </Link>
        <Button variant="primary m-2 w-50" type="submit">
          Serviços
        </Button>
        <Button variant="primary m-2 w-50" type="submit">
          Produtos
        </Button>
      </Col>     <Col md={4} className="d-flex flex-column align-items-center">
        <Button variant="primary m-2 w-50" type="submit">
        Controle
        </Button>
        <Button variant="primary m-2 w-50" type="submit">
          Agendamentos
        </Button>
        <Button variant="primary m-2 w-50" type="submit">
          Caixa
        </Button>
      </Col>
    </Row>
  </Card.Body>
</Card>

      </Container>
    </>
  );
};

export default BarbershopDashboardPage;
