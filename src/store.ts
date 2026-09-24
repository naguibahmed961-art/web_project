import { create } from "zustand";
import { supabase } from './lib/supabase';
import { persist } from "zustand/middleware";
import type {
  Activity, ActivityKind, Case, CaseFile, CaseNote, CaseStatus, Client,
  Hearing, ID, Intent, Lawyer, Page, Priority, Task, Template, Toast, Tx, TxType,
} from "./types";
import { addDaysISO, docHtml, isPast, todayISO, uid } from "./utils";

/* ---------------- demo seed ---------------- */
const DEMO_ID = "lawyer-demo";

const buildSeed = () => {
  const T = todayISO();
  const D = (n: number) => addDaysISO(T, n);
  const now = Date.now();
  const h = 3600_000;

  const clients: Client[] = [
    { id: "cl1", lawyerId: DEMO_ID, name: "شركة الأفق للمقاولات", phone: "0551112233", email: "info@ofoq.sa", nationalId: "7001234567", address: "الرياض — حي العليا، طريق الملك فهد", notes: "عميل دائم منذ 2022، يفضل التواصل عبر البريد الرسمي.", importantDates: [{ id: "id1", label: "تجديد السجل التجاري", date: D(21) }], createdAt: now - 90 * 24 * h },
    { id: "cl2", lawyerId: DEMO_ID, name: "أحمد بن سعد الشمري", phone: "0509876543", email: "ahmed.shammari@mail.com", nationalId: "1045678901", address: "جدة — حي الروضة", notes: "", importantDates: [], createdAt: now - 60 * 24 * h },
    { id: "cl3", lawyerId: DEMO_ID, name: "سارة محمد العتيبي", phone: "0561234567", email: "sara.otaibi@mail.com", nationalId: "1087654321", address: "الرياض — حي النرجس", notes: "تفضل الجلسات الصباحية.", importantDates: [{ id: "id2", label: "انتهاء عقد الإيجار الحالي", date: D(45) }], createdAt: now - 41 * 24 * h },
    { id: "cl4", lawyerId: DEMO_ID, name: "خالد عبدالله القحطاني", phone: "0533334444", email: "k.qahtani@mail.com", nationalId: "1023456789", address: "الدمام — حي الشاطئ", notes: "", importantDates: [], createdAt: now - 25 * 24 * h },
    { id: "cl5", lawyerId: DEMO_ID, name: "نورة فهد السبيعي", phone: "0577778888", email: "noura.s@mail.com", nationalId: "1098765432", address: "بريدة — حي الصفراء", notes: "", importantDates: [], createdAt: now - 15 * 24 * h },
    { id: "cl6", lawyerId: DEMO_ID, name: "مؤسسة النخبة التجارية", phone: "0114567890", email: "contact@nokhba.sa", nationalId: "7009876543", address: "الرياض — حي الملقا", notes: "تم إغلاق قضيتهم بنجاح.", importantDates: [], createdAt: now - 120 * 24 * h },
  ];

  const cases: Case[] = [
    { id: "ca1", lawyerId: DEMO_ID, caseNumber: "1042/2025", clientId: "cl1", court: "المحكمة التجارية بالرياض", caseType: "تجارية", filedDate: D(-45), nextHearingDate: D(0), nextHearingTime: "10:30", status: "open", description: "نزاع تجاري حول توريد مواد بناء وعدم الالتزام ببنود العقد المبرم بين الطرفين.", notes: "", createdAt: now - 45 * 24 * h },
    { id: "ca2", lawyerId: DEMO_ID, caseNumber: "87/2025", clientId: "cl2", court: "المحكمة العامة بجدة", caseType: "عقارية", filedDate: D(-38), nextHearingDate: D(0), nextHearingTime: "12:15", status: "open", description: "دعوى إثبات ملكية عقار والمطالبة بإفراغ صك الملكية.", notes: "", createdAt: now - 38 * 24 * h },
    { id: "ca3", lawyerId: DEMO_ID, caseNumber: "310/2025", clientId: "cl3", court: "محكمة الأحوال الشخصية", caseType: "أحوال شخصية", filedDate: D(-30), nextHearingDate: D(1), nextHearingTime: "09:30", status: "postponed", description: "دعوى حضانة ونفقة مع طلب زيارة دورية.", notes: "تم التأجيل بناءً على طلب الطرفين لمحاولة الصلح.", createdAt: now - 30 * 24 * h },
    { id: "ca4", lawyerId: DEMO_ID, caseNumber: "522/2025", clientId: "cl4", court: "المحكمة الجزائية المتخصصة", caseType: "جنائية", filedDate: D(-22), nextHearingDate: D(3), nextHearingTime: "11:00", status: "open", description: "قضية جزائية — الدفاع عن الموكل في تهمة الاحتيال المالي مع إنكار كامل للتهمة.", notes: "", createdAt: now - 22 * 24 * h },
    { id: "ca5", lawyerId: DEMO_ID, caseNumber: "764/2024", clientId: "cl5", court: "المحكمة العمالية بالرياض", caseType: "عمالية", filedDate: D(-70), nextHearingDate: D(5), nextHearingTime: "13:30", status: "postponed", description: "مطالبة بمستحقات نهاية الخدمة وبدل ساعات إضافية.", notes: "", createdAt: now - 70 * 24 * h },
    { id: "ca6", lawyerId: DEMO_ID, caseNumber: "918/2024", clientId: "cl6", court: "محكمة الاستئناف بالرياض", caseType: "تجارية", filedDate: D(-140), nextHearingDate: "", nextHearingTime: "", status: "closed", description: "استئناف حكم تجاري — صدر الحكم النهائي لصالح الموكل.", notes: "أُغلقت بعد كسب الاستئناف.", createdAt: now - 140 * 24 * h },
    { id: "ca7", lawyerId: DEMO_ID, caseNumber: "233/2025", clientId: "cl2", court: "المحكمة الإدارية بالرياض", caseType: "إدارية", filedDate: D(-12), nextHearingDate: D(6), nextHearingTime: "10:00", status: "open", description: "دعوى إلغاء قرار إداري صادر عن جهة حكومية.", notes: "", createdAt: now - 12 * 24 * h },
  ];

  const hearings: Hearing[] = [
    { id: "he1", lawyerId: DEMO_ID, caseId: "ca1", date: D(-21), time: "10:00", type: "إثبات وتبادل مستندات", notes: "تم تقديم كشف الحسابات.", createdAt: now - 21 * 24 * h },
    { id: "he2", lawyerId: DEMO_ID, caseId: "ca1", date: D(-6), time: "11:30", type: "تبادل مذكرات", notes: "", createdAt: now - 6 * 24 * h },
    { id: "he3", lawyerId: DEMO_ID, caseId: "ca1", date: D(0), time: "10:30", type: "مرافعة", notes: "إحضار أصل العقود والمرفقات.", createdAt: now - 5 * 24 * h },
    { id: "he4", lawyerId: DEMO_ID, caseId: "ca2", date: D(-15), time: "09:00", type: "نظر الدعوى", notes: "", createdAt: now - 15 * 24 * h },
    { id: "he5", lawyerId: DEMO_ID, caseId: "ca2", date: D(0), time: "12:15", type: "نطق بالحكم", notes: "", createdAt: now - 15 * 24 * h },
    { id: "he6", lawyerId: DEMO_ID, caseId: "ca3", date: D(1), time: "09:30", type: "جلسة صلح", notes: "حضور الطرفين شخصياً.", createdAt: now - 4 * 24 * h },
    { id: "he7", lawyerId: DEMO_ID, caseId: "ca4", date: D(3), time: "11:00", type: "استجواب", notes: "تجهيز أسئلة الدفاع.", createdAt: now - 3 * 24 * h },
    { id: "he8", lawyerId: DEMO_ID, caseId: "ca5", date: D(5), time: "13:30", type: "مرافعة ختامية", notes: "", createdAt: now - 2 * 24 * h },
    { id: "he9", lawyerId: DEMO_ID, caseId: "ca6", date: D(-12), time: "10:00", type: "نطق بالحكم", notes: "كسب الاستئناف.", createdAt: now - 12 * 24 * h },
    { id: "he10", lawyerId: DEMO_ID, caseId: "ca7", date: D(6), time: "10:00", type: "أولى", notes: "", createdAt: now - 24 * h },
  ];

  const tasks: Task[] = [
    { id: "ta1", lawyerId: DEMO_ID, title: "تجهيز مذكرة الدفاع — قضية 1042/2025", description: "مراجعة بنود العقد وإعداد المذكرة الختامية قبل جلسة المرافعة.", date: D(0), time: "09:00", priority: "high", caseId: "ca1", clientId: "cl1", completed: false, createdAt: now - 2 * 24 * h },
    { id: "ta2", lawyerId: DEMO_ID, title: "الاطلاع على تقرير الخبير العقاري", description: "", date: D(0), time: "14:00", priority: "medium", caseId: "ca2", clientId: "cl2", completed: false, createdAt: now - 26 * h },
    { id: "ta3", lawyerId: DEMO_ID, title: "رفع مستندات القضية 87/2025", description: "رفع الصكوك وكروكي العقار على منصة ناجز.", date: D(0), time: "08:30", priority: "high", caseId: "ca2", clientId: "cl2", completed: true, completedAt: now - 3 * h, createdAt: now - 2 * 24 * h },
    { id: "ta4", lawyerId: DEMO_ID, title: "الاتصال بالموكل أحمد الشمري", description: "تأكيد حضور جلسة الغد.", date: D(0), time: "16:30", priority: "low", clientId: "cl2", completed: false, createdAt: now - 20 * h },
    { id: "ta5", lawyerId: DEMO_ID, title: "سداد رسوم المحكمة الجزائية", description: "", date: D(-1), time: "12:00", priority: "high", caseId: "ca4", clientId: "cl4", completed: false, createdAt: now - 3 * 24 * h },
    { id: "ta6", lawyerId: DEMO_ID, title: "مراجعة مسودة اتفاق الصلح", description: "مسودة مقدمة من الطرف الآخر.", date: D(1), time: "10:00", priority: "medium", caseId: "ca3", clientId: "cl3", completed: false, createdAt: now - 30 * h },
    { id: "ta7", lawyerId: DEMO_ID, title: "إعداد قائمة شهود الإثبات", description: "", date: D(3), priority: "high", caseId: "ca4", clientId: "cl4", completed: false, createdAt: now - 10 * h },
  ];

  const saleBody = `<h2>البند الأول: أطراف العقد</h2><p>أبرم هذا العقد بين البائع والمشتري وفق البيانات المدونة أعلاه، ويعد التوقيع عليه إقراراً بصحة كافة البيانات.</p><h2>البند الثاني: المبيع</h2><p>محل هذا العقد هو المنقول/العقار الموصوف وصفاً نافياً للجهالة، بجميع ملحقاته وتوابعه.</p><h2>البند الثالث: الثمن وطريقة السداد</h2><div class="box"><p>اتفق الطرفان على ثمن إجمالي وقدره (__________) ريال سعودي، يُسدد على دفعات وفق الجدول المتفق عليه.</p></div><h2>البند الرابع: التسليم</h2><p>يلتزم البائع بتسليم المبيع بالحالة المتفق عليها خلال (____) يوماً من توقيع هذا العقد.</p>`;
  const powBody = `<h2>أطراف التوكيل</h2><p>بموجب هذا التوكيل، يوكل الطرف الأول (الموكل) المحامي المذكور أعلاه في مباشرة جميع الإجراءات النظامية نيابةً عنه.</p><h2>نطاق التوكيل</h2><div class="box"><p>يشمل التوكيل: الترافع أمام المحاكم على اختلاف درجاتها، تقديم المذكرات واللوائح، استلام الأحكام والصكوك، طلب التنفيذ، التنازل والصلح والإقرار وفق ما تقتضيه مصلحة الموكل.</p></div><h2>مدة التوكيل</h2><p>يسري هذا التوكيل لمدة عام ميلادي من تاريخ توثيقه ما لم يُلغَ كتابةً من الموكل.</p>`;
  const rentBody = `<h2>البند الأول: العين المؤجرة</h2><p>يؤجر الطرف الأول للطرف الثاني العقار الموصوف أعلاه لاستخدامه للغرض المتفق عليه فقط.</p><h2>البند الثاني: مدة الإيجار والأجرة</h2><div class="box"><p>مدة هذا العقد عام كامل يبدأ من تاريخ (____) بأجرة سنوية قدرها (__________) ريال تُسدد مقدماً على دفعات ربع سنوية.</p></div><h2>البند الثالث: الالتزامات</h2><p>يلتزم المستأجر بالمحافظة على العين المؤجرة وسداد فواتير الخدمات، ولا يجوز له التأجير من الباطن دون موافقة خطية.</p>`;
  const ackBody = `<h2>موضوع الإقرار</h2><p>يقر الموقع أدناه بصحة الوقائع المبينة أعلاه إقراراً صريحاً لا رجوع فيه ولا إنكار له.</p><div class="box"><p>وقد حُرر هذا الإقرار بحضور الشهود الموقعين أدناه، بعد أن تلا المقر مضمونه وتفهم أثره النظامي.</p></div>`;

  const templates: Template[] = [
    { id: "tp1", lawyerId: DEMO_ID, name: "عقد بيع", ext: "doc", size: 4820, kind: "builtin", content: docHtml("عقد بيع", saleBody), addedAt: now - 40 * 24 * h },
    { id: "tp2", lawyerId: DEMO_ID, name: "توكيل عام", ext: "doc", size: 3940, kind: "builtin", content: docHtml("توكيل عام", powBody), addedAt: now - 35 * 24 * h },
    { id: "tp3", lawyerId: DEMO_ID, name: "عقد إيجار", ext: "doc", size: 5110, kind: "builtin", content: docHtml("عقد إيجار", rentBody), addedAt: now - 20 * 24 * h },
    { id: "tp4", lawyerId: DEMO_ID, name: "إقرار استلام", ext: "doc", size: 2180, kind: "builtin", content: docHtml("إقرار استلام", ackBody), addedAt: now - 9 * 24 * h },
  ];

  const caseFiles: CaseFile[] = [
    { id: "cf1", lawyerId: DEMO_ID, caseId: "ca1", name: "توكيل عام", ext: "doc", size: 3940, content: docHtml("توكيل عام", powBody), templateId: "tp2", addedAt: now - 8 * 24 * h },
    { id: "cf2", lawyerId: DEMO_ID, caseId: "ca2", name: "صورة الصك", ext: "pdf", size: 812000, addedAt: now - 5 * 24 * h },
  ];

  const txs: Tx[] = [
    { id: "tx1", lawyerId: DEMO_ID, clientId: "cl1", caseId: "ca1", amount: 15000, type: "fees", date: D(-40), notes: "دفعة أولى من الأتعاب", createdAt: now - 40 * 24 * h },
    { id: "tx2", lawyerId: DEMO_ID, clientId: "cl1", caseId: "ca1", amount: 10000, type: "fees", date: D(-10), notes: "دفعة ثانية", createdAt: now - 10 * 24 * h },
    { id: "tx3", lawyerId: DEMO_ID, clientId: "cl1", caseId: "ca1", amount: 1200, type: "expenses", date: D(-8), notes: "رسوم قيد الدعوى", createdAt: now - 8 * 24 * h },
    { id: "tx4", lawyerId: DEMO_ID, clientId: "cl2", caseId: "ca2", amount: 8000, type: "fees", date: D(-30), notes: "أتعاب القضية", createdAt: now - 30 * 24 * h },
    { id: "tx5", lawyerId: DEMO_ID, clientId: "cl2", caseId: "ca2", amount: 450, type: "expenses", date: D(-12), notes: "أجور خبير عقاري", createdAt: now - 12 * 24 * h },
    { id: "tx6", lawyerId: DEMO_ID, clientId: "cl3", caseId: "ca3", amount: 6000, type: "fees", date: D(-20), notes: "", createdAt: now - 20 * 24 * h },
    { id: "tx7", lawyerId: DEMO_ID, clientId: "cl4", caseId: "ca4", amount: 12000, type: "fees", date: D(-15), notes: "دفعة أولى", createdAt: now - 15 * 24 * h },
    { id: "tx8", lawyerId: DEMO_ID, clientId: "cl4", caseId: "ca4", amount: 2300, type: "expenses", date: D(-6), notes: "رسوم وتقارير", createdAt: now - 6 * 24 * h },
    { id: "tx9", lawyerId: DEMO_ID, clientId: "cl6", caseId: "ca6", amount: 20000, type: "fees", date: D(-60), notes: "أتعاب الاستئناف", createdAt: now - 60 * 24 * h },
    { id: "tx10", lawyerId: DEMO_ID, clientId: "cl6", caseId: "ca6", amount: 1500, type: "expenses", date: D(-50), notes: "رسوم استئناف", createdAt: now - 50 * 24 * h },
  ];

  const notes: CaseNote[] = [
    { id: "no1", lawyerId: DEMO_ID, caseId: "ca1", text: "الطرف الآخر طلب مهلة إضافية لتقديم المستندات — تم الرفض شفوياً أمام القاضي.", createdAt: now - 6 * 24 * h },
    { id: "no2", lawyerId: DEMO_ID, caseId: "ca1", text: "التركيز على البند السابع من العقد في جلسة المرافعة القادمة.", createdAt: now - 2 * 24 * h },
    { id: "no3", lawyerId: DEMO_ID, caseId: "ca3", text: "الموكلية منفتحة على خيار الصلح بشرط جدولة النفقة.", createdAt: now - 24 * h },
  ];

  const activities: Activity[] = [
    { id: uid(), lawyerId: DEMO_ID, kind: "client", text: "تمت إضافة موكل جديد: نورة فهد السبيعي", at: now - 15 * 24 * h },
    { id: uid(), lawyerId: DEMO_ID, kind: "case", text: "تم إنشاء قضية جديدة برقم 233/2025", caseId: "ca7", at: now - 12 * 24 * h },
    { id: uid(), lawyerId: DEMO_ID, kind: "finance", text: "تم تسجيل أتعاب 10,000 ر.س للقضية 1042/2025", caseId: "ca1", at: now - 10 * 24 * h },
    { id: uid(), lawyerId: DEMO_ID, kind: "template", text: "تم رفع نموذج جديد: إقرار استلام", at: now - 9 * 24 * h },
    { id: uid(), lawyerId: DEMO_ID, kind: "hearing", text: "تم تحديد جلسة مرافعة في القضية 1042/2025", caseId: "ca1", at: now - 5 * 24 * h },
    { id: uid(), lawyerId: DEMO_ID, kind: "task", text: "تم إكمال مهمة: رفع مستندات القضية 87/2025", at: now - 3 * h },
    { id: uid(), lawyerId: DEMO_ID, kind: "note", text: "تمت إضافة ملاحظة على القضية 310/2025", caseId: "ca3", at: now - 24 * h },
  ];

  return { clients, cases, hearings, tasks, templates, caseFiles, txs, notes, activities };
};

