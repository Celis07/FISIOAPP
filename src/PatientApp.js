import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

// All sizes in rem relative to 14px base set in index.html
// 1rem = 14px, so:
// 0.75rem = 10.5px, 0.85rem = 12px, 1rem = 14px, 1.1rem = 15.4px

const C = {
  bg:"#0b0e1a", surface:"#111827", card:"#1a2035", border:"#263050",
  accent:"#26a69a", accentL:"#4db6ac", accentG:"linear-gradient(135deg,#26a69a,#00796b)",
  text:"#e8edf5", muted:"#7c8db5", dim:"#3d4f7c",
  success:"#66bb6a", warn:"#ffa726",
};

const BM = {
  "Terapia":                    {c:"#ef5350", bg:"rgba(239,83,80,0.1)"},
  "Calentamiento / Activación": {c:"#ffa726", bg:"rgba(255,167,38,0.1)"},
  "Trabajo central":            {c:"#66bb6a", bg:"rgba(102,187,106,0.1)"},
  "Sin bloque":                 {c:"#7c8db5", bg:"rgba(124,141,181,0.08)"},
};

function Ring({ pct }) {
  const s = 64, r = (s-6)/2, circ = 2*Math.PI*r;
  return (
    <svg width={s} height={s} style={{transform:"rotate(-90deg)",flexShrink:0}}>
      <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={C.border} strokeWidth={5}/>
      <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={C.accent} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={circ-(pct/100)*circ}
        strokeLinecap="round" style={{transition:"stroke-dashoffset .8s cubic-bezier(.16,1,.3,1)"}}/>
    </svg>
  );
}

