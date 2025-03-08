import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Card, Col } from "react-bootstrap";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";

const UserUpdatePage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState({
    avatar: null,
    first_name: "",
    user_name: "",
    last_name: "",
    cpf: "",
    address: "",
    phone: "",
    city: "",
    uf: "",
    postal_code: "",
    birthdate: "",
    gender: "",
    occupation: "",
    about: "",
    is_barber: false,
    email: "",
  });
  const [originalData, setOriginalData] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsProcessing(true);
        const response = await axios.get(`${apiBaseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });
        const data = response.data.user;
        setUserData({
          avatar: data.avatar || null,
          first_name: data.first_name || "",
          user_name: data.user_name || "",
          last_name: data.last_name || "",
          cpf: data.cpf || "",
          address: data.address || "",
          phone: data.phone || "",
          city: data.city || "",
          uf: data.uf || "",
          postal_code: data.postal_code || "",
          birthdate: data.birthdate || "",
          gender: data.gender || "",
          occupation: data.occupation || "",
          about: data.about || "",
          is_barber: data.is_barber || false,
          email: data.email || "",
        });
        setOriginalData(data);
        setAvatarPreview(data.avatar ? `${storageUrl}/${data.avatar}` : null);
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        Swal.fire({
          title: "Sem dados",
          text: "Não  conseguimos carregar seus dados. Tente novamente",
          icon: "error",
          confirmButtonText: "OK",
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

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    if (file && file.type.startsWith("image/")) {
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
          setAvatarPreview(resizedDataURL);
          setUserData((prevData) => ({ ...prevData, avatar: file }));
        };
      };
      reader.readAsDataURL(file);
    } else {
      Swal.fire({
        title: "Formato Inválido",
        text: "Selecione uma imagem válida.",
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsProcessing(true);
    setMessages(["Atualizando dados do usuário..."]);

    const formData = new FormData();

    if (avatarPreview) {
      try {
        const avatarBlob = await fetch(avatarPreview).then((res) => res.blob());
        formData.append("avatar", avatarBlob, "avatar.png");
      } catch (err) {
        console.error("Erro ao converter imagem do avatar:", err);
      }
    }

    Object.keys(userData).forEach((key) => {
      if (key !== "avatar" && userData[key] !== originalData[key]) {
        formData.append(key, userData[key]);
      }
    });

    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      };
      const response = await axios.post(
        `${apiBaseUrl}/user/${originalData.id}`,
        formData,
        {
          headers,
        }
      );
      console.log(response);

      Swal.fire({
        title: "Sucesso!",
        text: "Dados do usuário atualizados com sucesso.",
        icon: "success",
        confirmButtonText: "OK",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
    } catch (error) {
      console.error("Erro ao atualizar dados do usuário:", error);

      if (error.response && error.response.status === 422) {
        const validationErrors = error.response.data.errors;
        const errorMessage = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        Swal.fire({
          title: "Erro de Validação",
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
          title: "Erro ",
          text: "Não foi possível atualizar os dados do usuário.",
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
  const handleAvatarError = (e) => {
    if (e.target.src.includes("/images/user.png")) return;
    e.target.src = "/images/user.png";
  };
  return (
    <>
      <NavlogComponent />

      <Container>
        {isProcessing ? (
          <ProcessingIndicatorComponent messages={messages} />
        ) : (
          <Card>
            <p className="labeltitle h6 text-center text-uppercase">
              Atualizar meus dados
            </p>
            <Card.Body>
              <div className="text-center">
                <label
                  htmlFor="avatarInput"
                  style={{ cursor: "pointer", display: "block" }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview da avatar"
                      className="img-fluid rounded-circle avatar"
                      style={{ width: "150px" }}
                      onError={handleAvatarError}
                    />
                  ) : (
                    <img
                      src="/images/user.png"
                      alt="Preview da avatar"
                      className="img-fluid rounded-circle avatar"
                      style={{ width: "150px" }}
                      onError={handleAvatarError}
                    />
                  )}
                </label>
                <Button
                  variant="secondary"
                  className="w-50 m-2"
                  onClick={() => document.getElementById("avatarInput").click()}
                >
                  Alterar Avatar
                </Button>
                <Form.Control
                  id="avatarInput"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </div>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={2}>
                    <Form.Group controlId="first_name">
                      <Form.Label>Primeiro Nome</Form.Label>
                      <Form.Control
                        type="text"
                        name="first_name"
                        value={userData.first_name}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="last_name">
                      <Form.Label>Sobrenome</Form.Label>
                      <Form.Control
                        type="text"
                        name="last_name"
                        value={userData.last_name}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="user_name">
                      <Form.Label>Nome de Usuário</Form.Label>
                      <Form.Control
                        type="text"
                        name="user_name"
                        value={userData.user_name}
                        onChange={handleInputChange}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="email">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={userData.email}
                        onChange={handleInputChange}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="cpf">
                      <Form.Label>CPF</Form.Label>
                      <Form.Control
                        type="text"
                        name="cpf"
                        value={userData.cpf}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="birthdate">
                      <Form.Label>Data de Nascimento</Form.Label>
                      <Form.Control
                        type="date"
                        name="birthdate"
                        value={userData.birthdate}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="phone">
                      <Form.Label>Telefone(whatsapp)</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={userData.phone}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="gender">
                      <Form.Label>Gênero</Form.Label>
                      <Form.Select
                        name="gender"
                        value={userData.gender}
                        onChange={handleInputChange}
                      >
                        <option value="">Selecione</option>
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                        <option value="other">Outro</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group controlId="address">
                      <Form.Label>Endereço</Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={userData.address}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="city">
                      <Form.Label>Cidade</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={userData.city}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="uf">
                      <Form.Label>Estado (UF)</Form.Label>
                      <Form.Select
                        name="uf"
                        value={userData.uf}
                        onChange={handleInputChange}
                      >
                        <option value="">Selecione</option>
                        <option value="AC">AC</option>
                        <option value="AL">AL</option>
                        <option value="AP">AP</option>
                        <option value="AM">AM</option>
                        <option value="BA">BA</option>
                        <option value="CE">CE</option>
                        <option value="DF">DF</option>
                        <option value="ES">ES</option>
                        <option value="GO">GO</option>
                        <option value="MA">MA</option>
                        <option value="MT">MT</option>
                        <option value="MS">MS</option>
                        <option value="MG">MG</option>
                        <option value="PA">PA</option>
                        <option value="PB">PB</option>
                        <option value="PR">PR</option>
                        <option value="PE">PE</option>
                        <option value="PI">PI</option>
                        <option value="RJ">RJ</option>
                        <option value="RN">RN</option>
                        <option value="RS">RS</option>
                        <option value="RO">RO</option>
                        <option value="RR">RR</option>
                        <option value="SC">SC</option>
                        <option value="SP">SP</option>
                        <option value="SE">SE</option>
                        <option value="TO">TO</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId="postal_code">
                      <Form.Label>CEP</Form.Label>
                      <Form.Control
                        type="text"
                        name="postal_code"
                        value={userData.postal_code}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group controlId="occupation">
                      <Form.Label>Ocupação</Form.Label>
                      <Form.Control
                        type="text"
                        name="occupation"
                        value={userData.occupation}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Form.Group controlId="about">
                      <Form.Label>Fale sobre você</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="about"
                        value={userData.about}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex justify-content-center">
                  <Button variant="primary" type="submit" className="w-50 mt-3">
                    Atualizar
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

export default UserUpdatePage;
