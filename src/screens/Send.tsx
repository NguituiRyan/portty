import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useBank } from "../store/bank";
import { Card, PrimaryButton, ScreenHeader } from "../components/ui";
import { fmtMoney } from "../lib/format";

export function Send() {
  const { state, dispatch } = useBank();
  const navigate = useNavigate();
  const [payeeId, setPayeeId] = useState<string | null>(null);
  const [fromId, setFromId] = useState(state.accounts[0].id);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const payee = state.payees.find((p) => p.id === payeeId);
  const from = state.accounts.find((a) => a.id === fromId)!;
  const value = Number(amount) || 0;
  const valid = !!payee && value >= 10 && value <= from.balance;

  function submit() {
    if (!valid || !payee) return;
    dispatch({ type: "transfer", fromAccountId: fromId, payeeName: payee.name, amount: value, note: note || undefined });
    setDone(true);
  }

  if (done && payee) {
    return (
      <div className="animate-rise flex min-h-dvh flex-col items-center justify-center px-6 pb-24 text-center">
        <CheckCircle2 size={64} className="text-emerald-400" />
        <h1 className="mt-4 text-2xl font-bold">Sent!</h1>
        <p className="mt-2 text-slate-400">
          {fmtMoney(value)} sent to {payee.name} from {from.name}.
        </p>
        <div className="mt-8 w-full">
          <PrimaryButton onClick={() => navigate("/")}>Done</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise pb-32">
      <ScreenHeader title="Send money" />
      <div className="space-y-5 px-4 pt-2">
        <section>
          <p className="mb-2 text-sm text-slate-400">To</p>
          <div className="grid grid-cols-3 gap-2.5">
            {state.payees.map((p) => (
              <button
                key={p.id}
                onClick={() => setPayeeId(p.id)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition ${
                  p.id === payeeId ? "border-sky-400/70 bg-sky-500/10" : "border-line/60 bg-panel"
                }`}
              >
                <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold">
                  {p.initials}
                </span>
                <span className="line-clamp-1 text-xs font-medium">{p.name.split(" ")[0]}</span>
                <span className="line-clamp-1 text-[10px] text-slate-500">{p.detail.split("•")[0]}</span>
              </button>
            ))}
          </div>
        </section>

        <Card className="p-5">
          <p className="text-sm text-slate-400">Amount</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-semibold text-slate-400">KES</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
              className="w-full bg-transparent text-3xl font-bold outline-none placeholder:text-slate-600"
            />
          </div>
          {value > from.balance && (
            <p className="mt-1 text-xs text-rose-400">Insufficient funds in {from.name}.</p>
          )}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            className="mt-4 w-full rounded-xl border border-line/60 bg-white/5 px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-500"
          />

          <p className="mt-5 text-sm text-slate-400">From</p>
          <div className="mt-2 space-y-2">
            {state.accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => setFromId(a.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition ${
                  a.id === fromId ? "border-sky-400/70 bg-sky-500/10" : "border-line/60 bg-white/5"
                }`}
              >
                <span className="font-medium">{a.name}</span>
                <span className="text-slate-400">{fmtMoney(a.balance)}</span>
              </button>
            ))}
          </div>
        </Card>

        <PrimaryButton onClick={submit} disabled={!valid}>
          {payee ? `Send ${fmtMoney(value)} to ${payee.name.split(" ")[0]}` : "Choose a recipient"}
        </PrimaryButton>
      </div>
    </div>
  );
}
