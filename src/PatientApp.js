import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const C = {
  bg:      "#0b0e1a",
  surface: "#111827",
  card:    "#1a2035",
  border:  "#263050",
  accent:  "#26a69a",
  accentL: "#4db6ac",
  accentG: "linear-gradient(135deg,#26a69a,#00796b)",
  text:    "#e8edf5",
  muted:   "#7c8db5",
  dim:     "#3d4f7c",
  success: "#66bb6a",
  warn:    "#ffa726",
};

const BLOCK_META = {
  "Terapia":                { color:"#ef5350", bg:"rgba(239,83,80,0.1)" },
  "Calentamiento / Activación": { color:"#ffa726", bg:"rgba(255,167,38,0.1)" },
  "Trabajo central":        { color:"#66bb6a", bg:"rgba(102,187,106,0.1)" },
  "Sin bloque":             { color:"#7c8db5", bg:"rgba(124,141,181,0.08)" },
};

function ProgressRing({ pct, size=80 }) {
  const r=(size-10)/2, circ=2*Math.PI*r;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={7}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.accent} strokeWidth={7}
        strokeDasharray={circ} strokeDashoffset={circ-(pct/100)*circ}
        strokeLinecap="round" style={{transition:"stroke-dashoffset 0.7s ease"}}/>
    </svg>
  );
}

