import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────
const THEMES = {
  neon: ["#a855f7","#ec4899","#06b6d4","#8b5cf6","#f43f5e","#3b82f6","#10b981","#f59e0b"],
  sunset: ["#f97316","#ef4444","#f59e0b","#ec4899","#8b5cf6","#06b6d4","#14b8a6","#84cc16"],
  ocean: ["#06b6d4","#0ea5e9","#3b82f6","#6366f1","#8b5cf6","#a855f7","#10b981","#14b8a6"],
  candy: ["#f43f5e","#ec4899","#a855f7","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6"],
};
const FONTS = ["Inter","Poppins","Montserrat","Raleway","Nunito"];
const DURATION_OPTS = [{label:"Fast (2s)",v:2},{label:"Normal (4s)",v:4},{label:"Slow (6s)",v:6}];
const DEFAULT_NAMES = ["Alice","Bob","Charlie","Diana","Ethan","Fiona","George","Hannah"];

// ─── Confetti ────────────────────────────────────────────────────────────────
function useConfetti(active) {
  const cvs = useRef(null);
  const anim = useRef(null);
  const parts = useRef([]);

  useEffect(() => {
    if (!active || !cvs.current) return;
    const c = cvs.current, ctx = c.getContext("2d");
    c.width = window.innerWidth; c.height = window.innerHeight;
    parts.current = Array.from({length:160}, () => ({
      x: Math.random()*c.width, y: -20,
      vx: (Math.random()-0.5)*6, vy: Math.random()*4+2,
      color: ["#a855f7","#ec4899","#06b6d4","#f59e0b","#10b981","#f43f5e"][Math.floor(Math.random()*6)],
      r: Math.random()*6+3, rot: Math.random()*360, spin: (Math.random()-0.5)*8
    }));
    let alive = true;
    const tick = () => {
      if (!alive) return;
      ctx.clearRect(0,0,c.width,c.height);
      parts.current.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.rot+=p.spin;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle=p.color; ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);
        ctx.restore();
      });
      parts.current = parts.current.filter(p=>p.y<c.height+20);
      if (parts.current.length) anim.current = requestAnimationFrame(tick);
      else ctx.clearRect(0,0,c.width,c.height);
    };
    anim.current = requestAnimationFrame(tick);
    return () => { alive=false; cancelAnimationFrame(anim.current); };
  }, [active]);

  return cvs;
}

