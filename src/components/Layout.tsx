import { useMemo, useState, type ReactNode } from "react";
import {
  Bell, BellRing, Briefcase, CalendarDays, CheckCheck, ChevronLeft, Coins,
  FileText, Gavel, LayoutDashboard, ListTodo, LogOut, Menu, Scale, Users, X,
} from "lucide-react";
import { buildNotifications, unreadCount, useStore } from "../store";
import type { Page } from "../types";
import { fmtStamp, fmtFullToday } from "../utils";

export const PAGES: { id: Page; label: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "لوحة التحكم", icon: <LayoutDashboard size={19} /> },
  { id: "agenda", label: "الأجندة", icon: <CalendarDays size={19} /> },
  { id: "tasks", label: "المهام", icon: <ListTodo size={19} /> },
  { id: "templates", label: "النماذج", icon: <FileText size={19} /> },
  { id: "clients", label: "الموكلين", icon: <Users size={19} /> },
  { id: "cases", label: "القضايا", icon: <Briefcase size={19} /> },
  { id: "accounts", label: "الحسابات", icon: <Coins size={19} /> },
];

export function Brand({ mini }: { mini?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-10 h-10 rounded-xl bg-gradient-to-b from-gold-400 to-gold-600 text-ink-950 flex items-center justify-center shadow-md shrink-0">
        <Scale size={22} strokeWidth={2.2} />
      </span>
      {!mini && (
        <div className="leading-tight">
          <span className="font-display font-black text-lg text-white block">ميزان</span>
          <span className="text-[10px] text-ink-300 font-medium">إدارة مكاتب المحاماة</span>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const nav = useStore((s) => s.nav);
  const go = useStore((s) => s.go);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebar = useStore((s) => s.setSidebar);
  const sidebarMini = useStore((s) => s.sidebarMini);
  const toggleMini = useStore((s) => s.toggleMini);
  const lawyers = useStore((s) => s.lawyers);
  const sessionUserId = useStore((s) => s.sessionUserId);
  const logout = useStore((s) => s.logout);

  const me = lawyers.find((l) => l.id === sessionUserId);
  const pageLabel = PAGES.find((p) => p.id === nav.page)?.label ?? "";

  return (
    <div className="app-canvas min-h-screen">
      {/* mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-[2px] lg:hidden anim-fade-in" onClick={() => setSidebar(false)} />
      )}

      {/* ---------- sidebar ---------- */}
      <aside
        className={`fixed top-0 bottom-0 start-0 z-50 flex flex-col bg-ink-950 side-pattern transition-all duration-300
          ${sidebarMini ? "lg:w-[76px]" : "lg:w-64"} w-72 ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
      >
        <div className={`flex items-center justify-between p-4 ${sidebarMini ? "lg:justify-center lg:px-2" : ""}`}>
          <Brand mini={sidebarMini} />
          <button className="lg:hidden text-ink-300 hover:text-white p-1" onClick={() => setSidebar(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="mx-4 h-px bg-white/10" />

        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
          {PAGES.map((p) => {
            const active = nav.page === p.id;
            return (
              <button
                key={p.id}
                onClick={() => go(p.id)}
                title={p.label}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 relative
                  ${sidebarMini ? "lg:justify-center lg:px-0" : ""}
                  ${active
                    ? "bg-white/[0.08] text-gold-300"
                    : "text-ink-200/80 hover:text-white hover:bg-white/[0.05]"}`}
              >
                {active && <span className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-gold-400" />}
                <span className={active ? "text-gold-300" : "text-ink-300"}>{p.icon}</span>
                <span className={sidebarMini ? "lg:hidden" : ""}>{p.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={`p-3 border-t border-white/10 ${sidebarMini ? "lg:px-2" : ""}`}>
          <div className={`flex items-center gap-3 rounded-xl bg-white/[0.06] p-3 ${sidebarMini ? "lg:justify-center lg:p-2" : ""}`}>
            <span className="w-9 h-9 shrink-0 rounded-full bg-gold-500/20 text-gold-300 flex items-center justify-center font-display font-black text-sm">
              {me?.name.replace("أ. ", "").slice(0, 1) ?? "م"}
            </span>
            <div className={`grow min-w-0 ${sidebarMini ? "lg:hidden" : ""}`}>
              <p className="text-[13px] font-bold text-white truncate">{me?.name}</p>
              <p className="text-[10.5px] text-ink-300 truncate" dir="ltr">{me?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className={`mt-2 w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-bad-500 hover:bg-bad-500/10 transition-all ${sidebarMini ? "lg:justify-center lg:px-0" : ""}`}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={sidebarMini ? "lg:hidden" : ""}>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* ---------- main ---------- */}
      <div className={`transition-all duration-300 ${sidebarMini ? "lg:ps-[76px]" : "lg:ps-64"}`}>
        <TopBar title={pageLabel} onMenu={() => (window.innerWidth >= 1024 ? toggleMini() : setSidebar(true))} />
        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto" key={nav.page}>
          <div className="anim-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}

/* ================= top bar ================= */
function TopBar({ title, onMenu }: { title: string; onMenu: () => void }) {
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-ink-100">
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-16 max-w-[1400px] mx-auto">
        <button onClick={onMenu} className="p-2 rounded-xl text-ink-600 hover:bg-ink-100 transition-colors" title="القائمة">
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h2 className="font-display font-extrabold text-ink-900 text-[17px] leading-tight truncate">{title}</h2>
          <p className="text-[11px] text-ink-400 hidden sm:block">{fmtFullToday()}</p>
        </div>

        <div className="grow" />

        <NotifBell open={bellOpen} setOpen={setBellOpen} />
        <ProfileMenu open={profileOpen} setOpen={setProfileOpen} />
      </div>
    </header>
  );
}

function NotifBell({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const hearings = useStore((s) => s.hearings);
  const cases = useStore((s) => s.cases);
  const clients = useStore((s) => s.clients);
  const tasks = useStore((s) => s.tasks);
  const activities = useStore((s) => s.activities);
  const read = useStore((s) => s.readNotifs);
  const markRead = useStore((s) => s.markNotifsRead);
  const lawyerId = useStore((s) => s.sessionUserId) ?? "";
  const go = useStore((s) => s.go);

  const notifs = useMemo(
    () => buildNotifications(hearings, cases, clients, tasks, activities, lawyerId, read),
    [hearings, cases, clients, tasks, activities, lawyerId, read],
  );
  const unread = unreadCount(notifs, read);

  const iconOf = (k: string) =>
    k === "hearing" ? <Gavel size={15} className="text-gold-600" />
      : k === "overdue" ? <BellRing size={15} className="text-bad-500" />
      : k === "task" ? <ListTodo size={15} className="text-warn-500" />
      : <CheckCheck size={15} className="text-ok-500" />;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2.5 rounded-xl transition-all ${open ? "bg-ink-100 text-ink-900" : "text-ink-600 hover:bg-ink-100"}`}
        title="التنبيهات"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-bad-500 text-white text-[10px] font-bold flex items-center justify-center pulse-dot">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed z-50 top-[68px] inset-x-3 sm:absolute sm:inset-x-auto sm:top-full sm:mt-2 sm:end-0 sm:w-[380px] card overflow-hidden anim-pop shadow-lift">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 bg-ink-50/60">
              <h4 className="font-display font-extrabold text-sm text-ink-900">التنبيهات</h4>
              {unread > 0 && (
                <button
                  onClick={() => markRead(notifs.map((n) => n.id))}
                  className="text-[11.5px] font-bold text-gold-700 hover:text-gold-600 inline-flex items-center gap-1"
                >
                  <CheckCheck size={13} /> تحديد الكل كمقروء
                </button>
              )}
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {notifs.length === 0 && (
                <p className="text-center text-[13px] text-ink-400 py-10">لا توجد تنبيهات حالياً — كل شيء تحت السيطرة.</p>
              )}
              {notifs.map((n) => {
                const isRead = read.includes(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      markRead([n.id]);
                      setOpen(false);
                      go(n.kind === "hearing" ? "agenda" : n.kind === "task" || n.kind === "overdue" ? "tasks" : "dashboard");
                    }}
                    className={`w-full text-start flex gap-3 px-4 py-3 border-b border-ink-100/70 last:border-0 transition-colors hover:bg-gold-100/30 ${isRead ? "opacity-55" : ""}`}
                  >
                    <span className="w-8 h-8 shrink-0 rounded-lg bg-white border border-ink-100 flex items-center justify-center mt-0.5">
                      {iconOf(n.kind)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-ink-900 leading-snug">{n.title}</span>
                      <span className="block text-[11.5px] text-ink-400 mt-0.5 truncate">{n.desc}</span>
                      <span className="block text-[10.5px] text-ink-300 mt-1">{fmtStamp(n.at)}</span>
                    </span>
                    {!isRead && <span className="w-2 h-2 rounded-full bg-gold-500 shrink-0 mt-1.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProfileMenu({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const me = useStore((s) => s.lawyers.find((l) => l.id === s.sessionUserId));
  const logout = useStore((s) => s.logout);
  const initials = me?.name.replace("أ. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 p-1.5 pe-2.5 rounded-xl border transition-all ${open ? "border-gold-300 bg-gold-100/40" : "border-transparent hover:bg-ink-100"}`}
      >
        <span className="w-9 h-9 rounded-lg bg-ink-900 text-gold-300 font-display font-black text-sm flex items-center justify-center">
          {initials}
        </span>
        <span className="hidden md:block text-start">
          <span className="block text-[13px] font-bold text-ink-900 leading-tight">{me?.name}</span>
          <span className="block text-[10.5px] text-ink-400">محامٍ مرخص</span>
        </span>
        <ChevronLeft size={15} className={`text-ink-400 transition-transform hidden md:block ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full mt-2 end-0 w-60 card overflow-hidden anim-pop shadow-lift">
            <div className="px-4 py-3 border-b border-ink-100 bg-ink-50/60">
              <p className="text-sm font-bold text-ink-900">{me?.name}</p>
              <p className="text-[11.5px] text-ink-400 truncate" dir="ltr">{me?.email}</p>
              <p className="text-[11.5px] text-ink-400" dir="ltr">{me?.phone}</p>
            </div>
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-bad-500 hover:bg-bad-100/60 transition-colors"
            >
              <LogOut size={16} /> تسجيل الخروج
            </button>
          </div>
        </>
      )}
    </div>
  );
}
