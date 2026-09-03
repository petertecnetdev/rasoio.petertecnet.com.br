// src/components/useAppointment.js
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";
import schedulingApi from "../services/schedulingApi";

const MySwal = withReactContent(Swal);

export default function useAppointment(apiBaseUrl, appId, token, establishment) {
  const loadAvailableTimes = async (dayKey, collaborator, durationMin) => {
    try {
      if (!dayKey || !collaborator || !durationMin || !establishment?.id) return [];

      const { data } = await schedulingApi.availability.times({
        establishment_id: establishment.id,
        provider_id: collaborator.id,
        date: dayKey,
        duration: durationMin,
      });

      return Array.isArray(data?.data?.available_times)
        ? data.data.available_times
        : [];
    } catch (err) {
      console.error("Erro ao carregar horários:", err);
      return [];
    }
  };

  const handleCreateAppointment = async (service, collaborator, dateKey, timeStr) => {
    try {
      if (!token) {
        const { value: loginData } = await MySwal.fire({
          title: "Entrar para agendar",
          html: `
            <input id="swal-username" class="swal2-input" placeholder="Usuário ou e-mail" />
            <input id="swal-password" type="password" class="swal2-input" placeholder="Senha" />
          `,
          focusConfirm: false,
          confirmButtonText: "Entrar",
          showCancelButton: true,
          background: "#0a0a0c",
          color: "#fff",
          preConfirm: async () => {
            const username = document.getElementById("swal-username").value;
            const password = document.getElementById("swal-password").value;
            if (!username || !password) {
              Swal.showValidationMessage("Informe usuário e senha");
              return false;
            }
            try {
              const { data } = await axios.post(`${apiBaseUrl}/auth/login`, {
                username,
                password,
              });
              const loginToken =
                data.token?.access_token ||
                data.token?.original?.access_token ||
                data.access_token ||
                data.token;
              if (!loginToken) throw new Error("Token não recebido");
              localStorage.setItem("token", loginToken);
              localStorage.setItem("user", JSON.stringify(data.user));
              return { token: loginToken, user: data.user };
            } catch (err) {
              Swal.showValidationMessage(
                err.response?.data?.error ||
                  err.response?.data?.message ||
                  "Falha ao autenticar"
              );
              return false;
            }
          },
        });

        if (!loginData) return;
        window.location.reload();
        return;
      }

      if (!collaborator || !dateKey || !service || !establishment?.id) return;

      const user = JSON.parse(localStorage.getItem("user") || "null");
      let customerName = user
        ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
        : "";

      if (!customerName) {
        const { value: name } = await MySwal.fire({
          title: "Informe seu nome",
          input: "text",
          confirmButtonText: "Continuar",
          inputValidator: (value) =>
            !value ? "Por favor, informe seu nome para continuar." : undefined,
        });
        if (!name) return;
        customerName = name.trim();
      }

      const payload = {
        establishment_id: establishment.id,
        items: [{ item_id: service.id, quantity: 1 }],
        customer_name: customerName,
        customer_phone: user?.phone || null,
        customer_email: user?.email || null,
        scheduled_at: `${dateKey}T${timeStr}:00-03:00`,
        provider_id: collaborator.id,
        payment_method: "Pix",
        notes: "Agendamento feito pelo aplicativo.",
      };

      const { data } = await schedulingApi.appointments.create(payload);

      await MySwal.fire({
        icon: "success",
        title: "Agendamento solicitado!",
        text:
          data?.message ||
          "Seu agendamento foi registrado e está aguardando confirmação.",
        background: "#0a0a0c",
        color: "#fff",
      });
    } catch (err) {
      const data = err.response?.data || {};
      const validationMessage = data?.errors
        ? Object.values(data.errors).flat().filter(Boolean)[0]
        : null;
      const msg =
        validationMessage ||
        data.error ||
        data.message ||
        "Não foi possível criar o agendamento.";

      await MySwal.fire({
        icon: "error",
        title: "Horário indisponível",
        html: `
          <div style="color:#fff;text-align:left">
            <p>${msg}</p>
          </div>
        `,
        background: "#0a0a0c",
        color: "#fff",
        confirmButtonText: "Fechar",
      });
    }
  };

  return { loadAvailableTimes, handleCreateAppointment };
}
