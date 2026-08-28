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
  const [addStart, setAddStart] = useState("09:00");
  const [addEnd, setAddEnd] = useState("18:00");
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
        if (mountedRef.current) setSchedules(getSchedulesArray(data).map(normalize));
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
        type: schedule.type || "work",
        is_active: schedule.is_active !== false,
      }));

      await api.post("/employer/save-schedules", {
        employer_id: employerId,
        schedules: payload,
      });

      await loadSchedules(employerId);
      setActionMessage("Horários salvos com sucesso.");
    } catch (error) {
      setApiError(error?.response?.data?.message || error?.response?.data?.error || "Erro ao salvar horários.");
    } finally {
      setSaving(false);
    }
  }, [employerId, schedules, loadSchedules]);

  return {
    employerId,
    schedulesByDay,
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
    handleAddScheduleLocal,
    handleRemoveSchedule,
    handleSaveSchedules,
  };
}
