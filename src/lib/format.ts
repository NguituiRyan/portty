const kes = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

const kesCents = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function fmtMoney(amount: number, cents = false): string {
  return (cents ? kesCents : kes).format(amount);
}

export function fmtSigned(amount: number): string {
  const s = fmtMoney(Math.abs(amount));
  return amount >= 0 ? `+${s}` : `−${s}`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

export function relativeDay(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return fmtDate(iso);
}

export function daysUntil(iso: string): number {
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((startOf(new Date(iso)) - startOf(now)) / 86_400_000);
}

export function maskAccount(num: string): string {
  return `•••• ${num.slice(-4)}`;
}
