import { Link } from "react-router-dom";
import { ChevronRight, Gauge, HandCoins, ShieldCheck, Sparkles } from "lucide-react";
import { useBank } from "../store/bank";
import { Card, EmptyState, Pill, ProgressBar } from "../components/ui";
import { fmtMoney, daysUntil } from "../lib/format";
import { nextDue, outstanding, progressPct } from "../lib/loanMath";

function scoreBand(score: number): { label: string; tone: "good" | "warn" | "bad" } {
  if (score >= 700) return { label: "Excellent", tone: "good" };
  if (score >= 580) return { label: "Fair", tone: "warn" };
  return { label: "Building", tone: "bad" };
}

export function Loans() {
  const { state, products } = useBank();
  const active = state.loans.filter((l) => l.status !== "repaid");
  const repaid = state.loans.filter((l) => l.status === "repaid");
  const owed = active.reduce((s, l) => s + outstanding(l.schedule), 0);
  const available = Math.max(0, state.user.creditLimit - owed);
  const band = scoreBand(state.user.creditScore);

  return (
    <div className="animate-rise px-4 pb-28 pt-5">
      <h1 className="mb-4 text-xl font-bold">Loans</h1>

      <Card className="bg-gradient-to-br from-emerald-600/80 to-teal-800/80 p-5 !border-emerald-500/30">
        <div className="flex items-center justify-between">
          <p className="text-sm text-emerald-100/90">Available to borrow</p>
          <Pill tone={band.tone}>
            <Gauge size={12} className="mr-1" /> {state.user.creditScore} · {band.label}
          </Pill>
        </div>
        <p className="mt-1 text-3xl font-bold tracking-tight">{fmtMoney(available)}</p>
        <p className="mt-1 text-xs text-emerald-100/80">
          of {fmtMoney(state.user.creditLimit)} limit · {fmtMoney(owed)} outstanding
        </p>
        <Link
          to="/loans/apply"
          className="mt-4 block rounded-xl bg-white/15 py-3 text-center font-semibold text-white backdrop-blur transition active:scale-[0.98]"
        >
          Apply for a loan
        </Link>
      </Card>

      <section className="mt-6">
        <h2 className="mb-2 font-semibold">Active loans</h2>
        {active.length === 0 ? (
          <Card>
            <EmptyState
              icon={<HandCoins size={22} />}
              title="No active loans"
              body="You're all settled. Apply in seconds whenever you need a boost."
            />
          </Card>
        ) : (
          active.map((loan) => {
            const due = nextDue(loan.schedule);
            const days = due ? daysUntil(due.dueDate) : 0;
            return (
              <Link key={loan.id} to={`/loans/${loan.id}`}>
                <Card className="mb-3 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{loan.productName}</p>
                      <p className="text-xs text-slate-400">
                        {fmtMoney(loan.principal)} ·{" "}
                        {loan.rateType === "flat_fee"
                          ? `${loan.facilityFeePct}% flat fee`
                          : `${loan.ratePa}% p.a.`}
                      </p>
                    </div>
                    <Pill tone={days < 0 ? "bad" : days <= 7 ? "warn" : "good"}>
                      {due ? (days < 0 ? `${-days}d overdue` : `Due in ${days}d`) : "Cleared"}
                    </Pill>
                  </div>
                  <div className="mt-3 flex items-end justify-between text-sm">
                    <span className="text-slate-400">Outstanding</span>
                    <span className="font-semibold">{fmtMoney(outstanding(loan.schedule))}</span>
                  </div>
                  <ProgressBar pct={progressPct(loan.schedule)} className="mt-2" />
                </Card>
              </Link>
            );
          })
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 font-semibold">Loan products</h2>
        {products.map((p) => {
          const locked = state.user.kycTier < p.requiresKycTier;
          return (
            <Link key={p.id} to={locked ? "/profile" : `/loans/apply?product=${p.id}`}>
              <Card className="mb-3 flex items-center gap-3.5 p-4">
                <div
                  className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${p.color} text-white`}
                >
                  {p.instantDisbursement ? <Sparkles size={20} /> : <ShieldCheck size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{p.name}</p>
                    {locked && <Pill tone="warn">Tier {p.requiresKycTier}</Pill>}
                  </div>
                  <p className="truncate text-xs text-slate-400">{p.tagline}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {fmtMoney(p.minAmount)} – {fmtMoney(p.maxAmount)} ·{" "}
                    {p.rateType === "flat_fee" ? `${p.facilityFeePct}% flat` : `${p.ratePa}% p.a.`}
                  </p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-slate-500" />
              </Card>
            </Link>
          );
        })}
      </section>

      {repaid.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 font-semibold">Repaid</h2>
          {repaid.map((loan) => (
            <Link key={loan.id} to={`/loans/${loan.id}`}>
              <Card className="mb-3 flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{loan.productName}</p>
                  <p className="text-xs text-slate-400">
                    {fmtMoney(loan.principal)} over {loan.termMonths} months
                  </p>
                </div>
                <Pill tone="good">Repaid ✓</Pill>
              </Card>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
