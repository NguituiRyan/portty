import {
  BadgeCheck,
  ChevronRight,
  FileText,
  Fingerprint,
  Gauge,
  HelpCircle,
  LogOut,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useBank } from "../store/bank";
import { Card, Pill } from "../components/ui";
import { fmtDate, fmtMoney } from "../lib/format";

export function Profile() {
  const { state, dispatch } = useBank();
  const u = state.user;

  const tiers = [
    { tier: 1 as const, label: "Basic", desc: "Phone + ID verified · borrow up to KES 70,000" },
    { tier: 2 as const, label: "Verified", desc: "Income verified · borrow up to KES 3M" },
    { tier: 3 as const, label: "Premium", desc: "Full KYC + collateral · borrow up to KES 10M" },
  ];

  const rows = [
    { icon: Fingerprint, label: "Security & biometrics" },
    { icon: FileText, label: "Statements & documents" },
    { icon: HelpCircle, label: "Help & support" },
  ];

  return (
    <div className="animate-rise px-4 pb-28 pt-5">
      <h1 className="mb-4 text-xl font-bold">Profile</h1>

      <Card className="flex items-center gap-4 p-5">
        <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-lg font-bold text-white">
          {u.avatarInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-semibold">
            {u.name} <BadgeCheck size={16} className="text-sky-400" />
          </p>
          <p className="truncate text-xs text-slate-400">{u.email}</p>
          <p className="text-xs text-slate-500">
            {u.phone} · Member since {fmtDate(u.memberSince)}
          </p>
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 font-semibold">
            <Gauge size={16} className="text-emerald-400" /> Credit profile
          </p>
          <Pill tone="good">{u.creditScore} / 900</Pill>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Credit limit <span className="font-semibold text-slate-200">{fmtMoney(u.creditLimit)}</span>. On-time
          repayments grow your score and unlock larger, cheaper loans.
        </p>
      </Card>

      <Card className="mt-4 p-5">
        <p className="mb-3 flex items-center gap-1.5 font-semibold">
          <ShieldCheck size={16} className="text-sky-400" /> KYC tier
        </p>
        <div className="space-y-2.5">
          {tiers.map((t) => (
            <div
              key={t.tier}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${
                t.tier === u.kycTier
                  ? "border-sky-400/70 bg-sky-500/10"
                  : "border-line/60 bg-white/[0.03]"
              }`}
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  t.tier <= u.kycTier ? "bg-sky-500 text-white" : "bg-white/10 text-slate-400"
                }`}
              >
                {t.tier}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Tier {t.tier} — {t.label}
                </p>
                <p className="text-xs text-slate-500">{t.desc}</p>
              </div>
              {t.tier === u.kycTier ? (
                <Pill tone="brand">Current</Pill>
              ) : t.tier < u.kycTier ? (
                <BadgeCheck size={18} className="text-emerald-400" />
              ) : (
                <button className="text-xs font-semibold text-sky-400">Upgrade</button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4 divide-y divide-line/40 px-4">
        {rows.map(({ icon: Icon, label }) => (
          <button key={label} className="flex w-full items-center gap-3 py-3.5 text-left text-sm font-medium">
            <Icon size={18} className="text-slate-400" />
            <span className="flex-1">{label}</span>
            <ChevronRight size={16} className="text-slate-600" />
          </button>
        ))}
        <button
          onClick={() => dispatch({ type: "reset" })}
          className="flex w-full items-center gap-3 py-3.5 text-left text-sm font-medium text-amber-300"
        >
          <RotateCcw size={18} />
          <span className="flex-1">Reset demo data</span>
        </button>
        <button className="flex w-full items-center gap-3 py-3.5 text-left text-sm font-medium text-rose-400">
          <LogOut size={18} />
          <span className="flex-1">Sign out</span>
        </button>
      </Card>
    </div>
  );
}