// ─── Wheel Canvas ────────────────────────────────────────────────────────────
function WheelCanvas({ names, spinning, rotation, theme }) {
  const cvs = useRef(null);
  const colors = THEMES[theme] || THEMES.neon;

  useEffect(() => {
    const c = cvs.current;
    if (!c || !names.length) return;
    const ctx = c.getContext("2d");
    const W = c.width, H = c.height;
    const cx = W/2, cy = H/2, r = Math.min(W,H)/2 - 8;
    ctx.clearRect(0,0,W,H);

    const n = names.length;
    const slice = (2*Math.PI)/n;

    // Glow when spinning
    if (spinning) {
      ctx.save();
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 32;
      ctx.beginPath(); ctx.arc(cx,cy,r+4,0,2*Math.PI);
      ctx.strokeStyle = "#a855f7"; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }

    names.forEach((name, i) => {
      const start = rotation + i*slice - Math.PI/2;
      const end = start + slice;
      const color = colors[i % colors.length];

      // Slice
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,start,end);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Subtle separator
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,start,end);
      ctx.closePath();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      const mid = start + slice/2;
      const maxLen = name.length;
      const fs = Math.max(9, Math.min(18, Math.floor(r*0.18 - maxLen*0.5)));
      ctx.save();
      ctx.translate(cx + Math.cos(mid)*r*0.65, cy + Math.sin(mid)*r*0.65);
      ctx.rotate(mid + Math.PI/2);
      ctx.fillStyle = "white";
      ctx.font = `bold ${fs}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const disp = name.length > 14 ? name.slice(0,12)+"…" : name;
      ctx.fillText(disp, 0, 0);
      ctx.restore();
    });

    // Center circle
    const cg = ctx.createRadialGradient(cx,cy,0,cx,cy,32);
    cg.addColorStop(0,"#fff");
    cg.addColorStop(1,"#e2e8f0");
    ctx.beginPath(); ctx.arc(cx,cy,30,0,2*Math.PI);
    ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth=2; ctx.stroke();

    // Center logo
    ctx.fillStyle = "#7c3aed";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("SPIN", cx, cy);

  }, [names, spinning, rotation, theme]);

  return (
    <canvas
      ref={cvs}
      width={420} height={420}
      style={{width:"100%",height:"100%",maxWidth:420,maxHeight:420}}
    />
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function Spinify() {
  const [names, setNames] = useState(DEFAULT_NAMES);
  const [input, setInput] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [tab, setTab] = useState("wheel"); // wheel | names
  const [confirmClear, setConfirmClear] = useState(false);
  const [confettiOn, setConfettiOn] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [removeWinner, setRemoveWinner] = useState(true);

  // Settings
  const [theme, setTheme] = useState("neon");
  const [duration, setDuration] = useState(4);
  const [sound, setSound] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [confettiEnabled, setConfettiEnabled] = useState(true);
  const [spinCount, setSpinCount] = useState(0);
  const [multiMode, setMultiMode] = useState(1);

  const rotRef = useRef(0);
  const animRef = useRef(null);
  const confettiCvs = useConfetti(confettiOn);
  const inputRef = useRef(null);

  const dupes = useMemo(() => {
    const seen = {}, d = new Set();
    names.forEach(n => { if (seen[n]) d.add(n); else seen[n]=1; });
    return d;
  }, [names]);

  // Tick sound via Web Audio
  const audioCtx = useRef(null);
  const lastTick = useRef(0);
  const tick = useCallback((t) => {
    if (!sound) return;
    if (t - lastTick.current < 80) return;
    lastTick.current = t;
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext||window.webkitAudioContext)();
      const o = audioCtx.current.createOscillator();
      const g = audioCtx.current.createGain();
      o.connect(g); g.connect(audioCtx.current.destination);
      o.frequency.value = 440 + Math.random()*200;
      g.gain.setValueAtTime(0.15, audioCtx.current.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime+0.05);
      o.start(); o.stop(audioCtx.current.currentTime+0.05);
    } catch(e){}
  }, [sound]);

  const playWin = useCallback(() => {
    if (!sound) return;
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext||window.webkitAudioContext)();
      const notes = [523,659,784,1047];
      notes.forEach((f,i) => {
        const o = audioCtx.current.createOscillator();
        const g = audioCtx.current.createGain();
        o.connect(g); g.connect(audioCtx.current.destination);
        o.frequency.value = f;
        const t = audioCtx.current.currentTime + i*0.12;
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t+0.3);
        o.start(t); o.stop(t+0.35);
      });
    } catch(e){}
  }, [sound]);

  const spin = useCallback(() => {
    if (spinning || names.length < 2) return;
    setSpinning(true);

    const n = names.length;
    const slice = (2*Math.PI)/n;
    const winIdx = Math.floor(Math.random()*n);
    const extraSpins = (duration===2?4:duration===4?8:12) * 2 * Math.PI;
    // Target: pointer at top (0) lands on winIdx
    const targetRot = extraSpins + (2*Math.PI - winIdx*slice - slice/2);
    const startRot = rotRef.current;
    const startTime = performance.now();
    const totalMs = duration * 1000;

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed/totalMs, 1);
      // Ease out cubic + extra punch
      const ease = 1 - Math.pow(1-t, 4);
      const cur = startRot + targetRot * ease;
      rotRef.current = cur;
      tick(now);
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        rotRef.current = cur;
        setSpinning(false);
        setSpinCount(s=>s+1);

        // Determine winner(s)
        const finalRot = cur % (2*Math.PI);
        const angle = ((-finalRot % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);
        const idx = Math.floor(angle / slice) % n;
        const w = names[idx];
        setWinner(w);
        setShowWinner(true);
        playWin();
        if (confettiEnabled) { setConfettiOn(false); setTimeout(()=>setConfettiOn(true),50); }
        const entry = { name: w, time: new Date().toLocaleTimeString(), spin: spinCount+1 };
        setHistory(h=>[entry,...h.slice(0,49)]);
        if (removeWinner) setNames(ns=>ns.filter((_,i)=>i!==idx));
      }
      setRotation(rotRef.current);
    };
    animRef.current = requestAnimationFrame(animate);
  }, [spinning, names, duration, tick, playWin, confettiEnabled, removeWinner, spinCount]);

  // Keyboard
  useEffect(() => {
    const h = (e) => {
      if (e.code==="Space" && e.target===document.body) { e.preventDefault(); spin(); }
    };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  }, [spin]);

  const addName = () => {
    const v = input.trim();
    if (!v) return;
    setNames(n=>[...n,v]);
    setInput("");
    inputRef.current?.focus();
  };

  const addBulk = () => {
    const ns = bulkText.split("\n").map(s=>s.trim()).filter(Boolean);
    if (ns.length) setNames(n=>[...n,...ns]);
    setBulkText(""); setShowBulk(false);
  };

  const shuffle = () => setNames(ns=>[...ns].sort(()=>Math.random()-0.5));

  const bg = darkMode
    ? "linear-gradient(135deg,#0f0c29,#1a0533,#0d1b2a)"
    : "linear-gradient(135deg,#e0e7ff,#fdf2f8,#e0f2fe)";

  const cardBg = darkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)";
  const cardBorder = darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)";
  const txtPrimary = darkMode ? "#f1f5f9" : "#1e293b";
  const txtSecondary = darkMode ? "#94a3b8" : "#64748b";
  const inputBg = darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";

  const glass = {
    background: cardBg,
    border: cardBorder,
    borderRadius: 20,
    backdropFilter: "blur(12px)",
  };

  return (
    <div style={{minHeight:"100vh",background:bg,fontFamily:`${fontFamily},sans-serif`,color:txtPrimary,position:"relative",overflow:"hidden"}}>
      {/* Confetti overlay */}
      <canvas ref={confettiCvs} style={{position:"fixed",top:0,left:0,pointerEvents:"none",zIndex:9999,width:"100%",height:"100%"}}/>

      {/* Animated blobs */}
      <div style={{position:"fixed",top:"-20%",left:"-10%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.15),transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:"-20%",right:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(6,182,212,0.12),transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",top:"40%",left:"40%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(236,72,153,0.08),transparent 70%)",pointerEvents:"none",zIndex:0}}/>

      {/* Navbar */}
      <nav style={{...glass,borderRadius:0,borderLeft:"none",borderRight:"none",borderTop:"none",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#a855f7,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎯</div>
          <span style={{fontWeight:700,fontSize:22,background:"linear-gradient(90deg,#a855f7,#ec4899,#06b6d4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Spinify</span>
        </div>
        <div style={{display:"flex",gap:10}}>
          <Btn dark={darkMode} icon="🕐" onClick={()=>{setShowHistory(true);setShowSettings(false);}} label="History" badge={history.length||null}/>
          <Btn dark={darkMode} icon="⚙️" onClick={()=>{setShowSettings(true);setShowHistory(false);}} label="Settings"/>
        </div>
      </nav>

      {/* Main */}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"20px 16px",position:"relative",zIndex:1}}>

        {/* Tab selector for mobile */}
        <div style={{display:"flex",gap:8,marginBottom:20,background:cardBg,border:cardBorder,borderRadius:50,padding:4,backdropFilter:"blur(12px)"}}>
          {["wheel","names"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px 0",border:"none",borderRadius:46,cursor:"pointer",fontWeight:600,fontSize:14,transition:"all 0.2s",background:tab===t?"linear-gradient(135deg,#a855f7,#06b6d4)":"transparent",color:tab===t?"#fff":txtSecondary}}>
              {t==="wheel"?"🎡 Wheel":"👥 Names"}
            </button>
          ))}
        </div>

        <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>

          {/* Wheel Panel */}
          <div style={{flex:"1 1 380px",display:tab==="names"?"none":"flex",flexDirection:"column",gap:16,minWidth:300}}>
            <div style={{...glass,padding:20,display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
              <div style={{display:"flex",gap:12,width:"100%",justifyContent:"center"}}>
                <StatChip dark={darkMode} label="Participants" value={names.length}/>
                <StatChip dark={darkMode} label="Spins" value={spinCount}/>
                <StatChip dark={darkMode} label="Winners" value={history.length}/>
              </div>

              {/* Wheel + Pointer */}
              <div style={{position:"relative",width:"100%",maxWidth:420,aspectRatio:"1"}}>
                {/* Pointer */}
                <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",zIndex:10,filter:"drop-shadow(0 0 8px #a855f7)"}}>
                  <svg width="24" height="36" viewBox="0 0 24 36">
                    <polygon points="12,36 0,0 24,0" fill="#a855f7"/>
                    <polygon points="12,36 2,4 22,4" fill="#c084fc"/>
                  </svg>
                </div>
                {names.length < 2 ? (
                  <div style={{width:"100%",aspectRatio:"1",borderRadius:"50%",background:"rgba(168,85,247,0.1)",border:"2px dashed rgba(168,85,247,0.4)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,color:txtSecondary}}>
                    <span style={{fontSize:40}}>🎡</span>
                    <span style={{fontSize:14}}>Add 2+ names</span>
                  </div>
                ) : (
                  <WheelCanvas names={names} spinning={spinning} rotation={rotation} theme={theme}/>
                )}
                {/* Spin center overlay */}
                {names.length >= 2 && (
                  <button onClick={spin} disabled={spinning} style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:56,height:56,borderRadius:"50%",border:"3px solid #fff",background:spinning?"linear-gradient(135deg,#7c3aed,#5b21b6)":"linear-gradient(135deg,#a855f7,#7c3aed)",color:"#fff",fontWeight:700,fontSize:11,cursor:spinning?"not-allowed":"pointer",boxShadow:spinning?"0 0 24px #a855f7":"0 0 12px rgba(168,85,247,0.5)",transition:"all 0.2s"}}>
                    {spinning?"…":"SPIN"}
                  </button>
                )}
              </div>

              {/* Spin CTA */}
              <button onClick={spin} disabled={spinning||names.length<2} style={{width:"100%",padding:"14px 0",borderRadius:14,border:"none",background:spinning||names.length<2?"#334155":"linear-gradient(135deg,#a855f7,#ec4899,#06b6d4)",color:"#fff",fontWeight:700,fontSize:17,cursor:spinning||names.length<2?"not-allowed":"pointer",letterSpacing:1,boxShadow:spinning||names.length<2?"none":"0 0 24px rgba(168,85,247,0.4)",transition:"all 0.3s"}}>
                {spinning ? "⏳ Spinning…" : "🎯 SPIN THE WHEEL"}
              </button>
              <p style={{color:txtSecondary,fontSize:12,margin:0}}>Press <kbd style={{background:"rgba(255,255,255,0.1)",padding:"2px 6px",borderRadius:4}}>Space</kbd> to spin</p>

              {/* Options */}
              <div style={{width:"100%",display:"flex",gap:12,flexWrap:"wrap"}}>
                <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:txtSecondary,cursor:"pointer"}}>
                  <input type="checkbox" checked={removeWinner} onChange={e=>setRemoveWinner(e.target.checked)} style={{accentColor:"#a855f7"}}/>
                  Remove winner after spin
                </label>
              </div>
            </div>

            {/* Last winner strip */}
            {history[0] && (
              <div style={{...glass,padding:"12px 18px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:24}}>🏆</span>
                <div>
                  <div style={{fontSize:11,color:txtSecondary}}>Last winner</div>
                  <div style={{fontWeight:700,fontSize:18,background:"linear-gradient(90deg,#a855f7,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{history[0].name}</div>
                </div>
                <div style={{marginLeft:"auto",fontSize:11,color:txtSecondary}}>#{history[0].spin} · {history[0].time}</div>
              </div>
            )}
          </div>

          {/* Names Panel */}
          <div style={{flex:"1 1 300px",display:tab==="wheel"?"":"flex",flexDirection:"column",gap:14,minWidth:260}}>

            {/* Input row */}
            <div style={{...glass,padding:16}}>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addName();}}}
                  placeholder="Add a name…"
                  style={{flex:1,padding:"10px 14px",borderRadius:10,border:cardBorder,background:inputBg,color:txtPrimary,fontSize:14,outline:"none"}}
                />
                <button onClick={addName} style={{padding:"10px 16px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#a855f7,#7c3aed)",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}}>+</button>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <SmBtn dark={darkMode} onClick={()=>setShowBulk(true)}>📋 Bulk Add</SmBtn>
                <SmBtn dark={darkMode} onClick={shuffle}>🔀 Shuffle</SmBtn>
                <SmBtn dark={darkMode} onClick={()=>setConfirmClear(true)} danger>🗑 Clear All</SmBtn>
              </div>
              <div style={{marginTop:10,fontSize:12,color:txtSecondary}}>{names.length} participants {dupes.size>0&&<span style={{color:"#f59e0b"}}>· {dupes.size} duplicate{dupes.size>1?"s":""}</span>}</div>
            </div>

            {/* Name list */}
            <div style={{...glass,padding:"8px 4px",maxHeight:340,overflowY:"auto"}}>
              {names.length===0 ? (
                <div style={{padding:32,textAlign:"center",color:txtSecondary}}>
                  <div style={{fontSize:36,marginBottom:8}}>🎭</div>
                  <div>No participants yet</div>
                  <div style={{fontSize:12,marginTop:4}}>Add names above to get started</div>
                </div>
              ) : names.map((name,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,marginBottom:2,background:editIdx===i?"rgba(168,85,247,0.1)":"transparent",transition:"background 0.15s",position:"relative"}}>
                  <div style={{width:26,height:26,borderRadius:8,background:`linear-gradient(135deg,${THEMES[theme][i%8]},${THEMES[theme][(i+2)%8]})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700,flexShrink:0}}>{i+1}</div>
                  {editIdx===i ? (
                    <>
                      <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter"){const v=editVal.trim();if(v)setNames(ns=>ns.map((n,j)=>j===i?v:n));setEditIdx(null);}if(e.key==="Escape")setEditIdx(null);}}
                        style={{flex:1,background:"transparent",border:"none",borderBottom:`1px solid #a855f7`,color:txtPrimary,fontSize:14,outline:"none",padding:"2px 0"}}/>
                      <button onClick={()=>{const v=editVal.trim();if(v)setNames(ns=>ns.map((n,j)=>j===i?v:n));setEditIdx(null);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#10b981"}}>✓</button>
                    </>
                  ) : (
                    <>
                      <span style={{flex:1,fontSize:14,color:dupes.has(name)?"#f59e0b":txtPrimary,fontWeight:dupes.has(name)?600:400}}>{name}{dupes.has(name)&&<span style={{fontSize:10,marginLeft:4,color:"#f59e0b"}}>dup</span>}</span>
                      <button onClick={()=>{setEditIdx(i);setEditVal(name);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:txtSecondary,padding:"2px 4px",opacity:0.6}}>✎</button>
                      <button onClick={()=>setNames(ns=>ns.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#f43f5e",padding:"2px 4px",opacity:0.6}}>×</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Modal */}
      {showWinner && winner && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(4px)"}} onClick={()=>setShowWinner(false)}>
          <div onClick={e=>e.stopPropagation()} style={{...glass,padding:"40px 32px",textAlign:"center",maxWidth:400,width:"90%",animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)"}}>
            <div style={{fontSize:64,marginBottom:8,animation:"bounce 0.6s ease infinite alternate"}}>🎉</div>
            <div style={{fontSize:14,color:txtSecondary,marginBottom:4,letterSpacing:2,textTransform:"uppercase"}}>Winner</div>
            <div style={{fontSize:34,fontWeight:800,background:"linear-gradient(90deg,#a855f7,#ec4899,#06b6d4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:20,lineHeight:1.2,wordBreak:"break-word"}}>{winner}</div>
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              <button onClick={()=>setShowWinner(false)} style={{padding:"10px 28px",borderRadius:50,border:"none",background:"linear-gradient(135deg,#a855f7,#ec4899)",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:15}}>🎊 Awesome!</button>
              <button onClick={()=>{setShowWinner(false);setTimeout(spin,200);}} style={{padding:"10px 20px",borderRadius:50,border:cardBorder,background:"transparent",color:txtPrimary,fontWeight:600,cursor:"pointer",fontSize:14}}>Spin Again</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <ModalWrap glass={glass} title="🕐 Spin History" txtPrimary={txtPrimary} txtSecondary={txtSecondary} onClose={()=>setShowHistory(false)}>
          {history.length===0 ? <div style={{textAlign:"center",color:txtSecondary,padding:32}}>No history yet. Spin the wheel!</div> : (
            <>
              <button onClick={()=>setHistory([])} style={{marginBottom:12,padding:"6px 16px",borderRadius:8,border:`1px solid #f43f5e`,background:"transparent",color:"#f43f5e",cursor:"pointer",fontSize:13}}>Clear History</button>
              <div style={{maxHeight:320,overflowY:"auto"}}>
                {history.map((h,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid rgba(255,255,255,0.06)`}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:20}}>🏆</span>
                      <div>
                        <div style={{fontWeight:600,fontSize:15,color:txtPrimary}}>{h.name}</div>
                        <div style={{fontSize:11,color:txtSecondary}}>Spin #{h.spin}</div>
                      </div>
                    </div>
                    <div style={{fontSize:12,color:txtSecondary}}>{h.time}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </ModalWrap>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <ModalWrap glass={glass} title="⚙️ Settings" txtPrimary={txtPrimary} txtSecondary={txtSecondary} onClose={()=>setShowSettings(false)}>
          <SettingRow label="🌙 Dark Mode" txtSecondary={txtSecondary}>
            <Toggle on={darkMode} onChange={setDarkMode}/>
          </SettingRow>
          <SettingRow label="🎊 Confetti" txtSecondary={txtSecondary}>
            <Toggle on={confettiEnabled} onChange={setConfettiEnabled}/>
          </SettingRow>
          <SettingRow label="🔊 Sound" txtSecondary={txtSecondary}>
            <Toggle on={sound} onChange={setSound}/>
          </SettingRow>
          <SettingRow label="🎨 Color Theme" txtSecondary={txtSecondary}>
            <select value={theme} onChange={e=>setTheme(e.target.value)} style={{padding:"6px 10px",borderRadius:8,border:cardBorder,background:inputBg,color:txtPrimary,fontSize:13}}>
              {Object.keys(THEMES).map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </SettingRow>
          <SettingRow label="⏱ Spin Duration" txtSecondary={txtSecondary}>
            <select value={duration} onChange={e=>setDuration(Number(e.target.value))} style={{padding:"6px 10px",borderRadius:8,border:cardBorder,background:inputBg,color:txtPrimary,fontSize:13}}>
              {DURATION_OPTS.map(d=><option key={d.v} value={d.v}>{d.label}</option>)}
            </select>
          </SettingRow>
          <SettingRow label="🔤 Font" txtSecondary={txtSecondary}>
            <select value={fontFamily} onChange={e=>setFontFamily(e.target.value)} style={{padding:"6px 10px",borderRadius:8,border:cardBorder,background:inputBg,color:txtPrimary,fontSize:13}}>
              {FONTS.map(f=><option key={f} value={f}>{f}</option>)}
            </select>
          </SettingRow>
        </ModalWrap>
      )}

      {/* Bulk Add Modal */}
      {showBulk && (
        <ModalWrap glass={glass} title="📋 Bulk Add Names" txtPrimary={txtPrimary} txtSecondary={txtSecondary} onClose={()=>setShowBulk(false)}>
          <p style={{color:txtSecondary,fontSize:13,marginBottom:8}}>Paste names separated by line breaks</p>
          <textarea value={bulkText} onChange={e=>setBulkText(e.target.value)} rows={8} placeholder={"Alice\nBob\nCharlie\n..."} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:cardBorder,background:inputBg,color:txtPrimary,fontSize:14,resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
          <div style={{display:"flex",gap:10,marginTop:12}}>
            <button onClick={addBulk} style={{flex:1,padding:"10px 0",borderRadius:10,border:"none",background:"linear-gradient(135deg,#a855f7,#06b6d4)",color:"#fff",fontWeight:700,cursor:"pointer"}}>Add {bulkText.split("\n").filter(s=>s.trim()).length} Names</button>
            <button onClick={()=>setShowBulk(false)} style={{padding:"10px 20px",borderRadius:10,border:cardBorder,background:"transparent",color:txtPrimary,cursor:"pointer"}}>Cancel</button>
          </div>
        </ModalWrap>
      )}

      {/* Confirm Clear */}
      {confirmClear && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(4px)"}}>
          <div style={{...glass,padding:"32px 28px",maxWidth:360,width:"90%",textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
            <div style={{fontWeight:700,fontSize:18,marginBottom:8,color:txtPrimary}}>Clear all names?</div>
            <div style={{color:txtSecondary,fontSize:14,marginBottom:20}}>This will remove all {names.length} participants.</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>{setNames([]);setConfirmClear(false);}} style={{padding:"10px 24px",borderRadius:10,border:"none",background:"#f43f5e",color:"#fff",fontWeight:700,cursor:"pointer"}}>Clear All</button>
              <button onClick={()=>setConfirmClear(false)} style={{padding:"10px 24px",borderRadius:10,border:cardBorder,background:"transparent",color:txtPrimary,cursor:"pointer"}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-10px); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.4); border-radius: 2px; }
        @media (min-width:640px) {
          [data-panel="names"] { display: flex !important; }
          [data-tab-bar] { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Btn({dark, icon, onClick, label, badge}) {
  return (
    <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:10,border:`1px solid rgba(255,255,255,${dark?0.12:0.3})`,background:`rgba(255,255,255,${dark?0.07:0.5})`,color:dark?"#f1f5f9":"#334155",cursor:"pointer",fontSize:13,fontWeight:500,position:"relative"}}>
      {icon} {label}
      {badge>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#a855f7",color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 5px",minWidth:16,textAlign:"center"}}>{badge}</span>}
    </button>
  );
}

function SmBtn({dark, onClick, children, danger}) {
  return (
    <button onClick={onClick} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${danger?"rgba(244,63,94,0.4)":dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"}`,background:danger?"rgba(244,63,94,0.1)":dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)",color:danger?"#f43f5e":dark?"#cbd5e1":"#475569",cursor:"pointer",fontSize:13}}>
      {children}
    </button>
  );
}

function StatChip({dark, label, value}) {
  return (
    <div style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:10,background:dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)",border:`1px solid rgba(255,255,255,${dark?0.08:0.3})`}}>
      <div style={{fontSize:18,fontWeight:700,color:"#a855f7"}}>{value}</div>
      <div style={{fontSize:10,color:dark?"#94a3b8":"#64748b"}}>{label}</div>
    </div>
  );
}

function Toggle({on, onChange}) {
  return (
    <div onClick={()=>onChange(!on)} style={{width:44,height:24,borderRadius:12,background:on?"linear-gradient(135deg,#a855f7,#06b6d4)":"rgba(255,255,255,0.15)",cursor:"pointer",position:"relative",transition:"all 0.2s",flexShrink:0}}>
      <div style={{position:"absolute",top:2,left:on?22:2,width:20,height:20,borderRadius:10,background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}/>
    </div>
  );
}

function SettingRow({label, txtSecondary, children}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
      <span style={{fontSize:14,color:txtSecondary}}>{label}</span>
      {children}
    </div>
  );
}

function ModalWrap({glass, title, txtPrimary, txtSecondary, onClose, children}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(4px)",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{...glass,padding:"28px 24px",maxWidth:480,width:"100%",maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 style={{margin:0,fontSize:20,fontWeight:700,color:txtPrimary}}>{title}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:txtSecondary,lineHeight:1}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
