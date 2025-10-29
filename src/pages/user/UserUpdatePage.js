// src/pages/user/UserUpdatePage.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl, storageUrl } from "../../config";
import NavlogComponent from "../../components/NavlogComponent";
import { Button, Col, Row, Form, Spinner } from "react-bootstrap";
import "./UserUpdate.css";

function resolveImage(img) {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${storageUrl || apiBaseUrl.replace("/api", "")}/${img.replace(/^\//, "")}`;
}

export default function UserUpdatePage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState(null);
  const [isBarber, setIsBarber] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    let mounted = true;
    async function fetchUser() {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!mounted) return;
        const user = res.data.user || {};
        reset({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          cpf: user.cpf || "",
          phone: user.phone || "",
          address: user.address || "",
          city: user.city || "",
          uf: user.uf || "",
          postal_code: user.postal_code || "",
          birthdate: user.birthdate || "",
          gender: user.gender || "",
          occupation: user.occupation || "",
          about: user.about || "",
        });
        setAvatarPreview(resolveImage(user.avatar));
        setUserName(user.user_name || "");
        setUserId(user.id);
        setIsBarber(user.is_barber === "1" || user.is_barber === 1 || user.is_barber === true);
        setEmail(user.email || "");
      } catch {
        Swal.fire("Erro", "Não foi possível carregar seus dados.", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchUser();
    return () => {
      mounted = false;
    };
  }, [reset]);

  const handleResizeAvatar = (file) => {
    return new Promise((resolve, reject) => {
      if (!file || !file.type || !file.type.startsWith("image/")) {
        Swal.fire("Formato inválido", "Selecione uma imagem válida.", "error");
        reject(new Error("invalid file"));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 250;
          canvas.height = 250;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, 250, 250);
          const previewDataURL = canvas.toDataURL("image/png");
          setAvatarPreview(previewDataURL);
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("blob creation failed"));
              return;
            }
            const filename = (file.name || "avatar").replace(/\.[^/.]+$/, "") + ".png";
            const resizedFile = new File([blob], filename, { type: "image/png" });
            setAvatarFile(resizedFile);
            resolve(resizedFile);
          }, "image/png", 0.95);
        };
        img.onerror = () => reject(new Error("image load error"));
      };
      reader.onerror = () => reject(new Error("reader error"));
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) await handleResizeAvatar(file);
  };

  const onSubmit = async (data) => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("Erro", "Você precisa estar autenticado.", "error");
      return;
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value || ""));
    if (avatarFile) formData.append("avatar", avatarFile);
    formData.append("is_barber", isBarber ? "1" : "0");
    formData.append("user_name", userName); // ✅ agora enviamos o nome de usuário editável

    try {
      const res = await axios.post(`${apiBaseUrl}/user/${userId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      Swal.fire("Sucesso", res.data.message || "Perfil atualizado com sucesso!", "success").then(
        (result) => {
          if (result.isConfirmed || result.isDismissed) window.location.reload();
        }
      );
    } catch (err) {
      let msg = "Ocorreu um erro ao atualizar seu perfil.";
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.errors) msg = Object.values(data.errors).flat().join("\n");
        else if (data.error) msg = data.error;
        else if (data.message) msg = data.message;
      }
      Swal.fire("Erro", msg, "error");
    }
  };

  if (loading) {
    return (
      <div className="user-root">
        <NavlogComponent />
        <div
          className="user-update-page d-flex justify-content-center align-items-center"
          style={{ minHeight: 400 }}
        >
          <Spinner animation="border" variant="warning" />
        </div>
      </div>
    );
  }

  return (
    <div className="user-root">
      <NavlogComponent />
      <div className="user-update-page">
        <h2 className="title mb-3">Editar Perfil</h2>

        <div
          className="user-hero"
          style={{
            background:
              "linear-gradient(90deg, rgba(18,18,18,0.9) 60%, rgba(36,36,36,0.7)), #222",
          }}
        >
          <div className="user-hero-inner">
            <div className="user-avatar-bubble">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" className="user-avatar" />
              ) : (
                <img src="/images/user.png" alt="Avatar padrão" className="user-avatar" />
              )}
            </div>
            <div className="user-info-block">
              <h1 className="user-title">@{userName}</h1>
              <div className="user-description">{email}</div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-center my-3">
          <Button
            variant="secondary"
            className="action-button"
            onClick={() => document.getElementById("avatarInput").click()}
          >
            Alterar Foto de Perfil
          </Button>
        </div>
        <Form.Control
          id="avatarInput"
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          style={{ display: "none" }}
        />

        <Form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
          <Row className="gy-3 mt-2">
            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Primeiro Nome</label>
                <input type="text" {...register("first_name")} required />
              </div>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Sobrenome</label>
                <input type="text" {...register("last_name")} />
              </div>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Nome de Usuário</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  maxLength={255}
                />
              </div>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} disabled />
              </div>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>CPF</label>
                <input type="text" {...register("cpf")} />
              </div>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Data de Nascimento</label>
                <input type="date" {...register("birthdate")} />
              </div>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Telefone (WhatsApp)</label>
                <input type="text" {...register("phone")} />
              </div>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Gênero</label>
                <select {...register("gender")}>
                  <option value="">Selecione</option>
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                  <option value="other">Outro</option>
                </select>
              </div>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <div className="form-group">
                <label>Ocupação</label>
                <input type="text" {...register("occupation")} />
              </div>
            </Col>

            <Col xs={12}>
              <div className="form-group">
                <label>Endereço</label>
                <input type="text" {...register("address")} />
              </div>
            </Col>

            <Col xs={6} md={4} lg={3}>
              <div className="form-group">
                <label>Cidade</label>
                <input type="text" {...register("city")} />
              </div>
            </Col>

            <Col xs={6} md={3} lg={2}>
              <div className="form-group">
                <label>Estado (UF)</label>
                <select {...register("uf")}>
                  <option value="">Selecione</option>
                  {[
                    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
                    "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
                  ].map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </Col>

            <Col xs={6} md={3} lg={2}>
              <div className="form-group">
                <label>CEP</label>
                <input type="text" {...register("postal_code")} />
              </div>
            </Col>

            <Col xs={12}>
              <div className="form-group">
                <label>Fale sobre você</label>
                <textarea rows={3} {...register("about")} />
              </div>
            </Col>

            <Col xs={12} className="text-end">
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}
