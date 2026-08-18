import { useMemo, useState } from "react";
import {
  AlertCircle, Briefcase, CalendarClock, Check, ChevronLeft, Clock3, Coins,
  FilePlus2, Gavel, History, ListPlus, Plus, Trash2, UserPlus, Users, Wallet, X,
} from "lucide-react";
import { CASE_STATUS, useStore } from "../store";
import type { ID } from "../types";
import { dayLabel, fmtDate, fmtStamp, fmtTime, isToday, money, todayISO } from "../utils";
import CaseDetails from "../components/CaseDetails";
import { Btn, Confirm as ConfirmUi, Empty, IconBtn, Pagination, Pill, SearchBox, StatusBadge, Th } from "../components/ui";

const PAGE_SIZE = 5;

export default function Dashboard() {
  const me = useStore((s) => s.lawyers.find((l) => l.id === s.sessionUserId));
  const uid = useStore((s) => s.sessionUserId) ?? "";
  const go = useStore((s) => s.go);
  const rawClients = useStore((s) => s.clients);
  const rawCases = useStore((s) => s.cases);
  const rawHearings = useStore((s) => s.hearings);
  const rawTasks = useStore((s) => s.tasks);
  const rawTxs = useStore((s) => s.txs);
  const rawActs = useStore((s) => s.activities);
  const toggleTask = useStore((s) => s.toggleTask);
  const deleteTask = useStore((s) => s.deleteTask);

  const clients = useMemo(() => rawClients.filter((c) => c.lawyerId === uid), [rawClients, uid]);
  const cases = useMemo(() => rawCases.filter((c) => c.lawyerId === uid), [rawCases, uid]);
  const hearings = useMemo(() => rawHearings.filter((h) => h.lawyerId === uid), [rawHearings, uid]);
  const tasks = useMemo(() => rawTasks.filter((t) => t.lawyerId === uid), [rawTasks, uid]);
  const txs = useMemo(() => rawTxs.filter((t) => t.lawyerId === uid), [rawTxs, uid]);
  const acts = useMemo(() => rawActs.filter((a) => a.lawyerId === uid).slice(0, 7), [rawActs, uid]);

  const today = todayISO();
  const kpi = {
    clients: clients.length,
    cases: cases.length,
    open: cases.filter((c) => c.status === "open").length,
    postponed: cases.filter((c) => c.status === "postponed").length,
    closed: cases.filter((c) => c.status === "closed").length,
    todayHearings: hearings.filter((h) => h.date === today).length,
    pending: tasks.filter((t) => !t.completed).length,
    overdue: tasks.filter((t) => !t.completed && t.date < today).length,
    fees: txs.filter((t) => t.type === "fees").reduce((a, b) => a + b.amount, 0),
    expenses: txs.filter((t) => t.type === "expenses").reduce((a, b) => a + b.amount, 0),
  };

  /* ---- current cases table state ---- */
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 }>({ k: "nextHearingDate", dir: 1 });
  const [page, setPage] = useState(1);
  const [viewId, setViewId] = useState<ID | null>(null);
  const [delTask, setDelTask] = useState<ID | null>(null);

  const clientName = (id?: ID) => clients.find((c) => c.id === id)?.name ?? "—";

  const rows = useMemo(() => {
    let r = [...cases];
    if (statusF !== "all") r = r.filter((c) => c.status === statusF);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      r = r.filter((c) =>
        c.caseNumber.toLowerCase().includes(s) ||
        clientName(c.clientId).toLowerCase().includes(s) ||
        c.court.toLowerCase().includes(s),
      );
    }
    r.sort((a, b) => {
      const va = (sort.k === "client" ? clientName(a.clientId) : (a as never as Record<string, string>)[sort.k] ?? "") as string;
      const vb = (sort.k === "client" ? clientName(b.clientId) : (b as never as Record<string, string>)[sort.k] ?? "") as string;
      return va.localeCompare(vb, "ar") * sort.dir;
    });
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cases, q, statusF, sort, clients]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const onSort = (k: string) => setSort((s) => ({ k, dir: s.k === k ? ((s.dir * -1) as 1 | -1) : 1 }));
  const caseTask = (caseId: ID) =>
    tasks.find((t) => t.caseId === caseId && !t.completed) ?? tasks.find((t) => t.caseId === caseId);

  const todayTasks = tasks
    .filter((t) => t.date === today || (t.date < today && !t.completed))
    .sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));
  const todayHs = hearings.filter((h) => h.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const tomorrowHs = hearings.filter((h) => h.date !== today && dayLabel(h.date) === "غداً");

  const kpis = [
    { label: "إجمالي الموكلين", value: kpi.clients, icon: <Users size={20} />, tint: "bg-ink-900 text-gold-300", foot: `+${clients.filter((c) => Date.now() - c.createdAt < 7 * 864e5).length} هذا الأسبوع` },
    { label: "إجمالي القضايا", value: kpi.cases, icon: <Briefcase size={20} />, tint: "bg-ink-700 text-white", foot: `${kpi.closed} مغلقة` },
    { label: "قضايا مفتوحة", value: kpi.open, icon: <Gavel size={20} />, tint: "bg-ok-500 text-white", foot: "قيد الترافع" },
    { label: "قضايا مؤجلة", value: kpi.postponed, icon: <CalendarClock size={20} />, tint: "bg-warn-500 text-white", foot: "بانتظار تحديد جلسة" },
    { label: "جلسات اليوم", value: kpi.todayHearings, icon: <Clock3 size={20} />, tint: "bg-gold-500 text-ink-950", foot: kpi.todayHearings ? "تتطلب استعداداً" : "يوم هادئ" },
    { label: "مهام متبقية", value: kpi.pending, icon: <ListPlus size={20} />, tint: "bg-bad-500 text-white", foot: kpi.overdue ? `${kpi.overdue} متأخرة` : "لا متأخرات" },
  ];

  return (
    <div className="space-y-6">
      {/* ---------- welcome + quick actions ---------- */}
      <section className="relative overflow-hidden rounded-2xl bg-ink-950 side-pattern text-white p-6 sm:p-7">
        <Gavel size={200} className="absolute -bottom-14 -start-10 text-white/[0.05] -rotate-12" strokeWidth={0.8} />
        <div className="relative flex flex-wrap items-center gap-5 justify-between">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-[28px]">
              مرحباً بك، <span className="text-gold-400">{me?.name}</span>
            </h1>
            <p className="text-ink-200 text-[13.5px] mt-1.5">إليك ملخص أعمال مكتبك اليوم.</p>
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Pill cls="bg-white/10 text-gold-300 border border-white/10"><Wallet size={12} /> صافي الإيرادات: {money(kpi.fees - kpi.expenses)}</Pill>
              <Pill cls="bg-white/10 text-ink-200 border border-white/10">أتعاب: {money(kpi.fees)}</Pill>
              <Pill cls="bg-white/10 text-ink-200 border border-white/10">مصروفات: {money(kpi.expenses)}</Pill>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn variant="gold" onClick={() => go("clients", "add")}><UserPlus size={16} /> إضافة موكل</Btn>
            <Btn variant="outline" className="border-white/25! bg-white/5! text-white! hover:bg-white/15!" onClick={() => go("cases", "add")}><Plus size={16} /> إضافة قضية</Btn>
            <Btn variant="outline" className="border-white/25! bg-white/5! text-white! hover:bg-white/15!" onClick={() => go("tasks", "add")}><Check size={16} /> إضافة مهمة</Btn>
            <Btn variant="outline" className="border-white/25! bg-white/5! text-white! hover:bg-white/15!" onClick={() => go("accounts", "add")}><Coins size={16} /> عملية مالية</Btn>
            <Btn variant="outline" className="border-white/25! bg-white/5! text-white! hover:bg-white/15!" onClick={() => go("templates", "add")}><FilePlus2 size={16} /> إضافة نموذج</Btn>
          </div>
        </div>
      </section>

      {/* ---------- KPI cards ---------- */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 stagger">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200 group">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.tint} group-hover:scale-105 transition-transform`}>{k.icon}</span>
            <p key={k.value} className="font-display font-black text-[26px] text-ink-900 mt-2.5 anim-tick">{k.value}</p>
            <p className="text-[12px] font-bold text-ink-500">{k.label}</p>
            <p className="text-[10.5px] text-ink-300 mt-1">{k.foot}</p>
          </div>
        ))}
      </section>

      {/* ---------- alerts + today tasks ---------- */}
      <div className="grid lg:grid-cols-5 gap-5">
        <section className="lg:col-span-2 card overflow-hidden">
          <header className="flex items-center justify-between px-5 py-3.5 border-b border-ink-100 bg-gradient-to-l from-gold-100/50 to-transparent">
            <h3 className="font-display font-extrabold text-ink-900 flex items-center gap-2"><AlertCircle size={17} className="text-gold-600" /> تنبيهات اليوم</h3>
            <button onClick={() => go("agenda")} className="text-[12px] font-bold text-gold-700 hover:text-gold-600 inline-flex items-center gap-1">الأجندة <ChevronLeft size={13} /></button>
          </header>
          <div className="p-4 space-y-2.5">
            {todayHs.length === 0 && tomorrowHs.length === 0 && (
              <Empty icon={<Clock3 size={26} />} title="لا توجد جلسات اليوم." desc="استغل الوقت في تجهيز المذكرات ومتابعة المهام." />
            )}
            {todayHs.map((h) => {
              const cs = cases.find((c) => c.id === h.caseId);
              return (
                <button key={h.id} onClick={() => setViewId(h.caseId)} className="w-full text-start rounded-xl border-s-4 border-gold-500 bg-gold-100/50 hover:bg-gold-100 p-3.5 transition-colors anim-slide">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13.5px] font-bold text-ink-900">لديك جلسة اليوم في قضية رقم {cs?.caseNumber}</p>
                    <Pill cls="bg-gold-500 text-ink-950">{fmtTime(h.time)}</Pill>
                  </div>
                  <p className="text-[12px] text-ink-600 mt-1">{h.type} — {cs?.court}</p>
                  <p className="text-[11.5px] text-ink-400 mt-0.5">الموكل: {clientName(cs?.clientId)} {cs && <StatusInline status={cs.status} />}</p>
                </button>
              );
            })}
            {tomorrowHs.map((h) => {
              const cs = cases.find((c) => c.id === h.caseId);
              return (
                <button key={h.id} onClick={() => setViewId(h.caseId)} className="w-full text-start rounded-xl border border-ink-100 bg-ink-50/50 hover:bg-ink-100/60 p-3.5 transition-colors anim-slide">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-bold text-ink-700">لديك جلسة غداً في قضية رقم {cs?.caseNumber}</p>
                    <Pill cls="bg-ink-100 text-ink-600">{fmtTime(h.time)}</Pill>
                  </div>
                  <p className="text-[11.5px] text-ink-400 mt-1">{h.type} — {cs?.court} — {clientName(cs?.clientId)}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-3 card overflow-hidden">
          <header className="flex items-center justify-between px-5 py-3.5 border-b border-ink-100">
            <h3 className="font-display font-extrabold text-ink-900 flex items-center gap-2"><Check size={17} className="text-ok-500" /> مهام اليوم</h3>
            <button onClick={() => go("tasks", "add")} className="text-[12px] font-bold text-gold-700 hover:text-gold-600 inline-flex items-center gap-1"><Plus size={13} /> مهمة جديدة</button>
          </header>
          <div className="p-4">
            {todayTasks.length === 0 ? (
              <Empty icon={<Check size={26} />} title="لا مهام مستحقة اليوم" desc="أنشئ مهمة من صفحة المهام وستظهر هنا تلقائياً." action={<Btn variant="outline" size="sm" onClick={() => go("tasks", "add")}><Plus size={14} /> إضافة مهمة</Btn>} />
            ) : (
              <ul className="space-y-2">
                {todayTasks.map((t) => {
                  const overdue = !t.completed && t.date < today;
                  return (
                    <li key={t.id} className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${t.completed ? "bg-ink-50/60 border-ink-100 opacity-70" : overdue ? "border-bad-500/30 bg-bad-100/40" : "border-ink-100 hover:border-gold-300 hover:shadow-sm"}`}>
                      <button
                        onClick={() => toggleTask(t.id)}
                        title={t.completed ? "إلغاء الإكمال" : "إكمال المهمة"}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 active:scale-90 ${t.completed ? "bg-ok-500 border-ok-500 text-white" : "border-ink-300 hover:border-ok-500 text-transparent hover:text-ok-500/40"}`}
                      >
                        <Check size={14} strokeWidth={3.5} />
                      </button>
                      <div className="grow min-w-0">
                        <p className={`text-[13.5px] font-bold truncate ${t.completed ? "text-ink-400 line-through" : "text-ink-900"}`}>{t.title}</p>
                        <p className="text-[11.5px] text-ink-400 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{isToday(t.date) ? "اليوم" : fmtDate(t.date)}</span>
                          {t.time && <span>— {fmtTime(t.time)}</span>}
                          {overdue && <Pill cls="bg-bad-500 text-white">متأخرة</Pill>}
                        </p>
                      </div>
                      <Pill cls={t.priority === "high" ? "bg-bad-100 text-bad-500" : t.priority === "medium" ? "bg-warn-100 text-warn-500" : "bg-ink-100 text-ink-600"}>
                        {t.priority === "high" ? "عالية" : t.priority === "medium" ? "متوسطة" : "منخفضة"}
                      </Pill>
                      <IconBtn danger title="حذف المهمة" onClick={() => setDelTask(t.id)}><Trash2 size={15} /></IconBtn>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* ---------- current cases table ---------- */}
      <section className="card overflow-hidden">
        <header className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-ink-100">
          <div className="grow">
            <h3 className="font-display font-extrabold text-ink-900">القضايا والمهام الحالية</h3>
            <p className="text-[12px] text-ink-400 mt-0.5">اضغط على أي قضية لعرض ملفها الكامل</p>
          </div>
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="بحث برقم القضية، الموكل، المحكمة..." />
          <select value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1); }} className="field-input w-36! py-2! text-[13px]">
            <option value="all">كل الحالات</option>
            <option value="open">مفتوحة</option>
            <option value="postponed">مؤجلة</option>
            <option value="closed">مغلقة</option>
          </select>
          <Btn variant="gold" size="md" onClick={() => go("cases", "add")}><Plus size={16} /> قضية جديدة</Btn>
        </header>

        {rows.length === 0 ? (
          cases.length === 0 ? (
            <Empty icon={<Briefcase size={28} />} title="لا توجد قضايا حتى الآن" desc="ابدأ بإنشاء أول قضية وستظهر هنا مع جلساتها ومهامها."
              action={<Btn variant="gold" onClick={() => go("cases", "add")}><Plus size={16} /> إضافة أول قضية</Btn>} />
          ) : (
            <Empty icon={<X size={28} />} title="لا نتائج مطابقة" desc="جرّب تعديل البحث أو الفلاتر." />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full tbl min-w-[820px]">
                <thead>
                  <tr>
                    <Th label="رقم القضية" k="caseNumber" sort={sort} onSort={onSort} />
                    <Th label="اسم الموكل" k="client" sort={sort} onSort={onSort} />
                    <Th label="المحكمة" k="court" sort={sort} onSort={onSort} />
                    <Th label="تاريخ الجلسة" k="nextHearingDate" sort={sort} onSort={onSort} />
                    <Th label="الحالة" k="status" sort={sort} onSort={onSort} />
                    <Th label="المهمة الحالية" />
                    <Th label="الإجراءات" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((c) => {
                    const t = caseTask(c.id);
                    return (
                      <tr key={c.id} className="cursor-pointer" onClick={() => setViewId(c.id)}>
                        <td className="font-bold text-gold-700" dir="ltr">{c.caseNumber}</td>
                        <td className="font-semibold text-ink-900">{clientName(c.clientId)}</td>
                        <td className="text-ink-500">{c.court}</td>
                        <td className="text-ink-700">{c.nextHearingDate ? `${fmtDate(c.nextHearingDate)} • ${fmtTime(c.nextHearingTime)}` : <span className="text-ink-300">لا جلسة قادمة</span>}</td>
                        <td><StatusBadge status={c.status} /></td>
                        <td>
                          {t ? (
                            <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${t.completed ? "text-ok-500" : "text-ink-600"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${t.completed ? "bg-ok-500" : "bg-gold-500"}`} />
                              <span className="max-w-[180px] truncate">{t.title}</span>
                            </span>
                          ) : <span className="text-ink-300">—</span>}
                        </td>
                        <td>
                          <Btn size="sm" variant="outline" onClick={() => setViewId(c.id)}>عرض التفاصيل</Btn>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={pages} onPage={setPage} total={rows.length} shown={pageRows.length} />
          </>
        )}
      </section>

      {/* ---------- recent activity ---------- */}
      <section className="card overflow-hidden">
        <header className="px-5 py-3.5 border-b border-ink-100">
          <h3 className="font-display font-extrabold text-ink-900 flex items-center gap-2"><History size={17} className="text-ink-400" /> النشاط الأخير</h3>
        </header>
        {acts.length === 0 ? (
          <p className="text-center text-[13px] text-ink-400 py-8">ستظهر هنا آخر الإجراءات التي تقوم بها.</p>
        ) : (
          <ul className="divide-y divide-ink-100/80">
            {acts.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60 transition-colors">
                <ActIcon kind={a.kind} />
                <div className="grow min-w-0">
                  <p className="text-[13px] font-semibold text-ink-800 truncate">{a.text}</p>
                  <p className="text-[10.5px] text-ink-300 mt-0.5">{fmtStamp(a.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {viewId && <CaseDetails caseId={viewId} onClose={() => setViewId(null)} />}
      {delTask && (
        <DeleteTaskConfirm onConfirm={() => deleteTask(delTask)} onClose={() => setDelTask(null)} />
      )}
    </div>
  );
}

function StatusInline({ status }: { status: keyof typeof CASE_STATUS }) {
  const s = CASE_STATUS[status];
  return <span className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-bold ${s.cls}`}>{s.label}</span>;
}

function ActIcon({ kind }: { kind: string }) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    client: { icon: <Users size={14} />, cls: "bg-ink-100 text-ink-600" },
    case: { icon: <Briefcase size={14} />, cls: "bg-gold-100 text-gold-700" },
    task: { icon: <Check size={14} />, cls: "bg-ok-100 text-ok-500" },
    finance: { icon: <Coins size={14} />, cls: "bg-warn-100 text-warn-500" },
    template: { icon: <FilePlus2 size={14} />, cls: "bg-ink-100 text-ink-500" },
    hearing: { icon: <Gavel size={14} />, cls: "bg-gold-100 text-gold-700" },
    note: { icon: <History size={14} />, cls: "bg-ink-100 text-ink-500" },
    auth: { icon: <Users size={14} />, cls: "bg-ink-100 text-ink-500" },
  };
  const m = map[kind] ?? map.auth;
  return <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.cls}`}>{m.icon}</span>;
}

function DeleteTaskConfirm({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <ConfirmUi
      title="حذف المهمة"
      message="سيتم حذف هذه المهمة نهائياً من قائمة مهامك."
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