const demoLawyer: Lawyer = {
  id: DEMO_ID,
  name: "أ. عبدالله الحربي",
  email: "demo@mezan.sa",
  phone: "0500000000",
  password: "123456",
  createdAt: Date.now() - 120 * 86400_000,
};

/* ---------------- store ---------------- */
interface State {
  lawyers: Lawyer[];
  sessionUserId: ID | null;
  clients: Client[];
  cases: Case[];
  hearings: Hearing[];
  tasks: Task[];
  templates: Template[];
  caseFiles: CaseFile[];
  txs: Tx[];
  notes: CaseNote[];
  activities: Activity[];
  readNotifs: string[];

  toasts: Toast[];
  nav: { page: Page; intent: Intent };
  sidebarOpen: boolean;
  sidebarMini: boolean;

  toast: (type: Toast["type"], msg: string) => void;
  dropToast: (id: ID) => void;
  go: (page: Page, intent?: Intent) => void;
  consumeIntent: () => void;
  setSidebar: (open: boolean) => void;
  toggleMini: () => void;

  login: async (identifier, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        return "بيانات الدخول غير صحيحة، تأكد من البريد الإلكتروني وكلمة المرور.";
      }

      if (data.user) {
        set({ sessionUserId: data.user.id, nav: { page: "dashboard", intent: null } });
        
        // تحميل البيانات من Supabase
        await loadData(data.user.id);
        
        toast("success", "مرحباً بعودتك!");
        return null;
      }
      
