import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

const BarberViewPage = () => {
  const { username } = useParams();
  const [barber, setBarber] = useState(null);
  const [user, setUser] = useState(null);
  const [barbershops, setBarbershops] = useState([]);

  useEffect(() => {
    const fetchBarberData = async () => {
      if (!username) {
        Swal.fire({
          title: "Erro",
          text: "O username não foi encontrado na URL.",
          icon: "error",
        });
        return;
      }

      try {
        const response = await axios.get(`${apiBaseUrl}/barber/${username}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const { barber, user } = response.data;

        setBarber(barber || {});
        setUser(user || {});
        setBarbershops(barber.barbershops || []);
      } catch (error) {
        console.error(error.response?.data);
        Swal.fire({
          title: "Erro",
          text: error.response?.data?.error || "Erro ao carregar os dados.",
          icon: "error",
        });
      }
    };

    fetchBarberData();
  }, [username]);

  const calculateAge = (birthdate) => {
    if (!birthdate) return "Não disponível";
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  
  const handleBarberAvatarError = (e) => {
    if (e.target.src.includes("/images/user.png")) return;
    e.target.src = "/images/user.png";
  };

  return (
    <>
      <NavlogComponent />
      <Container>
        <Col md={12}>
          {barber && user ? (
            <>
              <Row className="text-center">
                <Col xs={12} sm={12} md={12}>
                  <Card>
                    <Card.Body>
                      <Row>
                        <Col md={3}>
                     
                          <img
                            src={
                              user.avatar
                                ? `${storageUrl}/${user.avatar}`
                                : "/images/user.png"
                            }
                            className="rounded-circle img-logo-barber-show"
                            onError={handleBarberAvatarError}
                            style={{ margin: "0 auto", display: "block" }}
                            alt={user.first_name}
                          />   <p className="labeltitle h6 text-center text-uppercase">
                          {user.first_name}
                        </p>  <p className=" h6 mt-4 text-center text-uppercase">
                          {user.city} -  {user.uf}
                          </p>  
                        </Col>
                        <Col md={3}></Col>
                        <Col md={3}>
                          <Button
                            variant="primary w-100 m-2"
                            onClick={() => {
                              const whatsappURL = `https://wa.me/${user.phone}?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20seus%20serviços%20.`;
                              window.open(whatsappURL, "_blank");
                            }}
                          >
                            WhatsApp: {user.phone}
                          </Button>
                          <p className="h7 labellight">Idade: {calculateAge(user.birthdate)}</p>
                          <p className="h7 labellight">Email: {user.email}</p>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>

                {barber.description && (
                  <Col xs={12} sm={6} md={6}>
                    <p className="h6">{barber.description}</p>
                  </Col>
                )}
              </Row>

              <Row>
                <Row className="justify-content-center mt-4">
                  <Col md={12}>
                  
                    <Card>  <p className="labeltitle h6 text-center text-uppercase">
                      Barbearias que{" "}
                      {user.first_name || "Nome não disponível"} está associado
                    </p>
                      <Card.Body>
                        <Row>
                          {barbershops.map((barbershop) => (
                            <Col md={3} key={barbershop.id} className="mb-3">
                              <Card className="card-barbershop-show">
                                <div
                                  className="background-image"
                                  style={{
                                    backgroundImage: `url('${storageUrl}/${barbershop.logo}')`,
                                  }}
                                />
                                <Link
                                  to={`/barbershop/view/${barbershop.slug}`}
                                  style={{ textDecoration: "none" }}
                                >
                                  <img
                                    src={`${storageUrl}/${barbershop.logo}`}
                                    className="rounded-circle img-logo-barbershop-show"
                                    style={{
                                      margin: "0 auto",
                                      display: "block",
                                    }}
                                    alt={barbershop.name}
                                  />
                                </Link>
                                <Card.Body>
                                  <Link
                                    to={`/barbershop/show/${barbershop.id}`}
                                    style={{ textDecoration: "none" }}
                                  >
                                    <p className="labeltitle h6 text-center text-uppercase">
                                      {barbershop.name}
                                    </p>
                                  </Link>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Row>
            </>
          ) : (
            <ProcessingIndicatorComponent
              messages={[
                "Carregando os dados do barbeiro...",
                "Organizando as informações.",
                "Quase finalizando! Espere só um pouco.",
              ]}
            />
          )}
        </Col>
      </Container>
    </>
  );
};

export default BarberViewPage;
