import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Sparkles, Zap } from "lucide-react";
import { useBank } from "../store/bank";
import { Card, Pill, PrimaryButton, ScreenHeader } from "../components/ui";
import { fmtMoney, fmtDateShort } from "../lib/format";
import { buildSchedule, quote } from "../lib/loanMath";

export function LoanApply() {
  const { state, products, dispatch } = useBank();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const eligible = products.filter((p) => state.user.kycTier >= p.requiresKycTier);
  const preset = params.get("product");
  const [productId, setProductId] = useState(
    preset && eligible.some((p) => p.id === preset) ? preset : eligible[0].id
  );
  const product = eligible.find((p) => p.id === productId)!;

  const [amount, setAmount] = useState(() =>
    Math.min(product.maxAmount, Math.max(product.minAmount, Math.round((product.minAmount + product.maxAmount) / 8)))
  );
  const [term, setTerm] = useState(product.termSteps[Math.floor(product.termSteps.length / 2)]);
  const [accountId, setAccountId] = useState(state.accounts[0].id);
  const [done, setDone] = useState(false);

  const clampedAmount = Math.min(product.maxAmount, Math.max(product.minAmount, amount));
  const clampedTerm = product.termSteps.includes(term) ? term : product.termSteps[0];
  const q = useMemo(() => quote(product, clampedAmount, clampedTerm), [product, clampedAmount, clampedTerm]);
  const preview = useMemo(
    () => buildSchedule(product, clampedAmount, clampedTerm, new Date().toISOString()).slice(0, 3),
    [product, clampedAmount, clampedTerm]
  );

  function selectProduct(id: string) {
    const p = eligible.find((x) => x.id === id)!;
    setProductId(id);
    setAmount(Math.min(p.maxAmount, Math.max(p.minAmount, Math.round((p.minAmount + p.maxAmount) / 8))));
    setTerm(p.termSteps[Math.floor(p.termSteps.length / 2)]);
  }

  function submit() {
    dispatch({ type: "apply_loan", productId, principal: clampedAmount, termMonths: clampedTerm, accountId });
    setDone(true);
  }

  if (done) {
    return (
      <div className="animate-rise flex min-h-dvh flex-col items-center justify-center px-6 pb-24 text-center">
        <CheckCircle2 size={64} className="text-emerald-400" />
        <h1 className="mt-4 text-2xl font-bold">You're funded! ⚡</h1>
        <p className="mt-2 text-slate-400">
          {fmtMoney(q.netDisbursed)} has been disbursed to your account. First payment of{" "}
          {fmtMoney(q.monthlyPayment)} is due {fmtDateShort(preview[0].dueDate)}.
        </p>
        <div className="mt-8 w-full space-y-3">
          <PrimaryButton onClick={() => navigate("/loans")}>View my loans</PrimaryButton>
          <Link to="/" className="block py-2 text-sm text-slate-400">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const sliderStep = product.maxAmount > 500_000 ? 10_000 : product.maxAmount > 50_000 ? 5_000 : 500;

  return (
    <div className="animate-rise pb-32">
      <ScreenHeader title="Apply for a loan" />
      <div className="space-y-5 px-4 pt-2">
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
          {eligible.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProduct(p.id)}
              className={`shrink-0 rounded-2xl border px-4 py-3 text-left transition ${
                p.id === productId
                  ? "border-sky-400/70 bg-sky-500/10"
                  : "border-line/60 bg-panel"
              }`}
            >
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="text-xs text-slate-400">
                {p.rateType === "flat_fee" ? `${p.facilityFeePct}% flat` : `${p.ratePa}% p.a.`}
              </p>
            </button>
          ))}
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">How much do you need?</p>
            {product.instantDisbursement && (
              <Pill tone="brand">
                <Zap size={12} className="mr-1" /> Instant
              </Pill>
            )}
          </div>
          <p className="mt-1 text-3xl font-bold tabular-nums">{fmtMoney(clampedAmount)}</p>
          <input
            type="range"
            min={product.minAmount}
            max={product.maxAmount}
            step={sliderStep}
            value={clampedAmount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-4 w-full accent-sky-400"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>{fmtMoney(product.minAmount)}</span>
            <span>{fmtMoney(product.maxAmount)}</span>
          </div>

          <p className="mt-5 text-sm text-slate-400">Repay over</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.termSteps.map((t) => (
              <button
                key={t}
                onClick={() => setTerm(t)}
                className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  t === clampedTerm ? "bg-sky-500 text-white" : "bg-white/5 text-slate-300"
                }`}
              >
                {t} {t === 1 ? "month" : "months"}
              </button>
            ))}
          </div>

          <p className="mt-5 text-sm text-slate-400">Disburse to</p>
          <div className="mt-2 space-y-2">
            {state.accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => setAccountId(a.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition ${
                  a.id === accountId ? "border-sky-400/70 bg-sky-500/10" : "border-line/60 bg-white/5"
                }`}
              >
                <span className="font-medium">{a.name}</span>
                <span className="text-slate-400">{fmtMoney(a.balance)}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-3 flex items-center gap-1.5 font-semibold">
            <Sparkles size={16} className="text-sky-400" /> Your quote
          </p>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">{clampedTerm === 1 ? "One-off payment" : "Monthly payment"}</dt>
              <dd className="font-semibold tabular-nums">{fmtMoney(q.monthlyPayment)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">
                {product.rateType === "flat_fee" ? "Facility fee" : "Total interest"}
              </dt>
              <dd className="tabular-nums">{fmtMoney(q.totalInterest)}</dd>
            </div>
            {q.processingFee > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-400">Processing fee ({product.processingFeePct}%)</dt>
                <dd className="tabular-nums">{fmtMoney(q.processingFee)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-400">You receive</dt>
              <dd className="tabular-nums">{fmtMoney(q.netDisbursed)}</dd>
            </div>
            <div className="flex justify-between border-t border-line/60 pt-2.5">
              <dt className="font-medium">Total repayable</dt>
              <dd className="font-bold tabular-nums">{fmtMoney(q.totalRepayable)}</dd>
            </div>
          </dl>
          {clampedTerm > 1 && (
            <div className="mt-4 rounded-xl bg-white/5 p-3 text-xs text-slate-400">
              <p className="mb-1.5 font-medium text-slate-300">First payments</p>
              {preview.map((e) => (
                <div key={e.n} className="flex justify-between py-0.5 tabular-nums">
                  <span>
                    #{e.n} · {fmtDateShort(e.dueDate)}
                  </span>
                  <span>
                    {fmtMoney(e.payment)}{" "}
                    <span className="text-slate-500">({fmtMoney(e.interest)} interest)</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{product.blurb}</p>
        </Card>

        <PrimaryButton onClick={submit}>
          Get {fmtMoney(clampedAmount)} now
        </PrimaryButton>
      </div>
    </div>
  );
}
