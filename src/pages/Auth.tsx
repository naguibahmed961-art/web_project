import { useState } from "react";
import { ArrowLeft, Briefcase, CalendarCheck2, Coins, Eye, EyeOff, Gavel, LogIn, Scale, UserPlus, Users } from "lucide-react";
import { useStore } from "../store";
import { Btn, Field } from "../components/ui";

type Mode = "login" | "register";

export default function Auth() {
  const login = useStore((s) => s.login);
  const register = useStore((s) => s.register);
  const [mode, setMode] = useState<Mode>("login");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState("");
  const [shake, setShake] = useState(0);

  const [lf, setLf] = useState({ id: "", pw: "" });
  const [rf, setRf] = useState({ name: "", email: "", phone: "", pw: "", pw2: "" });
  const [withDemo, setWithDemo] = useState(true);

  const fail = (e: Record<string, string>, msg = "") => {
    setErrors(e); setFormErr(msg); setShake((x) => x + 1);
  };

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!lf.id.trim()) errs.id = "أدخل البريد الإلكتروني أو اسم المستخدم";
    if (!lf.pw) errs.pw = "أدخل كلمة المرور";
    if (Object.keys(errs).length) return fail(errs);
    const res = login(lf.id, lf.pw);
    if (res) return fail({}, res);
  };

  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (rf.name.trim().length < 3) errs.name = "أدخل الاسم الكامل (3 أحرف على الأقل)";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rf.email.trim())) errs.email = "أدخل بريداً إلكترونياً صحيحاً";
    if (rf.phone.trim().length < 9) errs.phone = "أدخل رقم هاتف صحيح";
    if (rf.pw.length < 6) errs.pw = "كلمة المرور يجب ألا تقل عن 6 أحرف";
    if (rf.pw2 !== rf.pw) errs.pw2 = "كلمتا المرور غير متطابقتين";
    if (Object.keys(errs).length) return fail(errs);
    const res = register({ name: rf.name, email: rf.email, phone: rf.phone, password: rf.pw }, withDemo);
    if (res) return fail({}, res);
  };

  const pwToggle = (show: boolean, set: (v: boolean) => void) => (
    <button type="button" onClick={() => set(!show)} className="absolute end-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-700 transition-colors" title={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
      {show ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );

  return (
    <div className="auth-canvas min-h-screen flex">
      {/* ---------- brand panel ---------- */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] p-12 relative overflow-hidden">
        <div className="absolute inset-0 side-pattern opacity-60" />
        <Scale size={520} className="absolute -bottom-40 -start-40 text-white/[0.04] rotate-12" strokeWidth={0.6} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-b from-gold-400 to-gold-600 text-ink-950 flex items-center justify-center shadow-lg">
              <Scale size={26} strokeWidth={2.2} />
            </span>
            <div>
              <h1 className="font-display font-black text-3xl text-white">ميزان</h1>
              <p className="text-[12px] text-ink-300 font-medium">نظام إدارة مكاتب المحاماة</p>
            </div>
          </div>
          <h2 className="font-display font-black text-[42px] leading-[1.25] text-white mt-14">
            مكتبك القانوني،<br />
            <span className="text-gold-400">منظّم بدقة الميزان.</span>
          </h2>
          <p className="text-ink-200 text-[15px] leading-relaxed mt-5 max-w-md">
            القضايا والموكلون والجلسات والمهام والحسابات — كل شيء في مكان واحد،
            مع تنبيهات فورية لا تُفوّت معها جلسة أبداً.
          </p>
        </div>
        <div className="relative grid grid-cols-2 gap-3 max-w-md">
          {[
            { icon: <Gavel size={18} />, t: "متابعة الجلسات", d: "أجندة 7 أيام وتنبيهات يومية" },
            { icon: <Users size={18} />, t: "ملفات الموكلين", d: "بيانات وقضايا ومعاملات" },
            { icon: <CalendarCheck2 size={18} />, t: "مهام ذكية", d: "أولويات واستحقاقات واضحة" },
            { icon: <Coins size={18} />, t: "حسابات دقيقة", d: "أتعاب ومصروفات وصافي تلقائي" },
          ].map((f) => (
            <div key={f.t} className="rounded-xl bg-white/[0.06] border border-white/10 p-3.5 backdrop-blur-sm hover:bg-white/[0.09] transition-colors">
              <span className="text-gold-400">{f.icon}</span>
              <p className="text-white font-bold text-[13.5px] mt-2">{f.t}</p>
              <p className="text-ink-300 text-[11.5px] mt-0.5">{f.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- form panel ---------- */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-10">
        <div className={`w-full max-w-md ${shake ? `anim-shake` : ""}`} key={shake}>
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-6">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-b from-gold-400 to-gold-600 text-ink-950 flex items-center justify-center"><Scale size={24} /></span>
            <div>
              <p className="font-display font-black text-2xl text-white leading-none">ميزان</p>
              <p className="text-[10.5px] text-ink-300">نظام إدارة مكاتب المحاماة</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lift p-6 sm:p-8 anim-fade-up">
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-ink-100/70 rounded-xl mb-6">
              <button onClick={() => { setMode("login"); setErrors({}); setFormErr(""); }} className={`py-2.5 rounded-lg text-sm font-bold transition-all ${mode === "login" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"}`}>
                تسجيل الدخول
              </button>
              <button onClick={() => { setMode("register"); setErrors({}); setFormErr(""); }} className={`py-2.5 rounded-lg text-sm font-bold transition-all ${mode === "register" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"}`}>
                تسجيل لأول مرة
              </button>
            </div>

            <h3 className="font-display font-black text-xl text-ink-900">
              {mode === "login" ? "أهلاً بعودتك" : "أنشئ حساب مكتبك"}
            </h3>
            <p className="text-[13px] text-ink-400 mt-1 mb-5">
              {mode === "login" ? "ادخل لمتابعة قضاياك وجلسات اليوم." : "خطوة واحدة وتصبح جاهزاً لإدارة مكتبك."}
            </p>

            {formErr && (
              <div className="flex items-center gap-2.5 rounded-xl bg-bad-100 border border-bad-500/25 text-bad-500 px-3.5 py-2.5 text-[13px] font-semibold mb-4 anim-fade-in">
                <span className="w-5 h-5 rounded-full bg-bad-500 text-white flex items-center justify-center text-[11px] font-black shrink-0">!</span>
                {formErr}
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={submitLogin} className="space-y-4">
                <Field label="البريد الإلكتروني / اسم المستخدم" req error={errors.id}>
                  <input className={`field-input ${errors.id ? "err" : ""}`} value={lf.id} onChange={(e) => setLf({ ...lf, id: e.target.value })} placeholder="demo@mezan.sa" dir="ltr" style={{ textAlign: "end" }} />
                </Field>
                <Field label="كلمة المرور" req error={errors.pw}>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} className={`field-input pe-10 ${errors.pw ? "err" : ""}`} value={lf.pw} onChange={(e) => setLf({ ...lf, pw: e.target.value })} placeholder="••••••" dir="ltr" style={{ textAlign: "end" }} />
                    {pwToggle(showPw, setShowPw)}
                  </div>
                </Field>
                <Btn type="submit" size="lg" className="w-full"><LogIn size={17} /> تسجيل الدخول</Btn>
                <button
                  type="button"
                  onClick={() => { setLf({ id: "demo@mezan.sa", pw: "123456" }); setErrors({}); setFormErr(""); }}
                  className="w-full text-center text-[12px] font-bold text-gold-700 hover:text-gold-600 py-1 transition-colors"
                >
                  جرّب الحساب التجريبي الجاهز ← demo@mezan.sa / 123456
                </button>
              </form>
            ) : (
              <form onSubmit={submitRegister} className="space-y-3.5">
                <Field label="اسم المحامي" req error={errors.name}>
                  <input className={`field-input ${errors.name ? "err" : ""}`} value={rf.name} onChange={(e) => setRf({ ...rf, name: e.target.value })} placeholder="أ. محمد العلي" />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="البريد الإلكتروني" req error={errors.email}>
                    <input className={`field-input ${errors.email ? "err" : ""}`} value={rf.email} onChange={(e) => setRf({ ...rf, email: e.target.value })} placeholder="name@mail.com" dir="ltr" style={{ textAlign: "end" }} />
                  </Field>
                  <Field label="رقم الهاتف" req error={errors.phone}>
                    <input className={`field-input ${errors.phone ? "err" : ""}`} value={rf.phone} onChange={(e) => setRf({ ...rf, phone: e.target.value })} placeholder="05XXXXXXXX" dir="ltr" style={{ textAlign: "end" }} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="كلمة المرور" req error={errors.pw}>
                    <div className="relative">
                      <input type={showPw ? "text" : "password"} className={`field-input pe-10 ${errors.pw ? "err" : ""}`} value={rf.pw} onChange={(e) => setRf({ ...rf, pw: e.target.value })} dir="ltr" style={{ textAlign: "end" }} />
                      {pwToggle(showPw, setShowPw)}
                    </div>
                  </Field>
                  <Field label="تأكيد كلمة المرور" req error={errors.pw2}>
                    <div className="relative">
                      <input type={showPw2 ? "text" : "password"} className={`field-input pe-10 ${errors.pw2 ? "err" : ""}`} value={rf.pw2} onChange={(e) => setRf({ ...rf, pw2: e.target.value })} dir="ltr" style={{ textAlign: "end" }} />
                      {pwToggle(showPw2, setShowPw2)}
                    </div>
                  </Field>
                </div>
                <label className="flex items-start gap-2.5 rounded-xl border border-ink-100 bg-ink-50/60 p-3 cursor-pointer hover:border-gold-300 transition-colors">
                  <input type="checkbox" checked={withDemo} onChange={(e) => setWithDemo(e.target.checked)} className="mt-0.5 w-4 h-4 accent-gold-500" />
                  <span className="text-[12.5px] text-ink-600 leading-relaxed">
                    <b className="text-ink-900">تحميل بيانات تجريبية</b> — موكلون وقضايا وجلسات جاهزة لاستكشاف النظام فوراً.
                  </span>
                </label>
                <Btn type="submit" variant="gold" size="lg" className="w-full"><UserPlus size={17} /> إنشاء الحساب والبدء</Btn>
              </form>
            )}
          </div>

          <p className="text-center text-[11.5px] text-ink-300 mt-5 flex items-center justify-center gap-1.5">
            <Briefcase size={13} /> بياناتك تُحفظ محلياً في متصفحك ولا يطّلع عليها أحد غيرك.
          </p>
          <button onClick={() => (mode === "login" ? setMode("register") : setMode("login"))} className="w-full mt-3 text-center text-[12.5px] font-bold text-gold-300 hover:text-gold-400 transition-colors inline-flex items-center justify-center gap-1">
            {mode === "login" ? "ليس لديك حساب؟ سجّل الآن" : "لديك حساب بالفعل؟ سجّل الدخول"} <ArrowLeft size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
