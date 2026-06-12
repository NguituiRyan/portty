# Portty — Mobile Banking & Loans

A polished, mobile-first digital banking app with a full lending stack, built with
**React 19 + TypeScript + Vite + Tailwind CSS 4**. Everything runs client-side against a
richly seeded demo dataset (persisted to `localStorage`), so the whole product is
interactive out of the box — borrow, repay, transfer, freeze cards.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-checks and produces dist/
```

Open it in a phone-sized viewport (or device toolbar) — the layout is mobile-first
with a bottom tab bar and safe-area support.

## Features

### Lending (the core)
- **5 loan products** modelled on real Tier 1 bank offerings:
  | Product | Range | Pricing | Term |
  |---|---|---|---|
  | Portty Boost | 500 – 70K | 7.5% flat fee | 30 days |
  | Salary Advance | 2K – 150K | 5% flat fee | 1–2 months |
  | Personal Flexi | 50K – 3M | 13.5% p.a. reducing balance | 6–60 months |
  | Business Growth | 100K – 10M | 14.5% p.a. reducing balance | 12–84 months |
  | Asset Financing | 300K – 8M | 15% p.a. reducing balance | 12–60 months |
- **Real loan math** — EMI (equated monthly installment) on a reducing balance,
  full amortization schedules with per-installment principal/interest split,
  processing fees, and flat-fee micro-loan pricing.
- **Application flow** — pick a product, slide an amount, choose a term, see a live
  quote (monthly payment, total interest, total repayable, net disbursed) and a
  schedule preview, then get instantly "disbursed" into your account.
- **Loan servicing** — pay the next installment or settle early (no penalty),
  with balances, transactions and notifications updating accordingly.
- **Credit profile & KYC tiers** — credit score, credit limit headroom, and
  tier-gated products (Tier 1/2/3) shown on the Profile screen.

### Everyday banking
- Dashboard with total balance, account cards, quick actions and recent activity.
- Two accounts (current + 8.2% p.a. savings) and 40+ seeded transactions across
  salary, bills, M-PESA-style transfers, card spend, airtime and loan events.
- Send money to saved payees and move money between own accounts.
- Card management — physical + virtual cards with spend limits and freeze/unfreeze.
- Searchable, filterable activity feed grouped by day.
- Notification center.

## Architecture

```
src/
  types.ts           Domain model (accounts, loans, schedules, cards…)
  lib/loanMath.ts    EMI, quotes, amortization schedule builder
  lib/format.ts      KES currency / date helpers
  data/seed.ts       Seeded demo data (dates generated relative to today)
  store/bank.tsx     React context + reducer; actions for transfers,
                     loan origination, repayment, settlement; localStorage persistence
  components/        Reusable UI (cards, pills, progress, nav, tx rows)
  screens/           Dashboard, Loans, LoanApply, LoanDetail, Send, Move,
                     Transactions, Cards, Profile, Notifications
```

Demo data resets any time via **Profile → Reset demo data**.
