import { useMemo, useRef, useState } from "react";
import {
  Banknote, CalendarPlus, Download, Eye, FileText, Gavel, History, Info,
  Paperclip, Plus, StickyNote, Trash2, Upload,
} from "lucide-react";
import { TX_TYPE, useStore } from "../store";
import type { CaseStatus, ID } from "../types";
import { dayLabel, extColor, fmtDate, fmtSize, fmtStamp, fmtTime, money, todayISO } from "../utils";
import { Btn, Confirm, Empty, Field, IconBtn, Modal, Pill, StatusBadge } from "./ui";

export function downloadDoc(name: string, ext: string, dataUrl?: string, content?: string) {
  const a = document.createElement("a");
  if (dataUrl) {
    a.href = dataUrl;
  } else if (content) {
    a.href = URL.createObjectURL(new Blob([content], { type: "application/msword;charset=utf-8" }));
  } else return;
  a.download = `${name}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function PreviewModal({ name, ext, dataUrl, content, onClose }: {
  name: string; ext: string; dataUrl?: string; content?: string; onClose: () => void;
}) {
  return (
    <Modal wide title={`معاينة: ${name}.${ext}`} onClose={onClose}>
      {content ? (
        <iframe title="preview" srcDoc={content} className="w-full h-[60vh] rounded-xl border border-ink-100 bg-white" />
      ) : dataUrl && ext === "pdf" ? (
        <iframe title="preview" src={dataUrl} className="w-full h-[60vh] rounded-xl border border-ink-100 bg-white" />
      ) : (
        <Empty icon={<FileText size={28} />} title="المعاينة غير متاحة" desc="لم يتم حفظ محتوى الملف داخل المتصفح (ملف كبير). يمكنك محاولة تنزيله إن كان متاحاً." />
      )}
    </Modal>
  );
}

const TABS = [
  { id: "info", label: "المعلومات", icon: <Info size={15} /> },
  { id: "notes", label: "الملاحظات", icon: <StickyNote size={15} /> },
  { id: "docs", label: "المستندات", icon: <Paperclip size={15} /> },
  { id: "hearings", label: "الجلسات", icon: <Gavel size={15} /> },
  { id: "finance", label: "المالية", icon: <Banknote size={15} /> },
  { id: "activity", label: "النشاط", icon: <History size={15} /> },
] as const;

export default function CaseDetails({ caseId, onClose }: { caseId: ID; onClose: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("info");
  const cases = useStore((s) => s.cases);
  const cs = cases.find((c) => c.id === caseId);

  if (!cs) return null;

  return (
    <Modal
      wide
      onClose={onClose}
      title={<span className="flex items-center gap-2.5 flex-wrap">القضية رقم <span className="text-gold-700" dir="ltr">{cs.caseNumber}</span><StatusBadge status={cs.status} /></span>}
      subtitle={`${cs.caseType} — ${cs.court}`}
    >
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 border-b border-ink-100 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[12.5px] font-bold whitespace-nowrap transition-all border-b-2 ${
              tab === t.id ? "text-gold-700 border-gold-500 bg-gold-100/40" : "text-ink-400 border-transparent hover:text-ink-800"
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {tab === "info" && <InfoTab id={caseId} />}
      {tab === "notes" && <NotesTab id={caseId} />}
      {tab === "docs" && <DocsTab id={caseId} />}
      {tab === "hearings" && <HearingsTab id={caseId} />}
      {tab === "finance" && <FinanceTab id={caseId} />}
      {tab === "activity" && <ActivityTab id={caseId} />}
    </Modal>
  );
}

/* ---------- info ---------- */
function InfoTab({ id }: { id: ID }) {
  const cases = useStore((s) => s.cases);
  const clients = useStore((s) => s.clients);
  const updateCase = useStore((s) => s.updateCase);
  const cs = cases.find((c) => c.id === id)!;
  const client = clients.find((c) => c.id === cs.clientId);

  const rows: [string, string][] = [
    ["رقم القضية", cs.caseNumber],
    ["الموكل", client?.name ?? "—"],
    ["هاتف الموكل", client?.phone ?? "—"],
    ["المحكمة", cs.court],
    ["نوع القضية", cs.caseType],
    ["تاريخ رفع القضية", fmtDate(cs.filedDate)],
    ["الجلسة القادمة", cs.nextHearingDate ? `${fmtDate(cs.nextHearingDate)} — ${fmtTime(cs.nextHearingTime)}` : "لا توجد جلسات قادمة"],
  ];

  return (
    <div className="space-y-4 anim-fade-in">
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-3 border-b border-dashed border-ink-100 pb-2">
            <span className="text-[12px] font-bold text-ink-400 shrink-0">{k}</span>
            <span className="text-[13px] font-semibold text-ink-900 text-end">{v}</span>
          </div>
        ))}
      </div>

      {cs.description && (
        <div className="rounded-xl bg-ink-50 border border-ink-100 p-3.5">
          <h5 className="text-[12px] font-bold text-ink-400 mb-1">وصف القضية</h5>
          <p className="text-[13px] text-ink-800 leading-relaxed">{cs.description}</p>
        </div>
      )}
      {cs.notes && (
        <div className="rounded-xl bg-gold-100/50 border border-gold-200 p-3.5">
          <h5 className="text-[12px] font-bold text-gold-700 mb-1">ملاحظات عامة</h5>
          <p className="text-[13px] text-ink-800 leading-relaxed">{cs.notes}</p>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-xl border border-ink-100 p-3.5">
        <span className="text-[12.5px] font-bold text-ink-500">تغيير حالة القضية:</span>
        <select
          value={cs.status}
          onChange={(e) => updateCase(id, { status: e.target.value as CaseStatus })}
          className="field-input w-40! py-1.5!"
        >
          <option value="open">مفتوحة</option>
          <option value="postponed">مؤجلة</option>
          <option value="closed">مغلقة</option>
        </select>
      </div>
    </div>
  );
}

/* ---------- notes ---------- */
function NotesTab({ id }: { id: ID }) {
  const notes = useStore((s) => s.notes.filter((n) => n.caseId === id));
  const addNote = useStore((s) => s.addNote);
  const [text, setText] = useState("");
  const list = useStore((s) => s.notes).filter((n) => n.caseId === id);

  return (
    <div className="space-y-3 anim-fade-in">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim().length < 3) return;
          addNote(id, text.trim());
          setText("");
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب ملاحظة جديدة على القضية..." className="field-input" />
        <Btn type="submit" variant="gold" disabled={text.trim().length < 3}><Plus size={16} /> إضافة</Btn>
      </form>
      {list.length === 0 ? (
        <Empty icon={<StickyNote size={26} />} title="لا توجد ملاحظات" desc="سجّل أفكارك وتطورات القضية هنا." />
      ) : (
        <div className="space-y-2.5">
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-ink-100 bg-ink-50/50 p-3.5 anim-slide">
              <p className="text-[13px] text-ink-800 leading-relaxed">{n.text}</p>
              <p className="text-[10.5px] text-ink-300 mt-1.5">{fmtStamp(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- documents ---------- */
function DocsTab({ id }: { id: ID }) {
  const files = useStore((s) => s.caseFiles.filter((f) => f.caseId === id));
  const templates = useStore((s) => s.templates);
  const addCaseFile = useStore((s) => s.addCaseFile);
  const deleteCaseFile = useStore((s) => s.deleteCaseFile);
  const lawyerId = useStore((s) => s.sessionUserId) ?? "";
  const toast = useStore((s) => s.toast);

  const [tplId, setTplId] = useState("");
  const [preview, setPreview] = useState<{ name: string; ext: string; dataUrl?: string; content?: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<ID | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const myTpls = templates.filter((t) => t.lawyerId === lawyerId);
  const myFiles = useStore((s) => s.caseFiles).filter((f) => f.caseId === id);

  const onUpload = (f: File) => {
    const ext = (f.name.split(".").pop() ?? "pdf").toLowerCase();
    const base = f.name.replace(/\.[^.]+$/, "");
    if (f.size > 1.5 * 1024 * 1024) {
      addCaseFile(id, { name: base, ext, size: f.size });
      toast("warning", "الملف كبير — تم حفظ بياناته فقط دون المحتوى.");
      return;
    }
    const r = new FileReader();
    r.onload = () => addCaseFile(id, { name: base, ext, size: f.size, dataUrl: String(r.result) });
    r.readAsDataURL(f);
  };

  return (
    <div className="space-y-3 anim-fade-in">
      <div className="flex flex-wrap gap-2 items-center rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-3">
        <select value={tplId} onChange={(e) => setTplId(e.target.value)} className="field-input w-52! py-2! text-[13px]">
          <option value="">اختر من النماذج المحفوظة...</option>
          {myTpls.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.ext})</option>)}
        </select>
        <Btn
          variant="outline" size="md" disabled={!tplId}
          onClick={() => {
            const t = myTpls.find((x) => x.id === tplId)!;
            addCaseFile(id, { name: t.name, ext: t.ext, size: t.size, dataUrl: t.dataUrl, content: t.content, templateId: t.id });
            setTplId("");
          }}
        >
          <Paperclip size={15} /> إرفاق النموذج
        </Btn>
        <span className="text-ink-300 text-xs font-bold">أو</span>
        <Btn variant="gold" onClick={() => fileRef.current?.click()}><Upload size={15} /> رفع ملف</Btn>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
      </div>

      {myFiles.length === 0 ? (
        <Empty icon={<Paperclip size={26} />} title="لا توجد مستندات مرفقة" desc="أرفق نموذجاً جاهزاً أو ارفع ملفاً مرتبطاً بهذه القضية." />
      ) : (
        <div className="divide-y divide-ink-100 border border-ink-100 rounded-xl overflow-hidden">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-ink-50/60 transition-colors">
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center font-display font-black text-[10px] uppercase ${extColor(f.ext)}`}>{f.ext}</span>
              <div className="grow min-w-0">
                <p className="text-[13px] font-bold text-ink-900 truncate">{f.name}</p>
                <p className="text-[11px] text-ink-400">{fmtSize(f.size)} — {fmtStamp(f.addedAt)}</p>
              </div>
              <IconBtn title="معاينة" tone="gold" onClick={() => setPreview({ name: f.name, ext: f.ext, dataUrl: f.dataUrl, content: f.content })}><Eye size={16} /></IconBtn>
              <IconBtn title="تنزيل" onClick={() => downloadDoc(f.name, f.ext, f.dataUrl, f.content)}><Download size={16} /></IconBtn>
              <IconBtn danger title="حذف" onClick={() => setConfirmDel(f.id)}><Trash2 size={16} /></IconBtn>
            </div>
          ))}
        </div>
      )}

      {preview && <PreviewModal {...preview} onClose={() => setPreview(null)} />}
      {confirmDel && (
        <Confirm
          title="حذف المستند المرفق"
          message="سيتم إزالة هذا المستند من ملف القضية. هذا الإجراء لا يمكن التراجع عنه."
          onConfirm={() => deleteCaseFile(confirmDel)}
          onClose={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

/* ---------- hearings ---------- */
function HearingsTab({ id }: { id: ID }) {
  const hearings = useStore((s) => s.hearings.filter((h) => h.caseId === id));
  const addHearing = useStore((s) => s.addHearing);
  const deleteHearing = useStore((s) => s.deleteHearing);
  const [confirmDel, setConfirmDel] = useState<ID | null>(null);
  const [form, setForm] = useState({ date: todayISO(), time: "10:00", type: "جلسة نظر الدعوى", notes: "" });
  const [err, setErr] = useState("");
  const list = useStore((s) => s.hearings)
    .filter((h) => h.caseId === id)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <div className="space-y-4 anim-fade-in">
      <form
        className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end rounded-xl border border-ink-100 bg-ink-50/40 p-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.date) { setErr("حدد تاريخ الجلسة"); return; }
          addHearing(id, form);
          setForm({ date: todayISO(), time: "10:00", type: "جلسة نظر الدعوى", notes: "" });
          setErr("");
        }}
      >
        <Field label="التاريخ" req error={err}><input type="date" className="field-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="الوقت" req><input type="time" className="field-input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
        <Field label="نوع الجلسة" req>
          <select className="field-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {["جلسة نظر الدعوى", "مرافعة", "حكم", "إثبات", "صلح", "استئناف", "أولى"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <div className="col-span-2 sm:col-span-1"><Field label="ملاحظات"><input className="field-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="اختياري" /></Field></div>
        <Btn type="submit" variant="gold"><CalendarPlus size={16} /> إضافة جلسة</Btn>
      </form>

      {list.length === 0 ? (
        <Empty icon={<Gavel size={26} />} title="لا توجد جلسات" desc="أضف الجلسات السابقة والقادمة لهذه القضية." />
      ) : (
        <div className="relative border-s-2 border-gold-200 ms-2 space-y-3">
          {list.map((h) => {
            const past = h.date < todayISO();
            const today = h.date === todayISO();
            return (
              <div key={h.id} className="relative ms-4 rounded-xl border border-ink-100 bg-white p-3.5 shadow-sm">
                <span className={`absolute -start-[23px] top-4 w-3 h-3 rounded-full border-2 border-white ${today ? "bg-gold-500 pulse-dot" : past ? "bg-ink-300" : "bg-ok-500"}`} />
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-[13.5px] font-bold text-ink-900">{h.type}
                      <Pill cls={today ? "bg-gold-100 text-gold-700" : past ? "bg-ink-100 text-ink-500" : "bg-ok-100 text-ok-500"}>
                        {today ? "اليوم" : past ? "انتهت" : "قادمة"}
                      </Pill>
                    </p>
                    <p className="text-[12px] text-ink-500 mt-1">{dayLabel(h.date)} — {fmtDate(h.date)} — الساعة {fmtTime(h.time)}</p>
                    {h.notes && <p className="text-[12px] text-ink-400 mt-1">{h.notes}</p>}
                  </div>
                  <IconBtn danger title="حذف الجلسة" onClick={() => setConfirmDel(h.id)}><Trash2 size={16} /></IconBtn>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {confirmDel && (
        <Confirm title="حذف الجلسة" message="سيتم حذف الجلسة من الأجندة ومن سجل القضية." onConfirm={() => deleteHearing(confirmDel)} onClose={() => setConfirmDel(null)} />
      )}
    </div>
  );
}

/* ---------- finance ---------- */
function FinanceTab({ id }: { id: ID }) {
  const txs = useStore((s) => s.txs.filter((t) => t.caseId === id));
  const addTx = useStore((s) => s.addTx);
  const deleteTx = useStore((s) => s.deleteTx);
  const cs = useStore((s) => s.cases.find((c) => c.id === id))!;
  const [confirmDel, setConfirmDel] = useState<ID | null>(null);
  const [form, setForm] = useState({ amount: "", type: "fees" as "fees" | "expenses", date: todayISO(), notes: "" });
  const list = useStore((s) => s.txs).filter((t) => t.caseId === id);
  const fees = list.filter((t) => t.type === "fees").reduce((a, b) => a + b.amount, 0);
  const exp = list.filter((t) => t.type === "expenses").reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-4 anim-fade-in">
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl bg-ok-100/60 border border-ok-500/15 p-3 text-center">
          <p className="text-[11px] font-bold text-ok-500">الأتعاب</p>
          <p className="font-display font-black text-ink-900 text-sm mt-0.5">{money(fees)}</p>
        </div>
        <div className="rounded-xl bg-bad-100/60 border border-bad-500/15 p-3 text-center">
          <p className="text-[11px] font-bold text-bad-500">المصروفات</p>
          <p className="font-display font-black text-ink-900 text-sm mt-0.5">{money(exp)}</p>
        </div>
        <div className="rounded-xl bg-gold-100/60 border border-gold-500/20 p-3 text-center">
          <p className="text-[11px] font-bold text-gold-700">الصافي</p>
          <p className="font-display font-black text-ink-900 text-sm mt-0.5">{money(fees - exp)}</p>
        </div>
      </div>

      <form
        className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end rounded-xl border border-ink-100 bg-ink-50/40 p-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          const amount = Number(form.amount);
          if (!amount || amount <= 0) return;
          addTx({ clientId: cs.clientId, caseId: id, amount, type: form.type, date: form.date, notes: form.notes });
          setForm({ amount: "", type: "fees", date: todayISO(), notes: "" });
        }}
      >
        <Field label="المبلغ (ر.س)" req><input type="number" min="1" className="field-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" /></Field>
        <Field label="النوع" req>
          <select className="field-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "fees" | "expenses" })}>
            <option value="fees">أتعاب</option>
            <option value="expenses">مصروفات</option>
          </select>
        </Field>
        <Field label="التاريخ" req><input type="date" className="field-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <div className="col-span-2 sm:col-span-1"><Field label="ملاحظات"><input className="field-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
        <Btn type="submit" variant="success"><Plus size={16} /> تسجيل عملية</Btn>
      </form>

      {list.length === 0 ? (
        <Empty icon={<Banknote size={26} />} title="لا توجد عمليات مالية" desc="سجّل الأتعاب والمصروفات المرتبطة بهذه القضية." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-100">
          <table className="w-full tbl">
            <thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>ملاحظات</th><th></th></tr></thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id}>
                  <td className="text-ink-500">{fmtDate(t.date)}</td>
                  <td><Pill cls={TX_TYPE[t.type].cls}>{TX_TYPE[t.type].label}</Pill></td>
                  <td className={`font-bold ${t.type === "fees" ? "text-ok-500" : "text-bad-500"}`}>{money(t.amount)}</td>
                  <td className="text-ink-500">{t.notes || "—"}</td>
                  <td><IconBtn danger title="حذف" onClick={() => setConfirmDel(t.id)}><Trash2 size={15} /></IconBtn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {confirmDel && <Confirm title="حذف العملية المالية" message="سيتم حذف العملية وسيُحدَّث الملخص المالي تلقائياً." onConfirm={() => deleteTx(confirmDel)} onClose={() => setConfirmDel(null)} />}
    </div>
  );
}

/* ---------- activity ---------- */
function ActivityTab({ id }: { id: ID }) {
  const acts = useStore((s) => s.activities.filter((a) => a.caseId === id));
  const list = useStore((s) => s.activities).filter((a) => a.caseId === id);

  if (list.length === 0)
    return <Empty icon={<History size={26} />} title="لا يوجد نشاط مسجل" desc="ستظهر هنا الإجراءات المهمة المرتبطة بالقضية." />;

  return (
    <div className="space-y-2.5 anim-fade-in">
      {acts.map((a) => (
        <div key={a.id} className="flex items-center gap-3 rounded-xl border border-ink-100 px-3.5 py-2.5">
          <span className="w-8 h-8 rounded-lg bg-ink-100 text-ink-600 flex items-center justify-center shrink-0"><History size={14} /></span>
          <div className="grow">
            <p className="text-[13px] font-semibold text-ink-800">{a.text}</p>
            <p className="text-[10.5px] text-ink-300 mt-0.5">{fmtStamp(a.at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
