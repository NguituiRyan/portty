import type {
  Account,
  AppNotification,
  BankState,
  CardInfo,
  Loan,
  LoanProduct,
  Payee,
  Transaction,
  TxKind,
  UserProfile,
} from "../types";
import { buildSchedule } from "../lib/loanMath";

/** ISO timestamp `days` ago at a stable-ish time of day. */
function ago(days: number, hour = 11): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, (days * 17) % 60, 0, 0);
  return d.toISOString();
}

export const loanProducts: LoanProduct[] = [
  {
    id: "lp-boost",
    name: "Portty Boost",
    tagline: "Instant cash in under 30 seconds",
    minAmount: 500,
    maxAmount: 70_000,
    facilityFeePct: 7.5,
    rateType: "flat_fee",
    minTermMonths: 1,
    maxTermMonths: 1,
    processingFeePct: 0,
    termSteps: [1],
    requiresKycTier: 1,
    instantDisbursement: true,
    color: "from-amber-400 to-orange-500",
    blurb:
      "A 30-day micro-loan disbursed straight to your account. One flat 7.5% facility fee, no hidden charges, repay any time before the due date.",
  },
  {
    id: "lp-flexi",
    name: "Personal Flexi Loan",
    tagline: "Up to KES 3M, repay over 6–60 months",
    minAmount: 50_000,
    maxAmount: 3_000_000,
    ratePa: 13.5,
    rateType: "reducing_balance",
    minTermMonths: 6,
    maxTermMonths: 60,
    processingFeePct: 2,
    termSteps: [6, 12, 18, 24, 36, 48, 60],
    requiresKycTier: 2,
    instantDisbursement: true,
    color: "from-sky-400 to-blue-600",
    blurb:
      "Unsecured personal financing at 13.5% p.a. on a reducing balance. No early-repayment penalty — settle early and pay less interest.",
  },
  {
    id: "lp-salary",
    name: "Salary Advance",
    tagline: "Bridge to payday at a flat 5%",
    minAmount: 2_000,
    maxAmount: 150_000,
    facilityFeePct: 5,
    rateType: "flat_fee",
    minTermMonths: 1,
    maxTermMonths: 2,
    processingFeePct: 0,
    termSteps: [1, 2],
    requiresKycTier: 1,
    instantDisbursement: true,
    color: "from-emerald-400 to-teal-600",
    blurb:
      "Access up to 50% of your verified net salary before payday. Auto-recovered from your next salary credit.",
  },
  {
    id: "lp-biz",
    name: "Business Growth Loan",
    tagline: "Working capital up to KES 10M",
    minAmount: 100_000,
    maxAmount: 10_000_000,
    ratePa: 14.5,
    rateType: "reducing_balance",
    minTermMonths: 12,
    maxTermMonths: 84,
    processingFeePct: 2.5,
    termSteps: [12, 24, 36, 48, 60, 72, 84],
    requiresKycTier: 3,
    instantDisbursement: false,
    color: "from-violet-400 to-purple-600",
    blurb:
      "Working capital and expansion financing for registered businesses, priced at 14.5% p.a. reducing balance with a 90-day grace option.",
  },
  {
    id: "lp-asset",
    name: "Asset Financing",
    tagline: "Drive it home — up to 80% financed",
    minAmount: 300_000,
    maxAmount: 8_000_000,
    ratePa: 15.0,
    rateType: "reducing_balance",
    minTermMonths: 12,
    maxTermMonths: 60,
    processingFeePct: 2,
    termSteps: [12, 24, 36, 48, 60],
    requiresKycTier: 3,
    instantDisbursement: false,
    color: "from-rose-400 to-pink-600",
    blurb:
      "Finance vehicles, machinery and equipment with the asset as security. Up to 80% of value, comprehensive insurance bundled in.",
  },
];

const user: UserProfile = {
  name: "Nguitui Kamau",
  email: "nguitui.kamau@gmail.com",
  phone: "+254 712 845 309",
  memberSince: "2021-03-18T00:00:00.000Z",
  kycTier: 2,
  creditScore: 736,
  creditLimit: 850_000,
  avatarInitials: "NK",
};

const accounts: Account[] = [
  {
    id: "acc-current",
    name: "Everyday Current",
    number: "0114825930",
    type: "current",
    currency: "KES",
    balance: 248_730.45,
  },
  {
    id: "acc-savings",
    name: "Goal Saver",
    number: "0114825948",
    type: "savings",
    currency: "KES",
    balance: 512_400.0,
    interestRatePa: 8.2,
  },
];

// ---- Loans -----------------------------------------------------------------

