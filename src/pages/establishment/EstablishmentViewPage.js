// src/pages/establishment/EstablishmentViewPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";
import NavlogComponent from "../../components/NavlogComponent";
import { Badge, Spinner } from "react-bootstrap";
import {
  FaInstagram,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import "./Establishment.css";

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(`${apiBaseUrl}/establishment/view/${slug}`);
        setEstablishment(res.data.establishment);
        setItems(res.data.items || []);
        setBarbers(res.data.collaborators || []);
      } catch {
        navigate("/404");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="establishment-root">
        <NavlogComponent />
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <Spinner animation="border" variant="warning" />
        </div>
      </div>
    );
  }

  if (!establishment) return null;

  const resolveImage = (img) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `${storageUrl || apiBaseUrl.replace("/api", "")}/${img.replace(/^\//, "")}`;
  };

  const services = items.filter((i) => i.type === "service" && i.status === 1);
  const products = items.filter((i) => i.type === "product" && i.status === 1);
  const segments = Array.isArray(establishment.segments)
    ? establishment.segments
    : establishment.segments
    ? JSON.parse(establishment.segments)
    : [];
  const phoneLink = establishment.phone
    ? `https://wa.me/55${establishment.phone.replace(/\D/g, "")}`
    : null;
const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

  return (
    <div className="establishment-page-vitrine">
      <NavlogComponent />

      {/* Botões de navegação */}
   <div className="estab-nav-buttons">
  <button onClick={() => scrollToSection("barbeiros-section")}>✂️ Barbeiros</button>
  <button onClick={() => scrollToSection("servicos-section")}>💈 Serviços</button>
  <button onClick={() => scrollToSection("produtos-section")}>🛍️ Produtos</button>
</div>


      {/* Banner */}
      <div
        className="estab-hero"
        style={{
          background: `linear-gradient(90deg, rgba(18,18,18,0.87) 55%, rgba(36,36,36,0.70)), url('${resolveImage(establishment.background)}') center/cover no-repeat`,
        }}
      >
        <div className="estab-hero-inner">
          <div className="estab-logo-bubble">
            {establishment.logo && (
              <img src={resolveImage(establishment.logo)} alt="Logo" className="estab-logo" />
            )}
          </div>
          <div className="estab-info-block">
            <h1 className="estab-title">{establishment.name}</h1>
            {establishment.description && (
              <div className="estab-description">{establishment.description}</div>
            )}
            <div className="estab-actions">
              {establishment.instagram_url && (
                <a href={establishment.instagram_url} target="_blank" rel="noopener noreferrer" className="estab-link">
                  <FaInstagram /> Instagram
                </a>
              )}
              {phoneLink && (
                <a href={phoneLink} target="_blank" rel="noopener noreferrer" className="estab-link">
                  <FaWhatsapp /> WhatsApp
                </a>
              )}
              {establishment.location && (
                <a href={establishment.location} target="_blank" rel="noopener noreferrer" className="estab-link">
                  <FaMapMarkerAlt /> Como Chegar
                </a>
              )}
              <Link to={`/appointment/create/${establishment.id}`} className="estab-link">
                <FaCalendarAlt /> Agendar horário
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Endereço / Segmentos */}
      <div className="estab-details-row">
        <div>
          <b>Endereço:</b>{" "}
          {establishment.address
            ? `${establishment.address}${establishment.city ? " - " + establishment.city : ""}`
            : "–"}
        </div>
        <div>
          <b>Atende: </b>
          {segments.map((seg) => (
            <Badge key={seg} bg="warning" text="dark" className="me-1">
              {seg.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </div>

      {/* Barbeiros */}
      <section className="estab-cardapio-section" id="barbeiros-section">
        <h2 className="estab-cardapio-title">✂️ Nossa Equipe</h2>
        {barbers.length === 0 ? (
          <div className="estab-vazio">Nenhum barbeiro registrado.</div>
        ) : (
          <div className="estab-barbers-grid">
            {barbers.map((colab) => (
              <div key={colab.id} className="estab-barber-card">
                <div className="estab-barber-img-wrapper">
                  {colab.user?.avatar ? (
                    <img src={resolveImage(colab.user.avatar)} alt={colab.user.first_name} className="estab-barber-img" />
                  ) : (
                    <div className="estab-barber-placeholder">{colab.user?.first_name?.charAt(0)}</div>
                  )}
                </div>
                <div className="estab-barber-info">
                  <div className="estab-barber-name">
                    {colab.user?.first_name} {colab.user?.last_name}
                  </div>
                  {colab.role && <div className="estab-barber-role">{colab.role}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Serviços */}
      <section className="estab-cardapio-section" id="servicos-section">
        <h2 className="estab-cardapio-title">💈 Serviços</h2>
        {services.length === 0 ? (
          <div className="estab-vazio">Nenhum serviço disponível.</div>
        ) : (
          <div className="estab-items-grid">
            {services.map((item) => (
              <div key={item.id} className={`estab-cardapio-card ${item.stock < 1 ? "estab-esgotado" : ""}`}>
                {item.image && <img src={resolveImage(item.image)} alt={item.name} className="estab-item-img" />}
                <div className="estab-item-info">
                  <div className="estab-item-row">
                    <span className="estab-item-title">{item.name}</span>
                  </div>
                  <div className="estab-item-desc">{item.description || <i>Sem descrição</i>}</div>
                  <div className="estab-item-bottom-row">
                    <span className="estab-item-preco">
                      {Number(item.price).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                    <span className="estab-item-duracao">{item.duration} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Produtos */}
      <section className="estab-cardapio-section mt-4" id="produtos-section">
        <h2 className="estab-cardapio-title">🛍️ Produtos</h2>
        {products.length === 0 ? (
          <div className="estab-vazio">Nenhum produto disponível.</div>
        ) : (
          <div className="estab-items-grid">
            {products.map((item) => (
              <div key={item.id} className={`estab-cardapio-card ${item.stock < 1 ? "estab-esgotado" : ""}`}>
                {item.image && <img src={resolveImage(item.image)} alt={item.name} className="estab-item-img" />}
                <div className="estab-item-info">
                  <div className="estab-item-row">
                    <span className="estab-item-title">{item.name}</span>
                  </div>
                  <div className="estab-item-desc">{item.description || <i>Sem descrição</i>}</div>
                  <div className="estab-item-bottom-row">
                    <span className="estab-item-preco">
                      {Number(item.price).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                    {item.stock > 0 ? (
                      <span className="estab-item-disponivel">Disponível</span>
                    ) : (
                      <span className="estab-item-indisponivel">Esgotado</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