      return "حدث خطأ غير متوقع.";
    } catch (error) {
      return "فشل في تسجيل الدخول.";
    }
  },
  register: async (d, withDemo) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: d.email.trim().toLowerCase(),
        password: d.password,
        options: {
          data: {
            name: d.name.trim(),
            phone: d.phone.trim(),
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) return "فشل في إنشاء الحساب، يرجى المحاولة لاحقاً.";

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        name: d.name.trim(),
        email: d.email.trim().toLowerCase(),
        phone: d.phone.trim(),
      });

      if (profileError) throw profileError;

      set({ sessionUserId: authData.user.id, nav: { page: "dashboard", intent: null } });
      
      // تحميل البيانات (ستكون فارغة في البداية)
      await loadData(authData.user.id);
      
      toast("success", `تم إنشاء حسابك بنجاح. أهلاً بك في ميزان، ${d.name}!`);
      return null;
    } catch (error: any) {
      return error.message || "حدث خطأ أثناء إنشاء الحساب.";
    }
  },
  logout: () => void;

  addClient: async (d) => {
    const userId = get().sessionUserId as string;
    const c: any = { ...d, id: uid(), lawyer_id: userId, important_dates: [], created_at: new Date().toISOString() };
    
    const { error } = await supabase.from('clients').insert([c]);
    
    if (error) {
      toast("error", "فشل في إضافة الموكل");
      return;
    }
    
    set((s) => ({ clients: [c, ...s.clients] }));
    log("client", `تمت إضافة موكل جديد: ${c.name}`);
    toast("success", `تمت إضافة الموكل «${c.name}»`);
  },
  updateClient: async (id, d) => {
    const { error } = await supabase.from('clients').update(d).eq('id', id);
    
    if (error) {
      toast("error", "فشل في تحديث الموكل");
      return;
    }
    
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...d } : c)) }));
    toast("success", "تم حفظ تعديلات الموكل");
  },
  deleteClient: async (id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    
    if (error) {
      toast("error", "فشل في حذف الموكل");
      return;
    }
    
    const caseIds = get().cases.filter((c) => c.client_id === id).map((c) => c.id);
    const name = get().clients.find((c) => c.id === id)?.name ?? "";
    
    set((s) => ({
      clients: s.clients.filter((c) => c.id !== id),
      cases: s.cases.filter((c) => c.client_id !== id),
      hearings: s.hearings.filter((x) => !caseIds.includes(x.case_id)),
      notes: s.notes.filter((x) => !caseIds.includes(x.case_id)),
      caseFiles: s.caseFiles.filter((x) => !caseIds.includes(x.case_id)),
      tasks: s.tasks.map((t) => ({
        ...t,
        case_id: t.case_id && caseIds.includes(t.case_id) ? undefined : t.case_id,
        client_id: t.client_id === id ? undefined : t.client_id,
      })),
      txs: s.txs.filter((x) => x.client_id !== id),
    }));
    
    log("client", `تم حذف الموكل «${name}» و${caseIds.length} قضية مرتبطة به`);
    toast("success", `تم حذف الموكل «${name}»`);
  },
  addImportantDate: (clientId: ID, label: string, date: string) => void;
  removeImportantDate: (clientId: ID, dateId: ID) => void;

  addCase: (d: Omit<Case, "id" | "lawyerId" | "createdAt">) => void;
  updateCase: (id: ID, d: Partial<Case>) => void;
  deleteCase: (id: ID) => void;
  addHearing: (caseId: ID, d: { date: string; time: string; type: string; notes?: string }) => void;
  deleteHearing: (id: ID) => void;

  addTask: (d: Omit<Task, "id" | "lawyerId" | "createdAt" | "completed">) => void;
  updateTask: (id: ID, d: Partial<Task>) => void;
  toggleTask: (id: ID) => void;
  deleteTask: (id: ID) => void;

  addTemplate: (d: Omit<Template, "id" | "lawyerId" | "addedAt">) => void;
  renameTemplate: (id: ID, name: string) => void;
  deleteTemplate: (id: ID) => void;

  addCaseFile: (caseId: ID, d: Omit<CaseFile, "id" | "lawyerId" | "caseId" | "addedAt">) => void;
  deleteCaseFile: (id: ID) => void;

  addTx: (d: Omit<Tx, "id" | "lawyerId" | "createdAt">) => void;
  updateTx: (id: ID, d: Partial<Tx>) => void;
  deleteTx: (id: ID) => void;

  addNote: (caseId: ID, text: string) => void;
  markNotifsRead: (ids: string[]) => void;
}

