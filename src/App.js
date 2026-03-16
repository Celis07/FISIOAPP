import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { EXERCISES, CATEGORIES } from "./exercises";
import PatientApp from "./PatientApp";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:      "#0f1117",
  surface: "#1a1d27",
  card:    "#21253a",
  cardHov: "#262b42",
  border:  "#2d3348",
  accent:  "#26a69a",
  accentL: "#80cbc4",
  text:    "#e2e8f0",
  muted:   "#8892a4",
  dim:     "#4a5270",
  danger:  "#f87171",
};

const BLOCKS = ["Terapia","Calentamiento / Activación","Trabajo central"];
const BLOCK_META = {
  "Terapia":                { color:"#f87171", bg:"rgba(248,113,113,0.12)", icon:"T" },
  "Calentamiento / Activación": { color:"#fbbf24", bg:"rgba(251,191,36,0.12)",  icon:"C" },
  "Trabajo central":        { color:"#34d399", bg:"rgba(52,211,153,0.12)",  icon:"W" },
  "Sin bloque":             { color:"#8892a4", bg:"rgba(136,146,164,0.1)",  icon:"G" },
};

const inp = { background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"10px 14px", fontSize:14, color:C.text, outline:"none", width:"100%" };

function Avatar({ name, size=40 }) {
  const initials = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:size/3.5, background:`linear-gradient(135deg,${C.accent},#1a7a75)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:size/3.2, flexShrink:0 }}>
      {initials}
    </div>
  );
}



// SVG Icons
const Icon = {
  patients: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  agenda:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  messages: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  payments: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  dashboard:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  logout:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  collapse: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 19l-7-7 7-7M19 19l-7-7 7-7"/></svg>,
  copy:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  send:     <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{transform:"rotate(90deg)"}}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>,
  link:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  plus:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  back:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  trash:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  edit:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  video:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
};


// ─── PAYMENT INFO ─────────────────────────────────────────────────────────────
const PAYMENT_INFO = {
  bank:   "Bancolombia",
  type:   "Cuenta de Ahorros",
  number: "316 50472414",
  holder: "Manuel Celis",
  nequi:  "",
  alias:  "",
};
function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:48 }}>
      <div style={{ width:32, height:32, border:`3px solid ${C.accent}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}


// Format date as local YYYY-MM-DD (avoids UTC offset bug)
function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

