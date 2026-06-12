import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CreditCard,
  HandCoins,
  Percent,
  Receipt,
  Smartphone,
  Wallet,
} from "lucide-react";
import type { Transaction, TxKind } from "../types";
import { fmtSigned, relativeDay } from "../lib/format";

const kindIcon: Record<TxKind, { icon: typeof Receipt; bg: string }> = {
  transfer_in: { icon: ArrowDownLeft, bg: "bg-emerald-500/15 text-emerald-300" },
  transfer_out: { icon: ArrowUpRight, bg: "bg-sky-500/15 text-sky-300" },
  bill: { icon: Receipt, bg: "bg-violet-500/15 text-violet-300" },
  loan_disbursement: { icon: HandCoins, bg: "bg-amber-500/15 text-amber-300" },
  loan_repayment: { icon: Banknote, bg: "bg-rose-500/15 text-rose-300" },
  card: { icon: CreditCard, bg: "bg-blue-500/15 text-blue-300" },
  deposit: { icon: Wallet, bg: "bg-emerald-500/15 text-emerald-300" },
  airtime: { icon: Smartphone, bg: "bg-teal-500/15 text-teal-300" },
  interest: { icon: Percent, bg: "bg-emerald-500/15 text-emerald-300" },
  fee: { icon: Receipt, bg: "bg-slate-500/15 text-slate-300" },
};

export function TxRow({ tx }: { tx: Transaction }) {
  const { icon: Icon, bg } = kindIcon[tx.kind];
  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${bg}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-100">{tx.counterparty}</p>
        <p className="truncate text-xs text-slate-400">
          {tx.note ?? tx.category} · {relativeDay(tx.date)}
        </p>
      </div>
      <p className={`text-sm font-semibold tabular-nums ${tx.amount >= 0 ? "text-emerald-300" : "text-slate-200"}`}>
        {fmtSigned(tx.amount)}
      </p>
    </div>
  );
}
