import { useEffect } from "react";
import { AlertTriangle, BellRing, CheckCircle2, Info } from "lucide-react";
import { useBank } from "../store/bank";
import { Card, EmptyState, ScreenHeader } from "../components/ui";
import { relativeDay } from "../lib/format";

export function Notifications() {
  const { state, dispatch } = useBank();

  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: "mark_notifications_read" }), 1200);
    return () => clearTimeout(t);
  }, [dispatch]);

  const toneIcon = {
    info: { icon: Info, cls: "bg-sky-500/15 text-sky-300" },
    success: { icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-300" },
    warning: { icon: AlertTriangle, cls: "bg-amber-500/15 text-amber-300" },
  } as const;

  return (
    <div className="animate-rise pb-28">
      <ScreenHeader title="Notifications" />
      <div className="space-y-3 px-4 pt-2">
        {state.notifications.length === 0 ? (
          <EmptyState icon={<BellRing size={22} />} title="All caught up" body="Nothing new right now." />
        ) : (
          state.notifications.map((n) => {
            const { icon: Icon, cls } = toneIcon[n.tone];
            return (
              <Card key={n.id} className={`flex gap-3 p-4 ${n.read ? "opacity-70" : ""}`}>
                <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${cls}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium">{n.title}</p>
                    <p className="shrink-0 text-[11px] text-slate-500">{relativeDay(n.date)}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-400">{n.body}</p>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
