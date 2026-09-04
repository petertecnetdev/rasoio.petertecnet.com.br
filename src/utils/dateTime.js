const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export const formatDatePtBr = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const match = value.trim().match(DATE_ONLY);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const formatCurrencyBr = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
