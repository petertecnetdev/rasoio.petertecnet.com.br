// src/pages/HomePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Spinner,
  Badge,
  Form,
  Button,
  ButtonGroup,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../config";
import NavlogComponent from "../components/NavlogComponent";
import { FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import "./HomePage.css";

const parseSegments = (segments) => {
  if (Array.isArray(segments)) return segments;
  if (!segments) return [];
  try {
    const parsed = JSON.parse(segments);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getListFromApiResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.establishments)) return data.establishments;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.establishments?.data)) return data.establishments.data;
  return [];
};

function SkeletonCard() {
  return (
    <div className="hp-card hp-card--skeleton">
      <div className="hp-hero-overlay" />
      <div className="hp-logo-bubble hp-logo-bubble--skeleton" />
      <div className="hp-info">
        <div className="hp-name hp-skel-line" />
        <div className="hp-address hp-skel-line" />
        <div className="hp-badges">
          <span className="hp-skel-chip" />
          <span className="hp-skel-chip" />
          <span className="hp-skel-chip" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [barbershops, setBarbershops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [segFilter, setSegFilter] = useState("");
  const [sort, setSort] = useState("name_asc"); // name_asc | name_desc

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/category/barbershop`
        );
        if (!mounted) return;
        setBarbershops(getListFromApiResponse(data));
      } catch {
        if (!mounted) return;
        setErr("Não foi possível carregar as barbearias agora.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // cidades e segmentos únicos para filtros
  const { cities, segments } = useMemo(() => {
    const cset = new Set();
    const sset = new Set();
    barbershops.forEach((s) => {
      if (s.city) cset.add(s.city);
      parseSegments(s.segments).forEach((seg) => sset.add(seg));
    });
    return {
      cities: Array.from(cset).sort((a, b) => a.localeCompare(b)),
      segments: Array.from(sset).sort((a, b) => a.localeCompare(b)),
    };
  }, [barbershops]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = barbershops.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const addr = (s.address || "").toLowerCase();
      const city = (s.city || "").toLowerCase();
      const segs = parseSegments(s.segments).map((x) => String(x).toLowerCase());

      const matchesSearch =
        !q || name.includes(q) || addr.includes(q) || city.includes(q);

      const matchesCity = !cityFilter || (s.city || "") === cityFilter;
      const matchesSeg = !segFilter || segs.includes(segFilter.toLowerCase());

      return matchesSearch && matchesCity && matchesSeg;
    });

    if (sort === "name_asc") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "name_desc") list.sort((a, b) => b.name.localeCompare(a.name));

    return list;
  }, [barbershops, search, cityFilter, segFilter, sort]);

  const handleCardClick = (slug) => navigate(`/establishment/view/${slug}`);

  return (
    <div className="hp-root">
      <NavlogComponent />

      <Container className="hp-container py-4">
        {/* Título */}
        <h2 className="hp-title">Escolha a melhor barbearia</h2>

        {/* Barra de busca + filtros */}
        <Row className="hp-toolbar gx-2 gy-2 align-items-end">
          <Col xs={12} md={6} lg={5}>
            <Form.Group controlId="hp-search">
              <Form.Label className="hp-label">Buscar</Form.Label>
              <div className="hp-search-wrap">
                <FaSearch className="hp-search-icon" />
                <Form.Control
                  type="search"
                  placeholder="Nome, endereço ou cidade…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="hp-input"
                />
              </div>
            </Form.Group>
          </Col>

          <Col xs={6} md={3} lg={3}>
            <Form.Group controlId="hp-city">
              <Form.Label className="hp-label">Cidade</Form.Label>
              <Form.Select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="hp-select"
              >
                <option value="">Todas</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col xs={6} md={3} lg={2}>
            <Form.Group controlId="hp-seg">
              <Form.Label className="hp-label">Segmento</Form.Label>
              <Form.Select
                value={segFilter}
                onChange={(e) => setSegFilter(e.target.value)}
                className="hp-select"
              >
                <option value="">Todos</option>
                {segments.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col xs={12} lg={2}>
            <Form.Label className="hp-label d-none d-lg-block">Ordenar</Form.Label>
            <ButtonGroup className="w-100">
              <Button
                size="sm"
                variant={sort === "name_asc" ? "warning" : "dark"}
                onClick={() => setSort("name_asc")}
              >
                A–Z
              </Button>
              <Button
                size="sm"
                variant={sort === "name_desc" ? "warning" : "dark"}
                onClick={() => setSort("name_desc")}
              >
                Z–A
              </Button>
            </ButtonGroup>
          </Col>
        </Row>

        {/* Estados */}
        {loading && (
          <Row className="hp-grid">
            {[...Array(4)].map((_, i) => (
              <Col key={i} md={6} lg={4} xl={3} className="hp-col">
                <SkeletonCard />
              </Col>
            ))}
          </Row>
        )}

        {!loading && err && (
          <div className="hp-empty">
            <Spinner animation="border" variant="warning" size="sm" /> {err}
          </div>
        )}

        {!loading && !err && filtered.length === 0 && (
          <div className="hp-empty">Nenhuma barbearia encontrada.</div>
        )}

        {/* Grid de cards */}
        {!loading && !err && filtered.length > 0 && (
          <Row className="hp-grid">
            {filtered.map((shop) => {
              const bg = shop.background
                ? `${storageUrl}/${shop.background}`
                : "/images/default-bg.png";
              const logo = shop.logo
                ? `${storageUrl}/${shop.logo}`
                : "/images/logo.png";
              const segs = parseSegments(shop.segments);

              return (
                <Col key={shop.id} md={6} lg={4} xl={3} className="hp-col mt-4">
                  <article
                    className="hp-card"
                    role="button"
                    tabIndex={0}
                    style={{ backgroundImage: `url("${bg}")` }}
                    onClick={() => handleCardClick(shop.slug)}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") &&
                      handleCardClick(shop.slug)
                    }
                    aria-label={`Abrir ${shop.name}`}
                  >
                    <div className="hp-hero-overlay" />
                    <div className="hp-logo-bubble" aria-hidden="true">
                      <img
                        src={logo}
                        alt=""
                        className="hp-logo-img"
                        draggable={false}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/logo.png";
                        }}
                      />
                    </div>

                    <div className="hp-info">
                      <h3 className="hp-name">{shop.name}</h3>

                      {(shop.address || shop.city) && (
                        <div className="hp-address">
                          <FaMapMarkerAlt />{" "}
                          {(shop.address || "") +
                            (shop.city ? `, ${shop.city}` : "")}
                        </div>
                      )}

                      {segs.length > 0 && (
                        <div className="hp-badges">
                          {segs.map((seg) => (
                            <Badge key={seg} bg="warning" text="dark">
                              {seg}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>
    </div>
  );
}
