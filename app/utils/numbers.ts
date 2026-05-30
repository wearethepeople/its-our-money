export const formatPercent = (value: number | null) =>
  value == null ? "-" : `${value.toFixed(1)}%`;

export const formatSignedPercent = (value: number | null) =>
  value == null ? "-" : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const formatCurrency = (value: number) => currencyFormatter.format(value);

export const formatSignedCurrency = (value: number) => {
  const formatted = currencyFormatter.format(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
};
