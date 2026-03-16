import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const C = {
  bg:"#09090f", surface:"#111118", card:"#18181f", border:"#242433",
  accent:"#26a69a", accentL:"#4db6ac", accentG:"linear-gradient(135deg,#26a69a,#00897b)",
  text:"#e2e8f4", muted:"#6b7390", dim:"#383d52",
  success:"#4caf79", warn:"#e09c3a", danger:"#e05252",
};
const BM={
  "Terapia":                    {c:"#e05252",bg:"rgba(224,82,82,0.08)"},
  "Calentamiento / Activación": {c:"#e09c3a",bg:"rgba(224,156,58,0.08)"},
  "Trabajo central":            {c:"#4caf79",bg:"rgba(76,175,121,0.08)"},
  "Sin bloque":                 {c:"#6b7390",bg:"rgba(107,115,144,0.06)"},
};

// ── Skeleton loader ────────────────────────────────────────────────────────────
function Skel({w="100%",h=14,r=6,style={}}){
  return<div style={{width:w,height:h,borderRadius:r,background:C.border,animation:"shimmer 1.4s ease infinite",...style}}/>;
}
function PlanSkeleton(){
  return(
    <div style={{padding:"14px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <Skel w={120} h={20} r={8}/>
        <Skel w={60} h={16} r={6}/>
      </div>
      {[1,2,3].map(i=>(
        <div key={i} style={{marginBottom:18}}>
          <Skel w={140} h={32} r={10} style={{marginBottom:9}}/>
          {[1,2].map(j=>(
            <div key={j} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8}}>
              <div style={{display:"flex",gap:11}}>
                <Skel w={22} h={22} r={11}/>
                <div style={{flex:1}}>
                  <Skel w="70%" h={14} r={5} style={{marginBottom:6}}/>
                  <Skel w="40%" h={11} r={4}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Ring ───────────────────────────────────────────────────────────────────────
function Ring({pct}){
  const s=68,r=(s-6)/2,circ=2*Math.PI*r;
  return(
    <svg width={s} height={s} style={{transform:"rotate(-90deg)",flexShrink:0}}>
      <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={C.border} strokeWidth={5}/>
      <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={C.accent} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={circ-(pct/100)*circ}
        strokeLinecap="round" style={{transition:"stroke-dashoffset .8s cubic-bezier(.16,1,.3,1)"}}/>
    </svg>
  );
}

// ── Pain/Fatigue rating modal ─────────────────────────────────────────────────
function RatingModal({patientId,prescriptionId,onClose}){
  const [pain,setPain]=useState(5);
  const [fatigue,setFatigue]=useState(5);
  const [saving,setSave]=useState(false);

  const save=async()=>{
    setSave(true);
    await supabase.from("session_ratings").insert({patient_id:patientId,prescription_id:prescriptionId,pain_level:pain,fatigue_level:fatigue});
    setSave(false);onClose();
  };

  const Slider=({label,val,setVal,color})=>(
    <div style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{color:C.text,fontSize:13,fontWeight:600}}>{label}</span>
        <span style={{color,fontWeight:700,fontSize:20,fontFamily:"'Fraunces',serif"}}>{val}<span style={{fontSize:13,color:C.muted,fontWeight:400}}>/10</span></span>
      </div>
      <input type="range" min={1} max={10} value={val} onChange={e=>setVal(+e.target.value)}
        style={{width:"100%",accentColor:color}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
        <span style={{fontSize:10,color:C.dim}}>Sin {label.toLowerCase()}</span>
        <span style={{fontSize:10,color:C.dim}}>Máximo</span>
      </div>
    </div>
  );

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:"18px 18px 18px 18px",padding:"24px 22px",width:"100%",maxWidth:420,paddingBottom:"calc(24px + env(safe-area-inset-bottom,0px))"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{color:C.text,fontWeight:700,fontSize:16,margin:0}}>¿Cómo te fue hoy?</h3>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:18,padding:4}}>✕</button>
        </div>
        <Slider label="Dolor" val={pain} setVal={setPain} color={C.danger}/>
        <Slider label="Fatiga" val={fatigue} setVal={setFatigue} color={C.warn}/>
        <button onClick={save} disabled={saving}
          style={{width:"100%",background:C.accentG,border:"none",borderRadius:12,padding:12,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:4}}>
          {saving?"Guardando...":"Registrar"}
        </button>
      </div>
    </div>
  );
}

// ── iOS install banner ────────────────────────────────────────────────────────
function IOSBanner({onDismiss}){
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream;
  if(!isIOS||window.navigator.standalone)return null;
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:C.surface,borderTop:`1px solid rgba(38,166,154,.3)`,borderRadius:"14px 14px 0 0",padding:"16px 20px",paddingBottom:"calc(16px + env(safe-area-inset-bottom,16px))"}}>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <div style={{flex:1}}>
          <p style={{color:C.text,fontWeight:600,fontSize:14,margin:"0 0 3px"}}>Instalar FisioApp</p>
          <p style={{color:C.muted,fontSize:12,margin:0}}>Toca <b style={{color:C.accent}}>Compartir</b> → <b style={{color:C.accent}}>Añadir a pantalla de inicio</b></p>
        </div>
        <button onClick={onDismiss} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",color:C.muted,cursor:"pointer",fontSize:12,flexShrink:0}}>No ahora</button>
      </div>
    </div>
  );
}

// ── Achievements ──────────────────────────────────────────────────────────────
function getAchievements(streak, totalCompleted){
  const list=[];
  if(streak>=3)  list.push({icon:"🔥",label:"3 días seguidos",sub:"¡Constancia!"});
  if(streak>=7)  list.push({icon:"⚡",label:"Semana completa",sub:"Una semana sin fallar"});
  if(streak>=14) list.push({icon:"💎",label:"2 semanas",sub:"Compromiso total"});
  if(totalCompleted>=50)  list.push({icon:"🏅",label:"50 ejercicios",sub:"Ya vas sumando"});
  if(totalCompleted>=100) list.push({icon:"🏆",label:"100 ejercicios",sub:"¡Centenario!"});
  if(totalCompleted>=250) list.push({icon:"🌟",label:"250 ejercicios",sub:"Leyenda"});
  return list;
}

// ── Motivational message ──────────────────────────────────────────────────────
function getMotivation(done, total){
  if(total===0) return null;
  const left=total-done;
  if(done===0)  return `Tienes ${total} ejercicio${total>1?"s":""} para hoy. ¡Puedes con esto!`;
  if(left===0)  return "¡Plan completado! Excelente trabajo hoy.";
  if(left===1)  return "¡Solo te falta 1 ejercicio! Casi lo logras.";
  if(left<=3)   return `Te faltan ${left} ejercicios para completar tu plan de hoy.`;
  if(done>=total/2) return "Ya vas por más de la mitad. ¡Sigue!";
  return null;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function PatientApp({user}){
  const [patient,setPt]       = useState(null);
  const [pres,setPres]        = useState(null);
  const [allPres,setAll]      = useState([]);
  const [logs,setLogs]        = useState([]);
  const [msgs,setMsgs]        = useState([]);
  const [reply,setReply]      = useState("");
  const [tab,setTab]          = useState("plan");
  const [loading,setLoad]     = useState(true);
  const [showIOS,setIOS]      = useState(false);
  const [dPrompt,setDP]       = useState(null);
  const [showAnd,setAnd]      = useState(false);
  const [showRating,setRating]= useState(false);
  const [pushEnabled,setPush] = useState(false);
  const chatRef               = useRef(null);

  // PWA install + push
  useEffect(()=>{
    const h=e=>{e.preventDefault();setDP(e);setAnd(true);};
    window.addEventListener("beforeinstallprompt",h);
    const t=setTimeout(()=>setIOS(true),5000);
    // Check push permission
    if("Notification" in window) setPush(Notification.permission==="granted");
    return()=>{window.removeEventListener("beforeinstallprompt",h);clearTimeout(t);};
  },[]);

  const requestPush=async()=>{
    if(!("Notification" in window)||!("serviceWorker" in navigator))return;
    const perm=await Notification.requestPermission();
    if(perm==="granted"){
      setPush(true);
      // Register SW and save subscription
      try{
        const reg=await navigator.serviceWorker.ready;
        // Show local notification as test
        reg.showNotification("FisioApp activado",{body:"Recibirás notificaciones cuando tengas un plan nuevo.",icon:"/icons/icon-192x192.png",badge:"/icons/icon-72x72.png"});
      }catch(e){}
    }
  };

  const doInstall=async()=>{if(!dPrompt)return;dPrompt.prompt();const{outcome}=await dPrompt.userChoice;if(outcome==="accepted")setAnd(false);};

  useEffect(()=>{loadAll();},[]);
  useEffect(()=>{if(tab==="messages"&&chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[msgs,tab]);

  const loadAll=useCallback(async()=>{
    const{data:p}=await supabase.from("patients").select("*").eq("user_id",user.id).single();
    if(!p){setLoad(false);return;}
    setPt(p);
    const[{data:pr},{data:lg},{data:ms}]=await Promise.all([
      supabase.from("prescriptions").select("*").eq("patient_id",p.id).order("created_at",{ascending:false}),
      supabase.from("exercise_logs").select("*").eq("patient_id",p.id),
      supabase.from("messages").select("*").eq("patient_name",p.name).order("created_at",{ascending:true}),
    ]);
    const pa=pr||[];setAll(pa);setPres(pa[0]||null);setLogs(lg||[]);setMsgs(ms||[]);setLoad(false);
  },[user.id]);

  const mark=async(pid,eid)=>{
    if(navigator.vibrate)navigator.vibrate(8);
    const td=new Date().toDateString();
    const done=logs.find(l=>l.prescription_id===pid&&l.exercise_id===eid&&new Date(l.completed_at).toDateString()===td);
    if(done)await supabase.from("exercise_logs").delete().eq("id",done.id);
    else await supabase.from("exercise_logs").insert({patient_id:patient.id,prescription_id:pid,exercise_id:eid});
    loadAll();
  };

  const send=async()=>{const t=reply.trim();if(!t)return;setReply("");await supabase.from("messages").insert({therapist_id:patient.therapist_id,patient_name:patient.name,content:t,sender:"patient",unread:true});loadAll();};

  // Loading state — skeleton
  if(loading) return(
    <div style={{height:"100vh",background:C.bg,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`@keyframes shimmer{0%,100%{opacity:.5}50%{opacity:1}}@keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}.fade{animation:fadeUp .22s ease both}`}</style>
      {/* Fake header */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <Skel w={30} h={30} r={9}/>
          <div><Skel w={70} h={13} r={4} style={{marginBottom:4}}/><Skel w={50} h={10} r={3}/></div>
        </div>
      </div>
      <PlanSkeleton/>
    </div>
  );

  if(!patient) return(
    <div style={{height:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"28px 24px",textAlign:"center",maxWidth:300,width:"100%"}}>
        <p style={{color:C.text,fontWeight:600,fontSize:16,margin:"0 0 8px"}}>Cuenta no vinculada</p>
        <p style={{color:C.muted,fontSize:13,lineHeight:1.6,margin:"0 0 20px"}}>Pide a tu fisioterapeuta el link de acceso.</p>
        <button onClick={()=>supabase.auth.signOut()} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 0",color:C.muted,cursor:"pointer",fontSize:13,width:"100%"}}>Cerrar sesión</button>
      </div>
    </div>
  );

  const td=new Date().toDateString();
  const totalEx=pres?.exercises?.length||0;
  const done=logs.filter(l=>new Date(l.completed_at).toDateString()===td).length;
  const pct=totalEx>0?Math.round((done/totalEx)*100):0;
  const fname=patient.name.split(" ")[0];
  const daysLeft=pres?.end_date?Math.ceil((new Date(pres.end_date)-new Date())/864e5):null;
  const dlCol=daysLeft===null?null:daysLeft<0?C.danger:daysLeft<=5?C.warn:C.success;

  const blks={};
  (pres?.exercises||[]).forEach(ex=>{const b=ex.block||"Sin bloque";if(!blks[b])blks[b]=[];blks[b].push(ex);});
  const bOrder=["Terapia","Calentamiento / Activación","Trabajo central","Sin bloque"];
  const sBl=bOrder.filter(b=>blks[b]);

  // Progress data
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d;});
  const lpd=last7.map(d=>({d,n:logs.filter(l=>new Date(l.completed_at).toDateString()===d.toDateString()).length}));
  const maxN=Math.max(...lpd.map(x=>x.n),1);
  let streak=0;for(let i=0;i<60;i++){const d=new Date();d.setDate(d.getDate()-i);if(logs.some(l=>new Date(l.completed_at).toDateString()===d.toDateString()))streak++;else if(i>0)break;}
  const dS=["D","L","M","X","J","V","S"];
  const achievements=getAchievements(streak,logs.length);
  const motivation=getMotivation(done,totalEx);

  const NAV=[
    {id:"plan",    label:"Plan",    svg:<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>},
    {id:"progress",label:"Progreso",svg:<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>},
    {id:"messages",label:"Chat",    svg:<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>},
  ];

  return(
    <div style={{height:"100vh",height:"100dvh",background:C.bg,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}.fade{animation:fadeUp .22s ease both}@keyframes shimmer{0%,100%{opacity:.5}50%{opacity:1}}@keyframes pop{0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)}}.pop{animation:pop .3s cubic-bezier(.16,1,.3,1)}`}</style>

      {showIOS&&<IOSBanner onDismiss={()=>setIOS(false)}/>}
      {showRating&&pres&&<RatingModal patientId={patient.id} prescriptionId={pres.id} onClose={()=>setRating(false)}/>}

      {showAnd&&(
        <div style={{position:"fixed",bottom:60,left:10,right:10,zIndex:50,background:C.surface,border:`1px solid rgba(38,166,154,.25)`,borderRadius:12,padding:"12px 14px",display:"flex",gap:10,alignItems:"center",boxShadow:"0 4px 20px rgba(0,0,0,.5)"}}>
          <div style={{flex:1}}><p style={{color:C.text,fontWeight:600,fontSize:13,margin:0}}>Instalar FisioApp</p><p style={{color:C.muted,fontSize:11,margin:"1px 0 0"}}>Accede directo desde tu celular</p></div>
          <button onClick={doInstall} style={{background:C.accentG,border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",fontWeight:700,fontSize:12,flexShrink:0}}>Instalar</button>
          <button onClick={()=>setAnd(false)} style={{background:"transparent",border:"none",color:C.dim,fontSize:16,cursor:"pointer",padding:"2px 4px"}}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"10px 16px",paddingTop:"calc(10px + env(safe-area-inset-top,0px))",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:30,height:30,background:C.accentG,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div>
            <p style={{fontFamily:"'Fraunces',serif",fontWeight:700,color:C.text,fontSize:14,lineHeight:1,margin:0}}>FisioApp</p>
            <p style={{color:C.muted,fontSize:11,margin:"1px 0 0",lineHeight:1}}>Hola, {fname}</p>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {!pushEnabled&&"Notification" in window&&(
            <button onClick={requestPush} title="Activar notificaciones"
              style={{background:"rgba(38,166,154,.1)",border:"1px solid rgba(38,166,154,.2)",borderRadius:8,padding:"5px 9px",color:C.accent,cursor:"pointer",fontSize:11,fontWeight:600}}>
              🔔 Activar alertas
            </button>
          )}
          {pushEnabled&&<span style={{fontSize:11,color:C.success}}>🔔</span>}
          <button onClick={()=>supabase.auth.signOut()} style={{background:"transparent",border:"none",color:C.dim,padding:6,display:"flex",cursor:"pointer"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* Motivation banner */}
      {motivation&&tab==="plan"&&(
        <div style={{background:"rgba(38,166,154,.07)",borderBottom:`1px solid rgba(38,166,154,.12)`,padding:"7px 16px",flexShrink:0}}>
          <p style={{color:C.accentL,fontSize:12,margin:0,fontWeight:500}}>{motivation}</p>
        </div>
      )}

      {/* Progress strip */}
      {totalEx>0&&tab==="plan"&&(
        <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"7px 16px",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{color:C.muted,fontSize:11}}>Hoy</span>
            <span style={{color:C.accent,fontSize:11,fontWeight:700}}>{done}/{totalEx}</span>
          </div>
          <div style={{width:"100%",height:3,background:C.border,borderRadius:3,overflow:"hidden"}}>
            <div style={{width:`${pct}%`,height:"100%",borderRadius:3,background:pct===100?"linear-gradient(90deg,#26a69a,#4caf79)":C.accent,transition:"width .7s cubic-bezier(.16,1,.3,1)"}}/>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",overflowX:"hidden",WebkitOverflowScrolling:"touch",paddingBottom:"calc(58px + env(safe-area-inset-bottom,0px))"}}>

        {/* ── PLAN ── */}
        {tab==="plan"&&(
          <div className="fade" style={{padding:"14px 16px"}}>
            {!pres?(
              <div style={{textAlign:"center",padding:"52px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.3"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <p style={{color:C.text,fontWeight:600,fontSize:15,margin:0}}>Sin plan asignado</p>
                <p style={{color:C.muted,fontSize:13}}>Tu fisioterapeuta cargará tu rutina pronto</p>
              </div>
            ):(
              <div>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12,gap:8}}>
                  <h2 style={{fontFamily:"'Fraunces',serif",color:C.text,fontSize:"1.15rem",margin:0,fontWeight:700}}>Plan actual</h2>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <span style={{color:C.dim,fontSize:"0.7rem",display:"block"}}>{new Date(pres.created_at).toLocaleDateString("es-CO",{day:"numeric",month:"short"})}</span>
                    {dlCol&&<span style={{fontSize:"0.65rem",fontWeight:700,color:dlCol,background:`${dlCol}18`,border:`1px solid ${dlCol}30`,borderRadius:6,padding:"1px 6px",display:"block",marginTop:2}}>{daysLeft<0?"Vencido":daysLeft===0?"Vence hoy":`${daysLeft}d`}</span>}
                  </div>
                </div>

                {pres.note&&(
                  <div style={{background:"rgba(38,166,154,.06)",border:"1px solid rgba(38,166,154,.15)",borderRadius:10,padding:"10px 13px",marginBottom:14,display:"flex",gap:9}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.accentL} strokeWidth="2" style={{flexShrink:0,marginTop:2}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p style={{color:C.text,fontSize:"0.82rem",margin:0,lineHeight:1.6}}>{pres.note}</p>
                  </div>
                )}

                {sBl.map(bn=>{
                  const meta=BM[bn]||BM["Sin bloque"];
                  const exs=blks[bn];
                  const bd=exs.filter(ex=>logs.find(l=>l.prescription_id===pres.id&&l.exercise_id===ex.id&&new Date(l.completed_at).toDateString()===td)).length;
                  return(
                    <div key={bn} style={{marginBottom:16}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:meta.bg,border:`1px solid ${meta.c}25`,borderRadius:10,padding:"6px 12px",marginBottom:7}}>
                        <div style={{display:"flex",alignItems:"center",gap:7}}>
                          <div style={{width:7,height:7,borderRadius:"50%",background:meta.c}}/>
                          <span style={{color:meta.c,fontWeight:700,fontSize:"0.8rem"}}>{bn}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:32,height:3,background:`${meta.c}20`,borderRadius:3,overflow:"hidden"}}><div style={{width:`${exs.length>0?(bd/exs.length)*100:0}%`,height:"100%",background:meta.c,transition:"width .5s"}}/></div>
                          <span style={{color:meta.c,fontSize:"0.7rem",fontWeight:600}}>{bd}/{exs.length}</span>
                        </div>
                      </div>

                      <div style={{display:"flex",flexDirection:"column",gap:7}}>
                        {exs.map(ex=>{
                          const isDone=!!logs.find(l=>l.prescription_id===pres.id&&l.exercise_id===ex.id&&new Date(l.completed_at).toDateString()===td);
                          return(
                            <div key={ex.id} onClick={()=>mark(pres.id,ex.id)}
                              style={{background:isDone?"rgba(76,175,121,.06)":C.card,border:`1px solid ${isDone?"rgba(76,175,121,.18)":C.border}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",transition:"all .18s",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
                              <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
                                <div className={isDone?"pop":""} style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${isDone?C.success:C.dim}`,background:isDone?C.success:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .2s"}}>
                                  {isDone&&<svg width="10" height="9" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                                    <p style={{color:isDone?C.muted:C.text,fontWeight:600,fontSize:"0.88rem",margin:0,lineHeight:1.3,textDecoration:isDone?"line-through":"none",flex:1}}>{ex.name}</p>
                                    <p style={{color:isDone?C.dim:C.accent,fontWeight:700,fontSize:"0.8rem",margin:0,flexShrink:0,whiteSpace:"nowrap"}}>{ex.sets}×{ex.reps}</p>
                                  </div>
                                  {ex.description&&<p style={{color:isDone?C.dim:C.muted,fontSize:"0.75rem",margin:"5px 0 0",lineHeight:1.5}}>{ex.description}</p>}
                                  <div style={{marginTop:5,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                                    <span style={{fontSize:"0.65rem",color:C.dim,background:"rgba(255,255,255,.03)",padding:"1px 7px",borderRadius:5,border:`1px solid ${C.border}`}}>{ex.category}</span>
                                    {isDone&&<span style={{fontSize:"0.65rem",color:C.success,fontWeight:600}}>Listo</span>}
                                    {ex.video_url&&<a href={ex.video_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:"0.65rem",color:C.accent,textDecoration:"none",fontWeight:600}}>▶ Ver video</a>}
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

                {/* Register pain/fatigue after completing */}
                {pct>0&&(
                  <button onClick={()=>setRating(true)}
                    style={{width:"100%",background:"transparent",border:`1px dashed ${C.border}`,borderRadius:12,padding:"10px",color:C.muted,cursor:"pointer",fontSize:12,marginTop:4,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    <span style={{fontSize:14}}>📊</span>
                    Registrar dolor y fatiga de hoy
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PROGRESS ── */}
        {tab==="progress"&&(
          <div className="fade" style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
            {/* Hero ring */}
            <div style={{background:"linear-gradient(135deg,#0a1e1c,#0c1824)",border:"1px solid rgba(38,166,154,.15)",borderRadius:16,padding:"16px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div>
                <p style={{color:C.accentL,fontSize:"0.7rem",margin:"0 0 4px"}}>Hoy</p>
                <p style={{color:C.text,fontSize:"2rem",fontWeight:800,margin:0,lineHeight:1,fontFamily:"'Fraunces',serif"}}>{done}<span style={{fontSize:"1.1rem",color:C.muted,fontWeight:400}}>/{totalEx}</span></p>
                <p style={{color:C.muted,fontSize:"0.75rem",marginTop:3}}>ejercicios</p>
              </div>
              <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Ring pct={pct}/>
                <span style={{position:"absolute",fontSize:"0.85rem",fontWeight:700,color:pct===100?C.success:C.accent}}>{pct}%</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {[{v:streak,l:"Racha",c:C.warn},{v:logs.length,l:"Total",c:C.success},{v:allPres.length,l:"Planes",c:C.accent}].map((s,i)=>(
                <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
                  <p style={{color:s.c,fontSize:"1.4rem",fontWeight:800,margin:0,fontFamily:"'Fraunces',serif"}}>{s.v}</p>
                  <p style={{color:C.muted,fontSize:"0.65rem",margin:"3px 0 0"}}>{s.l}</p>
                </div>
              ))}
            </div>

            {/* Achievements */}
            {achievements.length>0&&(
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:14}}>
                <p style={{color:C.muted,fontSize:"0.65rem",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 10px"}}>Logros</p>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  {achievements.map((a,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"7px 11px"}}>
                      <span style={{fontSize:20}}>{a.icon}</span>
                      <div>
                        <p style={{color:C.text,fontSize:12,fontWeight:600,margin:0}}>{a.label}</p>
                        <p style={{color:C.muted,fontSize:10,margin:"1px 0 0"}}>{a.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bar chart */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 14px"}}>
              <p style={{color:C.muted,fontSize:"0.65rem",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 12px"}}>7 días</p>
              <div style={{display:"flex",alignItems:"flex-end",gap:5,height:56}}>
                {lpd.map(({d,n},i)=>{const isT=d.toDateString()===td;return(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    {n>0&&<span style={{fontSize:"0.6rem",color:isT?C.accent:C.muted}}>{n}</span>}
                    <div style={{width:"100%",borderRadius:5,minHeight:3,height:`${n>0?Math.max((n/maxN)*42,6):3}px`,background:isT?C.accent:n>0?"rgba(38,166,154,.3)":C.border,transition:"height .5s"}}/>
                    <span style={{fontSize:"0.6rem",color:isT?C.accent:C.dim,fontWeight:isT?700:400}}>{dS[d.getDay()]}</span>
                  </div>
                );})}
              </div>
            </div>

            {/* Heatmap */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 14px"}}>
              <p style={{color:C.muted,fontSize:"0.65rem",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 10px"}}>30 días</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(29-i));const n=logs.filter(l=>new Date(l.completed_at).toDateString()===d.toDateString()).length;const isT=d.toDateString()===td;return<div key={i} style={{width:24,height:24,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.6rem",fontWeight:600,outline:isT?`2px solid ${C.accent}`:"none",outlineOffset:1,background:n===0?C.border:n<=2?"rgba(38,166,154,.2)":n<=5?"rgba(38,166,154,.5)":"rgba(38,166,154,.85)",color:n===0?C.dim:C.text}}>{d.getDate()}</div>;})}
              </div>
            </div>
          </div>
        )}

        {/* ── CHAT ── */}
        {tab==="messages"&&(
          <div className="fade" style={{display:"flex",flexDirection:"column",height:"calc(100dvh - 120px)",padding:"14px 16px 0"}}>
            <div ref={chatRef} style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",display:"flex",flexDirection:"column",gap:8,paddingBottom:8}}>
              {msgs.length===0?(
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,flex:1,textAlign:"center"}}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  <p style={{color:C.muted,fontSize:13}}>Escríbele a tu fisioterapeuta</p>
                </div>
              ):msgs.map(m=>(
                <div key={m.id} style={{display:"flex",justifyContent:m.sender==="patient"?"flex-end":"flex-start",alignItems:"flex-end",gap:7}}>
                  {m.sender!=="patient"&&<div style={{width:24,height:24,background:C.accentG,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>}
                  <div style={{maxWidth:"76%",background:m.sender==="patient"?C.accentG:C.card,border:m.sender==="patient"?"none":`1px solid ${C.border}`,borderRadius:13,borderTopRightRadius:m.sender==="patient"?4:13,borderTopLeftRadius:m.sender==="patient"?13:4,borderBottomRightRadius:m.sender==="patient"?4:13,padding:"9px 13px",fontSize:"0.88rem",color:C.text,lineHeight:1.5}}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,padding:"10px 0",borderTop:`1px solid ${C.border}`,flexShrink:0}}>
              <input value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Mensaje..."
                style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 14px",fontSize:"0.88rem",color:C.text,outline:"none",WebkitAppearance:"none",minHeight:44}}/>
              <button onClick={send} disabled={!reply.trim()} style={{width:44,height:44,background:reply.trim()?C.accentG:"rgba(255,255,255,.04)",border:"none",borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",cursor:reply.trim()?"pointer":"default",flexShrink:0,transition:"all .2s"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={reply.trim()?"white":C.dim} style={{transform:"rotate(90deg)"}}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{background:`${C.surface}ee`,borderTop:`1px solid ${C.border}`,paddingBottom:"env(safe-area-inset-bottom,0px)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",flexShrink:0}}>
        <div style={{display:"flex",maxWidth:500,margin:"0 auto"}}>
          {NAV.map(item=>{const a=tab===item.id;return(
            <button key={item.id} onClick={()=>setTab(item.id)}
              style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"9px 0 7px",background:"transparent",border:"none",cursor:"pointer",color:a?C.accent:C.dim,transition:"color .15s",touchAction:"manipulation",WebkitTapHighlightColor:"transparent"}}>
              <div style={{transform:a?"scale(1.05)":"scale(1)",transition:"transform .2s"}}>{item.svg}</div>
              <span style={{fontSize:"0.6rem",fontWeight:a?700:400,lineHeight:1}}>{item.label}</span>
              {a&&<div style={{width:3,height:3,borderRadius:"50%",background:C.accent}}/>}
            </button>
          );})}
        </div>
      </div>
    </div>
  );
}
