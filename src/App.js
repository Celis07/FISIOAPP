import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { EXERCISES, CATEGORIES } from "./exercises";
import PatientApp from "./PatientApp";

const BLOCKS = ["Terapia", "Calentamiento / Activación", "Trabajo central"];
const BLOCK_STYLES = {
  "Terapia":                { bg: "bg-rose-50",   border: "border-rose-200",  text: "text-rose-700",  icon: "🩺" },
  "Calentamiento / Activación": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "🔥" },
  "Trabajo central":        { bg: "bg-teal-50",   border: "border-teal-200",  text: "text-teal-700",  icon: "💪" },
};

function Avatar({ initials, size = "md" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base", xl: "w-20 h-20 text-xl" };
  return (
    <div className={`${sizes[size]} bg-gradient-to-br from-teal-400 to-teal-600 text-white rounded-2xl flex items-center justify-center font-bold flex-shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    setLoading(true); setError("");
    const { error } = isRegister
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-3xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">F</div>
          <h1 style={{ fontFamily: "'Fraunces', serif" }} className="text-3xl font-bold text-slate-800">FisioApp</h1>
          <p className="text-slate-400 text-sm mt-1">Tu plataforma de fisioterapia</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-800 text-lg mb-4">{isRegister ? "Crear cuenta" : "Iniciar sesión"}</h2>
          <div className="grid gap-3 mb-4">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" type="email"
              className="border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-slate-50" />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" type="password"
              className="border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-slate-50"
              onKeyDown={e => e.key === "Enter" && handle()} />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}
          <button onClick={handle} disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-3 rounded-2xl font-semibold text-sm transition-all shadow-sm disabled:opacity-50">
            {loading ? "Cargando..." : isRegister ? "Crear cuenta" : "Entrar"}
          </button>
          <p className="text-center text-xs text-slate-400 mt-4">
            {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
            <button onClick={() => setIsRegister(!isRegister)} className="text-teal-600 font-semibold hover:underline">
              {isRegister ? "Inicia sesión" : "Regístrate"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── INVITE MODAL ──────────────────────────────────────────────────────────────
function InviteModal({ patient, onClose }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}?invite=${patient.invite_token}`;
  const copy = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">🔗</div>
          <h3 style={{ fontFamily: "'Fraunces', serif" }} className="font-bold text-slate-800 text-xl">Link de invitación</h3>
          <p className="text-slate-500 text-sm mt-1">Envíale este link a <strong>{patient.name}</strong> por WhatsApp o email</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-200">
          <p className="text-xs text-slate-500 break-all font-mono">{link}</p>
        </div>
        <div className="grid gap-2">
          <button onClick={copy}
            className={`w-full py-3 rounded-2xl text-sm font-bold transition-all ${copied ? "bg-emerald-500 text-white" : "bg-teal-600 hover:bg-teal-700 text-white"}`}>
            {copied ? "✓ ¡Copiado!" : "📋 Copiar link"}
          </button>
          <button onClick={onClose} className="w-full py-3 rounded-2xl text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ─── PATIENT PROGRESS (therapist view) ────────────────────────────────────────
function PatientProgressView({ patient }) {
  const [logs, setLogs] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("exercise_logs").select("*").eq("patient_id", patient.id),
      supabase.from("prescriptions").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }),
    ]).then(([{ data: l }, { data: p }]) => {
      setLogs(l || []); setPrescriptions(p || []); setLoading(false);
    });
  }, [patient.id]);

  if (loading) return <div className="py-8 text-center text-slate-400 text-sm">Cargando...</div>;
  if (logs.length === 0) return (
    <div className="py-12 text-center text-slate-400">
      <p className="text-4xl mb-2">📊</p>
      <p className="text-sm">Este paciente aún no ha completado ejercicios</p>
    </div>
  );

  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6-i)); return d; });
  const logsPerDay = last7.map(day => ({ day, count: logs.filter(l => new Date(l.completed_at).toDateString() === day.toDateString()).length }));
  const maxCount = Math.max(...logsPerDay.map(d => d.count), 1);
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (logs.some(l => new Date(l.completed_at).toDateString() === d.toDateString())) streak++;
    else if (i > 0) break;
  }
  const latestPres = prescriptions[0];
  const totalEx = latestPres?.exercises?.length || 0;
  const todayDone = logs.filter(l => new Date(l.completed_at).toDateString() === new Date().toDateString()).length;
  const dayShort = ["D","L","M","X","J","V","S"];

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { val: streak, label: "Racha", emoji: "🔥" },
          { val: logs.length, label: "Total", emoji: "✅" },
          { val: `${totalEx > 0 ? Math.round((todayDone/totalEx)*100) : 0}%`, label: "Hoy", emoji: "📅" },
        ].map((s, i) => (
          <div key={i} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
            <p className="text-lg">{s.emoji}</p>
            <p className="text-xl font-bold text-slate-800">{s.val}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-3">
        <p className="text-xs font-semibold text-slate-500 mb-3">Últimos 7 días</p>
        <div className="flex items-end gap-2 h-16">
          {logsPerDay.map(({ day, count }, i) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-lg transition-all"
                  style={{ height: `${count > 0 ? Math.max((count/maxCount)*52,8) : 3}px`, background: isToday ? "#0d9488" : count > 0 ? "#99f6e4" : "#e2e8f0" }} />
                <span className="text-xs text-slate-400">{dayShort[day.getDay()]}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <p className="text-xs font-semibold text-slate-500 mb-2">Consistencia (30 días)</p>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 30 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (29-i));
            const count = logs.filter(l => new Date(l.completed_at).toDateString() === d.toDateString()).length;
            return <div key={i} className={`w-5 h-5 rounded-md ${count===0?"bg-slate-200":count<=2?"bg-teal-100":count<=5?"bg-teal-300":"bg-teal-500"}`} />;
          })}
        </div>
      </div>
    </div>
  );
}

