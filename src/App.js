import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { EXERCISES, CATEGORIES } from "./exercises";
import PatientApp from "./PatientApp";

function Avatar({ initials, size = "md" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" };
  return (
    <div className={`${sizes[size]} bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
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

// ─── LOGIN ────────────────────────────────────────────────────────────────────
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold">F</div>
          <span style={{ fontFamily: "'Fraunces', serif" }} className="font-bold text-slate-800 text-xl">FisioApp</span>
        </div>
        <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800 mb-1">
          {isRegister ? "Crear cuenta" : "Bienvenido"}
        </h2>
        <p className="text-slate-500 text-sm mb-6">{isRegister ? "Crea tu cuenta" : "Inicia sesión para continuar"}</p>
        <div className="grid gap-3">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" type="email"
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" type="password"
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            onKeyDown={e => e.key === "Enter" && handle()} />
        </div>
        {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
        <button onClick={handle} disabled={loading}
          className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
          {loading ? "Cargando..." : isRegister ? "Crear cuenta" : "Iniciar sesión"}
        </button>
        <p className="text-center text-xs text-slate-500 mt-4">
          {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
          <button onClick={() => setIsRegister(!isRegister)} className="text-teal-600 font-medium hover:underline">
            {isRegister ? "Inicia sesión" : "Regístrate"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── PATIENTS ─────────────────────────────────────────────────────────────────
function PatientsView({ user, onPrescribe }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", condition: "", next_session: "", email: "" });
  const [inviteLink, setInviteLink] = useState(null);
  const [invitePatient, setInvitePatient] = useState(null);

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    const { data } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
    setPatients(data || []); setLoading(false);
  };

  const addPatient = async () => {
    if (!form.name) return;
    const token = crypto.randomUUID();
    const { data } = await supabase.from("patients").insert({
      ...form, therapist_id: user.id, age: parseInt(form.age) || null, invite_token: token
    }).select().single();
    setForm({ name: "", age: "", condition: "", next_session: "", email: "" });
    setShowForm(false);
    if (data) generateInviteLink(data);
    fetchPatients();
  };

  const generateInviteLink = (patient) => {
    const token = patient.invite_token;
    const link = `${window.location.origin}?invite=${token}`;
    setInviteLink(link);
    setInvitePatient(patient);
  };

  const initials = (name) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {inviteLink && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 style={{ fontFamily: "'Fraunces', serif" }} className="font-bold text-slate-800 text-lg mb-1">¡Paciente creado!</h3>
            <p className="text-slate-500 text-sm mb-4">Envíale este link a <strong>{invitePatient?.name}</strong> para que acceda a su plan:</p>
            <div className="bg-slate-50 rounded-xl p-3 mb-4 break-all text-xs text-slate-600 border border-slate-200">{inviteLink}</div>
            <div className="flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(inviteLink); }}
                className="flex-1 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors">
                📋 Copiar link
              </button>
              <button onClick={() => { setInviteLink(null); setInvitePatient(null); }}
                className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800">Mis Pacientes</h2>
          <p className="text-slate-500 text-sm mt-0.5">{patients.length} pacientes</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <span className="text-lg leading-none">+</span> Nuevo paciente
        </button>
      </div>

      {showForm && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-4 grid grid-cols-2 gap-3">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo *"
            className="col-span-2 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Correo del paciente" type="email"
            className="col-span-2 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
          <input value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="Edad" type="number"
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
          <input value={form.next_session} onChange={e => setForm({ ...form, next_session: e.target.value })} type="date"
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
          <input value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} placeholder="Diagnóstico / condición"
            className="col-span-2 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
          <div className="col-span-2 flex gap-2">
            <button onClick={addPatient} className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors">Guardar y generar link</button>
            <button onClick={() => setShowForm(false)} className="bg-white text-slate-500 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente..."
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
      </div>

      {loading ? <div className="text-center py-12 text-slate-400">Cargando pacientes...</div>
        : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400"><p className="text-4xl mb-3">👤</p><p>No hay pacientes aún.</p></div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <Avatar initials={initials(p.name)} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">{p.name}</span>
                      <StatusBadge status={p.status} />
                      {p.user_id && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✓ Activo</span>}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{p.condition || "Sin diagnóstico"}{p.age ? ` · ${p.age} años` : ""}</p>
                    {p.email && <p className="text-xs text-slate-400 mt-0.5">{p.email}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-col items-end">
                    <button onClick={() => onPrescribe(p)} className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors">Prescribir</button>
                    {p.invite_token && (
                      <button onClick={() => generateInviteLink(p)} className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors">🔗 Link</button>
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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtered = EXERCISES.filter(ex => {
    const matchCat = category === "Todos" || ex.category === category;
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase()) || ex.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addExercise = (ex) => {
    if (selected.find(e => e.id === ex.id)) return;
    setSelected(prev => [...prev, { ...ex, sets: ex.defaultSets, reps: ex.defaultReps }]);
  };

  const removeExercise = (id) => setSelected(prev => prev.filter(e => e.id !== id));
  const updateExercise = (id, field, value) => setSelected(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));

  const send = async () => {
    if (!selected.length) return;
    setLoading(true);
    await supabase.from("prescriptions").insert({ patient_id: patient.id, therapist_id: user.id, exercises: selected, note });
    setSubmitted(true); setLoading(false);
  };

  const initials = patient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-3xl">✓</div>
      <h3 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800 mb-2">¡Plan guardado!</h3>
      <p className="text-slate-500 mb-6">Plan prescrito a <strong>{patient.name}</strong> con {selected.length} ejercicios.</p>
      <button onClick={onBack} className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors">Volver a pacientes</button>
    </div>
  );

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4 text-sm transition-colors">← Volver</button>
      <div className="flex items-center gap-3 mb-5">
        <Avatar initials={initials} size="lg" />
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800">Prescribir ejercicios</h2>
          <p className="text-slate-500 text-sm">{patient.name} · {patient.condition || "Sin diagnóstico"}</p>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider">Biblioteca ({EXERCISES.length} ejercicios)</h3>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ejercicio..."
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white mb-3" />
          <div className="flex gap-1.5 flex-wrap mb-3">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${category === cat ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="grid gap-2 max-h-[500px] overflow-y-auto pr-1">
            {filtered.map(ex => {
              const isSel = selected.find(e => e.id === ex.id);
              return (
                <div key={ex.id} className={`p-3 rounded-xl border-2 transition-all ${isSel ? "border-teal-400 bg-teal-50" : "border-slate-100 bg-white hover:border-slate-300"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{ex.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ex.description}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{ex.category}</span>
                        <span className="text-xs text-slate-400">{ex.defaultSets} series · {ex.defaultReps}</span>
                      </div>
                    </div>
                    <button onClick={() => isSel ? removeExercise(ex.id) : addExercise(ex)}
                      className={`flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${isSel ? "bg-teal-600 text-white" : "bg-teal-50 text-teal-700 hover:bg-teal-100"}`}>
                      {isSel ? "✓" : "+"}
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No se encontraron ejercicios</div>}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider">Plan ({selected.length} ejercicios)</h3>
          {selected.length === 0 ? (
            <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200">Selecciona ejercicios de la biblioteca</div>
          ) : (
            <div className="grid gap-2 max-h-[380px] overflow-y-auto pr-1 mb-4">
              {selected.map((ex, i) => (
                <div key={ex.id} className="bg-white border border-slate-200 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-teal-600 font-medium">#{i + 1}</span>
                      <p className="font-medium text-slate-800 text-sm leading-tight">{ex.name}</p>
                      <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{ex.category}</span>
                    </div>
                    <button onClick={() => removeExercise(ex.id)} className="text-slate-300 hover:text-red-400 transition-colors text-xl leading-none flex-shrink-0">×</button>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-slate-400 block mb-1">Series</label>
                      <input type="number" value={ex.sets} min="1" onChange={e => updateExercise(ex.id, "sets", e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 text-center font-semibold" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-slate-400 block mb-1">Reps / Tiempo</label>
                      <input type="text" value={ex.reps} onChange={e => updateExercise(ex.id, "reps", e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 text-center font-semibold" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Nota para el paciente..."
            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none mb-3" rows={3} />
          <button onClick={send} disabled={!selected.length || loading}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${selected.length > 0 ? "bg-teal-600 text-white hover:bg-teal-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
            {loading ? "Guardando..." : `Guardar plan (${selected.length} ejercicios)`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AGENDA ──────────────────────────────────────────────────────────────────
function AgendaView({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_name: "", date: "", time: "", type: "Presencial" });

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    const { data } = await supabase.from("appointments").select("*").order("date", { ascending: true });
    setAppointments(data || []); setLoading(false);
  };

  const addAppointment = async () => {
    if (!form.patient_name || !form.date) return;
    await supabase.from("appointments").insert({ ...form, therapist_id: user.id });
    setForm({ patient_name: "", date: "", time: "", type: "Presencial" });
    setShowForm(false); fetchAppointments();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800">Agenda</h2>
          <p className="text-slate-500 text-sm mt-0.5">{appointments.length} citas</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <span>+</span> Nueva cita
        </button>
      </div>
      {showForm && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-4 grid grid-cols-2 gap-3">
          <input value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} placeholder="Nombre del paciente *"
            className="col-span-2 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
          <input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} type="date"
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
          <input value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} type="time"
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
            className="col-span-2 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white">
            <option>Presencial</option><option>Videollamada</option>
          </select>
          <div className="col-span-2 flex gap-2">
            <button onClick={addAppointment} className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors">Guardar</button>
            <button onClick={() => setShowForm(false)} className="bg-white text-slate-500 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200">Cancelar</button>
          </div>
        </div>
      )}
      {loading ? <div className="text-center py-12 text-slate-400">Cargando...</div>
        : appointments.length === 0 ? <div className="text-center py-12 text-slate-400"><p className="text-4xl mb-3">📅</p><p>No hay citas aún.</p></div>
        : (
          <div className="grid gap-3">
            {appointments.map(apt => (
              <div key={apt.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-4">
                  <div className="text-center bg-teal-50 rounded-xl px-3 py-2 min-w-[60px]">
                    <p className="text-teal-700 font-bold text-lg leading-none">{apt.time || "--:--"}</p>
                    <p className="text-teal-500 text-xs mt-1">{apt.date}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{apt.patient_name}</p>
                    <div className="flex gap-2 mt-1"><StatusBadge status={apt.type} /><StatusBadge status={apt.status} /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── MESSAGES ────────────────────────────────────────────────────────────────
function MessagesView({ user }) {
  const [messages, setMessages] = useState([]);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
    setMessages(data || []);
    if (data && data.length > 0) setActive(data[0]);
    setLoading(false);
  };

  const sendReply = async () => {
    if (!reply.trim() || !active) return;
    await supabase.from("messages").insert({ therapist_id: user.id, patient_name: active.patient_name, content: reply, sender: "therapist", unread: false });
    setReply(""); fetchMessages();
  };

  const initials = (name) => name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div>
      <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-800 mb-6">Mensajes</h2>
      {loading ? <div className="text-center py-12 text-slate-400">Cargando...</div>
        : messages.length === 0 ? <div className="text-center py-12 text-slate-400"><p className="text-4xl mb-3">💬</p><p>No hay mensajes aún.</p></div>
        : (
          <div className="grid md:grid-cols-5 gap-4 h-[500px]">
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-y-auto">
              {messages.map(msg => (
                <div key={msg.id} onClick={() => setActive(msg)}
                  className={`p-4 cursor-pointer border-b border-slate-50 hover:bg-slate-50 ${active?.id === msg.id ? "bg-teal-50 border-l-2 border-l-teal-500" : ""}`}>
                  <div className="flex items-start gap-3">
                    <Avatar initials={initials(msg.patient_name)} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{msg.patient_name}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="md:col-span-3 bg-white rounded-2xl border border-slate-100 flex flex-col">
              {active && (
                <>
                  <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                    <Avatar initials={initials(active.patient_name)} size="sm" />
                    <p className="font-semibold text-slate-800">{active.patient_name}</p>
                  </div>
                  <div className="flex-1 p-4">
                    <div className={`rounded-2xl p-3 max-w-xs text-sm ${active.sender === "therapist" ? "bg-teal-600 text-white ml-auto rounded-tr-none" : "bg-slate-50 rounded-tl-none"}`}>
                      {active.content}
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex gap-2">
                    <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()} placeholder="Escribe tu respuesta..."
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
                    <button onClick={sendReply} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-medium">Enviar</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

// ─── INVITE HANDLER ───────────────────────────────────────────────────────────
function InviteHandler({ token, user }) {
  const [status, setStatus] = useState("linking");

  useEffect(() => {
    const linkAccount = async () => {
      const { error } = await supabase
        .from("patients")
        .update({ user_id: user.id })
        .eq("invite_token", token);
      setStatus(error ? "error" : "success");
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    };
    linkAccount();
  }, [token, user]);

  if (status === "linking") return <div className="min-h-screen flex items-center justify-center text-slate-400">Vinculando tu cuenta...</div>;
  if (status === "error") return <div className="min-h-screen flex items-center justify-center text-red-400">Error al vincular. Contacta a tu fisioterapeuta.</div>;
  return <div className="min-h-screen flex items-center justify-center text-emerald-600 text-lg font-semibold">✓ ¡Cuenta vinculada! Recargando...</div>;
}

// ─── THERAPIST APP ────────────────────────────────────────────────────────────
function TherapistApp({ user }) {
  const [tab, setTab] = useState("patients");
  const [prescribePatient, setPrescribePatient] = useState(null);

  const navItems = [
    { id: "patients", label: "Pacientes", icon: "👤" },
    { id: "agenda", label: "Agenda", icon: "📅" },
    { id: "messages", label: "Mensajes", icon: "💬" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">F</div>
            <span style={{ fontFamily: "'Fraunces', serif" }} className="font-bold text-slate-800 text-lg">FisioApp</span>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-xs text-slate-400 hover:text-slate-600">Cerrar sesión</button>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="flex gap-1 bg-white rounded-2xl p-1 border border-slate-100 mb-6">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setPrescribePatient(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.id ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-700"}`}>
              <span>{item.icon}</span><span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      <main className="max-w-5xl mx-auto px-4 pb-10">
        {tab === "patients" && !prescribePatient && <PatientsView user={user} onPrescribe={setPrescribePatient} />}
        {tab === "patients" && prescribePatient && <PrescribeView user={user} patient={prescribePatient} onBack={() => setPrescribePatient(null)} />}
        {tab === "agenda" && <AgendaView user={user} />}
        {tab === "messages" && <MessagesView user={user} />}
      </main>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPatient, setIsPatient] = useState(false);
  const [inviteToken, setInviteToken] = useState(null);
  const [inviteHandled, setInviteHandled] = useState(false);

  useEffect(() => {
    // Check for invite token in URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (token) setInviteToken(token);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) checkRole();
  }, [user]);

  const checkRole = async () => {
    // Check if this user is a patient
    const { data } = await supabase.from("patients").select("id").eq("user_id", user.id).single();
    setIsPatient(!!data);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando...</div>;
  if (!user) return <LoginView />;

  // Handle invite link after login
  if (inviteToken && !inviteHandled) {
    return <InviteHandler token={inviteToken} user={user} onDone={() => { setInviteHandled(true); checkRole(); }} />;
  }

  // Route based on role
  if (isPatient) return <PatientApp user={user} />;
  return <TherapistApp user={user} />;
}