const nextHearingOf = (hs: Hearing[], caseId: ID) => {
  const upcoming = hs
    .filter((x) => x.caseId === caseId && x.date >= todayISO())
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return upcoming[0];
};

/* ---------------- تحميل البيانات من Supabase ---------------- */
const loadData = async (lawyerId: string) => {
  try {
    const [
      { data: clients },
      { data: cases },
      { data: hearings },
      { data: tasks },
      { data: templates },
      { data: caseFiles },
      { data: txs },
      { data: notes },
      { data: activities },
    ] = await Promise.all([
      supabase.from('clients').select('*').eq('lawyer_id', lawyerId),
      supabase.from('cases').select('*').eq('lawyer_id', lawyerId),
      supabase.from('hearings').select('*').eq('lawyer_id', lawyerId),
      supabase.from('tasks').select('*').eq('lawyer_id', lawyerId),
      supabase.from('templates').select('*').eq('lawyer_id', lawyerId),
      supabase.from('case_files').select('*').eq('lawyer_id', lawyerId),
      supabase.from('txs').select('*').eq('lawyer_id', lawyerId),
      supabase.from('notes').select('*').eq('lawyer_id', lawyerId),
      supabase.from('activities').select('*').eq('lawyer_id', lawyerId),
    ]);

    set({
      clients: (clients || []) as any,
      cases: (cases || []) as any,
      hearings: (hearings || []) as any,
      tasks: (tasks || []) as any,
      templates: (templates || []) as any,
      caseFiles: (caseFiles || []) as any,
      txs: (txs || []) as any,
      notes: (notes || []) as any,
      activities: (activities || []) as any,
    });
  } catch (error) {
    console.error('Error loading data:', error);
  }
};

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const me = () => get().sessionUserId as ID;
      const log = (kind: ActivityKind, text: string, caseId?: ID) =>
        set((s) => ({
          activities: [{ id: uid(), lawyerId: me(), kind, text, caseId, at: Date.now() }, ...s.activities],
        }));
      const toast: State["toast"] = (type, msg) =>
        set((s) => ({ toasts: [...s.toasts, { id: uid(), type, msg }] }));

      return {
        lawyers: [demoLawyer],
        sessionUserId: null,
        ...buildSeed(),
        readNotifs: [],
        toasts: [],
        nav: { page: "dashboard", intent: null },
        sidebarOpen: false,
        sidebarMini: false,

        toast,
        dropToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
        go: (page, intent = null) => set({ nav: { page, intent }, sidebarOpen: false }),
        consumeIntent: () => set((s) => ({ nav: { ...s.nav, intent: null } })),
        setSidebar: (open) => set({ sidebarOpen: open }),
        toggleMini: () => set((s) => ({ sidebarMini: !s.sidebarMini })),

        login: async (identifier: string, password: string) => {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: identifier.trim().toLowerCase(),
              password: password,
            });

            if (error) {
              return "بيانات الدخول غير صحيحة، تأكد من البريد الإلكتروني وكلمة المرور.";
            }

            if (data.user) {
              set({ sessionUserId: data.user.id, nav: { page: "dashboard", intent: null } });
              toast("success", `مرحباً بعودتك!`);
              return null;
            }
            
            return "حدث خطأ غير متوقع.";
          } catch (error) {
            return "فشل في تسجيل الدخول.";
          }
        },

        register: async (d: {name: string; email: string; phone: string; password: string}, withDemo: boolean) => {
          try {
            // 1. إنشاء المستخدم في نظام المصادقة من Supabase
            const { data: authData, error: authError } = await supabase.auth.signUp({
              email: d.email.trim().toLowerCase(),
              password: d.password,
              options: {
                data: {
                  name: d.name.trim(),
                  phone: d.phone.trim(),
                }
              }
            });

            if (authError) throw authError;
            if (!authData.user) return "فشل في إنشاء الحساب، يرجى المحاولة لاحقاً.";

            // 2. حفظ البيانات الإضافية في جدول profiles
            const { error: profileError } = await supabase.from('profiles').insert({
              id: authData.user.id,
              name: d.name.trim(),
              email: d.email.trim().toLowerCase(),
              phone: d.phone.trim(),
            });

            if (profileError) throw profileError;

            // 3. تحديث الحالة المحلية
            set({ sessionUserId: authData.user.id, nav: { page: "dashboard", intent: null } });
            
            // (اختياري) إذا أراد المستخدم بيانات تجريبية، يمكن إضافتها هنا لاحقاً عبر Supabase
            
            toast("success", `تم إنشاء حسابك بنجاح. أهلاً بك في ميزان، ${d.name}!`);
            return null;
          } catch (error: any) {
            return error.message || "حدث خطأ أثناء إنشاء الحساب.";
          }
        },

        logout: async () => {
          await supabase.auth.signOut();
          set({ sessionUserId: null, sidebarOpen: false });
          toast("info", "تم تسجيل الخروج بأمان.");
        },
        

        addClient: (d) => {
          const c: Client = { ...d, id: uid(), lawyerId: me(), importantDates: [], createdAt: Date.now() };
          set((s) => ({ clients: [c, ...s.clients] }));
          log("client", `تمت إضافة موكل جديد: ${c.name}`);
          toast("success", `تمت إضافة الموكل «${c.name}»`);
        },
        updateClient: (id, d) => {
          set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...d } : c)) }));
          toast("success", "تم حفظ تعديلات الموكل");
        },
        deleteClient: (id) => {
          const caseIds = get().cases.filter((c) => c.clientId === id).map((c) => c.id);
          const name = get().clients.find((c) => c.id === id)?.name ?? "";
          set((s) => ({
            clients: s.clients.filter((c) => c.id !== id),
            cases: s.cases.filter((c) => c.clientId !== id),
            hearings: s.hearings.filter((x) => !caseIds.includes(x.caseId)),
            notes: s.notes.filter((x) => !caseIds.includes(x.caseId)),
            caseFiles: s.caseFiles.filter((x) => !caseIds.includes(x.caseId)),
            tasks: s.tasks.map((t) => ({
              ...t,
              caseId: t.caseId && caseIds.includes(t.caseId) ? undefined : t.caseId,
              clientId: t.clientId === id ? undefined : t.clientId,
            })),
            txs: s.txs.filter((x) => x.clientId !== id),
          }));
          log("client", `تم حذف الموكل «${name}» و${caseIds.length} قضية مرتبطة به`);
          toast("success", `تم حذف الموكل «${name}»`);
        },
        addImportantDate: (clientId, label, date) => {
          set((s) => ({
            clients: s.clients.map((c) =>
              c.id === clientId ? { ...c, importantDates: [...c.importantDates, { id: uid(), label, date }] } : c,
            ),
          }));
          toast("success", "تمت إضافة التاريخ المهم");
        },
        removeImportantDate: (clientId, dateId) =>
          set((s) => ({
            clients: s.clients.map((c) =>
              c.id === clientId ? { ...c, importantDates: c.importantDates.filter((d) => d.id !== dateId) } : c,
            ),
          })),

        addCase: (d) => {
          const c: Case = { ...d, id: uid(), lawyerId: me(), createdAt: Date.now() };
          const hs = [...get().hearings];
          if (c.nextHearingDate) {
            hs.unshift({ id: uid(), lawyerId: me(), caseId: c.id, date: c.nextHearingDate, time: c.nextHearingTime || "09:00", type: "جلسة نظر الدعوى", createdAt: Date.now() });
          }
          set((s) => ({ cases: [c, ...s.cases], hearings: hs }));
          log("case", `تم إنشاء قضية جديدة برقم ${c.caseNumber}`, c.id);
          toast("success", `تم إنشاء القضية رقم ${c.caseNumber} وإضافتها إلى الأجندة`);
        },
        updateCase: (id, d) => {
          const prev = get().cases.find((c) => c.id === id);
          let hs = get().hearings;
          if (d.nextHearingDate && d.nextHearingDate !== prev?.nextHearingDate) {
            hs = [{ id: uid(), lawyerId: me(), caseId: id, date: d.nextHearingDate, time: d.nextHearingTime || "09:00", type: "جلسة نظر الدعوى", createdAt: Date.now() }, ...hs];
          }
          set((s) => ({ cases: s.cases.map((c) => (c.id === id ? { ...c, ...d } : c)), hearings: hs }));
          log("case", `تم تحديث القضية ${prev?.caseNumber ?? ""}`, id);
          toast("success", "تم حفظ تعديلات القضية");
        },
        deleteCase: (id) => {
          const num = get().cases.find((c) => c.id === id)?.caseNumber ?? "";
          set((s) => ({
            cases: s.cases.filter((c) => c.id !== id),
            hearings: s.hearings.filter((x) => x.caseId !== id),
            notes: s.notes.filter((x) => x.caseId !== id),
            caseFiles: s.caseFiles.filter((x) => x.caseId !== id),
            tasks: s.tasks.map((t) => (t.caseId === id ? { ...t, caseId: undefined } : t)),
            txs: s.txs.filter((x) => x.caseId !== id),
          }));
          log("case", `تم حذف القضية رقم ${num}`);
          toast("success", `تم حذف القضية رقم ${num} وجميع سجلاتها`);
        },
        addHearing: (caseId, d) => {
          const hng: Hearing = { id: uid(), lawyerId: me(), caseId, ...d, createdAt: Date.now() };
          let hs = [...get().hearings, hng];
          const nx = nextHearingOf(hs, caseId);
          set((s) => ({
            hearings: hs,
            cases: s.cases.map((c) =>
              c.id === caseId ? { ...c, nextHearingDate: nx?.date ?? "", nextHearingTime: nx?.time ?? "" } : c,
            ),
          }));
          const num = get().cases.find((c) => c.id === caseId)?.caseNumber ?? "";
          log("hearing", `تم تحديد جلسة ${d.type} في القضية ${num}`, caseId);
          toast("success", "تمت إضافة الجلسة إلى الأجندة");
        },
        deleteHearing: (id) => {
          const hng = get().hearings.find((x) => x.id === id);
          const hs = get().hearings.filter((x) => x.id !== id);
          if (hng) {
            const nx = nextHearingOf(hs, hng.caseId);
            set((s) => ({
              hearings: hs,
              cases: s.cases.map((c) =>
                c.id === hng.caseId ? { ...c, nextHearingDate: nx?.date ?? "", nextHearingTime: nx?.time ?? "" } : c,
              ),
            }));
          } else set({ hearings: hs });
          toast("success", "تم حذف الجلسة");
        },

        addTask: (d) => {
          const t: Task = { ...d, id: uid(), lawyerId: me(), completed: false, createdAt: Date.now() };
          set((s) => ({ tasks: [t, ...s.tasks] }));
          log("task", `تمت إضافة مهمة جديدة: ${t.title}`);
          toast("success", "تمت إضافة المهمة بنجاح");
        },
        updateTask: (id, d) => {
          set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...d } : t)) }));
          toast("success", "تم حفظ تعديلات المهمة");
        },
        toggleTask: (id) => {
          const t = get().tasks.find((x) => x.id === id);
          const nowDone = !(t?.completed ?? false);
          set((s) => ({
            tasks: s.tasks.map((x) =>
              x.id === id ? { ...x, completed: nowDone, completedAt: nowDone ? Date.now() : undefined } : x,
            ),
          }));
          if (t && nowDone) log("task", `تم إكمال مهمة: ${t.title}`);
          toast(nowDone ? "success" : "info", nowDone ? "أحسنت! تم إكمال المهمة" : "تمت إعادة المهمة إلى قيد التنفيذ");
        },
        deleteTask: (id) => {
          set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
          toast("success", "تم حذف المهمة");
        },

        addTemplate: (d) => {
          const t: Template = { ...d, id: uid(), lawyerId: me(), addedAt: Date.now() };
          set((s) => ({ templates: [t, ...s.templates] }));
          log("template", `تم رفع نموذج جديد: ${t.name}`);
          toast("success", `تم رفع النموذج «${t.name}»`);
        },
        renameTemplate: (id, name) => {
          set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, name } : t)) }));
          toast("success", "تمت إعادة تسمية النموذج");
        },
        deleteTemplate: (id) => {
          const n = get().templates.find((t) => t.id === id)?.name ?? "";
          set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
          log("template", `تم حذف النموذج «${n}»`);
          toast("success", `تم حذف النموذج «${n}»`);
        },

        addCaseFile: (caseId, d) => {
          const f: CaseFile = { ...d, id: uid(), lawyerId: me(), caseId, addedAt: Date.now() };
          set((s) => ({ caseFiles: [f, ...s.caseFiles] }));
          toast("success", `تم إرفاق «${f.name}» بالقضية`);
        },
        deleteCaseFile: (id) => {
          set((s) => ({ caseFiles: s.caseFiles.filter((f) => f.id !== id) }));
          toast("success", "تم حذف المرفق");
        },

        addTx: (d) => {
          const t: Tx = { ...d, id: uid(), lawyerId: me(), createdAt: Date.now() };
          set((s) => ({ txs: [t, ...s.txs] }));
          const num = t.caseId ? get().cases.find((c) => c.id === t.caseId)?.caseNumber : "";
          log("finance", `تم تسجيل ${t.type === "fees" ? "أتعاب" : "مصروفات"} ${t.amount.toLocaleString("en-US")} ر.س${num ? ` للقضية ${num}` : ""}`, t.caseId);
          toast("success", "تم تسجيل العملية المالية");
        },
        updateTx: (id, d) => {
          set((s) => ({ txs: s.txs.map((t) => (t.id === id ? { ...t, ...d } : t)) }));
          toast("success", "تم حفظ تعديلات العملية المالية");
        },
        deleteTx: (id) => {
          set((s) => ({ txs: s.txs.filter((t) => t.id !== id) }));
          toast("success", "تم حذف العملية المالية");
        },

        addNote: (caseId, text) => {
          set((s) => ({ notes: [{ id: uid(), lawyerId: me(), caseId, text, createdAt: Date.now() }, ...s.notes] }));
          const num = get().cases.find((c) => c.id === caseId)?.caseNumber ?? "";
          log("note", `تمت إضافة ملاحظة على القضية ${num}`, caseId);
          toast("success", "تمت إضافة الملاحظة");
        },

        markNotifsRead: (ids) => set((s) => ({ readNotifs: Array.from(new Set([...s.readNotifs, ...ids])) })),
      };
    },
    {
      name: "mezan-v1",
      partialize: (s) => ({
        sessionUserId: s.sessionUserId,
        nav: s.nav,
        sidebarMini: s.sidebarMini,
      }),
    },
  ),
);

