// src/hooks/useAppointment.js
import { useCallback } from "react";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import api from "../services/api";
import { getApiErrorMessage } from "../utils/apiError";
import { escapeHtml } from "../utils/html";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "America/Sao_Paulo";

const normalizeDateToYMD = (date) => {
  if (!date) return null;
  if (typeof date === "string") return date.slice(0, 10);
  return dayjs(date).tz(TZ).format("YYYY-MM-DD");
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

const getEmployerUserId = (employer) =>
  employer?.user_id ?? employer?.user?.id ?? employer?.account_id ?? null;

const getEmployerLabel = (employer) => {
  const firstName = employer?.user?.first_name || employer?.first_name || "";
  const lastName = employer?.user?.last_name || employer?.last_name || "";
  return (
    employer?.name ||
    `${firstName} ${lastName}`.trim() ||
    employer?.user?.name ||
    "Profissional"
  );
};

export default function useAppointment(_apiBaseUrl, appId, _token, establishment) {
  const loadAvailableTimes = useCallback(async (date, employer, totalDuration) => {
    if (!employer?.id || !date) return [];

    const dateYMD = normalizeDateToYMD(date);
    if (!dateYMD) return [];

    try {
      const { data } = await api.post("/employer/available-times", {
        employer_id: employer.id,
        date: dateYMD,
        duration: Math.max(1, Number(totalDuration || 0)),
      });

      return Array.isArray(data?.available_times) ? data.available_times : [];
    } catch {
      return [];
    }
  }, []);

  const handleCreateAppointment = useCallback(
    async (initialService, preselectedEmployer = null) => {
      const authUser = getStoredUser();
      const hasToken = Boolean(localStorage.getItem("token"));

      if (!hasToken || !authUser?.id) {
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

      if (!appId || !establishment?.id) {
        await Swal.fire({
          icon: "error",
          title: "Agendamento indisponível",
          text: "Não foi possível identificar a barbearia deste agendamento.",
        });
        return false;
      }

      try {
        const initialServices = (Array.isArray(initialService) ? initialService : [initialService]).filter(Boolean);
        if (!initialServices.length) {
          throw new Error("Selecione pelo menos um serviço para agendar.");
        }

        const serviceOptions = initialServices
          .map((service, index) => {
            const name = escapeHtml(service?.name || service?.title || "Serviço");
            const price = Number(service?.price || 0).toFixed(2).replace(".", ",");
            return `
              <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;">
                <input type="checkbox" id="srv-${index}" data-service-index="${index}" checked>
                <label for="srv-${index}">${name} - R$ ${price}</label>
              </div>
            `;
          })
          .join("");

        const { value: selectedServiceIndexes } = await Swal.fire({
          title: "Escolha os serviços",
          background: "#0a0a0c",
          color: "#fff",
          html: `<div style="text-align:left;max-height:250px;overflow-y:auto;padding:10px;">${serviceOptions}</div>`,
          showCancelButton: true,
          confirmButtonText: "Avançar",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#00ffcc",
          cancelButtonColor: "#ff5555",
          preConfirm: () => {
            const checked = Array.from(
              Swal.getPopup().querySelectorAll("[data-service-index]:checked")
            ).map((input) => Number(input.dataset.serviceIndex));

            if (!checked.length) {
              Swal.showValidationMessage("Selecione pelo menos um serviço.");
              return false;
            }
            return checked;
          },
        });

        if (!Array.isArray(selectedServiceIndexes)) return false;
        const selectedServices = selectedServiceIndexes.map((index) => initialServices[index]).filter(Boolean);
        let selectedEmployer = preselectedEmployer;

        if (!selectedEmployer) {
          if (!establishment?.slug) {
            throw new Error("Não foi possível identificar a barbearia para listar os profissionais.");
          }

          const { data } = await api.get(`/employer/list-by-entity/${encodeURIComponent(establishment.slug)}`);
          const employers = Array.isArray(data?.employers) ? data.employers : [];

          if (!employers.length) {
            await Swal.fire({
              icon: "warning",
              title: "Sem profissionais",
              text: "Esta barbearia ainda não possui profissionais disponíveis para agendamento.",
            });
            return false;
          }

          const employerOptions = employers
            .map((employer) => {
              const id = escapeHtml(employer?.id);
              const label = escapeHtml(getEmployerLabel(employer));
              const isSelf = Number(getEmployerUserId(employer)) === Number(authUser.id);
              return `
                <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;">
                  <input type="radio" name="emp" id="emp-${id}" value="${id}" ${isSelf ? "disabled" : ""}>
                  <label for="emp-${id}" style="${isSelf ? "opacity:.55;" : ""}">
                    ${label}${isSelf ? " (você não pode agendar consigo mesmo)" : ""}
                  </label>
                </div>
              `;
            })
            .join("");

          const { value: employerId } = await Swal.fire({
            title: "Escolha o profissional",
            background: "#0a0a0c",
            color: "#fff",
            html: `<div style="text-align:left;max-height:280px;overflow-y:auto;padding:10px;">${employerOptions}</div>`,
            showCancelButton: true,
            confirmButtonText: "Avançar",
            cancelButtonText: "Voltar",
            confirmButtonColor: "#00ffcc",
            cancelButtonColor: "#ff5555",
            preConfirm: () => {
              const checked = Swal.getPopup().querySelector("input[name='emp']:checked");
              if (!checked) {
                Swal.showValidationMessage("Selecione um profissional.");
                return false;
              }
              return checked.value;
            },
          });

          if (!employerId) return false;
          selectedEmployer = employers.find(
            (employer) => String(employer?.id) === String(employerId)
          );
        }

        if (!selectedEmployer?.id) return false;
        if (Number(getEmployerUserId(selectedEmployer)) === Number(authUser.id)) {
          await Swal.fire({
            background: "#0a0a0c",
            color: "#fff",
            icon: "warning",
            title: "Agendamento inválido",
            text: "Você não pode criar um agendamento em que profissional e cliente sejam a mesma pessoa.",
            confirmButtonColor: "#ff5555",
          });
          return false;
        }

        const { value: date } = await Swal.fire({
          title: "Escolha a data",
          background: "#0a0a0c",
          color: "#fff",
          input: "date",
          inputAttributes: { min: dayjs().tz(TZ).format("YYYY-MM-DD") },
          showCancelButton: true,
          confirmButtonColor: "#00ffcc",
        });
        if (!date) return false;

        const selectedDate = normalizeDateToYMD(date);
        const totalDuration = selectedServices.reduce(
          (sum, service) => sum + Math.max(1, parseInt(service?.duration, 10) || 30),
          0
        );
        const availableTimes = await loadAvailableTimes(selectedDate, selectedEmployer, totalDuration);

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

        const timeOptions = availableTimes.reduce((options, time) => {
          options[String(time)] = String(time);
          return options;
        }, {});
        const { value: selectedTime } = await Swal.fire({
          title: "Escolha o horário",
          background: "#0a0a0c",
          color: "#fff",
          input: "radio",
          inputOptions: timeOptions,
          showCancelButton: true,
          confirmButtonText: "Confirmar horário",
          cancelButtonText: "Voltar",
          confirmButtonColor: "#00ffcc",
          inputValidator: (value) => (value ? undefined : "Selecione um horário."),
        });

        if (!selectedTime) return false;

        const datetime = dayjs.tz(
          `${selectedDate} ${selectedTime}`,
          "YYYY-MM-DD HH:mm",
          TZ
        );
        if (!datetime.isValid() || datetime.isBefore(dayjs().tz(TZ))) {
          throw new Error("O horário escolhido não é mais válido. Selecione outro horário.");
        }

        const payload = {
          mode: "appointment",
          app_id: appId,
          entity_name: "establishment",
          entity_id: establishment.id,
          items: selectedServices.map((service) => ({
            item_id: Number(service?.item_id ?? service?.id),
            quantity: 1,
          })),
          customer_name: authUser?.name || authUser?.first_name || "Cliente App",
          customer_phone: authUser?.phone ?? null,
          order_datetime: datetime.format("YYYY-MM-DDTHH:mm:ssZ"),
          attendant_id: selectedEmployer.id,
          origin: "App",
          fulfillment: "dine-in",
          payment_status: "pending",
          payment_method: "Pix",
          notes: "Agendamento feito pelo aplicativo.",
        };

        await api.post("/order", payload);
        await Swal.fire({
          background: "#0a0a0c",
          color: "#fff",
          icon: "success",
          title: "Agendamento confirmado",
          text: "Seu horário foi reservado com sucesso.",
          confirmButtonColor: "#00ffcc",
        });
        return true;
      } catch (error) {
        await Swal.fire({
          background: "#0a0a0c",
          color: "#fff",
          icon: "error",
          title: "Erro ao agendar",
          text: getApiErrorMessage(error, error?.message || "Erro ao realizar o agendamento."),
        });
        return false;
      }
    },
    [appId, establishment, loadAvailableTimes]
  );

  return { loadAvailableTimes, handleCreateAppointment };
}
