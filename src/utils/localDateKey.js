const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pad2 = (value) => String(value).padStart(2, "0");

export function toLocalDateKey(value = new Date()) {
  if (typeof value === "string" && DATE_KEY_PATTERN.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}
