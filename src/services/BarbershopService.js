// services/BarbershopService.js

import axios from 'axios';
import { apiBaseUrl } from "../config";
const apiServiceUrl = 'barbershop';

const BarbershopService = {
    getToken: () => localStorage.getItem("token"),

    store: async (formData) => {
        try {
            const response = await axios.post(
                `${apiBaseUrl}/${apiServiceUrl}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${BarbershopService.getToken()}`,
                    },
                }
            );
            return response.data.message;
        } catch (error) {
            if (error.response && error.response.data.errors) {
              throw error.response.data.errors;
            } else {
              throw new Error("Erro durante o registro. Por favor, tente novamente.");
            }
          }
    },

    list: async () => {
        try {
            const response = await axios.get(
                `${apiBaseUrl}${apiServiceUrl}`,
                {
                    headers: {
                        Authorization: `Bearer ${BarbershopService.getToken()}`,
                    },
                }
            );
            return response.data.barbershops;
        } catch (error) {
            if (error.response) {
                return error.response.data.error;
            } else {
                return "Erro ao se conectar ao servidor.";
            }
        }
    },

    update: async (id, formData) => {
        try {
            const response = await axios.put(
                `${apiBaseUrl}${apiServiceUrl}/${id}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${BarbershopService.getToken()}`,
                    },
                }
            );
            return response.data.message;
        } catch (error) {
            if (error.response) {
                return error.response.data.error;
            } else {
                return "Erro ao se conectar ao servidor.";
            }
        }
    },
};

export default BarbershopService;
