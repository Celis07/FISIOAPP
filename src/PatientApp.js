import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

function localDateStr(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),dd=String(d.getDate()).padStart(2,"0");return`${y}-${m}-${dd}`;}

const C = {
  bg:"#f0f4f8", surface:"#ffffff", card:"#f8f9fb", border:"#e2e6ed",
  accent:"#0891b2", accentL:"#22d3ee", accentG:"linear-gradient(135deg,#0891b2,#0e7490)",
  text:"#0f172a", muted:"#64748b", dim:"#94a3b8",
  success:"#16a34a", warn:"#d97706", danger:"#dc2626",
};
const BM={
  "Terapia":                    {c:"#dc2626",bg:"rgba(220,38,38,0.06)"},
  "Calentamiento / Activación": {c:"#d97706",bg:"rgba(217,119,6,0.06)"},
  "Trabajo central":            {c:"#16a34a",bg:"rgba(22,163,74,0.06)"},
  "Sin bloque":                 {c:"#64748b",bg:"rgba(100,116,139,0.06)"},
};

// ── Skeleton loader ────────────────────────────────────────────────────────────
function Skel({w="100%",h=14,r=6,style={}}){
  return<div style={{width:w,height:h,borderRadius:r,background:"#e2e6ed",animation:"shimmer 1.4s ease infinite",...style}}/>;
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

// ─── BOOKING VIEW ─────────────────────────────────────────────────────────────
function BookingView({patient}){
  const [slots,setSlots]       = useState([]);
  const [appointments,setAppts]= useState([]);
  const [loading,setLoad]      = useState(true);
  const [selectedDate,setDate] = useState(null);
  const [booking,setBooking]   = useState(null); // {date,time}
  const [saving,setSave]       = useState(false);
  const [success,setSuccess]   = useState(false);

  const DAYS=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const DAYS_SHORT=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

  useEffect(()=>{ loadData(); },[]);

  const loadData=async()=>{
    const[{data:av},{data:ap}]=await Promise.all([
      supabase.from("availability").select("*").eq("active",true).order("day_of_week").order("start_time"),
      supabase.from("appointments").select("*").gte("date",localDateStr(new Date())),
    ]);
    setSlots(av||[]);setAppts(ap||[]);setLoad(false);
  };

  // Build next 14 days with available slots
  const days=Array.from({length:14},(_,i)=>{
    const d=new Date();d.setDate(d.getDate()+i+1);
    return d;
  }).filter(d=>{
    const dow=d.getDay();
    return slots.some(s=>s.day_of_week===dow);
  });

  // Get time slots for a given date
  const getSlotsForDate=(date)=>{
    const dow=date.getDay();
    const ds=localDateStr(date);
    const daySlots=slots.filter(s=>s.day_of_week===dow);
    const times=[];
    daySlots.forEach(s=>{
      // Generate hourly slots within range
      const startH=parseInt(s.start_time.split(":")[0]);
      const endH=parseInt(s.end_time.split(":")[0]);
      for(let h=startH;h<endH;h++){
        const t=`${String(h).padStart(2,"0")}:00`;
        const occupied=appointments.filter(a=>a.date===ds&&a.time===t).length;
        if(occupied<2) times.push({time:t,occupied,max:2}); // max 2 per slot
      }
    });
    return times.sort((a,b)=>a.time>b.time?1:-1);
  };

  const book=async()=>{
    if(!booking||!patient)return;
    setSave(true);
    await supabase.from("appointments").insert({
      therapist_id:patient.therapist_id,
      patient_name:patient.name,
      date:booking.date,
      time:booking.time,
      type:"Presencial",
      status:"pendiente"
    });
    setSave(false);setSuccess(true);setBooking(null);
    loadData();
  };

  if(loading)return(
    <div style={{display:"flex",justifyContent:"center",padding:48}}>
      <div style={{width:22,height:22,border:`2px solid ${C.accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    </div>
  );

  if(success)return(
    <div style={{textAlign:"center",padding:"52px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
      <div style={{width:56,height:56,background:"rgba(22,163,74,.1)",border:"1px solid rgba(22,163,74,.25)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <p style={{color:C.text,fontWeight:700,fontSize:16,margin:0}}>¡Reserva enviada!</p>
      <p style={{color:C.muted,fontSize:13,lineHeight:1.6}}>Tu fisioterapeuta confirmará la cita pronto.</p>
      <button onClick={()=>setSuccess(false)} style={{background:C.accentG,border:"none",borderRadius:10,padding:"9px 22px",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>Ver más horarios</button>
    </div>
  );

  // My upcoming appointments
  const myAppts=appointments.filter(a=>a.patient_name===patient.name).sort((a,b)=>a.date>b.date?1:-1);

  return(
    <div style={{padding:"14px 16px"}}>
      {/* Confirm booking modal */}
      {booking&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:"18px 18px 18px 18px",padding:"22px 20px",width:"100%",maxWidth:420,paddingBottom:"calc(22px + env(safe-area-inset-bottom,0px))"}}>
            <h3 style={{color:C.text,fontWeight:700,fontSize:16,margin:"0 0 6px"}}>Confirmar reserva</h3>
            <p style={{color:C.muted,fontSize:13,margin:"0 0 18px",lineHeight:1.6}}>
              {new Date(booking.date+"T12:00").toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"})} a las <strong style={{color:C.text}}>{booking.time}</strong>
            </p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={book} disabled={saving} style={{flex:1,background:C.accentG,border:"none",borderRadius:10,padding:11,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}}>
                {saving?"Reservando...":"Confirmar"}
              </button>
              <button onClick={()=>setBooking(null)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 16px",color:C.muted,cursor:"pointer",fontSize:13}}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 style={{fontFamily:"'Fraunces',serif",color:C.text,fontSize:"1.15rem",margin:"0 0 4px",fontWeight:700}}>Reservar sesión</h2>
      <p style={{color:C.muted,fontSize:"0.8rem",margin:"0 0 16px"}}>Selecciona un día y hora disponible</p>

      {/* My upcoming bookings */}
      {myAppts.length>0&&(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",marginBottom:16}}>
          <p style={{color:C.muted,fontSize:"0.7rem",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 10px"}}>Mis próximas citas</p>
          {myAppts.slice(0,3).map(a=>(
            <div key={a.id} style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
              <div style={{background:"rgba(8,145,178,.08)",border:"1px solid rgba(8,145,178,.15)",borderRadius:8,padding:"3px 8px",textAlign:"center",minWidth:52,flexShrink:0}}>
                <p style={{color:C.accent,fontWeight:700,fontSize:"0.8rem",margin:0}}>{a.time}</p>
                <p style={{color:C.muted,fontSize:"0.65rem",margin:0}}>{a.date?.slice(5)}</p>
              </div>
              <div>
                <p style={{color:C.text,fontSize:"0.85rem",fontWeight:600,margin:0}}>{new Date(a.date+"T12:00").toLocaleDateString("es-CO",{weekday:"short",day:"numeric",month:"short"})}</p>
                <p style={{color:a.status==="confirmada"?C.success:C.warn,fontSize:"0.7rem",margin:"1px 0 0",fontWeight:600,textTransform:"capitalize"}}>{a.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {days.length===0?(
        <div style={{textAlign:"center",padding:"40px 0"}}>
          <p style={{color:C.text,fontWeight:600,fontSize:15,margin:"0 0 6px"}}>Sin horarios disponibles</p>
          <p style={{color:C.muted,fontSize:13}}>Tu fisioterapeuta aún no ha publicado horarios</p>
        </div>
      ):(
        <>
          {/* Date selector */}
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:14,WebkitOverflowScrolling:"touch"}}>
            {days.map((d,i)=>{
              const ds=localDateStr(d);
              const isSelected=selectedDate===ds;
              const hasSlots=getSlotsForDate(d).length>0;
              return(
                <button key={i} onClick={()=>setDate(ds)}
                  style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"8px 12px",borderRadius:12,border:`1px solid ${isSelected?C.accent:C.border}`,background:isSelected?C.accentG:"transparent",cursor:"pointer",opacity:hasSlots?1:.4,minWidth:52}}>
                  <span style={{fontSize:"0.65rem",color:isSelected?"rgba(255,255,255,.8)":C.muted,fontWeight:500}}>{DAYS_SHORT[d.getDay()]}</span>
                  <span style={{fontSize:"1rem",fontWeight:700,color:isSelected?"#fff":C.text,lineHeight:1}}>{d.getDate()}</span>
                  {hasSlots&&!isSelected&&<div style={{width:4,height:4,borderRadius:"50%",background:C.accent}}/>}
                </button>
              );
            })}
          </div>

          {/* Time slots for selected date */}
          {selectedDate&&(()=>{
            const selDate=new Date(selectedDate+"T12:00");
            const times=getSlotsForDate(selDate);
            return(
              <div>
                <p style={{color:C.muted,fontSize:"0.7rem",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 10px"}}>
                  {selDate.toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"})}
                </p>
                {times.length===0?(
                  <p style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>Sin horarios disponibles este día</p>
                ):(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:8}}>
                    {times.map(({time,occupied,max})=>{
                      const pct=occupied/max;
                      const isAlmost=pct>0;
                      return(
                        <button key={time} onClick={()=>setBooking({date:selectedDate,time})}
                          style={{padding:"10px 8px",borderRadius:12,border:`1px solid ${isAlmost?"rgba(217,119,6,.3)":C.border}`,background:isAlmost?"rgba(217,119,6,.06)":C.surface,cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                          <p style={{color:C.text,fontWeight:700,fontSize:"0.95rem",margin:0}}>{time}</p>
                          {isAlmost&&<p style={{color:C.warn,fontSize:"0.65rem",margin:"2px 0 0",fontWeight:600}}>1 lugar</p>}
                          {!isAlmost&&<p style={{color:C.success,fontSize:"0.65rem",margin:"2px 0 0",fontWeight:600}}>Disponible</p>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

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
    {id:"booking", label:"Reservar",svg:<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>},
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
          <div style={{width:34,height:34,background:C.accentG,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:5}}>
            <svg width="24" height="24" viewBox="0 0 80 80" fill="none">
              <line x1="4" y1="52" x2="76" y2="52" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.4"/>
              <path d="M4,52 Q20,20 36,52 Q52,84 68,52 Q84,20 100,52" fill="rgba(255,255,255,0.12)" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24,34 Q40,-8 56,34" fill="none" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
              <circle cx="40" cy="-2" r="7" fill="white"/>
            </svg>
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
                  <div style={{background:"rgba(38,166,154,.06)",border:"1px solid #b2ebf2",borderRadius:10,padding:"10px 13px",marginBottom:14,display:"flex",gap:9}}>
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

        {/* ── BOOKING ── */}
        {tab==="booking"&&patient&&(
          <BookingView patient={patient}/>
        )}

        {/* ── PROGRESS ── */}
        {tab==="progress"&&(
          <div className="fade" style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
            {/* Hero ring */}
            <div style={{background:"linear-gradient(135deg,#e0f7fa,#e3f2fd)",border:"1px solid #b2ebf2",borderRadius:16,padding:"16px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
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
                    <div style={{width:"100%",borderRadius:5,minHeight:3,height:`${n>0?Math.max((n/maxN)*42,6):3}px`,background:isT?C.accent:n>0?"rgba(8,145,178,.25)":"#e8edf2",transition:"height .5s"}}/>
                    <span style={{fontSize:"0.6rem",color:isT?C.accent:C.dim,fontWeight:isT?700:400}}>{dS[d.getDay()]}</span>
                  </div>
                );})}
              </div>
            </div>

            {/* Heatmap */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 14px"}}>
              <p style={{color:C.muted,fontSize:"0.65rem",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 10px"}}>30 días</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(29-i));const n=logs.filter(l=>new Date(l.completed_at).toDateString()===d.toDateString()).length;const isT=d.toDateString()===td;return<div key={i} style={{width:24,height:24,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.6rem",fontWeight:600,outline:isT?`2px solid ${C.accent}`:"none",outlineOffset:1,background:n===0?"#e8edf2":n<=2?"rgba(38,166,154,.2)":n<=5?"rgba(38,166,154,.5)":"rgba(38,166,154,.85)",color:n===0?C.dim:C.text}}>{d.getDate()}</div>;})}
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
                  <div style={{maxWidth:"76%",background:m.sender==="patient"?C.accentG:"#f1f5f9",border:m.sender==="patient"?"none":`1px solid ${C.border}`,borderRadius:13,borderTopRightRadius:m.sender==="patient"?4:13,borderTopLeftRadius:m.sender==="patient"?13:4,borderBottomRightRadius:m.sender==="patient"?4:13,padding:"9px 13px",fontSize:"0.88rem",color:C.text,lineHeight:1.5}}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,padding:"10px 0",borderTop:`1px solid ${C.border}`,flexShrink:0}}>
              <input value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Mensaje..."
                style={{flex:1,background:"#f8fafc",border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 14px",fontSize:"0.88rem",color:C.text,outline:"none",WebkitAppearance:"none",minHeight:44}}/>
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
