import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import type { BankState, Loan, LoanProduct, Transaction } from "../types";
import { seedState, loanProducts } from "../data/seed";
import { buildSchedule, nextDue, quote } from "../lib/loanMath";

const STORAGE_KEY = "portty-state-v1";

type Action =
  | { type: "transfer"; fromAccountId: string; payeeName: string; amount: number; note?: string }
  | { type: "move_between_accounts"; fromAccountId: string; toAccountId: string; amount: number }
  | { type: "apply_loan"; productId: string; principal: number; termMonths: number; accountId: string }
  | { type: "pay_installment"; loanId: string; fromAccountId: string }
  | { type: "settle_loan"; loanId: string; fromAccountId: string }
  | { type: "toggle_card_freeze"; cardId: string }
  | { type: "mark_notifications_read" }
  | { type: "reset" };

let seq = 1000;
function newTx(partial: Omit<Transaction, "id" | "ref" | "date">): Transaction {
  seq += 1;
  return { ...partial, id: `tx-live-${seq}-${Date.now()}`, ref: `PTY${Date.now() % 10_000_000}`, date: new Date().toISOString() };
}

function credit(state: BankState, accountId: string, amount: number): BankState["accounts"] {
  return state.accounts.map((a) => (a.id === accountId ? { ...a, balance: Math.round((a.balance + amount) * 100) / 100 } : a));
}

function reducer(state: BankState, action: Action): BankState {
  switch (action.type) {
    case "transfer": {
      const t = newTx({
        accountId: action.fromAccountId,
        kind: "transfer_out",
        amount: -action.amount,
        counterparty: action.payeeName,
        category: "Transfers",
        note: action.note,
      });
      return {
        ...state,
        accounts: credit(state, action.fromAccountId, -action.amount),
        transactions: [t, ...state.transactions],
      };
    }

    case "move_between_accounts": {
      const from = state.accounts.find((a) => a.id === action.fromAccountId)!;
      const to = state.accounts.find((a) => a.id === action.toAccountId)!;
      const out = newTx({
        accountId: from.id,
        kind: "transfer_out",
        amount: -action.amount,
        counterparty: to.name,
        category: "Savings",
        note: "Own-account transfer",
      });
      const inn = newTx({
        accountId: to.id,
        kind: "transfer_in",
        amount: action.amount,
        counterparty: from.name,
        category: "Savings",
        note: "Own-account transfer",
      });
      let accounts = credit(state, from.id, -action.amount);
      accounts = accounts.map((a) => (a.id === to.id ? { ...a, balance: a.balance + action.amount } : a));
      return { ...state, accounts, transactions: [inn, out, ...state.transactions] };
    }

    case "apply_loan": {
      const product = loanProducts.find((p) => p.id === action.productId)!;
      const q = quote(product, action.principal, action.termMonths);
      const start = new Date().toISOString();
      const loan: Loan = {
        id: `loan-live-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        principal: action.principal,
        ratePa: product.ratePa,
        facilityFeePct: product.facilityFeePct,
        rateType: product.rateType,
        termMonths: action.termMonths,
        startDate: start,
        status: "active",
        disbursedToAccountId: action.accountId,
        schedule: buildSchedule(product, action.principal, action.termMonths, start),
      };
      const t = newTx({
        accountId: action.accountId,
        kind: "loan_disbursement",
        amount: q.netDisbursed,
        counterparty: product.name,
        category: "Loans",
        note: q.processingFee > 0 ? `Disbursed net of ${product.processingFeePct}% processing fee` : "Loan disbursed",
      });
      const note = {
        id: `n-${Date.now()}`,
        title: "Loan disbursed ⚡",
        body: `${product.name} of KES ${action.principal.toLocaleString()} approved and disbursed to your account.`,
        date: start,
        read: false,
        tone: "success" as const,
      };
      return {
        ...state,
        accounts: credit(state, action.accountId, q.netDisbursed),
        loans: [loan, ...state.loans],
        transactions: [t, ...state.transactions],
        notifications: [note, ...state.notifications],
      };
    }

    case "pay_installment": {
      const loan = state.loans.find((l) => l.id === action.loanId);
      if (!loan) return state;
      const due = nextDue(loan.schedule);
      if (!due) return state;
      const schedule = loan.schedule.map((e) =>
        e.n === due.n ? { ...e, paid: true, paidDate: new Date().toISOString() } : e
      );
      const done = schedule.every((e) => e.paid);
      const t = newTx({
        accountId: action.fromAccountId,
        kind: "loan_repayment",
        amount: -due.payment,
        counterparty: "Portty Loans",
        category: "Loans",
        note: `${loan.productName} — installment ${due.n}/${loan.termMonths}`,
      });
      return {
        ...state,
        accounts: credit(state, action.fromAccountId, -due.payment),
        transactions: [t, ...state.transactions],
        loans: state.loans.map((l) =>
          l.id === loan.id ? { ...l, schedule, status: done ? "repaid" : l.status } : l
        ),
      };
    }

    case "settle_loan": {
      const loan = state.loans.find((l) => l.id === action.loanId);
      if (!loan) return state;
      const owed = loan.schedule.filter((e) => !e.paid).reduce((s, e) => s + e.payment, 0);
      if (owed === 0) return state;
      const now = new Date().toISOString();
      const t = newTx({
        accountId: action.fromAccountId,
        kind: "loan_repayment",
        amount: -owed,
        counterparty: "Portty Loans",
        category: "Loans",
        note: `${loan.productName} — early settlement`,
      });
      return {
        ...state,
        accounts: credit(state, action.fromAccountId, -owed),
        transactions: [t, ...state.transactions],
        loans: state.loans.map((l) =>
          l.id === loan.id
            ? {
                ...l,
                status: "repaid",
                schedule: l.schedule.map((e) => (e.paid ? e : { ...e, paid: true, paidDate: now })),
              }
            : l
        ),
      };
    }

    case "toggle_card_freeze":
      return {
        ...state,
        cards: state.cards.map((c) => (c.id === action.cardId ? { ...c, frozen: !c.frozen } : c)),
      };

    case "mark_notifications_read":
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };

    case "reset":
      return seedState;
  }
}

interface BankContextValue {
  state: BankState;
  dispatch: React.Dispatch<Action>;
  products: LoanProduct[];
}

const BankContext = createContext<BankContextValue | null>(null);

function loadInitial(): BankState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as BankState;
  } catch {
    // fall through to seed
  }
  return seedState;
}

export function BankProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage may be unavailable (private mode); app still works in-memory
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch, products: loanProducts }), [state]);
  return <BankContext.Provider value={value}>{children}</BankContext.Provider>;
}

export function useBank(): BankContextValue {
  const ctx = useContext(BankContext);
  if (!ctx) throw new Error("useBank must be used within BankProvider");
  return ctx;
}
