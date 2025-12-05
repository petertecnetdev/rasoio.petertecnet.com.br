// src/components/home/HomeHeader.jsx
import React from "react";
import "./HomeHeader.css";

export default function HomeHeader({ city, uf }) {
  return (
    <div className="home-header">
      <h1 className="home-title">Bem-vindo(a) de volta!</h1>
      {city && uf && (
        <div className="home-location">
          {city} / {uf}
        </div>
      )}
    </div>
  );
}