/* ---------------- derived: notifications ---------------- */
export interface Notif {
  id: string;
  kind: "hearing" | "task" | "overdue" | "activity";
  title: string;
  desc: string;
  at: number;
}

export const buildNotifications = (
  hearings: Hearing[], cases: Case[], clients: Client[], tasks: Task[],
  activities: Activity[], lawyerId: ID, read: string[],
): Notif[] => {
  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);
  const out: Notif[] = [];
  const cName = (id: ID) => clients.find((c) => c.id === id)?.name ?? "موكل";
  const cNum = (id: ID) => cases.find((c) => c.id === id)?.caseNumber ?? "";
  const court = (id: ID) => cases.find((c) => c.id === id)?.court ?? "";

  hearings
    .filter((h) => h.lawyerId === lawyerId && (h.date === today || h.date === tomorrow))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .forEach((h) => {
      out.push({
        id: `h-${h.id}`,
        kind: "hearing",
        title:
          h.date === today
            ? `لديك جلسة اليوم في القضية رقم ${cNum(h.caseId)}`
            : `لديك جلسة غداً في القضية رقم ${cNum(h.caseId)}`,
        desc: `${h.type} — ${court(h.caseId)} — الموكل: ${cName(cases.find((c) => c.id === h.caseId)?.clientId ?? "")} — الساعة ${h.time}`,
        at: new Date(`${h.date}T${h.time}`).getTime(),
      });
    });

  tasks
    .filter((t) => t.lawyerId === lawyerId && !t.completed && isPast(t.date))
    .forEach((t) =>
      out.push({ id: `o-${t.id}`, kind: "overdue", title: `مهمة متأخرة: ${t.title}`, desc: `كانت مستحقة بتاريخ ${t.date}`, at: t.createdAt }),
    );
  tasks
    .filter((t) => t.lawyerId === lawyerId && !t.completed && t.date === today)
    .forEach((t) =>
      out.push({ id: `t-${t.id}`, kind: "task", title: `مهمة مستحقة اليوم: ${t.title}`, desc: t.time ? `في الساعة ${t.time}` : "خلال اليوم", at: t.createdAt }),
    );

  activities
    .filter((a) => a.lawyerId === lawyerId && ["case", "finance", "hearing"].includes(a.kind))
    .slice(0, 3)
    .forEach((a) => out.push({ id: `a-${a.id}`, kind: "activity", title: a.text, desc: "تحديث في سجل النشاط", at: a.at }));

  return out.sort((a, b) => b.at - a.at);
};

export const unreadCount = (n: Notif[], read: string[]) =>
  n.filter((x) => !read.includes(x.id)).length;

/* convenience status maps */
export const CASE_STATUS: Record<CaseStatus, { label: string; cls: string; dot: string }> = {
  open: { label: "مفتوحة", cls: "bg-ok-100 text-ok-500", dot: "bg-ok-500" },
  postponed: { label: "مؤجلة", cls: "bg-warn-100 text-warn-500", dot: "bg-warn-500" },
  closed: { label: "مغلقة", cls: "bg-ink-100 text-ink-600", dot: "bg-ink-400" },
};

export const PRIORITY: Record<Priority, { label: string; cls: string }> = {
  high: { label: "عالية", cls: "bg-bad-100 text-bad-500" },
  medium: { label: "متوسطة", cls: "bg-warn-100 text-warn-500" },
  low: { label: "منخفضة", cls: "bg-ink-100 text-ink-600" },
};

export const TX_TYPE: Record<TxType, { label: string; cls: string }> = {
  fees: { label: "أتعاب", cls: "bg-ok-100 text-ok-500" },
  expenses: { label: "مصروفات", cls: "bg-bad-100 text-bad-500" },
};
