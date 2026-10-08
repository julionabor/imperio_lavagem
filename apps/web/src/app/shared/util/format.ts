/** Formata cêntimos como euros em pt-PT: 2490000 → "24 900 €" */
export function formatEur(cents: number, decimals = 0): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(cents / 100);
}

/** Formata quilómetros com separador: 55000 → "55 000 km" */
export function formatKm(km: number): string {
  return new Intl.NumberFormat('pt-PT').format(km) + '\u00a0km';
}

/** Formata pontos base como percentagem: 1500 → "15,00 %" */
export function formatBp(bp: number, decimals = 2): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(bp / 10000);
}
