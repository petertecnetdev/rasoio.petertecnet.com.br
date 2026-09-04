// src/utils/dateUtils.js
import { DateTime } from "luxon";

export const TZ = "America/Sao_Paulo";
export const PT_WEEK = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function normalizeDateLike(value) {
  if (!value) return null;
  if (DateTime.isDateTime(value)) return value.setZone(TZ);
  if (value instanceof Date) return DateTime.fromJSDate(value).setZone(TZ);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const fromIso = DateTime.fromISO(trimmed, { zone: TZ });
    if (fromIso.isValid) return fromIso.setZone(TZ);

    const fromSql = DateTime.fromSQL(trimmed, { zone: TZ });
    if (fromSql.isValid) return fromSql.setZone(TZ);
  }

  return null;
}

export function formatDatePtBr(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const match = value.trim().match(DATE_ONLY);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
  }

  const date = normalizeDateLike(value);
  return date ? date.setLocale("pt-BR").toFormat("dd/MM/yyyy") : "";
}

export function toIsoDate(value) {
  const date = normalizeDateLike(value);
  return date ? date.toISODate() : "";
}

export function isSameDayISO(a, b) {
  const dateA = toIsoDate(a);
  const dateB = toIsoDate(b);
  return Boolean(dateA && dateB && dateA === dateB);
}

export function toHourMin(value) {
  const date = normalizeDateLike(value);
  return date ? date.toFormat("HH:mm") : "";
}

export function getWeekdayIndex(value) {
  const date = normalizeDateLike(value);
  if (!date) return 0;
  // Luxon uses Monday=1..Sunday=7; the list above follows JS Sunday=0.
  return date.weekday % 7;
}

export function weekdayPt(value) {
  const date = normalizeDateLike(value);
  if (!date) return "";
  return PT_WEEK[getWeekdayIndex(date)];
}

export function shortPt(value) {
  const date = normalizeDateLike(value);
  return date ? date.toFormat("dd/MM") : "";
}

export function startOfDayISO(value) {
  const date = normalizeDateLike(value);
  return date ? date.startOf("day").toISODate() : "";
}

export function addDays(value, amount) {
  const date = normalizeDateLike(value);
  return date ? date.plus({ days: amount }) : null;
}

export function fmtFriendlyDate(value) {
  const date = normalizeDateLike(value);
  if (!date) return "";

  const today = DateTime.now().setZone(TZ).startOf("day");
  const tomorrow = today.plus({ days: 1 });
  const target = date.startOf("day");
  const time = toHourMin(date);

  if (target.equals(today)) return `Hoje às ${time}`;
  if (target.equals(tomorrow)) return `Amanhã às ${time}`;

  const diffDays = Math.floor(target.diff(today, "days").days);
  if (diffDays > 1 && diffDays < 7) {
    const weekday = weekdayPt(date);
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} às ${time}`;
  }

  const day = date.toFormat("dd");
  const month = date.setLocale("pt-BR").toFormat("LLLL");
  return `${day} de ${month} de ${date.year} às ${time}`;
}

export function fmtTimeRange(startValue, durationMinutes) {
  const start = normalizeDateLike(startValue);
  if (!start) return "";
  const end = start.plus({ minutes: Number(durationMinutes || 0) });
  return `${toHourMin(start)} - ${toHourMin(end)}`;
}
