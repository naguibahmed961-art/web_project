import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, Eye, Gavel } from "lucide-react";
import { useStore } from "../store";
import type { ID } from "../types";
import { addDaysISO, dayLabel, fmtDate, fmtDateShort, fmtTime, fmtWeekday, isToday, todayISO } from "../utils";
import CaseDetails from "../components/CaseDetails";
import { Btn, Empty, PageHead, Pill, SearchBox, StatusBadge, Th } from "../components/ui";

export default function Agenda() {
  const uid = useStore((s) => s.sessionUserId) ?? "";
  const rawHearings = useStore((s) => s.hearings);
  const rawCases = useStore((s) => s.cases);
  const rawClients = useStore((s) => s.clients);
  const go = useStore((s) => s.go);

  const hearings = useMemo(() => rawHearings.filter((h) => h.lawyerId === uid), [rawHearings, uid]);
  const cases = useMemo(() => rawCases.filter((c) => c.lawyerId === uid), [rawCases, uid]);
  const clients = useMemo(() => rawClients.filter((c) => c.lawyerId === uid), [rawClients, uid]);

  const today = todayISO();
  const windowEnd = addDaysISO(today, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(today, i));

  const [dayF, setDayF] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 }>({ k: "date", dir: 1 });
  const [viewId, setViewId] = useState<ID | null>(null);

  const csOf = (id: ID) => cases.find((c) => c.id === id);
  const clName = (cid?: ID) => clients.find((c) => c.id === cid)?.name ?? "—";

  const rows = useMemo(() => {
    let r = hearings.filter((h) => h.date >= today && h.date <= windowEnd);
    if (dayF !== "all") r = r.filter((h) => h.date === dayF);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      r = r.filter((h) => {
        const cs = csOf(h.caseId);
        return (
          (cs?.caseNumber.toLowerCase().includes(s)) ||
          clName(cs?.clientId).toLowerCase().includes(s) ||
          (cs?.court.toLowerCase().includes(s)) ||
          h.type.toLowerCase().includes(s)
        );
      });
    }
    r.sort((a, b) => {
      const ka = sort.k === "client" ? clName(csOf(a.caseId)?.clientId) : sort.k === "caseNumber" ? csOf(a.caseId)?.caseNumber ?? "" : (a as unknown as Record<string, string>)[sort.k] ?? "";
      const kb = sort.k === "client" ? clName(csOf(b.caseId)?.clientId) : sort.k === "caseNumber" ? csOf(b.caseId)?.caseNumber ?? "" : (b as unknown as Record<string, string>)[sort.k] ?? "";
      return ka.localeCompare(kb, "ar") * sort.dir;
    });
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hearings, cases, clients, dayF, q, sort, today, windowEnd]);

  const onSort = (k: string) => setSort((s) => ({ k, dir: s.k === k ? ((s.dir * -1) as 1 | -1) : 1 }));
  const countOf = (d: string) => hearings.filter((h) => h.date === d).length;

  return (
    <div>
      <PageHead title="الأجندة" desc={`الجلسات المقررة خلال الأيام السبعة القادمة — تبدأ من ${fmtDate(today)}`}>
        <Btn variant="gold" onClick={() => go("cases", "add")}>+ جدولة جلسة عبر قضية</Btn>
      </PageHead>

      {/* ---- 7-day strip ---- */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-5 stagger">
        {days.map((d) => {
          const cnt = countOf(d);
          const active = dayF === d;
          const t = isToday(d);
          return (
            <button
              key={d}
              onClick={() => setDayF(active ? "all" : d)}
              className={`relative rounded-xl border p-3 text-center transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                active ? "bg-ink-900 border-ink-900 text-white shadow-lift" : t ? "bg-gold-100/70 border-gold-300" : "bg-white border-ink-100"
              }`}
            >
              <span className={`block text-[10.5px] font-bold ${active ? "text-gold-300" : t ? "text-gold-700" : "text-ink-400"}`}>
                {t ? "اليوم" : fmtWeekday(d)}
              </span>
              <span className={`block font-display font-black text-lg mt-0.5 ${active ? "text-white" : "text-ink-900"}`}>{fmtDateShort(d)}</span>
              <span className={`mt-1.5 inline-flex items-center justify-center min-w-[52px] px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                cnt > 0 ? (active ? "bg-gold-500 text-ink-950" : "bg-gold-100 text-gold-700") : active ? "bg-white/15 text-ink-200" : "bg-ink-100 text-ink-400"
              }`}>
                {cnt > 0 ? `${cnt} جلسة` : "لا جلسات"}
              </span>
              {t && <span className="absolute -top-1 -start-1 w-2.5 h-2.5 rounded-full bg-gold-500 pulse-dot" />}
            </button>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <header className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-ink-100">
          <div className="grow">
            <h3 className="font-display font-extrabold text-ink-900 flex items-center gap-2"><CalendarDays size={18} className="text-gold-600" /> جلسات الأسبوع القادم</h3>
            <p className="text-[12px] text-ink-400 mt-0.5">{rows.length} جلسة معروضة {dayF !== "all" && `— ${dayLabel(dayF)} ${fmtDate(dayF)}`}</p>
          </div>
          <SearchBox value={q} onChange={setQ} placeholder="بحث برقم القضية، الموكل، المحكمة..." />
          {dayF !== "all" && <Btn variant="ghost" size="sm" onClick={() => setDayF("all")}>عرض كل الأيام ✕</Btn>}
        </header>

        {rows.length === 0 ? (
          <Empty
            icon={<Gavel size={28} />}
            title={q || dayF !== "all" ? "لا توجد جلسات مطابقة" : "لا توجد جلسات خلال الأيام السبعة القادمة"}
            desc={q || dayF !== "all" ? "جرّب تعديل البحث أو الفلاتر." : "عند إنشاء قضية مع جلسة قادمة ستظهر هنا تلقائياً."}
            action={!q && dayF === "all" ? <Btn variant="gold" onClick={() => go("cases", "add")}>+ إضافة قضية ب جلسة</Btn> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full tbl min-w-[860px]">
              <thead>
                <tr>
                  <Th label="تاريخ الجلسة" k="date" sort={sort} onSort={onSort} />
                  <Th label="وقت الجلسة" k="time" sort={sort} onSort={onSort} />
                  <Th label="رقم القضية" k="caseNumber" sort={sort} onSort={onSort} />
                  <Th label="اسم الموكل" k="client" sort={sort} onSort={onSort} />
                  <Th label="المحكمة" />
                  <Th label="نوع الجلسة" />
                  <Th label="حالة القضية" />
                  <Th label="ملاحظات" />
                  <Th label="تفاصيل" />
                </tr>
              </thead>
              <tbody>
                {rows.map((h) => {
                  const cs = csOf(h.caseId);
                  const t = isToday(h.date);
                  return (
                    <tr key={h.id} className={t ? "bg-gold-100/30" : ""}>
                      <td>
                        <span className="flex items-center gap-2">
                          <span className="font-bold text-ink-900">{fmtDate(h.date)}</span>
                          <Pill cls={t ? "bg-gold-500 text-ink-950" : "bg-ink-100 text-ink-500"}>{dayLabel(h.date)}</Pill>
                        </span>
                      </td>
                      <td className="font-bold text-ink-700">{fmtTime(h.time)}</td>
                      <td className="font-bold text-gold-700" dir="ltr">{cs?.caseNumber ?? "—"}</td>
                      <td className="font-semibold text-ink-900">{clName(cs?.clientId)}</td>
                      <td className="text-ink-500">{cs?.court ?? "—"}</td>
                      <td><Pill cls="bg-ink-100 text-ink-700">{h.type}</Pill></td>
                      <td>{cs ? <StatusBadge status={cs.status} /> : "—"}</td>
                      <td className="text-ink-400 max-w-[180px] truncate">{h.notes || "—"}</td>
                      <td>
                        <button onClick={() => setViewId(h.caseId)} className="inline-flex items-center gap-1 text-[12px] font-bold text-gold-700 hover:text-gold-600">
                          <Eye size={14} /> عرض
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="flex items-center gap-1.5 text-[11.5px] text-ink-300 mt-3">
        <ChevronLeft size={13} /> تُحدَّث الأجندة تلقائياً من بيانات القضايا والجلسات.
      </p>

      {viewId && <CaseDetails caseId={viewId} onClose={() => setViewId(null)} />}
    </div>
  );
}
