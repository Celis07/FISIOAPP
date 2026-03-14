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
  "Terapia":                { color:"#f87171", bg:"rgba(248,113,113,0.12)", icon:"🩺" },
  "Calentamiento / Activación": { color:"#fbbf24", bg:"rgba(251,191,36,0.12)",  icon:"🔥" },
  "Trabajo central":        { color:"#34d399", bg:"rgba(52,211,153,0.12)",  icon:"💪" },
  "Sin bloque":             { color:"#8892a4", bg:"rgba(136,146,164,0.1)",  icon:"📋" },
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

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:48 }}>
      <div style={{ width:32, height:32, border:`3px solid ${C.accent}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── LOGIN ──────────────────────────────────────────────────────────────────
function LoginView() {
  const [email,setEmail]       = useState("");
  const [pass,setPass]         = useState("");
  const [isReg,setIsReg]       = useState(false);
  const [loading,setLoading]   = useState(false);
  const [error,setError]       = useState("");

  const handle = async () => {
    setLoading(true); setError("");
    const {error} = isReg
      ? await supabase.auth.signUp({email,password:pass})
      : await supabase.auth.signInWithPassword({email,password:pass});
    if(error) setError(error.message);
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:`radial-gradient(ellipse at top,#0d2020 0%,${C.bg} 60%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:64, height:64, background:`linear-gradient(135deg,${C.accent},#1a7a75)`, borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:700, color:"#fff", margin:"0 auto 16px", boxShadow:`0 0 40px rgba(38,166,154,0.3)` }}>F</div>
          <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:32, color:C.text, margin:0 }}>FisioApp</h1>
          <p style={{ color:C.muted, fontSize:14, marginTop:6 }}>Tu plataforma de fisioterapia</p>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:24, padding:24 }}>
          <h2 style={{ color:C.text, fontSize:18, fontWeight:600, marginBottom:20 }}>{isReg?"Crear cuenta":"Iniciar sesión"}</h2>
          <div style={{ display:"grid", gap:12, marginBottom:16 }}>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Correo electrónico" type="email" style={inp}/>
            <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Contraseña" type="password" style={inp} onKeyDown={e=>e.key==="Enter"&&handle()}/>
          </div>
          {error && <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:10, padding:"8px 12px", color:C.danger, fontSize:13, marginBottom:12 }}>{error}</div>}
          <button onClick={handle} disabled={loading}
            style={{ width:"100%", background:`linear-gradient(135deg,${C.accent},#1a7a75)`, border:"none", borderRadius:14, padding:"13px", color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer", opacity:loading?0.7:1, boxShadow:`0 4px 20px rgba(38,166,154,0.25)` }}>
            {loading?"Cargando...":isReg?"Crear cuenta":"Entrar"}
          </button>
          <p style={{ textAlign:"center", color:C.muted, fontSize:13, marginTop:16 }}>
            {isReg?"¿Ya tienes cuenta?":"¿No tienes cuenta?"}{" "}
            <button onClick={()=>setIsReg(!isReg)} style={{ color:C.accent, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>
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
          <div style={{ fontSize:40, marginBottom:10 }}>🔗</div>
          <h3 style={{ fontFamily:"'Fraunces',serif", color:C.text, fontSize:20, margin:0 }}>Link de invitación</h3>
          <p style={{ color:C.muted, fontSize:14, marginTop:6 }}>Envíale este link a <strong style={{color:C.text}}>{patient.name}</strong></p>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:14, marginBottom:16, wordBreak:"break-all", fontSize:12, color:C.muted, fontFamily:"monospace" }}>{link}</div>
        <div style={{ display:"grid", gap:10 }}>
          <button onClick={copy} style={{ background:copied?"#34d399":`linear-gradient(135deg,${C.accent},#1a7a75)`, border:"none", borderRadius:14, padding:13, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:15 }}>{copied?"✓ ¡Copiado!":"📋 Copiar link"}</button>
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

  useEffect(()=>{
    supabase.from("custom_exercises").select("*").eq("therapist_id",user.id).order("created_at",{ascending:false})
      .then(({data})=>{
        setCustomExs((data||[]).map(e=>({
          id:"custom_"+e.id, dbId:e.id, name:e.name, description:e.description||"",
          category:e.category||"Personalizado", defaultSets:e.default_sets||3,
          defaultReps:e.default_reps||"10", videoUrl:e.video_url, isCustom:true,
        })));
      });
  },[user.id]);

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

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
        {/* LEFT - Library */}
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:C.dim, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Biblioteca · {EXERCISES.length}</p>

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
              <div style={{ fontSize:32, marginBottom:10 }}>💪</div>
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

// ─── PATIENT PROFILE ──────────────────────────────────────────────────────────
function PatientProfile({ patient, user, onBack, onPrescribe }) {
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
              {patient.user_id
                ? <span style={{ background:"rgba(52,211,153,0.15)", border:"1px solid rgba(52,211,153,0.3)", color:"#34d399", fontSize:11, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>✓ App activa</span>
                : <span style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)", color:"#fbbf24", fontSize:11, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>Sin acceso a la app</span>
              }
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:16 }}>
          <button onClick={()=>onPrescribe(patient)} style={{ flex:1, background:`linear-gradient(135deg,${C.accent},#1a7a75)`, border:"none", borderRadius:14, padding:12, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14 }}>💪 Prescribir nuevo</button>
          <button onClick={()=>setShowInvite(true)} style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:12, color:C.text, fontWeight:600, cursor:"pointer", fontSize:14 }}>🔗 Invitar</button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
        {[{v:prescriptions.length,l:"Planes",e:"📋"},{v:streak,l:"Racha",e:"🔥"},{v:logs.length,l:"Completados",e:"✅"}].map((s,i)=>(
          <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:"12px 8px", textAlign:"center" }}>
            <div style={{ fontSize:18 }}>{s.e}</div>
            <div style={{ fontSize:22, fontWeight:700, color:C.text, marginTop:3 }}>{s.v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, background:C.surface, border:`1px solid ${C.border}`, borderRadius:18, padding:4, marginBottom:16 }}>
        {[{id:"plans",label:"Planes",icon:"📋"},{id:"progress",label:"Progreso",icon:"📊"}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px", borderRadius:14, border:"none", cursor:"pointer", fontWeight:600, fontSize:14, transition:"all 0.2s",
              background: activeTab===t.id ? C.accent : "transparent",
              color: activeTab===t.id ? "#fff" : C.muted
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Plans */}
      {activeTab==="plans" && (
        loading ? <Spinner/> : prescriptions.length===0 ? (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:40, textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
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
                      <button onClick={()=>setEditPres(pres)}
                        style={{ flex:1, background:"rgba(38,166,154,0.15)", border:"1px solid rgba(38,166,154,0.3)", borderRadius:12, padding:"8px", color:C.accent, fontWeight:600, fontSize:13, cursor:"pointer" }}>
                        ✏️ Editar plan
                      </button>
                      <button onClick={()=>deletePrescription(pres.id)}
                        style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:12, padding:"8px 14px", color:C.danger, fontWeight:600, fontSize:13, cursor:"pointer" }}>
                        🗑
                      </button>
                    </div>
                    {pres.note && (
                      <div style={{ background:"rgba(38,166,154,0.08)", border:"1px solid rgba(38,166,154,0.2)", borderRadius:12, padding:12, marginBottom:12, display:"flex", gap:8 }}>
                        <span>📝</span>
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
      {activeTab==="progress" && (
        <div>
          {logs.length===0 ? (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:40, textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📊</div>
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
function PatientsView({ user, onPrescribe, onViewProfile }) {
  const [patients,setPatients]   = useState([]);
  const [loading,setLoading]     = useState(true);
  const [search,setSearch]       = useState("");
  const [showForm,setShowForm]   = useState(false);
  const [showInvite,setShowInvite]= useState(null);
  const [form,setForm] = useState({name:"",age:"",condition:"",next_session:"",email:""});

  useEffect(()=>{ fetchPatients(); },[]);

  const fetchPatients = async () => {
    const {data} = await supabase.from("patients").select("*").order("created_at",{ascending:false});
    setPatients(data||[]); setLoading(false);
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

  const filtered = patients.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));

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

      <div style={{ position:"relative", marginBottom:14 }}>
        <svg style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar paciente..." style={{...inp,paddingLeft:38}}/>
      </div>

      {loading ? <Spinner/> : filtered.length===0 ? (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:48, textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>👤</div>
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
                    {p.user_id && <span style={{ fontSize:10, background:"rgba(52,211,153,0.15)", color:"#34d399", padding:"2px 8px", borderRadius:20, fontWeight:600 }}>✓ Activo</span>}
                  </div>
                  <p style={{ color:C.muted, fontSize:13, marginTop:3 }}>{p.condition||"Sin diagnóstico"}{p.age?` · ${p.age} años`:""}</p>
                </div>
                <div style={{ display:"flex", gap:8 }} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>onPrescribe(p)} style={{ background:"rgba(38,166,154,0.15)", border:"1px solid rgba(38,166,154,0.25)", borderRadius:12, padding:"7px 12px", color:C.accent, fontWeight:600, fontSize:13, cursor:"pointer" }}>💪</button>
                  {p.invite_token && <button onClick={()=>setShowInvite(p)} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"7px 10px", color:C.muted, fontSize:13, cursor:"pointer" }}>🔗</button>}
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
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset*7); // Monday

  const weekDays = Array.from({length:7},(_,i)=>{
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate()+i);
    return d;
  });

  const getAppts = (date,hour) => {
    const dateStr = date.toISOString().split("T")[0];
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
                const isToday=d.toDateString()===new Date().toDateString();
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
                  const dateStr = day.toISOString().split("T")[0];
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
          <div style={{ fontSize:48, marginBottom:12 }}>💬</div>
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

// ─── INVITE HANDLER ────────────────────────────────────────────────────────────
function InviteHandler({ token, user }) {
  const [status,setStatus] = useState("linking");
  useEffect(()=>{
    supabase.from("patients").update({user_id:user.id}).eq("invite_token",token).then(({error})=>{
      window.history.replaceState({},"",window.location.pathname);
      setStatus(error?"error":"success");
      if(!error) setTimeout(()=>window.location.reload(),1500);
    });
  },[]);
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:24, padding:32, textAlign:"center", maxWidth:320, width:"100%" }}>
        {status==="linking" && <><div style={{ width:44, height:44, border:`4px solid ${C.accent}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 16px" }}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><p style={{ color:C.muted }}>Vinculando tu cuenta...</p></>}
        {status==="success" && <><div style={{ fontSize:48, marginBottom:12 }}>✅</div><p style={{ color:"#34d399", fontWeight:600, fontSize:18 }}>¡Listo!</p><p style={{ color:C.muted, fontSize:13, marginTop:6 }}>Cargando tu plan...</p></>}
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
    "Terapia":                { color:"#f87171", icon:"🩺" },
    "Calentamiento / Activacion": { color:"#fbbf24", icon:"🔥" },
    "Trabajo central":        { color:"#34d399", icon:"💪" },
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
        <button onClick={openCreate}
          style={{ background:"linear-gradient(135deg,"+C.accent+",#1a7a75)", border:"none", borderRadius:14, padding:"10px 18px", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14, boxShadow:"0 4px 16px rgba(38,166,154,0.25)" }}>
          + Crear ejercicio
        </button>
      </div>

      <div style={{ position:"relative", marginBottom:16 }}>
        <svg style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar en mis ejercicios..."
          style={{background:C.card,border:"1px solid "+C.border,borderRadius:14,padding:"10px 14px 10px 38px",fontSize:14,color:C.text,outline:"none",width:"100%"}}/>
      </div>

      {loading ? <Spinner/> : filtered.length===0 ? (
        <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:20, padding:60, textAlign:"center" }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🏋️</div>
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
            const bm = BLOCK_META[ex.default_block]||{color:C.muted,icon:"📋"};
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
                      ✏️
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

// ─── THERAPIST APP ─────────────────────────────────────────────────────────────
function TherapistApp({ user }) {
  const [tab,setTab]                         = useState("patients");
  const [prescribePatient,setPrescribePatient]= useState(null);
  const [profilePatient,setProfilePatient]   = useState(null);

  const handleViewProfile = p=>{ setProfilePatient(p); setPrescribePatient(null); };
  const handlePrescribe   = p=>{ setPrescribePatient(p); setProfilePatient(null); };
  const handleBack        = ()=>{ setPrescribePatient(null); setProfilePatient(null); };

  const navItems=[{id:"patients",icon:"👤",label:"Pacientes"},{id:"biblioteca",icon:"⭐",label:"Biblioteca"},{id:"agenda",icon:"📅",label:"Agenda"},{id:"messages",icon:"💬",label:"Mensajes"}];

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <header style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:10 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, background:`linear-gradient(135deg,${C.accent},#1a7a75)`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#fff", boxShadow:`0 0 20px rgba(38,166,154,0.2)` }}>F</div>
            <span style={{ fontFamily:"'Fraunces',serif", color:C.text, fontSize:18, fontWeight:700 }}>FisioApp</span>
          </div>
          <button onClick={()=>supabase.auth.signOut()} style={{ color:C.muted, background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:500 }}>Salir</button>
        </div>
      </header>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"20px 20px 0" }}>
        <div style={{ display:"flex", gap:4, background:C.surface, border:`1px solid ${C.border}`, borderRadius:18, padding:4, marginBottom:24 }}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>{ setTab(item.id); handleBack(); }}
              style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px", borderRadius:14, border:"none", cursor:"pointer", fontWeight:600, fontSize:14, transition:"all 0.2s",
                background: tab===item.id?C.accent:"transparent",
                color: tab===item.id?"#fff":C.muted
              }}>
              {item.icon} <span style={{ display:"none" }} className="sm:inline">{item.label}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px 40px" }}>
        {tab==="patients"&&!prescribePatient&&!profilePatient && <PatientsView user={user} onPrescribe={handlePrescribe} onViewProfile={handleViewProfile}/>}
        {tab==="patients"&&prescribePatient && <PrescribeView user={user} patient={prescribePatient} onBack={handleBack}/>}
        {tab==="patients"&&profilePatient && <PatientProfile patient={profilePatient} user={user} onBack={handleBack} onPrescribe={handlePrescribe}/>}
        {tab==="biblioteca" && <BibliotecaView user={user}/>}
        {tab==="agenda" && <AgendaView user={user}/>}
        {tab==="messages" && <MessagesView user={user}/>}
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
    supabase.from("patients").select("id").eq("user_id",user.id).maybeSingle().then(({data})=>setRole(data?"patient":"therapist"));
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
  return <TherapistApp user={user}/>;
}
