import { Snowflake, Wifi } from "lucide-react";
import { useBank } from "../store/bank";
import { Card, Pill, ProgressBar } from "../components/ui";
import { fmtMoney } from "../lib/format";

export function Cards() {
  const { state, dispatch } = useBank();

  return (
    <div className="animate-rise px-4 pb-28 pt-5">
      <h1 className="mb-4 text-xl font-bold">Cards</h1>
      {state.cards.map((card) => (
        <div key={card.id} className="mb-6">
          <div
            className={`relative overflow-hidden rounded-3xl p-5 shadow-xl transition ${
              card.frozen
                ? "bg-gradient-to-br from-slate-600 to-slate-800 opacity-80"
                : card.network === "Visa"
                  ? "bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-900"
                  : "bg-gradient-to-br from-fuchsia-600 via-purple-700 to-indigo-900"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/90">{card.label}</p>
                <p className="text-xs text-white/60">{card.virtual ? "Virtual card" : "Physical card"}</p>
              </div>
              <Wifi size={20} className="rotate-90 text-white/70" />
            </div>
            <p className="mt-7 font-mono text-lg tracking-[0.2em] text-white">
              •••• •••• •••• {card.last4}
            </p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase text-white/50">Card holder</p>
                <p className="text-sm font-medium text-white">{state.user.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-white/50">Expires</p>
                <p className="text-sm font-medium text-white">{card.expiry}</p>
              </div>
              <p className="text-lg font-bold italic text-white/90">{card.network === "Visa" ? "VISA" : "MC"}</p>
            </div>
            {card.frozen && (
              <div className="absolute inset-0 grid place-items-center bg-black/30 backdrop-blur-[2px]">
                <Pill tone="brand">
                  <Snowflake size={12} className="mr-1" /> Frozen
                </Pill>
              </div>
            )}
          </div>

          <Card className="mt-3 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Spent this month</span>
              <span className="font-semibold tabular-nums">
                {fmtMoney(card.spentThisMonth)}{" "}
                <span className="font-normal text-slate-500">/ {fmtMoney(card.monthlyLimit)}</span>
              </span>
            </div>
            <ProgressBar pct={(card.spentThisMonth / card.monthlyLimit) * 100} className="mt-2.5" />
            <button
              onClick={() => dispatch({ type: "toggle_card_freeze", cardId: card.id })}
              className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
                card.frozen ? "bg-sky-500 text-white" : "bg-white/5 text-slate-200"
              }`}
            >
              {card.frozen ? "Unfreeze card" : "Freeze card"}
            </button>
          </Card>
        </div>
      ))}
    </div>
  );
}
