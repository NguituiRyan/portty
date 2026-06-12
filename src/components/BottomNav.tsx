import { NavLink } from "react-router-dom";
import { CreditCard, HandCoins, Home, ListOrdered, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/transactions", label: "Activity", icon: ListOrdered },
  { to: "/loans", label: "Loans", icon: HandCoins },
  { to: "/cards", label: "Cards", icon: CreditCard },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-line/60 bg-panel/95 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur">
      <div className="flex">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 pt-2.5 pb-1 text-[11px] font-medium transition ${
                isActive ? "text-sky-400" : "text-slate-500"
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
