import { useState } from "react";

const MOCK_PATIENTS = [
  { id: 1, name: "María García", age: 34, condition: "Lumbalgia crónica", nextSession: "2026-03-12", status: "activo", avatar: "MG", sessions: 8 },
  { id: 2, name: "Carlos Pérez", age: 52, condition: "Rehabilitación post-rodilla", nextSession: "2026-03-13", status: "activo", avatar: "CP", sessions: 15 },
  { id: 3, name: "Lucía Torres", age: 28, condition: "Tendinitis hombro", nextSession: "2026-03-15", status: "activo", avatar: "LT", sessions: 3 },
  { id: 4, name: "Andrés Mora", age: 45, condition: "Cervicalgia", nextSession: "2026-03-18", status: "pendiente", avatar: "AM", sessions: 1 },
];

const EXERCISE_LIBRARY = [
  { id: 1, name: "Puente glúteo", category: "Lumbar", sets: 3, reps: 15, description: "Tumbado boca arriba, elevar cadera contrayendo glúteos.", duration: "30 seg" },
  { id: 2, name: "Plancha isométrica", category: "Core", sets: 3, reps: 1, description: "Mantener posición de plancha con espalda recta.", duration: "30 seg" },
  { id: 3, name: "Rotación cervical", category: "Cervical", sets: 2, reps: 10, description: "Girar la cabeza lentamente a cada lado.", duration: "20 seg" },
  { id: 4, name: "Estiramiento isquiotibiales", category: "Pierna", sets: 2, reps: 1, description: "Extender pierna y mantener estiramiento.", duration: "30 seg" },
  { id: 5, name: "Elevación lateral hombro", category: "Hombro", sets: 3, reps: 12, description: "Elevar brazo lateralmente con banda elástica.", duration: "40 seg" },
  { id: 6, name: "Bird Dog", category: "Core", sets: 3, reps: 10, description: "En cuadrupedia, extender brazo y pierna opuestos.", duration: "45 seg" },
];

const APPOINTMENTS = [
  { id: 1, patient: "María García", date: "2026-03-12", time: "09:00", type: "Presencial", status: "confirmada" },
  { id: 2, patient: "Carlos Pérez", date: "2026-03-13", time: "10:30", type: "Presencial", status: "confirmada" },
  { id: 3, patient: "Lucía Torres", date: "2026-03-15", time: "11:00", type: "Videollamada", status: "pendiente" },
  { id: 4, patient: "Andrés Mora", date: "2026-03-18", time: "16:00", type: "Presencial", status: "pendiente" },
];

const MESSAGES = [
  { id: 1, patient: "María García", avatar: "MG", message: "¡Buenos días! Hice los ejercicios de ayer, sentí un poco de dolor en el lado derecho.", time: "Hace 2h", unread: true },
  { id: 2, patient: "Carlos Pérez", avatar: "CP", message: "¿Puedo hacer los ejercicios de pierna hoy o espero a la sesión?", time: "Hace 5h", unread: true },
  { id: 3, patient: "Lucía Torres", avatar: "LT", message: "Perfecto, confirmo la cita del viernes 🙏", time: "Ayer", unread: false },
];

