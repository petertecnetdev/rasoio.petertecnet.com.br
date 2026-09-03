// src/hooks/useAppointment.js
import { useCallback } from "react";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import schedulingApi from "../services/schedulingApi";

dayjs.extend(utc);
dayjs.extend(tz);

export default function useAppointment(apiBaseUrl, appId, token, establishment) {
  const TZ = "America/Sao_Paulo";

  const getToken = () => localStorage.getItem("token");
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  };

  const normalizeDateToYMD = (date) => {
    if (!date) return null;
    if (typeof date === "string") return date.slice(0, 10);
    return dayjs(date).tz(TZ).format("YYYY-MM-DD");
  };

  const loadAvailableTimes = useCallback(
    async (date, employer, totalDuration, resourceIds = []) => {
      try {
        if (!getToken() || !establishment?.id || !date) return [];
        const providerId = employer?.employer_id ?? employer?.id ?? null;
        if (!providerId && !resourceIds.length) return [];

        const dateYMD = normalizeDateToYMD(date);
        const { data } = await schedulingApi.availability.times({
          establishment_id: establishment.id,
          provider_id: providerId || undefined,
          resource_ids: resourceIds.length ? resourceIds : undefined,
          date: dateYMD,
          duration: Number(totalDuration || 30),
        });

        return Array.isArray(data?.data?.available_times)
          ? data.data.available_times
          : [];
      } catch {
        return [];
      }
    },
    [establishment]
  );

  const handleCreateAppointment = useCallback(
    async (initialService, preselectedEmployer = null) => {
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

      if (!establishment?.id) {
        await Swal.fire({
          icon: "error",
          title: "Estabelecimento não identificado",
          text: "Não foi possível identificar onde o serviço será realizado.",
        });
        return false;
      }

      try {
        const selectedServices = Array.isArray(initialService)
          ? initialService.filter(Boolean)
          : [initialService].filter(Boolean);
        if (!selectedServices.length) return false;

        const { value: servicesConfirmed } = await Swal.fire({
          title: "Serviços selecionados",
          background: "#0a0a0c",
          color: "#fff",
          html: `
            <div style="text-align:left;max-height:250px;overflow-y:auto;padding:10px;">
              ${selectedServices
                .map(
                  (service) => `
                    <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08)">
                      <strong>${service.name || service.title}</strong><br/>
                      <small>${parseInt(service?.duration, 10) || 30} min · R$ ${parseFloat(
                        service.price || 0
                      )
                        .toFixed(2)
                        .replace(".", ",")}</small>
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
          preConfirm: () => true,
        });
        if (!servicesConfirmed) return false;

        let selectedEmployer = preselectedEmployer;
        let selectedResourceId = null;

        if (!selectedEmployer) {
          const { data } = await schedulingApi.resources.list(establishment.id);
          const professionals = Array.isArray(data?.data)
            ? data.data.filter(
                (resource) => resource.type === "professional" && resource.employer_id
              )
            : [];

          if (!professionals.length) {
            await Swal.fire({
              background: "#0a0a0c",
              color: "#fff",
              icon: "warning",
              title: "Sem profissionais disponíveis",
              text: "Este estabelecimento ainda não possui profissionais disponíveis para agendamento.",
            });
            return false;
          }

          const { value: professional } = await Swal.fire({
            title: "Escolha o profissional",
            background: "#0a0a0c",
            color: "#fff",
            input: "select",
            inputOptions: professionals.reduce((options, resource) => {
              const user = resource?.employer?.user || {};
              const name =
                `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                user.user_name ||
                resource.name ||
                "Profissional";
              options[String(resource.id)] = name;
              return options;
            }, {}),
            inputPlaceholder: "Selecione",
            showCancelButton: true,
            confirmButtonText: "Avançar",
            cancelButtonText: "Voltar",
            inputValidator: (value) => (!value ? "Selecione um profissional." : undefined),
          });

          if (!professional) return false;
          const resource = professionals.find(
            (candidate) => String(candidate.id) === String(professional)
          );
          selectedEmployer = resource?.employer || null;
          selectedResourceId = resource?.id || null;
        }

        const providerId = selectedEmployer?.employer_id ?? selectedEmployer?.id ?? null;
        const providerUserId = selectedEmployer?.user_id ?? selectedEmployer?.user?.id ?? null;
        if (providerUserId && Number(providerUserId) === Number(authUser.id)) {
          await Swal.fire({
            background: "#0a0a0c",
            color: "#fff",
            icon: "warning",
            title: "Agendamento inválido",
            text: "Você não pode criar um agendamento consigo mesmo como cliente e profissional.",
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
          (sum, service) => sum + (parseInt(service?.duration, 10) || 30),
          0
        );
        const availableTimes = await loadAvailableTimes(
          selectedDate,
          selectedEmployer,
          totalDuration,
          selectedResourceId ? [selectedResourceId] : []
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

        const { value: selectedTime } = await Swal.fire({
          title: "Escolha o horário",
          background: "#0a0a0c",
          color: "#fff",
          input: "select",
          inputOptions: availableTimes.reduce((options, time) => {
            options[time] = time;
            return options;
          }, {}),
          inputPlaceholder: "Selecione",
          showCancelButton: true,
          cancelButtonText: "Voltar",
          inputValidator: (value) => (!value ? "Selecione um horário." : undefined),
        });
        if (!selectedTime) return false;

        const scheduledAt = dayjs.tz(
          `${selectedDate} ${selectedTime}`,
          "YYYY-MM-DD HH:mm",
          TZ
        );

        await schedulingApi.appointments.create({
          establishment_id: establishment.id,
          items: selectedServices.map((service) => ({
            item_id: Number(service?.item_id ?? service?.id),
            quantity: 1,
          })),
          provider_id: providerId || undefined,
          resource_ids: selectedResourceId ? [selectedResourceId] : undefined,
          scheduled_at: scheduledAt.format("YYYY-MM-DDTHH:mm:ssZ"),
          customer_name:
            `${authUser.first_name || ""} ${authUser.last_name || ""}`.trim() ||
            authUser.user_name ||
            "Cliente",
          customer_phone: authUser.phone || null,
          customer_email: authUser.email || null,
          payment_method: "Pix",
          notes: "Agendamento feito pelo aplicativo.",
        });

        await Swal.fire({
          background: "#0a0a0c",
          color: "#fff",
          icon: "success",
          title: "Agendamento solicitado",
          text: "Seu horário foi registrado e está aguardando confirmação.",
          confirmButtonColor: "#00ffcc",
        });

        return true;
      } catch (error) {
        const validationMessage = error?.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().filter(Boolean)[0]
          : null;
        await Swal.fire({
          background: "#0a0a0c",
          color: "#fff",
          icon: "error",
          title: "Erro",
          text:
            validationMessage ||
            error?.response?.data?.message ||
            error?.message ||
            "Erro ao realizar o agendamento.",
        });
        return false;
      }
    },
    [establishment, loadAvailableTimes]
  );

  return { loadAvailableTimes, handleCreateAppointment };
}
