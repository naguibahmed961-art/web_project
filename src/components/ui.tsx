import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Info, Search, X, XCircle } from "lucide-react";
import { useStore } from "../store";
import type { CaseStatus, Priority } from "../types";
import { CASE_STATUS, PRIORITY } from "../store";

/* ---------- button ---------- */
export function Btn({
  children, onClick, variant = "primary", size = "md", type = "button", disabled, className = "", title,
}: {
  children: ReactNode; onClick?: () => void; type?: "button" | "submit";
  variant?: "primary" | "gold" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg"; disabled?: boolean; className?: string; title?: string;
}) {
  const v: Record<string, string> = {
    primary: "bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950 shadow-sm",
    gold: "bg-gold-500 text-ink-950 hover:bg-gold-400 active:bg-gold-600 font-semibold shadow-sm",
    outline: "border-[1.5px] border-ink-200 text-ink-800 bg-white hover:border-gold-400 hover:bg-gold-100/40",
    ghost: "text-ink-700 hover:bg-ink-100/70",
    danger: "bg-bad-500 text-white hover:bg-[#9c2f27] shadow-sm",
    success: "bg-ok-500 text-white hover:bg-[#176a41] shadow-sm",
  };
  const s: Record<string, string> = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5 rounded-lg",
    md: "text-sm px-4 py-2 gap-2 rounded-[10px]",
    lg: "text-sm px-5 py-2.5 gap-2 rounded-xl",
  };
  return (
    <button
      type={type} onClick={onClick} disabled={disabled} title={title}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 select-none
        disabled:opacity-45 disabled:cursor-not-allowed active:scale-[0.98] ${v[variant]} ${s[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function IconBtn({ children, onClick, tone = "ink", title, danger }: {
  children: ReactNode; onClick?: (e: React.MouseEvent) => void; tone?: "ink" | "gold"; title?: string; danger?: boolean;
}) {
  return (
    <button
      type="button" title={title}
      onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
      className={`p-1.5 rounded-lg transition-all duration-150 active:scale-90 ${
        danger
          ? "text-ink-400 hover:text-bad-500 hover:bg-bad-100"
          : tone === "gold"
            ? "text-ink-400 hover:text-gold-700 hover:bg-gold-100"
            : "text-ink-400 hover:text-ink-800 hover:bg-ink-100"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- badges ---------- */
export function Pill({ cls, children }: { cls: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold whitespace-nowrap ${cls}`}>
      {children}
    </span>
  );
}
export function StatusBadge({ status }: { status: CaseStatus }) {
  const s = CASE_STATUS[status];
  return <Pill cls={s.cls}><span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}</Pill>;
}
export function PriorityBadge({ p }: { p: Priority }) {
  const s = PRIORITY[p];
  return <Pill cls={s.cls}>{s.label}</Pill>;
}

/* ---------- form field ---------- */
export function Field({ label, error, req, children, hint }: {
  label: string; error?: string; req?: boolean; hint?: string; children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-[13px] font-semibold text-ink-800 mb-1.5">
        {label} {req && <span className="text-bad-500">*</span>}
        {hint && <span className="text-[11px] font-normal text-ink-400 mr-1">{hint}</span>}
      </span>
      {children}
      {error && <span className="block mt-1 text-[11.5px] text-bad-500 font-medium anim-fade-in">{error}</span>}
    </label>
  );
}

/* ---------- modal ---------- */
export function Modal({ title, subtitle, onClose, children, wide, footer }: {
  title: ReactNode; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-[3px] anim-fade-in" onClick={onClose} />
      <div className={`relative w-full ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"} bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl anim-pop max-h-[92vh] flex flex-col`}>
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-3 border-b border-ink-100">
          <div>
            <h3 className="font-display font-extrabold text-lg text-ink-900 leading-snug">{title}</h3>
            {subtitle && <p className="text-xs text-ink-400 mt-0.5">{subtitle}</p>}
          </div>
          <IconBtn onClick={onClose} title="إغلاق"><X size={18} /></IconBtn>
        </div>
        <div className="px-5 sm:px-6 py-4 overflow-y-auto grow">{children}</div>
        {footer && <div className="px-5 sm:px-6 py-4 border-t border-ink-100 bg-ink-50/50 sm:rounded-b-2xl flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ---------- confirm dialog ---------- */
export function Confirm({ title, message, confirmLabel = "تأكيد الحذف", onConfirm, onClose }: {
  title: string; message: ReactNode; confirmLabel?: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex gap-3 items-start">
        <span className="shrink-0 w-11 h-11 rounded-xl bg-bad-100 text-bad-500 flex items-center justify-center">
          <AlertTriangle size={22} />
        </span>
        <div className="text-sm text-ink-700 leading-relaxed">{message}</div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Btn variant="outline" onClick={onClose}>إلغاء</Btn>
        <Btn variant="danger" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Btn>
      </div>
    </Modal>
  );
}

/* ---------- empty state ---------- */
export function Empty({ icon, title, desc, action }: {
  icon: ReactNode; title: string; desc?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 anim-fade-up">
      <div className="w-16 h-16 rounded-2xl bg-ink-100/70 text-ink-400 flex items-center justify-center mb-4 rotate-3">
        {icon}
      </div>
      <h4 className="font-display font-bold text-ink-900">{title}</h4>
      {desc && <p className="text-[13px] text-ink-400 mt-1 max-w-xs leading-relaxed">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------- pagination ---------- */
export function Pagination({ page, pages, onPage, total, shown }: {
  page: number; pages: number; onPage: (p: number) => void; total: number; shown: number;
}) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-ink-100 flex-wrap">
      <span className="text-xs text-ink-400">
        عرض <b className="text-ink-700">{shown}</b> من <b className="text-ink-700">{total}</b>
      </span>
      <div className="flex items-center gap-1">
        <IconBtn onClick={() => onPage(Math.max(1, page - 1))} title="السابق"><ChevronRight size={16} /></IconBtn>
        {Array.from({ length: pages }, (_, i) => i + 1).slice(0, 7).map((p) => (
          <button
            key={p} onClick={() => onPage(p)}
            className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all ${
              p === page ? "bg-ink-900 text-white shadow-sm" : "text-ink-600 hover:bg-ink-100"
            }`}
          >
            {p}
          </button>
        ))}
        <IconBtn onClick={() => onPage(Math.min(pages, page + 1))} title="التالي"><ChevronLeft size={16} /></IconBtn>
      </div>
    </div>
  );
}

/* ---------- search ---------- */
export function SearchBox({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="relative grow max-w-sm">
      <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-300" />
      <input
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="field-input ps-9 py-2"
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-700">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/* ---------- sortable header cell ---------- */
export function Th({ label, k, sort, onSort, className = "" }: {
  label: string; k?: string; sort?: { k: string; dir: 1 | -1 }; onSort?: (k: string) => void; className?: string;
}) {
  const active = k && sort?.k === k;
  return (
    <th className={className}>
      {k && onSort ? (
        <button onClick={() => onSort(k)} className="inline-flex items-center gap-1 hover:text-ink-900 transition-colors">
          {label}
          <span className={`text-[9px] leading-none transition-all ${active ? "text-gold-600 opacity-100" : "opacity-25"}`}>
            {active && sort?.dir === -1 ? "▼" : "▲"}
          </span>
        </button>
      ) : label}
    </th>
  );
}

/* ---------- page header ---------- */
export function PageHead({ title, desc, children }: { title: string; desc?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="font-display font-black text-[22px] sm:text-2xl text-ink-900">{title}</h1>
        {desc && <p className="text-[13px] text-ink-400 mt-1">{desc}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

/* ---------- toasts ---------- */
export function ToastHost() {
  const toasts = useStore((s) => s.toasts);
  const drop = useStore((s) => s.dropToast);
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => drop(toasts[0].id), 3400);
    return () => clearTimeout(t);
  }, [toasts, drop]);

  return createPortal(
    <div className="fixed bottom-4 start-4 z-[90] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((t) => {
        const cfg = {
          success: { icon: <CheckCircle2 size={18} />, cls: "border-ok-500/30 text-ok-500", bar: "bg-ok-500" },
          error: { icon: <XCircle size={18} />, cls: "border-bad-500/30 text-bad-500", bar: "bg-bad-500" },
          warning: { icon: <AlertTriangle size={18} />, cls: "border-warn-500/40 text-warn-500", bar: "bg-warn-500" },
          info: { icon: <Info size={18} />, cls: "border-ink-300 text-ink-500", bar: "bg-ink-500" },
        }[t.type];
        return (
          <div key={t.id} className={`relative overflow-hidden bg-white border ${cfg.cls} rounded-xl shadow-lift px-4 py-3 flex items-center gap-3 anim-slide`}>
            {cfg.icon}
            <p className="text-[13px] font-semibold text-ink-800 leading-snug grow">{t.msg}</p>
            <button onClick={() => drop(t.id)} className="text-ink-300 hover:text-ink-700"><X size={15} /></button>
            <span className={`absolute bottom-0 start-0 h-[3px] ${cfg.bar} toast-bar`} />
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
