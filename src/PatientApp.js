import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const C = {
  bg:"#0b0e1a", surface:"#111827", card:"#1a2035", border:"#263050",
  accent:"#26a69a", accentL:"#4db6ac", accentG:"linear-gradient(135deg,#26a69a,#00796b)",
  text:"#e8edf5", muted:"#7c8db5", dim:"#3d4f7c",
  success:"#66bb6a", warn:"#ffa726", danger:"#ef5350",
};

const BLOCK_META = {
  "Terapia":                {color:"#ef5350",bg:"rgba(239,83,80,0.1)"},
  "Calentamiento / Activación":{color:"#ffa726",bg:"rgba(255,167,38,0.1)"},
  "Trabajo central":        {color:"#66bb6a",bg:"rgba(102,187,106,0.1)"},
  "Sin bloque":             {color:"#7c8db5",bg:"rgba(124,141,181,0.08)"},
};

function Ring({pct,size=76}){
  const r=(size-8)/2,circ=2*Math.PI*r;
  return(
    <svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={6}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.accent} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={circ-(pct/100)*circ}
        strokeLinecap="round" style={{transition:"stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)"}}/>
    </svg>
  );
}

function Skeleton(){
  return(
    <div style={{padding:"20px 16px",display:"grid",gap:12}}>
      {[1,2,3].map(i=>(
        <div key={i} style={{background:C.card,borderRadius:16,padding:16,border:`1px solid ${C.border}`,opacity:1-i*0.2}}>
          <div style={{width:"60%",height:14,background:C.border,borderRadius:7,marginBottom:8,animation:"pulse 1.5s infinite"}}/>
          <div style={{width:"40%",height:11,background:C.border,borderRadius:5,animation:"pulse 1.5s infinite 0.2s"}}/>
        </div>
      ))}
    </div>
  );
}

