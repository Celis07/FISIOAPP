import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function PatientApp({ user }) {
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [completedLogs, setCompletedLogs] = useState([]);
  const [tab, setTab] = useState("exercises");
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    // Get patient profile linked to this user
    const { data: patientData } = await supabase
      .from("patients")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (patientData) {
      setPatient(patientData);

      // Get prescriptions
      const { data: presData } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("patient_id", patientData.id)
        .order("created_at", { ascending: false });
      setPrescriptions(presData || []);

      // Get completed logs
      const { data: logs } = await supabase
        .from("exercise_logs")
        .select("*")
        .eq("patient_id", patientData.id);
      setCompletedLogs(logs || []);

      // Get messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("patient_name", patientData.name)
        .order("created_at", { ascending: true });
      setMessages(msgs || []);
    }
    setLoading(false);
  };

  const markComplete = async (prescriptionId, exerciseId) => {
    const alreadyDone = completedLogs.find(
      l => l.prescription_id === prescriptionId && l.exercise_id === exerciseId
    );
    if (alreadyDone) {
      await supabase.from("exercise_logs").delete().eq("id", alreadyDone.id);
    } else {
      await supabase.from("exercise_logs").insert({
        patient_id: patient.id,
        prescription_id: prescriptionId,
        exercise_id: exerciseId,
      });
    }
    fetchPatientData();
  };

  const sendMessage = async () => {
    if (!reply.trim() || !patient) return;
    await supabase.from("messages").insert({
      therapist_id: patient.therapist_id,
      patient_name: patient.name,
      content: reply,
      sender: "patient",
      unread: true,
    });
    setReply("");
    fetchPatientData();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando tu plan...</div>
  );

  if (!patient) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Cuenta no vinculada</h2>
        <p className="text-slate-500 text-sm">Tu cuenta no está asociada a ningún paciente. Contacta a tu fisioterapeuta.</p>
        <button onClick={() => supabase.auth.signOut()} className="mt-4 text-sm text-teal-600 hover:underline">Cerrar sesión</button>
      </div>
    </div>
  );

  const latestPrescription = prescriptions[0];
  const totalExercises = latestPrescription?.exercises?.length || 0;
  const completedToday = completedLogs.filter(
    l => l.prescription_id === latestPrescription?.id &&
    new Date(l.completed_at).toDateString() === new Date().toDateString()
  ).length;
  const progress = totalExercises > 0 ? Math.round((completedToday / totalExercises) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">F</div>
            <div>
              <span style={{ fontFamily: "'Fraunces', serif" }} className="font-bold text-slate-800">FisioApp</span>
              <p className="text-xs text-slate-400 leading-none">Hola, {patient.name.split(" ")[0]} 👋</p>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-xs text-slate-400 hover:text-slate-600">Salir</button>
        </div>
      </header>

      {/* Progress bar */}
      {latestPrescription && (
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">Progreso de hoy</span>
              <span className="text-xs font-semibold text-teal-600">{completedToday}/{totalExercises} ejercicios</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-white rounded-2xl p-1 border border-slate-100 mb-5">
          {[
            { id: "exercises", label: "Mis ejercicios", icon: "💪" },
            { id: "messages", label: "Mensajes", icon: "💬" },
            { id: "history", label: "Historial", icon: "📋" },
          ].map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.id ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-700"}`}>
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-10">
        {/* EXERCISES TAB */}
        {tab === "exercises" && (
          <div>
            {prescriptions.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <p className="text-5xl mb-4">🏋️</p>
                <p className="font-medium">Aún no tienes ejercicios prescritos</p>
                <p className="text-sm mt-1">Tu fisioterapeuta pronto te asignará un plan</p>
              </div>
            ) : (
              <div>
                {prescriptions.map((pres, pi) => (
                  <div key={pres.id} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 style={{ fontFamily: "'Fraunces', serif" }} className="font-bold text-slate-800 text-lg">
                        {pi === 0 ? "Plan actual" : `Plan anterior ${pi}`}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {new Date(pres.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}
                      </span>
                    </div>

                    {pres.note && (
                      <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-3">
                        <p className="text-xs text-teal-600 font-medium mb-1">📝 Nota de tu fisio</p>
                        <p className="text-sm text-teal-800">{pres.note}</p>
                      </div>
                    )}

                    <div className="grid gap-3">
                      {pres.exercises?.map((ex, i) => {
                        const isDone = completedLogs.find(
                          l => l.prescription_id === pres.id &&
                          l.exercise_id === ex.id &&
                          new Date(l.completed_at).toDateString() === new Date().toDateString()
                        );
                        return (
                          <div key={ex.id}
                            className={`bg-white rounded-2xl border-2 p-4 transition-all ${isDone ? "border-emerald-300 bg-emerald-50" : "border-slate-100"}`}>
                            <div className="flex items-start gap-3">
                              <button onClick={() => pi === 0 && markComplete(pres.id, ex.id)}
                                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all mt-0.5 ${isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-teal-400"}`}>
                                {isDone && <span className="text-sm">✓</span>}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className={`font-semibold text-sm ${isDone ? "text-emerald-800 line-through" : "text-slate-800"}`}>
                                      {ex.name}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">{ex.description}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-xs font-bold text-teal-600">{ex.sets} series</p>
                                    <p className="text-xs text-slate-500">{ex.reps}</p>
                                  </div>
                                </div>
                                <span className="inline-block mt-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                  {ex.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MESSAGES TAB */}
        {tab === "messages" && (
          <div className="bg-white rounded-2xl border border-slate-100 flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-100">
              <p className="font-semibold text-slate-800 text-sm">Tu fisioterapeuta</p>
            </div>
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <p className="text-3xl mb-2">💬</p>
                  <p>Inicia la conversación con tu fisioterapeuta</p>
                </div>
              ) : messages.map(msg => (
                <div key={msg.id}
                  className={`rounded-2xl p-3 max-w-xs text-sm ${msg.sender === "patient" ? "bg-teal-600 text-white self-end rounded-tr-none" : "bg-slate-100 text-slate-800 self-start rounded-tl-none"}`}>
                  {msg.content}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-2">
              <input value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
              <button onClick={sendMessage}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                Enviar
              </button>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <div>
            <h3 style={{ fontFamily: "'Fraunces', serif" }} className="font-bold text-slate-800 text-lg mb-4">Historial de sesiones</h3>
            {completedLogs.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <p className="text-5xl mb-4">📋</p>
                <p>Aún no has completado ningún ejercicio</p>
                <p className="text-sm mt-1">¡Empieza hoy y verás tu progreso aquí!</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {Object.entries(
                  completedLogs.reduce((acc, log) => {
                    const date = new Date(log.completed_at).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(log);
                    return acc;
                  }, {})
                ).map(([date, logs]) => (
                  <div key={date} className="bg-white rounded-2xl border border-slate-100 p-4">
                    <p className="font-semibold text-slate-700 text-sm capitalize mb-2">{date}</p>
                    <p className="text-2xl font-bold text-teal-600">{logs.length} <span className="text-sm font-normal text-slate-400">ejercicios completados</span></p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