function IOSBanner({ onDismiss }) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (!isIOS || window.navigator.standalone) return null;
  return (
    <div className="slide-up" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:C.surface,borderTop:`1px solid rgba(38,166,154,.35)`,borderRadius:"16px 16px 0 0",padding:"16px 20px",paddingBottom:"calc(16px + env(safe-area-inset-bottom,16px))"}}>
      <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
        <div style={{width:38,height:38,background:C.accentG,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <div style={{flex:1}}>
          <p style={{color:C.text,fontWeight:700,fontSize:"1rem",margin:"0 0 4px"}}>Instalar FisioApp</p>
          <p style={{color:C.muted,fontSize:"0.85rem",margin:"0 0 12px",lineHeight:1.5}}>
            Toca <b style={{color:C.accent}}>Compartir</b> y luego <b style={{color:C.accent}}>"Añadir a pantalla de inicio"</b>
          </p>
          <button onClick={onDismiss} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 14px",color:C.muted,fontSize:"0.85rem"}}>
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientApp({ user }) {
  const [patient,setPt]   = useState(null);
  const [pres,setPres]    = useState(null);
  const [allPres,setAll]  = useState([]);
  const [logs,setLogs]    = useState([]);
  const [msgs,setMsgs]    = useState([]);
  const [reply,setReply]  = useState("");
  const [tab,setTab]      = useState("plan");
  const [loading,setLoad] = useState(true);
  const [showIOS,setIOS]  = useState(false);
  const [dPrompt,setDP]   = useState(null);
  const [showAnd,setAnd]  = useState(false);
  const chatRef           = useRef(null);

  useEffect(()=>{
    const h=e=>{e.preventDefault();setDP(e);setAnd(true);};
    window.addEventListener("beforeinstallprompt",h);
    const t=setTimeout(()=>setIOS(true),5000);
    return()=>{window.removeEventListener("beforeinstallprompt",h);clearTimeout(t);};
  },[]);

  const doInstall=async()=>{
    if(!dPrompt)return;
    dPrompt.prompt();
    const{outcome}=await dPrompt.userChoice;
    if(outcome==="accepted")setAnd(false);
  };

  useEffect(()=>{fetch();},[]);
  useEffect(()=>{ if(tab==="messages"&&chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight; },[msgs,tab]);

  const fetch=useCallback(async()=>{
    const{data:p}=await supabase.from("patients").select("*").eq("user_id",user.id).single();
    if(!p){setLoad(false);return;}
    setPt(p);
    const[{data:pr},{data:lg},{data:ms}]=await Promise.all([
      supabase.from("prescriptions").select("*").eq("patient_id",p.id).order("created_at",{ascending:false}),
      supabase.from("exercise_logs").select("*").eq("patient_id",p.id),
      supabase.from("messages").select("*").eq("patient_name",p.name).order("created_at",{ascending:true}),
    ]);
    const pa=pr||[];
    setAll(pa);setPres(pa[0]||null);
    setLogs(lg||[]);setMsgs(ms||[]);
    setLoad(false);
  },[user.id]);

  const mark=async(pid,eid)=>{
    if(navigator.vibrate)navigator.vibrate(8);
    const td=new Date().toDateString();
    const done=logs.find(l=>l.prescription_id===pid&&l.exercise_id===eid&&new Date(l.completed_at).toDateString()===td);
    if(done)await supabase.from("exercise_logs").delete().eq("id",done.id);
    else await supabase.from("exercise_logs").insert({patient_id:patient.id,prescription_id:pid,exercise_id:eid});
    fetch();
  };

  const send=async()=>{
    const t=reply.trim();if(!t)return;
    setReply("");
    await supabase.from("messages").insert({therapist_id:patient.therapist_id,patient_name:patient.name,content:t,sender:"patient",unread:true});
    fetch();
  };

  // ── Loading
  if(loading) return(
    <div style={{height:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <div style={{width:52,height:52,background:C.accentG,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      </div>
      <div style={{display:"flex",gap:6}}>
        {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.accent,animation:`pulse 1.2s ease ${i*.15}s infinite`}}/>)}
      </div>
    </div>
  );

  // ── Not linked
  if(!patient) return(
    <div style={{height:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 20px"}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:"28px 24px",textAlign:"center",width:"100%",maxWidth:340}}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" style={{marginBottom:14}}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        <p style={{color:C.text,fontWeight:700,fontSize:"1.1rem",margin:"0 0 8px"}}>Cuenta no vinculada</p>
        <p style={{color:C.muted,fontSize:"0.9rem",lineHeight:1.6,margin:"0 0 20px"}}>Pide a tu fisioterapeuta el link de acceso.</p>
        <button onClick={()=>supabase.auth.signOut()} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 0",color:C.muted,fontSize:"0.9rem",width:"100%"}}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  // ── Values
  const td      = new Date().toDateString();
  const totalEx = pres?.exercises?.length||0;
  const done    = logs.filter(l=>new Date(l.completed_at).toDateString()===td).length;
  const pct     = totalEx>0?Math.round((done/totalEx)*100):0;
  const fname   = patient.name.split(" ")[0];

  const blks={};
  (pres?.exercises||[]).forEach(ex=>{const b=ex.block||"Sin bloque";if(!blks[b])blks[b]=[];blks[b].push(ex);});
  const bOrder=["Terapia","Calentamiento / Activación","Trabajo central","Sin bloque"];
  const sBl=bOrder.filter(b=>blks[b]);

  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d;});
  const lpd=last7.map(d=>({d,n:logs.filter(l=>new Date(l.completed_at).toDateString()===d.toDateString()).length}));
  const maxN=Math.max(...lpd.map(x=>x.n),1);
  let streak=0;
  for(let i=0;i<60;i++){const d=new Date();d.setDate(d.getDate()-i);if(logs.some(l=>new Date(l.completed_at).toDateString()===d.toDateString()))streak++;else if(i>0)break;}
  const dS=["D","L","M","X","J","V","S"];

  // ── Nav
  const nav=[
    {id:"plan",   label:"Plan",     svg:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>},
    {id:"progress",label:"Progreso", svg:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>},
    {id:"messages",label:"Chat",     svg:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>},
  ];

  return (
    <div style={{height:"100vh",height:"100dvh",background:C.bg,display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {showIOS && <IOSBanner onDismiss={()=>setIOS(false)}/>}

      {showAnd && (
        <div style={{position:"fixed",bottom:68,left:10,right:10,zIndex:50,background:C.surface,border:`1px solid rgba(38,166,154,.3)`,borderRadius:14,padding:"12px 14px",display:"flex",gap:10,alignItems:"center",boxShadow:"0 4px 24px rgba(0,0,0,.5)"}}>
          <div style={{width:34,height:34,background:C.accentG,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{color:C.text,fontWeight:600,fontSize:"0.9rem",margin:0}}>Instalar FisioApp</p>
            <p style={{color:C.muted,fontSize:"0.8rem",margin:"1px 0 0"}}>Accede directo desde tu celular</p>
          </div>
          <button onClick={doInstall} style={{background:C.accentG,border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",fontWeight:700,fontSize:"0.8rem",flexShrink:0}}>Instalar</button>
          <button onClick={()=>setAnd(false)} style={{background:"transparent",border:"none",color:C.dim,fontSize:"1rem",padding:"2px 4px",flexShrink:0}}>✕</button>
        </div>
      )}

      {/* HEADER */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"10px 16px",paddingTop:"calc(10px + env(safe-area-inset-top,0px))",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:32,height:32,background:C.accentG,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div>
            <p style={{fontFamily:"'Fraunces',serif",fontWeight:700,color:C.text,fontSize:"1rem",lineHeight:1,margin:0}}>FisioApp</p>
            <p style={{color:C.muted,fontSize:"0.75rem",margin:"1px 0 0",lineHeight:1}}>Hola, {fname}</p>
          </div>
        </div>
        <button onClick={()=>supabase.auth.signOut()} style={{background:"transparent",border:"none",color:C.dim,padding:6,display:"flex"}}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>

      {/* PROGRESS BAR */}
      {totalEx>0 && (
        <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"8px 16px",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{color:C.muted,fontSize:"0.75rem"}}>Hoy</span>
            <span style={{color:C.accent,fontSize:"0.75rem",fontWeight:700}}>{done}/{totalEx} ejercicios</span>
          </div>
          <div style={{width:"100%",height:4,background:C.border,borderRadius:4,overflow:"hidden"}}>
            <div style={{width:`${pct}%`,height:"100%",borderRadius:4,background:pct===100?"linear-gradient(90deg,#26a69a,#66bb6a)":C.accent,transition:"width .7s cubic-bezier(.16,1,.3,1)"}}/>
          </div>
          {pct===100 && <p style={{color:C.success,fontSize:"0.75rem",fontWeight:600,textAlign:"center",marginTop:4}}>¡Plan completado hoy!</p>}
        </div>
      )}

      {/* SCROLL CONTENT */}
      <div style={{flex:1,overflowY:"auto",overflowX:"hidden",WebkitOverflowScrolling:"touch",paddingBottom:"calc(60px + env(safe-area-inset-bottom,0px))"}}>

        {/* ═══ PLAN ════════════════════════════════════════════════════════ */}
        {tab==="plan" && (
          <div className="fade-up" style={{padding:"14px 16px"}}>
            {!pres ? (
              <div style={{textAlign:"center",padding:"48px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
                <div style={{width:60,height:60,background:C.card,border:`1px solid ${C.border}`,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <p style={{color:C.text,fontWeight:700,fontSize:"1rem",margin:0}}>Sin plan asignado</p>
                <p style={{color:C.muted,fontSize:"0.85rem",lineHeight:1.5,margin:0}}>Tu fisioterapeuta cargará tu rutina pronto</p>
              </div>
            ):(
              <div>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12,gap:8}}>
                  <h2 style={{fontFamily:"'Fraunces',serif",color:C.text,fontSize:"1.2rem",margin:0,fontWeight:700}}>Plan actual</h2>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <span style={{color:C.dim,fontSize:"0.75rem",display:"block"}}>{new Date(pres.created_at).toLocaleDateString("es-CO",{day:"numeric",month:"short"})}</span>
                    {pres.end_date && (()=>{
                      const dl=Math.ceil((new Date(pres.end_date)-new Date())/(1000*60*60*24));
                      const col=dl<0?"#ef5350":dl<=5?"#ffa726":"#66bb6a";
                      return <span style={{fontSize:"0.7rem",fontWeight:700,color:col,background:`${col}18`,border:`1px solid ${col}33`,borderRadius:8,padding:"1px 7px",display:"block",marginTop:2}}>{dl<0?"Vencido":dl===0?"Vence hoy":`${dl}d restantes`}</span>;
                    })()}
                  </div>
                </div>

                {pres.note && (
                  <div style={{background:"rgba(38,166,154,.07)",border:"1px solid rgba(38,166,154,.18)",borderRadius:12,padding:"10px 13px",marginBottom:14,display:"flex",gap:10}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.accentL} strokeWidth="2" style={{flexShrink:0,marginTop:2}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <div>
                      <p style={{color:C.accentL,fontSize:"0.7rem",fontWeight:600,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:.5}}>Nota del fisio</p>
                      <p style={{color:C.text,fontSize:"0.85rem",margin:0,lineHeight:1.55}}>{pres.note}</p>
                    </div>
                  </div>
                )}

                {sBl.map(bn=>{
                  const meta=BM[bn]||BM["Sin bloque"];
                  const exs=blks[bn];
                  const bd=exs.filter(ex=>logs.find(l=>l.prescription_id===pres.id&&l.exercise_id===ex.id&&new Date(l.completed_at).toDateString()===td)).length;
                  return(
                    <div key={bn} style={{marginBottom:18}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:meta.bg,border:`1px solid ${meta.c}33`,borderRadius:12,padding:"7px 13px",marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:7}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:meta.c,flexShrink:0}}/>
                          <span style={{color:meta.c,fontWeight:700,fontSize:"0.85rem"}}>{bn}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:7}}>
                          <div style={{width:36,height:3,background:`${meta.c}25`,borderRadius:3,overflow:"hidden"}}>
                            <div style={{width:`${exs.length>(0)?(bd/exs.length)*100:0}%`,height:"100%",background:meta.c,transition:"width .5s"}}/>
                          </div>
                          <span style={{color:meta.c,fontSize:"0.75rem",fontWeight:600}}>{bd}/{exs.length}</span>
                        </div>
                      </div>

                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {exs.map(ex=>{
                          const isDone=!!logs.find(l=>l.prescription_id===pres.id&&l.exercise_id===ex.id&&new Date(l.completed_at).toDateString()===td);
                          return(
                            <div key={ex.id} onClick={()=>mark(pres.id,ex.id)}
                              style={{background:isDone?"rgba(102,187,106,.06)":C.card,border:`1px solid ${isDone?"rgba(102,187,106,.2)":C.border}`,borderRadius:13,padding:"12px 14px",cursor:"pointer",transition:"all .2s",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
                              <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
                                <div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${isDone?C.success:C.dim}`,background:isDone?C.success:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .2s"}}>
                                  {isDone&&<svg width="10" height="9" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start"}}>
                                    <p style={{color:isDone?C.muted:C.text,fontWeight:600,fontSize:"0.93rem",margin:0,lineHeight:1.3,textDecoration:isDone?"line-through":"none",flex:1}}>{ex.name}</p>
                                    <p style={{color:isDone?C.dim:C.accent,fontWeight:700,fontSize:"0.85rem",margin:0,flexShrink:0,whiteSpace:"nowrap"}}>{ex.sets}×{ex.reps}</p>
                                  </div>
                                  {ex.description && <p style={{color:isDone?C.dim:C.muted,fontSize:"0.8rem",margin:"4px 0 0",lineHeight:1.5}}>{ex.description}</p>}
                                  <div style={{marginTop:5,display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                                    <span style={{fontSize:"0.7rem",background:"rgba(255,255,255,.04)",color:C.dim,padding:"1px 7px",borderRadius:5,border:`1px solid ${C.border}`}}>{ex.category}</span>
                                    {isDone&&<span style={{fontSize:"0.7rem",color:C.success,fontWeight:600}}>Listo</span>}
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
            )}
          </div>
        )}

        {/* ═══ PROGRESS ════════════════════════════════════════════════════ */}
        {tab==="progress" && (
          <div className="fade-up" style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
            {/* Hero */}
            <div style={{background:"linear-gradient(135deg,#0d2a28,#0f1e2e)",border:"1px solid rgba(38,166,154,.2)",borderRadius:18,padding:"16px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div style={{minWidth:0}}>
                <p style={{color:C.accentL,fontSize:"0.75rem",margin:"0 0 4px"}}>Hoy</p>
                <p style={{color:C.text,fontSize:"2rem",fontWeight:800,margin:0,lineHeight:1,fontFamily:"'Fraunces',serif"}}>
                  {done}<span style={{fontSize:"1.1rem",color:C.muted,fontWeight:400}}>/{totalEx}</span>
                </p>
                <p style={{color:C.muted,fontSize:"0.8rem",marginTop:3}}>ejercicios</p>
              </div>
              <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Ring pct={pct}/>
                <span style={{position:"absolute",fontSize:"0.9rem",fontWeight:700,color:pct===100?C.success:C.accent}}>{pct}%</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {[{v:streak,l:"Racha",c:C.warn},{v:logs.length,l:"Total",c:C.success},{v:allPres.length,l:"Planes",c:C.accent}].map((s,i)=>(
                <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
                  <p style={{color:s.c,fontSize:"1.5rem",fontWeight:800,margin:0,fontFamily:"'Fraunces',serif"}}>{s.v}</p>
                  <p style={{color:C.muted,fontSize:"0.7rem",margin:"3px 0 0"}}>{s.l}</p>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px 14px"}}>
              <p style={{color:C.muted,fontSize:"0.7rem",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 12px"}}>Últimos 7 días</p>
              <div style={{display:"flex",alignItems:"flex-end",gap:5,height:60}}>
                {lpd.map(({d,n},i)=>{
                  const isT=d.toDateString()===td;
                  return(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      {n>0&&<span style={{fontSize:"0.65rem",color:isT?C.accent:C.muted,fontWeight:600}}>{n}</span>}
                      <div style={{width:"100%",borderRadius:6,minHeight:3,height:`${n>0?Math.max((n/maxN)*46,7):3}px`,background:isT?"linear-gradient(180deg,#4db6ac,#26a69a)":n>0?"rgba(38,166,154,.35)":C.border,transition:"height .6s"}}/>
                      <span style={{fontSize:"0.65rem",color:isT?C.accent:C.dim,fontWeight:isT?700:400}}>{dS[d.getDay()]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Heatmap */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px 14px"}}>
              <p style={{color:C.muted,fontSize:"0.7rem",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 10px"}}>30 días</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {Array.from({length:30},(_,i)=>{
                  const d=new Date();d.setDate(d.getDate()-(29-i));
                  const n=logs.filter(l=>new Date(l.completed_at).toDateString()===d.toDateString()).length;
                  const isT=d.toDateString()===td;
                  return(
                    <div key={i} style={{width:24,height:24,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",fontWeight:600,outline:isT?`2px solid ${C.accent}`:"none",outlineOffset:1,background:n===0?C.border:n<=2?"rgba(38,166,154,.22)":n<=5?"rgba(38,166,154,.5)":"rgba(38,166,154,.88)",color:n===0?C.dim:C.text}}>
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ CHAT ════════════════════════════════════════════════════════ */}
        {tab==="messages" && (
          <div className="fade-up" style={{display:"flex",flexDirection:"column",height:"100%",padding:"14px 16px 0"}}>
            <div ref={chatRef} style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",display:"flex",flexDirection:"column",gap:8,paddingBottom:12,minHeight:0}}>
              {msgs.length===0?(
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,padding:"40px 0",textAlign:"center"}}>
                  <div style={{width:56,height:56,background:C.card,border:`1px solid ${C.border}`,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  </div>
                  <div>
                    <p style={{color:C.text,fontWeight:600,fontSize:"0.95rem",margin:"0 0 4px"}}>Sin mensajes</p>
                    <p style={{color:C.muted,fontSize:"0.85rem",lineHeight:1.5}}>Escríbele a tu fisioterapeuta</p>
                  </div>
                </div>
              ):msgs.map(m=>(
                <div key={m.id} style={{display:"flex",justifyContent:m.sender==="patient"?"flex-end":"flex-start",alignItems:"flex-end",gap:7}}>
                  {m.sender!=="patient"&&(
                    <div style={{width:26,height:26,background:C.accentG,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                  )}
                  <div style={{maxWidth:"75%",background:m.sender==="patient"?C.accentG:C.card,border:m.sender==="patient"?"none":`1px solid ${C.border}`,borderRadius:15,borderTopRightRadius:m.sender==="patient"?4:15,borderTopLeftRadius:m.sender==="patient"?15:4,borderBottomRightRadius:m.sender==="patient"?4:15,padding:"9px 13px",fontSize:"0.9rem",color:C.text,lineHeight:1.5}}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,padding:"10px 0",borderTop:`1px solid ${C.border}`,flexShrink:0}}>
              <input value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
                placeholder="Escribe un mensaje..."
                style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:13,padding:"11px 14px",fontSize:"0.9rem",color:C.text,outline:"none",minHeight:44,WebkitAppearance:"none"}}/>
              <button onClick={send} disabled={!reply.trim()}
                style={{width:44,height:44,background:reply.trim()?C.accentG:"rgba(255,255,255,.04)",border:"none",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s",touchAction:"manipulation"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={reply.trim()?"white":C.dim} style={{transform:"rotate(90deg)"}}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{background:`${C.surface}f0`,borderTop:`1px solid ${C.border}`,paddingBottom:"env(safe-area-inset-bottom,0px)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",flexShrink:0}}>
        <div style={{display:"flex",maxWidth:600,margin:"0 auto"}}>
          {nav.map(item=>{
            const a=tab===item.id;
            return(
              <button key={item.id} onClick={()=>setTab(item.id)}
                style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"9px 0 7px",background:"transparent",border:"none",color:a?C.accent:C.dim,transition:"color .2s",minHeight:52,touchAction:"manipulation",WebkitTapHighlightColor:"transparent"}}>
                <div style={{transition:"transform .2s cubic-bezier(.16,1,.3,1)",transform:a?"scale(1.1)":"scale(1)"}}>{item.svg}</div>
                <span style={{fontSize:"0.68rem",fontWeight:a?700:400,lineHeight:1}}>{item.label}</span>
                {a&&<div style={{width:3,height:3,borderRadius:"50%",background:C.accent}}/>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
