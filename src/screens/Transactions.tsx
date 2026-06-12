import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useBank } from "../store/bank";
import { Card } from "../components/ui";
import { TxRow } from "../components/TxRow";
import { fmtMoney, relativeDay } from "../lib/format";

const filters = ["All", "Money in", "Money out", "Loans", "Bills & Utilities", "Shopping"] as const;

export function Transactions() {
  const { state } = useBank();
  const [accountId, setAccountId] = useState<string>("all");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    return state.transactions.filter((t) => {
      if (accountId !== "all" && t.accountId !== accountId) return false;
      if (filter === "Money in" && t.amount < 0) return false;
      if (filter === "Money out" && t.amount >= 0) return false;
      if (filter === "Loans" && t.category !== "Loans") return false;
      if (filter === "Bills & Utilities" && t.category !== "Bills & Utilities") return false;
      if (filter === "Shopping" && t.category !== "Shopping") return false;
      if (query && !`${t.counterparty} ${t.note ?? ""}`.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [state.transactions, accountId, filter, query]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof list>();
    for (const t of list) {
      const key = relativeDay(t.date);
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return [...map.entries()];
  }, [list]);

  const monthOut = state.transactions
    .filter((t) => t.amount < 0 && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((s, t) => s + t.amount, 0);
  const monthIn = state.transactions
    .filter((t) => t.amount > 0 && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="animate-rise px-4 pb-28 pt-5">
      <h1 className="mb-4 text-xl font-bold">Activity</h1>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card className="p-3.5">
          <p className="text-xs text-slate-400">In this month</p>
          <p className="mt-0.5 font-bold text-emerald-300 tabular-nums">{fmtMoney(monthIn)}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-xs text-slate-400">Out this month</p>
          <p className="mt-0.5 font-bold tabular-nums">{fmtMoney(Math.abs(monthOut))}</p>
        </Card>
      </div>

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transactions"
          className="w-full rounded-xl border border-line/60 bg-panel py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-slate-500 focus:border-sky-500/60"
        />
      </div>

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="shrink-0 rounded-full border border-line/60 bg-panel px-3 py-1.5 text-xs font-medium text-slate-300 outline-none"
        >
          <option value="all">All accounts</option>
          {state.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              f === filter ? "bg-sky-500 text-white" : "bg-white/5 text-slate-400"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">No transactions match.</p>
      ) : (
        groups.map(([day, txs]) => (
          <section key={day} className="mb-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{day}</p>
            <Card className="divide-y divide-line/40 px-4">
              {txs.map((t) => (
                <TxRow key={t.id} tx={t} />
              ))}
            </Card>
          </section>
        ))
      )}
    </div>
  );
}
