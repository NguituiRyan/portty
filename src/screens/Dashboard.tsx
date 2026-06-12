import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Bell,
  ChevronRight,
  Eye,
  EyeOff,
  HandCoins,
  PiggyBank,
  Send,
} from "lucide-react";
import { useBank } from "../store/bank";
import { Card, Pill, ProgressBar } from "../components/ui";
import { TxRow } from "../components/TxRow";
import { fmtMoney, maskAccount, daysUntil } from "../lib/format";
import { nextDue, progressPct } from "../lib/loanMath";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function Dashboard() {
  const { state } = useBank();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);

  const total = state.accounts.reduce((s, a) => s + a.balance, 0);
  const unread = state.notifications.filter((n) => !n.read).length;
  const activeLoans = state.loans.filter((l) => l.status !== "repaid");
  const recent = useMemo(() => state.transactions.slice(0, 5), [state.transactions]);

  const show = (v: number) => (hidden ? "KES ••••••" : fmtMoney(v));

  const actions = [
    { label: "Send", icon: Send, to: "/send" },
    { label: "Borrow", icon: HandCoins, to: "/loans/apply" },
    { label: "Move", icon: ArrowLeftRight, to: "/move" },
    { label: "Save", icon: PiggyBank, to: "/transactions" },
  ];

  return (
    <div className="animate-rise px-4 pb-28 pt-4">
      <header className="mb-5 flex items-center gap-3">
        <Link
          to="/profile"
          className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-sm font-bold text-white"
        >
          {state.user.avatarInitials}
        </Link>
        <div className="flex-1">
          <p className="text-xs text-slate-400">{greeting()},</p>
          <p className="font-semibold">{state.user.name.split(" ")[0]} 👋</p>
        </div>
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="relative grid size-10 place-items-center rounded-full bg-white/5 text-slate-300"
        >
          <Bell size={19} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </Link>
      </header>

      <Card className="bg-gradient-to-br from-sky-600/90 via-blue-700/90 to-indigo-800/90 p-5 !border-sky-500/30">
        <div className="flex items-center justify-between">
          <p className="text-sm text-sky-100/90">Total balance</p>
          <button
            onClick={() => setHidden((h) => !h)}
            aria-label={hidden ? "Show balances" : "Hide balances"}
            className="text-sky-100/80"
          >
            {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <p className="mt-1 text-3xl font-bold tracking-tight">{show(total)}</p>
        <div className="mt-4 space-y-2.5">
          {state.accounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5">
              <div>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-sky-100/70">
                  {maskAccount(a.number)}
                  {a.interestRatePa ? ` · ${a.interestRatePa}% p.a.` : ""}
                </p>
              </div>
              <p className="font-semibold tabular-nums">{show(a.balance)}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-4 gap-3">
        {actions.map(({ label, icon: Icon, to }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-panel border border-line/60 py-3.5 text-xs font-medium text-slate-300 active:scale-95"
          >
            <Icon size={20} className="text-sky-400" />
            {label}
          </button>
        ))}
      </div>

      {activeLoans.length > 0 && (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Your loans</h2>
            <Link to="/loans" className="flex items-center text-sm text-sky-400">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          {activeLoans.slice(0, 2).map((loan) => {
            const due = nextDue(loan.schedule);
            const days = due ? daysUntil(due.dueDate) : 0;
            return (
              <Link key={loan.id} to={`/loans/${loan.id}`}>
                <Card className="mb-3 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{loan.productName}</p>
                    <Pill tone={days < 0 ? "bad" : days <= 7 ? "warn" : "good"}>
                      {due ? (days < 0 ? `${-days}d overdue` : `Due in ${days}d`) : "Cleared"}
                    </Pill>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    Next payment {due ? fmtMoney(due.payment) : "—"}
                  </p>
                  <ProgressBar pct={progressPct(loan.schedule)} className="mt-3" />
                </Card>
              </Link>
            );
          })}
        </section>
      )}

      <section className="mt-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-semibold">Recent activity</h2>
          <Link to="/transactions" className="flex items-center text-sm text-sky-400">
            See all <ChevronRight size={16} />
          </Link>
        </div>
        <Card className="divide-y divide-line/40 px-4">
          {recent.map((t) => (
            <TxRow key={t.id} tx={t} />
          ))}
        </Card>
      </section>
    </div>
  );
}