function seededLoan(
  productId: string,
  principal: number,
  termMonths: number,
  startDaysAgo: number,
  paidInstallments: number,
  status: Loan["status"]
): Loan {
  const product = loanProducts.find((p) => p.id === productId)!;
  const startDate = ago(startDaysAgo);
  const schedule = buildSchedule(product, principal, termMonths, startDate).map((e, i) => ({
    ...e,
    paid: i < paidInstallments,
    paidDate: i < paidInstallments ? ago(startDaysAgo - (i + 1) * 30 - 1) : undefined,
  }));
  return {
    id: `loan-${productId}-${startDaysAgo}`,
    productId,
    productName: product.name,
    principal,
    ratePa: product.ratePa,
    facilityFeePct: product.facilityFeePct,
    rateType: product.rateType,
    termMonths,
    startDate,
    status,
    disbursedToAccountId: "acc-current",
    schedule,
  };
}

const loans: Loan[] = [
  // 480k Flexi loan, 8 of 24 installments paid, in good standing.
  seededLoan("lp-flexi", 480_000, 24, 252, 8, "active"),
  // 25k Boost loan taken 12 days ago, due in ~18 days.
  seededLoan("lp-boost", 25_000, 1, 12, 0, "active"),
  // Fully repaid 120k Flexi loan from last year — good history for the score.
  seededLoan("lp-flexi", 120_000, 12, 600, 12, "repaid"),
];

// ---- Transactions ----------------------------------------------------------

let txSeq = 0;
function tx(
  accountId: string,
  daysAgo: number,
  kind: TxKind,
  amount: number,
  counterparty: string,
  category: Transaction["category"],
  note?: string
): Transaction {
  txSeq += 1;
  return {
    id: `tx-${txSeq}`,
    accountId,
    kind,
    amount,
    counterparty,
    category,
    note,
    date: ago(daysAgo, 9 + (txSeq % 9)),
    ref: `PTY${String(948_201 + txSeq * 37)}`,
  };
}

const transactions: Transaction[] = [
  tx("acc-current", 0, "card", -1_240, "Java House Kimathi St", "Food & Drink", "Card purchase"),
  tx("acc-current", 0, "airtime", -1_000, "Safaricom Airtime", "Airtime & Data"),
  tx("acc-current", 1, "transfer_out", -8_500, "Wanjiru Maina", "Transfers", "Mama mboga supplies"),
  tx("acc-current", 1, "card", -3_650, "Naivas Supermarket", "Shopping"),
  tx("acc-current", 2, "bill", -2_870, "Kenya Power", "Bills & Utilities", "Token — meter 37214"),
  tx("acc-current", 3, "transfer_in", 15_000, "Otieno Odhiambo", "Transfers", "Sacco refund"),
  tx("acc-current", 4, "card", -980, "Uber Kenya", "Transport"),
  tx("acc-current", 5, "bill", -5_999, "Zuku Fiber", "Bills & Utilities", "Home internet — June"),
  tx("acc-current", 6, "loan_repayment", -22_926, "Portty Loans", "Loans", "Personal Flexi — installment 8/24"),
  tx("acc-current", 7, "card", -2_310, "Carrefour Two Rivers", "Shopping"),
  tx("acc-current", 8, "transfer_out", -30_000, "Goal Saver", "Savings", "Monthly savings sweep"),
  tx("acc-current", 9, "card", -1_750, "ArtCaffe Westgate", "Food & Drink"),
  tx("acc-current", 10, "bill", -1_500, "Nairobi Water", "Bills & Utilities"),
  tx("acc-current", 11, "transfer_in", 6_800, "Achieng Auma", "Transfers", "Lunch contributions"),
  tx("acc-current", 12, "loan_disbursement", 25_000, "Portty Boost", "Loans", "Boost loan disbursed"),
  tx("acc-current", 12, "card", -4_420, "Total Energies Waiyaki Way", "Transport", "Fuel"),
  tx("acc-current", 14, "transfer_out", -12_000, "Kamau Njoroge", "Transfers", "Rent contribution"),
  tx("acc-current", 15, "card", -6_150, "Jumia Kenya", "Shopping", "Order #KE-882146"),
  tx("acc-current", 17, "airtime", -500, "Airtel Money", "Airtime & Data"),
  tx("acc-current", 18, "bill", -14_500, "Greenfield Apartments", "Bills & Utilities", "Service charge"),
  tx("acc-current", 20, "card", -2_890, "KFC Moi Avenue", "Food & Drink"),
  tx("acc-current", 21, "transfer_in", 9_400, "Mutiso Mwangangi", "Transfers", "Harambee pledge"),
  tx("acc-current", 23, "card", -1_180, "Bolt Rides", "Transport"),
  tx("acc-current", 25, "deposit", 186_400, "Acme Logistics Ltd", "Income", "June salary"),
  tx("acc-current", 26, "bill", -3_200, "DSTV Compact Plus", "Bills & Utilities"),
  tx("acc-current", 27, "card", -7_640, "QuickMart Ruaka", "Shopping", "Monthly groceries"),
  tx("acc-current", 29, "transfer_out", -20_000, "Goal Saver", "Savings", "Emergency fund top-up"),
  tx("acc-current", 31, "card", -2_450, "Mama Oliech Restaurant", "Food & Drink"),
  tx("acc-current", 33, "bill", -2_870, "Kenya Power", "Bills & Utilities", "Token — meter 37214"),
  tx("acc-current", 36, "loan_repayment", -22_926, "Portty Loans", "Loans", "Personal Flexi — installment 7/24"),
  tx("acc-current", 38, "card", -5_320, "Naivas Supermarket", "Shopping"),
  tx("acc-current", 41, "transfer_in", 12_500, "Njeri Wairimu", "Transfers", "Chama payout"),
  tx("acc-current", 44, "airtime", -1_000, "Safaricom Airtime", "Airtime & Data"),
  tx("acc-current", 47, "card", -3_980, "Shell Lang'ata Rd", "Transport", "Fuel"),
  tx("acc-current", 50, "bill", -5_999, "Zuku Fiber", "Bills & Utilities", "Home internet — May"),
  tx("acc-current", 55, "deposit", 186_400, "Acme Logistics Ltd", "Income", "May salary"),
  tx("acc-savings", 8, "transfer_in", 30_000, "Everyday Current", "Savings", "Monthly savings sweep"),
  tx("acc-savings", 29, "transfer_in", 20_000, "Everyday Current", "Savings", "Emergency fund top-up"),
  tx("acc-savings", 30, "interest", 3_410, "Portty Bank", "Income", "Interest earned — 8.2% p.a."),
  tx("acc-savings", 60, "interest", 3_280, "Portty Bank", "Income", "Interest earned — 8.2% p.a."),
];

