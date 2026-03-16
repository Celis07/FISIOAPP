import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import { EXERCISES, CATEGORIES } from "./exercises";
import PatientApp from "./PatientApp";

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const C = {
  bg:      "#f0f2f5",
  surface: "#ffffff",
  card:    "#f8f9fb",
  border:  "#e2e6ed",
  accent:  "#0891b2",
  accentL: "#22d3ee",
  accentG: "linear-gradient(135deg,#0891b2,#0e7490)",
  text:    "#0f172a",
  muted:   "#64748b",
  dim:     "#94a3b8",
  success: "#16a34a",
  warn:    "#d97706",
  danger:  "#dc2626",
};

const BLOCKS = ["Terapia","Calentamiento / Activación","Trabajo central"];
const BM = {
  "Terapia":                    {c:"#e05252",bg:"rgba(224,82,82,0.08)"},
  "Calentamiento / Activación": {c:"#e09c3a",bg:"rgba(224,156,58,0.08)"},
  "Trabajo central":            {c:"#4caf79",bg:"rgba(76,175,121,0.08)"},
  "Sin bloque":                 {c:"#6b7390",bg:"rgba(107,115,144,0.06)"},
};

function localDateStr(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),dd=String(d.getDate()).padStart(2,"0");return`${y}-${m}-${dd}`;}
function daysLeft(end){return Math.ceil((new Date(end)-new Date())/(864e5));}
function Spinner(){return<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:48}}><div style={{width:24,height:24,border:`2px solid ${C.accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style></div>;}
function Avatar({name,size=36}){const i=(name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();return<div style={{width:size,height:size,borderRadius:size*.28,background:C.accentG,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:size*.38,flexShrink:0}}>{i}</div>;}

const I={
  dash:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  pts:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  cal:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  msg:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  out:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  back:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  edit:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  link:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  dots:   <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>,
  down:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>,
  pdf:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  copy:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  send:   <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{transform:"rotate(90deg)"}}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>,
};

// ─── SMALL SHARED UI ─────────────────────────────────────────────────────────
const inp = {background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 13px",fontSize:13,color:C.text,outline:"none",width:"100%",boxSizing:"border-box"};
const Btn = ({children,onClick,variant="ghost",disabled,style={}})=>{
  const base={border:"none",borderRadius:9,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,transition:"opacity .15s",...style};
  const v={
    primary:{...base,background:C.accentG,color:"#fff"},
    danger: {...base,background:"rgba(224,82,82,.12)",border:`1px solid rgba(224,82,82,.25)`,color:C.danger},
    ghost:  {...base,background:"transparent",border:`1px solid ${C.border}`,color:C.muted},
    subtle: {...base,background:C.card,border:`1px solid ${C.border}`,color:C.muted},
  };
  return <button onClick={onClick} disabled={disabled} style={v[variant]||v.ghost}>{children}</button>;
};

// Dropdown menu
function Menu({items}){
  const [open,setOpen]=useState(false);
  const ref=useRef();
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);
  return(
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={e=>{e.stopPropagation();setOpen(!open);}} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 8px",color:C.muted,cursor:"pointer",display:"flex",alignItems:"center"}}>
        {I.dots}
      </button>
      {open&&(
        <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:4,zIndex:50,minWidth:160,boxShadow:"0 8px 32px rgba(0,0,0,.6)"}}>
          {items.map((item,i)=>item==="---"?(
            <div key={i} style={{height:1,background:C.border,margin:"4px 0"}}/>
          ):(
            <button key={i} onClick={e=>{e.stopPropagation();setOpen(false);item.action();}}
              style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"transparent",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,color:item.danger?C.danger:C.text,fontWeight:item.danger?600:400,textAlign:"left"}}>
              {item.icon&&<span style={{color:item.danger?C.danger:C.muted,flexShrink:0}}>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Modal wrapper
function Modal({title,onClose,children,maxWidth=480}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:24,width:"100%",maxWidth,maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <h3 style={{color:C.text,fontWeight:700,fontSize:16,margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:18,lineHeight:1,padding:4}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Tag / badge
function Tag({label,color}){
  return<span style={{fontSize:11,fontWeight:600,color,background:`${color}18`,border:`1px solid ${color}30`,borderRadius:6,padding:"2px 8px",whiteSpace:"nowrap"}}>{label}</span>;
}

// ─── PDF EXPORT ───────────────────────────────────────────────────────────────
function exportPDF(patient,pres){
  if(!pres)return;
  const blocks={};
  (pres.exercises||[]).forEach(ex=>{const b=ex.block||"Sin bloque";if(!blocks[b])blocks[b]=[];blocks[b].push(ex);});
  const bOrder=["Terapia","Calentamiento / Activación","Trabajo central","Sin bloque"];
  const bCol={"Terapia":"#e05252","Calentamiento / Activación":"#e09c3a","Trabajo central":"#4caf79","Sin bloque":"#6b7390"};
  const date=new Date(pres.created_at).toLocaleDateString("es-CO",{day:"numeric",month:"long",year:"numeric"});
  let html=`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>Plan – ${patient.name}</title>
  <style>*{font-family:'Inter',-apple-system,sans-serif;box-sizing:border-box;margin:0;padding:0}body{background:#fff;color:#111;padding:32px;max-width:760px;margin:0 auto}.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:2px solid #26a69a;margin-bottom:22px}.logo{font-size:20px;font-weight:800;color:#26a69a}.pt-name{font-size:22px;font-weight:700}.meta{text-align:right;font-size:12px;color:#666}.block-label{display:flex;align-items:center;gap:6px;margin:18px 0 8px;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.8px}.dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}.row{display:flex;justify-content:space-between;align-items:center;padding:9px 13px;background:#f8f9fa;border-radius:7px;margin-bottom:5px}.rname{font-weight:600;font-size:13px}.rdose{font-weight:700;color:#26a69a;font-size:13px}.note{background:#e8f5e9;border-left:3px solid #26a69a;padding:10px 14px;border-radius:6px;margin-bottom:16px;font-size:13px;color:#1b5e20}.footer{margin-top:28px;padding-top:14px;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:11px;color:#aaa}@media print{body{padding:20px}}</style></head><body>
  <div class="header"><div><div class="logo">FisioApp</div><div class="pt-name" style="margin-top:8px">${patient.name}</div><div style="font-size:13px;color:#666;margin-top:2px">${patient.condition||""}</div></div><div class="meta"><b>Plan de ejercicios</b><br/>${date}<br/>${pres.exercises?.length||0} ejercicios${pres.duration_days?`<br/>${pres.duration_days} días`:""}</div></div>
  ${pres.note?`<div class="note">${pres.note}</div>`:""}`;
  bOrder.forEach(b=>{const l=blocks[b];if(!l?.length)return;html+=`<div class="block-label"><div class="dot" style="background:${bCol[b]||"#aaa"}"></div><span style="color:${bCol[b]||"#aaa"}">${b}</span></div>`;l.forEach(ex=>{html+=`<div class="row"><div><div class="rname">${ex.name}</div>${ex.description?`<div style="font-size:11px;color:#888;margin-top:2px">${ex.description}</div>`:""}</div><div class="rdose">${ex.sets}×${ex.reps}</div></div>`;});});
  html+=`<div class="footer"><span>FisioApp</span><span>${new Date().toLocaleDateString("es-CO")}</span></div></body></html>`;
  const w=window.open("","_blank");w.document.write(html);w.document.close();setTimeout(()=>w.print(),500);
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginView(){
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [name,setName]=useState("");
  const [mode,setMode]=useState("login"); // login | register | forgot
  const [loading,setLoad]=useState(false);
  const [error,setError]=useState("");
  const [ok,setOk]=useState("");

  const submit=async()=>{
    setLoad(true);setError("");setOk("");
    if(mode==="forgot"){
      const{error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin});
      if(error)setError(error.message);else setOk("Link enviado — revisa tu correo.");
    } else if(mode==="register"){
      if(!name.trim()){setError("Ingresa tu nombre");setLoad(false);return;}
      const{error}=await supabase.auth.signUp({email,password:pass,options:{data:{full_name:name.trim()}}});
      if(error)setError(error.message);
    } else {
      const{error}=await supabase.auth.signInWithPassword({email,password:pass});
      if(error)setError(error.message);
    }
    setLoad(false);
  };

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:54,height:54,background:C.accentG,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",boxShadow:"0 4px 20px rgba(8,145,178,.25)",padding:8}}>
            <svg width="38" height="38" viewBox="0 0 80 80" fill="none">
              <line x1="4" y1="52" x2="76" y2="52" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.4"/>
              <path d="M4,52 Q20,20 36,52 Q52,84 68,52 Q84,20 100,52" fill="rgba(255,255,255,0.12)" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24,34 Q40,-8 56,34" fill="none" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
              <circle cx="40" cy="-2" r="7" fill="white"/>
            </svg>
          </div>
          <h1 style={{fontFamily:"'Fraunces',serif",fontSize:"1.6rem",color:C.text,margin:0}}>FisioApp</h1>
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"22px 20px"}}>
          <p style={{color:C.muted,fontSize:13,margin:"0 0 16px",fontWeight:500}}>{mode==="login"?"Iniciar sesión":mode==="register"?"Crear cuenta":"Recuperar contraseña"}</p>
          <div style={{display:"grid",gap:9,marginBottom:14}}>
            {mode==="register"&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre completo" style={inp}/>}
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Correo" type="email" style={inp}/>
            {mode!=="forgot"&&<input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Contraseña" type="password" style={inp} onKeyDown={e=>e.key==="Enter"&&submit()}/>}
          </div>
          {error&&<p style={{color:C.danger,fontSize:12,marginBottom:12,background:"rgba(224,82,82,.08)",padding:"7px 10px",borderRadius:8,border:"1px solid rgba(224,82,82,.2)"}}>{error}</p>}
          {ok&&<p style={{color:C.success,fontSize:12,marginBottom:12,background:"rgba(76,175,121,.08)",padding:"7px 10px",borderRadius:8}}>{ok}</p>}
          <button onClick={submit} disabled={loading} style={{width:"100%",background:C.accentG,border:"none",borderRadius:10,padding:11,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",opacity:loading?.7:1,marginBottom:14}}>
            {loading?"...":mode==="login"?"Entrar":mode==="register"?"Crear cuenta":"Enviar link"}
          </button>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
            {mode!=="login"?<button onClick={()=>{setMode("login");setError("");setOk("");}} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:12,fontWeight:600}}>← Iniciar sesión</button>
            :<>
              <button onClick={()=>{setMode("register");setError("");}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12}}>¿Sin cuenta? Regístrate</button>
              <button onClick={()=>{setMode("forgot");setError("");}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12}}>¿Olvidaste tu contraseña?</button>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PENDING ──────────────────────────────────────────────────────────────────
function PendingApproval({user}){
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"28px 24px",textAlign:"center",maxWidth:320,width:"100%"}}>
        <div style={{width:44,height:44,background:"rgba(224,156,58,.1)",border:"1px solid rgba(224,156,58,.25)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.warn} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <h2 style={{color:C.text,fontSize:17,fontWeight:700,margin:"0 0 8px"}}>Acceso pendiente</h2>
        <p style={{color:C.muted,fontSize:13,lineHeight:1.6,margin:"0 0 20px"}}>Tu fisioterapeuta debe aprobarte. Cuando esté listo podrás ver tu plan.</p>
        <p style={{color:C.dim,fontSize:12,marginBottom:16}}>{user.email}</p>
        <Btn onClick={()=>supabase.auth.signOut()} variant="ghost" style={{width:"100%"}}>Cerrar sesión</Btn>
      </div>
    </div>
  );
}

// ─── INVITE MODAL ─────────────────────────────────────────────────────────────
function InviteModal({patient,onClose}){
  const [copied,setCopied]=useState(false);
  const link=`${window.location.origin}?invite=${patient.invite_token}`;
  const copy=()=>{navigator.clipboard.writeText(link);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  return(
    <Modal title="Link de invitación" onClose={onClose} maxWidth={400}>
      <p style={{color:C.muted,fontSize:13,marginBottom:14,lineHeight:1.6}}>Comparte este link con <strong style={{color:C.text}}>{patient.name}</strong> para que pueda crear su cuenta y acceder a su plan.</p>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px",fontSize:12,color:C.muted,wordBreak:"break-all",marginBottom:14}}>{link}</div>
      <Btn onClick={copy} variant="primary" style={{width:"100%"}}>{I.copy} {copied?"¡Copiado!":"Copiar link"}</Btn>
    </Modal>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardView({user,onNavigate}){
  const [d,setD]=useState(null);
  useEffect(()=>{load();},[]);
  const load=async()=>{
    const in7=new Date(Date.now()+7*864e5).toISOString().split("T")[0];
    const[{data:p},{data:a},{data:m},{data:r},{data:exp}]=await Promise.all([
      supabase.from("patients").select("*"),
      supabase.from("appointments").select("*").gte("date",localDateStr(new Date())).order("date").limit(5),
      supabase.from("messages").select("id").eq("unread",true),
      supabase.from("access_requests").select("*").order("created_at",{ascending:false}).then(x=>x.error?{data:[]}:x),
      supabase.from("prescriptions").select("*,patients(name)").lte("end_date",in7).gte("end_date",localDateStr(new Date())).then(x=>x.error?{data:[]}:x),
    ]);
    const pts=p||[];
    setD({patients:pts.length,active:pts.filter(x=>x.invite_status==="aprobado").length,pending:pts.filter(x=>x.invite_status==="pendiente").length,appts:(a||[]),msgs:(m||[]).length,recent:pts.slice(0,4),requests:r||[],expiring:exp||[]});
  };
  const approve=async(req)=>{
    const meta=req.display_name||req.email.split("@")[0];
    await supabase.from("patients").insert({name:meta,email:req.email,therapist_id:user.id,user_id:req.user_id,invite_status:"aprobado",invite_token:crypto.randomUUID()});
    await supabase.from("access_requests").delete().eq("id",req.id);
    load();
  };
  const reject=async(id)=>{await supabase.from("access_requests").delete().eq("id",id);load();};

  if(!d)return<Spinner/>;
  const today=new Date().toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"});

  return(
    <div style={{maxWidth:860}}>
      <div style={{marginBottom:24}}>
        <p style={{color:C.muted,fontSize:12,margin:"0 0 2px",textTransform:"capitalize"}}>{today}</p>
        <h2 style={{fontFamily:"'Fraunces',serif",color:C.text,fontSize:22,margin:0}}>Panel de control</h2>
      </div>

      {/* Access requests */}
      {d.requests.length>0&&(
        <div style={{background:"rgba(224,156,58,.06)",border:"1px solid rgba(224,156,58,.2)",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
          <p style={{color:C.warn,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 10px"}}>Solicitudes de acceso · {d.requests.length}</p>
          <div style={{display:"grid",gap:8}}>
            {d.requests.map(r=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(0,0,0,.2)",borderRadius:9,padding:"8px 12px"}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.display_name||r.email.split("@")[0]}</p>
                  <p style={{color:C.dim,fontSize:11,margin:"1px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.email}</p>
                </div>
                <Btn onClick={()=>approve(r)} variant="primary" style={{fontSize:12,padding:"5px 12px"}}>Aprobar</Btn>
                <button onClick={()=>reject(r.id)} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",padding:4,display:"flex"}}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiring plans */}
      {d.expiring.length>0&&(
        <div style={{background:"rgba(224,82,82,.05)",border:"1px solid rgba(224,82,82,.2)",borderRadius:14,padding:"12px 16px",marginBottom:16}}>
          <p style={{color:C.danger,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 8px"}}>Planes por vencer · {d.expiring.length}</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {d.expiring.map(p=>{const dl=daysLeft(p.end_date);return<span key={p.id} style={{fontSize:12,color:C.muted,background:C.card,border:`1px solid ${C.border}`,borderRadius:7,padding:"3px 10px"}}>{p.patients?.name} — <span style={{color:dl===0?C.danger:C.warn,fontWeight:600}}>{dl===0?"hoy":`${dl}d`}</span></span>;})}
          </div>
        </div>
      )}

      {/* Stat row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        {[
          {n:d.patients,  l:"Usuarios",  sub:`${d.active} activos`,  c:C.accent,  tab:"patients"},
          {n:d.pending,   l:"Pendientes", sub:"por aprobar",          c:C.warn,    tab:"patients",filter:"pendiente"},
          {n:d.appts.length,l:"Citas",    sub:"próximas",             c:"#7c6af7", tab:"agenda"},
          {n:d.msgs,      l:"Mensajes",   sub:"sin leer",             c:"#4a9eff", tab:"messages"},
        ].map((s,i)=>(
          <div key={i} onClick={()=>onNavigate(s.tab,null,s.filter)}
            style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",transition:"border-color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=s.c+"44"}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <p style={{color:s.c,fontSize:26,fontWeight:700,margin:0,fontFamily:"'Fraunces',serif",lineHeight:1}}>{s.n}</p>
            <p style={{color:C.text,fontSize:12,fontWeight:600,margin:"5px 0 1px"}}>{s.l}</p>
            <p style={{color:C.muted,fontSize:11,margin:0}}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Two-col */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",overflow:"hidden"}}>
          <p style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 12px"}}>Próximas citas</p>
          {d.appts.length===0?<p style={{color:C.dim,fontSize:13,textAlign:"center",padding:"8px 0"}}>Sin citas</p>:d.appts.map(a=>(
            <div key={a.id} style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
              <div style={{background:"rgba(38,166,154,.1)",border:"1px solid rgba(38,166,154,.15)",borderRadius:8,padding:"3px 8px",minWidth:50,textAlign:"center",flexShrink:0}}>
                <p style={{color:C.accent,fontWeight:700,fontSize:12,margin:0}}>{a.time}</p>
                <p style={{color:C.muted,fontSize:10,margin:0}}>{a.date?.slice(5)}</p>
              </div>
              <div style={{minWidth:0}}>
                <p style={{color:C.text,fontWeight:600,fontSize:12,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.patient_name}</p>
                <p style={{color:C.dim,fontSize:11,margin:"1px 0 0"}}>{a.type}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",overflow:"hidden"}}>
          <p style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 12px"}}>Pacientes recientes</p>
          {d.recent.map(p=>(
            <div key={p.id} onClick={()=>onNavigate("patients",p)}
              style={{display:"flex",gap:10,alignItems:"center",marginBottom:10,cursor:"pointer",borderRadius:8,padding:"2px 0",transition:"opacity .15s"}}
              onMouseEnter={e=>e.currentTarget.style.opacity=".7"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              <Avatar name={p.name} size={28}/>
              <div style={{flex:1,minWidth:0}}>
                <p style={{color:C.text,fontWeight:600,fontSize:12,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</p>
                <p style={{color:C.muted,fontSize:11,margin:"1px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.condition||"Sin diagnóstico"}</p>
              </div>
              {p.invite_status==="pendiente"&&<Tag label="Pendiente" color={C.warn}/>}
              {p.invite_status==="aprobado"&&<Tag label="Activo" color={C.success}/>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SESSION NOTES ────────────────────────────────────────────────────────────
function SessionNotesView({patient,user}){
  const [notes,setNotes]=useState([]);
  const [loading,setLoad]=useState(true);
  const [text,setText]=useState("");
  const [date,setDate]=useState(localDateStr(new Date()));
  const [saving,setSave]=useState(false);

  useEffect(()=>{load();},[patient.id]);
  const load=async()=>{const{data}=await supabase.from("session_notes").select("*").eq("patient_id",patient.id).order("session_date",{ascending:false});setNotes(data||[]);setLoad(false);};
  const save=async()=>{if(!text.trim())return;setSave(true);await supabase.from("session_notes").insert({therapist_id:user.id,patient_id:patient.id,note:text.trim(),session_date:date});setText("");setSave(false);load();};
  const del=async(id)=>{if(!window.confirm("¿Eliminar nota?"))return;await supabase.from("session_notes").delete().eq("id",id);load();};

  return(
    <div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:16,marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,marginBottom:10}}>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{...inp}}/>
        </div>
        <textarea value={text} onChange={e=>setText(e.target.value)} rows={4} placeholder="Observaciones clínicas de la sesión..."
          style={{...inp,resize:"none",lineHeight:1.6,marginBottom:10}}/>
        <Btn onClick={save} disabled={!text.trim()||saving} variant="primary" style={{width:"100%"}}>{saving?"Guardando...":"Guardar nota"}</Btn>
      </div>
      {loading?<Spinner/>:notes.length===0?<p style={{color:C.muted,textAlign:"center",padding:"24px 0",fontSize:13}}>Sin notas aún</p>:(
        <div style={{display:"grid",gap:10}}>
          {notes.map(n=>(
            <div key={n.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{color:C.accentL,fontSize:12,fontWeight:600}}>{new Date(n.session_date+"T12:00").toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"})}</span>
                <button onClick={()=>del(n.id)} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",display:"flex",padding:3}}>{I.trash}</button>
              </div>
              <p style={{color:C.text,fontSize:13,lineHeight:1.65,margin:0,whiteSpace:"pre-wrap"}}>{n.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── EVOLUTION VIEW ───────────────────────────────────────────────────────────
function EvolutionView({patient}){
  const [ratings,setRatings]=useState([]);
  const [notes,setNotes]=useState([]);
  const [logs,setLogs]=useState([]);
  const [loading,setLoad]=useState(true);

  useEffect(()=>{
    Promise.all([
      supabase.from("session_ratings").select("*").eq("patient_id",patient.id).order("rated_at",{ascending:true}),
      supabase.from("session_notes").select("*").eq("patient_id",patient.id).order("session_date",{ascending:true}),
      supabase.from("exercise_logs").select("*").eq("patient_id",patient.id).order("completed_at",{ascending:true}),
    ]).then(([{data:r},{data:n},{data:l}])=>{
      setRatings(r||[]);setNotes(n||[]);setLogs(l||[]);setLoad(false);
    });
  },[patient.id]);

  if(loading)return<Spinner/>;

  // Build timeline — merge notes and ratings by date
  const timeline=[];
  const dMap={};
  notes.forEach(n=>{const d=n.session_date;if(!dMap[d])dMap[d]={date:d,note:null,pain:null,fatigue:null,completed:0};dMap[d].note=n.note;});
  ratings.forEach(r=>{const d=r.rated_at?.slice(0,10);if(!dMap[d])dMap[d]={date:d,note:null,pain:null,fatigue:null,completed:0};dMap[d].pain=r.pain_level;dMap[d].fatigue=r.fatigue_level;});
  logs.forEach(l=>{const d=new Date(l.completed_at).toISOString().slice(0,10);if(!dMap[d])dMap[d]={date:d,note:null,pain:null,fatigue:null,completed:0};dMap[d].completed++;});
  Object.values(dMap).sort((a,b)=>a.date>b.date?-1:1).forEach(e=>timeline.push(e));

  const chartData=ratings.slice(-10);
  const maxVal=10;
  const chartH=80;

  return(
    <div>
      {/* Pain/Fatigue chart */}
      {chartData.length>0&&(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:16,marginBottom:14}}>
          <p style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 4px"}}>Dolor y Fatiga · últimas sesiones</p>
          <div style={{display:"flex",gap:12,marginBottom:10}}>
            <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.danger}}><div style={{width:8,height:8,borderRadius:"50%",background:C.danger}}/> Dolor</span>
            <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.warn}}><div style={{width:8,height:8,borderRadius:"50%",background:C.warn}}/> Fatiga</span>
          </div>
          <div style={{position:"relative",height:chartH+20}}>
            {/* Grid lines */}
            {[2,4,6,8,10].map(v=>(
              <div key={v} style={{position:"absolute",left:0,right:0,bottom:20+(v/maxVal)*chartH,borderTop:`1px dashed ${C.border}`,display:"flex",alignItems:"center"}}>
                <span style={{fontSize:9,color:C.dim,marginLeft:2,position:"absolute",left:0,transform:"translateY(-50%)"}}>{v}</span>
              </div>
            ))}
            {/* Lines */}
            <svg style={{position:"absolute",left:16,right:0,top:0,bottom:20,width:"calc(100% - 16px)",height:chartH+20}} preserveAspectRatio="none">
              {/* Pain line */}
              {chartData.length>1&&<polyline
                points={chartData.map((r,i)=>`${(i/(chartData.length-1))*100}%,${chartH-(r.pain_level/maxVal)*chartH}`).join(" ")}
                fill="none" stroke={C.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
              {/* Fatigue line */}
              {chartData.length>1&&<polyline
                points={chartData.map((r,i)=>`${(i/(chartData.length-1))*100}%,${chartH-(r.fatigue_level/maxVal)*chartH}`).join(" ")}
                fill="none" stroke={C.warn} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2"/>}
              {/* Dots pain */}
              {chartData.map((r,i)=><circle key={i} cx={`${(i/(Math.max(chartData.length-1,1)))*100}%`} cy={chartH-(r.pain_level/maxVal)*chartH} r="3" fill={C.danger}/>)}
              {/* Dots fatigue */}
              {chartData.map((r,i)=><circle key={i+"f"} cx={`${(i/(Math.max(chartData.length-1,1)))*100}%`} cy={chartH-(r.fatigue_level/maxVal)*chartH} r="3" fill={C.warn}/>)}
            </svg>
          </div>
        </div>
      )}

      {/* Timeline */}
      {timeline.length===0?(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:32,textAlign:"center"}}>
          <p style={{color:C.muted,fontSize:13}}>Sin registros de evolución aún</p>
          <p style={{color:C.dim,fontSize:12,marginTop:6}}>Agrega notas de sesión y el paciente podrá registrar dolor/fatiga</p>
        </div>
      ):(
        <div style={{display:"grid",gap:8}}>
          {timeline.map((entry,i)=>(
            <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:entry.note?8:0}}>
                <span style={{color:C.accentL,fontSize:12,fontWeight:600}}>
                  {new Date(entry.date+"T12:00").toLocaleDateString("es-CO",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
                </span>
                <div style={{display:"flex",gap:10}}>
                  {entry.completed>0&&<span style={{fontSize:11,color:C.success,fontWeight:600}}>{entry.completed} ejerc.</span>}
                  {entry.pain&&<span style={{fontSize:11,color:C.danger}}>Dolor: <b>{entry.pain}/10</b></span>}
                  {entry.fatigue&&<span style={{fontSize:11,color:C.warn}}>Fatiga: <b>{entry.fatigue}/10</b></span>}
                </div>
              </div>
              {entry.note&&<p style={{color:C.text,fontSize:12,margin:0,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{entry.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PATIENT PROFILE ─────────────────────────────────────────────────────────
function PatientProfile({patient,user,onBack,onPrescribe,onApprove}){
  const [prescriptions,setPres]=useState([]);
  const [logs,setLogs]=useState([]);
  const [loading,setLoad]=useState(true);
  const [activeTab,setTab]=useState("plans");
  const [activePres,setActivePres]=useState(null);
  const [showInvite,setInvite]=useState(false);
  const [editPres,setEditPres]=useState(null);

  const fetchPrescriptions=async()=>{
    const[{data:p},{data:l}]=await Promise.all([
      supabase.from("prescriptions").select("*").eq("patient_id",patient.id).order("created_at",{ascending:false}),
      supabase.from("exercise_logs").select("*").eq("patient_id",patient.id),
    ]);
    setPres(p||[]);setLogs(l||[]);setLoad(false);
  };
  useEffect(()=>{fetchPrescriptions();},[patient.id]);

  const deletePrescription=async(id)=>{if(!window.confirm("¿Eliminar este plan permanentemente?"))return;await supabase.from("prescriptions").delete().eq("id",id);setPres(prev=>prev.filter(p=>p.id!==id));};

  let streak=0;
  for(let i=0;i<30;i++){const d=new Date();d.setDate(d.getDate()-i);if(logs.some(l=>new Date(l.completed_at).toDateString()===d.toDateString()))streak++;else if(i>0)break;}

  if(editPres)return<PrescribeView user={user} patient={patient} onBack={()=>{setEditPres(null);fetchPrescriptions();}} existingPrescription={editPres}/>;

  const deletePatient=async()=>{
    if(!window.confirm(`¿Eliminar a ${patient.name}? Se borrarán todos sus datos. Esta acción no se puede deshacer.`))return;
    await Promise.all([supabase.from("prescriptions").delete().eq("patient_id",patient.id),supabase.from("exercise_logs").delete().eq("patient_id",patient.id),supabase.from("session_notes").delete().eq("patient_id",patient.id)]);
    await supabase.from("patients").delete().eq("id",patient.id);
    onBack();
  };

  return(
    <div>
      {showInvite&&<InviteModal patient={patient} onClose={()=>setInvite(false)}/>}
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,color:C.muted,background:"none",border:"none",cursor:"pointer",fontSize:13,marginBottom:20}}>{I.back} Volver</button>

      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:20}}>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <Avatar name={patient.name} size={52}/>
          <div>
            <h2 style={{fontFamily:"'Fraunces',serif",color:C.text,fontSize:20,margin:"0 0 3px"}}>{patient.name}</h2>
            <p style={{color:C.muted,fontSize:13,margin:"0 0 6px"}}>{patient.condition||"Sin diagnóstico"}{patient.age?` · ${patient.age} años`:""}</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>
              {patient.is_athlete&&<Tag label={patient.sport?`Atleta · ${patient.sport}`:"Atleta"} color="#7c6af7"/>}
              {patient.invite_status==="aprobado"?<Tag label="Acceso activo" color={C.success}/>:patient.invite_status==="pendiente"?<Tag label="Pendiente" color={C.warn}/>:<Tag label="Sin acceso" color={C.danger}/>}
            </div>
          </div>
        </div>
        <Menu items={[
          {label:"Nuevo plan",    icon:I.plus,  action:()=>onPrescribe(patient)},
          patient.invite_status!=="aprobado"&&{label:"Habilitar acceso", action:()=>onApprove(patient.id)},
          {label:"Copiar link",   icon:I.link,  action:()=>setInvite(true)},
          {label:"Exportar PDF",  icon:I.pdf,   action:()=>exportPDF(patient,prescriptions[0])},
          "---",
          {label:"Eliminar paciente", icon:I.trash, danger:true, action:deletePatient},
        ].filter(Boolean)}/>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:18}}>
        {[{v:prescriptions.length,l:"Planes",c:C.accent},{v:streak,l:"Racha",c:C.warn},{v:logs.length,l:"Completados",c:C.success}].map((s,i)=>(
          <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 8px",textAlign:"center"}}>
            <p style={{color:s.c,fontSize:22,fontWeight:700,margin:0,fontFamily:"'Fraunces',serif"}}>{s.v}</p>
            <p style={{color:C.muted,fontSize:11,margin:"3px 0 0"}}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:2,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:3,marginBottom:16,overflowX:"auto"}}>
        {["plans","progress","evolution","notes"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"7px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:600,fontSize:11,transition:"all .15s",background:activeTab===t?C.card:"transparent",color:activeTab===t?C.text:C.muted,whiteSpace:"nowrap",minWidth:60}}>
            {t==="plans"?"Planes":t==="progress"?"Progreso":t==="evolution"?"Evolución":"Notas"}
          </button>
        ))}
      </div>

      {/* Plans */}
      {activeTab==="plans"&&(
        loading?<Spinner/>:prescriptions.length===0?(
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:32,textAlign:"center"}}>
            <p style={{color:C.muted,fontSize:13}}>Sin planes prescritos</p>
            <Btn onClick={()=>onPrescribe(patient)} variant="primary" style={{marginTop:12}}>Crear primer plan</Btn>
          </div>
        ):(
          <div style={{display:"grid",gap:8}}>
            {prescriptions.map((pres,i)=>{
              const dl=pres.end_date?daysLeft(pres.end_date):null;
              const dCol=dl===null?null:dl<0?C.danger:dl<=5?C.warn:C.success;
              return(
                <div key={pres.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px"}}>
                    <button onClick={()=>setActivePres(activePres===pres.id?null:pres.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"flex-start",background:"none",border:"none",cursor:"pointer",textAlign:"left",gap:3}}>
                      <span style={{color:C.text,fontWeight:600,fontSize:13}}>{i===0?"Plan actual":`Plan #${prescriptions.length-i}`}</span>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <span style={{color:C.muted,fontSize:11}}>{new Date(pres.created_at).toLocaleDateString("es-CO",{day:"numeric",month:"short",year:"numeric"})} · {pres.exercises?.length||0} ejercicios</span>
                        {dCol&&<Tag label={dl<0?"Vencido":dl===0?"Vence hoy":`${dl}d`} color={dCol}/>}
                      </div>
                    </button>
                    <Menu items={[
                      {label:"Editar",    icon:I.edit,  action:()=>setEditPres(pres)},
                      {label:"Duplicar",  action:async()=>{const dur=pres.duration_days||30;const sd=localDateStr(new Date());const ed=localDateStr(new Date(Date.now()+dur*864e5));await supabase.from("prescriptions").insert({patient_id:patient.id,therapist_id:user.id,exercises:pres.exercises,note:pres.note||"",duration_days:dur,start_date:sd,end_date:ed});fetchPrescriptions();}},
                      {label:"Renovar",   action:async()=>{if(!window.confirm("¿Renovar por el mismo período?"))return;const dur=pres.duration_days||30;const sd=localDateStr(new Date());const ed=localDateStr(new Date(Date.now()+dur*864e5));await supabase.from("prescriptions").update({start_date:sd,end_date:ed}).eq("id",pres.id);fetchPrescriptions();}},
                      {label:"Exportar PDF", icon:I.pdf, action:()=>exportPDF(patient,pres)},
                      "---",
                      {label:"Eliminar",  icon:I.trash, danger:true, action:()=>deletePrescription(pres.id)},
                    ]}/>
                  </div>
                  {activePres===pres.id&&(
                    <div style={{borderTop:`1px solid ${C.border}`,padding:"12px 14px"}}>
                      {pres.note&&<p style={{color:C.accentL,fontSize:12,background:"rgba(38,166,154,.07)",border:"1px solid rgba(38,166,154,.15)",borderRadius:8,padding:"8px 12px",marginBottom:10,lineHeight:1.6}}>{pres.note}</p>}
                      {BLOCKS.concat(["Sin bloque"]).map(b=>{
                        const exList=(pres.exercises||[]).filter(e=>(e.block||"Sin bloque")===b);
                        if(!exList.length)return null;
                        const m=BM[b]||BM["Sin bloque"];
                        return(
                          <div key={b} style={{marginBottom:10}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                              <div style={{width:6,height:6,borderRadius:"50%",background:m.c}}/>
                              <span style={{color:m.c,fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:.5}}>{b}</span>
                            </div>
                            {exList.map((ex,j)=>(
                              <div key={j} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                                <div style={{minWidth:0}}>
                                  <span style={{color:C.text,fontSize:13}}>{ex.name}</span>
                                  {ex.video_url&&<a href={ex.video_url} target="_blank" rel="noreferrer" style={{display:"block",color:C.accent,fontSize:11,marginTop:1,textDecoration:"none"}}>▶ ver video</a>}
                                </div>
                                <span style={{color:C.accent,fontWeight:700,fontSize:12,flexShrink:0,marginLeft:12}}>{ex.sets}×{ex.reps}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Progress */}
      {activeTab==="progress"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12}}>
          {/* 7-day chart */}
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:16}}>
            <p style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 14px"}}>Últimos 7 días</p>
            {(()=>{
              const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d;});
              const lpd=last7.map(d=>({d,n:logs.filter(l=>new Date(l.completed_at).toDateString()===d.toDateString()).length}));
              const maxN=Math.max(...lpd.map(x=>x.n),1);
              const dS=["D","L","M","X","J","V","S"];
              return(
                <div style={{display:"flex",alignItems:"flex-end",gap:6,height:60}}>
                  {lpd.map(({d,n},i)=>{const isT=d.toDateString()===new Date().toDateString();return(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      {n>0&&<span style={{fontSize:10,color:isT?C.accent:C.muted}}>{n}</span>}
                      <div style={{width:"100%",borderRadius:6,minHeight:3,height:`${n>0?Math.max((n/maxN)*46,6):3}px`,background:isT?C.accent:n>0?"rgba(38,166,154,.3)":C.border,transition:"height .4s"}}/>
                      <span style={{fontSize:9,color:isT?C.accent:C.dim,fontWeight:isT?700:400}}>{dS[d.getDay()]}</span>
                    </div>
                  );})}
                </div>
              );
            })()}
          </div>
          {/* Heatmap */}
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:16}}>
            <p style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 12px"}}>30 días</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(29-i));const n=logs.filter(l=>new Date(l.completed_at).toDateString()===d.toDateString()).length;const isT=d.toDateString()===new Date().toDateString();return<div key={i} style={{width:22,height:22,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,outline:isT?`2px solid ${C.accent}`:"none",outlineOffset:1,background:n===0?C.border:n<=2?"rgba(38,166,154,.22)":n<=5?"rgba(38,166,154,.5)":"rgba(38,166,154,.88)",color:n===0?C.dim:C.text}}>{d.getDate()}</div>;})}
            </div>
          </div>
        </div>
      )}

      {activeTab==="notes"&&<SessionNotesView patient={patient} user={user}/>}
      {activeTab==="evolution"&&<EvolutionView patient={patient}/>}
    </div>
  );
}

// ─── PATIENTS VIEW ────────────────────────────────────────────────────────────
function PatientsView({user,onPrescribe,onViewProfile,initialFilter,onClearFilter}){
  const [patients,setPts]=useState([]);
  const [loading,setLoad]=useState(true);
  const [search,setSearch]=useState("");
  const [statusFilter,setSF]=useState(initialFilter||null);
  const [showForm,setForm]=useState(false);
  const [showInvite,setInvite]=useState(null);
  const [editPt,setEditPt]=useState(null);
  const [form,setF]=useState({name:"",age:"",condition:"",email:"",is_athlete:false,sport:""});

  useEffect(()=>{if(initialFilter)setSF(initialFilter);},[initialFilter]);
  useEffect(()=>{load();},[]);
  const load=async()=>{const{data}=await supabase.from("patients").select("*").order("created_at",{ascending:false});setPts(data||[]);setLoad(false);};

  const approvePatient=async(id)=>{await supabase.from("patients").update({invite_status:"aprobado"}).eq("id",id);load();};
  const addPatient=async()=>{
    if(!form.name.trim())return;
    const token=crypto.randomUUID();
    const{data,error}=await supabase.from("patients").insert({
      name:form.name,age:parseInt(form.age)||null,condition:form.condition,email:form.email,
      is_athlete:form.is_athlete,sport:form.sport||null,
      therapist_id:user.id,invite_token:token
    }).select().single();
    setF({name:"",age:"",condition:"",email:""});setForm(false);load();
    if(data&&!error)setInvite(data);
  };
  const saveEdit=async()=>{
    if(!editPt||!form.name.trim())return;
    await supabase.from("patients").update({name:form.name,age:parseInt(form.age)||null,condition:form.condition,email:form.email,is_athlete:form.is_athlete,sport:form.sport||null}).eq("id",editPt.id);
    setEditPt(null);setF({name:"",age:"",condition:"",email:""});load();
  };
  const deletePt=async(p)=>{
    if(!window.confirm(`¿Eliminar a ${p.name}? Esta acción no se puede deshacer.`))return;
    await supabase.from("prescriptions").delete().eq("patient_id",p.id);
    await supabase.from("patients").delete().eq("id",p.id);
    load();
  };

  const filtered=patients.filter(p=>{
    const ms=p.name.toLowerCase().includes(search.toLowerCase())||(p.condition||"").toLowerCase().includes(search.toLowerCase());
    const mf=!statusFilter||p.invite_status===statusFilter;
    return ms&&mf;
  });

  return(
    <div>
      {showInvite&&<InviteModal patient={showInvite} onClose={()=>setInvite(null)}/>}

      {/* New patient modal */}
      {showForm&&(
        <Modal title="Nuevo paciente" onClose={()=>{setForm(false);setF({name:"",age:"",condition:"",email:""});}}>
          <div style={{display:"grid",gap:10}}>
            <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Nombre *</label><input value={form.name} onChange={e=>setF({...form,name:e.target.value})} style={inp}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Edad</label><input value={form.age} onChange={e=>setF({...form,age:e.target.value})} type="number" style={inp}/></div>
              <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Correo</label><input value={form.email} onChange={e=>setF({...form,email:e.target.value})} type="email" style={inp}/></div>
            </div>
            <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Diagnóstico</label><input value={form.condition} onChange={e=>setF({...form,condition:e.target.value})} style={inp}/></div>
            <div style={{gridColumn:"1/-1"}}>
              <label style={{fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:4}}>
                <input type="checkbox" checked={form.is_athlete} onChange={e=>setF({...form,is_athlete:e.target.checked})} style={{accentColor:C.accent,width:14,height:14}}/>
                <span>Es atleta / deportista</span>
              </label>
              {form.is_athlete&&<input value={form.sport} onChange={e=>setF({...form,sport:e.target.value})} placeholder="Deporte (ej: fútbol, ciclismo...)" style={{...inp,marginTop:6}}/>}
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:18}}>
            <Btn onClick={addPatient} variant="primary" style={{flex:1}}>Guardar y generar link</Btn>
            <Btn onClick={()=>{setForm(false);setF({name:"",age:"",condition:"",email:""});}} variant="ghost">Cancelar</Btn>
          </div>
        </Modal>
      )}

      {/* Edit patient modal */}
      {editPt&&(
        <Modal title="Editar paciente" onClose={()=>{setEditPt(null);setF({name:"",age:"",condition:"",email:""});}}>
          <div style={{display:"grid",gap:10}}>
            <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Nombre *</label><input value={form.name} onChange={e=>setF({...form,name:e.target.value})} style={inp}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Edad</label><input value={form.age} onChange={e=>setF({...form,age:e.target.value})} type="number" style={inp}/></div>
              <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Correo</label><input value={form.email} onChange={e=>setF({...form,email:e.target.value})} type="email" style={inp}/></div>
            </div>
            <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Diagnóstico</label><input value={form.condition} onChange={e=>setF({...form,condition:e.target.value})} style={inp}/></div>
            <div>
              <label style={{fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:4}}>
                <input type="checkbox" checked={form.is_athlete||false} onChange={e=>setF({...form,is_athlete:e.target.checked})} style={{accentColor:C.accent,width:14,height:14}}/>
                <span>Es atleta / deportista</span>
              </label>
              {form.is_athlete&&<input value={form.sport||""} onChange={e=>setF({...form,sport:e.target.value})} placeholder="Deporte (ej: fútbol, ciclismo...)" style={{...inp,marginTop:4}}/>}
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:18}}>
            <Btn onClick={saveEdit} variant="primary" style={{flex:1}}>Guardar</Btn>
            <Btn onClick={()=>{setEditPt(null);setF({name:"",age:"",condition:"",email:""});}} variant="ghost">Cancelar</Btn>
          </div>
        </Modal>
      )}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,gap:10}}>
        <div>
          <h2 style={{fontFamily:"'Fraunces',serif",color:C.text,fontSize:20,margin:0}}>Usuarios</h2>
          <p style={{color:C.muted,fontSize:12,margin:"2px 0 0"}}>{patients.length} usuarios</p>
        </div>
        <Btn onClick={()=>setForm(true)} variant="primary">{I.plus} Nuevo</Btn>
      </div>

      {/* Search + filter */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:C.dim}}>{I.search}</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre, diagnóstico o deporte..." style={{...inp,paddingLeft:34}}/>
        </div>
        {statusFilter&&<Btn onClick={()=>{setSF(null);if(onClearFilter)onClearFilter();}} variant="ghost">{statusFilter==="pendiente"?"Pendientes":"Filtro"} ✕</Btn>}
      </div>

      {loading?<Spinner/>:filtered.length===0?(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:40,textAlign:"center"}}>
          <p style={{color:C.muted,fontSize:13}}>{patients.length===0?"Crea tu primer paciente":"Sin resultados"}</p>
        </div>
      ):(
        <div style={{display:"grid",gap:6}}>
          {filtered.map(p=>(
            <div key={p.id} onClick={()=>onViewProfile(p)}
              style={{display:"flex",alignItems:"center",gap:12,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",transition:"border-color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent+"44"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <Avatar name={p.name} size={36}/>
              <div style={{flex:1,minWidth:0}}>
                <p style={{color:C.text,fontWeight:600,fontSize:14,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</p>
                <p style={{color:C.muted,fontSize:12,margin:"2px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.condition||"Sin diagnóstico"}{p.age?` · ${p.age} años`:""}{p.sport?` · ${p.sport}`:""}</p>
              </div>
              {p.is_athlete&&<Tag label="Atleta" color="#7c6af7"/>}
              {p.invite_status==="aprobado"&&<Tag label="Activo" color={C.success}/>}
              {p.invite_status==="pendiente"&&<Tag label="Pendiente" color={C.warn}/>}
              {!p.invite_status&&<Tag label="Sin acceso" color={C.dim}/>}
              <div onClick={e=>e.stopPropagation()}>
                <Menu items={[
                  {label:"Ver perfil",      action:()=>onViewProfile(p)},
                  {label:"Prescribir plan", icon:I.plus,  action:()=>onPrescribe(p)},
                  {label:"Editar datos",    icon:I.edit,  action:()=>{setEditPt(p);setF({name:p.name,age:p.age||"",condition:p.condition||"",email:p.email||"",is_athlete:p.is_athlete||false,sport:p.sport||""});}},
                  {label:"Copiar link",     icon:I.link,  action:()=>setInvite(p)},
                  p.invite_status!=="aprobado"&&{label:"Habilitar acceso", action:()=>approvePatient(p.id)},
                  "---",
                  {label:"Eliminar",        icon:I.trash, danger:true, action:()=>deletePt(p)},
                ].filter(Boolean)}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PRESCRIBE VIEW ───────────────────────────────────────────────────────────
function PrescribeView({user,patient,onBack,existingPrescription}){
  const isEdit=!!existingPrescription;
  const initBlocks=()=>{const s={"Terapia":[],"Calentamiento / Activación":[],"Trabajo central":[]};if(isEdit)(existingPrescription.exercises||[]).forEach(ex=>{const b=ex.block||"Trabajo central";if(s[b])s[b].push({...ex});else s["Trabajo central"].push({...ex});});return s;};

  const [selected,setSel]=useState(initBlocks);
  const [note,setNote]=useState(existingPrescription?.note||"");
  const [duration,setDur]=useState(existingPrescription?.duration_days||30);
  const [activeBlock,setAB]=useState("Trabajo central");
  const [search,setSearch]=useState("");
  const [cat,setCat]=useState("Todos");
  const [submitted,setDone]=useState(false);
  const [loading,setLoad]=useState(false);
  const [customExs,setCustom]=useState([]);
  const [showNewEx,setNewExOpen]=useState(false);
  const [newEx,setNewEx]=useState({name:"",description:"",category:"Rehabilitacion",default_sets:3,default_reps:"10",video_url:""});
  const [savingEx,setSavingEx]=useState(false);

  const refreshCustom=()=>supabase.from("custom_exercises").select("*").eq("therapist_id",user.id).order("created_at",{ascending:false}).then(({data})=>setCustom((data||[]).map(e=>({id:"custom_"+e.id,dbId:e.id,name:e.name,description:e.description||"",category:e.category||"Personalizado",defaultSets:e.default_sets||3,defaultReps:e.default_reps||"10",isCustom:true}))));
  useEffect(()=>{refreshCustom();},[user.id]);

  const saveNewEx=async()=>{
    if(!newEx.name.trim())return;
    setSavingEx(true);
    const{data,error}=await supabase.from("custom_exercises").insert({therapist_id:user.id,name:newEx.name.trim(),description:newEx.description,category:newEx.category,default_block:activeBlock,default_sets:parseInt(newEx.default_sets)||3,default_reps:newEx.default_reps,video_url:newEx.video_url||null}).select().single();
    if(error){alert("Error: "+error.message);setSavingEx(false);return;}
    if(data){const exId=900000+Math.floor(Math.random()*99999);const ex={id:exId,name:data.name,description:data.description||"",category:data.category,defaultSets:data.default_sets,defaultReps:data.default_reps,video_url:data.video_url||null,isCustom:true,dbId:data.id};setSel(prev=>({...prev,[activeBlock]:[...prev[activeBlock],{...ex,sets:ex.defaultSets,reps:ex.defaultReps,block:activeBlock}]}));refreshCustom();}
    setNewEx({name:"",description:"",category:"Rehabilitacion",default_sets:3,default_reps:"10",video_url:""});setNewExOpen(false);setSavingEx(false);
  };

  const allExercises=[...customExs,...EXERCISES];
  const filtered=allExercises.filter(ex=>{if(cat==="Mis ejercicios")return ex.isCustom;const mc=cat==="Todos"||ex.category===cat;const ms=ex.name.toLowerCase().includes(search.toLowerCase())||(ex.description||"").toLowerCase().includes(search.toLowerCase());return mc&&ms;});
  const allSelected=Object.values(selected).flat();
  const isIn=ex=>allSelected.find(e=>e.id===ex.id);
  const blockOf=ex=>{for(const b of BLOCKS)if(selected[b].find(e=>e.id===ex.id))return b;return null;};
  const addEx=ex=>{if(isIn(ex))return;setSel(prev=>({...prev,[activeBlock]:[...prev[activeBlock],{...ex,sets:ex.defaultSets,reps:ex.defaultReps,block:activeBlock}]}));};
  const removeEx=(ex,block)=>setSel(prev=>({...prev,[block]:prev[block].filter(e=>e.id!==ex.id)}));
  const updateEx=(id,block,field,val)=>setSel(prev=>({...prev,[block]:prev[block].map(e=>e.id===id?{...e,[field]:val}:e)}));

  const DURATIONS=[{days:7,l:"1 sem"},{days:14,l:"2 sem"},{days:21,l:"3 sem"},{days:30,l:"1 mes"},{days:45,l:"45d"},{days:60,l:"2 mes"},{days:90,l:"3 mes"}];

  const [templates,setTemplates]=useState([]);
  const [showTemplates,setShowTemplates]=useState(false);
  const [savingTemplate,setSavingTemplate]=useState(false);
  const [templateName,setTemplateName]=useState("");
  const [showSaveTemplate,setShowSaveTemplate]=useState(false);

  useEffect(()=>{
    supabase.from("prescription_templates").select("*").eq("therapist_id",user.id).order("created_at",{ascending:false})
      .then(({data})=>setTemplates(data||[]));
  },[user.id]);

  const saveTemplate=async()=>{
    if(!templateName.trim())return;
    setSavingTemplate(true);
    const exs=BLOCKS.flatMap(b=>(selected[b]||[]).map(e=>({...e,block:b})));
    await supabase.from("prescription_templates").insert({therapist_id:user.id,name:templateName.trim(),exercises:exs,note,duration_days:duration});
    const{data}=await supabase.from("prescription_templates").select("*").eq("therapist_id",user.id).order("created_at",{ascending:false});
    setTemplates(data||[]);
    setTemplateName("");setShowSaveTemplate(false);setSavingTemplate(false);
  };

  const applyTemplate=(tpl)=>{
    const newSel={"Terapia":[],"Calentamiento / Activación":[],"Trabajo central":[]};
    (tpl.exercises||[]).forEach(ex=>{const b=ex.block||"Trabajo central";if(newSel[b])newSel[b].push({...ex});else newSel["Trabajo central"].push({...ex});});
    setSel(newSel);
    if(tpl.note)setNote(tpl.note);
    if(tpl.duration_days)setDur(tpl.duration_days);
    setShowTemplates(false);
  };

  const deleteTemplate=async(id)=>{
    if(!window.confirm("¿Eliminar esta plantilla?"))return;
    await supabase.from("prescription_templates").delete().eq("id",id);
    setTemplates(prev=>prev.filter(t=>t.id!==id));
  };

  // Built-in warmup protocol
  const WARMUP_PROTOCOL={
    name:"Calentamiento general",
    exercises:[
      {id:90001,name:"Rotación de cadera en círculos",category:"Calentamiento",defaultSets:2,defaultReps:"10 c/lado",sets:2,reps:"10 c/lado",block:"Calentamiento / Activación",description:"Círculos amplios con la cadera"},
      {id:90002,name:"Movilidad de columna torácica",category:"Calentamiento",defaultSets:2,defaultReps:"10",sets:2,reps:"10",block:"Calentamiento / Activación",description:"Rotaciones en cuadrupedia"},
      {id:90003,name:"Activación de glúteo medio (clamshell)",category:"Calentamiento",defaultSets:3,defaultReps:"15 c/lado",sets:3,reps:"15 c/lado",block:"Calentamiento / Activación",description:"En decúbito lateral, abre la cadera"},
      {id:90004,name:"Puente de glúteo isométrico",category:"Calentamiento",defaultSets:3,defaultReps:"12",sets:3,reps:"12",block:"Calentamiento / Activación",description:"Elevar cadera desde decúbito supino"},
      {id:90005,name:"Rotación externa de hombro con banda",category:"Calentamiento",defaultSets:3,defaultReps:"15",sets:3,reps:"15",block:"Calentamiento / Activación",description:"Codo a 90°, rotación externa con banda elástica"},
      {id:90006,name:"Retracción escapular",category:"Calentamiento",defaultSets:3,defaultReps:"12",sets:3,reps:"12",block:"Calentamiento / Activación",description:"Llevar escápulas hacia la columna"},
      {id:90007,name:"Dead bug",category:"Core / Abdomen",defaultSets:3,defaultReps:"8 c/lado",sets:3,reps:"8 c/lado",block:"Trabajo central",description:"En decúbito supino, extender brazo y pierna opuestos"},
      {id:90008,name:"Plancha abdominal",category:"Core / Abdomen",defaultSets:3,defaultReps:"30 seg",sets:3,reps:"30 seg",block:"Trabajo central",description:"Posición de plancha sobre antebrazos"},
    ],
    note:"Protocolo de calentamiento general: movilidad, activación glútea, cintura escapular y core.",
    duration_days:30,
  };

  const send=async()=>{
    const exs=BLOCKS.flatMap(b=>(selected[b]||[]).map(e=>({...e,block:b})));
    if(!exs.length)return;
    setLoad(true);
    const sd=localDateStr(new Date());
    const ed=localDateStr(new Date(Date.now()+duration*864e5));
    const notifyPatient=async()=>{
      try{
        const{data:subs}=await supabase.from("push_subscriptions").select("subscription").eq("patient_id",patient.id);
        if(!subs||!subs.length)return;
        // Store a pending notification for the patient to pick up on next open
        await supabase.from("notifications").insert({patient_id:patient.id,title:"Nuevo plan de ejercicios",body:`Tu fisioterapeuta ha actualizado tu plan. ¡A darle!`,read:false}).catch(()=>{});
      }catch(e){}
    };
    if(isEdit){
      const{error}=await supabase.from("prescriptions").update({exercises:exs,note,duration_days:duration,end_date:ed}).eq("id",existingPrescription.id);
      if(!error){setDone(true);notifyPatient();}else alert("Error: "+error.message);
    } else {
      const{error}=await supabase.from("prescriptions").insert({patient_id:patient.id,therapist_id:user.id,exercises:exs,note,duration_days:duration,start_date:sd,end_date:ed});
      if(!error){setDone(true);notifyPatient();}else alert("Error: "+error.message);
    }
    setLoad(false);
  };

  const total=allSelected.length;

  if(submitted)return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 16px",textAlign:"center"}}>
      <div style={{width:52,height:52,background:"rgba(76,175,121,.15)",border:"1px solid rgba(76,175,121,.3)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h3 style={{fontFamily:"'Fraunces',serif",color:C.text,fontSize:20,margin:"0 0 8px"}}>{isEdit?"Plan actualizado":"Plan guardado"}</h3>
      <p style={{color:C.muted,marginBottom:24}}>{total} ejercicios · {patient.name}</p>
      <Btn onClick={onBack} variant="primary">Volver</Btn>
    </div>
  );

  return(
    <div>
      {/* New exercise modal */}
      {showNewEx&&(
        <Modal title="Nuevo ejercicio" onClose={()=>setNewExOpen(false)}>
          <div style={{display:"grid",gap:10}}>
            <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Nombre *</label><input value={newEx.name} onChange={e=>setNewEx({...newEx,name:e.target.value})} placeholder="Ej: Sentadilla isométrica" style={inp}/></div>
            <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Descripción</label><textarea value={newEx.description} onChange={e=>setNewEx({...newEx,description:e.target.value})} rows={3} style={{...inp,resize:"none",lineHeight:1.5}}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              <div><label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Categoría</label><select value={newEx.category} onChange={e=>setNewEx({...newEx,category:e.target.value})} style={{...inp,padding:"8px 10px"}}>{["Rehabilitacion","Core / Abdomen","Gluteos / Cadera","Pierna / Rodilla","Hombro / Escapular","Pecho / Empuje","Espalda / Traccion","Tobillo / Pie","Cervical / Cuello","Calentamiento","Full Body","Otro"].map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Series</label><input type="number" value={newEx.default_sets} min="1" onChange={e=>setNewEx({...newEx,default_sets:e.target.value})} style={{...inp,textAlign:"center"}}/></div>
              <div><label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Reps</label><input value={newEx.default_reps} onChange={e=>setNewEx({...newEx,default_reps:e.target.value})} style={{...inp,textAlign:"center"}}/></div>
            </div>
          </div>
          <div style={{marginTop:10}}>
            <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:3}}>URL de video (opcional)</label>
            <input value={newEx.video_url||""} onChange={e=>setNewEx({...newEx,video_url:e.target.value})} placeholder="https://youtube.com/..." style={inp}/>
          </div>
          <p style={{color:C.muted,fontSize:12,marginTop:10}}>Se agregará al bloque: <strong style={{color:C.accentL}}>{activeBlock}</strong></p>
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <Btn onClick={saveNewEx} disabled={!newEx.name.trim()||savingEx} variant="primary" style={{flex:1}}>{savingEx?"Guardando...":"Crear y agregar"}</Btn>
            <Btn onClick={()=>setNewExOpen(false)} variant="ghost">Cancelar</Btn>
          </div>
        </Modal>
      )}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,color:C.muted,background:"none",border:"none",cursor:"pointer",fontSize:13}}>{I.back} Volver</button>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setShowTemplates(true)} variant="ghost" style={{fontSize:12}}>Plantillas</Btn>
          {total>0&&<Btn onClick={()=>setShowSaveTemplate(true)} variant="subtle" style={{fontSize:12}}>Guardar como plantilla</Btn>}
        </div>
      </div>

      {/* Templates modal */}
      {showTemplates&&(
        <Modal title="Plantillas de prescripción" onClose={()=>setShowTemplates(false)}>
          {/* Built-in warmup */}
          <div style={{marginBottom:14}}>
            <p style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 8px"}}>Protocolos base</p>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px"}}>
              <div>
                <p style={{color:C.text,fontWeight:600,fontSize:13,margin:0}}>Calentamiento general</p>
                <p style={{color:C.muted,fontSize:11,margin:"2px 0 0"}}>Movilidad · Glúteo · Escapular · Core · 8 ejercicios</p>
              </div>
              <Btn onClick={()=>applyTemplate(WARMUP_PROTOCOL)} variant="primary" style={{fontSize:12}}>Aplicar</Btn>
            </div>
          </div>

          {/* User templates */}
          {templates.length>0&&(
            <div>
              <p style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 8px"}}>Mis plantillas</p>
              <div style={{display:"grid",gap:6}}>
                {templates.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px"}}>
                    <div>
                      <p style={{color:C.text,fontWeight:600,fontSize:13,margin:0}}>{t.name}</p>
                      <p style={{color:C.muted,fontSize:11,margin:"2px 0 0"}}>{(t.exercises||[]).length} ejercicios · {t.duration_days}d</p>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <Btn onClick={()=>applyTemplate(t)} variant="primary" style={{fontSize:12}}>Aplicar</Btn>
                      <button onClick={()=>deleteTemplate(t.id)} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",display:"flex"}}>{I.trash}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {templates.length===0&&<p style={{color:C.muted,fontSize:13,textAlign:"center",padding:"8px 0"}}>Guarda un plan como plantilla para verlo aquí</p>}
        </Modal>
      )}

      {/* Save as template modal */}
      {showSaveTemplate&&(
        <Modal title="Guardar como plantilla" onClose={()=>setShowSaveTemplate(false)} maxWidth={360}>
          <p style={{color:C.muted,fontSize:13,marginBottom:14}}>Guarda este plan ({total} ejercicios) como plantilla reutilizable.</p>
          <input value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="Nombre de la plantilla" style={{...inp,marginBottom:14}}
            onKeyDown={e=>e.key==="Enter"&&saveTemplate()}/>
          <div style={{display:"flex",gap:10}}>
            <Btn onClick={saveTemplate} disabled={!templateName.trim()||savingTemplate} variant="primary" style={{flex:1}}>{savingTemplate?"Guardando...":"Guardar"}</Btn>
            <Btn onClick={()=>setShowSaveTemplate(false)} variant="ghost">Cancelar</Btn>
          </div>
        </Modal>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20}}>
        {/* LEFT: Library */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{flex:1,position:"relative"}}>
              <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.dim}}>{I.search}</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar ejercicio..." style={{...inp,paddingLeft:32,fontSize:12}}/>
            </div>
            <Btn onClick={()=>setNewExOpen(true)} variant="subtle" style={{fontSize:12,padding:"7px 11px",whiteSpace:"nowrap"}}>{I.plus} Crear</Btn>
          </div>

          {/* Category pills */}
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {["Todos","Mis ejercicios",...CATEGORIES].map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${cat===c?C.accent:C.border}`,background:cat===c?"rgba(38,166,154,.12)":"transparent",color:cat===c?C.accent:C.muted,fontSize:11,fontWeight:cat===c?700:400,cursor:"pointer",transition:"all .15s"}}>{c}</button>
            ))}
          </div>

          {/* Block selector */}
          <div>
            <p style={{fontSize:11,color:C.muted,margin:"0 0 6px"}}>Agregar al bloque:</p>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {BLOCKS.map(b=>{const m=BM[b];return<button key={b} onClick={()=>setAB(b)} style={{padding:"5px 10px",borderRadius:8,border:`1px solid ${activeBlock===b?m.c:C.border}`,background:activeBlock===b?m.bg:"transparent",color:activeBlock===b?m.c:C.muted,fontSize:11,fontWeight:activeBlock===b?700:400,cursor:"pointer"}}>{b}</button>;})}
            </div>
          </div>

          {/* Exercise list */}
          <div style={{overflowY:"auto",maxHeight:500,display:"flex",flexDirection:"column",gap:5}}>
            {filtered.length===0?<p style={{color:C.muted,fontSize:12,textAlign:"center",padding:"16px 0"}}>Sin resultados</p>:filtered.map(ex=>{
              const inBlock=blockOf(ex);
              return(
                <div key={ex.id}
                  style={{display:"flex",alignItems:"center",gap:10,background:inBlock?"rgba(38,166,154,.07)":C.card,border:`1px solid ${inBlock?"rgba(38,166,154,.25)":C.border}`,borderRadius:10,padding:"9px 12px",transition:"all .15s"}}>
                  <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>inBlock?removeEx(ex,inBlock):addEx(ex)}>
                    <p style={{color:C.text,fontSize:12,fontWeight:500,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex.name}</p>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:1}}>
                      <p style={{color:C.muted,fontSize:10,margin:0}}>{ex.category}</p>
                      {ex.video_url&&<a href={ex.video_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{color:C.accent,fontSize:10,textDecoration:"none",flexShrink:0}}>▶ video</a>}
                    </div>
                  </div>
                  {inBlock?(
                    <span onClick={()=>removeEx(ex,inBlock)} style={{fontSize:10,color:BM[inBlock]?.c||C.accent,fontWeight:700,background:(BM[inBlock]?.bg||"rgba(38,166,154,.1)"),border:`1px solid ${BM[inBlock]?.c||C.accent}33`,borderRadius:6,padding:"1px 6px",flexShrink:0,cursor:"pointer"}}>{inBlock.split(" ")[0]}</span>
                  ):(
                    <span onClick={()=>addEx(ex)} style={{color:C.dim,fontSize:10,flexShrink:0,cursor:"pointer"}}>+ agregar</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Plan */}
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <p style={{color:C.text,fontWeight:600,fontSize:14,margin:0}}>Plan de {patient.name}</p>
            <span style={{color:C.muted,fontSize:12}}>{total} ejercicios</span>
          </div>

          {/* Duration */}
          <div style={{marginBottom:12}}>
            <p style={{fontSize:11,color:C.muted,margin:"0 0 6px"}}>Duración</p>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {DURATIONS.map(d=>(
                <button key={d.days} onClick={()=>setDur(d.days)} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${duration===d.days?C.accent:C.border}`,background:duration===d.days?"rgba(38,166,154,.12)":"transparent",color:duration===d.days?C.accent:C.muted,fontSize:11,fontWeight:duration===d.days?700:400,cursor:"pointer"}}>
                  {d.l}
                </button>
              ))}
            </div>
            <p style={{color:C.dim,fontSize:11,marginTop:5}}>Vence: <span style={{color:C.accentL}}>{new Date(Date.now()+duration*864e5).toLocaleDateString("es-CO",{day:"numeric",month:"short",year:"numeric"})}</span></p>
          </div>

          {/* Blocks */}
          {total===0?(
            <div style={{background:C.surface,border:`1px dashed ${C.border}`,borderRadius:12,padding:"28px 16px",textAlign:"center"}}>
              <p style={{color:C.muted,fontSize:12}}>Selecciona ejercicios de la biblioteca</p>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
              {BLOCKS.map(b=>{
                const exs=selected[b];if(!exs.length)return null;const m=BM[b];
                return(
                  <div key={b}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:m.c}}/>
                      <span style={{color:m.c,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.4}}>{b}</span>
                    </div>
                    {exs.map(ex=>(
                      <div key={ex.id} style={{display:"flex",alignItems:"center",gap:8,background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"7px 10px",marginBottom:5}}>
                        <span style={{flex:1,color:C.text,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex.name}</span>
                        <input value={ex.sets} onChange={e=>updateEx(ex.id,b,"sets",e.target.value)} style={{width:32,background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"2px 4px",fontSize:12,color:C.accent,fontWeight:700,textAlign:"center",outline:"none"}}/>
                        <span style={{color:C.dim,fontSize:11}}>×</span>
                        <input value={ex.reps} onChange={e=>updateEx(ex.id,b,"reps",e.target.value)} style={{width:36,background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"2px 4px",fontSize:12,color:C.accent,fontWeight:700,textAlign:"center",outline:"none"}}/>
                        <button onClick={()=>removeEx(ex,b)} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",display:"flex",padding:2,flexShrink:0}}>{I.trash}</button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Note */}
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Nota para el paciente (opcional)..." rows={3}
            style={{...inp,resize:"none",marginBottom:10,fontSize:12,lineHeight:1.6}}/>

          <button onClick={send} disabled={!total||loading}
            style={{width:"100%",background:total?C.accentG:"rgba(255,255,255,.04)",border:"none",borderRadius:10,padding:11,color:total?"#fff":C.muted,fontWeight:700,fontSize:13,cursor:total?"pointer":"not-allowed",transition:"all .2s"}}>
            {loading?"Guardando...":`${isEdit?"Actualizar":"Guardar"} plan · ${total} ejercicios`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AGENDA ───────────────────────────────────────────────────────────────────
function AgendaView({user}){
  const [appointments,setAppts]=useState([]);
  const [weekOffset,setWeek]=useState(0);
  const [showForm,setForm]=useState(null);
  const [form,setF]=useState({patient_name:"",type:"Presencial"});
  const [loading,setLoad]=useState(true);

  useEffect(()=>{load();},[]);
  const load=async()=>{const{data}=await supabase.from("appointments").select("*").order("date",{ascending:true});setAppts(data||[]);setLoad(false);};

  const today=new Date();today.setHours(0,0,0,0);
  const startOfWeek=new Date(today);startOfWeek.setDate(today.getDate()-today.getDay()+1+weekOffset*7);
  const days=Array.from({length:7},(_,i)=>{const d=new Date(startOfWeek);d.setDate(startOfWeek.getDate()+i);return d;});
  const HOURS=Array.from({length:13},(_,i)=>`${i+7}:00`);

  const getAppts=(date,hour)=>{const ds=localDateStr(date);return appointments.filter(a=>a.date===ds&&a.time===hour);};
  const addAppt=async()=>{if(!form.patient_name||!showForm)return;await supabase.from("appointments").insert({therapist_id:user.id,patient_name:form.patient_name,type:form.type,date:showForm.date,time:showForm.time,status:"confirmada"});setForm(null);setF({patient_name:"",type:"Presencial"});load();};
  const delAppt=async(id,e)=>{e.stopPropagation();if(!window.confirm("¿Eliminar cita?"))return;await supabase.from("appointments").delete().eq("id",id);load();};

  const monthName=startOfWeek.toLocaleDateString("es-CO",{month:"long",year:"numeric"});

  return(
    <div>
      {showForm&&(
        <Modal title={`Cita — ${showForm.date} ${showForm.time}`} onClose={()=>setForm(null)} maxWidth={360}>
          <div style={{display:"grid",gap:10,marginBottom:16}}>
            <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Paciente</label><input value={form.patient_name} onChange={e=>setF({...form,patient_name:e.target.value})} placeholder="Nombre del paciente" style={inp}/></div>
            <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Tipo</label>
              <select value={form.type} onChange={e=>setF({...form,type:e.target.value})} style={inp}>
                {["Presencial","Domicilio","Virtual"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn onClick={addAppt} variant="primary" style={{flex:1}}>Guardar</Btn>
            <Btn onClick={()=>setForm(null)} variant="ghost">Cancelar</Btn>
          </div>
        </Modal>
      )}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,gap:10}}>
        <h2 style={{fontFamily:"'Fraunces',serif",color:C.text,fontSize:20,margin:0,textTransform:"capitalize"}}>{monthName}</h2>
        <div style={{display:"flex",gap:6}}>
          <Btn onClick={()=>setWeek(0)} variant="ghost" style={{fontSize:12}}>Hoy</Btn>
          <Btn onClick={()=>setWeek(w=>w-1)} variant="ghost" style={{padding:"6px 10px"}}>‹</Btn>
          <Btn onClick={()=>setWeek(w=>w+1)} variant="ghost" style={{padding:"6px 10px"}}>›</Btn>
        </div>
      </div>

      {loading?<Spinner/>:(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:640}}>
            <thead>
              <tr>
                <th style={{width:50,padding:"6px 8px",color:C.muted,fontSize:11,fontWeight:600,textAlign:"left"}}></th>
                {days.map((d,i)=>{const isT=localDateStr(d)===localDateStr(new Date());return(
                  <th key={i} style={{padding:"6px 8px",textAlign:"center",color:isT?C.accent:C.muted,fontSize:11,fontWeight:isT?700:500,background:isT?"rgba(38,166,154,.06)":"transparent"}}>
                    <div>{["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"][i]}</div>
                    <div style={{fontSize:16,fontWeight:700,color:isT?C.accent:C.text}}>{d.getDate()}</div>
                  </th>
                );})}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour=>(
                <tr key={hour}>
                  <td style={{padding:"4px 8px",color:C.dim,fontSize:10,verticalAlign:"top",paddingTop:6,whiteSpace:"nowrap"}}>{hour}</td>
                  {days.map((d,j)=>{
                    const appts=getAppts(d,hour);
                    const isT=localDateStr(d)===localDateStr(new Date());
                    const canAdd=appts.length<3;
                    const ds=localDateStr(d);
                    return(
                      <td key={j} onClick={()=>canAdd&&setForm({date:ds,time:hour})}
                        style={{padding:3,verticalAlign:"top",minHeight:36,height:36,borderTop:`1px solid ${C.border}`,cursor:canAdd?"pointer":"default",background:isT?"rgba(38,166,154,.03)":"transparent",transition:"background .15s"}}
                        onMouseEnter={e=>{if(canAdd)e.currentTarget.style.background=isT?"rgba(38,166,154,.08)":"rgba(255,255,255,.02)";}}
                        onMouseLeave={e=>{e.currentTarget.style.background=isT?"rgba(38,166,154,.03)":"transparent";}}>
                        {appts.map(a=>(
                          <div key={a.id} style={{background:C.accentG,borderRadius:5,padding:"2px 6px",marginBottom:2,display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}>
                            <span style={{fontSize:10,color:"#fff",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{a.patient_name}</span>
                            <button onClick={e=>delAppt(a.id,e)} style={{background:"transparent",border:"none",color:"rgba(255,255,255,.7)",cursor:"pointer",padding:0,fontSize:11,lineHeight:1,flexShrink:0}}>×</button>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── MESSAGES VIEW ────────────────────────────────────────────────────────────
function MessagesView({user}){
  const [threads,setThreads]=useState([]);
  const [active,setActive]=useState(null);
  const [messages,setMessages]=useState([]);
  const [reply,setReply]=useState("");
  const [loading,setLoad]=useState(true);
  const bottomRef=useRef();

  useEffect(()=>{loadThreads();},[]);
  useEffect(()=>{if(active)loadMessages(active);},[active]);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const loadThreads=async()=>{
    const{data}=await supabase.from("messages").select("*")
      .eq("therapist_id",user.id).order("created_at",{ascending:false});
    const map={};(data||[]).forEach(m=>{
      if(!map[m.patient_name])map[m.patient_name]={name:m.patient_name,last:m.content,unread:0,ts:m.created_at};
      if(m.unread&&m.sender==="patient")map[m.patient_name].unread++;
    });
    setThreads(Object.values(map).sort((a,b)=>b.ts>a.ts?1:-1));setLoad(false);
  };
  const loadMessages=async(name)=>{
    await supabase.from("messages").update({unread:false}).eq("patient_name",name).eq("sender","patient");
    const{data}=await supabase.from("messages").select("*").eq("patient_name",name).order("created_at",{ascending:true});
    setMessages(data||[]);loadThreads();
  };
  const send=async()=>{
    const t=reply.trim();if(!t)return;
    setReply("");
    await supabase.from("messages").insert({therapist_id:user.id,patient_name:active,content:t,sender:"therapist",unread:true});
    loadMessages(active);
  };

  return(
    <div style={{display:"grid",gridTemplateColumns:active?"280px 1fr":"1fr",gap:16,height:"calc(100vh - 80px)",maxWidth:900}}>
      {/* Thread list */}
      <div>
        <h2 style={{fontFamily:"'Fraunces',serif",color:C.text,fontSize:20,margin:"0 0 16px"}}>Mensajes</h2>
        {loading?<Spinner/>:threads.length===0?<p style={{color:C.muted,fontSize:13}}>Sin conversaciones</p>:(
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {threads.map(t=>(
              <div key={t.name} onClick={()=>setActive(t.name)}
                style={{display:"flex",gap:10,alignItems:"center",background:active===t.name?C.card:C.surface,border:`1px solid ${active===t.name?C.accent+"44":C.border}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",transition:"all .15s"}}>
                <Avatar name={t.name} size={34}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <p style={{color:C.text,fontWeight:600,fontSize:13,margin:0}}>{t.name}</p>
                    {t.unread>0&&<span style={{background:C.accent,color:"#fff",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>{t.unread}</span>}
                  </div>
                  <p style={{color:C.muted,fontSize:11,margin:"2px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.last}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat */}
      {active&&(
        <div style={{display:"flex",flexDirection:"column",background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <Avatar name={active} size={32}/>
            <p style={{color:C.text,fontWeight:600,fontSize:14,margin:0}}>{active}</p>
            <button onClick={()=>setActive(null)} style={{marginLeft:"auto",background:"transparent",border:"none",color:C.dim,cursor:"pointer",display:"flex",padding:4}}>{I.back}</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:8}}>
            {messages.map(m=>(
              <div key={m.id} style={{display:"flex",justifyContent:m.sender==="therapist"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"72%",background:m.sender==="therapist"?C.accentG:C.card,border:m.sender==="therapist"?"none":`1px solid ${C.border}`,borderRadius:13,borderBottomRightRadius:m.sender==="therapist"?3:13,borderBottomLeftRadius:m.sender==="therapist"?13:3,padding:"9px 13px",fontSize:13,color:C.text,lineHeight:1.5}}>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>
          <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,flexShrink:0}}>
            <input value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Mensaje..." style={{...inp,flex:1}}/>
            <button onClick={send} disabled={!reply.trim()} style={{width:38,height:38,background:reply.trim()?C.accentG:"rgba(255,255,255,.04)",border:"none",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",cursor:reply.trim()?"pointer":"default",flexShrink:0,color:"#fff"}}>
              {I.send}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CUSTOM EXERCISES VIEW ────────────────────────────────────────────────────
function CustomExercisesView({user}){
  const [exs,setExs]=useState([]);
  const [loading,setLoad]=useState(true);
  const [showForm,setForm]=useState(false);
  const [editEx,setEdit]=useState(null);
  const [form,setF]=useState({name:"",description:"",category:"Rehabilitacion",default_sets:3,default_reps:"10",video_url:""});
  const [saving,setSave]=useState(false);

  useEffect(()=>{load();},[]);
  const load=async()=>{const{data}=await supabase.from("custom_exercises").select("*").eq("therapist_id",user.id).order("created_at",{ascending:false});setExs(data||[]);setLoad(false);};
  const save=async()=>{
    if(!form.name.trim())return;setSave(true);
    const payload={therapist_id:user.id,name:form.name.trim(),description:form.description,category:form.category,default_sets:parseInt(form.default_sets)||3,default_reps:form.default_reps,video_url:form.video_url||null};
    if(editEx)await supabase.from("custom_exercises").update(payload).eq("id",editEx.id);
    else await supabase.from("custom_exercises").insert(payload);
    setF({name:"",description:"",category:"Rehabilitacion",default_sets:3,default_reps:"10",video_url:""});setForm(false);setEdit(null);setSave(false);load();
  };
  const del=async(id)=>{if(!window.confirm("¿Eliminar este ejercicio?"))return;await supabase.from("custom_exercises").delete().eq("id",id);load();};
  const openEdit=(ex)=>{setEdit(ex);setF({name:ex.name,description:ex.description||"",category:ex.category||"Rehabilitacion",default_sets:ex.default_sets||3,default_reps:ex.default_reps||"10",video_url:ex.video_url||""});setForm(true);};

  return(
    <div>
      {showForm&&(
        <Modal title={editEx?"Editar ejercicio":"Nuevo ejercicio"} onClose={()=>{setForm(false);setEdit(null);setF({name:"",description:"",category:"Rehabilitacion",default_sets:3,default_reps:"10",video_url:""});}}>
          <div style={{display:"grid",gap:10}}>
            <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Nombre *</label><input value={form.name} onChange={e=>setF({...form,name:e.target.value})} style={inp}/></div>
            <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Descripción</label><textarea value={form.description} onChange={e=>setF({...form,description:e.target.value})} rows={3} style={{...inp,resize:"none",lineHeight:1.5}}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              <div><label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Categoría</label><select value={form.category} onChange={e=>setF({...form,category:e.target.value})} style={{...inp,padding:"8px 10px"}}>{["Rehabilitacion","Core / Abdomen","Gluteos / Cadera","Pierna / Rodilla","Hombro / Escapular","Pecho / Empuje","Espalda / Traccion","Tobillo / Pie","Cervical / Cuello","Calentamiento","Full Body","Otro"].map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Series</label><input type="number" value={form.default_sets} min="1" onChange={e=>setF({...form,default_sets:e.target.value})} style={{...inp,textAlign:"center"}}/></div>
              <div><label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Reps</label><input value={form.default_reps} onChange={e=>setF({...form,default_reps:e.target.value})} style={{...inp,textAlign:"center"}}/></div>
            </div>
            <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>URL de video (YouTube, etc.)</label><input value={form.video_url} onChange={e=>setF({...form,video_url:e.target.value})} placeholder="https://youtube.com/watch?v=..." style={inp}/></div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:18}}>
            <Btn onClick={save} disabled={!form.name.trim()||saving} variant="primary" style={{flex:1}}>{saving?"Guardando...":editEx?"Actualizar":"Crear ejercicio"}</Btn>
            <Btn onClick={()=>{setForm(false);setEdit(null);}} variant="ghost">Cancelar</Btn>
          </div>
        </Modal>
      )}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div>
          <h2 style={{fontFamily:"'Fraunces',serif",color:C.text,fontSize:20,margin:0}}>Mis ejercicios</h2>
          <p style={{color:C.muted,fontSize:12,margin:"2px 0 0"}}>{exs.length} ejercicios personalizados</p>
        </div>
        <Btn onClick={()=>{setEdit(null);setF({name:"",description:"",category:"Rehabilitacion",default_sets:3,default_reps:"10",video_url:""});setForm(true);}} variant="primary">{I.plus} Nuevo</Btn>
      </div>

      {loading?<Spinner/>:exs.length===0?(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:40,textAlign:"center"}}>
          <p style={{color:C.muted,fontSize:13}}>Crea ejercicios personalizados para usar en tus planes</p>
          <Btn onClick={()=>setForm(true)} variant="primary" style={{marginTop:12}}>Crear primer ejercicio</Btn>
        </div>
      ):(
        <div style={{display:"grid",gap:6}}>
          {exs.map(ex=>(
            <div key={ex.id} style={{display:"flex",alignItems:"center",gap:12,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 14px"}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{color:C.text,fontWeight:600,fontSize:13,margin:0}}>{ex.name}</p>
                <p style={{color:C.muted,fontSize:11,margin:"2px 0 0"}}>{ex.category} · {ex.default_sets}×{ex.default_reps}</p>
                {ex.description&&<p style={{color:C.dim,fontSize:11,margin:"3px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex.description}</p>}
              </div>
              {ex.video_url&&<a href={ex.video_url} target="_blank" rel="noreferrer" style={{color:C.accent,fontSize:11,textDecoration:"none",flexShrink:0}} onClick={e=>e.stopPropagation()}>Video</a>}
              <Menu items={[
                {label:"Editar",   icon:I.edit,  action:()=>openEdit(ex)},
                "---",
                {label:"Eliminar", icon:I.trash, danger:true, action:()=>del(ex.id)},
              ]}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── AVAILABILITY VIEW ────────────────────────────────────────────────────────
function AvailabilityView({user}){
  const [slots,setSlots]=useState([]);
  const [loading,setLoad]=useState(true);
  const [form,setF]=useState({day_of_week:1,start_time:"08:00",end_time:"18:00"});
  const [saving,setSave]=useState(false);
  const DAYS=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

  useEffect(()=>{load();},[]);
  const load=async()=>{
    const{data}=await supabase.from("availability").select("*").eq("therapist_id",user.id).order("day_of_week").order("start_time");
    setSlots(data||[]);setLoad(false);
  };
  const save=async()=>{
    setSave(true);
    await supabase.from("availability").insert({...form,therapist_id:user.id,day_of_week:parseInt(form.day_of_week)});
    setSave(false);load();
  };
  const toggle=async(id,active)=>{await supabase.from("availability").update({active:!active}).eq("id",id);load();};
  const del=async(id)=>{if(!window.confirm("¿Eliminar este horario?"))return;await supabase.from("availability").delete().eq("id",id);load();};

  const byDay={};DAYS.forEach((_,i)=>{byDay[i]=slots.filter(s=>s.day_of_week===i);});

  return(
    <div style={{maxWidth:700}}>
      <div style={{marginBottom:20}}>
        <h2 style={{fontFamily:"'Fraunces',serif",color:C.text,fontSize:20,margin:"0 0 4px"}}>Disponibilidad</h2>
        <p style={{color:C.muted,fontSize:13,margin:0}}>Define tus horarios de atención. Los usuarios podrán verlos al agendar.</p>
      </div>

      {/* Add slot form */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:16,marginBottom:20}}>
        <p style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,margin:"0 0 12px"}}>Agregar horario</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:10,alignItems:"end"}}>
          <div>
            <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Día</label>
            <select value={form.day_of_week} onChange={e=>setF({...form,day_of_week:e.target.value})} style={{...inp}}>
              {DAYS.map((d,i)=><option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Desde</label>
            <input type="time" value={form.start_time} onChange={e=>setF({...form,start_time:e.target.value})} style={{...inp}}/>
          </div>
          <div>
            <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Hasta</label>
            <input type="time" value={form.end_time} onChange={e=>setF({...form,end_time:e.target.value})} style={{...inp}}/>
          </div>
          <Btn onClick={save} disabled={saving} variant="primary" style={{height:38}}>{saving?"...":"Agregar"}</Btn>
        </div>
      </div>

      {/* Slots by day */}
      {loading?<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:32}}><div style={{width:22,height:22,border:`2px solid ${C.accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite"}}/></div>:(
        <div style={{display:"grid",gap:8}}>
          {DAYS.map((day,i)=>{
            const daySlots=byDay[i]||[];
            if(!daySlots.length)return null;
            return(
              <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{background:C.card,padding:"8px 14px",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{color:C.text,fontWeight:600,fontSize:13}}>{day}</span>
                </div>
                {daySlots.map(s=>(
                  <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderBottom:`1px solid ${C.border}`,opacity:s.active?1:.5}}>
                    <span style={{color:s.active?C.accent:C.muted,fontWeight:700,fontSize:13,minWidth:100}}>{s.start_time} – {s.end_time}</span>
                    <div style={{flex:1}}/>
                    <button onClick={()=>toggle(s.id,s.active)} style={{background:s.active?"rgba(76,175,121,.12)":"rgba(107,115,144,.1)",border:`1px solid ${s.active?"rgba(76,175,121,.3)":C.border}`,borderRadius:8,padding:"4px 10px",color:s.active?C.success:C.muted,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                      {s.active?"Activo":"Inactivo"}
                    </button>
                    <button onClick={()=>del(s.id)} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",display:"flex",padding:4}}>{I.trash}</button>
                  </div>
                ))}
              </div>
            );
          })}
          {slots.length===0&&<p style={{color:C.muted,fontSize:13,textAlign:"center",padding:"24px 0"}}>Sin horarios definidos aún</p>}
        </div>
      )}
    </div>
  );
}

// ─── THERAPIST APP ────────────────────────────────────────────────────────────
function TherapistApp({user}){
  const [tab,setTab]=useState("dashboard");
  const [prescribePt,setPrescribePt]=useState(null);
  const [profilePt,setProfilePt]=useState(null);
  const [pendingFilter,setPF]=useState(null);

  const goBack=()=>{setPrescribePt(null);setProfilePt(null);};
  const prescribe=p=>{setPrescribePt(p);setProfilePt(null);setTab("patients");};
  const viewProfile=p=>{setProfilePt(p);setPrescribePt(null);};

  const NAV=[
    {id:"dashboard",   icon:I.dash,  label:"Dashboard"},
    {id:"patients",    icon:I.pts,   label:"Usuarios"},
    {id:"agenda",      icon:I.cal,   label:"Agenda"},
    {id:"messages",    icon:I.msg,   label:"Mensajes"},
    {id:"availability",icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label:"Horarios"},
  ];

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex"}}>
      {/* Sidebar — icons only */}
      <aside style={{width:52,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,bottom:0,zIndex:20,paddingTop:"env(safe-area-inset-top,0px)",boxShadow:"2px 0 8px rgba(0,0,0,0.06)"}}>
        <div style={{padding:"14px 0 12px",display:"flex",justifyContent:"center",borderBottom:`1px solid ${C.border}`}}>
          <div style={{width:34,height:34,background:C.accentG,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",padding:5}}>
            <svg width="24" height="24" viewBox="0 0 80 80" fill="none">
              <line x1="4" y1="52" x2="76" y2="52" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.4"/>
              <path d="M4,52 Q20,20 36,52 Q52,84 68,52 Q84,20 100,52" fill="rgba(255,255,255,0.12)" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24,34 Q40,-8 56,34" fill="none" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
              <circle cx="40" cy="-2" r="7" fill="white"/>
            </svg>
          </div>
        </div>
        <nav style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 0",gap:2}}>
          {NAV.map(item=>{const a=tab===item.id&&!prescribePt&&!profilePt;return(
            <button key={item.id} onClick={()=>{setTab(item.id);goBack();}} title={item.label}
              style={{width:36,height:36,borderRadius:9,border:"none",background:a?"rgba(38,166,154,.15)":"transparent",color:a?C.accent:C.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
              {item.icon}
            </button>
          );})}
        </nav>
        <div style={{padding:"8px 0 12px",paddingBottom:"calc(12px + env(safe-area-inset-bottom,0px))",display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderTop:`1px solid ${C.border}`}}>
          <button onClick={()=>supabase.auth.signOut()} title="Cerrar sesión"
            style={{width:36,height:36,borderRadius:9,border:"none",background:"transparent",color:C.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {I.out}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,marginLeft:52,padding:"28px 28px",minHeight:"100vh",paddingTop:"calc(28px + env(safe-area-inset-top,0px))",overflowX:"hidden",overflowY:"auto",background:C.bg}}>
        {tab==="dashboard"&&<DashboardView user={user} onNavigate={(t,p,f)=>{setTab(t);if(p)setProfilePt(p);if(f)setPF(f);}}/>}
        {tab==="patients"&&!prescribePt&&!profilePt&&<PatientsView user={user} onPrescribe={prescribe} onViewProfile={viewProfile} initialFilter={pendingFilter} onClearFilter={()=>setPF(null)}/>}
        {tab==="patients"&&prescribePt&&<PrescribeView user={user} patient={prescribePt} onBack={goBack}/>}
        {tab==="patients"&&profilePt&&<PatientProfile patient={profilePt} user={user} onBack={goBack} onPrescribe={prescribe} onApprove={async(id)=>{await supabase.from("patients").update({invite_status:"aprobado"}).eq("id",id);setProfilePt(prev=>({...prev,invite_status:"aprobado"}));}}/>}
        {tab==="agenda"&&<AgendaView user={user}/>}
        {tab==="messages"&&<MessagesView user={user}/>}
        {tab==="availability"&&<AvailabilityView user={user}/>}
      </main>
    </div>
  );
}

// ─── INVITE HANDLER ───────────────────────────────────────────────────────────
function InviteHandler({token,user}){
  // If user is already logged in → link their account
  const [status,setStatus]=useState(user?"linking":"idle");
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoad]=useState(false);
  const [error,setError]=useState("");
  const [patientName,setPatientName]=useState("");

  // Fetch patient name to personalise the screen
  useEffect(()=>{
    supabase.from("patients").select("id,name,invite_status").eq("invite_token",token).maybeSingle()
      .then(({data})=>{
        if(!data){setStatus("invalid");return;}
        setPatientName(data.name||"");
        if(user){
          // Already logged in: just link
          if(data.invite_status==="aprobado"){setStatus("already");return;}
          supabase.from("patients").update({user_id:user.id,invite_status:"pendiente"}).eq("invite_token",token)
            .then(({error})=>setStatus(error?"error":"success"));
        } else {
          setStatus("idle");
          // Pre-fill name from patient record if available
          if(data.name) setName(data.name);
        }
      });
  },[token,user]);

  const register=async()=>{
    if(!name.trim()||!email.trim()||!pass.trim()){setError("Completa todos los campos");return;}
    setLoad(true);setError("");
    // Sign up without email confirmation
    const{data:authData,error:authErr}=await supabase.auth.signUp({
      email:email.trim(),password:pass,
      options:{data:{full_name:name.trim()},emailRedirectTo:undefined}
    });
    if(authErr){setError(authErr.message);setLoad(false);return;}
    const uid=authData?.user?.id;
    if(!uid){setError("Error al crear la cuenta");setLoad(false);return;}
    // Link to patient record
    await supabase.from("patients").update({user_id:uid,invite_status:"pendiente",name:name.trim()}).eq("invite_token",token);
    setStatus("success");setLoad(false);
  };

  const wrap=(children)=>(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"28px 24px",maxWidth:360,width:"100%"}}>
        <div style={{width:40,height:40,background:C.accentG,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width="28" height="28" viewBox="0 0 80 80" fill="none"><line x1="4" y1="52" x2="76" y2="52" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.4"/><path d="M4,52 Q20,20 36,52 Q52,84 68,52 Q84,20 100,52" fill="rgba(255,255,255,0.12)" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><path d="M24,34 Q40,-8 56,34" fill="none" stroke="white" strokeWidth="4.5" strokeLinecap="round"/><circle cx="40" cy="-2" r="7" fill="white"/></svg>
        </div>
        {children}
      </div>
    </div>
  );

  if(status==="linking"||status==="loading") return wrap(<p style={{color:C.muted,textAlign:"center",fontSize:13}}>Verificando...</p>);
  if(status==="invalid") return wrap(<><h2 style={{color:C.text,fontSize:16,fontWeight:700,textAlign:"center",margin:"0 0 8px"}}>Link inválido</h2><p style={{color:C.muted,fontSize:13,textAlign:"center",margin:"0 0 16px"}}>Este link no existe o ya fue usado.</p><Btn onClick={()=>window.location.href="/"} variant="ghost" style={{width:"100%"}}>Ir al inicio</Btn></>);
  if(status==="already") return wrap(<><h2 style={{color:C.text,fontSize:16,fontWeight:700,textAlign:"center",margin:"0 0 8px"}}>Ya tienes acceso</h2><p style={{color:C.muted,fontSize:13,textAlign:"center",margin:"0 0 16px"}}>Tu cuenta ya está vinculada.</p><Btn onClick={()=>window.location.href="/"} variant="primary" style={{width:"100%"}}>Abrir FisioApp</Btn></>);
  if(status==="success") return wrap(<><h2 style={{color:C.text,fontSize:16,fontWeight:700,textAlign:"center",margin:"0 0 8px"}}>¡Registro exitoso!</h2><p style={{color:C.muted,fontSize:13,textAlign:"center",lineHeight:1.6,margin:"0 0 16px"}}>Tu fisioterapeuta aprobará tu acceso pronto. Inicia sesión para entrar.</p><Btn onClick={()=>window.location.href="/"} variant="primary" style={{width:"100%"}}>Iniciar sesión</Btn></>);
  if(status==="error") return wrap(<><h2 style={{color:C.text,fontSize:16,fontWeight:700,textAlign:"center",margin:"0 0 8px"}}>Algo salió mal</h2><p style={{color:C.muted,fontSize:13,textAlign:"center",margin:"0 0 16px"}}>Inténtalo de nuevo.</p><Btn onClick={()=>window.location.href="/"} variant="ghost" style={{width:"100%"}}>Volver</Btn></>);

  // idle — show registration form
  return wrap(
    <>
      <h2 style={{color:C.text,fontSize:17,fontWeight:700,margin:"0 0 4px",textAlign:"center"}}>Crear tu cuenta</h2>
      {patientName&&<p style={{color:C.muted,fontSize:12,textAlign:"center",margin:"0 0 18px"}}>Tu fisioterapeuta te ha invitado a FisioApp</p>}
      <div style={{display:"grid",gap:9,marginBottom:14}}>
        <div>
          <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:3}}>Nombre completo</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" style={inp}/>
        </div>
        <div>
          <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:3}}>Correo electrónico</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com" type="email" style={inp}/>
        </div>
        <div>
          <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:3}}>Contraseña</label>
          <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Mínimo 6 caracteres" type="password" style={inp}
            onKeyDown={e=>e.key==="Enter"&&register()}/>
        </div>
      </div>
      {error&&<p style={{color:C.danger,fontSize:12,background:"rgba(224,82,82,.08)",border:"1px solid rgba(224,82,82,.2)",borderRadius:8,padding:"7px 10px",marginBottom:12}}>{error}</p>}
      <Btn onClick={register} disabled={loading} variant="primary" style={{width:"100%",marginBottom:12}}>
        {loading?"Creando cuenta...":"Crear cuenta"}
      </Btn>
      <p style={{color:C.muted,fontSize:12,textAlign:"center",margin:0}}>
        ¿Ya tienes cuenta?{" "}
        <button onClick={()=>window.location.href="/"} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:12,fontWeight:600}}>Inicia sesión</button>
      </p>
    </>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [user,setUser]=useState(undefined);
  const [role,setRole]=useState(null);
  const inviteToken=new URLSearchParams(window.location.search).get("invite");

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>setUser(session?.user||null));
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>setUser(session?.user||null));
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!user){setRole(null);return;}
    (async()=>{
      const THERAPIST_EMAIL="celisone1@gmail.com";
      if(user.email===THERAPIST_EMAIL){setRole("therapist");return;}
      const{data:patData}=await supabase.from("patients").select("id,invite_status").eq("user_id",user.id).maybeSingle();
      if(patData&&patData.invite_status==="aprobado"){setRole("patient");return;}
      try{
        const meta=user.user_metadata||{};
        // Check first to avoid duplicates
        const{data:existing}=await supabase.from("access_requests").select("id").eq("user_id",user.id).maybeSingle();
        if(!existing){
          await supabase.from("access_requests").insert({user_id:user.id,email:user.email,display_name:meta.full_name||meta.name||""});
        }
      }catch(e){}
      setRole("pending");
    })();
  },[user]);

  if(user===undefined)return<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:24,height:24,border:`2px solid ${C.accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite"}}/><style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style></div>;
  // Show invite form even if not logged in
  if(inviteToken)return<InviteHandler token={inviteToken} user={user}/>;
  if(!user)return<LoginView/>;
  if(role==="patient")return<PatientApp user={user}/>;
  if(role==="pending")return<PendingApproval user={user}/>;
  if(role==="therapist")return<TherapistApp user={user}/>;
  return<Spinner/>;
}
