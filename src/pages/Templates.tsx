import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye, FileText, FolderOpen, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { useStore } from "../store";
import type { ID, Template } from "../types";
import { extColor, fmtSize, fmtTs } from "../utils";
import { downloadDoc, PreviewModal } from "../components/CaseDetails";
import { Btn, Confirm, Empty, Field, IconBtn, Modal, PageHead } from "../components/ui";

export default function Templates() {
  const uid = useStore((s) => s.sessionUserId) ?? "";
  const nav = useStore((s) => s.nav);
  const consumeIntent = useStore((s) => s.consumeIntent);
  const rawTpls = useStore((s) => s.templates);
  const addTemplate = useStore((s) => s.addTemplate);
  const renameTemplate = useStore((s) => s.renameTemplate);
  const deleteTemplate = useStore((s) => s.deleteTemplate);
  const toast = useStore((s) => s.toast);

  const tpls = useMemo(() => rawTpls.filter((t) => t.lawyerId === uid), [rawTpls, uid]);

  const [q, setQ] = useState("");
  const [typeF, setTypeF] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [renaming, setRenaming] = useState<Template | null>(null);
  const [delId, setDelId] = useState<ID | null>(null);
  const [preview, setPreview] = useState<Template | null>(null);

  useEffect(() => {
    if (nav.page === "templates" && nav.intent === "add") {
      setAddOpen(true);
      consumeIntent();
    }
  }, [nav, consumeIntent]);

  const rows = useMemo(() => {
    let r = [...tpls].sort((a, b) => b.addedAt - a.addedAt);
    if (typeF !== "all") r = r.filter((t) => t.ext === typeF);
    if (q.trim()) r = r.filter((t) => t.name.toLowerCase().includes(q.trim().toLowerCase()));
    return r;
  }, [tpls, q, typeF]);

  return (
    <div>
      <PageHead title="النماذج" desc="مكتبة النماذج والمستندات القانونية الجاهزة للاستخدام في قضاياك.">
        <Btn variant="gold" onClick={() => setAddOpen(true)}><Plus size={16} /> إضافة نموذج</Btn>
      </PageHead>

      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <div className="relative grow max-w-sm">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث باسم النموذج..." className="field-input ps-9 py-2" />
        </div>
        {["all", "doc", "docx", "pdf"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeF(t)}
            className={`px-3.5 py-2 rounded-xl text-[12.5px] font-bold uppercase transition-all ${
              typeF === t ? "bg-ink-900 text-gold-300 shadow-sm" : "bg-white border border-ink-100 text-ink-500 hover:border-gold-300"
            }`}
          >
            {t === "all" ? "الكل" : t}
          </button>
        ))}
        <span className="ms-auto text-[12px] text-ink-400 font-semibold">{rows.length} نموذج</span>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <Empty
            icon={<FolderOpen size={28} />}
            title={tpls.length === 0 ? "لا توجد نماذج بعد" : "لا نتائج مطابقة"}
            desc={tpls.length === 0 ? "ارفع أول عقد أو توكيل أو مذكرة لاستخدامها لاحقاً في قضاياك." : "جرّب كلمة بحث مختلفة أو نوع ملفات آخر."}
            action={tpls.length === 0 ? <Btn variant="gold" onClick={() => setAddOpen(true)}><Plus size={16} /> إضافة أول نموذج</Btn> : undefined}
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
          {rows.map((t) => (
            <div key={t.id} className="card p-4 flex flex-col hover:-translate-y-1 hover:shadow-lift transition-all duration-200 group">
              <div className="flex items-start justify-between">
                <span className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-[11px] uppercase ${extColor(t.ext)} group-hover:scale-105 transition-transform`}>
                  {t.ext}
                </span>
                <span className="text-[10.5px] text-ink-300 font-semibold">{fmtTs(t.addedAt)}</span>
              </div>
              <h4 className="font-display font-extrabold text-ink-900 mt-3 leading-snug">{t.name}</h4>
              <p className="text-[11.5px] text-ink-400 mt-1 mb-3 flex items-center gap-1.5">
                <FileText size={12} /> {fmtSize(t.size)} — {t.kind === "builtin" ? "نموذج جاهز" : "ملف مرفوع"}
              </p>
              <div className="mt-auto flex items-center gap-1 border-t border-ink-100 pt-3">
                <Btn size="sm" variant="outline" className="grow" onClick={() => setPreview(t)}><Eye size={14} /> معاينة</Btn>
                <IconBtn title="تنزيل" tone="gold" onClick={() => downloadDoc(t.name, t.ext, t.dataUrl, t.content)}><Download size={16} /></IconBtn>
                <IconBtn title="إعادة تسمية" onClick={() => setRenaming(t)}><Pencil size={15} /></IconBtn>
                <IconBtn danger title="حذف" onClick={() => setDelId(t.id)}><Trash2 size={15} /></IconBtn>
              </div>
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <AddTemplate
          onAdd={(d) => { addTemplate(d); setAddOpen(false); }}
          onClose={() => setAddOpen(false)}
          warn={(m) => toast("warning", m)}
        />
      )}
      {renaming && (
        <RenameModal
          initial={renaming.name}
          onSave={(name) => { renameTemplate(renaming.id, name); setRenaming(null); }}
          onClose={() => setRenaming(null)}
        />
      )}
      {preview && <PreviewModal name={preview.name} ext={preview.ext} dataUrl={preview.dataUrl} content={preview.content} onClose={() => setPreview(null)} />}
      {delId && (
        <Confirm
          title="حذف النموذج"
          message="سيتم حذف هذا النموذج من المكتبة نهائياً. النسخ المرفقة بالقضايا ستبقى كما هي."
          onConfirm={() => deleteTemplate(delId)}
          onClose={() => setDelId(null)}
        />
      )}
    </div>
  );
}

function AddTemplate({ onAdd, onClose, warn }: {
  onAdd: (d: Omit<Template, "id" | "lawyerId" | "addedAt">) => void;
  onClose: () => void;
  warn: (m: string) => void;
}) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const [reading, setReading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { setErr("أدخل اسم النموذج"); return; }
    if (!file) { setErr("اختر ملفاً (PDF / DOC / DOCX)"); return; }
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext)) { setErr("يُسمح فقط بملفات PDF و DOC و DOCX"); return; }
    setReading(true);
    const finish = (dataUrl?: string) => {
      if (file.size > 1.5 * 1024 * 1024) {
        warn("الملف أكبر من 1.5MB — سيُحفظ دون محتوى، لذا المعاينة والتنزيل غير متاحين له.");
      }
      onAdd({ name: name.trim(), ext, size: file.size, kind: "file", dataUrl });
    };
    if (file.size > 1.5 * 1024 * 1024) {
      finish();
      return;
    }
    const r = new FileReader();
    r.onload = () => finish(String(r.result));
    r.onerror = () => { setReading(false); setErr("تعذر قراءة الملف"); };
    r.readAsDataURL(file);
  };

  return (
    <Modal title="إضافة نموذج جديد" subtitle="ارفع مستنداً قانونياً جاهزاً لإعادة استخدامه" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="اسم النموذج" req error={err && !file ? err : ""}>
          <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: عقد عمل موحد" />
        </Field>
        <Field label="الملف" req error={err && file === null ? err : err && file ? err : ""}>
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl p-6 text-center transition-all hover:border-gold-400 hover:bg-gold-100/30 ${file ? "border-ok-500/50 bg-ok-100/40" : "border-ink-200 bg-ink-50/50"}`}
          >
            <Upload size={22} className="mx-auto text-ink-400 mb-2" />
            {file ? (
              <>
                <p className="text-[13.5px] font-bold text-ok-500">{file.name}</p>
                <p className="text-[11.5px] text-ink-400 mt-0.5">{fmtSize(file.size)} — اضغط لتغيير الملف</p>
              </>
            ) : (
              <>
                <p className="text-[13.5px] font-bold text-ink-700">اضغط لاختيار ملف</p>
                <p className="text-[11.5px] text-ink-400 mt-0.5">PDF أو DOC أو DOCX — بحد أقصى 1.5MB للمعاينة</p>
              </>
            )}
          </button>
          <input ref={ref} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setErr(""); }} />
        </Field>
        <div className="flex justify-end gap-2">
          <Btn variant="outline" onClick={onClose}>إلغاء</Btn>
          <Btn type="submit" variant="gold" disabled={reading}>{reading ? "جارٍ الرفع..." : "رفع النموذج"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function RenameModal({ initial, onSave, onClose }: { initial: string; onSave: (v: string) => void; onClose: () => void }) {
  const [v, setV] = useState(initial);
  const [err, setErr] = useState("");
  return (
    <Modal title="إعادة تسمية النموذج" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (v.trim().length < 2) { setErr("أدخل اسماً صحيحاً"); return; }
          onSave(v.trim());
        }}
        className="space-y-4"
      >
        <Field label="الاسم الجديد" req error={err}>
          <input className="field-input" value={v} onChange={(e) => setV(e.target.value)} autoFocus />
        </Field>
        <div className="flex justify-end gap-2">
          <Btn variant="outline" onClick={onClose}>إلغاء</Btn>
          <Btn type="submit" variant="gold">حفظ</Btn>
        </div>
      </form>
    </Modal>
  );
}
