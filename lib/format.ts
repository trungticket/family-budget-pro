export function formatMoney(value: number, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: currency === 'VND' ? 0 : 2 }).format(Number.isFinite(value) ? value : 0);
}
export function parseAmount(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? '0').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}
export function percent(value: number) { return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '0%'; }