function Avatar({ initials, size = "md", color = "teal" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" };
  const colors = { teal: "bg-teal-100 text-teal-700", blue: "bg-blue-100 text-blue-700" };
  return (
    <div className={`${sizes[size]} ${colors[color]} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    activo: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    pendiente: "bg-amber-50 text-amber-700 border border-amber-200",
    confirmada: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Presencial: "bg-blue-50 text-blue-700 border border-blue-200",
    Videollamada: "bg-violet-50 text-violet-700 border border-violet-200",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function PatientsView({ onPrescribe }) {
  const [search, setSearch] = useState("");
  const filtered = MOCK_PATIENTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800">Mis Pacientes</h2>
          <p className="text-slate-500 text-sm mt-0.5">{MOCK_PATIENTS.length} pacientes activos</p>
        </div>
        <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <span className="text-lg leading-none">+</span> Nuevo paciente
        </button>
      </div>
      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente..."
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
      </div>
      <div className="grid gap-3">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <Avatar initials={p.avatar} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800">{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{p.condition} · {p.age} años</p>
                <p className="text-xs text-slate-400 mt-1">Próxima cita: {p.nextSession} · {p.sessions} sesiones</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => onPrescribe(p)} className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors">Prescribir</button>
                <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors">Ver plan</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrescribeView({ patient, onBack }) {
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggle = (ex) => setSelectedExercises(prev =>
    prev.find(e => e.id === ex.id) ? prev.filter(e => e.id !== ex.id) : [...prev, ex]
  );

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-3xl">✓</div>
        <h3 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800 mb-2">¡Plan enviado!</h3>
        <p className="text-slate-500 mb-6">El plan fue prescrito a <strong>{patient.name}</strong></p>
        <button onClick={onBack} className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors">Volver a pacientes</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm transition-colors">← Volver</button>
      <div className="flex items-center gap-3 mb-6">
        <Avatar initials={patient.avatar} size="lg" />
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800">Prescribir ejercicios</h2>
          <p className="text-slate-500 text-sm">{patient.name} · {patient.condition}</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider">Biblioteca de ejercicios</h3>
          <div className="grid gap-2">
            {EXERCISE_LIBRARY.map(ex => {
              const selected = selectedExercises.find(e => e.id === ex.id);
              return (
                <div key={ex.id} onClick={() => toggle(ex)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selected ? "border-teal-400 bg-teal-50" : "border-slate-100 bg-white hover:border-slate-300"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{ex.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{ex.description}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{ex.category}</span>
                      <p className="text-xs text-slate-400 mt-1">{ex.sets}x{ex.reps}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider">Plan seleccionado ({selectedExercises.length})</h3>
          {selectedExercises.length === 0 ? (
            <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200">Selecciona ejercicios de la biblioteca</div>
          ) : (
            <div className="grid gap-2 mb-4">
              {selectedExercises.map((ex, i) => (
                <div key={ex.id} className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-teal-600 font-medium">#{i + 1}</span>
                    <p className="font-medium text-slate-800 text-sm">{ex.name}</p>
                    <p className="text-xs text-slate-500">{ex.sets} series · {ex.reps} reps · {ex.duration}</p>
                  </div>
                  <button onClick={() => toggle(ex)} className="text-slate-400 hover:text-red-500 transition-colors text-lg leading-none">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <label className="text-sm font-medium text-slate-700 block mb-2">Video del ejercicio (opcional)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-white cursor-pointer hover:border-teal-300 transition-colors">
              <p className="text-slate-400 text-sm">📎 Arrastra o haz clic para subir video</p>
              <p className="text-xs text-slate-300 mt-1">MP4, MOV · Máx 100MB</p>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-slate-700 block mb-2">Nota para el paciente</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Indicaciones adicionales, frecuencia semanal, precauciones..."
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none" rows={3} />
          </div>
          <button onClick={() => selectedExercises.length > 0 && setSubmitted(true)} disabled={selectedExercises.length === 0}
            className={`w-full mt-4 py-3 rounded-xl font-semibold text-sm transition-all ${selectedExercises.length > 0 ? "bg-teal-600 text-white hover:bg-teal-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
            Enviar plan al paciente
          </button>
        </div>
      </div>
    </div>
  );
}

function AgendaView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800">Agenda</h2>
          <p className="text-slate-500 text-sm mt-0.5">Semana del 11–18 marzo 2026</p>
        </div>
        <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <span className="text-lg leading-none">+</span> Nueva cita
        </button>
      </div>
      <div className="grid gap-3">
        {APPOINTMENTS.map(apt => (
          <div key={apt.id} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="text-center bg-teal-50 rounded-xl px-3 py-2 min-w-[60px]">
                <p className="text-teal-700 font-bold text-lg leading-none">{apt.time}</p>
                <p className="text-teal-500 text-xs mt-1">{apt.date.split("-")[2]} mar</p>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{apt.patient}</p>
                <div className="flex gap-2 mt-1">
                  <StatusBadge status={apt.type} />
                  <StatusBadge status={apt.status} />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors">Editar</button>
                {apt.type === "Videollamada" && (
                  <button className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors">Iniciar</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagesView() {
  const [active, setActive] = useState(MESSAGES[0]);
  const [reply, setReply] = useState("");
  return (
    <div>
      <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800 mb-6">Mensajes</h2>
      <div className="grid md:grid-cols-5 gap-4 h-[500px]">
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-y-auto">
          {MESSAGES.map(msg => (
            <div key={msg.id} onClick={() => setActive(msg)}
              className={`p-4 cursor-pointer border-b border-slate-50 hover:bg-slate-50 transition-colors ${active?.id === msg.id ? "bg-teal-50 border-l-2 border-l-teal-500" : ""}`}>
              <div className="flex items-start gap-3">
                <Avatar initials={msg.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800 text-sm">{msg.patient}</p>
                    {msg.unread && <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0"></span>}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{msg.message}</p>
                  <p className="text-xs text-slate-300 mt-1">{msg.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="md:col-span-3 bg-white rounded-2xl border border-slate-100 flex flex-col">
          {active ? (
            <>
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <Avatar initials={active.avatar} size="sm" />
                <p className="font-semibold text-slate-800">{active.patient}</p>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="bg-slate-50 rounded-2xl rounded-tl-none p-3 max-w-xs">
                  <p className="text-sm text-slate-700">{active.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{active.time}</p>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 flex gap-2">
                <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Escribe tu respuesta..."
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
                <button onClick={() => setReply("")} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">Enviar</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Selecciona una conversación</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("patients");
  const [prescribePatient, setPrescribePatient] = useState(null);
  const unread = MESSAGES.filter(m => m.unread).length;
  const navItems = [
    { id: "patients", label: "Pacientes", icon: "👤" },
    { id: "agenda", label: "Agenda", icon: "📅" },
    { id: "messages", label: "Mensajes", icon: "💬", badge: unread },
  ];
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">F</div>
            <span style={{ fontFamily: "'Fraunces', serif" }} className="font-bold text-slate-800 text-lg">FisioApp</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 text-xs font-bold">DR</div>
            <span className="text-sm text-slate-600 font-medium hidden sm:block">Dr. Rodríguez</span>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Pacientes activos", value: "4", icon: "👤", color: "bg-teal-50 border-teal-100" },
            { label: "Citas esta semana", value: "4", icon: "📅", color: "bg-blue-50 border-blue-100" },
            { label: "Mensajes nuevos", value: `${unread}`, icon: "💬", color: "bg-violet-50 border-violet-100" },
          ].map(s => (
            <div key={s.label} className={`${s.color} border rounded-2xl p-4 text-center`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex gap-1 bg-white rounded-2xl p-1 border border-slate-100 mb-6">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setPrescribePatient(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.id ? "bg-teal-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
              {item.badge > 0 && (
                <span className={`text-xs px-1.5 rounded-full font-bold ${tab === item.id ? "bg-white text-teal-600" : "bg-teal-600 text-white"}`}>{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <main className="max-w-4xl mx-auto px-4 pb-10">
        {tab === "patients" && !prescribePatient && <PatientsView onPrescribe={setPrescribePatient} />}
        {tab === "patients" && prescribePatient && <PrescribeView patient={prescribePatient} onBack={() => setPrescribePatient(null)} />}
        {tab === "agenda" && <AgendaView />}
        {tab === "messages" && <MessagesView />}
      </main>
    </div>
  );
}
