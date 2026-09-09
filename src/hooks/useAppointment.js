// src/hooks/useAppointment.js
import { useCallback } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(tz);

const TZ = "America/Sao_Paulo";

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

export default function useAppointment(apiBaseUrl, appId, token, establishment) {
  const getToken = useCallback(
    () => localStorage.getItem("token") || token,
    [token]
  );

  const getUser = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const normalizeDateToYMD = useCallback((date) => {
    if (!date) return null;
    if (typeof date === "string") return date.slice(0, 10);
    return dayjs(date).tz(TZ).format("YYYY-MM-DD");
  }, []);

  const loadAvailableTimes = useCallback(
    async (date, employer, totalDuration) => {
      try {
        const userToken = getToken();
        if (!userToken || !employer?.id || !date) return [];

        const dateYMD = normalizeDateToYMD(date);
        if (!dateYMD) return [];

        const res = await axios.post(
          `${apiBaseUrl}/employer/available-times`,
          {
            employer_id: employer.id,
            date: dateYMD,
            duration: Number(totalDuration || 0),
          },
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
      } catch {
        return [];
      }
    },
    [apiBaseUrl, getToken, normalizeDateToYMD]
  );

  const handleCreateAppointment = useCallback(
    async (
      initialService,
      preselectedEmployer = null,
      preselectedDate = null,
      preselectedTime = null
    ) => {
      const userToken = getToken();
      const authUser = getUser();

      if (!userToken || !authUser?.id) {
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
        const selectedServices = Array.isArray(initialService)
          ? initialService.filter(Boolean)
          : [initialService].filter(Boolean);

        if (!selectedServices.length) {
          await Swal.fire({
            background: "#0a0a0c",
            color: "#fff",
            icon: "warning",
            title: "Serviço obrigatório",
            text: "Selecione pelo menos um serviço para continuar.",
            confirmButtonColor: "#00aaff",
          });
          return false;
        }

        let selectedEmployer = preselectedEmployer;
        let selectedDate = normalizeDateToYMD(preselectedDate);
        let selectedTime = preselectedTime ? String(preselectedTime).slice(0, 5) : null;

        if (!selectedEmployer) {
          const { value: employer } = await Swal.fire({
            title: "Escolha o profissional",
            background: "#0a0a0c",
            color: "#fff",
            html: '<div id="employers" style="text-align:left;max-height:250px;overflow-y:auto;padding:10px;">Carregando...</div>',
            confirmButtonText: "Avançar",
            showCancelButton: true,
            cancelButtonText: "Voltar",
            confirmButtonColor: "#00ffcc",
            cancelButtonColor: "#ff5555",
            didOpen: async () => {
              const res = await axios.get(`${apiBaseUrl}/employer/list`, {
                headers: { Authorization: `Bearer ${userToken}` },
              });

              const container = Swal.getPopup()?.querySelector("#employers");
              if (!container) return;

              const employers = Array.isArray(res.data) ? res.data : [];
              container.innerHTML = employers
                .map((emp) => {
                  const isSelf = Number(emp.id) === Number(authUser.id);
                  return `
                    <div style="margin-bottom:8px;">
                      <input
                        type="radio"
                        name="emp"
                        id="emp-${Number(emp.id)}"
                        value="${Number(emp.id)}"
                        ${isSelf ? "disabled" : ""}
                      >
                      <label for="emp-${Number(emp.id)}" style="${isSelf ? "color:#ff7777;font-style:italic;" : ""}">
                        ${escapeHtml(emp.name || emp.user?.first_name || "Profissional")}
                        ${isSelf ? " (você não pode agendar consigo mesmo)" : ""}
                      </label>
                    </div>
                  `;
                })
                .join("");

              Swal.getPopup().__rasoioEmployers = employers;
            },
            preConfirm: () => {
              const popup = Swal.getPopup();
              const checked = popup?.querySelector("input[name='emp']:checked");
              if (!checked) {
                Swal.showValidationMessage("Selecione um profissional.");
                return false;
              }
              return (popup.__rasoioEmployers || []).find(
                (emp) => Number(emp.id) === Number(checked.value)
              ) || null;
            },
          });

          if (!employer) return false;
          selectedEmployer = employer;
        }

        if (Number(selectedEmployer.id) === Number(authUser.id)) {
          await Swal.fire({
            background: "#0a0a0c",
            color: "#fff",
            icon: "warning",
            title: "Agendamento inválido",
            text: "Você não pode criar um agendamento onde o profissional e o cliente são a mesma pessoa.",
            confirmButtonColor: "#ff5555",
          });
          return false;
        }

        if (!selectedDate) {
          const { value: date } = await Swal.fire({
            title: "Escolha a data",
            background: "#0a0a0c",
            color: "#fff",
            input: "date",
            inputAttributes: {
              min: dayjs().tz(TZ).format("YYYY-MM-DD"),
            },
            showCancelButton: true,
            confirmButtonColor: "#00ffcc",
          });

          if (!date) return false;
          selectedDate = normalizeDateToYMD(date);
        }

        const totalDuration = selectedServices.reduce(
          (sum, service) => sum + (parseInt(service?.duration, 10) || 30),
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
            title: "Sem horários",
            text: "Nenhum horário disponível para essa data.",
          });
          return false;
        }

        if (selectedTime && !availableTimes.includes(selectedTime)) {
          await Swal.fire({
            background: "#0a0a0c",
            color: "#fff",
            icon: "warning",
            title: "Horário indisponível",
            text: "O horário escolhido não está mais disponível. Selecione outro horário.",
            confirmButtonColor: "#00aaff",
          });
          return false;
        }

        if (!selectedTime) {
          const { value: time } = await Swal.fire({
            title: "Escolha o horário",
            background: "#0a0a0c",
            color: "#fff",
            html: `
              <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
                ${availableTimes
                  .map(
                    (timeValue) => `<button type="button" class="swal2-confirm swal2-styled" data-time="${escapeHtml(timeValue)}">${escapeHtml(timeValue)}</button>`
                  )
                  .join("")}
              </div>
            `,
            showCancelButton: true,
            cancelButtonText: "Voltar",
            showConfirmButton: false,
            didOpen: () => {
              Swal.getPopup()
                ?.querySelectorAll("[data-time]")
                .forEach((btn) => {
                  btn.addEventListener("click", () => Swal.close({ isConfirmed: true, value: btn.dataset.time }));
                });
            },
          });

          if (!time) return false;
          selectedTime = time;
        }

        // Revalida o slot imediatamente antes da gravação para reduzir conflito de concorrência.
        const freshTimes = await loadAvailableTimes(
          selectedDate,
          selectedEmployer,
          totalDuration
        );
        if (!freshTimes.includes(selectedTime)) {
          await Swal.fire({
            background: "#0a0a0c",
            color: "#fff",
            icon: "warning",
            title: "Horário não está mais disponível",
            text: "Outro cliente pode ter reservado este horário. Escolha outro horário para continuar.",
            confirmButtonColor: "#00aaff",
          });
          return false;
        }

        const datetimeSP = dayjs.tz(
          `${selectedDate} ${selectedTime}`,
          "YYYY-MM-DD HH:mm",
          TZ
        );

        const payload = {
          mode: "appointment",
          app_id: appId,
          entity_name: "establishment",
          entity_id: establishment?.id,
          items: selectedServices.map((service) => ({
            item_id: Number(service?.item_id ?? service?.id),
            quantity: 1,
          })),
          customer_name:
            authUser?.name ||
            `${authUser?.first_name || ""} ${authUser?.last_name || ""}`.trim() ||
            "Cliente App",
          customer_phone: authUser?.phone ?? authUser?.profile?.phone ?? null,
          customer_cpf: authUser?.cpf ?? authUser?.profile?.cpf ?? null,
          order_datetime: datetimeSP.format("YYYY-MM-DDTHH:mm:ssZ"),
          attendant_id: selectedEmployer.id,
          origin: "App",
          fulfillment: "dine-in",
          payment_status: "pending",
          payment_method: "Pix",
          notes: "Agendamento feito pelo aplicativo.",
        };

        await axios.post(`${apiBaseUrl}/order`, payload, {
          headers: {
            Authorization: `Bearer ${userToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        await Swal.fire({
          background: "#0a0a0c",
          color: "#fff",
          icon: "success",
          title: "Agendamento confirmado",
          text: `${dayjs(selectedDate).format("DD/MM/YYYY")} às ${selectedTime}`,
          confirmButtonColor: "#00ffcc",
        });

        return true;
      } catch (error) {
        await Swal.fire({
          background: "#0a0a0c",
          color: "#fff",
          icon: "error",
          title: "Erro",
          text:
            error?.response?.data?.message ||
            error?.message ||
            "Erro ao realizar o agendamento.",
        });
        return false;
      }
    },
    [
      apiBaseUrl,
      appId,
      establishment,
      getToken,
      getUser,
      loadAvailableTimes,
      normalizeDateToYMD,
    ]
  );

  return { loadAvailableTimes, handleCreateAppointment };
}
