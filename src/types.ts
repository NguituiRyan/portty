export type AccountType = "current" | "savings";

export interface Account {
  id: string;
  name: string;
  number: string;
  type: AccountType;
  currency: "KES";
  balance: number;
  interestRatePa?: number;
}

export type TxKind =
  | "transfer_in"
  | "transfer_out"
  | "bill"
  | "loan_disbursement"
  | "loan_repayment"
  | "card"
  | "deposit"
  | "airtime"
  | "interest"
  | "fee";

export interface Transaction {
  id: string;
  accountId: string;
  kind: TxKind;
  /** Positive = credit, negative = debit */
  amount: number;
  counterparty: string;
  note?: string;
  date: string; // ISO
  ref: string;
  category:
    | "Income"
    | "Transfers"
    | "Bills & Utilities"
    | "Shopping"
    | "Food & Drink"
    | "Transport"
    | "Loans"
    | "Airtime & Data"
    | "Savings"
    | "Fees";
}

export type RateType = "reducing_balance" | "flat_fee";

export interface LoanProduct {
  id: string;
  name: string;
  tagline: string;
  minAmount: number;
  maxAmount: number;
  /** Annual interest rate (%) for reducing-balance products */
  ratePa?: number;
  /** One-off facility fee (%) for flat-fee products */
  facilityFeePct?: number;
  rateType: RateType;
  minTermMonths: number;
  maxTermMonths: number;
  processingFeePct: number;
  /** Months allowed as term choices; for 1-month products this is [1] */
  termSteps: number[];
  requiresKycTier: 1 | 2 | 3;
  instantDisbursement: boolean;
  color: string;
  blurb: string;
}

export type LoanStatus = "active" | "overdue" | "repaid";

export interface ScheduleEntry {
  n: number;
  dueDate: string; // ISO
  payment: number;
  principal: number;
  interest: number;
  balanceAfter: number;
  paid: boolean;
  paidDate?: string;
}

export interface Loan {
  id: string;
  productId: string;
  productName: string;
  principal: number;
  ratePa?: number;
  facilityFeePct?: number;
  rateType: RateType;
  termMonths: number;
  startDate: string;
  status: LoanStatus;
  disbursedToAccountId: string;
  schedule: ScheduleEntry[];
}

export interface CardInfo {
  id: string;
  label: string;
  last4: string;
  network: "Visa" | "Mastercard";
  expiry: string;
  frozen: boolean;
  monthlyLimit: number;
  spentThisMonth: number;
  virtual: boolean;
}

export interface Payee {
  id: string;
  name: string;
  detail: string;
  initials: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  tone: "info" | "success" | "warning";
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  memberSince: string;
  kycTier: 1 | 2 | 3;
  creditScore: number; // 0 - 900
  creditLimit: number;
  avatarInitials: string;
}

export interface BankState {
  user: UserProfile;
  accounts: Account[];
  transactions: Transaction[];
  loans: Loan[];
  cards: CardInfo[];
  payees: Payee[];
  notifications: AppNotification[];
}
