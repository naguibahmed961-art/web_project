import { useEffect, useMemo, useState } from "react";
import { Coins, Pencil, Plus, TrendingDown, TrendingUp, Trash2, Wallet } from "lucide-react";
import { TX_TYPE, useStore } from "../store";
import type { ID, Tx, TxType } from "../types";
import { fmtDate, money, todayISO } from "../utils";
import { Btn, Confirm, Empty, Field, IconBtn, Modal, PageHead, Pagination, Pill, SearchBox, Th } from "../components/ui";

const PAGE_SIZE = 7;

export default function Accounts() {
  const uid = useStore((s) => s.sessionUserId) ?? "";
  const nav = useStore((s) => s.nav);
  const consumeIntent = useStore((s) => s.consumeIntent);
  const rawTxs = useStore((s) => s.txs);
  const rawClients = useStore((s) => s.clients);
  const rawCases = useStore((s) => s.cases);
  const addTx = useStore((s) => s.addTx);
  const updateTx = useStore((s) => s.updateTx);
  const deleteTx = useStore((s) => s.deleteTx);

  const txs = useMemo(() => rawTxs.filter((t) => t.lawyerId === uid), [rawTxs, uid]);
  const clients = useMemo(() => rawClients.filter((c) => c.lawyerId === uid), [rawClients, uid]);
  const cases = useMemo(() => rawCases.filter((c) => c.lawyerId === uid), [rawCases, uid]);

  const [q, setQ] = useState("");
  const [typeF, setTypeF] = useState("all");
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 }>({ k: "date", dir: -1 });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | { edit?: Tx }>(null);
  const [delId, setDelId] = useState<ID | null>(null);

  useEffect(() => {
    if (nav.page === "accounts" && nav.intent === "add") {
      setModal({});
      consumeIntent();
    }
  }, [nav, consumeIntent]);

  const clientName = (id: ID) => clients.find((c) => c.id === id)?.name ?? "—";
  const caseNum = (id?: ID) => cases.find((c) => c.id === id)?.caseNumber;

  const totals = {
    fees: txs.filter((t) => t.type === "fees").reduce((a, b) => a + b.amount, 0),
    exp: txs.filter((t) => t.type === "expenses").reduce((a, b) => a + b.amount, 0),
  };

  const rows = useMemo(() => {
    let r = [...txs];
    if (typeF !== "all") r = r.filter((t) => t.type === typeF);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      r = r.filter((t) =>
        clientName(t.clientId).toLowerCase().includes(s) ||
        (caseNum(t.caseId) ?? "").toLowerCase().includes(s) ||
        (t.notes ?? "").toLowerCase().includes(s),
      );
    }
    r.sort((a, b) => {
      if (sort.k === "client") return clientName(a.clientId).localeCompare(clientName(b.clientId), "ar") * sort.dir;
      if (sort.k === "amount") return (a.amount - b.amount) * sort.dir;
      const va = String((a as unknown as Record<string, unknown>)[sort.k] ?? "");
      const vb = String((b as unknown as Record<string, unknown>)[sort.k] ?? "");
      return va.localeCompare(vb) * sort.dir;
    });
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txs, clients, cases, q, typeF, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const onSort = (k: string) => setSort((s) => ({ k, dir: s.k === k ? ((s.dir * -1) as 1 | -1) : 1 }));

  /* ---- automatic summary ---- */
  const summary = useMemo(() => {
    const map = new Map<string, { clientId: ID; caseId?: ID; fees: number; exp: number }>();
    txs.forEach((t) => {
      const key = `${t.clientId}|${t.caseId ?? ""}`;
      const cur = map.get(key) ?? { clientId: t.clientId, caseId: t.caseId, fees: 0, exp: 0 };
      if (t.type === "fees") cur.fees += t.amount;
      else cur.exp += t.amount;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.fees - b.exp - (a.fees - a.exp));
  }, [txs]);

  const kpis = [
    { label: "إجمالي الأتعاب", value: totals.fees, icon: <TrendingUp size={20} />, cls: "bg-ok-500 text-white" },
    { label: "إجمالي المصروفات", value: totals.exp, icon: <TrendingDown size={20} />, cls: "bg-bad-500 text-white" },
    { label: "صافي الإيرادات", value: totals.fees - totals.exp, icon: <Wallet size={20} />, cls: "bg-gold-500 text-ink-950" },
  ];

  return (
    <div>
      <PageHead title="الحسابات" desc="الأتعاب والمصروفات وملخص مالي يُحسب تلقائياً لكل قضية.">
        <Btn variant="gold" onClick={() => setModal({})}><Plus size={16} /> إضافة عملية مالية</Btn>
      </PageHead>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5 stagger">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4 flex items-center gap-3.5 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200">
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${k.cls}`}>{k.icon}</span>
            <div>
              <p key={k.value} className="font-display font-black text-xl text-ink-900 anim-tick">{money(k.value)}</p>
              <p className="text-[12px] font-bold text-ink-500">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ---- transactions ---- */}
      <div className="card overflow-hidden mb-6">
        <header className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-ink-100">
          <h3 className="font-display font-extrabold text-ink-900 grow">العمليات المالية</h3>
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="بحث بالموكل أو رقم القضية..." />
          <select value={typeF} onChange={(e) => { setTypeF(e.target.value); setPage(1); }} className="field-input w-36! py-2! text-[13px]">
            <option value="all">الكل</option>
            <option value="fees">أتعاب</option>
            <option value="expenses">مصروفات</option>
          </select>
        </header>

        {rows.length === 0 ? (
          txs.length === 0 ? (
            <Empty icon={<Coins size={28} />} title="لا توجد عمليات مالية بعد" desc="سجّل أول أتعاب أو مصروفات وسيتحدث الملخص تلقائياً."
              action={<Btn variant="gold" onClick={() => setModal({})}><Plus size={16} /> إضافة أول عملية</Btn>} />
          ) : (
            <Empty icon={<Coins size={28} />} title="لا نتائج مطابقة" desc="جرّب تعديل البحث أو الفلاتر." />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full tbl min-w-[820px]">
                <thead>
                  <tr>
                    <Th label="اسم الموكل" k="client" sort={sort} onSort={onSort} />
                    <Th label="رقم القضية" />
                    <Th label="المبلغ" k="amount" sort={sort} onSort={onSort} />
                    <Th label="النوع" k="type" sort={sort} onSort={onSort} />
                    <Th label="التاريخ" k="date" sort={sort} onSort={onSort} />
                    <Th label="الملاحظات" />
                    <Th label="الإجراءات" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((t) => (
                    <tr key={t.id}>
                      <td className="font-semibold text-ink-900">{clientName(t.clientId)}</td>
                      <td className="font-semibold text-gold-700" dir="ltr">{caseNum(t.caseId) ?? "—"}</td>
                      <td className={`font-black ${t.type === "fees" ? "text-ok-500" : "text-bad-500"}`}>{money(t.amount)}</td>
                      <td><Pill cls={TX_TYPE[t.type].cls}>{TX_TYPE[t.type].label}</Pill></td>
                      <td className="text-ink-500">{fmtDate(t.date)}</td>
                      <td className="text-ink-500 max-w-[180px] truncate">{t.notes || "—"}</td>
                      <td>
                        <span className="flex items-center gap-0.5">
                          <IconBtn title="تعديل" tone="gold" onClick={() => setModal({ edit: t })}><Pencil size={15} /></IconBtn>
                          <IconBtn danger title="حذف" onClick={() => setDelId(t.id)}><Trash2 size={15} /></IconBtn>
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

      {/* ---- automatic summary ---- */}
      <div className="card overflow-hidden">
        <header className="px-5 py-4 border-b border-ink-100 bg-gradient-to-l from-ok-100/50 to-transparent">
          <h3 className="font-display font-extrabold text-ink-900">ملخص الحسابات <span className="text-ok-500">(يُحسب تلقائياً)</span></h3>
          <p className="text-[12px] text-ink-400 mt-0.5">صافي الحساب = إجمالي الأتعاب − إجمالي المصروفات</p>
        </header>
        {summary.length === 0 ? (
          <p className="text-center text-[13px] text-ink-400 py-10">سيظهر الملخص فور تسجيل أول عملية مالية.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full tbl min-w-[700px]">
              <thead>
                <tr>
                  <th>اسم الموكل</th>
                  <th>رقم القضية</th>
                  <th>إجمالي الأتعاب المستلمة</th>
                  <th>إجمالي المصروفات</th>
                  <th>صافي الحساب</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((r) => {
                  const net = r.fees - r.exp;
                  return (
                    <tr key={`${r.clientId}|${r.caseId ?? ""}`}>
                      <td className="font-bold text-ink-900">{clientName(r.clientId)}</td>
                      <td className="font-semibold text-gold-700" dir="ltr">{caseNum(r.caseId) ?? "بدون قضية"}</td>
                      <td className="font-bold text-ok-500">{money(r.fees)}</td>
                      <td className="font-bold text-bad-500">{r.exp ? money(r.exp) : "—"}</td>
                      <td>
                        <Pill cls={net >= 0 ? "bg-ok-100 text-ok-500" : "bg-bad-100 text-bad-500"}>
                          {net >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {money(net)}
                        </Pill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <TxModal
          tx={modal.edit}
          clients={clients}
          cases={cases}
          onSave={(d) => {
            if (modal.edit) updateTx(modal.edit.id, d);
            else addTx(d as Omit<Tx, "id" | "lawyerId" | "createdAt">);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {delId && (
        <Confirm title="حذف العملية المالية" message="سيتم حذف العملية وسيتحدث الملخص المالي والإحصاءات تلقائياً." onConfirm={() => deleteTx(delId)} onClose={() => setDelId(null)} />
      )}
    </div>
  );
}

function TxModal({ tx, clients, cases, onSave, onClose }: {
  tx?: Tx;
  clients: { id: ID; name: string }[];
  cases: { id: ID; clientId: ID; caseNumber: string }[];
  onSave: (d: Partial<Tx>) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState({
    clientId: tx?.clientId ?? "",
    caseId: tx?.caseId ?? "",
    amount: tx ? String(tx.amount) : "",
    type: tx?.type ?? ("fees" as TxType),
    date: tx?.date ?? todayISO(),
    notes: tx?.notes ?? "",
  });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const clientCases = cases.filter((c) => c.clientId === f.clientId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.clientId) er.clientId = "اختر الموكل";
    const amount = Number(f.amount);
    if (!f.amount || isNaN(amount) || amount <= 0) er.amount = "أدخل مبلغاً صحيحاً أكبر من صفر";
    if (!f.date) er.date = "حدد التاريخ";
    if (Object.keys(er).length) { setErrs(er); return; }
    onSave({ clientId: f.clientId, caseId: f.caseId || undefined, amount, type: f.type, date: f.date, notes: f.notes.trim() || undefined });
  };

  return (
    <Modal title={tx ? "تعديل العملية المالية" : "إضافة عملية مالية"} subtitle="تُحتسب تلقائياً في ملخص الحسابات ولوحة التحكم" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="اسم الموكل" req error={errs.clientId}>
            <select className={`field-input ${errs.clientId ? "err" : ""}`} value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value, caseId: "" })}>
              <option value="">— اختر الموكل —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="رقم القضية" hint="(اختياري)">
            <select className="field-input" value={f.caseId} onChange={(e) => setF({ ...f, caseId: e.target.value })} disabled={!f.clientId}>
              <option value="">بدون قضية</option>
              {clientCases.map((c) => <option key={c.id} value={c.id}>{c.caseNumber}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          <Field label="المبلغ (ر.س)" req error={errs.amount}>
            <input type="number" min="1" step="any" className={`field-input ${errs.amount ? "err" : ""}`} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="0" />
          </Field>
          <Field label="النوع" req>
            <select className="field-input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as TxType })}>
              <option value="fees">أتعاب</option>
              <option value="expenses">مصروفات</option>
            </select>
          </Field>
          <Field label="التاريخ" req error={errs.date}>
            <input type="date" className={`field-input ${errs.date ? "err" : ""}`} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </Field>
        </div>
        <Field label="الوصف / الملاحظات">
          <input className="field-input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="مثال: دفعة أولى من الأتعاب" />
        </Field>
        {clients.length === 0 && (
          <p className="text-[12px] font-semibold text-warn-500 bg-warn-100 rounded-lg px-3 py-2">لا يوجد موكلون بعد — أضف موكلاً أولاً من صفحة «الموكلين».</p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Btn variant="outline" onClick={onClose}>إلغاء</Btn>
          <Btn type="submit" variant="success">{tx ? "حفظ التعديلات" : "تسجيل العملية"}</Btn>
        </div>
      </form>
    </Modal>
  );
}
