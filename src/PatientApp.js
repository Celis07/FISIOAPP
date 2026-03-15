import { useState, useEffect } from "react";
import { supabase } from "./supabase";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:      "#0f1117",
  surface: "#1a1d27",
  card:    "#21253a",
  border:  "#2d3348",
  accent:  "#26a69a",
  accentL: "#80cbc4",
  text:    "#e2e8f0",
  muted:   "#8892a4",
  dim:     "#4a5270",
};

const BLOCK_META = {
  "Terapia":                { color:"#f87171", bg:"rgba(248,113,113,0.12)", icon:"🩺" },
  "Calentamiento / Activación": { color:"#fbbf24", bg:"rgba(251,191,36,0.12)",  icon:"🔥" },
  "Trabajo central":        { color:"#34d399", bg:"rgba(52,211,153,0.12)",  icon:"💪" },
  "Sin bloque":             { color:"#8892a4", bg:"rgba(136,146,164,0.1)",  icon:"📋" },
};

function ProgressRing({ pct, size = 88 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={8}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.accent} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={circ - (pct/100)*circ}
        strokeLinecap="round" style={{ transition:"stroke-dashoffset 0.7s ease" }}/>
    </svg>
  );
}

function ProgressDashboard({ patient, prescriptions, completedLogs }) {
  const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d; });
  const logsPerDay = last7.map(day => ({
    day, count: completedLogs.filter(l => new Date(l.completed_at).toDateString()===day.toDateString()).length
  }));
  const maxCount = Math.max(...logsPerDay.map(d=>d.count),1);
  let streak = 0;
  for(let i=0;i<30;i++){
    const d=new Date(); d.setDate(d.getDate()-i);
    if(completedLogs.some(l=>new Date(l.completed_at).toDateString()===d.toDateString())) streak++;
    else if(i>0) break;
  }
  const latestPres = prescriptions[0];
  const totalEx    = latestPres?.exercises?.length||0;
  const todayDone  = completedLogs.filter(l=>new Date(l.completed_at).toDateString()===new Date().toDateString()).length;
  const pct        = totalEx>0?Math.round((todayDone/totalEx)*100):0;
  const dayShort   = ["D","L","M","X","J","V","S"];

  return (
    <div style={{ paddingBottom:24 }}>
      {/* Hero */}
      <div style={{ background:"linear-gradient(135deg,#1e3a3a,#0f2a2a)", border:`1px solid ${C.border}`, borderRadius:24, padding:24, marginBottom:16, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(38,166,154,0.08)" }}/>
        <div style={{ position:"absolute", bottom:-20, left:-20, width:80, height:80, borderRadius:"50%", background:"rgba(38,166,154,0.08)" }}/>
        <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <p style={{ color:C.accentL, fontSize:12, marginBottom:4 }}>Progreso de hoy</p>
            <p style={{ fontSize:40, fontWeight:700, color:C.text, lineHeight:1 }}>{todayDone}<span style={{ fontSize:22, color:C.muted }}>/{totalEx}</span></p>
            <p style={{ color:C.muted, fontSize:13, marginTop:4 }}>ejercicios completados</p>
          </div>
          <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ProgressRing pct={pct} />
            <span style={{ position:"absolute", fontSize:16, fontWeight:700, color:C.accent }}>{pct}%</span>
          </div>
        </div>
        {pct===100 && <div style={{ marginTop:12, background:"rgba(38,166,154,0.2)", border:"1px solid rgba(38,166,154,0.3)", borderRadius:12, padding:"8px 14px", fontSize:13, color:C.accentL }}>🎉 ¡Completaste todo tu plan!</div>}
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
        {[{v:streak,l:"Racha",e:"🔥"},{v:completedLogs.length,l:"Total",e:"✅"},{v:`${pct}%`,l:"Hoy",e:"📅"}].map((s,i)=>(
          <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:"14px 8px", textAlign:"center" }}>
            <div style={{ fontSize:20 }}>{s.e}</div>
            <div style={{ fontSize:24, fontWeight:700, color:C.text, marginTop:2 }}>{s.v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:20, marginBottom:14 }}>
        <p style={{ fontSize:13, fontWeight:600, color:C.muted, marginBottom:16, textTransform:"uppercase", letterSpacing:1 }}>Últimos 7 días</p>
        <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:80 }}>
          {logsPerDay.map(({day,count},i)=>{
            const isToday = day.toDateString()===new Date().toDateString();
            return (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                {count>0 && <span style={{ fontSize:11, color:C.muted }}>{count}</span>}
                <div style={{ width:"100%", borderRadius:8, minHeight:3, transition:"height 0.5s ease",
                  height:`${count>0?Math.max((count/maxCount)*60,10):3}px`,
                  background: isToday ? `linear-gradient(180deg,${C.accentL},${C.accent})` : count>0 ? "rgba(38,166,154,0.4)" : C.border
                }}/>
                <span style={{ fontSize:11, color: isToday?C.accent:C.dim }}>{dayShort[day.getDay()]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:20 }}>
        <p style={{ fontSize:13, fontWeight:600, color:C.muted, marginBottom:12, textTransform:"uppercase", letterSpacing:1 }}>Consistencia · 30 días</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {Array.from({length:30},(_,i)=>{
            const d=new Date(); d.setDate(d.getDate()-(29-i));
            const count=completedLogs.filter(l=>new Date(l.completed_at).toDateString()===d.toDateString()).length;
            const isToday=d.toDateString()===new Date().toDateString();
            return (
              <div key={i} title={`${d.toLocaleDateString("es-CO")}: ${count}`}
                style={{ width:26, height:26, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, fontWeight:600, outline: isToday?`2px solid ${C.accent}`:undefined, outlineOffset:2,
                  background: count===0?C.border:count<=2?"rgba(38,166,154,0.25)":count<=5?"rgba(38,166,154,0.55)":"rgba(38,166,154,0.9)",
                  color: count===0?C.dim:C.text
                }}>
                {d.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PatientApp({ user }) {
  const [patient, setPatient]             = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [completedLogs, setCompletedLogs] = useState([]);
  const [messages, setMessages]           = useState([]);
  const [reply, setReply]                 = useState("");
  const [tab, setTab]                     = useState("exercises");
  const [loading, setLoading]             = useState(true);

  useEffect(()=>{ fetchAll(); },[]);

  const fetchAll = async () => {
    const { data: p } = await supabase.from("patients").select("*").eq("user_id",user.id).single();
    if(!p){ setLoading(false); return; }
    setPatient(p);
    const [{data:pres},{data:logs},{data:msgs}] = await Promise.all([
      supabase.from("prescriptions").select("*").eq("patient_id",p.id).order("created_at",{ascending:false}),
      supabase.from("exercise_logs").select("*").eq("patient_id",p.id),
      supabase.from("messages").select("*").eq("patient_name",p.name).order("created_at",{ascending:true}),
    ]);
    setPrescriptions(pres||[]);
    setCompletedLogs(logs||[]);
    setMessages(msgs||[]);
    setLoading(false);
  };

  const markComplete = async (prescriptionId, exerciseId) => {
    const done = completedLogs.find(l=>l.prescription_id===prescriptionId&&l.exercise_id===exerciseId&&new Date(l.completed_at).toDateString()===new Date().toDateString());
    if(done) await supabase.from("exercise_logs").delete().eq("id",done.id);
    else await supabase.from("exercise_logs").insert({patient_id:patient.id,prescription_id:prescriptionId,exercise_id:exerciseId});
    fetchAll();
  };

  const sendMessage = async () => {
    if(!reply.trim()) return;
    await supabase.from("messages").insert({therapist_id:patient.therapist_id,patient_name:patient.name,content:reply,sender:"patient",unread:true});
    setReply(""); fetchAll();
  };

  if(loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:44, height:44, border:`4px solid ${C.accent}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 12px" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color:C.muted, fontSize:14 }}>Cargando tu plan...</p>
      </div>
    </div>
  );

  if(!patient) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:24, padding:32, textAlign:"center", maxWidth:320, width:"100%" }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🔗</div>
        <h2 style={{ color:C.text, fontSize:20, fontWeight:700, marginBottom:8 }}>Cuenta no vinculada</h2>
        <p style={{ color:C.muted, fontSize:14, marginBottom:20 }}>Pídele a tu fisioterapeuta el link de acceso.</p>
        <button onClick={()=>supabase.auth.signOut()} style={{ color:C.accent, fontSize:14, background:"none", border:"none", cursor:"pointer" }}>Cerrar sesión</button>
      </div>
    </div>
  );

  const latestPres = prescriptions[0];
  const totalEx    = latestPres?.exercises?.length||0;
  const todayDone  = completedLogs.filter(l=>new Date(l.completed_at).toDateString()===new Date().toDateString()).length;
  const pct        = totalEx>0?Math.round((todayDone/totalEx)*100):0;
  const firstName  = patient.name.split(" ")[0];

  const navItems = [{id:"exercises",label:"Plan"},{id:"progress",label:"Progreso"},{id:"messages",label:"Chat"}];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, paddingBottom:80 }}>
      {/* Header */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, background:`linear-gradient(135deg,${C.accent},#1a7a75)`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#fff", fontSize:16 }}>F</div>
          <div>
            <p style={{ fontFamily:"'Fraunces',serif", fontWeight:700, color:C.text, fontSize:15 }}>FisioApp</p>
            <p style={{ color:C.muted, fontSize:11, marginTop:-2 }}>Hola, {firstName} 👋</p>
          </div>
        </div>
        {totalEx>0 && (
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(38,166,154,0.12)", border:"1px solid rgba(38,166,154,0.3)", borderRadius:20, padding:"6px 12px" }}>
            <div style={{ width:52, height:4, background:C.border, borderRadius:4, overflow:"hidden" }}>
              <div style={{ width:`${pct}%`, height:"100%", background:C.accent, borderRadius:4, transition:"width 0.5s" }}/>
            </div>
            <span style={{ fontSize:12, fontWeight:700, color:C.accent }}>{pct}%</span>
          </div>
        )}
      </div>

      <div style={{ maxWidth:600, margin:"0 auto", padding:"20px 16px" }}>

        {/* PLAN */}
        {tab==="exercises" && (
          prescriptions.length===0 ? (
            <div style={{ textAlign:"center", padding:"60px 0" }}>
              <div style={{ fontSize:56, marginBottom:12 }}>🏋️</div>
              <p style={{ color:C.text, fontWeight:600, fontSize:18 }}>Sin plan asignado</p>
              <p style={{ color:C.muted, fontSize:14, marginTop:6 }}>Tu fisioterapeuta pronto cargará tu rutina</p>
            </div>
          ) : prescriptions.map((pres,pi)=>{
            const blocks = {};
            (pres.exercises||[]).forEach(ex=>{ const b=ex.block||"Sin bloque"; if(!blocks[b]) blocks[b]=[]; blocks[b].push(ex); });
            const order = ["Terapia","Calentamiento / Activación","Trabajo central","Sin bloque"];
            const sorted = order.filter(b=>blocks[b]);
            return (
              <div key={pres.id} style={{ marginBottom:32 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <div>
                    <h2 style={{ fontFamily:"'Fraunces',serif", color:C.text, fontSize:22, fontWeight:700, margin:0 }}>{pi===0?"Tu plan actual":`Plan anterior ${pi}`}</h2>
                    <p style={{ color:C.muted, fontSize:12, marginTop:3 }}>{new Date(pres.created_at).toLocaleDateString("es-CO",{day:"numeric",month:"long"})} · {pres.exercises?.length||0} ejercicios</p>
                  </div>
                </div>
                {pres.note && (
                  <div style={{ background:"rgba(38,166,154,0.1)", border:"1px solid rgba(38,166,154,0.25)", borderRadius:16, padding:14, marginBottom:16, display:"flex", gap:10 }}>
                    
                    <div>
                      <p style={{ color:C.accentL, fontSize:11, fontWeight:600, marginBottom:3 }}>Nota de tu fisio</p>
                      <p style={{ color:C.text, fontSize:14 }}>{pres.note}</p>
                    </div>
                  </div>
                )}
                {sorted.map(blockName=>{
                  const meta = BLOCK_META[blockName]||BLOCK_META["Sin bloque"];
                  const exList = blocks[blockName];
                  const blockDone = exList.filter(ex=>completedLogs.find(l=>l.prescription_id===pres.id&&l.exercise_id===ex.id&&new Date(l.completed_at).toDateString()===new Date().toDateString())).length;
                  return (
                    <div key={blockName} style={{ marginBottom:20 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:meta.bg, border:`1px solid ${meta.color}33`, borderRadius:14, padding:"10px 14px", marginBottom:8 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:16 }}>{meta.icon}</span>
                          <span style={{ color:meta.color, fontWeight:700, fontSize:13 }}>{blockName}</span>
                        </div>
                        <span style={{ color:meta.color, fontSize:12, fontWeight:600, background:"rgba(0,0,0,0.2)", padding:"2px 8px", borderRadius:10 }}>{blockDone}/{exList.length}</span>
                      </div>
                      <div style={{ display:"grid", gap:8, paddingLeft:8 }}>
                        {exList.map(ex=>{
                          const isDone = !!completedLogs.find(l=>l.prescription_id===pres.id&&l.exercise_id===ex.id&&new Date(l.completed_at).toDateString()===new Date().toDateString());
                          return (
                            <div key={ex.id} style={{ background: isDone?"rgba(52,211,153,0.08)":C.card, border:`1px solid ${isDone?"rgba(52,211,153,0.3)":C.border}`, borderRadius:18, padding:16, transition:"all 0.2s" }}>
                              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                                <button onClick={()=>pi===0&&markComplete(pres.id,ex.id)}
                                  style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${isDone?"#34d399":C.dim}`, background:isDone?"#34d399":"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, marginTop:2, transition:"all 0.2s" }}>
                                  {isDone && <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </button>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
                                    <p style={{ color:isDone?C.dim:C.text, fontWeight:600, fontSize:14, textDecoration:isDone?"line-through":"none" }}>{ex.name}</p>
                                    <p style={{ color:C.accent, fontWeight:700, fontSize:13, flexShrink:0 }}>{ex.sets}×{ex.reps}</p>
                                  </div>
                                  {ex.description && <p style={{ color:C.muted, fontSize:12, marginTop:4, lineHeight:1.5 }}>{ex.description}</p>}
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

        {/* PROGRESS */}
        {tab==="progress" && <ProgressDashboard patient={patient} prescriptions={prescriptions} completedLogs={completedLogs}/>}

        {/* MESSAGES */}
        {tab==="messages" && (
          <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 200px)" }}>
            <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:10, paddingBottom:12 }}>
              {messages.length===0 ? (
                <div style={{ textAlign:"center", padding:"60px 0" }}>
                  <div style={{ fontSize:48, marginBottom:10 }}>💬</div>
                  <p style={{ color:C.muted }}>Escríbele a tu fisioterapeuta</p>
                </div>
              ) : messages.map(msg=>(
                <div key={msg.id} style={{ display:"flex", justifyContent:msg.sender==="patient"?"flex-end":"flex-start" }}>
                  <div style={{ maxWidth:"75%", background:msg.sender==="patient"?`linear-gradient(135deg,${C.accent},#1a7a75)`:C.card, border:msg.sender==="patient"?"none":`1px solid ${C.border}`, borderRadius:18, borderTopRightRadius:msg.sender==="patient"?4:18, borderTopLeftRadius:msg.sender==="patient"?18:4, padding:"10px 14px", fontSize:14, color:C.text }}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
              <input value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} placeholder="Escribe un mensaje..."
                style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"12px 16px", fontSize:14, outline:"none" }}/>
              <button onClick={sendMessage} style={{ width:46, height:46, background:`linear-gradient(135deg,${C.accent},#1a7a75)`, border:"none", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ transform:"rotate(90deg)" }}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, padding:"8px 16px 12px", zIndex:20 }}>
        <div style={{ maxWidth:600, margin:"0 auto", display:"flex", justifyContent:"space-around" }}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>setTab(item.id)}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"8px 24px", borderRadius:14, background:tab===item.id?"rgba(38,166,154,0.15)":"transparent", border:"none", cursor:"pointer", transition:"all 0.2s" }}>
              <span style={{ fontSize:12, fontWeight:600, color:tab===item.id?C.accent:C.dim, letterSpacing:0.5, textTransform:"uppercase" }}>{item.label}</span>
              {tab===item.id && <div style={{ width:20, height:2, background:C.accent, borderRadius:2 }}/>}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
