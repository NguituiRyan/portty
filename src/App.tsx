import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { BankProvider } from "./store/bank";
import { BottomNav } from "./components/BottomNav";
import { Dashboard } from "./screens/Dashboard";
import { Transactions } from "./screens/Transactions";
import { Loans } from "./screens/Loans";
import { LoanApply } from "./screens/LoanApply";
import { LoanDetail } from "./screens/LoanDetail";
import { Send } from "./screens/Send";
import { Move } from "./screens/Move";
import { Cards } from "./screens/Cards";
import { Profile } from "./screens/Profile";
import { Notifications } from "./screens/Notifications";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <BankProvider>
      <HashRouter>
        <ScrollToTop />
        <div className="mx-auto min-h-dvh max-w-md">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/loans/apply" element={<LoanApply />} />
            <Route path="/loans/:loanId" element={<LoanDetail />} />
            <Route path="/send" element={<Send />} />
            <Route path="/move" element={<Move />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
          <BottomNav />
        </div>
      </HashRouter>
    </BankProvider>
  );
}