// ─── LOGIN ──────────────────────────────────────────────────────────────────
function LoginView() {
  const [email,setEmail]       = useState("");
  const [pass,setPass]         = useState("");
  const [name,setName]         = useState("");
  const [isReg,setIsReg]       = useState(false);
  const [isForgot,setIsForgot] = useState(false);
  const [loading,setLoading]   = useState(false);
  const [error,setError]       = useState("");
  const [success,setSuccess]   = useState("");

  const handleForgot = async () => {
    if(!email.trim()) { setError("Ingresa tu correo electrónico"); return; }
    setLoading(true); setError(""); setSuccess("");
    const {error} = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    if(error) setError(error.message);
    else setSuccess("Te enviamos un correo con el link para restablecer tu contraseña.");
    setLoading(false);
  };

  const handle = async () => {
    setLoading(true); setError("");
    if(isReg) {
      if(!name.trim()) { setError("Ingresa tu nombre completo"); setLoading(false); return; }
      const {data, error} = await supabase.auth.signUp({
        email, password:pass,
        options:{ data:{ full_name: name.trim() } }
      });
      if(error) setError(error.message);
    } else {
      const {error} = await supabase.auth.signInWithPassword({email,password:pass});
      if(error) setError(error.message);
    }
    setLoading(false);
  };

  const inp2 = { background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"11px 14px", fontSize:14, color:C.text, outline:"none", width:"100%" };

  // ── Forgot password screen
  if(isForgot) return (
    <div style={{ minHeight:"100vh", background:`radial-gradient(ellipse at top,#0d2020 0%,${C.bg} 60%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:52, height:52, background:`linear-gradient(135deg,${C.accent},#1a7a75)`, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", boxShadow:`0 0 32px rgba(38,166,154,0.3)` }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"1.6rem", color:C.text, margin:0 }}>FisioApp</h1>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"22px 20px" }}>
          <h2 style={{ color:C.text, fontSize:"1rem", fontWeight:700, margin:"0 0 6px" }}>Recuperar contraseña</h2>
          <p style={{ color:C.muted, fontSize:"0.85rem", margin:"0 0 16px", lineHeight:1.5 }}>
            Ingresa tu correo y te enviaremos un link para crear una nueva contraseña.
          </p>
          {!success ? (
            <>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Correo electrónico" type="email"
                style={{...inp2, marginBottom:12}} onKeyDown={e=>e.key==="Enter"&&handleForgot()}/>
              {error && <div style={{ background:"rgba(239,83,80,0.1)", border:"1px solid rgba(239,83,80,0.3)", borderRadius:10, padding:"8px 12px", color:C.danger, fontSize:13, marginBottom:12 }}>{error}</div>}
              <button onClick={handleForgot} disabled={loading}
                style={{ width:"100%", background:C.accentG, border:"none", borderRadius:12, padding:12, color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", opacity:loading?0.7:1, marginBottom:12 }}>
                {loading?"Enviando...":"Enviar link de recuperación"}
              </button>
            </>
          ) : (
            <div style={{ background:"rgba(102,187,106,0.1)", border:"1px solid rgba(102,187,106,0.3)", borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
              <p style={{ color:C.success, fontSize:14, margin:0, lineHeight:1.6 }}>✓ {success}</p>
            </div>
          )}
          <button onClick={()=>{ setIsForgot(false); setError(""); setSuccess(""); }}
            style={{ width:"100%", background:"transparent", border:`1px solid ${C.border}`, borderRadius:12, padding:11, color:C.muted, cursor:"pointer", fontSize:14 }}>
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:`radial-gradient(ellipse at top,#0d2020 0%,${C.bg} 60%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:52, height:52, background:C.accentG, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", boxShadow:`0 0 32px rgba(38,166,154,0.3)` }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"1.7rem", color:C.text, margin:0 }}>FisioApp</h1>
          <p style={{ color:C.muted, fontSize:"0.85rem", marginTop:5 }}>Tu plataforma de fisioterapia</p>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"22px 20px" }}>
          <h2 style={{ color:C.text, fontSize:"1rem", fontWeight:600, margin:"0 0 16px" }}>
            {isReg?"Crear cuenta":"Iniciar sesión"}
          </h2>
          <div style={{ display:"grid", gap:11, marginBottom:14 }}>
            {isReg && (
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre completo *" type="text" style={inp2}/>
            )}
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Correo electrónico" type="email" style={inp2}/>
            <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Contraseña" type="password" style={inp2}
              onKeyDown={e=>e.key==="Enter"&&handle()}/>
          </div>
          {error && <div style={{ background:"rgba(239,83,80,0.1)", border:"1px solid rgba(239,83,80,0.3)", borderRadius:10, padding:"8px 12px", color:C.danger, fontSize:13, marginBottom:12 }}>{error}</div>}
          <button onClick={handle} disabled={loading}
            style={{ width:"100%", background:C.accentG, border:"none", borderRadius:12, padding:12, color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", opacity:loading?0.7:1, boxShadow:`0 4px 20px rgba(38,166,154,0.25)`, marginBottom:12 }}>
            {loading?"Cargando...":isReg?"Crear cuenta":"Entrar"}
          </button>
          {!isReg && (
            <button onClick={()=>{ setIsForgot(true); setError(""); }}
              style={{ width:"100%", background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:"0.85rem", marginBottom:8, padding:"2px 0" }}>
              ¿Olvidaste tu contraseña?
            </button>
          )}
          <p style={{ textAlign:"center", color:C.muted, fontSize:"0.85rem", margin:0 }}>
            {isReg?"¿Ya tienes cuenta?":"¿No tienes cuenta?"}{" "}
            <button onClick={()=>{ setIsReg(!isReg); setError(""); setName(""); }}
              style={{ color:C.accent, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>
              {isReg?"Inicia sesión":"Regístrate"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── INVITE MODAL ─────────────────────────────────────────────────────────────
function InviteModal({ patient, onClose }) {
  const [copied,setCopied] = useState(false);
  const link = `${window.location.origin}?invite=${patient.invite_token}`;
  const copy = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:50, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:16 }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:24, padding:24, width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3d4f7c" strokeWidth="1.5" style={{marginBottom:10}}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          <h3 style={{ fontFamily:"'Fraunces',serif", color:C.text, fontSize:20, margin:0 }}>Link de invitación</h3>
          <p style={{ color:C.muted, fontSize:14, marginTop:6 }}>Envíale este link a <strong style={{color:C.text}}>{patient.name}</strong></p>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:14, marginBottom:16, wordBreak:"break-all", fontSize:12, color:C.muted, fontFamily:"monospace" }}>{link}</div>
        <div style={{ display:"grid", gap:10 }}>
          <button onClick={copy} style={{ background:copied?"#34d399":`linear-gradient(135deg,${C.accent},#1a7a75)`, border:"none", borderRadius:14, padding:13, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:15 }}>{copied?"✓ ¡Copiado!":"Copiar link"}</button>
          <button onClick={onClose} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:13, color:C.muted, cursor:"pointer", fontSize:14 }}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ─── PRESCRIBE / EDIT ────────────────────────────────────────────────────────
function PrescribeView({ user, patient, onBack, existingPrescription }) {
  const isEdit = !!existingPrescription;

  const initBlocks = () => {
    const s = { "Terapia":[], "Calentamiento / Activación":[], "Trabajo central":[] };
    if(isEdit) {
      (existingPrescription.exercises||[]).forEach(ex=>{
        const b = ex.block||"Trabajo central";
        if(s[b]) s[b].push({...ex});
        else s["Trabajo central"].push({...ex});
      });
    }
    return s;
  };

  const [selected,setSelected]     = useState(initBlocks);
  const [note,setNote]             = useState(existingPrescription?.note||"");
  const [activeBlock,setActiveBlock]= useState("Trabajo central");
  const [search,setSearch]         = useState("");
  const [category,setCategory]     = useState("Todos");
  const [submitted,setSubmitted]   = useState(false);
  const [loading,setLoading]       = useState(false);
  const [customExs,setCustomExs]   = useState([]);
  const [showNewEx,setShowNewEx]   = useState(false);
  const [newEx,setNewEx]           = useState({name:"",description:"",category:"Rehabilitacion",default_sets:3,default_reps:"10"});
  const [savingEx,setSavingEx]     = useState(false);

  const refreshCustom = () =>
    supabase.from("custom_exercises").select("*").eq("therapist_id",user.id).order("created_at",{ascending:false})
      .then(({data})=>setCustomExs((data||[]).map(e=>({
        id:"custom_"+e.id, dbId:e.id, name:e.name, description:e.description||"",
        category:e.category||"Personalizado", defaultSets:e.default_sets||3,
        defaultReps:e.default_reps||"10", videoUrl:e.video_url, isCustom:true,
      }))));

  useEffect(()=>{ refreshCustom(); },[user.id]);

  const saveNewEx = async () => {
    if(!newEx.name.trim()) return;
    setSavingEx(true);
    const {data, error} = await supabase.from("custom_exercises").insert({
      therapist_id:user.id, name:newEx.name.trim(), description:newEx.description,
      category:newEx.category, default_block:activeBlock,
      default_sets:parseInt(newEx.default_sets)||3, default_reps:newEx.default_reps,
    }).select().single();
    if(error){ alert("Error al guardar: "+error.message); setSavingEx(false); return; }
    if(data){
      // Use a unique numeric-safe id for the exercise
      const exId = 900000 + Math.floor(Math.random()*99999);
      const ex = {
        id: exId,
        name:data.name, description:data.description||"",
        category:data.category, defaultSets:data.default_sets,
        defaultReps:data.default_reps, isCustom:true, dbId:data.id,
      };
      setCustomExs(prev=>[{...ex,id:"custom_"+data.id},...prev]);
      setSelected(prev=>({
        ...prev,
        [activeBlock]:[...prev[activeBlock],{
          ...ex, sets:ex.defaultSets, reps:ex.defaultReps, block:activeBlock
        }]
      }));
    }
    setNewEx({name:"",description:"",category:"Rehabilitacion",default_sets:3,default_reps:"10"});
    setShowNewEx(false); setSavingEx(false);
  };

  const allExercises = [...customExs, ...EXERCISES];
  const allCategories = ["Todos","Mis ejercicios",...CATEGORIES];

  const filtered = allExercises.filter(ex=>{
    if(category==="Mis ejercicios") return ex.isCustom;
    const mc = category==="Todos"||ex.category===category;
    const ms = ex.name.toLowerCase().includes(search.toLowerCase())||(ex.description||"").toLowerCase().includes(search.toLowerCase());
    return mc&&ms;
  });

  const allSelected   = Object.values(selected).flat();
  const isAnyBlock    = ex => allSelected.find(e=>e.id===ex.id);
  const blockOfEx     = ex => { for(const b of BLOCKS) if(selected[b].find(e=>e.id===ex.id)) return b; return null; };

  const addEx = ex => {
    if(isAnyBlock(ex)) return;
    setSelected(prev=>({...prev,[activeBlock]:[...prev[activeBlock],{...ex,sets:ex.defaultSets,reps:ex.defaultReps,block:activeBlock}]}));
  };
  const removeEx = (ex,block) => setSelected(prev=>({...prev,[block]:prev[block].filter(e=>e.id!==ex.id)}));
  const updateEx = (id,block,field,val) => setSelected(prev=>({...prev,[block]:prev[block].map(e=>e.id===id?{...e,[field]:val}:e)}));

  const send = async () => {
    const allExercises = BLOCKS.flatMap(b=>(selected[b]||[]).map(e=>({...e,block:b})));
    if(!allExercises.length) return;
    setLoading(true);
    if(isEdit) {
      const {error} = await supabase.from("prescriptions").update({exercises:allExercises,note}).eq("id",existingPrescription.id);
      if(!error) setSubmitted(true); else alert("Error: "+error.message);
    } else {
      const {error} = await supabase.from("prescriptions").insert({patient_id:patient.id,therapist_id:user.id,exercises:allExercises,note});
      if(!error) setSubmitted(true); else alert("Error: "+error.message);
    }
    setLoading(false);
  };

  const total = allSelected.length;

  if(submitted) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 16px", textAlign:"center" }}>
      <div style={{ width:72, height:72, background:"rgba(52,211,153,0.15)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:24, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, marginBottom:20 }}>✓</div>
      <h3 style={{ fontFamily:"'Fraunces',serif", color:C.text, fontSize:24, margin:"0 0 8px" }}>{isEdit?"¡Plan actualizado!":"¡Plan guardado!"}</h3>
      <p style={{ color:C.muted, marginBottom:24 }}>{total} ejercicios para <strong style={{color:C.text}}>{patient.name}</strong></p>
      <button onClick={onBack} style={{ background:`linear-gradient(135deg,${C.accent},#1a7a75)`, border:"none", borderRadius:14, padding:"12px 28px", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:15 }}>Volver</button>
    </div>
  );

  return (
    <div>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, color:C.muted, background:"none", border:"none", cursor:"pointer", fontSize:14, fontWeight:500, marginBottom:20 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Volver
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24 }}>
        <Avatar name={patient.name} size={52}/>
        <div>
          <h2 style={{ fontFamily:"'Fraunces',serif", color:C.text, fontSize:22, margin:0 }}>{isEdit?"Editar plan":"Prescribir ejercicios"}</h2>
          <p style={{ color:C.muted, fontSize:14, marginTop:3 }}>{patient.name} · {patient.condition||"Sin diagnóstico"}</p>
        </div>
      </div>

      {/* New exercise modal — outside grid so position:fixed works correctly */}
      {showNewEx && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px 16px", overflowY:"auto" }}>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:24, width:"100%", maxWidth:460, margin:"auto" }}>
            <h3 style={{ color:C.text, fontWeight:700, fontSize:17, margin:"0 0 16px" }}>Nuevo ejercicio</h3>
            <div style={{ display:"grid", gap:11 }}>
              <div>
                <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:4 }}>Nombre *</label>
                <input value={newEx.name} onChange={e=>setNewEx({...newEx,name:e.target.value})} placeholder="Ej: Sentadilla isométrica"
                  style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:11, padding:"10px 13px", fontSize:14, color:C.text, outline:"none", width:"100%" }}/>
              </div>
              <div>
                <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:4 }}>Descripción</label>
                <textarea value={newEx.description} onChange={e=>setNewEx({...newEx,description:e.target.value})} rows={3} placeholder="Cómo se realiza..."
                  style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:11, padding:"10px 13px", fontSize:14, color:C.text, outline:"none", width:"100%", resize:"none", lineHeight:1.5 }}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                <div>
                  <label style={{ fontSize:11, color:C.muted, display:"block", marginBottom:4 }}>Categoría</label>
                  <select value={newEx.category} onChange={e=>setNewEx({...newEx,category:e.target.value})}
                    style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px", fontSize:12, color:C.text, outline:"none", width:"100%" }}>
                    {["Rehabilitacion","Core / Abdomen","Gluteos / Cadera","Pierna / Rodilla","Hombro / Escapular","Pecho / Empuje","Espalda / Traccion","Tobillo / Pie","Cervical / Cuello","Calentamiento","Full Body","Otro"].map(cat=><option key={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:11, color:C.muted, display:"block", marginBottom:4 }}>Series</label>
                  <input type="number" value={newEx.default_sets} min="1" onChange={e=>setNewEx({...newEx,default_sets:e.target.value})}
                    style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px", fontSize:14, color:C.text, outline:"none", width:"100%", textAlign:"center", fontWeight:700 }}/>
                </div>
                <div>
                  <label style={{ fontSize:11, color:C.muted, display:"block", marginBottom:4 }}>Reps</label>
                  <input type="text" value={newEx.default_reps} onChange={e=>setNewEx({...newEx,default_reps:e.target.value})}
                    style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px", fontSize:14, color:C.text, outline:"none", width:"100%", textAlign:"center", fontWeight:700 }}/>
                </div>
              </div>
            </div>
            <p style={{ color:C.muted, fontSize:12, margin:"10px 0 0" }}>Se agregará al bloque: <strong style={{color:C.accentL}}>{activeBlock}</strong></p>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={saveNewEx} disabled={!newEx.name.trim()||savingEx}
                style={{ flex:1, background:C.accentG, border:"none", borderRadius:12, padding:12, color:"#fff", fontWeight:700, cursor:"pointer", opacity:savingEx?0.6:1, fontSize:14 }}>
                {savingEx?"Guardando...":"Crear y agregar al plan"}
              </button>
              <button onClick={()=>setShowNewEx(false)}
                style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 16px", color:C.muted, cursor:"pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
        {/* LEFT - Library */}
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <p style={{ fontSize:11, fontWeight:700, color:C.dim, letterSpacing:2, textTransform:"uppercase", margin:0 }}>Biblioteca · {allExercises.length}</p>
            <button onClick={()=>setShowNewEx(true)}
              style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(38,166,154,0.12)", border:"1px solid rgba(38,166,154,0.25)", borderRadius:9, padding:"5px 10px", color:C.accent, fontSize:12, fontWeight:600, cursor:"pointer" }}>
              {Icon.plus} Crear ejercicio
            </button>
          </div>

          {/* Block selector */}
          <div style={{ marginBottom:14 }}>
            <p style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Agregar al bloque:</p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {BLOCKS.map(b=>{
                const m = BLOCK_META[b];
                return (
                  <button key={b} onClick={()=>setActiveBlock(b)}
                    style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, padding:"6px 12px", borderRadius:10, cursor:"pointer", fontWeight:600, transition:"all 0.2s",
                      background: activeBlock===b ? m.bg : "transparent",
                      border: activeBlock===b ? `1px solid ${m.color}55` : `1px solid ${C.border}`,
                      color: activeBlock===b ? m.color : C.muted
                    }}>
                    {m.icon} {b}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ position:"relative", marginBottom:10 }}>
            <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar ejercicio..." style={{...inp, paddingLeft:36}}/>
          </div>

          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            {allCategories.map(cat=>(
              <button key={cat} onClick={()=>setCategory(cat)}
                style={{ fontSize:11, padding:"4px 10px", borderRadius:20, cursor:"pointer", fontWeight:500, border:"none",
                  background:category===cat?(cat==="Mis ejercicios"?"linear-gradient(135deg,#fbbf24,#f59e0b)":C.accent):"rgba(255,255,255,0.06)",
                  color:category===cat?"#fff":C.muted }}>
                {cat==="Mis ejercicios"?"⭐ "+cat:cat}
              </button>
            ))}
          </div>

          <div style={{ display:"grid", gap:8, maxHeight:480, overflowY:"auto", paddingRight:4 }}>
            {filtered.map(ex=>{
              const bOf = blockOfEx(ex);
              const m   = bOf ? BLOCK_META[bOf] : null;
              return (
                <div key={ex.id} style={{ background: bOf?m.bg:C.card, border:`1px solid ${bOf?m.color+"44":C.border}`, borderRadius:16, padding:12 }}>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <p style={{ color:C.text, fontWeight:600, fontSize:13, margin:0 }}>{ex.name}</p>
                        {ex.isCustom && <span style={{ fontSize:9, background:"rgba(251,191,36,0.2)", color:"#fbbf24", padding:"1px 6px", borderRadius:8, fontWeight:700, flexShrink:0 }}>PROPIO</span>}
                        {ex.videoUrl && <span style={{ fontSize:12 }} title="Tiene video">🎬</span>}
                      </div>
                      <p style={{ color:C.muted, fontSize:11, margin:"3px 0 0" }}>{(ex.description||"").slice(0,60)}{ex.description?.length>60?"...":""}</p>
                      <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                        <span style={{ fontSize:10, background:"rgba(255,255,255,0.07)", color:C.muted, padding:"2px 8px", borderRadius:10 }}>{ex.category}</span>
                        {bOf && <span style={{ fontSize:10, color:m.color, padding:"2px 8px", borderRadius:10, background:m.bg }}>{m.icon} {bOf}</span>}
                      </div>
                    </div>
                    <button onClick={()=>bOf?removeEx(ex,bOf):addEx(ex)}
                      style={{ fontSize:12, padding:"5px 10px", borderRadius:10, cursor:"pointer", fontWeight:700, border:"none", flexShrink:0,
                        background: bOf?"rgba(248,113,113,0.15)":"rgba(38,166,154,0.15)",
                        color: bOf?C.danger:C.accent
                      }}>
                      {bOf?"✕":"+"}
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length===0 && <p style={{ color:C.muted, textAlign:"center", padding:24, fontSize:14 }}>Sin resultados</p>}
          </div>
        </div>

        {/* RIGHT - Plan */}
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:C.dim, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Plan · {total} ejercicios</p>

          {total===0 ? (
            <div style={{ background:C.card, border:`2px dashed ${C.border}`, borderRadius:20, padding:40, textAlign:"center", color:C.dim, fontSize:14, marginBottom:14 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3d4f7c" strokeWidth="1.5" style={{marginBottom:10}}><path d="M6.5 6.5h11M6.5 17.5h11M2 12h20M4 9.5v5M20 9.5v5"/></svg>
              Selecciona ejercicios de la biblioteca
            </div>
          ) : (
            <div style={{ display:"grid", gap:12, maxHeight:400, overflowY:"auto", paddingRight:4, marginBottom:14 }}>
              {BLOCKS.map(blockName=>{
                const exList = selected[blockName];
                if(!exList.length) return null;
                const m = BLOCK_META[blockName];
                return (
                  <div key={blockName}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, background:m.bg, border:`1px solid ${m.color}33`, borderRadius:12, padding:"8px 12px", marginBottom:8 }}>
                      <span>{m.icon}</span>
                      <span style={{ color:m.color, fontWeight:700, fontSize:12 }}>{blockName}</span>
                      <span style={{ marginLeft:"auto", color:m.color, fontSize:11, background:"rgba(0,0,0,0.2)", padding:"1px 7px", borderRadius:8 }}>{exList.length}</span>
                    </div>
                    {exList.map((ex,i)=>(
                      <div key={ex.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:12, marginBottom:8 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                          <div>
                            <span style={{ fontSize:10, color:m.color, fontWeight:700 }}>#{i+1}</span>
                            <p style={{ color:C.text, fontWeight:600, fontSize:13, margin:"2px 0 0" }}>{ex.name}</p>
                          </div>
                          <button onClick={()=>removeEx(ex,blockName)} style={{ background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:18, padding:0 }}>×</button>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <div style={{ flex:1 }}>
                            <label style={{ fontSize:11, color:C.dim, display:"block", marginBottom:4 }}>Series</label>
                            <input type="number" value={ex.sets} min="1" onChange={e=>updateEx(ex.id,blockName,"sets",e.target.value)}
                              style={{...inp, textAlign:"center", fontWeight:700, padding:"8px"}}/>
                          </div>
                          <div style={{ flex:1 }}>
                            <label style={{ fontSize:11, color:C.dim, display:"block", marginBottom:4 }}>Reps / Tiempo</label>
                            <input type="text" value={ex.reps} onChange={e=>updateEx(ex.id,blockName,"reps",e.target.value)}
                              style={{...inp, textAlign:"center", fontWeight:700, padding:"8px"}}/>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Nota para el paciente..." rows={3}
            style={{...inp, resize:"none", marginBottom:12, lineHeight:1.5}}/>
          <button onClick={send} disabled={!total||loading}
            style={{ width:"100%", background:total?`linear-gradient(135deg,${C.accent},#1a7a75)`:"rgba(255,255,255,0.05)", border:"none", borderRadius:14, padding:"13px", color:total?"#fff":C.dim, fontWeight:700, fontSize:15, cursor:total?"pointer":"not-allowed", transition:"all 0.2s", boxShadow:total?`0 4px 20px rgba(38,166,154,0.25)`:"none" }}>
            {loading?"Guardando...":`${isEdit?"Actualizar":"Guardar"} plan · ${total} ejercicios`}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── PDF EXPORT ────────────────────────────────────────────────────────────────
function exportPDF(patient, prescription) {
  if (!prescription) return;

  const BLOCK_COLORS = {
    "Terapia":                "#ef5350",
    "Calentamiento / Activación": "#ffa726",
    "Trabajo central":        "#66bb6a",
    "Sin bloque":             "#7c8db5",
  };

  const blocks = {};
  (prescription.exercises || []).forEach(ex => {
    const b = ex.block || "Sin bloque";
    if (!blocks[b]) blocks[b] = [];
    blocks[b].push(ex);
  });

  const blockOrder = ["Terapia","Calentamiento / Activación","Trabajo central","Sin bloque"];
  const date = new Date(prescription.created_at).toLocaleDateString("es-CO",{day:"numeric",month:"long",year:"numeric"});

  let html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8"/>
      <title>Plan de ejercicios – ${patient.name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; color: #1a1a2e; padding: 32px; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #26a69a; margin-bottom: 24px; }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-box { width: 40px; height: 40px; background: linear-gradient(135deg,#26a69a,#00796b); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 18px; }
        .logo-name { font-size: 20px; font-weight: 800; color: #1a1a2e; }
        .patient-info h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
        .patient-info p { font-size: 13px; color: #666; }
        .meta { text-align: right; }
        .meta p { font-size: 12px; color: #888; }
        .note-box { background: #e8f5e9; border-left: 3px solid #26a69a; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #1b5e20; }
        .block-title { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; margin-top: 20px; }
        .block-dot { width: 10px; height: 10px; border-radius: 50%; }
        .block-label { font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; }
        .ex-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f8f9fa; border-radius: 8px; margin-bottom: 6px; }
        .ex-name { font-weight: 600; font-size: 14px; }
        .ex-cat { font-size: 11px; color: #888; margin-top: 2px; }
        .ex-dose { font-weight: 700; font-size: 14px; color: #26a69a; white-space: nowrap; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; font-size: 11px; color: #aaa; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo" style="margin-bottom:10px">
            <div class="logo-box">F</div>
            <span class="logo-name">FisioApp</span>
          </div>
          <div class="patient-info">
            <h1>${patient.name}</h1>
            <p>${patient.condition || ""}${patient.age ? " · " + patient.age + " años" : ""}</p>
          </div>
        </div>
        <div class="meta">
          <p><strong>Plan de ejercicios</strong></p>
          <p>${date}</p>
          <p>${prescription.exercises?.length || 0} ejercicios</p>
        </div>
      </div>
      ${prescription.note ? '<div class="note-box">📋 ' + prescription.note + '</div>' : ''}
  `;

  blockOrder.forEach(blockName => {
    const exList = blocks[blockName];
    if (!exList || !exList.length) return;
    const color = BLOCK_COLORS[blockName] || "#7c8db5";
    html += `
      <div class="block-title">
        <div class="block-dot" style="background:${color}"></div>
        <span class="block-label" style="color:${color}">${blockName}</span>
      </div>
    `;
    exList.forEach((ex, i) => {
      html += `
        <div class="ex-row">
          <div>
            <div class="ex-name">${i+1}. ${ex.name}</div>
            <div class="ex-cat">${ex.category || ""}</div>
            ${ex.description ? '<div style="font-size:12px;color:#666;margin-top:3px">' + ex.description + '</div>' : ''}
          </div>
          <div class="ex-dose">${ex.sets} × ${ex.reps}</div>
        </div>
      `;
    });
  });

  html += `
      <div class="footer">
        <span>Generado por FisioApp</span>
        <span>${new Date().toLocaleDateString("es-CO")}</span>
      </div>
    </body></html>
  `;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}


// SESSION NOTES VIEW
function SessionNotesView({ patient, user }) {
  const [notes,setNotes]   = useState([]);
  const [loading,setLoad]  = useState(true);
  const [text,setText]     = useState("");
  const [date,setDate]     = useState(new Date().toISOString().split("T")[0]);
  const [saving,setSaving] = useState(false);

  useEffect(()=>{ loadNotes(); },[patient.id]);

  const loadNotes = async () => {
    const {data} = await supabase.from("session_notes").select("*")
      .eq("patient_id",patient.id).order("session_date",{ascending:false});
    setNotes(data||[]); setLoad(false);
  };

  const saveNote = async () => {
    if(!text.trim()) return;
    setSaving(true);
    await supabase.from("session_notes").insert({
      therapist_id:user.id, patient_id:patient.id,
      note:text.trim(), session_date:date
    });
    setText(""); setSaving(false); loadNotes();
  };

  const deleteNote = async (id) => {
    if(!window.confirm("¿Eliminar esta nota?")) return;
    await supabase.from("session_notes").delete().eq("id",id);
    loadNotes();
  };

  return (
    <div>
      {/* New note form */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:18,marginBottom:14}}>
        <p style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,margin:"0 0 12px"}}>Nueva nota de sesión</p>
        <div style={{display:"grid",gap:10}}>
          <div>
            <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:5}}>Fecha de sesión</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,padding:"9px 13px",fontSize:14,color:C.text,outline:"none",width:"100%"}}/>
          </div>
          <div>
            <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:5}}>Observaciones clínicas</label>
            <textarea value={text} onChange={e=>setText(e.target.value)} rows={4}
              placeholder="Evolución del paciente, ejercicios realizados, observaciones, próximos objetivos..."
              style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,padding:"10px 13px",fontSize:14,color:C.text,outline:"none",width:"100%",resize:"none",lineHeight:1.6}}/>
          </div>
          <button onClick={saveNote} disabled={!text.trim()||saving}
            style={{background:text.trim()?C.accentG:"rgba(255,255,255,0.04)",border:"none",borderRadius:12,padding:11,color:text.trim()?"#fff":C.dim,fontWeight:700,cursor:text.trim()?"pointer":"default",fontSize:14}}>
            {saving?"Guardando...":"Guardar nota"}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {loading ? <Spinner/> : notes.length===0 ? (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:40,textAlign:"center"}}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.4" style={{marginBottom:12}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <p style={{color:C.muted,fontSize:14}}>Sin notas de sesión aún</p>
        </div>
      ) : (
        <div style={{display:"grid",gap:10}}>
          {notes.map(n=>(
            <div key={n.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.accentL} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span style={{color:C.accentL,fontSize:13,fontWeight:600}}>{new Date(n.session_date+"T12:00").toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"})}</span>
                </div>
                <button onClick={()=>deleteNote(n.id)} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",display:"flex",alignItems:"center",padding:4}}>
                  {Icon.trash}
                </button>
              </div>
              <p style={{color:C.text,fontSize:14,lineHeight:1.65,margin:0,whiteSpace:"pre-wrap"}}>{n.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PATIENT PROFILE ──────────────────────────────────────────────────────────
function PatientProfile({ patient, user, onBack, onPrescribe, onApprove }) {
  const [prescriptions,setPrescriptions] = useState([]);
  const [loading,setLoading]             = useState(true);
  const [showInvite,setShowInvite]       = useState(false);
  const [activePres,setActivePres]       = useState(null);
  const [activeTab,setActiveTab]         = useState("plans");
  const [editPres,setEditPres]           = useState(null);
  const [logs,setLogs]                   = useState([]);

  useEffect(()=>{
    Promise.all([
      supabase.from("prescriptions").select("*").eq("patient_id",patient.id).order("created_at",{ascending:false}),
      supabase.from("exercise_logs").select("*").eq("patient_id",patient.id),
    ]).then(([{data:p},{data:l}])=>{ setPrescriptions(p||[]); setLogs(l||[]); setLoading(false); });
  },[patient.id]);

  const deletePrescription = async (id) => {
    if(!window.confirm("¿Eliminar este plan?")) return;
    await supabase.from("prescriptions").delete().eq("id",id);
    setPrescriptions(prev=>prev.filter(p=>p.id!==id));
  };

  if(editPres) return <PrescribeView user={user} patient={patient} onBack={()=>setEditPres(null)} existingPrescription={editPres}/>;

  const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d; });
  let streak=0;
  for(let i=0;i<30;i++){
    const d=new Date(); d.setDate(d.getDate()-i);
    if(logs.some(l=>new Date(l.completed_at).toDateString()===d.toDateString())) streak++;
    else if(i>0) break;
  }

  return (
    <div>
      {showInvite && <InviteModal patient={patient} onClose={()=>setShowInvite(false)}/>}

      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, color:C.muted, background:"none", border:"none", cursor:"pointer", fontSize:14, fontWeight:500, marginBottom:20 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Volver
      </button>

      {/* Profile card */}
      <div style={{ background:"linear-gradient(135deg,#0d2929,#112020)", border:`1px solid rgba(38,166,154,0.2)`, borderRadius:24, padding:24, marginBottom:16, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(38,166,154,0.06)" }}/>
        <div style={{ position:"relative", display:"flex", gap:16, alignItems:"center" }}>
          <Avatar name={patient.name} size={64}/>
          <div style={{ flex:1 }}>
            <h2 style={{ fontFamily:"'Fraunces',serif", color:C.text, fontSize:22, margin:"0 0 4px" }}>{patient.name}</h2>
            <p style={{ color:C.muted, fontSize:14, margin:"0 0 6px" }}>{patient.condition||"Sin diagnóstico"}</p>
            {patient.age && <p style={{ color:C.dim, fontSize:12, margin:0 }}>{patient.age} años{patient.email?` · ${patient.email}`:""}</p>}
            <div style={{ marginTop:10 }}>
              {patient.invite_status==="aprobado"
                ? <span style={{ background:"rgba(102,187,106,0.15)", border:"1px solid rgba(102,187,106,0.3)", color:C.success, fontSize:11, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>Acceso activo</span>
                : patient.invite_status==="pendiente"
                ? <span style={{ background:"rgba(255,167,38,0.12)", border:"1px solid rgba(255,167,38,0.3)", color:C.warn, fontSize:11, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>Solicitud pendiente</span>
                : <span style={{ background:"rgba(239,83,80,0.1)", border:"1px solid rgba(239,83,80,0.2)", color:C.danger, fontSize:11, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>Sin acceso</span>
              }
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, marginTop:16, flexWrap:"wrap" }}>
          <button onClick={()=>onPrescribe(patient)} style={{ flex:1, background:C.accentG, border:"none", borderRadius:12, padding:11, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14, minWidth:140 }}>Nuevo plan</button>
          {patient.invite_status!=="aprobado" && (
            <button onClick={()=>onApprove(patient.id)}
              style={{ flex:1, background:"rgba(255,167,38,0.15)", border:"1px solid rgba(255,167,38,0.35)", borderRadius:12, padding:11, color:C.warn, fontWeight:700, cursor:"pointer", fontSize:14, minWidth:120 }}>
              Habilitar acceso
            </button>
          )}
          <button onClick={()=>setShowInvite(true)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"11px 14px", color:C.text, cursor:"pointer", display:"flex", alignItems:"center" }}>{Icon.link}</button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
        {[{v:prescriptions.length,l:"Planes",c:C.accent},{v:streak,l:"Racha",c:C.warn},{v:logs.length,l:"Completados",c:C.success}].map((s,i)=>(
          <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:"12px 8px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:700, color:s.c, marginTop:3 }}>{s.v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs + PDF */}
      <div style={{ display:"flex", gap:8, marginBottom:16, alignItems:"center" }}>
        <div style={{ flex:1, display:"flex", gap:3, background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:3 }}>
          {[{id:"plans",label:"Planes"},{id:"progress",label:"Progreso"},{id:"notes",label:"Notas"}].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{ flex:1, padding:"9px", borderRadius:13, border:"none", cursor:"pointer", fontWeight:600, fontSize:13, transition:"all 0.2s",
                background: activeTab===t.id ? C.accent : "transparent",
                color: activeTab===t.id ? "#fff" : C.muted
              }}>
              {t.label}
            </button>
          ))}
        </div>
        {activeTab==="plans" && prescriptions.length>0 && (
          <button onClick={()=>exportPDF(patient, prescriptions[0])}
            style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"9px 14px", color:C.muted, cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6, flexShrink:0, whiteSpace:"nowrap" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar PDF
          </button>
        )}
      </div>

      {/* Plans */}
      {activeTab==="plans" && (
        loading ? <Spinner/> : prescriptions.length===0 ? (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:40, textAlign:"center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3d4f7c" strokeWidth="1.5" style={{marginBottom:10}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <p style={{ color:C.muted }}>Sin planes prescritos</p>
          </div>
        ) : (
          <div style={{ display:"grid", gap:12 }}>
            {prescriptions.map((pres,i)=>(
              <div key={pres.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, overflow:"hidden" }}>
                <button onClick={()=>setActivePres(activePres===pres.id?null:pres.id)}
                  style={{ width:"100%", padding:16, display:"flex", alignItems:"center", justifyContent:"space-between", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
                  <div>
                    <p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{i===0?"🟢 Plan actual":`Plan #${prescriptions.length-i}`}</p>
                    <p style={{ color:C.dim, fontSize:12, marginTop:4 }}>
                      {new Date(pres.created_at).toLocaleDateString("es-CO",{day:"numeric",month:"long",year:"numeric"})} · {pres.exercises?.length||0} ejercicios
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" style={{ transform:activePres===pres.id?"rotate(180deg)":"none", transition:"transform 0.2s" }}><path d="M6 9l6 6 6-6"/></svg>
                </button>
                {activePres===pres.id && (
                  <div style={{ borderTop:`1px solid ${C.border}`, padding:16 }}>
                    {/* Edit / Delete buttons */}
                    <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                      <button onClick={async()=>{
                        if(!window.confirm("¿Duplicar este plan?")) return;
                        await supabase.from("prescriptions").insert({patient_id:patient.id,therapist_id:user.id,exercises:pres.exercises,note:(pres.note||"")+" (copia)"});
                        fetchPrescriptions();
                      }} style={{ background:"rgba(126,87,194,0.12)", border:"1px solid rgba(126,87,194,0.25)", borderRadius:10, padding:"8px 10px", color:"#9c64f0", fontWeight:600, fontSize:12, cursor:"pointer" }}>
                        Duplicar
                      </button>
                      <button onClick={()=>setEditPres(pres)}
                        style={{ flex:1, background:"rgba(38,166,154,0.15)", border:"1px solid rgba(38,166,154,0.3)", borderRadius:12, padding:"8px", color:C.accent, fontWeight:600, fontSize:13, cursor:"pointer" }}>
                        Editar plan
                      </button>
                      <button onClick={()=>deletePrescription(pres.id)}
                        style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:12, padding:"8px 14px", color:C.danger, fontWeight:600, fontSize:13, cursor:"pointer" }}>
                        🗑
                      </button>
                    </div>
                    {pres.note && (
                      <div style={{ background:"rgba(38,166,154,0.08)", border:"1px solid rgba(38,166,154,0.2)", borderRadius:12, padding:12, marginBottom:12, display:"flex", gap:8 }}>
                        
                        <p style={{ color:C.accentL, fontSize:13, margin:0 }}>{pres.note}</p>
                      </div>
                    )}
                    {BLOCKS.concat(["Sin bloque"]).map(blockName=>{
                      const exList=(pres.exercises||[]).filter(e=>(e.block||"Sin bloque")===blockName);
                      if(!exList.length) return null;
                      const m=BLOCK_META[blockName]||BLOCK_META["Sin bloque"];
                      return (
                        <div key={blockName} style={{ marginBottom:12 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6, background:m.bg, border:`1px solid ${m.color}33`, borderRadius:10, padding:"6px 12px", marginBottom:8 }}>
                            <span>{m.icon}</span>
                            <span style={{ color:m.color, fontWeight:700, fontSize:12 }}>{blockName}</span>
                          </div>
                          {exList.map((ex,idx)=>(
                            <div key={idx} style={{ display:"flex", justifyContent:"space-between", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 14px", marginBottom:6 }}>
                              <p style={{ color:C.text, fontSize:13, fontWeight:500, margin:0 }}>{ex.name}</p>
                              <p style={{ color:C.accent, fontSize:13, fontWeight:700, margin:0, flexShrink:0 }}>{ex.sets}×{ex.reps}</p>
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

      {/* Progress */}
      {activeTab==="notes" && (
        <SessionNotesView patient={patient} user={user}/>
      )}

      {activeTab==="progress" && (
        <div>
          {logs.length===0 ? (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:40, textAlign:"center" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3d4f7c" strokeWidth="1.5" style={{marginBottom:10}}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              <p style={{ color:C.muted }}>Aún no ha completado ejercicios</p>
            </div>
          ) : (
            <>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:20, marginBottom:12 }}>
                <p style={{ fontSize:11, fontWeight:700, color:C.dim, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Últimos 7 días</p>
                <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:60 }}>
                  {last7.map((day,i)=>{
                    const count=logs.filter(l=>new Date(l.completed_at).toDateString()===day.toDateString()).length;
                    const isToday=day.toDateString()===new Date().toDateString();
                    const maxC=Math.max(...last7.map(d=>logs.filter(l=>new Date(l.completed_at).toDateString()===d.toDateString()).length),1);
                    const dayShort=["D","L","M","X","J","V","S"];
                    return (
                      <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                        <div style={{ width:"100%", borderRadius:6, minHeight:3, height:`${count>0?Math.max((count/maxC)*44,8):3}px`, background:isToday?C.accent:count>0?"rgba(38,166,154,0.4)":C.border }}/>
                        <span style={{ fontSize:10, color:isToday?C.accent:C.dim }}>{dayShort[day.getDay()]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:20 }}>
                <p style={{ fontSize:11, fontWeight:700, color:C.dim, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Consistencia · 30 días</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {Array.from({length:30},(_,i)=>{
                    const d=new Date(); d.setDate(d.getDate()-(29-i));
                    const count=logs.filter(l=>new Date(l.completed_at).toDateString()===d.toDateString()).length;
                    return <div key={i} style={{ width:20, height:20, borderRadius:5, background:count===0?C.border:count<=2?"rgba(38,166,154,0.3)":count<=5?"rgba(38,166,154,0.6)":"rgba(38,166,154,0.9)" }}/>;
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PATIENTS LIST ─────────────────────────────────────────────────────────────
function PatientsView({ user, onPrescribe, onViewProfile, initialFilter, onClearFilter }) {
  const [patients,setPatients]     = useState([]);
  const [loading,setLoading]       = useState(true);
  const [search,setSearch]         = useState("");
  const [statusFilter,setStatusFilter] = useState(initialFilter||null);
  const [showForm,setShowForm]     = useState(false);
  const [showInvite,setShowInvite] = useState(null);
  const [form,setForm] = useState({name:"",age:"",condition:"",next_session:"",email:""});

  useEffect(()=>{ if(initialFilter) setStatusFilter(initialFilter); },[initialFilter]);
  useEffect(()=>{ fetchPatients(); },[]);

  const fetchPatients = async () => {
    const {data} = await supabase.from("patients").select("*").order("created_at",{ascending:false});
    setPatients(data||[]); setLoading(false);
  };

  const approvePatient = async (id) => {
    await supabase.from("patients").update({invite_status:"aprobado"}).eq("id",id);
    fetchPatients();
  };

  const [editPatient,setEditPatient] = useState(null);

  const saveEdit = async () => {
    if(!editPatient||!form.name) return;
    await supabase.from("patients").update({
      name:form.name, age:parseInt(form.age)||null,
      condition:form.condition, email:form.email
    }).eq("id",editPatient.id);
    setEditPatient(null);
    setForm({name:"",age:"",condition:"",next_session:"",email:""});
    fetchPatients();
  };

  const addPatient = async () => {
    if(!form.name) return;
    const token = crypto.randomUUID();
    const {data,error} = await supabase.from("patients")
      .insert({...form,therapist_id:user.id,age:parseInt(form.age)||null,invite_token:token})
      .select().single();
    setForm({name:"",age:"",condition:"",next_session:"",email:""});
    setShowForm(false); fetchPatients();
    if(data&&!error) setShowInvite(data);
  };

  const filtered = patients.filter(p=>{
    const ms = p.name.toLowerCase().includes(search.toLowerCase());
    const mf = !statusFilter || p.invite_status===statusFilter;
    return ms && mf;
  });

  return (
    <div>
      {showInvite && <InviteModal patient={showInvite} onClose={()=>setShowInvite(null)}/>}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <h2 style={{ fontFamily:"'Fraunces',serif", color:C.text, fontSize:26, margin:0 }}>Mis Pacientes</h2>
          <p style={{ color:C.muted, fontSize:13, marginTop:4 }}>{patients.length} pacientes</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)}
          style={{ background:`linear-gradient(135deg,${C.accent},#1a7a75)`, border:"none", borderRadius:14, padding:"10px 18px", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14, boxShadow:`0 4px 16px rgba(38,166,154,0.25)` }}>
          + Nuevo
        </button>
      </div>

      {statusFilter && (
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,background:"rgba(255,167,38,0.1)",border:"1px solid rgba(255,167,38,0.3)",borderRadius:12,padding:"8px 14px"}}>
          <span style={{color:C.warn,fontSize:13,fontWeight:600}}>Filtrando: {statusFilter==="pendiente"?"Pendientes de aprobación":statusFilter}</span>
          <button onClick={()=>{setStatusFilter(null);if(onClearFilter)onClearFilter();}} style={{background:"transparent",border:"none",color:C.warn,cursor:"pointer",fontSize:16,marginLeft:"auto",padding:"0 4px"}}>✕</button>
        </div>
      )}

      {showForm && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:20, marginBottom:16 }}>
          <h3 style={{ color:C.text, fontSize:15, fontWeight:600, margin:"0 0 14px" }}>Nuevo paciente</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nombre completo *" style={{...inp,gridColumn:"1/-1"}}/>
            <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Correo del paciente" type="email" style={{...inp,gridColumn:"1/-1"}}/>
            <input value={form.age} onChange={e=>setForm({...form,age:e.target.value})} placeholder="Edad" type="number" style={inp}/>
            <input value={form.next_session} onChange={e=>setForm({...form,next_session:e.target.value})} type="date" style={inp}/>
            <input value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} placeholder="Diagnóstico" style={{...inp,gridColumn:"1/-1"}}/>
            <div style={{ gridColumn:"1/-1", display:"flex", gap:10 }}>
              <button onClick={addPatient} style={{ flex:1, background:`linear-gradient(135deg,${C.accent},#1a7a75)`, border:"none", borderRadius:12, padding:"11px", color:"#fff", fontWeight:700, cursor:"pointer" }}>Guardar y generar link</button>
              <button onClick={()=>setShowForm(false)} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"11px 16px", color:C.muted, cursor:"pointer" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {editPatient && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:24,width:"100%",maxWidth:420}}>
            <h3 style={{color:C.text,fontWeight:700,fontSize:17,margin:"0 0 16px"}}>Editar paciente</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:5}}>Nombre *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"9px 13px",fontSize:14,color:C.text,outline:"none",width:"100%"}}/></div>
              <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:5}}>Correo</label><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} type="email" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"9px 13px",fontSize:14,color:C.text,outline:"none",width:"100%"}}/></div>
              <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:5}}>Edad</label><input value={form.age} onChange={e=>setForm({...form,age:e.target.value})} type="number" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"9px 13px",fontSize:14,color:C.text,outline:"none",width:"100%"}}/></div>
              <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:5}}>Diagnóstico</label><input value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"9px 13px",fontSize:14,color:C.text,outline:"none",width:"100%"}}/></div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:14}}>
              <button onClick={saveEdit} style={{flex:1,background:C.accentG,border:"none",borderRadius:12,padding:11,color:"#fff",fontWeight:700,cursor:"pointer"}}>Guardar</button>
              <button onClick={()=>{setEditPatient(null);setForm({name:"",age:"",condition:"",next_session:"",email:""}); }} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 16px",color:C.muted,cursor:"pointer"}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position:"relative", marginBottom:14 }}>
        <svg style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar paciente..." style={{...inp,paddingLeft:38}}/>
      </div>

      {loading ? <Spinner/> : filtered.length===0 ? (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:48, textAlign:"center" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3d4f7c" strokeWidth="1.3" style={{marginBottom:12}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          <p style={{ color:C.muted }}>No hay pacientes aún</p>
        </div>
      ) : (
        <div style={{ display:"grid", gap:10 }}>
          {filtered.map(p=>(
            <div key={p.id} onClick={()=>onViewProfile(p)}
              style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:16, cursor:"pointer", transition:"all 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent+"55"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <Avatar name={p.name} size={48}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <span style={{ color:C.text, fontWeight:600, fontSize:15 }}>{p.name}</span>
                    {p.invite_status==="aprobado" && <span style={{ fontSize:10, background:"rgba(52,211,153,0.15)", color:"#34d399", padding:"2px 8px", borderRadius:20, fontWeight:600 }}>Activo</span>}
                    {p.invite_status==="pendiente" && <span style={{ fontSize:10, background:"rgba(251,191,36,0.15)", color:"#fbbf24", padding:"2px 8px", borderRadius:20, fontWeight:600 }}>Pendiente</span>}
                    {!p.invite_status && !p.user_id && <span style={{ fontSize:10, background:"rgba(239,83,80,0.1)", color:"#ef5350", padding:"2px 8px", borderRadius:20, fontWeight:600 }}>Sin acceso</span>}
                  </div>
                  <p style={{ color:C.muted, fontSize:13, marginTop:3 }}>{p.condition||"Sin diagnóstico"}{p.age?` · ${p.age} años`:""}</p>
                </div>
                <div style={{ display:"flex", gap:8 }} onClick={e=>e.stopPropagation()}>
                  {p.invite_status!=="aprobado" && (
                    <button onClick={()=>approvePatient(p.id)}
                      style={{ background:"rgba(251,191,36,0.15)", border:"1px solid rgba(251,191,36,0.35)", borderRadius:12, padding:"7px 12px", color:"#fbbf24", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                      Aprobar
                    </button>
                  )}
                  <button onClick={()=>onPrescribe(p)} style={{ background:"rgba(38,166,154,0.15)", border:"1px solid rgba(38,166,154,0.25)", borderRadius:10, padding:"6px 10px", color:C.accent, fontWeight:600, fontSize:12, cursor:"pointer" }}>Prescribir</button>
                  <button onClick={e=>{e.stopPropagation();setEditPatient(p);setForm({name:p.name,age:p.age||"",condition:p.condition||"",next_session:"",email:p.email||""});}} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"6px 9px", color:C.muted, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center" }}>{Icon.edit}</button>
                  {p.invite_token && <button onClick={()=>setShowInvite(p)} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"7px 10px", color:C.muted, fontSize:13, cursor:"pointer" }}>{Icon.link}</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CALENDAR AGENDA ──────────────────────────────────────────────────────────
const HOURS = Array.from({length:13},(_,i)=>`${(7+i).toString().padStart(2,"0")}:00`); // 07:00 - 19:00
const MAX_PER_SLOT = 3;

function AgendaView({ user }) {
  const [appointments,setAppointments] = useState([]);
  const [loading,setLoading]           = useState(true);
  const [weekOffset,setWeekOffset]     = useState(0);
  const [showForm,setShowForm]         = useState(null); // {date,time}
  const [form,setForm]                 = useState({patient_name:"",type:"Presencial"});

  useEffect(()=>{ fetchAppointments(); },[]);

  const fetchAppointments = async () => {
    const {data} = await supabase.from("appointments").select("*").order("date",{ascending:true});
    setAppointments(data||[]); setLoading(false);
  };

  // Build week days
  const today = new Date();
  today.setHours(0,0,0,0);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset*7); // Monday

  const weekDays = Array.from({length:7},(_,i)=>{
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate()+i);
    return d;
  });

  const getAppts = (date,hour) => {
    const dateStr = localDateStr(date);
    return appointments.filter(a=>a.date===dateStr&&a.time===hour);
  };

  const addAppointment = async () => {
    if(!form.patient_name||!showForm) return;
    await supabase.from("appointments").insert({
      therapist_id:user.id, patient_name:form.patient_name, type:form.type,
      date:showForm.date, time:showForm.time, status:"confirmada"
    });
    setShowForm(null); setForm({patient_name:"",type:"Presencial"});
    fetchAppointments();
  };

  const deleteAppt = async (id,e) => {
    e.stopPropagation();
    await supabase.from("appointments").delete().eq("id",id);
    fetchAppointments();
  };

  const dayNames = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const typeColor = { Presencial:`rgba(59,130,246,0.8)`, Videollamada:`rgba(139,92,246,0.8)` };

  const weekLabel = () => {
    const opts = {day:"numeric",month:"short"};
    return `${weekDays[0].toLocaleDateString("es-CO",opts)} – ${weekDays[6].toLocaleDateString("es-CO",opts)}`;
  };

  return (
    <div>
      {/* Calendar form modal */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:24, width:"100%", maxWidth:360 }}>
            <h3 style={{ color:C.text, fontWeight:600, margin:"0 0 4px" }}>Nueva cita</h3>
            <p style={{ color:C.muted, fontSize:13, margin:"0 0 18px" }}>{showForm.date} · {showForm.time}</p>
            <div style={{ display:"grid", gap:10, marginBottom:14 }}>
              <input value={form.patient_name} onChange={e=>setForm({...form,patient_name:e.target.value})} placeholder="Nombre del paciente *" style={inp}/>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={inp}>
                <option>Presencial</option><option>Videollamada</option>
              </select>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={addAppointment} style={{ flex:1, background:`linear-gradient(135deg,${C.accent},#1a7a75)`, border:"none", borderRadius:12, padding:11, color:"#fff", fontWeight:700, cursor:"pointer" }}>Guardar</button>
              <button onClick={()=>setShowForm(null)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"11px 16px", color:C.muted, cursor:"pointer" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:"'Fraunces',serif", color:C.text, fontSize:26, margin:0 }}>Agenda</h2>
          <p style={{ color:C.muted, fontSize:13, marginTop:4 }}>{weekLabel()}</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>setWeekOffset(w=>w-1)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 12px", color:C.muted, cursor:"pointer", fontSize:16 }}>←</button>
          <button onClick={()=>setWeekOffset(0)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 12px", color:C.accent, cursor:"pointer", fontSize:13, fontWeight:600 }}>Hoy</button>
          <button onClick={()=>setWeekOffset(w=>w+1)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 12px", color:C.muted, cursor:"pointer", fontSize:16 }}>→</button>
        </div>
      </div>

      {loading ? <Spinner/> : (
        <div style={{ overflowX:"auto" }}>
          <div style={{ minWidth:700 }}>
            {/* Day headers */}
            <div style={{ display:"grid", gridTemplateColumns:`64px repeat(7,1fr)`, gap:0, marginBottom:2 }}>
              <div/>
              {weekDays.map((d,i)=>{
                const isToday=localDateStr(d)===localDateStr(new Date());
                return (
                  <div key={i} style={{ textAlign:"center", padding:"8px 4px", borderRadius:12, background:isToday?"rgba(38,166,154,0.12)":"transparent" }}>
                    <p style={{ color:C.muted, fontSize:11, fontWeight:600, margin:0 }}>{dayNames[i]}</p>
                    <p style={{ color:isToday?C.accent:C.text, fontSize:20, fontWeight:700, margin:"2px 0 0" }}>{d.getDate()}</p>
                  </div>
                );
              })}
            </div>

            {/* Hour rows */}
            {HOURS.map(hour=>(
              <div key={hour} style={{ display:"grid", gridTemplateColumns:`64px repeat(7,1fr)`, gap:0, borderTop:`1px solid ${C.border}22` }}>
                {/* Hour label */}
                <div style={{ padding:"8px 8px 8px 0", textAlign:"right" }}>
                  <span style={{ color:C.dim, fontSize:11, fontWeight:500 }}>{hour}</span>
                </div>
                {/* Day cells */}
                {weekDays.map((day,di)=>{
                  const dateStr = localDateStr(day);
                  const appts   = getAppts(day,hour);
                  const canAdd  = appts.length < MAX_PER_SLOT;
                  return (
                    <div key={di}
                      onClick={()=>canAdd&&setShowForm({date:dateStr,time:hour})}
                      style={{ minHeight:52, padding:3, borderLeft:`1px solid ${C.border}22`, cursor:canAdd?"pointer":"default", transition:"background 0.15s" }}
                      onMouseEnter={e=>{ if(canAdd) e.currentTarget.style.background="rgba(38,166,154,0.05)"; }}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      {appts.map(a=>(
                        <div key={a.id}
                          style={{ background:typeColor[a.type]||"rgba(38,166,154,0.6)", borderRadius:8, padding:"3px 7px", marginBottom:3, display:"flex", alignItems:"center", justifyContent:"space-between", gap:4 }}>
                          <span style={{ color:"#fff", fontSize:11, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{a.patient_name}</span>
                          <button onClick={e=>deleteAppt(a.id,e)} style={{ background:"rgba(0,0,0,0.2)", border:"none", borderRadius:4, color:"rgba(255,255,255,0.7)", cursor:"pointer", padding:"0 4px", fontSize:12, flexShrink:0 }}>×</button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ color:C.dim, fontSize:12, marginTop:12 }}>Haz clic en cualquier celda para agregar una cita · Máx. {MAX_PER_SLOT} por hora</p>
    </div>
  );
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
function MessagesView({ user }) {
  const [messages,setMessages] = useState([]);
  const [active,setActive]     = useState(null);
  const [reply,setReply]       = useState("");
  const [loading,setLoading]   = useState(true);

  useEffect(()=>{ fetchMessages(); },[]);

  const fetchMessages = async () => {
    const {data} = await supabase.from("messages").select("*").order("created_at",{ascending:false});
    setMessages(data||[]);
    if(data?.length>0) setActive(data[0]);
    setLoading(false);
  };

  const sendReply = async () => {
    if(!reply.trim()||!active) return;
    await supabase.from("messages").insert({therapist_id:user.id,patient_name:active.patient_name,content:reply,sender:"therapist",unread:false});
    setReply(""); fetchMessages();
  };

  return (
    <div>
      <h2 style={{ fontFamily:"'Fraunces',serif", color:C.text, fontSize:26, margin:"0 0 20px" }}>Mensajes</h2>
      {loading ? <Spinner/> : messages.length===0 ? (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:48, textAlign:"center" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3d4f7c" strokeWidth="1.3" style={{marginBottom:12}}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <p style={{ color:C.muted }}>Sin mensajes aún</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"240px 1fr", gap:12, height:520 }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, overflowY:"auto" }}>
            {messages.map(msg=>(
              <button key={msg.id} onClick={()=>setActive(msg)}
                style={{ width:"100%", padding:14, display:"flex", gap:10, alignItems:"flex-start", background:active?.id===msg.id?"rgba(38,166,154,0.1)":"transparent", border:"none", borderLeft:active?.id===msg.id?`3px solid ${C.accent}`:"3px solid transparent", cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}>
                <Avatar name={msg.patient_name||"?"} size={34}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:C.text, fontWeight:600, fontSize:13, margin:0 }}>{msg.patient_name}</p>
                  <p style={{ color:C.muted, fontSize:12, margin:"3px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{msg.content}</p>
                </div>
              </button>
            ))}
          </div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, display:"flex", flexDirection:"column" }}>
            {active && (
              <>
                <div style={{ padding:16, borderBottom:`1px solid ${C.border}`, display:"flex", gap:10, alignItems:"center" }}>
                  <Avatar name={active.patient_name||"?"} size={36}/>
                  <p style={{ color:C.text, fontWeight:600, margin:0 }}>{active.patient_name}</p>
                </div>
                <div style={{ flex:1, padding:16 }}>
                  <div style={{ background:active.sender==="therapist"?`linear-gradient(135deg,${C.accent},#1a7a75)`:C.surface, border:active.sender==="therapist"?"none":`1px solid ${C.border}`, borderRadius:16, borderTopRightRadius:active.sender==="therapist"?4:16, borderTopLeftRadius:active.sender==="therapist"?16:4, padding:"10px 14px", maxWidth:"75%", marginLeft:active.sender==="therapist"?"auto":"0", fontSize:14, color:C.text }}>
                    {active.content}
                  </div>
                </div>
                <div style={{ padding:14, borderTop:`1px solid ${C.border}`, display:"flex", gap:10 }}>
                  <input value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendReply()} placeholder="Escribe tu respuesta..."
                    style={{...inp,flex:1}}/>
                  <button onClick={sendReply} style={{ width:44, height:44, background:`linear-gradient(135deg,${C.accent},#1a7a75)`, border:"none", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style={{transform:"rotate(90deg)"}}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
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


// ─── PENDING APPROVAL SCREEN ──────────────────────────────────────────────────
function PendingApproval({ user }) {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:24, padding:36, textAlign:"center", maxWidth:360, width:"100%" }}>
        <div style={{ width:64, height:64, background:"rgba(255,167,38,0.12)", border:"1px solid rgba(255,167,38,0.3)", borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffa726" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <h2 style={{ fontFamily:"'Fraunces',serif", color:C.text, fontSize:22, margin:"0 0 10px" }}>Acceso pendiente</h2>
        <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, margin:"0 0 8px" }}>
          Tu cuenta está registrada correctamente.
        </p>
        <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, margin:"0 0 24px" }}>
          Tu fisioterapeuta debe habilitarte el acceso. Una vez aprobado, podrás ver tu plan de ejercicios.
        </p>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 14px", marginBottom:20 }}>
          <p style={{ color:C.dim, fontSize:11, margin:0 }}>Cuenta registrada con</p>
          <p style={{ color:C.text, fontWeight:600, fontSize:14, margin:"3px 0 0" }}>{user.email}</p>
        </div>
        <button onClick={()=>supabase.auth.signOut()} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 20px", color:C.muted, cursor:"pointer", fontSize:14 }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ─── INVITE HANDLER ────────────────────────────────────────────────────────────
function InviteHandler({ token, user }) {
  const [status,setStatus] = useState("linking");
  useEffect(()=>{
    supabase.from("patients")
      .update({user_id:user.id, invite_status:"pendiente"})
      .eq("invite_token",token)
      .then(({error})=>{
        window.history.replaceState({},"",window.location.pathname);
        setStatus(error?"error":"success");
      });
  },[]);
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:24, padding:32, textAlign:"center", maxWidth:320, width:"100%" }}>
        {status==="linking" && <><div style={{ width:44, height:44, border:`4px solid ${C.accent}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 16px" }}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><p style={{ color:C.muted }}>Vinculando tu cuenta...</p></>}
        {status==="success" && <><div style={{ fontSize:48, marginBottom:12 }}><div style={{width:40,height:40,border:"4px solid #ffa726",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/></div><p style={{ color:"#fbbf24", fontWeight:600, fontSize:18 }}>¡Solicitud enviada!</p><p style={{ color:C.muted, fontSize:13, marginTop:6 }}>Tu fisioterapeuta debe aprobar tu acceso. Te avisará cuando esté listo.</p></>}
        {status==="error" && <><div style={{ fontSize:48, marginBottom:12 }}>⚠️</div><p style={{ color:C.danger, fontWeight:600 }}>Error al vincular</p><p style={{ color:C.muted, fontSize:13 }}>Contacta a tu fisioterapeuta</p></>}
      </div>
    </div>
  );
}


// BIBLIOTECA VIEW
function BibliotecaView({ user }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editEx, setEditEx]       = useState(null);
  const [search, setSearch]       = useState("");
  const [form, setForm]           = useState({ name:"", description:"", category:"Rehabilitacion", default_block:"Trabajo central", default_sets:3, default_reps:"10", video_url:"" });
  const [saving, setSaving]       = useState(false);

  const ALL_CATS = ["Rehabilitacion","Core / Abdomen","Gluteos / Cadera","Pierna / Rodilla","Hombro / Escapular","Pecho / Empuje","Espalda / Traccion","Biceps / Triceps","Tobillo / Pie","Cervical / Cuello","Muneca / Mano","Calentamiento","Full Body / Funcional","Otro"];

  useEffect(()=>{ fetchExercises(); },[]);

  const fetchExercises = async () => {
    const {data} = await supabase.from("custom_exercises").select("*").eq("therapist_id",user.id).order("created_at",{ascending:false});
    setExercises(data||[]); setLoading(false);
  };

  const openCreate = () => {
    setEditEx(null);
    setForm({ name:"", description:"", category:"Rehabilitacion", default_block:"Trabajo central", default_sets:3, default_reps:"10", video_url:"" });
    setShowForm(true);
  };

  const openEdit = (ex) => {
    setEditEx(ex);
    setForm({ name:ex.name, description:ex.description||"", category:ex.category||"Rehabilitacion", default_block:ex.default_block||"Trabajo central", default_sets:ex.default_sets||3, default_reps:ex.default_reps||"10", video_url:ex.video_url||"" });
    setShowForm(true);
  };

  const saveExercise = async () => {
    if(!form.name.trim()) return;
    setSaving(true);
    const data = { therapist_id:user.id, name:form.name.trim(), description:form.description, category:form.category, default_block:form.default_block, default_sets:parseInt(form.default_sets)||3, default_reps:form.default_reps, video_url:form.video_url||null };
    if(editEx) await supabase.from("custom_exercises").update(data).eq("id",editEx.id);
    else await supabase.from("custom_exercises").insert(data);
    setSaving(false); setShowForm(false); fetchExercises();
  };

  const deleteExercise = async (id) => {
    if(!window.confirm("Eliminar este ejercicio?")) return;
    await supabase.from("custom_exercises").delete().eq("id",id);
    fetchExercises();
  };

  const filtered = exercises.filter(e=>e.name.toLowerCase().includes(search.toLowerCase())||(e.description||"").toLowerCase().includes(search.toLowerCase()));

  const BLOCK_META = {
    "Terapia":                { color:"#f87171", icon:"T" },
    "Calentamiento / Activacion": { color:"#fbbf24", icon:"C" },
    "Trabajo central":        { color:"#34d399", icon:"W" },
  };

  return (
    <div>
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16, overflowY:"auto" }}>
          <div style={{ background:C.surface, border:"1px solid "+C.border, borderRadius:24, padding:24, width:"100%", maxWidth:520 }}>
            <h3 style={{ fontFamily:"Fraunces,serif", color:C.text, fontSize:20, margin:"0 0 20px" }}>{editEx?"Editar ejercicio":"Nuevo ejercicio"}</h3>
            <div style={{ display:"grid", gap:12 }}>
              <div>
                <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:6 }}>Nombre *</label>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej: Sentadilla isometrica" style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"10px 14px",fontSize:14,color:C.text,outline:"none",width:"100%"}}/>
              </div>
              <div>
                <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:6 }}>Descripcion / Instrucciones</label>
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Como se realiza el ejercicio..." rows={3}
                  style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"10px 14px",fontSize:14,color:C.text,outline:"none",width:"100%",resize:"none",lineHeight:1.5}}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:6 }}>Categoria</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}
                    style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"10px 14px",fontSize:14,color:C.text,outline:"none",width:"100%"}}>
                    {ALL_CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:6 }}>Bloque por defecto</label>
                  <select value={form.default_block} onChange={e=>setForm({...form,default_block:e.target.value})}
                    style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"10px 14px",fontSize:14,color:C.text,outline:"none",width:"100%"}}>
                    <option>Trabajo central</option>
                    <option>Terapia</option>
                    <option>Calentamiento / Activacion</option>
                  </select>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:6 }}>Series por defecto</label>
                  <input type="number" value={form.default_sets} onChange={e=>setForm({...form,default_sets:e.target.value})} min="1"
                    style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"10px 14px",fontSize:14,color:C.text,outline:"none",width:"100%",textAlign:"center",fontWeight:700}}/>
                </div>
                <div>
                  <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:6 }}>Reps / Tiempo por defecto</label>
                  <input type="text" value={form.default_reps} onChange={e=>setForm({...form,default_reps:e.target.value})} placeholder="10 / 30seg"
                    style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"10px 14px",fontSize:14,color:C.text,outline:"none",width:"100%",textAlign:"center",fontWeight:700}}/>
                </div>
              </div>
              <div>
                <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:6 }}>
                  Link de video (YouTube, Drive, etc.) <span style={{color:C.dim}}>- opcional</span>
                </label>
                <input value={form.video_url} onChange={e=>setForm({...form,video_url:e.target.value})} placeholder="https://youtube.com/watch?v=..."
                  style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"10px 14px",fontSize:14,color:C.text,outline:"none",width:"100%"}}/>
                {form.video_url && (
                  <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
                    <a href={form.video_url} target="_blank" rel="noreferrer"
                      style={{ fontSize:12, color:C.accent, display:"flex", alignItems:"center", gap:4, textDecoration:"none" }}>
                      🎬 Ver video de referencia
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button onClick={saveExercise} disabled={!form.name.trim()||saving}
                style={{ flex:1, background:"linear-gradient(135deg,"+C.accent+",#1a7a75)", border:"none", borderRadius:14, padding:13, color:"#fff", fontWeight:700, cursor:"pointer", opacity:saving?0.7:1, fontSize:15 }}>
                {saving?"Guardando...":(editEx?"Guardar cambios":"Crear ejercicio")}
              </button>
              <button onClick={()=>setShowForm(false)}
                style={{ background:C.card, border:"1px solid "+C.border, borderRadius:14, padding:"13px 18px", color:C.muted, cursor:"pointer", fontSize:14 }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <h2 style={{ fontFamily:"Fraunces,serif", color:C.text, fontSize:26, margin:0 }}>Mi Biblioteca</h2>
          <p style={{ color:C.muted, fontSize:13, marginTop:4 }}>{exercises.length} ejercicios personalizados</p>
        </div>
        <button onClick={()=>setShowNewEx(true)}
              style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(38,166,154,0.12)", border:"1px solid rgba(38,166,154,0.25)", borderRadius:10, padding:"5px 10px", color:C.accent, fontSize:12, fontWeight:600, cursor:"pointer" }}>
              {Icon.plus} Crear ejercicio
            </button>
      </div>

      <div style={{ position:"relative", marginBottom:16 }}>
        <svg style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar en mis ejercicios..."
          style={{background:C.card,border:"1px solid "+C.border,borderRadius:14,padding:"10px 14px 10px 38px",fontSize:14,color:C.text,outline:"none",width:"100%"}}/>
      </div>

      {loading ? <Spinner/> : filtered.length===0 ? (
        <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:20, padding:60, textAlign:"center" }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#3d4f7c" strokeWidth="1.3" style={{marginBottom:12}}><path d="M6.5 6.5h11M6.5 17.5h11M2 12h20M4 9.5v5M20 9.5v5"/></svg>
          <p style={{ color:C.text, fontWeight:600, fontSize:18, margin:"0 0 8px" }}>{exercises.length===0?"Crea tu primer ejercicio":"Sin resultados"}</p>
          <p style={{ color:C.muted, fontSize:14 }}>{exercises.length===0?"Haz clic en Crear ejercicio para empezar":"Intenta con otro nombre"}</p>
          {exercises.length===0 && (
            <button onClick={openCreate} style={{ marginTop:20, background:"linear-gradient(135deg,"+C.accent+",#1a7a75)", border:"none", borderRadius:14, padding:"12px 24px", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:15 }}>
              Crear primer ejercicio
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:"grid", gap:10 }}>
          {filtered.map(ex=>{
            const bm = BLOCK_META[ex.default_block]||{color:C.muted,icon:"G"};
            return (
              <div key={ex.id} style={{ background:C.card, border:"1px solid "+C.border, borderRadius:20, padding:18, transition:"all 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent+"55"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                  <div style={{ width:44, height:44, background:"rgba(38,166,154,0.12)", border:"1px solid rgba(38,166,154,0.2)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                    {bm.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                      <p style={{ color:C.text, fontWeight:700, fontSize:16, margin:0 }}>{ex.name}</p>
                      {ex.video_url && (
                        <a href={ex.video_url} target="_blank" rel="noreferrer"
                          style={{ fontSize:11, background:"rgba(251,191,36,0.15)", color:"#fbbf24", padding:"2px 8px", borderRadius:8, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>
                          🎬 Video
                        </a>
                      )}
                    </div>
                    {ex.description && <p style={{ color:C.muted, fontSize:13, margin:"0 0 8px", lineHeight:1.5 }}>{ex.description}</p>}
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                      <span style={{ fontSize:11, background:"rgba(255,255,255,0.07)", color:C.muted, padding:"3px 10px", borderRadius:20 }}>{ex.category}</span>
                      <span style={{ fontSize:11, color:bm.color, background:"rgba(0,0,0,0.2)", padding:"3px 10px", borderRadius:20 }}>{bm.icon} {ex.default_block}</span>
                      <span style={{ fontSize:11, color:C.accent, fontWeight:600 }}>{ex.default_sets} series × {ex.default_reps}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                    <button onClick={()=>openEdit(ex)}
                      style={{ background:"rgba(38,166,154,0.12)", border:"1px solid rgba(38,166,154,0.25)", borderRadius:12, padding:"7px 12px", color:C.accent, fontWeight:600, fontSize:13, cursor:"pointer" }}>
                      Editar
                    </button>
                    <button onClick={()=>deleteExercise(ex.id)}
                      style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:12, padding:"7px 10px", color:C.danger, fontSize:13, cursor:"pointer" }}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────
function DashboardView({ user, onNavigate }) {
  const [stats,setStats]       = useState({patients:0,active:0,pending:0,appointments:0,messages:0,requests:0});
  const [recent,setRecent]     = useState([]);
  const [apts,setApts]         = useState([]);
  const [requests,setRequests] = useState([]);
  const [loading,setLoading]   = useState(true);

  useEffect(()=>{ load(); },[]);

  const load = async () => {
    const [
      {data:patients},
      {data:appointments},
      {data:messages},
      {data:reqs}
    ] = await Promise.all([
      supabase.from("patients").select("*"),
      supabase.from("appointments").select("*").gte("date",localDateStr(new Date())).order("date").limit(4),
      supabase.from("messages").select("*").eq("unread",true),
      supabase.from("access_requests").select("*").order("created_at",{ascending:false}).then(r=>r.error?{data:[]}:r),
    ]);
    const p = patients||[];
    setStats({
      patients:p.length, active:p.filter(x=>x.invite_status==="aprobado").length,
      pending:p.filter(x=>x.invite_status==="pendiente").length,
      appointments:(appointments||[]).length,
      messages:(messages||[]).length,
      requests:(reqs||[]).length,
    });
    setRecent(p.slice(0,4));
    setApts(appointments||[]);
    setRequests(reqs||[]);
    setLoading(false);
  };

  const approveRequest = async (req) => {
    // Create patient record linked to this user
    const {data:pat} = await supabase.from("patients").insert({
      name: req.display_name || req.email.split("@")[0],
      email: req.email,
      therapist_id: user.id,
      user_id: req.user_id,
      invite_status: "aprobado",
      invite_token: crypto.randomUUID(),
    }).select().single();
    await supabase.from("access_requests").delete().eq("id",req.id);
    load();
  };

  const rejectRequest = async (id) => {
    await supabase.from("access_requests").delete().eq("id",id);
    load();
  };

  const today = new Date().toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"});

  const statCards=[
    {label:"Pacientes",   value:stats.patients,     sub:`${stats.active} activos`,  color:C.accent,  tab:"patients"},
    {label:"Pendientes",  value:stats.pending,       sub:"por aprobar",              color:C.warn,    tab:"patients", filter:"pendiente"},
    {label:"Citas",       value:stats.appointments,  sub:"próximas",                 color:"#7e57c2", tab:"agenda"},
    {label:"Mensajes",    value:stats.messages,      sub:"sin leer",                 color:"#42a5f5", tab:"messages"},
  ];

  if(loading) return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60}}>
      <div style={{width:28,height:28,border:`3px solid ${C.accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  return(
    <div style={{maxWidth:1000}}>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <p style={{color:C.muted,fontSize:12,marginBottom:3,textTransform:"capitalize"}}>{today}</p>
        <h2 style={{fontFamily:"'Fraunces',serif",color:C.text,fontSize:22,margin:0}}>Panel de control</h2>
      </div>

      {/* Access requests alert */}
      {requests.length>0 && (
        <div style={{background:"rgba(255,167,38,0.08)",border:"1px solid rgba(255,167,38,0.3)",borderRadius:16,padding:"14px 16px",marginBottom:16}}>
          <p style={{color:C.warn,fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,margin:"0 0 10px"}}>
            Solicitudes de acceso ({requests.length})
          </p>
          <div style={{display:"grid",gap:8}}>
            {requests.map(req=>(
              <div key={req.id} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(0,0,0,0.2)",borderRadius:10,padding:"8px 12px"}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{req.display_name||req.email.split("@")[0]}</p>
                  <p style={{color:C.dim,fontSize:11,margin:"1px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{req.email}</p>
                  <p style={{color:C.dim,fontSize:11,margin:"2px 0 0"}}>{new Date(req.created_at).toLocaleDateString("es-CO")}</p>
                </div>
                <button onClick={()=>approveRequest(req)}
                  style={{background:"rgba(102,187,106,0.15)",border:"1px solid rgba(102,187,106,0.3)",borderRadius:8,padding:"5px 12px",color:C.success,fontWeight:700,fontSize:12,cursor:"pointer",flexShrink:0}}>
                  Aprobar
                </button>
                <button onClick={()=>rejectRequest(req.id)}
                  style={{background:"rgba(239,83,80,0.1)",border:"1px solid rgba(239,83,80,0.2)",borderRadius:8,padding:"5px 10px",color:C.danger,fontSize:12,cursor:"pointer",flexShrink:0}}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat cards — compact 2x2 grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {statCards.map((s,i)=>(
          <div key={i} onClick={()=>s.tab&&onNavigate(s.tab,null,s.filter)}
            style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",position:"relative",overflow:"hidden",cursor:s.tab?"pointer":"default",transition:"border-color 0.15s"}}
            onMouseEnter={e=>{ if(s.tab) e.currentTarget.style.borderColor=s.color+"55"; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; }}>
            <div style={{position:"absolute",top:-10,right:-10,width:52,height:52,borderRadius:"50%",background:`${s.color}14`}}/>
            <p style={{color:s.color,fontSize:28,fontWeight:700,margin:0,lineHeight:1}}>{s.value}</p>
            <p style={{color:C.text,fontSize:13,fontWeight:600,margin:"5px 0 1px"}}>{s.label}</p>
            <p style={{color:C.muted,fontSize:11,margin:0}}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12}}>
        {/* Upcoming */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px 16px",minWidth:0,overflow:"hidden"}}>
          <h3 style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 12px",display:"flex",alignItems:"center",gap:7}}>
            {Icon.agenda} Próximas citas
          </h3>
          {apts.length===0 ? (
            <p style={{color:C.muted,fontSize:12,textAlign:"center",padding:"10px 0"}}>Sin citas</p>
          ) : apts.map(a=>(
            <div key={a.id} style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
              <div style={{background:"rgba(38,166,154,0.1)",border:"1px solid rgba(38,166,154,0.2)",borderRadius:8,padding:"4px 8px",textAlign:"center",minWidth:44,flexShrink:0}}>
                <p style={{color:C.accent,fontWeight:700,fontSize:13,margin:0}}>{a.time||"--"}</p>
                <p style={{color:C.muted,fontSize:10,margin:0}}>{a.date?.slice(5)}</p>
              </div>
              <div style={{minWidth:0}}>
                <p style={{color:C.text,fontWeight:600,fontSize:12,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.patient_name}</p>
                <p style={{color:C.muted,fontSize:11,margin:"1px 0 0"}}>{a.type}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent patients */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px 16px",minWidth:0,overflow:"hidden"}}>
          <h3 style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 12px",display:"flex",alignItems:"center",gap:7}}>
            {Icon.patients} Pacientes recientes
          </h3>
          {recent.map(p=>(
            <div key={p.id} onClick={()=>onNavigate("patients",p)}
              style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,cursor:"pointer",borderRadius:8,padding:"2px 0",transition:"opacity 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.7"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              <div style={{width:30,height:30,borderRadius:9,background:C.accentG,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:11,flexShrink:0}}>
                {(p.name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{color:C.text,fontWeight:600,fontSize:12,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</p>
                <p style={{color:C.muted,fontSize:11,margin:"1px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.condition||"Sin diagnóstico"}</p>
              </div>
              {p.invite_status==="pendiente"&&<span style={{fontSize:9,background:"rgba(255,167,38,.15)",color:C.warn,padding:"2px 6px",borderRadius:6,fontWeight:600,flexShrink:0}}>Pendiente</span>}
              {p.invite_status==="aprobado"&&<span style={{fontSize:9,background:"rgba(102,187,106,.15)",color:C.success,padding:"2px 6px",borderRadius:6,fontWeight:600,flexShrink:0}}>Activo</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function TherapistApp({ user }) {
  const [tab,setTab]                           = useState("dashboard");
  const [prescribePatient,setPrescribePatient] = useState(null);
  const [profilePatient,setProfilePatient]     = useState(null);
  const [collapsed,setCollapsed]               = useState(true); // start collapsed
  const [pendingFilter,setPendingFilter]       = useState(null);

  const handleViewProfile = p=>{ setProfilePatient(p); setPrescribePatient(null); };
  const handlePrescribe   = p=>{ setPrescribePatient(p); setProfilePatient(null); setTab("patients"); };
  const handleBack        = ()=>{ setPrescribePatient(null); setProfilePatient(null); };

  const navItems=[
    {id:"dashboard", label:"Dashboard",  icon:Icon.dashboard},
    {id:"patients",  label:"Pacientes",  icon:Icon.patients},
    {id:"agenda",    label:"Agenda",     icon:Icon.agenda},
    {id:"messages",  label:"Mensajes",   icon:Icon.messages},
  ];

  const sideW = collapsed ? 56 : 200;

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex"}}>
      {/* Sidebar */}
      <aside style={{width:sideW,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,bottom:0,zIndex:20,transition:"width 0.2s cubic-bezier(.16,1,.3,1)",overflow:"hidden",flexShrink:0}}>
        {/* Logo + collapse button */}
        <div style={{padding:"12px 10px",paddingTop:"calc(12px + env(safe-area-inset-top,0px))",display:"flex",alignItems:"center",justifyContent:collapsed?"center":"space-between",borderBottom:`1px solid ${C.border}`,flexShrink:0,gap:8}}>
          {!collapsed && (
            <div style={{display:"flex",alignItems:"center",gap:9,minWidth:0}}>
              <div style={{width:30,height:30,background:C.accentG,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <span style={{fontFamily:"'Fraunces',serif",color:C.text,fontSize:14,fontWeight:700,whiteSpace:"nowrap"}}>FisioApp</span>
            </div>
          )}
          {/* Small collapse toggle */}
          <button onClick={()=>setCollapsed(!collapsed)} title={collapsed?"Expandir":"Contraer"}
            style={{width:28,height:28,borderRadius:8,border:`1px solid ${C.border}`,background:C.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.dim,flexShrink:0,transition:"all 0.15s"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{transform:collapsed?"rotate(180deg)":"none",transition:"transform 0.2s"}}>
              <path d="M11 19l-7-7 7-7M19 19l-7-7 7-7"/>
            </svg>
          </button>
        </div>

        <nav style={{flex:1,padding:"8px 6px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
          {navItems.map(item=>{
            const active=tab===item.id&&!prescribePatient&&!profilePatient;
            return (
              <button key={item.id} onClick={()=>{setTab(item.id);handleBack();}} title={item.label}
                style={{display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px":"9px 11px",borderRadius:10,border:"none",cursor:"pointer",width:"100%",textAlign:"left",transition:"all 0.15s",justifyContent:collapsed?"center":"flex-start",
                  background:active?"rgba(38,166,154,0.14)":"transparent",
                  color:active?C.accent:C.muted,
                  borderLeft:(!collapsed&&active)?`2px solid ${C.accent}`:"2px solid transparent",
                }}>
                <span style={{flexShrink:0}}>{item.icon}</span>
                {!collapsed&&<span style={{fontSize:13,fontWeight:active?600:400,whiteSpace:"nowrap"}}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{padding:"6px",borderTop:`1px solid ${C.border}`}}>
          <button onClick={()=>supabase.auth.signOut()} title="Cerrar sesión"
            style={{display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px":"9px 11px",borderRadius:10,border:"none",cursor:"pointer",background:"transparent",color:C.dim,width:"100%",justifyContent:collapsed?"center":"flex-start"}}>
            {Icon.logout}
            {!collapsed&&<span style={{fontSize:13,whiteSpace:"nowrap"}}>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      <main style={{flex:1,marginLeft:sideW,transition:"margin-left 0.2s cubic-bezier(.16,1,.3,1)",padding:"24px",paddingTop:"calc(24px + env(safe-area-inset-top,0px))",minHeight:"100vh",overflowX:"hidden",overflowY:"auto"}}>
        {tab==="dashboard"&&<DashboardView user={user} onNavigate={(t,p,filter)=>{setTab(t);if(p)setProfilePatient(p);if(filter)setPendingFilter(filter);}}/>}
        {tab==="patients"&&!prescribePatient&&!profilePatient&&<PatientsView user={user} onPrescribe={handlePrescribe} onViewProfile={handleViewProfile} initialFilter={pendingFilter} onClearFilter={()=>setPendingFilter(null)}/>}
        {tab==="patients"&&prescribePatient&&<PrescribeView user={user} patient={prescribePatient} onBack={handleBack}/>}
        {tab==="patients"&&profilePatient&&<PatientProfile patient={profilePatient} user={user} onBack={handleBack} onPrescribe={handlePrescribe} onApprove={async(id)=>{ await supabase.from("patients").update({invite_status:"aprobado"}).eq("id",id); setProfilePatient(prev=>({...prev,invite_status:"aprobado"})); }}/>}
        {tab==="agenda"&&<AgendaView user={user}/>}
        {tab==="messages"&&<MessagesView user={user}/>}
      </main>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]               = useState(undefined);
  const [role,setRole]               = useState(null);
  const [inviteToken,setInviteToken] = useState(null);

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if(token) setInviteToken(token);

    supabase.auth.getSession().then(({data:{session}})=>{ setUser(session?.user??null); });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_e,session)=>{ setUser(session?.user??null); setRole(null); });
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!user){ setRole(null); return; }
    (async()=>{
    const THERAPIST_EMAIL = "celisone1@gmail.com";
    if(user.email === THERAPIST_EMAIL) {
      setRole("therapist");
      return;
    }
    // Check if linked to a patient
    const {data: patData} = await supabase.from("patients")
      .select("id,invite_status").eq("user_id",user.id).maybeSingle();
    if(patData && patData.invite_status==="aprobado") {
      setRole("patient");
      return;
    }
    // Not linked - log access request so therapist can see it
    const {data: existing} = await supabase.from("access_requests")
      .select("id").eq("user_id",user.id).maybeSingle();
    if(!existing) {
      // Silently fail if table doesn't exist yet
      try {
        const meta = user.user_metadata||{};
        await supabase.from("access_requests").insert({
          user_id:user.id, email:user.email,
          display_name: meta.full_name||meta.name||""
        });
      } catch(e) {}
    }
    setRole("pending");
    })();
  },[user]);

  if(user===undefined) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:40, height:40, border:`4px solid ${C.accent}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if(!user) return <LoginView/>;
  if(user&&role===null) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:36, height:36, border:`4px solid ${C.accent}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if(inviteToken) return <InviteHandler token={inviteToken} user={user}/>;
  if(role==="patient") return <PatientApp user={user}/>;
  if(role==="pending") return <PendingApproval user={user}/>;
  return <TherapistApp user={user}/>;
}
