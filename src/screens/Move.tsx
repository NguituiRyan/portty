import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, CheckCircle2 } from "lucide-react";
import { useBank } from "../store/bank";
import { Card, PrimaryButton, ScreenHeader } from "../components/ui";
import { fmtMoney } from "../lib/format";

export function Move() {
  const { state, dispatch } = useBank();
  const navigate = useNavigate();
  const [fromId, setFromId] = useState(state.accounts[0].id);
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState(false);

  const from = state.accounts.find((a) => a.id === fromId)!;
  const to = state.accounts.find((a) => a.id !== fromId)!;
  const value = Number(amount) || 0;
  const valid = value >= 10 && value <= from.balance;

  function submit() {
    if (!valid) return;
    dispatch({ type: "move_between_accounts", fromAccountId: from.id, toAccountId: to.id, amount: value });
    setDone(true);
  }

  if (done) {
    return (
      <div className="animate-rise flex min-h-dvh flex-col items-center justify-center px-6 pb-24 text-center">
        <CheckCircle2 size={64} className="text-emerald-400" />
        <h1 className="mt-4 text-2xl font-bold">Moved!</h1>
        <p className="mt-2 text-slate-400">
          {fmtMoney(value)} moved from {from.name} to {to.name}.
        </p>
        <div className="mt-8 w-full">
          <PrimaryButton onClick={() => navigate("/")}>Done</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise pb-32">
      <ScreenHeader title="Move between accounts" />
      <div className="space-y-4 px-4 pt-2">
        <Card className="p-4">
          <p className="text-xs text-slate-500">From</p>
          <button
            onClick={() => setFromId(to.id)}
            className="mt-1 flex w-full items-center justify-between"
          >
            <span className="font-semibold">{from.name}</span>
            <span className="text-sm text-slate-400">{fmtMoney(from.balance)}</span>
          </button>
        </Card>
        <div className="flex justify-center">
          <button
            onClick={() => setFromId(to.id)}
            aria-label="Swap accounts"
            className="grid size-10 place-items-center rounded-full bg-sky-500/15 text-sky-300"
          >
            <ArrowDown size={18} />
          </button>
        </div>
        <Card className="p-4">
          <p className="text-xs text-slate-500">To</p>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-semibold">{to.name}</span>
            <span className="text-sm text-slate-400">{fmtMoney(to.balance)}</span>
          </div>
        </Card>

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
        </Card>

        <PrimaryButton onClick={submit} disabled={!valid}>
          Move {value > 0 ? fmtMoney(value) : "money"}
        </PrimaryButton>
      </div>
    </div>
  );
}