// ─── PATIENT PROFILE ──────────────────────────────────────────────────────────
function PatientProfile({ patient, user, onBack, onPrescribe }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [activePres, setActivePres] = useState(null);
  const [activeTab, setActiveTab] = useState("plans");

  useEffect(() => {
    supabase.from("prescriptions").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false })
      .then(({ data }) => { setPrescriptions(data || []); setLoading(false); });
  }, []);

  const initials = patient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div>
      {showInvite && <InviteModal patient={patient} onClose={() => setShowInvite(false)} />}

      <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 mb-5 text-sm font-medium transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Volver
      </button>

      {/* Profile card */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-3xl p-6 mb-5 text-white relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-bold border border-white/30">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Fraunces', serif" }}>{patient.name}</h2>
            <p className="text-teal-100 text-sm mt-0.5">{patient.condition || "Sin diagnóstico"}</p>
            {patient.age && <p className="text-teal-200 text-xs mt-0.5">{patient.age} años</p>}
            {patient.email && <p className="text-teal-200 text-xs mt-0.5">✉️ {patient.email}</p>}
          </div>
        </div>
        <div className="relative flex items-center gap-2 mt-4">
          {patient.user_id
            ? <span className="bg-emerald-400/20 border border-emerald-300/40 text-white text-xs px-2.5 py-1 rounded-full font-medium">✓ App activa</span>
            : <span className="bg-white/20 border border-white/30 text-white text-xs px-2.5 py-1 rounded-full font-medium">Sin acceso a la app</span>
          }
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-5">
        <button onClick={() => onPrescribe(patient)}
          className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-3 rounded-2xl font-semibold transition-colors shadow-sm">
          💪 Prescribir
        </button>
        <button onClick={() => setShowInvite(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-sm px-4 py-3 rounded-2xl font-semibold border border-slate-200 transition-colors">
          🔗 Invitar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 mb-5">
        {[{ id:"plans", label:"Planes", icon:"📋" }, { id:"progress", label:"Progreso", icon:"📊" }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === "plans" && (
        loading ? <div className="text-center py-8 text-slate-400">Cargando...</div>
        : prescriptions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <p className="text-4xl mb-2">📋</p><p className="text-slate-400">Sin planes prescritos</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {prescriptions.map((pres, i) => (
              <div key={pres.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <button onClick={() => setActivePres(activePres === pres.id ? null : pres.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{i === 0 ? "🟢 Plan actual" : `Plan #${prescriptions.length - i}`}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(pres.created_at).toLocaleDateString("es-CO", { day:"numeric", month:"long", year:"numeric" })}
                      {" · "}{pres.exercises?.length || 0} ejercicios
                    </p>
                  </div>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${activePres === pres.id ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                {activePres === pres.id && (
                  <div className="border-t border-slate-100 p-4">
                    {pres.note && (
                      <div className="bg-teal-50 rounded-xl p-3 mb-3 flex gap-2">
                        <span>📝</span>
                        <p className="text-sm text-teal-800">{pres.note}</p>
                      </div>
                    )}
                    {BLOCKS.concat(["Sin bloque"]).map(blockName => {
                      const exList = (pres.exercises || []).filter(e => (e.block || "Sin bloque") === blockName);
                      if (!exList.length) return null;
                      const style = BLOCK_STYLES[blockName] || { bg:"bg-slate-50", border:"border-slate-200", text:"text-slate-600", icon:"📋" };
                      return (
                        <div key={blockName} className="mb-3">
                          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-2 ${style.bg} border ${style.border}`}>
                            <span>{style.icon}</span>
                            <span className={`font-semibold text-xs ${style.text}`}>{blockName}</span>
                          </div>
                          {exList.map((ex, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5 mb-1.5">
                              <p className="text-sm font-medium text-slate-800">{ex.name}</p>
                              <p className="text-xs font-bold text-teal-600">{ex.sets} × {ex.reps}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === "progress" && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <PatientProgressView patient={patient} />
        </div>
      )}
    </div>
  );
}

// ─── PATIENTS LIST ─────────────────────────────────────────────────────────────
function PatientsView({ user, onPrescribe, onViewProfile }) {
  const [patients, setPatients]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [showInvite, setShowInvite] = useState(null);
  const [form, setForm] = useState({ name:"", age:"", condition:"", next_session:"", email:"" });

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    const { data } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
    setPatients(data || []); setLoading(false);
  };

  const addPatient = async () => {
    if (!form.name) return;
    const token = crypto.randomUUID();
    const { data, error } = await supabase.from("patients")
      .insert({ ...form, therapist_id: user.id, age: parseInt(form.age) || null, invite_token: token })
      .select().single();
    setForm({ name:"", age:"", condition:"", next_session:"", email:"" });
    setShowForm(false);
    fetchPatients();
    if (data && !error) setShowInvite(data);
  };

  const initials = (name) => name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {showInvite && <InviteModal patient={showInvite} onClose={() => setShowInvite(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800">Mis Pacientes</h2>
          <p className="text-slate-400 text-sm mt-0.5">{patients.length} pacientes activos</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold transition-colors shadow-sm">
          + Nuevo
        </button>
      </div>

      {showForm && (
        <div className="bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-3xl p-5 mb-5 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4 text-sm">Nuevo paciente</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nombre completo *"
              className="col-span-2 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Correo" type="email"
              className="col-span-2 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
            <input value={form.age} onChange={e => setForm({...form, age: e.target.value})} placeholder="Edad" type="number"
              className="border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
            <input value={form.next_session} onChange={e => setForm({...form, next_session: e.target.value})} type="date"
              className="border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
            <input value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} placeholder="Diagnóstico"
              className="col-span-2 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
            <div className="col-span-2 flex gap-2">
              <button onClick={addPatient} className="flex-1 bg-teal-600 text-white py-2.5 rounded-2xl text-sm font-semibold hover:bg-teal-700 transition-colors">Guardar y generar link</button>
              <button onClick={() => setShowForm(false)} className="bg-white text-slate-500 px-4 py-2.5 rounded-2xl text-sm font-medium border border-slate-200">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente..."
          className="w-full border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white shadow-sm" />
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-100">
          <p className="text-5xl mb-3">👤</p>
          <p className="font-medium">No hay pacientes aún</p>
          <p className="text-sm mt-1">Agrega tu primer paciente arriba</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(p => (
            <div key={p.id} onClick={() => onViewProfile(p)}
              className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md hover:border-teal-200 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <Avatar initials={initials(p.name)} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{p.name}</span>
                    {p.user_id && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">✓ Activo</span>}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5 truncate">{p.condition || "Sin diagnóstico"}{p.age ? ` · ${p.age} años` : ""}</p>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => onPrescribe(p)}
                    className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors">
                    💪 Prescribir
                  </button>
                  {p.invite_token && (
                    <button onClick={() => setShowInvite(p)}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs px-2 py-1.5 rounded-xl transition-colors">
                      🔗
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PRESCRIBE ────────────────────────────────────────────────────────────────
function PrescribeView({ user, patient, onBack }) {
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("Todos");
  const [selectedBlock, setSelectedBlock] = useState("Trabajo central");
  const [selected, setSelected]     = useState({ "Terapia": [], "Calentamiento / Activación": [], "Trabajo central": [] });
  const [note, setNote]             = useState("");
  const [submitted, setSubmitted]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [activeBlock, setActiveBlock] = useState("Trabajo central");

  const filtered = EXERCISES.filter(ex => {
    const matchCat = category === "Todos" || ex.category === category;
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase()) || ex.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const allSelected = Object.values(selected).flat();
  const isInBlock = (ex, block) => selected[block]?.find(e => e.id === ex.id);
  const isAnyBlock = (ex) => allSelected.find(e => e.id === ex.id);

  const addExercise = (ex) => {
    if (isAnyBlock(ex)) return;
    setSelected(prev => ({
      ...prev,
      [activeBlock]: [...prev[activeBlock], { ...ex, sets: ex.defaultSets, reps: ex.defaultReps, block: activeBlock }]
    }));
  };

  const removeExercise = (ex, block) => {
    setSelected(prev => ({ ...prev, [block]: prev[block].filter(e => e.id !== ex.id) }));
  };

  const updateExercise = (id, block, field, value) => {
    setSelected(prev => ({
      ...prev,
      [block]: prev[block].map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const send = async () => {
    const allExercises = BLOCKS.flatMap(b => (selected[b] || []).map(e => ({ ...e, block: b })));
    if (!allExercises.length) return;
    setLoading(true);
    const { error } = await supabase.from("prescriptions").insert({
      patient_id: patient.id, therapist_id: user.id, exercises: allExercises, note,
    });
    if (!error) setSubmitted(true);
    else alert("Error: " + error.message);
    setLoading(false);
  };

  const totalCount = allSelected.length;
  const initials = patient.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-5 text-4xl shadow-sm">✓</div>
      <h3 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800 mb-2">¡Plan guardado!</h3>
      <p className="text-slate-500 mb-6">Prescribiste <strong>{totalCount} ejercicios</strong> a <strong>{patient.name}</strong></p>
      <button onClick={onBack} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-teal-700 transition-colors">Volver</button>
    </div>
  );

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 mb-5 text-sm font-medium">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Volver
      </button>

      <div className="flex items-center gap-3 mb-6">
        <Avatar initials={initials} size="lg" />
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800">Prescribir</h2>
          <p className="text-slate-400 text-sm">{patient.name} · {patient.condition || "Sin diagnóstico"}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT — Library */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Biblioteca · {EXERCISES.length} ejercicios</p>

          {/* Block selector */}
          <div className="mb-3">
            <p className="text-xs text-slate-500 font-medium mb-2">Agregar al bloque:</p>
            <div className="flex gap-2 flex-wrap">
              {BLOCKS.map(b => {
                const s = BLOCK_STYLES[b];
                return (
                  <button key={b} onClick={() => setActiveBlock(b)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                      activeBlock === b ? `${s.bg} ${s.border} ${s.text} shadow-sm` : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}>
                    {s.icon} {b}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ejercicio..."
              className="w-full border border-slate-200 rounded-2xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
          </div>

          <div className="flex gap-1.5 flex-wrap mb-3">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${category === cat ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="grid gap-2 max-h-[480px] overflow-y-auto pr-1">
            {filtered.map(ex => {
              const inBlock = isAnyBlock(ex);
              const blockOfEx = inBlock ? allSelected.find(e => e.id === ex.id)?.block : null;
              const blockStyle = blockOfEx ? BLOCK_STYLES[blockOfEx] : null;
              return (
                <div key={ex.id}
                  className={`p-3 rounded-2xl border-2 transition-all ${inBlock ? `${blockStyle?.bg || "bg-slate-50"} ${blockStyle?.border || "border-slate-200"}` : "border-slate-100 bg-white hover:border-slate-300"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{ex.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{ex.description}</p>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{ex.category}</span>
                        {blockOfEx && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${blockStyle?.text} bg-white/70`}>{blockStyle?.icon} {blockOfEx}</span>}
                      </div>
                    </div>
                    <button onClick={() => inBlock ? removeExercise(ex, blockOfEx) : addExercise(ex)}
                      className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors ${inBlock ? "bg-white/70 text-slate-500 hover:bg-red-50 hover:text-red-500" : "bg-teal-50 text-teal-700 hover:bg-teal-100"}`}>
                      {inBlock ? "✕" : "+"}
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">Sin resultados</div>}
          </div>
        </div>

        {/* RIGHT — Plan */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Plan · {totalCount} ejercicios</p>

          {totalCount === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-10 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 mb-4">
              <p className="text-3xl mb-2">💪</p>
              Selecciona ejercicios de la biblioteca
            </div>
          ) : (
            <div className="grid gap-3 max-h-[420px] overflow-y-auto pr-1 mb-4">
              {BLOCKS.map(blockName => {
                const exList = selected[blockName];
                if (!exList.length) return null;
                const style = BLOCK_STYLES[blockName];
                return (
                  <div key={blockName}>
                    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-2 ${style.bg} border ${style.border}`}>
                      <span>{style.icon}</span>
                      <span className={`font-bold text-xs ${style.text}`}>{blockName}</span>
                      <span className={`ml-auto text-xs font-semibold ${style.text} bg-white/60 px-1.5 py-0.5 rounded-full`}>{exList.length}</span>
                    </div>
                    {exList.map((ex, i) => (
                      <div key={ex.id} className="bg-white border border-slate-100 rounded-2xl p-3 mb-2 shadow-sm">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-bold ${style.text}`}>#{i+1}</span>
                            <p className="font-semibold text-slate-800 text-sm leading-tight">{ex.name}</p>
                          </div>
                          <button onClick={() => removeExercise(ex, blockName)} className="text-slate-300 hover:text-red-400 text-xl leading-none flex-shrink-0 transition-colors">×</button>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-slate-400 block mb-1">Series</label>
                            <input type="number" value={ex.sets} min="1" onChange={e => updateExercise(ex.id, blockName, "sets", e.target.value)}
                              className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 text-center font-bold" />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-slate-400 block mb-1">Reps / Tiempo</label>
                            <input type="text" value={ex.reps} onChange={e => updateExercise(ex.id, blockName, "reps", e.target.value)}
                              className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 text-center font-bold" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Nota para el paciente (indicaciones, frecuencia, precauciones...)"
            className="w-full border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none mb-3 bg-white" rows={3} />

          <button onClick={send} disabled={!totalCount || loading}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all shadow-sm ${totalCount > 0 ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
            {loading ? "Guardando..." : `Guardar plan · ${totalCount} ejercicios`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AGENDA ───────────────────────────────────────────────────────────────────
function AgendaView({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_name:"", date:"", time:"", type:"Presencial" });

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    const { data } = await supabase.from("appointments").select("*").order("date", { ascending: true });
    setAppointments(data || []); setLoading(false);
  };

  const addAppointment = async () => {
    if (!form.patient_name || !form.date) return;
    await supabase.from("appointments").insert({ ...form, therapist_id: user.id });
    setForm({ patient_name:"", date:"", time:"", type:"Presencial" });
    setShowForm(false); fetchAppointments();
  };

  const typeColors = { Presencial: "bg-blue-50 text-blue-700", Videollamada: "bg-violet-50 text-violet-700" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800">Agenda</h2>
          <p className="text-slate-400 text-sm mt-0.5">{appointments.length} citas</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold transition-colors shadow-sm">
          + Nueva cita
        </button>
      </div>

      {showForm && (
        <div className="bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-3xl p-5 mb-5 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.patient_name} onChange={e => setForm({...form, patient_name: e.target.value})} placeholder="Nombre del paciente *"
              className="col-span-2 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
            <input value={form.date} onChange={e => setForm({...form, date: e.target.value})} type="date"
              className="border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
            <input value={form.time} onChange={e => setForm({...form, time: e.target.value})} type="time"
              className="border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
              className="col-span-2 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white">
              <option>Presencial</option><option>Videollamada</option>
            </select>
            <div className="col-span-2 flex gap-2">
              <button onClick={addAppointment} className="flex-1 bg-teal-600 text-white py-2.5 rounded-2xl text-sm font-semibold hover:bg-teal-700">Guardar</button>
              <button onClick={() => setShowForm(false)} className="bg-white text-slate-500 px-4 py-2.5 rounded-2xl text-sm font-medium border border-slate-200">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-16"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        : appointments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
            <p className="text-5xl mb-3">📅</p><p className="text-slate-400 font-medium">No hay citas programadas</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {appointments.map(apt => (
              <div key={apt.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="bg-teal-50 rounded-2xl px-3 py-3 text-center min-w-[64px] border border-teal-100">
                    <p className="text-teal-700 font-bold text-lg leading-none">{apt.time || "--"}</p>
                    <p className="text-teal-400 text-xs mt-1">{apt.date}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{apt.patient_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${typeColors[apt.type] || "bg-slate-100 text-slate-500"}`}>{apt.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
function MessagesView({ user }) {
  const [messages, setMessages] = useState([]);
  const [active, setActive]     = useState(null);
  const [reply, setReply]       = useState("");
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
    setMessages(data || []);
    if (data?.length > 0) setActive(data[0]);
    setLoading(false);
  };

  const sendReply = async () => {
    if (!reply.trim() || !active) return;
    await supabase.from("messages").insert({ therapist_id: user.id, patient_name: active.patient_name, content: reply, sender: "therapist", unread: false });
    setReply(""); fetchMessages();
  };

  const initials = (name) => name ? name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() : "?";

  return (
    <div>
      <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800 mb-6">Mensajes</h2>
      {loading ? <div className="text-center py-16"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        : messages.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
            <p className="text-5xl mb-3">💬</p><p className="text-slate-400 font-medium">Sin mensajes aún</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-5 gap-4 h-[520px]">
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-y-auto shadow-sm">
              {messages.map(msg => (
                <button key={msg.id} onClick={() => setActive(msg)}
                  className={`w-full p-4 text-left border-b border-slate-50 hover:bg-slate-50 transition-colors ${active?.id === msg.id ? "bg-teal-50 border-l-2 border-l-teal-500" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 text-white rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {initials(msg.patient_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{msg.patient_name}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{msg.content}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="md:col-span-3 bg-white rounded-2xl border border-slate-100 flex flex-col shadow-sm">
              {active && (
                <>
                  <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 text-white rounded-xl flex items-center justify-center text-xs font-bold">
                      {initials(active.patient_name)}
                    </div>
                    <p className="font-semibold text-slate-800">{active.patient_name}</p>
                  </div>
                  <div className="flex-1 p-4">
                    <div className={`rounded-2xl p-3 max-w-xs text-sm ${active.sender === "therapist" ? "bg-teal-600 text-white ml-auto rounded-tr-sm" : "bg-slate-50 text-slate-800 rounded-tl-sm"}`}>
                      {active.content}
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex gap-2">
                    <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()} placeholder="Escribe tu respuesta..."
                      className="flex-1 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-slate-50" />
                    <button onClick={sendReply} className="bg-teal-600 hover:bg-teal-700 text-white w-11 h-11 rounded-2xl flex items-center justify-center transition-colors flex-shrink-0">
                      <svg className="w-4 h-4 rotate-90" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

// ─── INVITE HANDLER ────────────────────────────────────────────────────────────
function InviteHandler({ token, user }) {
  const [status, setStatus] = useState("linking");
  useEffect(() => {
    supabase.from("patients").update({ user_id: user.id }).eq("invite_token", token)
      .then(({ error }) => {
        window.history.replaceState({}, "", window.location.pathname);
        setStatus(error ? "error" : "success");
        if (!error) setTimeout(() => window.location.reload(), 1500);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center bg-white rounded-3xl p-8 shadow-sm border border-slate-100 max-w-xs w-full">
        {status === "linking" && <><div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-slate-500">Vinculando tu cuenta...</p></>}
        {status === "success" && <><div className="text-5xl mb-4">✅</div><p className="text-emerald-600 font-semibold text-lg">¡Listo!</p><p className="text-slate-400 text-sm mt-1">Cargando tu plan...</p></>}
        {status === "error" && <><div className="text-5xl mb-4">⚠️</div><p className="text-red-500 font-semibold">Error al vincular</p><p className="text-slate-400 text-sm mt-1">Contacta a tu fisioterapeuta</p></>}
      </div>
    </div>
  );
}

// ─── THERAPIST APP ─────────────────────────────────────────────────────────────
function TherapistApp({ user }) {
  const [tab, setTab]                 = useState("patients");
  const [prescribePatient, setPrescribePatient] = useState(null);
  const [profilePatient, setProfilePatient]     = useState(null);

  const handleViewProfile = (p) => { setProfilePatient(p); setPrescribePatient(null); };
  const handlePrescribe   = (p) => { setPrescribePatient(p); setProfilePatient(null); };
  const handleBack        = ()  => { setPrescribePatient(null); setProfilePatient(null); };

  const navItems = [
    { id: "patients", icon: "👤", label: "Pacientes" },
    { id: "agenda",   icon: "📅", label: "Agenda" },
    { id: "messages", icon: "💬", label: "Mensajes" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">F</div>
            <span style={{ fontFamily: "'Fraunces', serif" }} className="font-bold text-slate-800 text-lg">FisioApp</span>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">Salir</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-5">
        <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 mb-6">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); handleBack(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === item.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <span>{item.icon}</span><span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 pb-10">
        {tab === "patients" && !prescribePatient && !profilePatient && <PatientsView user={user} onPrescribe={handlePrescribe} onViewProfile={handleViewProfile} />}
        {tab === "patients" && prescribePatient && <PrescribeView user={user} patient={prescribePatient} onBack={handleBack} />}
        {tab === "patients" && profilePatient && <PatientProfile patient={profilePatient} user={user} onBack={handleBack} onPrescribe={handlePrescribe} />}
        {tab === "agenda" && <AgendaView user={user} />}
        {tab === "messages" && <MessagesView user={user} />}
      </main>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]               = useState(undefined); // undefined = still loading
  const [role, setRole]               = useState(null);
  const [inviteToken, setInviteToken] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (token) setInviteToken(token);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setRole(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setRole(null); return; }
    supabase.from("patients").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setRole(data ? "patient" : "therapist"));
  }, [user]);

  // Still checking session
  if (user === undefined) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Cargando...</p>
      </div>
    </div>
  );

  // Not logged in
  if (!user) return <LoginView />;

  // Logged in but role not loaded yet
  if (role === null) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (inviteToken) return <InviteHandler token={inviteToken} user={user} />;
  if (role === "patient") return <PatientApp user={user} />;
  return <TherapistApp user={user} />;
}
