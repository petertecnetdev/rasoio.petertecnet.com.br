// src/hooks/useEmployerSchedules.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";

export const EMPLOYER_DAYS = [
  { key: "monday", label: "Segunda" },
  { key: "tuesday", label: "Terça" },
  { key: "wednesday", label: "Quarta" },
  { key: "thursday", label: "Quinta" },
  { key: "friday", label: "Sexta" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

const DEFAULT_START = "09:00";
const DEFAULT_END = "18:00";

const toHM = (value) => {
  if (!value) return "";
  const text = String(value);
  return /^\d{2}:\d{2}/.test(text) ? text.slice(0, 5) : "";
};

const toMinutes = (value) => {
  const [hours, minutes] = toHM(value).split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : NaN;
};

const normalize = (schedule) => ({
  ...schedule,
  start_time: toHM(schedule.start_time),
  end_time: toHM(schedule.end_time),
});

const getSchedulesArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.schedules)) return data.schedules;
  return [];
};

export default function useEmployerSchedules() {
  const mountedRef = useRef(true);
  const [employerId, setEmployerId] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [addDay, setAddDay] = useState("monday");
  const [addStart, setAddStart] = useState(DEFAULT_START);
  const [addEnd, setAddEnd] = useState(DEFAULT_END);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const loadEmployer = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      const { data } = await api.get("/auth/me");
      const employer = data?.employer || data?.user?.employer || null;
      if (mountedRef.current) setEmployerId(employer?.id || null);
    } catch (error) {
      if (mountedRef.current) {
        setEmployerId(null);
        setApiError(error?.response?.data?.message || "Não foi possível identificar seu perfil de barbeiro.");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const loadSchedules = useCallback(
    async (id) => {
      const targetId = id || employerId;
      if (!targetId) return;

      try {
        setLoading(true);
        setApiError(null);
        const { data } = await api.post("/employer/list-schedules", {
          employer_id: targetId,
        });

        // Esta tela administra somente a escala semanal recorrente. Reservas
        // pontuais (break/holiday) têm outra finalidade e não devem ser
        // transformadas em expediente ao salvar a disponibilidade semanal.
        const workSchedules = getSchedulesArray(data)
          .filter((schedule) => !schedule.type || schedule.type === "work")
          .map(normalize);

        if (mountedRef.current) setSchedules(workSchedules);
      } catch (error) {
        if (mountedRef.current) {
          setApiError(error?.response?.data?.message || error?.response?.data?.error || "Erro ao carregar horários.");
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [employerId]
  );

  useEffect(() => {
    mountedRef.current = true;
    loadEmployer();
    return () => {
      mountedRef.current = false;
    };
  }, [loadEmployer]);

  useEffect(() => {
    if (employerId) loadSchedules(employerId);
  }, [employerId, loadSchedules]);

  const schedulesByDay = useMemo(() => {
    const result = Object.fromEntries(EMPLOYER_DAYS.map((day) => [day.key, []]));
    schedules.forEach((schedule) => {
      if (result[schedule.day_of_week]) result[schedule.day_of_week].push(schedule);
    });
    Object.values(result).forEach((list) =>
      list.sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
    );
    return result;
  }, [schedules]);

  const dayOffByDay = useMemo(
    () => Object.fromEntries(
      EMPLOYER_DAYS.map((day) => [day.key, (schedulesByDay[day.key] || []).length === 0])
    ),
    [schedulesByDay]
  );

  const handleSetDayOff = useCallback((dayKey, shouldBeOff) => {
    setApiError(null);
    setActionMessage(null);

    if (shouldBeOff) {
      setSchedules((current) => current.filter((schedule) => schedule.day_of_week !== dayKey));
      setActionMessage("Folga semanal definida. Salve as alterações para confirmar.");
      return;
    }

    setSchedules((current) => {
      if (current.some((schedule) => schedule.day_of_week === dayKey)) return current;
      return [
        ...current,
        {
          id: `tmp-${dayKey}-${Date.now()}`,
          day_of_week: dayKey,
          start_time: DEFAULT_START,
          end_time: DEFAULT_END,
          type: "work",
          is_active: true,
          __local: true,
        },
      ];
    });
    setAddDay(dayKey);
    setAddStart(DEFAULT_START);
    setAddEnd(DEFAULT_END);
    setActionMessage("Dia reativado com horário inicial de 09:00 às 18:00. Ajuste se necessário e salve.");
  }, []);

  const handleAddScheduleLocal = useCallback(() => {
    setApiError(null);
    setActionMessage(null);

    const start = toMinutes(addStart);
    const end = toMinutes(addEnd);

    if (!addDay || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      setApiError("Informe um horário inicial e final válidos.");
      return false;
    }

    const overlaps = schedules.some((schedule) => {
      if (schedule.day_of_week !== addDay) return false;
      const existingStart = toMinutes(schedule.start_time);
      const existingEnd = toMinutes(schedule.end_time);
      return start < existingEnd && end > existingStart;
    });

    if (overlaps) {
      setApiError("Esse período conflita com outro horário cadastrado no mesmo dia.");
      return false;
    }

    setSchedules((current) => [
      ...current,
      {
        id: `tmp-${Date.now()}`,
        day_of_week: addDay,
        start_time: toHM(addStart),
        end_time: toHM(addEnd),
        type: "work",
        is_active: true,
        __local: true,
      },
    ]);
    setActionMessage("Horário adicionado. Salve as alterações para confirmar.");
    return true;
  }, [addDay, addStart, addEnd, schedules]);

  const handleRemoveSchedule = useCallback(async (schedule) => {
    setApiError(null);
    setActionMessage(null);

    if (schedule.__local) {
      setSchedules((current) => current.filter((item) => item.id !== schedule.id));
      setActionMessage("Horário removido. Se este era o último período do dia, o dia passa a ser folga semanal ao salvar.");
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/employer/delete-schedule/${schedule.id}`);
      setSchedules((current) => current.filter((item) => item.id !== schedule.id));
      setActionMessage("Horário removido com sucesso.");
    } catch (error) {
      setApiError(error?.response?.data?.message || error?.response?.data?.error || "Erro ao remover horário.");
    } finally {
      setDeleting(false);
    }
  }, []);

  const handleSaveSchedules = useCallback(async () => {
    if (!employerId) return;

    try {
      setSaving(true);
      setApiError(null);
      setActionMessage(null);

      const payload = schedules.map((schedule) => ({
        day_of_week: schedule.day_of_week,
        start_time: toHM(schedule.start_time),
        end_time: toHM(schedule.end_time),
      }));

      await api.post("/employer/save-schedules", {
        employer_id: employerId,
        schedules: payload,
      });

      await loadSchedules(employerId);
      setActionMessage("Disponibilidade semanal salva com sucesso.");
    } catch (error) {
      setApiError(error?.response?.data?.message || error?.response?.data?.error || "Erro ao salvar horários.");
    } finally {
      setSaving(false);
    }
  }, [employerId, schedules, loadSchedules]);

  return {
    employerId,
    schedulesByDay,
    dayOffByDay,
    addDay,
    setAddDay,
    addStart,
    setAddStart,
    addEnd,
    setAddEnd,
    loading,
    saving,
    deleting,
    apiError,
    actionMessage,
    handleSetDayOff,
    handleAddScheduleLocal,
    handleRemoveSchedule,
    handleSaveSchedules,
  };
}
