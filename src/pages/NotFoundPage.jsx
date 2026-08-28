import React from "react";
import { Button, Container } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Container className="py-5 text-center" style={{ maxWidth: 720 }}>
      <img
        src="/images/logo.png"
        alt="Rasoio"
        width="88"
        height="88"
        style={{ objectFit: "contain" }}
      />
      <p className="text-uppercase text-secondary fw-semibold mt-4 mb-2">Erro 404</p>
      <h1 className="h2">Esta página não existe</h1>
      <p className="text-secondary mt-3">
        O endereço pode estar incorreto ou o conteúdo pode ter sido removido. Você pode voltar
        para a página anterior ou retornar ao início da Rasoio.
      </p>
      <div className="d-flex flex-wrap gap-2 justify-content-center mt-4">
        <Button type="button" variant="outline-secondary" onClick={() => navigate(-1)}>
          Voltar
        </Button>
        <Button as={Link} to="/" variant="primary">
          Ir para o início
        </Button>
      </div>
    </Container>
  );
}