function IOSInstallBanner({onDismiss}){
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream;
  const isStandalone=window.navigator.standalone;
  if(!isIOS||isStandalone) return null;
  return(
    <div className="slide-up" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"linear-gradient(135deg,#0d2a28,#111827)",border:`1px solid rgba(38,166,154,0.3)`,borderBottom:"none",borderRadius:"20px 20px 0 0",padding:"20px 20px calc(20px + env(safe-area-inset-bottom,0px))",boxShadow:"0 -4px 32px rgba(0,0,0,0.5)"}}>
      <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
        <div style={{width:44,height:44,background:C.accentG,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <div style={{flex:1}}>
          <p style={{color:C.text,fontWeight:700,fontSize:16,margin:"0 0 4px"}}>Instalar FisioApp</p>
          <p style={{color:C.muted,fontSize:13,margin:"0 0 14px",lineHeight:1.5}}>
            Para instalar en tu iPhone, toca{" "}
            <span style={{color:C.accent,fontWeight:600}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle"}}><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>{" "}
              Compartir
            </span>{" "}y luego{" "}
            <span style={{color:C.accent,fontWeight:600}}>"Añadir a pantalla de inicio"</span>
          </p>
          <button onClick={onDismiss} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 16px",color:C.muted,cursor:"pointer",fontSize:13}}>
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientApp({user}){
  const [patient,setPatient]       =useState(null);
  const [pres,setPres]             =useState(null);
  const [allPres,setAllPres]       =useState([]);
  const [logs,setLogs]             =useState([]);
  const [messages,setMessages]     =useState([]);
  const [reply,setReply]           =useState("");
  const [tab,setTab]               =useState("plan");
  const [loading,setLoading]       =useState(true);
  const [checking,setChecking]     =useState(false);
  const [showIOS,setShowIOS]       =useState(false);
  const [installPrompt,setInstall] =useState(null);
  const [showAndroid,setShowAndroid]=useState(false);
  const chatRef                    =useRef(null);

  // Install prompt
  useEffect(()=>{
    const h=e=>{e.preventDefault();setInstall(e);setShowAndroid(true);};
    window.addEventListener('beforeinstallprompt',h);
    // Show iOS banner after 3s
    const t=setTimeout(()=>setShowIOS(true),3000);
    return()=>{window.removeEventListener('beforeinstallprompt',h);clearTimeout(t);};
  },[]);

  const doInstall=async()=>{
    if(!installPrompt)return;
    installPrompt.prompt();
    const{outcome}=await installPrompt.userChoice;
    if(outcome==='accepted')setShowAndroid(false);
  };

  useEffect(()=>{fetchAll();},[]);

  // Scroll chat to bottom
  useEffect(()=>{
    if(tab==="messages"&&chatRef.current){
      chatRef.current.scrollTop=chatRef.current.scrollHeight;
    }
  },[messages,tab]);

  const fetchAll=useCallback(async()=>{
    const{data:p}=await supabase.from("patients").select("*").eq("user_id",user.id).single();
    if(!p){setLoading(false);return;}
    setPatient(p);
    const[{data:presData},{data:logData},{data:msgData}]=await Promise.all([
      supabase.from("prescriptions").select("*").eq("patient_id",p.id).order("created_at",{ascending:false}),
      supabase.from("exercise_logs").select("*").eq("patient_id",p.id),
      supabase.from("messages").select("*").eq("patient_name",p.name).order("created_at",{ascending:true}),
    ]);
    const presArr=presData||[];
    setAllPres(presArr);
    setPres(presArr[0]||null);
    setLogs(logData||[]);
    setMessages(msgData||[]);
    setLoading(false);
  },[user.id]);

  const markComplete=async(presId,exId)=>{
    // Haptic feedback
    if(navigator.vibrate) navigator.vibrate(10);
    const today=new Date().toDateString();
    const done=logs.find(l=>l.prescription_id===presId&&l.exercise_id===exId&&new Date(l.completed_at).toDateString()===today);
    if(done) await supabase.from("exercise_logs").delete().eq("id",done.id);
    else await supabase.from("exercise_logs").insert({patient_id:patient.id,prescription_id:presId,exercise_id:exId});
    fetchAll();
  };

  const sendMsg=async()=>{
    const text=reply.trim();
    if(!text)return;
    setReply("");
    await supabase.from("messages").insert({therapist_id:patient.therapist_id,patient_name:patient.name,content:text,sender:"patient",unread:true});
    fetchAll();
  };

  if(loading) return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <div style={{width:52,height:52,background:C.accentG,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      </div>
      <div style={{display:"flex",gap:6}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.accent,animation:`pulse 1.2s infinite ${i*0.2}s`}}/>
        ))}
      </div>
    </div>
  );

  if(!patient) return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:24,padding:32,textAlign:"center",maxWidth:320,width:"100%"}}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.4" style={{marginBottom:16}}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        <h2 style={{color:C.text,fontSize:19,fontWeight:700,margin:"0 0 8px"}}>Cuenta no vinculada</h2>
        <p style={{color:C.muted,fontSize:14,lineHeight:1.6,margin:"0 0 22px"}}>Pide a tu fisioterapeuta el link de acceso personal.</p>
        <button onClick={()=>supabase.auth.signOut()} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 22px",color:C.muted,cursor:"pointer",fontSize:14}}>Cerrar sesión</button>
      </div>
    </div>
  );

  // Computed values
  const today      =new Date().toDateString();
  const totalEx    =pres?.exercises?.length||0;
  const todayDone  =logs.filter(l=>new Date(l.completed_at).toDateString()===today).length;
  const todayPct   =totalEx>0?Math.round((todayDone/totalEx)*100):0;
  const firstName  =patient.name.split(" ")[0];

  // Build block groups
  const blocks={};
  (pres?.exercises||[]).forEach(ex=>{const b=ex.block||"Sin bloque";if(!blocks[b])blocks[b]=[];blocks[b].push(ex);});
  const blockOrder=["Terapia","Calentamiento / Activación","Trabajo central","Sin bloque"];
  const sortedBlocks=blockOrder.filter(b=>blocks[b]);

  // Progress data
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d;});
  const lpd=last7.map(d=>({d,n:logs.filter(l=>new Date(l.completed_at).toDateString()===d.toDateString()).length}));
  const maxN=Math.max(...lpd.map(x=>x.n),1);
  let streak=0;
  for(let i=0;i<60;i++){const d=new Date();d.setDate(d.getDate()-i);if(logs.some(l=>new Date(l.completed_at).toDateString()===d.toDateString()))streak++;else if(i>0)break;}
  const dShort=["D","L","M","X","J","V","S"];

  const navItems=[
    {id:"plan",   label:"Mi plan",  svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>},
    {id:"progress",label:"Progreso", svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>},
    {id:"messages",label:"Chat",     svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>},
  ];

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>

      {/* iOS install banner */}
      {showIOS&&<IOSInstallBanner onDismiss={()=>setShowIOS(false)}/>}

      {/* Android install banner */}
      {showAndroid&&(
        <div className="slide-up" style={{position:"fixed",bottom:80,left:12,right:12,zIndex:50,background:"linear-gradient(135deg,#0d2a28,#111827)",border:`1px solid rgba(38,166,154,0.3)`,borderRadius:20,padding:16,display:"flex",gap:12,alignItems:"center",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
          <div style={{width:40,height:40,background:C.accentG,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div style={{flex:1}}>
            <p style={{color:C.text,fontWeight:600,fontSize:14,margin:0}}>Instalar FisioApp</p>
            <p style={{color:C.muted,fontSize:12,margin:"2px 0 0"}}>Accede más rápido desde tu celular</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={doInstall} style={{background:C.accentG,border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>Instalar</button>
            <button onClick={()=>setShowAndroid(false)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 10px",color:C.dim,cursor:"pointer",fontSize:13}}>✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:`calc(${12}px + env(safe-area-inset-top,0px)) 16px 12px`,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10,backdropFilter:"blur(8px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,background:C.accentG,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 12px rgba(38,166,154,0.3)`}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div>
            <p style={{fontFamily:"'Fraunces',serif",fontWeight:700,color:C.text,fontSize:16,lineHeight:1,margin:0}}>FisioApp</p>
            <p style={{color:C.muted,fontSize:11,margin:"2px 0 0",lineHeight:1}}>Hola, {firstName}</p>
          </div>
        </div>
        <button onClick={()=>supabase.auth.signOut()} style={{background:"transparent",border:"none",cursor:"pointer",color:C.dim,padding:8,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </header>

      {/* Progress bar */}
      {totalEx>0&&(
        <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"10px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
            <span style={{color:C.muted,fontSize:12}}>Progreso de hoy</span>
            <span style={{color:C.accent,fontSize:12,fontWeight:700}}>{todayDone} / {totalEx}</span>
          </div>
          <div style={{width:"100%",height:5,background:C.border,borderRadius:5,overflow:"hidden"}}>
            <div style={{width:`${todayPct}%`,height:"100%",background:todayPct===100?"linear-gradient(90deg,#26a69a,#66bb6a)":C.accent,borderRadius:5,transition:"width 0.7s cubic-bezier(0.16,1,0.3,1)"}}/>
          </div>
          {todayPct===100&&<p style={{color:C.success,fontSize:12,fontWeight:600,textAlign:"center",margin:"7px 0 0"}}>Plan completado — ¡excelente trabajo!</p>}
        </div>
      )}

      {/* Main content */}
      <main style={{flex:1,overflowY:"auto",padding:"16px",maxWidth:600,width:"100%",margin:"0 auto",paddingBottom:88}}>

        {/* ── PLAN TAB ────────────────────────────────────────────────────── */}
        {tab==="plan"&&(
          !pres?(
            <div style={{textAlign:"center",padding:"64px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
              <div style={{width:72,height:72,background:C.card,border:`1px solid ${C.border}`,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.3"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <div>
                <p style={{color:C.text,fontWeight:700,fontSize:18,margin:"0 0 6px"}}>Sin plan asignado</p>
                <p style={{color:C.muted,fontSize:14,lineHeight:1.6}}>Tu fisioterapeuta cargará tu rutina pronto</p>
              </div>
            </div>
          ):(
            <div className="fade-in">
              {/* Plan header */}
              <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:14}}>
                <h2 style={{fontFamily:"'Fraunces',serif",color:C.text,fontSize:21,margin:0,fontWeight:700}}>Plan actual</h2>
                <span style={{color:C.dim,fontSize:12}}>{new Date(pres.created_at).toLocaleDateString("es-CO",{day:"numeric",month:"short"})}</span>
              </div>

              {/* Note */}
              {pres.note&&(
                <div style={{background:"rgba(38,166,154,0.07)",border:"1px solid rgba(38,166,154,0.18)",borderRadius:16,padding:"12px 15px",marginBottom:16,display:"flex",gap:11}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.accentL} strokeWidth="2" style={{flexShrink:0,marginTop:2}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <div>
                    <p style={{color:C.accentL,fontSize:11,fontWeight:600,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:0.5}}>Nota del fisioterapeuta</p>
                    <p style={{color:C.text,fontSize:14,margin:0,lineHeight:1.6}}>{pres.note}</p>
                  </div>
                </div>
              )}

              {/* Blocks */}
              {sortedBlocks.map(blockName=>{
                const meta=BLOCK_META[blockName]||BLOCK_META["Sin bloque"];
                const exList=blocks[blockName];
                const bDone=exList.filter(ex=>logs.find(l=>l.prescription_id===pres.id&&l.exercise_id===ex.id&&new Date(l.completed_at).toDateString()===today)).length;
                return(
                  <div key={blockName} style={{marginBottom:20}}>
                    {/* Block pill */}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:meta.bg,border:`1px solid ${meta.color}33`,borderRadius:14,padding:"9px 15px",marginBottom:9}}>
                      <div style={{display:"flex",alignItems:"center",gap:9}}>
                        <div style={{width:9,height:9,borderRadius:"50%",background:meta.color}}/>
                        <span style={{color:meta.color,fontWeight:700,fontSize:13,letterSpacing:0.2}}>{blockName}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:40,height:4,background:`${meta.color}33`,borderRadius:4,overflow:"hidden"}}>
                          <div style={{width:`${exList.length>0?(bDone/exList.length)*100:0}%`,height:"100%",background:meta.color,transition:"width 0.5s"}}/>
                        </div>
                        <span style={{color:meta.color,fontSize:12,fontWeight:600}}>{bDone}/{exList.length}</span>
                      </div>
                    </div>

                    {/* Exercises */}
                    <div style={{display:"grid",gap:9}}>
                      {exList.map(ex=>{
                        const isDone=!!logs.find(l=>l.prescription_id===pres.id&&l.exercise_id===ex.id&&new Date(l.completed_at).toDateString()===today);
                        return(
                          <div key={ex.id} onClick={()=>markComplete(pres.id,ex.id)}
                            style={{background:isDone?"rgba(102,187,106,0.06)":C.card,border:`1px solid ${isDone?"rgba(102,187,106,0.22)":C.border}`,borderRadius:16,padding:"14px 16px",cursor:"pointer",transition:"all 0.2s cubic-bezier(0.16,1,0.3,1)",WebkitTapHighlightColor:"transparent"}}>
                            <div style={{display:"flex",gap:13,alignItems:"flex-start"}}>
                              {/* Circle check */}
                              <div className={isDone?"checkmark-anim":""} style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${isDone?C.success:C.dim}`,background:isDone?C.success:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all 0.25s"}}>
                                {isDone&&<svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start"}}>
                                  <p style={{color:isDone?C.muted:C.text,fontWeight:600,fontSize:15,margin:0,lineHeight:1.35,textDecoration:isDone?"line-through":"none"}}>{ex.name}</p>
                                  <div style={{flexShrink:0,textAlign:"right"}}>
                                    <p style={{color:isDone?C.dim:C.accent,fontWeight:700,fontSize:14,margin:0,whiteSpace:"nowrap"}}>{ex.sets}×{ex.reps}</p>
                                  </div>
                                </div>
                                {ex.description&&<p style={{color:isDone?C.dim:C.muted,fontSize:12,margin:"6px 0 0",lineHeight:1.55}}>{ex.description}</p>}
                                <div style={{marginTop:7,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                                  <span style={{fontSize:11,background:"rgba(255,255,255,0.04)",color:C.dim,padding:"2px 8px",borderRadius:6,border:`1px solid ${C.border}`}}>{ex.category}</span>
                                  {isDone&&<span style={{fontSize:11,color:C.success,fontWeight:600}}>Completado hoy</span>}
                                </div>
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
          )
        )}

        {/* ── PROGRESS TAB ─────────────────────────────────────────────── */}
        {tab==="progress"&&(
          <div className="fade-in">
            {/* Hero card */}
            <div style={{background:"linear-gradient(135deg,#0d2a28 0%,#0f1e2e 100%)",border:"1px solid rgba(38,166,154,0.2)",borderRadius:22,padding:"20px 22px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
              <div>
                <p style={{color:C.accentL,fontSize:12,margin:"0 0 5px",fontWeight:500}}>Progreso de hoy</p>
                <p style={{color:C.text,fontSize:40,fontWeight:800,margin:0,lineHeight:1,fontFamily:"'Fraunces',serif"}}>
                  {todayDone}
                  <span style={{fontSize:22,color:C.muted,fontWeight:400}}>/{totalEx}</span>
                </p>
                <p style={{color:C.muted,fontSize:13,marginTop:5}}>ejercicios completados</p>
              </div>
              <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Ring pct={todayPct} size={84}/>
                <span style={{position:"absolute",fontSize:16,fontWeight:700,color:todayPct===100?C.success:C.accent}}>{todayPct}%</span>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
              {[{v:streak,l:"Días seguidos",c:C.warn},{v:logs.length,l:"Total hechos",c:C.success},{v:allPres.length,l:"Planes",c:C.accent}].map((s,i)=>(
                <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"16px 8px",textAlign:"center"}}>
                  <p style={{color:s.c,fontSize:28,fontWeight:800,margin:0,fontFamily:"'Fraunces',serif"}}>{s.v}</p>
                  <p style={{color:C.muted,fontSize:11,margin:"4px 0 0",lineHeight:1.3}}>{s.l}</p>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
              <p style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,margin:"0 0 16px"}}>Últimos 7 días</p>
              <div style={{display:"flex",alignItems:"flex-end",gap:8,height:80}}>
                {lpd.map(({d,n},i)=>{
                  const isToday=d.toDateString()===today;
                  return(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                      {n>0&&<span style={{fontSize:10,color:isToday?C.accent:C.muted,fontWeight:600}}>{n}</span>}
                      <div style={{width:"100%",borderRadius:10,minHeight:4,height:`${n>0?Math.max((n/maxN)*62,8):4}px`,background:isToday?"linear-gradient(180deg,#4db6ac,#26a69a)":n>0?"rgba(38,166,154,0.35)":C.border,transition:"height 0.6s cubic-bezier(0.16,1,0.3,1)"}}/>
                      <span style={{fontSize:10,color:isToday?C.accent:C.dim,fontWeight:isToday?700:400}}>{dShort[d.getDay()]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Heatmap */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:20}}>
              <p style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,margin:"0 0 14px"}}>Consistencia · 30 días</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {Array.from({length:30},(_,i)=>{
                  const d=new Date();d.setDate(d.getDate()-(29-i));
                  const n=logs.filter(l=>new Date(l.completed_at).toDateString()===d.toDateString()).length;
                  const isT=d.toDateString()===today;
                  return(
                    <div key={i} style={{width:28,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,outline:isT?`2px solid ${C.accent}`:"none",outlineOffset:2,background:n===0?C.border:n<=2?"rgba(38,166,154,0.22)":n<=5?"rgba(38,166,154,0.5)":"rgba(38,166,154,0.88)",color:n===0?C.dim:C.text}}>
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:12}}>
                <span style={{color:C.dim,fontSize:11}}>Menos</span>
                {[C.border,"rgba(38,166,154,0.22)","rgba(38,166,154,0.5)","rgba(38,166,154,0.88)"].map((c,i)=>(
                  <div key={i} style={{width:16,height:16,borderRadius:5,background:c}}/>
                ))}
                <span style={{color:C.dim,fontSize:11}}>Más</span>
              </div>
            </div>
          </div>
        )}

        {/* ── MESSAGES TAB ────────────────────────────────────────────── */}
        {tab==="messages"&&(
          <div className="fade-in" style={{display:"flex",flexDirection:"column",height:"calc(100vh - 210px)"}}>
            <div ref={chatRef} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,paddingBottom:12}}>
              {messages.length===0?(
                <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,padding:"40px 0",textAlign:"center"}}>
                  <div style={{width:64,height:64,background:C.card,border:`1px solid ${C.border}`,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  </div>
                  <div>
                    <p style={{color:C.text,fontWeight:600,fontSize:16,margin:"0 0 4px"}}>Sin mensajes aún</p>
                    <p style={{color:C.muted,fontSize:13,lineHeight:1.5}}>Escríbele a tu fisioterapeuta con cualquier duda</p>
                  </div>
                </div>
              ):messages.map((msg,i)=>(
                <div key={msg.id} style={{display:"flex",justifyContent:msg.sender==="patient"?"flex-end":"flex-start",animation:`fadeIn 0.2s ease ${i*0.03}s both`}}>
                  {msg.sender!=="patient"&&(
                    <div style={{width:30,height:30,background:C.accentG,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",marginRight:8,flexShrink:0,alignSelf:"flex-end"}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                  )}
                  <div style={{maxWidth:"75%",background:msg.sender==="patient"?C.accentG:C.card,border:msg.sender==="patient"?"none":`1px solid ${C.border}`,borderRadius:18,borderTopRightRadius:msg.sender==="patient"?5:18,borderTopLeftRadius:msg.sender==="patient"?18:5,borderBottomRightRadius:msg.sender==="patient"?5:18,padding:"11px 15px",fontSize:14,color:C.text,lineHeight:1.55}}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
              <input value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMsg()}
                placeholder="Escribe un mensaje..."
                style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"13px 16px",fontSize:15,color:C.text,outline:"none",minHeight:48}}/>
              <button onClick={sendMsg} disabled={!reply.trim()}
                style={{width:48,height:48,background:reply.trim()?C.accentG:"rgba(255,255,255,0.05)",border:"none",borderRadius:15,display:"flex",alignItems:"center",justifyContent:"center",cursor:reply.trim()?"pointer":"default",flexShrink:0,transition:"all 0.2s"}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={reply.trim()?"white":C.dim} style={{transform:"rotate(90deg)"}}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,background:`${C.surface}f0`,borderTop:`1px solid ${C.border}`,zIndex:20,paddingBottom:"env(safe-area-inset-bottom,0px)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",maxWidth:600,margin:"0 auto"}}>
          {navItems.map(item=>{
            const active=tab===item.id;
            return(
              <button key={item.id} onClick={()=>setTab(item.id)}
                style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 0 8px",background:"transparent",border:"none",cursor:"pointer",color:active?C.accent:C.dim,transition:"color 0.2s",minHeight:56,WebkitTapHighlightColor:"transparent"}}>
                <div style={{transition:"transform 0.2s",transform:active?"scale(1.1)":"scale(1)"}}>
                  {item.svg}
                </div>
                <span style={{fontSize:10,fontWeight:active?700:400,letterSpacing:0.2}}>{item.label}</span>
                {active&&<div style={{width:4,height:4,borderRadius:"50%",background:C.accent}}/>}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
