import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const BLOCK_COLORS = {
  "Terapia":                { bg: "bg-rose-50",    border: "border-rose-200",   text: "text-rose-700",   dot: "bg-rose-400",   icon: "🩺" },
  "Calentamiento / Activación": { bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-700",  dot: "bg-amber-400",  icon: "🔥" },
  "Trabajo central":        { bg: "bg-teal-50",    border: "border-teal-200",   text: "text-teal-700",   dot: "bg-teal-400",   icon: "💪" },
  "Sin bloque":             { bg: "bg-slate-50",   border: "border-slate-200",  text: "text-slate-600",  dot: "bg-slate-300",  icon: "📋" },
};

function getBlockStyle(block) {
  return BLOCK_COLORS[block] || BLOCK_COLORS["Sin bloque"];
}

function ProgressRing({ pct, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#0d9488" strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

function ProgressDashboard({ patient, prescriptions, completedLogs }) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d;
  });
  const logsPerDay = last7.map(day => ({
    day, count: completedLogs.filter(l =>
      new Date(l.completed_at).toDateString() === day.toDateString()).length
  }));
  const maxCount = Math.max(...logsPerDay.map(d => d.count), 1);
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (completedLogs.some(l => new Date(l.completed_at).toDateString() === d.toDateString())) streak++;
    else if (i > 0) break;
  }
  const latestPres = prescriptions[0];
  const totalEx = latestPres?.exercises?.length || 0;
  const todayDone = completedLogs.filter(l =>
    new Date(l.completed_at).toDateString() === new Date().toDateString()).length;
  const todayPct = totalEx > 0 ? Math.round((todayDone / totalEx) * 100) : 0;
  const dayShort = ["D","L","M","X","J","V","S"];

  return (
    <div className="pb-6">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-teal-700 p-6 mb-5 text-white">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-teal-100 text-sm mb-1">Progreso de hoy</p>
            <p className="text-4xl font-bold">{todayDone}<span className="text-2xl text-teal-200">/{totalEx}</span></p>
            <p className="text-teal-100 text-sm mt-1">ejercicios completados</p>
          </div>
          <div className="relative flex items-center justify-center">
            <ProgressRing pct={todayPct} size={90} />
            <span className="absolute text-lg font-bold">{todayPct}%</span>
          </div>
        </div>
        {todayPct === 100 && (
          <div className="relative mt-3 bg-white/20 rounded-xl px-3 py-2 text-sm font-medium">
            🎉 ¡Completaste todo tu plan de hoy!
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { val: streak, label: "Racha", emoji: "🔥", color: "from-orange-400 to-rose-500" },
          { val: completedLogs.length, label: "Total", emoji: "✅", color: "from-blue-400 to-indigo-500" },
          { val: prescriptions.length, label: "Planes", emoji: "📋", color: "from-violet-400 to-purple-500" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-3 text-center shadow-sm">
            <p className="text-xl mb-0.5">{s.emoji}</p>
            <p className="text-2xl font-bold text-slate-800">{s.val}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-4 shadow-sm">
        <p className="font-semibold text-slate-700 text-sm mb-4">Últimos 7 días</p>
        <div className="flex items-end justify-between gap-2 h-24">
          {logsPerDay.map(({ day, count }, i) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                {count > 0 && <span className="text-xs font-semibold text-slate-500">{count}</span>}
                <div className="w-full rounded-xl transition-all duration-500 min-h-[4px]"
                  style={{
                    height: `${count > 0 ? Math.max((count / maxCount) * 80, 12) : 4}px`,
                    background: isToday ? "linear-gradient(135deg,#0d9488,#14b8a6)" :
                      count > 0 ? "#99f6e4" : "#f1f5f9"
                  }} />
                <span className={`text-xs font-medium ${isToday ? "text-teal-600" : "text-slate-400"}`}>
                  {dayShort[day.getDay()]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar heatmap */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <p className="font-semibold text-slate-700 text-sm mb-3">Consistencia (30 días)</p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 30 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (29 - i));
            const count = completedLogs.filter(l =>
              new Date(l.completed_at).toDateString() === d.toDateString()).length;
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <div key={i} title={`${d.toLocaleDateString("es-CO")}: ${count} ej.`}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold
                  ${isToday ? "ring-2 ring-teal-500 ring-offset-1" : ""}
                  ${count === 0 ? "bg-slate-100 text-slate-300" :
                    count <= 2 ? "bg-teal-100 text-teal-600" :
                    count <= 5 ? "bg-teal-300 text-teal-800" :
                    "bg-teal-500 text-white"}`}>
                {d.getDate()}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-slate-400">Menos</span>
          {["bg-slate-100","bg-teal-100","bg-teal-300","bg-teal-500"].map((c,i) => (
            <div key={i} className={`w-4 h-4 rounded-md ${c}`} />
          ))}
          <span className="text-xs text-slate-400">Más</span>
        </div>
      </div>
    </div>
  );
}

export default function PatientApp({ user }) {
  const [patient, setPatient]           = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [completedLogs, setCompletedLogs] = useState([]);
  const [messages, setMessages]         = useState([]);
  const [reply, setReply]               = useState("");
  const [tab, setTab]                   = useState("exercises");
  const [loading, setLoading]           = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data: p } = await supabase.from("patients").select("*").eq("user_id", user.id).single();
    if (!p) { setLoading(false); return; }
    setPatient(p);
    const [{ data: pres }, { data: logs }, { data: msgs }] = await Promise.all([
      supabase.from("prescriptions").select("*").eq("patient_id", p.id).order("created_at", { ascending: false }),
      supabase.from("exercise_logs").select("*").eq("patient_id", p.id),
      supabase.from("messages").select("*").eq("patient_name", p.name).order("created_at", { ascending: true }),
    ]);
    setPrescriptions(pres || []);
    setCompletedLogs(logs || []);
    setMessages(msgs || []);
    setLoading(false);
  };

  const markComplete = async (prescriptionId, exerciseId) => {
    const done = completedLogs.find(l =>
      l.prescription_id === prescriptionId && l.exercise_id === exerciseId &&
      new Date(l.completed_at).toDateString() === new Date().toDateString()
    );
    if (done) await supabase.from("exercise_logs").delete().eq("id", done.id);
    else await supabase.from("exercise_logs").insert({ patient_id: patient.id, prescription_id: prescriptionId, exercise_id: exerciseId });
    fetchAll();
  };

  const sendMessage = async () => {
    if (!reply.trim()) return;
    await supabase.from("messages").insert({
      therapist_id: patient.therapist_id, patient_name: patient.name, content: reply, sender: "patient", unread: true
    });
    setReply(""); fetchAll();
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Cargando tu plan...</p>
      </div>
    </div>
  );

  if (!patient) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center bg-white rounded-3xl p-8 shadow-sm border border-slate-100 max-w-xs w-full">
        <p className="text-5xl mb-4">🔗</p>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Cuenta no vinculada</h2>
        <p className="text-slate-500 text-sm mb-5">Pídele a tu fisioterapeuta el link de acceso.</p>
        <button onClick={() => supabase.auth.signOut()} className="text-sm text-teal-600 font-medium hover:underline">Cerrar sesión</button>
      </div>
    </div>
  );

  const latestPres      = prescriptions[0];
  const totalEx         = latestPres?.exercises?.length || 0;
  const todayDone       = completedLogs.filter(l =>
    new Date(l.completed_at).toDateString() === new Date().toDateString()).length;
  const todayPct        = totalEx > 0 ? Math.round((todayDone / totalEx) * 100) : 0;
  const firstName       = patient.name.split(" ")[0];

  const navItems = [
    { id: "exercises", icon: "💪", label: "Plan" },
    { id: "progress",  icon: "📊", label: "Progreso" },
    { id: "messages",  icon: "💬", label: "Chat" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">F</div>
          <div>
            <p className="font-bold text-slate-800 text-sm" style={{ fontFamily: "'Fraunces', serif" }}>FisioApp</p>
            <p className="text-xs text-slate-400">Hola, {firstName} 👋</p>
          </div>
        </div>
        {totalEx > 0 && (
          <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-3 py-1.5">
            <div className="w-16 h-1.5 bg-teal-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${todayPct}%` }} />
            </div>
            <span className="text-xs font-semibold text-teal-600">{todayPct}%</span>
          </div>
        )}
      </div>

      <main className="max-w-lg mx-auto px-4 pt-5">

        {/* EXERCISES TAB */}
        {tab === "exercises" && (
          <div>
            {prescriptions.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-6xl mb-4">🏋️</p>
                <p className="font-semibold text-slate-700 text-lg">Sin plan asignado</p>
                <p className="text-slate-400 text-sm mt-1">Tu fisioterapeuta aún no ha cargado tu rutina</p>
              </div>
            ) : (
              prescriptions.map((pres, pi) => {
                // Group exercises by block
                const blocks = {};
                (pres.exercises || []).forEach(ex => {
                  const b = ex.block || "Sin bloque";
                  if (!blocks[b]) blocks[b] = [];
                  blocks[b].push(ex);
                });
                const blockOrder = ["Terapia","Calentamiento / Activación","Trabajo central","Sin bloque"];
                const sortedBlocks = blockOrder.filter(b => blocks[b]);

                return (
                  <div key={pres.id} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="font-bold text-slate-800 text-xl" style={{ fontFamily: "'Fraunces', serif" }}>
                          {pi === 0 ? "Tu plan actual" : `Plan anterior ${pi}`}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(pres.created_at).toLocaleDateString("es-CO", { day:"numeric", month:"long" })}
                          {" · "}{pres.exercises?.length || 0} ejercicios
                        </p>
                      </div>
                    </div>

                    {pres.note && (
                      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-4 flex gap-3">
                        <span className="text-xl">📝</span>
                        <div>
                          <p className="text-xs text-teal-600 font-semibold mb-0.5">Nota de tu fisio</p>
                          <p className="text-sm text-teal-800">{pres.note}</p>
                        </div>
                      </div>
                    )}

                    {sortedBlocks.map(blockName => {
                      const style = getBlockStyle(blockName);
                      const exList = blocks[blockName];
                      const blockDone = exList.filter(ex =>
                        completedLogs.find(l =>
                          l.prescription_id === pres.id && l.exercise_id === ex.id &&
                          new Date(l.completed_at).toDateString() === new Date().toDateString()
                        )
                      ).length;

                      return (
                        <div key={blockName} className="mb-5">
                          {/* Block header */}
                          <div className={`flex items-center justify-between rounded-2xl px-4 py-3 mb-2 ${style.bg} border ${style.border}`}>
                            <div className="flex items-center gap-2">
                              <span>{style.icon}</span>
                              <span className={`font-semibold text-sm ${style.text}`}>{blockName}</span>
                            </div>
                            <span className={`text-xs font-semibold ${style.text} bg-white/70 px-2 py-0.5 rounded-full`}>
                              {blockDone}/{exList.length}
                            </span>
                          </div>

                          {/* Exercises */}
                          <div className="grid gap-2 pl-2">
                            {exList.map(ex => {
                              const isDone = !!completedLogs.find(l =>
                                l.prescription_id === pres.id && l.exercise_id === ex.id &&
                                new Date(l.completed_at).toDateString() === new Date().toDateString()
                              );
                              return (
                                <div key={ex.id}
                                  className={`bg-white rounded-2xl border-2 p-4 transition-all duration-200 ${isDone ? "border-emerald-200 bg-emerald-50" : "border-slate-100"}`}>
                                  <div className="flex items-start gap-3">
                                    <button
                                      onClick={() => pi === 0 && markComplete(pres.id, ex.id)}
                                      className={`mt-0.5 w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                                        isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-teal-400 hover:bg-teal-50"
                                      }`}>
                                      {isDone && <svg className="w-3.5 h-3.5" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className={`font-semibold text-sm leading-snug ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
                                          {ex.name}
                                        </p>
                                        <div className="text-right flex-shrink-0 ml-2">
                                          <p className="text-xs font-bold text-teal-600">{ex.sets} × {ex.reps}</p>
                                        </div>
                                      </div>
                                      {ex.description && (
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ex.description}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PROGRESS TAB */}
        {tab === "progress" && (
          <ProgressDashboard patient={patient} prescriptions={prescriptions} completedLogs={completedLogs} />
        )}

        {/* MESSAGES TAB */}
        {tab === "messages" && (
          <div className="flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-3">
              {messages.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <p className="text-5xl mb-3">💬</p>
                  <p className="font-medium">Escríbele a tu fisioterapeuta</p>
                </div>
              ) : messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    msg.sender === "patient"
                      ? "bg-teal-600 text-white rounded-tr-sm"
                      : "bg-white text-slate-800 border border-slate-100 rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <input value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 border border-slate-200 bg-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
              <button onClick={sendMessage}
                className="bg-teal-600 hover:bg-teal-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-colors flex-shrink-0">
                <svg className="w-5 h-5 rotate-90" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-2 z-20 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all ${
                tab === item.id ? "bg-teal-50" : ""
              }`}>
              <span className="text-xl">{item.icon}</span>
              <span className={`text-xs font-medium ${tab === item.id ? "text-teal-600" : "text-slate-400"}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
