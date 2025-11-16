import React from "react";
import { Link } from "react-router-dom";

export default function GlobalNavEstablishments({
  user,
  handleToggleMobileMenu
}) {
  if (!user) return null;

  return (
    <Link
      to="/dashboard"
      onClick={handleToggleMobileMenu}
      className="navlog__link"
    >
      Minhas Barbearias
    </Link>
  );
}
