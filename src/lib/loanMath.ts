import type { LoanProduct, ScheduleEntry } from "../types";

/** Equated monthly installment for a reducing-balance loan. */
export function emi(principal: number, ratePa: number, termMonths: number): number {
  const r = ratePa / 100 / 12;
  if (r === 0) return principal / termMonths;
  const f = Math.pow(1 + r, termMonths);
  return (principal * r * f) / (f - 1);
}

export interface LoanQuote {
  monthlyPayment: number;
  totalInterest: number;
  totalRepayable: number;
  processingFee: number;
  netDisbursed: number;
}

export function quote(product: LoanProduct, principal: number, termMonths: number): LoanQuote {
  const processingFee = Math.round(principal * (product.processingFeePct / 100));
  if (product.rateType === "flat_fee") {
    const fee = Math.round(principal * ((product.facilityFeePct ?? 0) / 100));
    const total = principal + fee;
    return {
      monthlyPayment: Math.round(total / termMonths),
      totalInterest: fee,
      totalRepayable: total,
      processingFee,
      netDisbursed: principal - processingFee,
    };
  }
  const m = emi(principal, product.ratePa ?? 0, termMonths);
  const total = m * termMonths;
  return {
    monthlyPayment: Math.round(m),
    totalInterest: Math.round(total - principal),
    totalRepayable: Math.round(total),
    processingFee,
    netDisbursed: principal - processingFee,
  };
}

export function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

/** Build a full amortization schedule starting one month after startDate. */
export function buildSchedule(
  product: Pick<LoanProduct, "rateType" | "ratePa" | "facilityFeePct">,
  principal: number,
  termMonths: number,
  startDate: string
): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  if (product.rateType === "flat_fee") {
    const fee = Math.round(principal * ((product.facilityFeePct ?? 0) / 100));
    const total = principal + fee;
    const per = Math.round(total / termMonths);
    let bal = total;
    for (let n = 1; n <= termMonths; n++) {
      const payment = n === termMonths ? bal : per;
      bal -= payment;
      entries.push({
        n,
        dueDate: addMonths(startDate, n),
        payment,
        principal: Math.round(payment * (principal / total)),
        interest: Math.round(payment * (fee / total)),
        balanceAfter: bal,
        paid: false,
      });
    }
    return entries;
  }

  const r = (product.ratePa ?? 0) / 100 / 12;
  const m = emi(principal, product.ratePa ?? 0, termMonths);
  let bal = principal;
  for (let n = 1; n <= termMonths; n++) {
    const interest = bal * r;
    let principalPart = m - interest;
    let payment = m;
    if (n === termMonths) {
      principalPart = bal;
      payment = bal + interest;
    }
    bal = Math.max(0, bal - principalPart);
    entries.push({
      n,
      dueDate: addMonths(startDate, n),
      payment: Math.round(payment),
      principal: Math.round(principalPart),
      interest: Math.round(interest),
      balanceAfter: Math.round(bal),
      paid: false,
    });
  }
  return entries;
}

export function outstanding(schedule: ScheduleEntry[]): number {
  return schedule.filter((e) => !e.paid).reduce((s, e) => s + e.payment, 0);
}

export function nextDue(schedule: ScheduleEntry[]): ScheduleEntry | undefined {
  return schedule.find((e) => !e.paid);
}

export function progressPct(schedule: ScheduleEntry[]): number {
  const total = schedule.reduce((s, e) => s + e.payment, 0);
  const paid = schedule.filter((e) => e.paid).reduce((s, e) => s + e.payment, 0);
  return total === 0 ? 0 : Math.round((paid / total) * 100);
}
