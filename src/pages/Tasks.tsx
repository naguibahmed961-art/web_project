import { useEffect, useMemo, useState } from "react";
import { Check, FilterX, ListTodo, Pencil, Plus, Trash2 } from "lucide-react";
import { PRIORITY, useStore } from "../store";
import type { ID, Priority, Task } from "../types";
import { fmtDate, fmtTime, isPast, isToday, todayISO } from "../utils";
import { Btn, Confirm, Empty, Field, IconBtn, Modal, PageHead, Pagination, Pill, PriorityBadge, SearchBox, Th } from "../components/ui";

const PAGE_SIZE = 8;
const emptyForm = { title: "", description: "", date: todayISO(), time: "", priority: "medium" as Priority, caseId: "", clientId: "" };

export default function Tasks() {
  const uid = useStore((s) => s.sessionUserId) ?? "";
  const nav = useStore((s) => s.nav);
  const consumeIntent = useStore((s) => s.consumeIntent);
  const rawTasks = useStore((s) => s.tasks);
  const rawCases = useStore((s) => s.cases);
  const rawClients = useStore((s) => s.clients);
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const toggleTask = useStore((s) => s.toggleTask);
  const deleteTask = useStore((s) => s.deleteTask);

  const tasks = useMemo(() => rawTasks.filter((t) => t.lawyerId === uid), [rawTasks, uid]);
  const cases = useMemo(() => rawCases.filter((c) => c.lawyerId === uid), [rawCases, uid]);
  const clients = useMemo(() => rawClients.filter((c) => c.lawyerId === uid), [rawClients, uid]);

  const [modal, setModal] = useState<null | { edit?: Task }>(null);
  const [delId, setDelId] = useState<ID | null>(null);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [prioF, setPrioF] = useState("all");
  const [dateF, setDateF] = useState("");
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 }>({ k: "date", dir: 1 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (nav.page === "tasks" && nav.intent === "add") {
      setModal({});
      consumeIntent();
    }
  }, [nav, consumeIntent]);

  const caseNum = (id?: ID) => cases.find((c) => c.id === id)?.caseNumber;

  const rows = useMemo(() => {
    let r = [...tasks];
    if (statusF === "open") r = r.filter((t) => !t.completed);
    if (statusF === "done") r = r.filter((t) => t.completed);
    if (prioF !== "all") r = r.filter((t) => t.priority === prioF);
    if (dateF) r = r.filter((t) => t.date === dateF);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      r = r.filter((t) => t.title.toLowerCase().includes(s) || (caseNum(t.caseId) ?? "").toLowerCase().includes(s));
    }
    const pr: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
    r.sort((a, b) => {
      if (sort.k === "priority") return (pr[a.priority] - pr[b.priority]) * sort.dir;
      if (sort.k === "title") return a.title.localeCompare(b.title, "ar") * sort.dir;
      const va = (a as unknown as Record<string, string>)[sort.k] ?? "";
      const vb = (b as unknown as Record<string, string>)[sort.k] ?? "";
      return va.localeCompare(vb) * sort.dir;
    });
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, q, statusF, prioF, dateF, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const onSort = (k: string) => setSort((s) => ({ k, dir: s.k === k ? ((s.dir * -1) as 1 | -1) : 1 }));
  const hasFilters = q !== "" || statusF !== "all" || prioF !== "all" || dateF !== "";

  return (
    <div>
      <PageHead title="المهام" desc="نظّم أعمالك اليومية بأولويات واضحة واستحقاقات لا تُنسى.">
        <Btn variant="gold" onClick={() => setModal({})}><Plus size={16} /> إضافة مهمة جديدة</Btn>
      </PageHead>

      <div className="card overflow-hidden">
        <header className="flex flex-wrap items-center gap-2.5 px-5 py-4 border-b border-ink-100">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="بحث في المهام..." />
          <select value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1); }} className="field-input w-36! py-2! text-[13px]">
            <option value="all">كل الحالات</option>
            <option value="open">قيد التنفيذ</option>
            <option value="done">مكتملة</option>
          </select>
          <select value={prioF} onChange={(e) => { setPrioF(e.target.value); setPage(1); }} className="field-input w-36! py-2! text-[13px]">
            <option value="all">كل الأولويات</option>
            <option value="high">عالية</option>
            <option value="medium">متوسطة</option>
            <option value="low">منخفضة</option>
          </select>
          <input type="date" value={dateF} onChange={(e) => { setDateF(e.target.value); setPage(1); }} className="field-input w-40! py-2! text-[13px]" title="تصفية حسب التاريخ" />
          {hasFilters && (
            <Btn variant="ghost" size="sm" onClick={() => { setQ(""); setStatusF("all"); setPrioF("all"); setDateF(""); }}><FilterX size={14} /> مسح الفلاتر</Btn>
          )}
          <span className="ms-auto text-[12px] text-ink-400 font-semibold">{rows.length} مهمة</span>
        </header>

        {rows.length === 0 ? (
          tasks.length === 0 ? (
            <Empty icon={<ListTodo size={28} />} title="لا توجد مهام بعد" desc="أضف أول مهمة وستظهر أيضاً في لوحة التحكم عند استحقاقها."
              action={<Btn variant="gold" onClick={() => setModal({})}><Plus size={16} /> إضافة أول مهمة</Btn>} />
          ) : (
            <Empty icon={<ListTodo size={28} />} title="لا نتائج مطابقة" desc="جرّب تعديل الفلاتر أو مسحها." />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full tbl min-w-[760px]">
                <thead>
                  <tr>
                    <th className="w-10!"></th>
                    <Th label="اسم المهمة" k="title" sort={sort} onSort={onSort} />
                    <Th label="التاريخ" k="date" sort={sort} onSort={onSort} />
                    <Th label="الأولوية" k="priority" sort={sort} onSort={onSort} />
                    <Th label="القضية" />
                    <Th label="الحالة" />
                    <Th label="الإجراءات" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((t) => {
                    const overdue = !t.completed && isPast(t.date);
                    return (
                      <tr key={t.id} className={t.completed ? "opacity-60" : ""}>
                        <td>
                          <button
                            onClick={() => toggleTask(t.id)}
                            title={t.completed ? "إلغاء الإكمال" : "إكمال"}
                            className={`w-5.5 h-5.5 min-w-[22px] min-h-[22px] rounded-md border-2 flex items-center justify-center transition-all active:scale-90 ${t.completed ? "bg-ok-500 border-ok-500 text-white" : "border-ink-300 text-transparent hover:border-ok-500 hover:text-ok-500/40"}`}
                          >
                            <Check size={13} strokeWidth={3.5} />
                          </button>
                        </td>
                        <td>
                          <p className={`font-bold text-ink-900 max-w-[260px] truncate ${t.completed ? "line-through text-ink-400" : ""}`}>{t.title}</p>
                          {t.description && <p className="text-[11.5px] text-ink-400 max-w-[260px] truncate">{t.description}</p>}
                        </td>
                        <td>
                          <span className="flex items-center gap-1.5 text-ink-600">
                            {isToday(t.date) ? <Pill cls="bg-gold-100 text-gold-700">اليوم</Pill> : fmtDate(t.date)}
                            {t.time && <span className="text-ink-400 text-[12px]">{fmtTime(t.time)}</span>}
                            {overdue && <Pill cls="bg-bad-500 text-white">متأخرة</Pill>}
                          </span>
                        </td>
                        <td><PriorityBadge p={t.priority} /></td>
                        <td className="text-gold-700 font-semibold" dir="ltr">{caseNum(t.caseId) ?? "—"}</td>
                        <td>
                          <Pill cls={t.completed ? "bg-ok-100 text-ok-500" : overdue ? "bg-bad-100 text-bad-500" : "bg-ink-100 text-ink-600"}>
                            {t.completed ? "مكتملة" : overdue ? "متأخرة" : "قيد التنفيذ"}
                          </Pill>
                        </td>
                        <td>
                          <span className="flex items-center gap-0.5">
                            <IconBtn title="تعديل" tone="gold" onClick={() => setModal({ edit: t })}><Pencil size={15} /></IconBtn>
                            <IconBtn danger title="حذف" onClick={() => setDelId(t.id)}><Trash2 size={15} /></IconBtn>
                          </span>
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
      </div>

      {modal && (
        <TaskModal
          task={modal.edit}
          cases={cases}
          clients={clients}
          onSave={(d) => {
            if (modal.edit) updateTask(modal.edit.id, d);
            else addTask(d as Omit<Task, "id" | "lawyerId" | "createdAt" | "completed">);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {delId && <Confirm title="حذف المهمة" message="سيتم حذف هذه المهمة نهائياً. هل أنت متأكد؟" onConfirm={() => deleteTask(delId)} onClose={() => setDelId(null)} />}
    </div>
  );
}

function TaskModal({ task, cases, clients, onSave, onClose }: {
  task?: Task;
  cases: { id: ID; caseNumber: string }[];
  clients: { id: ID; name: string }[];
  onSave: (d: Partial<Task>) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    date: task?.date ?? todayISO(),
    time: task?.time ?? "",
    priority: task?.priority ?? ("medium" as Priority),
    caseId: task?.caseId ?? "",
    clientId: task?.clientId ?? "",
  });
  const [errs, setErrs] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.title.trim().length < 3) er.title = "أدخل اسم المهمة (3 أحرف على الأقل)";
    if (!f.date) er.date = "حدد تاريخ المهمة";
    if (Object.keys(er).length) { setErrs(er); return; }
    onSave({
      title: f.title.trim(),
      description: f.description.trim() || undefined,
      date: f.date,
      time: f.time || undefined,
      priority: f.priority,
      caseId: f.caseId || undefined,
      clientId: f.clientId || undefined,
    });
  };

  return (
    <Modal title={task ? "تعديل المهمة" : "إضافة مهمة جديدة"} subtitle="ستظهر المهمة في لوحة التحكم عند حلول تاريخها" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="اسم المهمة" req error={errs.title}>
          <input className={`field-input ${errs.title ? "err" : ""}`} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="مثال: تجهيز مذكرة الدفاع" />
        </Field>
        <Field label="وصف المهمة">
          <textarea className="field-input min-h-[70px]" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="تفاصيل إضافية (اختياري)" />
        </Field>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="تاريخ المهمة" req error={errs.date}>
            <input type="date" className={`field-input ${errs.date ? "err" : ""}`} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </Field>
          <Field label="وقت المهمة">
            <input type="time" className="field-input" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
          </Field>
          <Field label="الأولوية" req>
            <select className="field-input" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as Priority })}>
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="القضية المرتبطة" hint="(اختياري)">
            <select className="field-input" value={f.caseId} onChange={(e) => setF({ ...f, caseId: e.target.value })}>
              <option value="">بدون قضية</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.caseNumber}</option>)}
            </select>
          </Field>
          <Field label="الموكل المرتبط" hint="(اختياري)">
            <select className="field-input" value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
              <option value="">بدون موكل</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="outline" onClick={onClose}>إلغاء</Btn>
          <Btn type="submit" variant="gold">{task ? "حفظ التعديلات" : "إضافة المهمة"}</Btn>
        </div>
      </form>
    </Modal>
  );
}
