import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Circle } from "lucide-react";
import { useBank } from "../store/bank";
import { Card, Pill, PrimaryButton, ProgressBar, ScreenHeader } from "../components/ui";
import { fmtDate, fmtDateShort, fmtMoney, daysUntil } from "../lib/format";
import { nextDue, outstanding, progressPct } from "../lib/loanMath";

export function LoanDetail() {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useBank();
  const [confirming, setConfirming] = useState<"installment" | "settle" | null>(null);

  const loan = state.loans.find((l) => l.id === loanId);
  if (!loan) {
    return (
      <div>
        <ScreenHeader title="Loan" />
        <p className="px-4 pt-6 text-slate-400">This loan could not be found.</p>
      </div>
    );
  }

  const due = nextDue(loan.schedule);
  const owed = outstanding(loan.schedule);
  const payAccount = state.accounts[0];
  const days = due ? daysUntil(due.dueDate) : 0;
  const totalInterest = loan.schedule.reduce((s, e) => s + e.interest, 0);

  function confirmPay() {
    if (!loan) return;
    if (confirming === "installment") {
      dispatch({ type: "pay_installment", loanId: loan.id, fromAccountId: payAccount.id });
    } else if (confirming === "settle") {
      dispatch({ type: "settle_loan", loanId: loan.id, fromAccountId: payAccount.id });
    }
    setConfirming(null);
  }

  return (
    <div className="animate-rise pb-32">
      <ScreenHeader title={loan.productName} />
      <div className="space-y-4 px-4 pt-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Outstanding balance</p>
            {loan.status === "repaid" ? (
              <Pill tone="good">Repaid ✓</Pill>
            ) : (
              <Pill tone={days < 0 ? "bad" : days <= 7 ? "warn" : "good"}>
                {due ? (days < 0 ? `${-days}d overdue` : `Due in ${days}d`) : "Cleared"}
              </Pill>
            )}
          </div>
          <p className="mt-1 text-3xl font-bold tabular-nums">{fmtMoney(owed)}</p>
          <ProgressBar pct={progressPct(loan.schedule)} className="mt-3" />
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Principal</dt>
              <dd className="font-medium tabular-nums">{fmtMoney(loan.principal)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Rate</dt>
              <dd className="font-medium">
                {loan.rateType === "flat_fee" ? `${loan.facilityFeePct}% flat fee` : `${loan.ratePa}% p.a. reducing`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Started</dt>
              <dd className="font-medium">{fmtDate(loan.startDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Total cost of credit</dt>
              <dd className="font-medium tabular-nums">{fmtMoney(totalInterest)}</dd>
            </div>
          </dl>
        </Card>

        {loan.status !== "repaid" && due && (
          <div className="space-y-2.5">
            <PrimaryButton onClick={() => setConfirming("installment")}>
              Pay {fmtMoney(due.payment)} now
            </PrimaryButton>
            <button
              onClick={() => setConfirming("settle")}
              className="w-full rounded-2xl border border-line bg-panel py-3.5 font-semibold text-slate-200 transition active:scale-[0.98]"
            >
              Settle early — {fmtMoney(owed)}
            </button>
          </div>
        )}

        <Card className="p-5">
          <p className="mb-3 font-semibold">Repayment schedule</p>
          <div className="space-y-1">
            {loan.schedule.map((e) => (
              <div
                key={e.n}
                className={`flex items-center gap-3 rounded-xl px-2 py-2.5 ${
                  !e.paid && due && e.n === due.n ? "bg-sky-500/10" : ""
                }`}
              >
                {e.paid ? (
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
                ) : (
                  <Circle size={18} className="shrink-0 text-slate-600" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    Installment {e.n} of {loan.termMonths}
                  </p>
                  <p className="text-xs text-slate-500">
                    {e.paid && e.paidDate ? `Paid ${fmtDateShort(e.paidDate)}` : `Due ${fmtDateShort(e.dueDate)}`} ·{" "}
                    {fmtMoney(e.principal)} principal + {fmtMoney(e.interest)} interest
                  </p>
                </div>
                <p className={`text-sm font-semibold tabular-nums ${e.paid ? "text-slate-500 line-through" : ""}`}>
                  {fmtMoney(e.payment)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={() => setConfirming(null)}>
          <div
            className="animate-rise w-full max-w-md rounded-t-3xl border-t border-line bg-panel p-6 pb-[max(env(safe-area-inset-bottom),24px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">
              {confirming === "installment" ? "Confirm payment" : "Settle loan early"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {fmtMoney(confirming === "installment" ? due!.payment : owed)} will be debited from{" "}
              {payAccount.name} ({fmtMoney(payAccount.balance)} available).
              {confirming === "settle" && " No early-settlement penalty applies."}
            </p>
            <div className="mt-5 space-y-2.5">
              <PrimaryButton onClick={confirmPay}>Confirm</PrimaryButton>
              <button onClick={() => setConfirming(null)} className="w-full py-2 text-sm text-slate-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loan.status === "repaid" && (
        <div className="px-4 pt-2">
          <button
            onClick={() => navigate("/loans/apply")}
            className="w-full rounded-2xl border border-line bg-panel py-3.5 font-semibold text-sky-400 transition active:scale-[0.98]"
          >
            Borrow again
          </button>
        </div>
      )}
    </div>
  );
}
