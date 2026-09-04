export function money(value) {
  const number = Number.parseFloat(value || 0);
  return Number.isFinite(number) ? number.toFixed(2).replace(".", ",") : "0,00";
}

export function formatCurrencyBr(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(number) ? number : 0);
}
