import { useEffect, useMemo, useState } from "react";
import { Briefcase, CalendarPlus, Eye, Mail, MapPin, Pencil, Phone, Plus, Trash2, UserRound, Users, X } from "lucide-react";
import { TX_TYPE, useStore } from "../store";
import type { Client, ID } from "../types";
import { fmtDate, fmtStamp, fmtTs, money, todayISO } from "../utils";
import CaseDetails from "../components/CaseDetails";
import { Btn, Confirm, Empty, Field, IconBtn, Modal, PageHead, Pagination, Pill, SearchBox, StatusBadge, Th } from "../components/ui";

const PAGE_SIZE = 7;

export default function Clients() {
  const uid = useStore((s) => s.sessionUserId) ?? "";
  const nav = useStore((s) => s.nav);
  const consumeIntent = useStore((s) => s.consumeIntent);
  const rawClients = useStore((s) => s.clients);
  const rawCases = useStore((s) => s.cases);
  const rawTxs = useStore((s) => s.txs);
  const addClient = useStore((s) => s.addClient);
  const updateClient = useStore((s) => s.updateClient);
  const deleteClient = useStore((s) => s.deleteClient);

  const clients = useMemo(() => rawClients.filter((c) => c.lawyerId === uid), [rawClients, uid]);
  const cases = useMemo(() => rawCases.filter((c) => c.lawyerId === uid), [rawCases, uid]);
  const txs = useMemo(() => rawTxs.filter((t) => t.lawyerId === uid), [rawTxs, uid]);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 }>({ k: "createdAt", dir: -1 });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | { edit?: Client }>(null);
  const [detailsId, setDetailsId] = useState<ID | null>(null);
  const [caseViewId, setCaseViewId] = useState<ID | null>(null);
  const [delId, setDelId] = useState<ID | null>(null);

  useEffect(() => {
    if (nav.page === "clients" && nav.intent === "add") {
      setModal({});
      consumeIntent();
    }
  }, [nav, consumeIntent]);

  const caseCount = (id: ID) => cases.filter((c) => c.clientId === id).length;
  const clientCaseNums = (id: ID) => cases.filter((c) => c.clientId === id).map((c) => c.caseNumber.toLowerCase());

  const rows = useMemo(() => {
    let r = [...clients];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      r = r.filter((c) =>
        c.name.toLowerCase().includes(s) ||
        c.phone.toLowerCase().includes(s) ||
        (c.email ?? "").toLowerCase().includes(s) ||
        clientCaseNums(c.id).some((n) => n.includes(s)),
      );
    }
    r.sort((a, b) => {
      if (sort.k === "cases") return (caseCount(a.id) - caseCount(b.id)) * sort.dir;
      const va = String((a as unknown as Record<string, unknown>)[sort.k] ?? "");
      const vb = String((b as unknown as Record<string, unknown>)[sort.k] ?? "");
      return va.localeCompare(vb, "ar") * sort.dir;
    });
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, cases, q, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const onSort = (k: string) => setSort((s) => ({ k, dir: s.k === k ? ((s.dir * -1) as 1 | -1) : 1 }));
  const delClient = clients.find((c) => c.id === delId);

  return (
    <div>
      <PageHead title="الموكلين" desc="ملفات موكليك وبياناتهم وقضاياهم ومعاملاتهم المالية.">
        <Btn variant="gold" onClick={() => setModal({})}><Plus size={16} /> إضافة موكل جديد</Btn>
      </PageHead>

      <div className="card overflow-hidden">
        <header className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-ink-100">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="بحث عن موكل... (الاسم، الهاتف، أو رقم قضية)" />
          <span className="ms-auto text-[12px] text-ink-400 font-semibold">{rows.length} موكل</span>
        </header>

        {rows.length === 0 ? (
          clients.length === 0 ? (
            <Empty icon={<Users size={28} />} title="لا يوجد موكلون حتى الآن" desc="أضف أول موكل لتبدأ ببناء ملفات القضايا."
              action={<Btn variant="gold" onClick={() => setModal({})}><Plus size={16} /> إضافة أول موكل</Btn>} />
          ) : (
            <Empty icon={<Users size={28} />} title="لا نتائج مطابقة" desc="لم نجد موكلاً بهذا الاسم أو الهاتف أو رقم القضية." />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full tbl min-w-[860px]">
                <thead>
                  <tr>
                    <Th label="اسم الموكل" k="name" sort={sort} onSort={onSort} />
                    <Th label="رقم الهاتف" />
                    <Th label="البريد الإلكتروني" />
                    <Th label="عدد القضايا" k="cases" sort={sort} onSort={onSort} />
                    <Th label="تاريخ الإضافة" k="createdAt" sort={sort} onSort={onSort} />
                    <Th label="العنوان" />
                    <Th label="الإجراءات" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-lg bg-ink-900 text-gold-300 font-display font-black text-[13px] flex items-center justify-center shrink-0">
                            {c.name.replace("أ. ", "").slice(0, 1)}
                          </span>
                          <span className="font-bold text-ink-900">{c.name}</span>
                        </span>
                      </td>
                      <td className="text-ink-600" dir="ltr">{c.phone}</td>
                      <td className="text-ink-500" dir="ltr">{c.email || "—"}</td>
                      <td><Pill cls={caseCount(c.id) > 0 ? "bg-gold-100 text-gold-700" : "bg-ink-100 text-ink-400"}>{caseCount(c.id)} قضية</Pill></td>
                      <td className="text-ink-500">{fmtTs(c.createdAt)}</td>
                      <td className="text-ink-500 max-w-[180px] truncate">{c.address || "—"}</td>
                      <td>
                        <span className="flex items-center gap-0.5">
                          <IconBtn title="عرض التفاصيل" tone="gold" onClick={() => setDetailsId(c.id)}><Eye size={16} /></IconBtn>
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
        <ClientModal
          client={modal.edit}
          onSave={(d) => {
            if (modal.edit) updateClient(modal.edit.id, d);
            else addClient(d as Omit<Client, "id" | "lawyerId" | "createdAt" | "importantDates">);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {detailsId && (
        <ClientDetails
          clientId={detailsId}
          onClose={() => setDetailsId(null)}
          onOpenCase={(cid) => { setDetailsId(null); setCaseViewId(cid); }}
        />
      )}
      {caseViewId && <CaseDetails caseId={caseViewId} onClose={() => setCaseViewId(null)} />}

      {delId && delClient && (
        <Confirm
          title={`حذف الموكل «${delClient.name}»`}
          message={
            <span>
              سيتم حذف الموكل نهائياً
              {caseCount(delId) > 0 && (
                <> مع <b className="text-bad-500">{caseCount(delId)} قضية مرتبطة به</b> وجلساتها وملاحظاتهما ومعاملاتها المالية</>
              )}
              . هذا الإجراء لا يمكن التراجع عنه.
            </span>
          }
          onConfirm={() => deleteClient(delId)}
          onClose={() => setDelId(null)}
        />
      )}
    </div>
  );
}

/* ---------------- add / edit ---------------- */
function ClientModal({ client, onSave, onClose }: {
  client?: Client;
  onSave: (d: Partial<Client>) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState({
    name: client?.name ?? "",
    phone: client?.phone ?? "",
    email: client?.email ?? "",
    nationalId: client?.nationalId ?? "",
    address: client?.address ?? "",
    notes: client?.notes ?? "",
  });
  const [errs, setErrs] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 3) er.name = "أدخل اسم الموكل كاملاً";
    if (f.phone.trim().length < 9) er.phone = "أدخل رقم هاتف صحيح";
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) er.email = "بريد إلكتروني غير صحيح";
    if (Object.keys(er).length) { setErrs(er); return; }
    onSave({
      name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim(),
      nationalId: f.nationalId.trim() || undefined, address: f.address.trim() || undefined, notes: f.notes.trim() || undefined,
    });
  };

  return (
    <Modal title={client ? "تعديل بيانات الموكل" : "إضافة موكل جديد"} subtitle="بيانات الموكل تُستخدم في القضايا والمعاملات المالية" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="اسم الموكل" req error={errs.name}>
          <input className={`field-input ${errs.name ? "err" : ""}`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="الاسم الكامل أو اسم المنشأة" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="رقم الهاتف" req error={errs.phone}>
            <input className={`field-input ${errs.phone ? "err" : ""}`} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="05XXXXXXXX" dir="ltr" style={{ textAlign: "end" }} />
          </Field>
          <Field label="البريد الإلكتروني" error={errs.email}>
            <input className={`field-input ${errs.email ? "err" : ""}`} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="name@mail.com" dir="ltr" style={{ textAlign: "end" }} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="الرقم القومي / رقم الهوية" hint="(اختياري)">
            <input className="field-input" value={f.nationalId} onChange={(e) => setF({ ...f, nationalId: e.target.value })} dir="ltr" style={{ textAlign: "end" }} />
          </Field>
          <Field label="العنوان">
            <input className="field-input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="المدينة — الحي" />
          </Field>
        </div>
        <Field label="ملاحظات">
          <textarea className="field-input min-h-[70px]" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="أي معلومات إضافية عن الموكل (اختياري)" />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Btn variant="outline" onClick={onClose}>إلغاء</Btn>
          <Btn type="submit" variant="gold">{client ? "حفظ التعديلات" : "إضافة الموكل"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- details ---------------- */
function ClientDetails({ clientId, onClose, onOpenCase }: { clientId: ID; onClose: () => void; onOpenCase: (caseId: ID) => void }) {
  const clients = useStore((s) => s.clients);
  const cases = useStore((s) => s.cases.filter((c) => c.clientId === clientId));
  const txs = useStore((s) => s.txs.filter((t) => t.clientId === clientId));
  const addImportantDate = useStore((s) => s.addImportantDate);
  const removeImportantDate = useStore((s) => s.removeImportantDate);
  const client = clients.find((c) => c.id === clientId);
  const [idF, setIdF] = useState({ label: "", date: todayISO() });

  if (!client) return null;
  const fees = txs.filter((t) => t.type === "fees").reduce((a, b) => a + b.amount, 0);
  const exp = txs.filter((t) => t.type === "expenses").reduce((a, b) => a + b.amount, 0);

  return (
    <Modal wide title={`ملف الموكل: ${client.name}`} subtitle={`أُضيف في ${fmtTs(client.createdAt)}`} onClose={onClose}>
      <div className="grid lg:grid-cols-5 gap-5">
        {/* right column: personal */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4 space-y-2.5">
            <h5 className="font-display font-extrabold text-sm text-ink-900 mb-2">البيانات الشخصية</h5>
            <p className="flex items-center gap-2 text-[13px] text-ink-700"><Phone size={14} className="text-gold-600" /> <span dir="ltr">{client.phone}</span></p>
            <p className="flex items-center gap-2 text-[13px] text-ink-700"><Mail size={14} className="text-gold-600" /> <span dir="ltr">{client.email || "—"}</span></p>
            <p className="flex items-center gap-2 text-[13px] text-ink-700"><UserRound size={14} className="text-gold-600" /> هوية: <span dir="ltr">{client.nationalId || "—"}</span></p>
            <p className="flex items-center gap-2 text-[13px] text-ink-700"><MapPin size={14} className="text-gold-600" /> {client.address || "—"}</p>
            {client.notes && <p className="text-[12.5px] text-ink-500 border-t border-dashed border-ink-200 pt-2.5 leading-relaxed">{client.notes}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-ok-100/60 border border-ok-500/15 p-3 text-center">
              <p className="text-[11px] font-bold text-ok-500">إجمالي الأتعاب</p>
              <p className="font-display font-black text-ink-900 text-[15px] mt-0.5">{money(fees)}</p>
            </div>
            <div className="rounded-xl bg-bad-100/60 border border-bad-500/15 p-3 text-center">
              <p className="text-[11px] font-bold text-bad-500">إجمالي المصروفات</p>
              <p className="font-display font-black text-ink-900 text-[15px] mt-0.5">{money(exp)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-ink-100 p-4">
            <h5 className="font-display font-extrabold text-sm text-ink-900 mb-2.5">تواريخ مهمة</h5>
            {client.importantDates.length === 0 && <p className="text-[12px] text-ink-400 mb-2">لا توجد تواريخ مهمة.</p>}
            <ul className="space-y-1.5 mb-3">
              {client.importantDates.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg bg-gold-100/50 border border-gold-200 px-3 py-1.5">
                  <span className="text-[12.5px] font-semibold text-ink-800">{d.label} — {fmtDate(d.date)}</span>
                  <button onClick={() => removeImportantDate(clientId, d.id)} className="text-ink-300 hover:text-bad-500"><X size={13} /></button>
                </li>
              ))}
            </ul>
            <form
              className="flex gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (idF.label.trim().length < 2 || !idF.date) return;
                addImportantDate(clientId, idF.label.trim(), idF.date);
                setIdF({ label: "", date: todayISO() });
              }}
            >
              <input className="field-input py-1.5! text-[12.5px]" placeholder="الوصف" value={idF.label} onChange={(e) => setIdF({ ...idF, label: e.target.value })} />
              <input type="date" className="field-input py-1.5! w-36! text-[12.5px]" value={idF.date} onChange={(e) => setIdF({ ...idF, date: e.target.value })} />
              <Btn type="submit" size="sm" variant="outline" title="إضافة"><CalendarPlus size={15} /></Btn>
            </form>
          </div>
        </div>

        {/* left column: cases + txs */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border border-ink-100 overflow-hidden">
            <h5 className="font-display font-extrabold text-sm text-ink-900 px-4 py-2.5 border-b border-ink-100 bg-ink-50/50 flex items-center gap-2">
              <Briefcase size={15} className="text-gold-600" /> القضايا المرتبطة ({cases.length})
            </h5>
            {cases.length === 0 ? (
              <p className="text-[12.5px] text-ink-400 p-4">لا توجد قضايا لهذا الموكل بعد.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {cases.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-ink-50/60 transition-colors">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-ink-900">قضية <span dir="ltr" className="text-gold-700">{c.caseNumber}</span> — {c.caseType}</p>
                      <p className="text-[11.5px] text-ink-400 truncate">{c.court}{c.nextHearingDate ? ` • الجلسة: ${fmtDate(c.nextHearingDate)}` : ""}</p>
                    </div>
                    <span className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={c.status} />
                      <Btn size="sm" variant="ghost" onClick={() => onOpenCase(c.id)}>فتح</Btn>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-ink-100 overflow-hidden">
            <h5 className="font-display font-extrabold text-sm text-ink-900 px-4 py-2.5 border-b border-ink-100 bg-ink-50/50">المعاملات المالية ({txs.length})</h5>
            {txs.length === 0 ? (
              <p className="text-[12.5px] text-ink-400 p-4">لا توجد معاملات مالية مسجلة.</p>
            ) : (
              <ul className="divide-y divide-ink-100 max-h-56 overflow-y-auto">
                {txs.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <div>
                      <p className="text-[12.5px] font-semibold text-ink-800">{t.notes || (t.type === "fees" ? "أتعاب" : "مصروفات")}</p>
                      <p className="text-[11px] text-ink-400">{fmtDate(t.date)}</p>
                    </div>
                    <span className="flex items-center gap-2">
                      <Pill cls={TX_TYPE[t.type].cls}>{TX_TYPE[t.type].label}</Pill>
                      <span className={`font-bold text-[13px] ${t.type === "fees" ? "text-ok-500" : "text-bad-500"}`}>{money(t.amount)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-[11px] text-ink-300">آخر تحديث للملف: {fmtStamp(client.createdAt)}</p>
        </div>
      </div>
    </Modal>
  );
}
