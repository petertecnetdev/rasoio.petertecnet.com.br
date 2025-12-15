// src/hooks/useAppointment.js
import { useCallback } from "react";
import Swal from "sweetalert2";
import axios from "axios";

export default function useAppointment(apiBaseUrl, appId, token, establishment) {
  const getToken = () => localStorage.getItem("token");
const loadAvailableTimes = useCallback(
  async (date, employer, totalDuration) => {
    try {
      const userToken = getToken();
      if (!userToken || !employer?.id || !date) return [];

      const payload = {
        employer_id: employer.id,
        date:
          typeof date === "string"
            ? date
            : new Date(date).toISOString(),
        duration: Number(totalDuration || 0),
      };

      const res = await axios.post(
        `${apiBaseUrl}/employer/available-times`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      return Array.isArray(res.data?.available_times)
        ? res.data.available_times
        : [];
    } catch (err) {
      console.error(
        "❌ Erro ao carregar horários disponíveis:",
        err?.response?.data || err
      );
      return [];
    }
  },
  [apiBaseUrl]
);

  const handleCreateAppointment = useCallback(
    async (initialService, preselectedEmployer = null) => {
      const userToken = getToken();
      if (!userToken) {
        await Swal.fire({
          background: "#0a0a0c",
          color: "#fff",
          icon: "info",
          title: "Entrar para agendar",
          text: "Você precisa estar logado para fazer um agendamento.",
          confirmButtonColor: "#00aaff",
        });
        return null;
      }

      try {
        let selectedServices = Array.isArray(initialService)
          ? [...initialService]
          : [initialService];
        let selectedEmployer = preselectedEmployer;
        let selectedDate = null;
        let selectedTime = null;

        // ========== ETAPA 1: SERVIÇOS ==========
        const { value: servicesConfirmed } = await Swal.fire({
          title: "Escolha os serviços",
          background: "#0a0a0c",
          color: "#fff",
          html: `
            <div style="text-align:left;max-height:250px;overflow-y:auto;padding:10px;">
              ${selectedServices
                .map(
                  (s, i) => `
                  <div>
                    <input type="checkbox" id="srv-${i}" value="${s.id}" checked>
                    <label for="srv-${i}">
                      ${s.name || s.title} - R$ ${parseFloat(s.price || 0)
                        .toFixed(2)
                        .replace(".", ",")}
                    </label>
                  </div>
                `
                )
                .join("")}
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: "Avançar",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#00ffcc",
          cancelButtonColor: "#ff5555",
          preConfirm: () => selectedServices,
        });

        if (!servicesConfirmed) return false;
        selectedServices = servicesConfirmed;

        // ========== ETAPA 2: PROFISSIONAL ==========
        if (!selectedEmployer) {
          const { value: employer } = await Swal.fire({
            title: "Escolha o profissional",
            background: "#0a0a0c",
            color: "#fff",
            html: `<div id="employers" style="text-align:left;max-height:250px;overflow-y:auto;padding:10px;">Carregando...</div>`,
            confirmButtonText: "Avançar",
            showCancelButton: true,
            cancelButtonText: "Voltar",
            confirmButtonColor: "#00ffcc",
            cancelButtonColor: "#ff5555",
            didOpen: async () => {
              try {
                const res = await axios.get(`${apiBaseUrl}/employer/list`, {
                  headers: { Authorization: `Bearer ${userToken}` },
                });
                const container = Swal.getPopup().querySelector("#employers");
                container.innerHTML = res.data
                  .map(
                    (emp) => `
                    <div style="margin-bottom:8px;">
                      <input type="radio" name="emp" id="emp-${emp.id}" value='${JSON.stringify(
                      emp
                    )}'>
                      <label for="emp-${emp.id}">${emp.name}</label>
                    </div>`
                  )
                  .join("");
              } catch {
                Swal.getPopup().querySelector("#employers").innerHTML =
                  "Erro ao carregar profissionais.";
              }
            },
            preConfirm: () => {
              const checked = Swal.getPopup().querySelector(
                "input[name='emp']:checked"
              );
              return checked ? JSON.parse(checked.value) : null;
            },
          });

          if (!employer) return await handleCreateAppointment(initialService);
          selectedEmployer = employer;
        }

        // ========== ETAPA 3: DATA ==========
        const { value: date } = await Swal.fire({
          title: "Escolha a data",
          background: "#0a0a0c",
          color: "#fff",
          input: "date",
          confirmButtonText: "Avançar",
          showCancelButton: true,
          cancelButtonText: "Voltar",
          confirmButtonColor: "#00ffcc",
          cancelButtonColor: "#ff5555",
        });

        if (!date) return await handleCreateAppointment(initialService, selectedEmployer);
        selectedDate = date;

        // ========== ETAPA 4: HORÁRIOS ==========
        const totalDuration = selectedServices.reduce(
          (sum, s) => sum + (parseInt(s?.duration) || 0),
          0
        );
        const availableTimes = await loadAvailableTimes(
          selectedDate,
          selectedEmployer,
          totalDuration
        );

        if (!availableTimes.length) {
          await Swal.fire({
            background: "#0a0a0c",
            color: "#fff",
            icon: "warning",
            title: "Nenhum horário disponível",
            text: "Escolha outra data.",
            confirmButtonColor: "#00aaff",
          });
          return await handleCreateAppointment(initialService, selectedEmployer);
        }

        const { value: time } = await Swal.fire({
          title: "Escolha o horário",
          background: "#0a0a0c",
          color: "#fff",
          html: `
            <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-height:250px;overflow-y:auto;">
              ${availableTimes
                .map(
                  (t) =>
                    `<button type="button" class="swal2-confirm swal2-styled" data-time="${t}" style="min-width:90px;background:#00aaff;margin:4px;">${t}</button>`
                )
                .join("")}
            </div>
          `,
          showCancelButton: true,
          cancelButtonText: "Voltar",
          confirmButtonText: "Confirmar horário",
          confirmButtonColor: "#00ffcc",
          cancelButtonColor: "#ff5555",
          didOpen: () => {
            Swal.getPopup()
              .querySelectorAll("button[data-time]")
              .forEach((btn) =>
                btn.addEventListener("click", () =>
                  Swal.clickConfirm(btn.dataset.time)
                )
              );
          },
          preConfirm: (v) => v,
        });

        if (!time) return await handleCreateAppointment(initialService, selectedEmployer);
        selectedTime = time;

        // ========== ETAPA 5: CONFIRMAÇÃO ==========
        const totalValue = selectedServices.reduce(
          (sum, s) => sum + (parseFloat(s?.price) || 0),
          0
        );
        const totalTime = selectedServices.reduce(
          (sum, s) => sum + (parseInt(s?.duration) || 0),
          0
        );

        const { isConfirmed } = await Swal.fire({
          title: "Confirmar Agendamento",
          background: "#0a0a0c",
          color: "#fff",
          html: `
            <div style="text-align:left;">
              <p><b>Profissional:</b> ${selectedEmployer?.name}</p>
              <p><b>Data:</b> ${new Date(selectedDate).toLocaleDateString("pt-BR")}</p>
              <p><b>Horário:</b> ${selectedTime}</p>
              <p><b>Duração total:</b> ${totalTime} minutos</p>
              <ul style="margin-left:15px;">
                ${selectedServices
                  .map(
                    (s) =>
                      `<li>${s.name || s.title} - R$ ${parseFloat(s.price || 0)
                        .toFixed(2)
                        .replace(".", ",")}</li>`
                  )
                  .join("")}
              </ul>
              <hr style="border-color:#333;">
              <p><b>Total:</b> <span style="color:#00ffcc;">R$ ${totalValue
                .toFixed(2)
                .replace(".", ",")}</span></p>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: "Confirmar Agendamento",
          cancelButtonText: "Editar",
          confirmButtonColor: "#00ffcc",
          cancelButtonColor: "#ff5555",
        });

        if (!isConfirmed) return await handleCreateAppointment(initialService, selectedEmployer);

        // ========== FINALIZAÇÃO ==========
        const payload = {
          app_id: appId,
          entity_name: "establishment",
          entity_id: establishment?.id,
          items: selectedServices.map((s) => ({
            item_id: Number(s?.item_id ?? s?.id),
            quantity: 1,
          })),
          customer_name: "Cliente App",
          origin: "App",
          fulfillment: "dine-in",
          payment_status: "pending",
          payment_method: "Pix",
          notes: "Agendamento via aplicativo",
          customer_phone: "62999999999",
          customer_cpf: "12345678900",
          order_datetime: `${selectedDate}T${selectedTime}:00`,
          attendant_id: selectedEmployer?.id,
          appointment_status: "pending",
        };

        await axios.post(`${apiBaseUrl}/orders`, payload, {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        await Swal.fire({
          background: "#0a0a0c",
          color: "#fff",
          icon: "success",
          title: "Agendamento Confirmado!",
          html: `
            <p>Seu agendamento foi criado com sucesso!</p>
            <p style="color:#00ffcc;">
              ${selectedTime} - ${new Date(selectedDate).toLocaleDateString("pt-BR")}
            </p>
          `,
          confirmButtonColor: "#00ffcc",
        });

        return true;
      } catch (error) {
        console.error("❌ Erro ao criar agendamento:", error);
        await Swal.fire({
          background: "#0a0a0c",
          color: "#fff",
          icon: "error",
          title: "Erro no Agendamento",
          text: "Ocorreu um erro ao criar o agendamento. Tente novamente.",
          confirmButtonColor: "#ff5555",
        });
        return false;
      }
    },
    [apiBaseUrl, appId, establishment, loadAvailableTimes]
  );

  return { loadAvailableTimes, handleCreateAppointment };
}
