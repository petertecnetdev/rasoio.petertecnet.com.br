export const TZ = "America/Sao_Paulo";

export function normalizeDateLike(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  try {
    return new Date(value.includes(" ") ? value.replace(" ", "T") : value);
  } catch {
    return null;
  }
}

export function toIsoDate(value) {
  const d = normalizeDateLike(value);
  if (!d) return "";
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function isSameDayISO(a, b) {
  const dateA = toIsoDate(a);
  const dateB = toIsoDate(b);
  return dateA === dateB;
}

export function toHourMin(value) {
  const d = normalizeDateLike(value);
  if (!d) return "";
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export function weekdayPt(value) {
  const d = normalizeDateLike(value);
  if (!d) return "";
  return d.toLocaleDateString("pt-BR", { weekday: "long", timeZone: TZ });
}

export function shortPt(value) {
  const d = normalizeDateLike(value);
  if (!d) return "";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: TZ,
  });
}

export function startOfDayISO(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return toIsoDate(date);
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function getWeekdayIndex(d) {
  return normalizeDateLike(d)?.getDay() ?? 0;
}

export const PT_WEEK = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];