// ---- Cards, payees, notifications -------------------------------------------

const cards: CardInfo[] = [
  {
    id: "card-physical",
    label: "Portty Platinum",
    last4: "4821",
    network: "Visa",
    expiry: "09/28",
    frozen: false,
    monthlyLimit: 150_000,
    spentThisMonth: 43_960,
    virtual: false,
  },
  {
    id: "card-virtual",
    label: "Online Shopping",
    last4: "7733",
    network: "Mastercard",
    expiry: "01/27",
    frozen: true,
    monthlyLimit: 40_000,
    spentThisMonth: 6_150,
    virtual: true,
  },
];

const payees: Payee[] = [
  { id: "p1", name: "Wanjiru Maina", detail: "Portty • 0119284756", initials: "WM" },
  { id: "p2", name: "Otieno Odhiambo", detail: "M-PESA • 0722 184 930", initials: "OO" },
  { id: "p3", name: "Kamau Njoroge", detail: "Equity • 1140087652", initials: "KN" },
  { id: "p4", name: "Achieng Auma", detail: "Portty • 0117453829", initials: "AA" },
  { id: "p5", name: "Njeri Wairimu", detail: "KCB • 1208837465", initials: "NW" },
  { id: "p6", name: "Mutiso Mwangangi", detail: "M-PESA • 0733 920 481", initials: "MM" },
];

const notifications: AppNotification[] = [
  {
    id: "n1",
    title: "Boost repayment due soon",
    body: "Your Portty Boost loan of KES 26,875 is due in 18 days. Repay early — there's no penalty.",
    date: ago(0, 8),
    read: false,
    tone: "warning",
  },
  {
    id: "n2",
    title: "Credit limit increased 🎉",
    body: "Great repayment history! Your credit limit is now KES 850,000, up from KES 600,000.",
    date: ago(3),
    read: false,
    tone: "success",
  },
  {
    id: "n3",
    title: "Installment received",
    body: "We received KES 22,926 for your Personal Flexi Loan (installment 8 of 24). Thank you!",
    date: ago(6),
    read: true,
    tone: "info",
  },
  {
    id: "n4",
    title: "Interest paid to Goal Saver",
    body: "KES 3,410 in interest was credited to your Goal Saver account at 8.2% p.a.",
    date: ago(30),
    read: true,
    tone: "success",
  },
];

export const seedState: BankState = {
  user,
  accounts,
  transactions,
  loans,
  cards,
  payees,
  notifications,
};
