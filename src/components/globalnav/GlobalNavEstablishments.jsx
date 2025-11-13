import React from "react";
import { Link } from "react-router-dom";

export default function GlobalNavEstablishments({
  user,
  showEstSubmenu,
  setShowEstSubmenu,
  handleToggleMobileMenu
}) {
  const barbershops = user.establishments.filter(est => est.category === "barbershop");

  if (barbershops.length === 0) {
    return (
      <Link
        to="/establishment/create"
        onClick={handleToggleMobileMenu}
        className="navlog__link"
      >
        Criar Barbearia
      </Link>
    );
  }

  return (
    <>
      <button
        className="navlog__admin-btn"
        onClick={() => setShowEstSubmenu((v) => !v)}
      >
        Minhas Barbearias {showEstSubmenu ? "▲" : "▼"}
      </button>

      {showEstSubmenu &&
        barbershops.map(est => (
          <Link
            key={est.id}
            to={`/establishment/view/${est.slug}`}
            onClick={handleToggleMobileMenu}
            className="navlog__submenu-link"
          >
            {est.name}
          </Link>
        ))}
    </>
  );
}
