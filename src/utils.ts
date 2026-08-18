export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

const pad = (n: number) => String(n).padStart(2, "0");

export const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = () => toISO(new Date());

export const addDaysISO = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return toISO(dt);
};

export const relDays = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const [ty, tm, td] = todayISO().split("-").map(Number);
  const today = new Date(ty, tm - 1, td).getTime();
  return Math.round((target - today) / 86400000);
};

export const isToday = (iso: string) => relDays(iso) === 0;
export const isPast = (iso: string) => relDays(iso) < 0;

const dtFmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("ar-EG-u-nu-latn-ca-gregory", opts);

export const fmtDate = (iso: string) =>
  iso ? dtFmt({ day: "numeric", month: "long", year: "numeric" }).format(new Date(iso + "T12:00:00")) : "—";

export const fmtDateShort = (iso: string) =>
  iso ? dtFmt({ day: "numeric", month: "short" }).format(new Date(iso + "T12:00:00")) : "—";

export const fmtWeekday = (iso: string) =>
  dtFmt({ weekday: "long" }).format(new Date(iso + "T12:00:00"));

export const fmtFullToday = () =>
  dtFmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

export const fmtTime = (t?: string) => {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit" }).format(d);
};

export const fmtStamp = (ts: number) => {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return diff < 0 ? "قريباً" : "الآن";
  if (min < 60) return `قبل ${min} دقيقة`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `قبل ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "أمس";
  if (days < 30) return `قبل ${days} يوم`;
  return fmtDate(toISO(new Date(ts)));
};

export const fmtTs = (ts: number) =>
  dtFmt({ day: "numeric", month: "short", year: "numeric" }).format(new Date(ts));

export const money = (n: number) =>
  `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} ر.س`;

export const fmtSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
};

export const dayLabel = (iso: string) => {
  const r = relDays(iso);
  if (r === 0) return "اليوم";
  if (r === 1) return "غداً";
  if (r === -1) return "أمس";
  return fmtWeekday(iso);
};

export const docHtml = (title: string, body: string) => `<!DOCTYPE html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:'IBM Plex Sans Arabic',Tahoma,sans-serif;direction:rtl;padding:48px;line-height:2;color:#1a2433}
h1{text-align:center;border-bottom:3px double #a97e27;padding-bottom:12px;color:#0e2440}
h2{color:#224063;margin-top:28px}p{margin:10px 0;text-align:justify}
.sig{display:flex;justify-content:space-between;margin-top:80px}
.box{border:1px solid #c9d3e2;padding:16px 20px;background:#f7f9fc;border-radius:6px}</style></head>
<body><h1>${title}</h1>${body}
<div class="sig"><div>توقيع الطرف الأول<br/><br/>____________________</div>
<div>توقيع الطرف الثاني<br/><br/>____________________</div>
<div>توقيع المحامي<br/><br/>____________________</div></div></body></html>`;

export const extColor = (ext: string) =>
  ext === "pdf"
    ? "bg-bad-100 text-bad-500"
    : ext === "docx"
      ? "bg-ink-100 text-ink-600"
      : "bg-gold-100 text-gold-700";
