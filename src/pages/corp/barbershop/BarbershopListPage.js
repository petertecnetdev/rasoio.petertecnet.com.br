import React, { useEffect, useState } from 'react';
import barbershopService from "../../../services/BarbershopService";

const BarbershopListPage = () => {
  const [barbershops, setBarbershops] = useState([]);

  useEffect(() => {
    // Carrega a lista de barbearias
    barbershopService.list()
      .then((response) => {
        setBarbershops(response.data); // Certifique-se de que response.data seja um array
      })
      .catch((error) => {
        console.error('Erro ao carregar as barbearias:', error);
        setBarbershops([]); // Define como array vazio em caso de erro
      });
  }, []);

  return (
    <div>
      <h1>Lista de Barbearias</h1>
      {barbershops.length > 0 ? (
        <ul>
          {barbershops.map((barbershop) => (
            <li key={barbershop.id}>{barbershop.name}</li>
          ))}
        </ul>
      ) : (
        <p>Nenhuma barbearia disponível.</p>
      )}
    </div>
  );
};

export default BarbershopListPage;