export default function PatientApp({ user }) {
  const [patient,setPatient]             = useState(null);
  const [prescriptions,setPrescriptions] = useState([]);
  const [completedLogs,setCompletedLogs] = useState([]);
  const [messages,setMessages]           = useState([]);
  const [reply,setReply]                 = useState("");
  const [tab,setTab]                     = useState("plan");
  const [loading,setLoading]             = useState(true);
  const [installPrompt,setInstallPrompt] = useState(null);
  const [showInstall,setShowInstall]     = useState(false);

  useEffect(()=>{
    const h=e=>{ e.preventDefault(); setInstallPrompt(e); setShowInstall(true); };
    window.addEventListener('beforeinstallprompt',h);
    return ()=>window.removeEventListener('beforeinstallprompt',h);
  },[]);

  const doInstall=async()=>{
    if(!installPrompt) return;
    installPrompt.prompt();
    const {outcome}=await installPrompt.userChoice;
    if(outcome==='accepted') setShowInstall(false);
  };

  useEffect(()=>{ fetchAll(); },[]);

  const fetchAll=async()=>{
    const {data:p}=await supabase.from("patients").select("*").eq("user_id",user.id).single();
    if(!p){setLoading(false);return;}
    setPatient(p);
    const [{data:pres},{data:logs},{data:msgs}]=await Promise.all([
      supabase.from("prescriptions").select("*").eq("patient_id",p.id).order("created_at",{ascending:false}),
      supabase.from("exercise_logs").select("*").eq("patient_id",p.id),
      supabase.from("messages").select("*").eq("patient_name",p.name).order("created_at",{ascending:true}),
    ]);
    setPrescriptions(pres||[]); setCompletedLogs(logs||[]); setMessages(msgs||[]);
    setLoading(false);
  };

  const markComplete=async(presId,exId)=>{
    const done=completedLogs.find(l=>l.prescription_id===presId&&l.exercise_id===exId&&new Date(l.completed_at).toDateString()===new Date().toDateString());
    if(done) await supabase.from("exercise_logs").delete().eq("id",done.id);
    else await supabase.from("exercise_logs").insert({patient_id:patient.id,prescription_id:presId,exercise_id:exId});
    fetchAll();
  };

  const sendMessage=async()=>{
    if(!reply.trim()) return;
    await supabase.from("messages").insert({therapist_id:patient.therapist_id,patient_name:patient.name,content:reply,sender:"patient",unread:true});
    setReply(""); fetchAll();
  };

  if(loading) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:36,height:36,border:`3px solid ${C.accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  if(!patient) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:24,padding:32,textAlign:"center",maxWidth:320,width:"100%"}}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" style={{marginBottom:14}}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        <h2 style={{color:C.text,fontSize:18,fontWeight:700,margin:"0 0 8px"}}>Cuenta no vinculada</h2>
        <p style={{color:C.muted,fontSize:14,margin:"0 0 20px"}}>Pide a tu fisioterapeuta el link de acceso.</p>
        <button onClick={()=>supabase.auth.signOut()} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 20px",color:C.muted,cursor:"pointer",fontSize:14}}>Cerrar sesión</button>
      </div>
    </div>
  );

  const pres=prescriptions[0];
  const totalEx=pres?.exercises?.length||0;
  const todayDone=completedLogs.filter(l=>new Date(l.completed_at).toDateString()===new Date().toDateString()).length;
  const todayPct=totalEx>0?Math.round((todayDone/totalEx)*100):0;
  const firstName=patient.name.split(" ")[0];

  const blocks={};
  (pres?.exercises||[]).forEach(ex=>{ const b=ex.block||"Sin bloque"; if(!blocks[b]) blocks[b]=[]; blocks[b].push(ex); });
  const blockOrder=["Terapia","Calentamiento / Activación","Trabajo central","Sin bloque"];
  const sortedBlocks=blockOrder.filter(b=>blocks[b]);

  const last7=Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d; });
  const logsPerDay=last7.map(d=>({d,count:completedLogs.filter(l=>new Date(l.completed_at).toDateString()===d.toDateString()).length}));
  const maxCount=Math.max(...logsPerDay.map(x=>x.count),1);
  let streak=0;
  for(let i=0;i<30;i++){
    const d=new Date(); d.setDate(d.getDate()-i);
    if(completedLogs.some(l=>new Date(l.completed_at).toDateString()===d.toDateString())) streak++;
    else if(i>0) break;
  }
  const daysShort=["D","L","M","X","J","V","S"];

  const navItems=[
    {id:"plan",label:"Mi plan",icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>},
    {id:"progress",label:"Progreso",icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>},
    {id:"messages",label:"Mensajes",icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>},
  ];

  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:70}}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>

      {/* Header */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,background:C.accentG,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div>
            <p style={{fontFamily:"'Fraunces',serif",fontWeight:700,color:C.text,fontSize:15,lineHeight:1,margin:0}}>FisioApp</p>
            <p style={{color:C.muted,fontSize:11,margin:"2px 0 0"}}>Hola, {firstName}</p>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {showInstall && (
            <button onClick={doInstall} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(38,166,154,0.12)",border:"1px solid rgba(38,166,154,0.25)",borderRadius:20,padding:"5px 10px",cursor:"pointer"}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span style={{fontSize:11,fontWeight:600,color:C.accent}}>Instalar</span>
            </button>
          )}
          <button onClick={()=>supabase.auth.signOut()} style={{background:"transparent",border:"none",cursor:"pointer",color:C.dim,padding:4,display:"flex"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {totalEx>0 && (
        <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"10px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{color:C.muted,fontSize:12}}>Progreso de hoy</span>
            <span style={{color:C.accent,fontSize:12,fontWeight:700}}>{todayDone}/{totalEx}</span>
          </div>
          <div style={{width:"100%",height:4,background:C.border,borderRadius:4,overflow:"hidden"}}>
            <div style={{width:`${todayPct}%`,height:"100%",background:C.accent,borderRadius:4,transition:"width 0.6s"}}/>
          </div>
          {todayPct===100 && <p style={{color:C.accentL,fontSize:11,fontWeight:600,marginTop:5,textAlign:"center",margin:"5px 0 0"}}>Plan completado al 100%</p>}
        </div>
      )}

      <main style={{padding:"16px",maxWidth:600,margin:"0 auto"}}>

        {/* PLAN */}
        {tab==="plan" && (!pres ? (
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.2" style={{marginBottom:14}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <p style={{color:C.text,fontWeight:600,fontSize:17,margin:"0 0 6px"}}>Sin plan asignado</p>
            <p style={{color:C.muted,fontSize:14}}>Tu fisioterapeuta cargará tu rutina pronto</p>
          </div>
        ) : (
          <div>
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:14}}>
              <h2 style={{fontFamily:"'Fraunces',serif",color:C.text,fontSize:20,margin:0}}>Plan actual</h2>
              <p style={{color:C.dim,fontSize:12,margin:0}}>{new Date(pres.created_at).toLocaleDateString("es-CO",{day:"numeric",month:"short"})}</p>
            </div>

            {pres.note && (
              <div style={{background:"rgba(38,166,154,0.07)",border:"1px solid rgba(38,166,154,0.18)",borderRadius:14,padding:"12px 14px",marginBottom:14,display:"flex",gap:10}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accentL} strokeWidth="2" style={{flexShrink:0,marginTop:2}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div>
                  <p style={{color:C.accentL,fontSize:11,fontWeight:600,margin:"0 0 3px"}}>Nota del fisioterapeuta</p>
                  <p style={{color:C.text,fontSize:14,margin:0,lineHeight:1.5}}>{pres.note}</p>
                </div>
              </div>
            )}

            {sortedBlocks.map(blockName=>{
              const meta=BLOCK_META[blockName]||BLOCK_META["Sin bloque"];
              const exList=blocks[blockName];
              const blockDone=exList.filter(ex=>completedLogs.find(l=>l.prescription_id===pres.id&&l.exercise_id===ex.id&&new Date(l.completed_at).toDateString()===new Date().toDateString())).length;
              return (
                <div key={blockName} style={{marginBottom:18}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:meta.bg,border:`1px solid ${meta.color}33`,borderRadius:12,padding:"8px 14px",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:meta.color}}/>
                      <span style={{color:meta.color,fontWeight:700,fontSize:13}}>{blockName}</span>
                    </div>
                    <span style={{color:meta.color,fontSize:12,fontWeight:600,background:"rgba(0,0,0,0.15)",padding:"2px 8px",borderRadius:8}}>{blockDone}/{exList.length}</span>
                  </div>
                  <div style={{display:"grid",gap:8}}>
                    {exList.map(ex=>{
                      const isDone=!!completedLogs.find(l=>l.prescription_id===pres.id&&l.exercise_id===ex.id&&new Date(l.completed_at).toDateString()===new Date().toDateString());
                      return (
                        <div key={ex.id} onClick={()=>markComplete(pres.id,ex.id)}
                          style={{background:isDone?"rgba(102,187,106,0.07)":C.card,border:`1px solid ${isDone?"rgba(102,187,106,0.2)":C.border}`,borderRadius:14,padding:"14px",cursor:"pointer",transition:"all 0.15s"}}>
                          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                            <div style={{width:26,height:26,borderRadius:"50%",border:`2px solid ${isDone?C.success:C.dim}`,background:isDone?C.success:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all 0.2s"}}>
                              {isDone && <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                                <p style={{color:isDone?C.muted:C.text,fontWeight:600,fontSize:15,margin:0,textDecoration:isDone?"line-through":"none",lineHeight:1.3}}>{ex.name}</p>
                                <p style={{color:C.accent,fontWeight:700,fontSize:14,margin:0,flexShrink:0}}>{ex.sets}×{ex.reps}</p>
                              </div>
                              {ex.description && <p style={{color:C.muted,fontSize:12,margin:"5px 0 0",lineHeight:1.5}}>{ex.description}</p>}
                              <span style={{display:"inline-block",marginTop:5,fontSize:11,background:"rgba(255,255,255,0.04)",color:C.dim,padding:"2px 8px",borderRadius:7}}>{ex.category}</span>
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
        ))}

        {/* PROGRESS */}
        {tab==="progress" && (
          <div>
            <div style={{background:"linear-gradient(135deg,#0d2a28,#0f1e2e)",border:"1px solid rgba(38,166,154,0.2)",borderRadius:20,padding:20,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <p style={{color:C.accentL,fontSize:12,margin:"0 0 4px"}}>Progreso de hoy</p>
                <p style={{color:C.text,fontSize:38,fontWeight:700,margin:0,lineHeight:1}}>{todayDone}<span style={{fontSize:20,color:C.muted}}>/{totalEx}</span></p>
                <p style={{color:C.muted,fontSize:13,marginTop:4}}>ejercicios completados</p>
              </div>
              <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <ProgressRing pct={todayPct} size={80}/>
                <span style={{position:"absolute",fontSize:15,fontWeight:700,color:C.accent}}>{todayPct}%</span>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
              {[{v:streak,l:"Racha días",c:C.warn},{v:completedLogs.length,l:"Total hechos",c:C.success},{v:prescriptions.length,l:"Planes",c:C.accent}].map((s,i)=>(
                <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px 8px",textAlign:"center"}}>
                  <p style={{color:s.c,fontSize:26,fontWeight:700,margin:0}}>{s.v}</p>
                  <p style={{color:C.muted,fontSize:11,margin:"3px 0 0"}}>{s.l}</p>
                </div>
              ))}
            </div>

            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:18,marginBottom:14}}>
              <p style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,margin:"0 0 14px"}}>Últimos 7 días</p>
              <div style={{display:"flex",alignItems:"flex-end",gap:8,height:72}}>
                {logsPerDay.map(({d,count},i)=>{
                  const isToday=d.toDateString()===new Date().toDateString();
                  return (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                      {count>0 && <span style={{fontSize:10,color:C.muted}}>{count}</span>}
                      <div style={{width:"100%",borderRadius:8,minHeight:3,height:`${count>0?Math.max((count/maxCount)*56,8):3}px`,background:isToday?C.accent:count>0?"rgba(38,166,154,0.4)":C.border,transition:"height 0.5s"}}/>
                      <span style={{fontSize:10,color:isToday?C.accent:C.dim}}>{daysShort[d.getDay()]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:18}}>
              <p style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,margin:"0 0 12px"}}>Consistencia · 30 días</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {Array.from({length:30},(_,i)=>{
                  const d=new Date(); d.setDate(d.getDate()-(29-i));
                  const count=completedLogs.filter(l=>new Date(l.completed_at).toDateString()===d.toDateString()).length;
                  const isToday=d.toDateString()===new Date().toDateString();
                  return (
                    <div key={i} style={{width:26,height:26,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,outline:isToday?`2px solid ${C.accent}`:"none",outlineOffset:1,
                      background:count===0?C.border:count<=2?"rgba(38,166,154,0.25)":count<=5?"rgba(38,166,154,0.55)":"rgba(38,166,154,0.9)",
                      color:count===0?C.dim:C.text}}>
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MESSAGES */}
        {tab==="messages" && (
          <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 185px)"}}>
            <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,paddingBottom:8}}>
              {messages.length===0 ? (
                <div style={{textAlign:"center",padding:"50px 0"}}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.3" style={{marginBottom:12}}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  <p style={{color:C.muted,fontSize:15}}>Escríbele a tu fisioterapeuta</p>
                </div>
              ) : messages.map(msg=>(
                <div key={msg.id} style={{display:"flex",justifyContent:msg.sender==="patient"?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"78%",background:msg.sender==="patient"?C.accentG:C.card,border:msg.sender==="patient"?"none":`1px solid ${C.border}`,borderRadius:16,borderTopRightRadius:msg.sender==="patient"?4:16,borderTopLeftRadius:msg.sender==="patient"?16:4,padding:"10px 14px",fontSize:14,color:C.text,lineHeight:1.5}}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
              <input value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()}
                placeholder="Escribe un mensaje..."
                style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 14px",fontSize:14,color:C.text,outline:"none"}}/>
              <button onClick={sendMessage} style={{width:46,height:46,background:C.accentG,border:"none",borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{transform:"rotate(90deg)"}}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,zIndex:20,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        <div style={{display:"flex",maxWidth:600,margin:"0 auto"}}>
          {navItems.map(item=>{
            const active=tab===item.id;
            return (
              <button key={item.id} onClick={()=>setTab(item.id)}
                style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 0 8px",background:"transparent",border:"none",cursor:"pointer",color:active?C.accent:C.dim,transition:"color 0.15s"}}>
                {item.icon}
                <span style={{fontSize:10,fontWeight:600,letterSpacing:0.3}}>{item.label}</span>
                {active && <div style={{width:20,height:2,background:C.accent,borderRadius:2}}/>}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
