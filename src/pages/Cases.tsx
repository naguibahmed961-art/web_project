import { useEffect, useMemo, useState } from "react";
import { Briefcase, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useStore } from "../store";
import type { Case, CaseStatus, ID } from "../types";
import { fmtDate, fmtTime, fmtTs, todayISO } from "../utils";
import CaseDetails from "../components/CaseDetails";
import { Btn, Confirm, Empty, Field, IconBtn, Modal, PageHead, Pagination, SearchBox, StatusBadge, Th } from "../components/ui";

const PAGE_SIZE = 7;
const TYPES = ["تجارية", "جنائية", "أحوال شخصية", "عمالية", "عقارية", "إدارية", "مدنية", "أخرى"];

export default function Cases() {
  const uid = useStore((s) => s.sessionUserId) ?? "";
  const me = useStore((s) => s.lawyers.find((l) => l.id === s.sessionUserId));
  const nav = useStore((s) => s.nav);
  const consumeIntent = useStore((s) => s.consumeIntent);
  const rawCases = useStore((s) => s.cases);
  const rawClients = useStore((s) => s.clients);
  const addCase = useStore((s) => s.addCase);
  const updateCase = useStore((s) => s.updateCase);
  const deleteCase = useStore((s) => s.deleteCase);

  const cases = useMemo(() => rawCases.filter((c) => c.lawyerId === uid), [rawCases, uid]);
  const clients = useMemo(() => rawClients.filter((c) => c.lawyerId === uid), [rawClients, uid]);

  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 }>({ k: "createdAt", dir: -1 });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | { edit?: Case }>(null);
  const [viewId, setViewId] = useState<ID | null>(null);
  const [delId, setDelId] = useState<ID | null>(null);

  useEffect(() => {
    if (nav.page === "cases" && nav.intent === "add") {
      setModal({});
      consumeIntent();
    }
  }, [nav, consumeIntent]);

  const clientName = (id: ID) => clients.find((c) => c.id === id)?.name ?? "—";

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
    const rank: Record<CaseStatus, number> = { open: 0, postponed: 1, closed: 2 };
    r.sort((a, b) => {
      if (sort.k === "client") return clientName(a.clientId).localeCompare(clientName(b.clientId), "ar") * sort.dir;
      if (sort.k === "status") return (rank[a.status] - rank[b.status]) * sort.dir;
      const va = String((a as unknown as Record<string, unknown>)[sort.k] ?? "");
      const vb = String((b as unknown as Record<string, unknown>)[sort.k] ?? "");
      return va.localeCompare(vb) * sort.dir;
    });
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cases, clients, q, statusF, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const onSort = (k: string) => setSort((s) => ({ k, dir: s.k === k ? ((s.dir * -1) as 1 | -1) : 1 }));
  const delCase = cases.find((c) => c.id === delId);

  const counts = {
    all: cases.length,
    open: cases.filter((c) => c.status === "open").length,
    postponed: cases.filter((c) => c.status === "postponed").length,
    closed: cases.filter((c) => c.status === "closed").length,
  };

  return (
    <div>
      <PageHead title="القضايا" desc="سجل قضايا المكتب كاملة مع حالتها وجلساتها القادمة.">
        <Btn variant="gold" onClick={() => setModal({})}><Plus size={16} /> إضافة قضية جديدة</Btn>
      </PageHead>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {([["all", "الكل"], ["open", "مفتوحة"], ["postponed", "مؤجلة"], ["closed", "مغلقة"]] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => { setStatusF(k); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all inline-flex items-center gap-2 ${
              statusF === k ? "bg-ink-900 text-gold-300 shadow-sm" : "bg-white border border-ink-100 text-ink-500 hover:border-gold-300"
            }`}
          >
            {label}
            <span className={`text-[10.5px] px-1.5 py-0.5 rounded-md ${statusF === k ? "bg-white/15" : "bg-ink-100"}`}>{counts[k]}</span>
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <header className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-ink-100">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="بحث عن قضية... (الرقم، الموكل، المحكمة)" />
          <span className="ms-auto text-[12px] text-ink-400 font-semibold">{rows.length} قضية</span>
        </header>

        {rows.length === 0 ? (
          cases.length === 0 ? (
            <Empty icon={<Briefcase size={28} />} title="لا توجد قضايا حتى الآن" desc="أنشئ أول قضية وحدد جلستها القادمة لتظهر في الأجندة."
              action={<Btn variant="gold" onClick={() => setModal({})}><Plus size={16} /> إضافة أول قضية</Btn>} />
          ) : (
            <Empty icon={<Briefcase size={28} />} title="لا نتائج مطابقة" desc="جرّب تعديل البحث أو تغيير فلتر الحالة." />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full tbl min-w-[960px]">
                <thead>
                  <tr>
                    <Th label="رقم القضية" k="caseNumber" sort={sort} onSort={onSort} />
                    <Th label="اسم الموكل" k="client" sort={sort} onSort={onSort} />
                    <Th label="المحكمة" k="court" sort={sort} onSort={onSort} />
                    <Th label="نوع القضية" k="caseType" sort={sort} onSort={onSort} />
                    <Th label="تاريخ الرفع" k="filedDate" sort={sort} onSort={onSort} />
                    <Th label="الجلسة القادمة" k="nextHearingDate" sort={sort} onSort={onSort} />
                    <Th label="الحالة" k="status" sort={sort} onSort={onSort} />
                    <Th label="المحامي المسؤول" />
                    <Th label="الإجراءات" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((c) => (
                    <tr key={c.id} className="cursor-pointer" onClick={() => setViewId(c.id)}>
                      <td className="font-bold text-gold-700" dir="ltr">{c.caseNumber}</td>
                      <td className="font-semibold text-ink-900">{clientName(c.clientId)}</td>
                      <td className="text-ink-500">{c.court}</td>
                      <td className="text-ink-600">{c.caseType}</td>
                      <td className="text-ink-500">{fmtDate(c.filedDate)}</td>
                      <td className="text-ink-700">{c.nextHearingDate ? `${fmtDate(c.nextHearingDate)} • ${fmtTime(c.nextHearingTime)}` : <span className="text-ink-300">—</span>}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="text-ink-600">{me?.name ?? "—"}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <span className="flex items-center gap-0.5">
                          <IconBtn title="عرض الملف" tone="gold" onClick={() => setViewId(c.id)}><Eye size={16} /></IconBtn>
                          <IconBtn title="تعديل" onClick={() => setModal({ edit: c })}><Pencil size={15} /></IconBtn>
                          <IconBtn danger title="حذف" onClick={() => setDelId(c.id)}><Trash2 size={15} /></IconBtn>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={pages} onPage={setPage} total={rows.length} shown={pageRows.length} />
          </>
        )}
      </div>

      {modal && (
        <CaseModal
          cs={modal.edit}
          clients={clients}
          exists={(num, id) => cases.some((c) => c.caseNumber.trim() === num.trim() && c.id !== id)}
          onSave={(d) => {
            if (modal.edit) updateCase(modal.edit.id, d);
            else addCase(d as Omit<Case, "id" | "lawyerId" | "createdAt">);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {viewId && <CaseDetails caseId={viewId} onClose={() => setViewId(null)} />}
      {delId && delCase && (
        <Confirm
          title={`حذف القضية رقم ${delCase.caseNumber}`}
          message="سيتم حذف القضية مع جميع جلساتها وملاحظاتها ومستنداتها ومعاملاتها المالية المرتبطة بها. هذا الإجراء لا يمكن التراج عنه."
          onConfirm={() => deleteCase(delId)}
          onClose={() => setDelId(null)}
        />
      )}
    </div>
  );
}

function CaseModal({ cs, clients, exists, onSave, onClose }: {
  cs?: Case;
  clients: { id: ID; name: string }[];
  exists: (num: string, id?: ID) => boolean;
  onSave: (d: Partial<Case>) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState({
    caseNumber: cs?.caseNumber ?? "",
    clientId: cs?.clientId ?? "",
    court: cs?.court ?? "",
    caseType: cs?.caseType ?? TYPES[0],
    filedDate: cs?.filedDate ?? todayISO(),
    nextHearingDate: cs?.nextHearingDate ?? "",
    nextHearingTime: cs?.nextHearingTime ?? "10:00",
    status: cs?.status ?? ("open" as CaseStatus),
    description: cs?.description ?? "",
    notes: cs?.notes ?? "",
  });
  const [errs, setErrs] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.caseNumber.trim()) er.caseNumber = "أدخل رقم القضية";
    else if (exists(f.caseNumber, cs?.id)) er.caseNumber = "يوجد قضية مسجلة بهذا الرقم بالفعل";
    if (!f.clientId) er.clientId = "اختر الموكل من القائمة";
    if (!f.court.trim()) er.court = "أدخل اسم المحكمة";
    if (!f.filedDate) er.filedDate = "حدد تاريخ رفع القضية";
    if (Object.keys(er).length) { setErrs(er); return; }
    onSave({
      caseNumber: f.caseNumber.trim(), clientId: f.clientId, court: f.court.trim(), caseType: f.caseType,
      filedDate: f.filedDate, nextHearingDate: f.nextHearingDate, nextHearingTime: f.nextHearingDate ? f.nextHearingTime : "",
      status: f.status, description: f.description.trim() || undefined, notes: f.notes.trim() || undefined,
    });
  };

  return (
    <Modal
      wide
      title={cs ? `تعديل القضية ${cs.caseNumber}` : "إضافة قضية جديدة"}
      subtitle="إذا حددت جلسة قادمة ستُضاف تلقائياً إلى الأجندة والتنبيهات"
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Field label="رقم القضية" req error={errs.caseNumber}>
            <input className={`field-input ${errs.caseNumber ? "err" : ""}`} value={f.caseNumber} onChange={(e) => setF({ ...f, caseNumber: e.target.value })} placeholder="مثال: 1042/2025" dir="ltr" style={{ textAlign: "end" }} />
          </Field>
          <Field label="الموكل" req error={errs.clientId}>
            <select className={`field-input ${errs.clientId ? "err" : ""}`} value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
              <option value="">— اختر الموكل —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="نوع القضية" req>
            <select className="field-input" value={f.caseType} onChange={(e) => setF({ ...f, caseType: e.target.value })}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="المحكمة" req error={errs.court}>
            <input className={`field-input ${errs.court ? "err" : ""}`} value={f.court} onChange={(e) => setF({ ...f, court: e.target.value })} placeholder="مثال: المحكمة التجارية بالرياض" />
          </Field>
          <Field label="تاريخ رفع القضية" req error={errs.filedDate}>
            <input type="date" className={`field-input ${errs.filedDate ? "err" : ""}`} value={f.filedDate} onChange={(e) => setF({ ...f, filedDate: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 rounded-xl bg-gold-100/40 border border-gold-200 p-3.5">
          <Field label="تاريخ الجلسة القادمة" hint="(اختياري)">
            <input type="date" className="field-input" value={f.nextHearingDate} onChange={(e) => setF({ ...f, nextHearingDate: e.target.value })} />
          </Field>
          <Field label="وقت الجلسة">
            <input type="time" className="field-input" value={f.nextHearingTime} onChange={(e) => setF({ ...f, nextHearingTime: e.target.value })} disabled={!f.nextHearingDate} />
          </Field>
          <Field label="حالة القضية" req>
            <select className="field-input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as CaseStatus })}>
              <option value="open">مفتوحة</option>
              <option value="postponed">مؤجلة</option>
              <option value="closed">مغلقة</option>
            </select>
          </Field>
        </div>
        <Field label="وصف القضية">
          <textarea className="field-input min-h-[70px]" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="ملخص موضوع الدعوى والمطالبات..." />
        </Field>
        <Field label="ملاحظات">
          <textarea className="field-input min-h-[56px]" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="ملاحظات داخلية (اختياري)" />
        </Field>
        {clients.length === 0 && (
          <p className="text-[12px] font-semibold text-warn-500 bg-warn-100 rounded-lg px-3 py-2">لا يوجد موكلون بعد — أضف موكلاً أولاً من صفحة «الموكلين».</p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Btn variant="outline" onClick={onClose}>إلغاء</Btn>
          <Btn type="submit" variant="gold">{cs ? "حفظ التعديلات" : "إنشاء القضية"}</Btn>
        </div>
      </form>
    </Modal>
  );
}
