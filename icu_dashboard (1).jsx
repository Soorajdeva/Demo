import React, { useState, useEffect, useRef, useMemo } from "react";
import { Activity, Heart, Wind, Gauge, Droplet, AlertTriangle, Bell, BellOff, Check, X, Send, Mic, Paperclip, ChevronRight, ChevronDown, Wifi, Clock, User, Stethoscope, TrendingUp, TrendingDown, Minus, Sparkles, ShieldAlert, ShieldCheck, Eye } from "lucide-react";

/* ---------------------------------------------------------
   DESIGN TOKENS
   bg: #0B1220 / #111827 / #1E293B
   primary: #2563EB / #3B82F6   accent: #06B6D4
   success: #22C55E  warning: #F59E0B  critical: #EF4444
--------------------------------------------------------- */

const STATUS = {
  stable: { color: "#22C55E", glow: "rgba(34,197,94,0.35)", label: "Stable" },
  warning: { color: "#F59E0B", glow: "rgba(245,158,11,0.35)", label: "Warning" },
  critical: { color: "#EF4444", glow: "rgba(239,68,68,0.4)", label: "Critical" },
};

const PATIENTS_SEED = [
  { id: "TN-ICU-2025-001", name: "Arul Kumar", age: 58, gender: "Male", bed: "ICU-01", mode: "PRVC", status: "stable" },
  { id: "TN-ICU-2025-002", name: "Lakshmi Priya", age: 46, gender: "Female", bed: "ICU-02", mode: "SIMV", status: "warning" },
  { id: "TN-ICU-2025-003", name: "Karthikeyan S", age: 65, gender: "Male", bed: "ICU-03", mode: "P-ACV", status: "critical" },
  { id: "TN-ICU-2025-004", name: "Meenakshi Devi", age: 54, gender: "Female", bed: "ICU-04", mode: "CPAP", status: "stable" },
  { id: "TN-ICU-2025-005", name: "Praveen Kumar", age: 39, gender: "Male", bed: "ICU-05", mode: "V-ACV", status: "stable" },
  { id: "TN-ICU-2025-006", name: "Nandhini R", age: 28, gender: "Female", bed: "ICU-06", mode: "PRVC", status: "warning" },
  { id: "TN-ICU-2025-007", name: "Murugan P", age: 71, gender: "Male", bed: "ICU-07", mode: "SIMV", status: "stable" },
  { id: "TN-ICU-2025-008", name: "Kavitha Selvi", age: 50, gender: "Female", bed: "ICU-08", mode: "CPAP", status: "stable" },
];

function vitalsFor(status) {
  const base = status === "critical" ? { spo2: 86, hr: 128, rr: 32 } : status === "warning" ? { spo2: 92, hr: 104, rr: 24 } : { spo2: 97, hr: 78, rr: 16 };
  return {
    spo2: base.spo2 + Math.round(Math.random() * 2 - 1),
    hr: base.hr + Math.round(Math.random() * 4 - 2),
    rr: base.rr + Math.round(Math.random() * 2 - 1),
    fio2: status === "critical" ? 65 : status === "warning" ? 45 : 32,
    peep: status === "critical" ? 10 : 5,
    tidalVolume: 420 + Math.round(Math.random() * 20 - 10),
    minuteVent: 6.2 + (Math.random() * 0.6 - 0.3),
    airwayPressure: status === "critical" ? 28 : 18,
    inspPressure: status === "critical" ? 22 : 14,
    ieRatio: "1:2",
  };
}

function sparkPath(seed, w = 100, h = 28, points = 16) {
  let v = seed;
  const pts = [];
  for (let i = 0; i < points; i++) {
    v += (Math.sin(i * 0.7 + seed) * 4 + (Math.random() - 0.5) * 3);
    pts.push(v);
  }
  const min = Math.min(...pts), max = Math.max(...pts) || 1;
  return pts.map((p, i) => {
    const x = (i / (points - 1)) * w;
    const y = h - ((p - min) / (max - min || 1)) * h;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function Sparkline({ color, seed }) {
  const d = useMemo(() => sparkPath(seed), [seed]);
  return (
    <svg viewBox="0 0 100 28" width="100%" height="28" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}

/* ---------------- WAVEFORM CANVAS ---------------- */
function WaveformCanvas({ kind, color, height = 110 }) {
  const ref = useRef(null);
  const offsetRef = useRef(0);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const draw = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      ctx.clearRect(0, 0, w, h);

      // grid
      ctx.strokeStyle = "rgba(148,163,184,0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // wave
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      const offset = offsetRef.current;
      for (let x = 0; x <= w; x += 2) {
        const t = (x + offset) * 0.04;
        let y;
        if (kind === "pressure") y = h / 2 - Math.sin(t) * (h * 0.28) * (Math.sin(t * 0.3) > 0 ? 1 : 0.4) - Math.max(0, Math.sin(t)) * 6;
        else if (kind === "flow") y = h / 2 - Math.sin(t * 1.1) * (h * 0.32);
        else y = h / 2 - (Math.sin(t * 0.6) * 0.5 + 0.5) * (h * 0.5) + h * 0.15;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      offsetRef.current += 2.2;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [kind, color]);
  return <canvas ref={ref} style={{ width: "100%", height, display: "block" }} />;
}

/* ---------------- METRIC CARD ---------------- */
function MetricCard({ icon: Icon, label, value, unit, color, trend, seed }) {
  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(30,41,59,0.7), rgba(17,24,39,0.7))",
      border: "1px solid rgba(148,163,184,0.12)",
      borderRadius: 18, padding: "16px 18px", position: "relative", overflow: "hidden",
      boxShadow: `0 0 0 1px rgba(255,255,255,0.02), 0 8px 24px -8px ${color}22`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#94A3B8", fontSize: 12.5, letterSpacing: 0.3 }}>
          <Icon size={15} style={{ color }} />
          {label}
        </div>
        {trend === "up" ? <TrendingUp size={14} color="#F59E0B" /> : trend === "down" ? <TrendingDown size={14} color="#06B6D4" /> : <Minus size={14} color="#64748B" />}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 30, fontWeight: 600, color: "#F1F5F9", fontVariantNumeric: "tabular-nums", letterSpacing: -0.5 }}>{value}</span>
        <span style={{ fontSize: 12.5, color: "#64748B" }}>{unit}</span>
      </div>
      <Sparkline color={color} seed={seed} />
    </div>
  );
}

function Glow({ color }) {
  return <div style={{ position: "absolute", inset: -1, borderRadius: 22, boxShadow: `0 0 0 1px ${color}55, 0 0 28px ${color}33`, pointerEvents: "none" }} />;
}

function StatusBadge({ status }) {
  const s = STATUS[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999,
      background: `${s.color}1A`, color: s.color, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3, border: `1px solid ${s.color}44`
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
      {s.label}
    </span>
  );
}

/* ---------------- PATIENT SELECTION ---------------- */
function PatientCard({ p, vitals, onOpen }) {
  const s = STATUS[p.status];
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onOpen(p.id)}
      style={{
        position: "relative", cursor: "pointer", borderRadius: 20, padding: 20,
        background: "linear-gradient(165deg, rgba(30,41,59,0.85), rgba(11,18,32,0.9))",
        border: "1px solid rgba(148,163,184,0.1)",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hover ? `0 16px 40px -12px ${s.glow}, 0 0 0 1px ${s.color}55` : `0 4px 16px -8px ${s.glow}`,
        transition: "all 0.25s cubic-bezier(.2,.8,.2,1)",
      }}
    >
      {hover && <Glow color={s.color} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 16.5, fontWeight: 600, color: "#F1F5F9", letterSpacing: -0.2 }}>{p.name}</div>
          <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>{p.age}y · {p.gender} · {p.id}</div>
        </div>
        <StatusBadge status={p.status} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 11.5, background: "rgba(59,130,246,0.12)", color: "#60A5FA", padding: "3px 9px", borderRadius: 8, border: "1px solid rgba(59,130,246,0.25)" }}>{p.bed}</span>
        <span style={{ fontSize: 11.5, background: "rgba(6,182,212,0.1)", color: "#22D3EE", padding: "3px 9px", borderRadius: 8, border: "1px solid rgba(6,182,212,0.2)" }}>{p.mode}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[["SpO₂", vitals.spo2, "%"], ["HR", vitals.hr, "bpm"], ["RR", vitals.rr, "/min"]].map(([l, v, u]) => (
          <div key={l} style={{ background: "rgba(11,18,32,0.5)", borderRadius: 12, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "#64748B", marginBottom: 2 }}>{l}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#E2E8F0" }}>{v}<span style={{ fontSize: 10, color: "#64748B", marginLeft: 2 }}>{u}</span></div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#475569" }}>Updated 12s ago</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "#60A5FA", fontWeight: 500 }}>
          Open <ChevronRight size={14} />
        </span>
      </div>
    </div>
  );
}

/* ---------------- AI PANEL ---------------- */
function AIPanel({ status }) {
  const cfg = {
    stable: { risk: "Stable", color: "#22C55E", emoji: "🟢", conf: 96, summary: "Patient vitals trending within normal range. Ventilation parameters are well-tolerated with stable gas exchange.", actions: ["Continue current PRVC settings", "Routine ABG in 4 hours", "No immediate intervention required"] },
    warning: { risk: "Observe", color: "#F59E0B", emoji: "🟡", conf: 88, summary: "Mild downward trend in SpO₂ with rising respiratory rate over the last 30 minutes. Recommend closer observation.", actions: ["Increase monitoring frequency", "Consider FiO₂ adjustment +5%", "Notify attending physician"] },
    critical: { risk: "Immediate Attention", color: "#EF4444", emoji: "🔴", conf: 91, summary: "Significant desaturation with tachycardia and elevated airway pressure detected. Pattern consistent with possible airway obstruction.", actions: ["Alert ICU physician immediately", "Verify ETT placement & patency", "Prepare for FiO₂ escalation to 100%"] },
  }[status];

  return (
    <div style={{ borderRadius: 20, padding: 20, background: "linear-gradient(160deg, rgba(37,99,235,0.1), rgba(17,24,39,0.7))", border: `1px solid ${cfg.color}33`, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg,#2563EB,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={15} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#F1F5F9" }}>AI Clinical Assistant</div>
          <div style={{ fontSize: 11, color: "#64748B" }}>Confidence {cfg.conf}%</div>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: cfg.color, display: "flex", alignItems: "center", gap: 5 }}>
          {cfg.emoji} {cfg.risk}
        </span>
      </div>
      <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.55, marginBottom: 14 }}>{cfg.summary}</p>
      <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 8, fontWeight: 600, letterSpacing: 0.3 }}>SUGGESTED ACTIONS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {cfg.actions.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: "#E2E8F0" }}>
            <Check size={13} color={cfg.color} style={{ marginTop: 2, flexShrink: 0 }} />
            {a}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- ALERT TIMELINE ---------------- */
function AlertTimeline({ status }) {
  const [expanded, setExpanded] = useState(null);
  const alerts = [
    { id: 1, time: "11:42:08", priority: "critical", title: "SpO₂ dropped below 88%", detail: "Desaturation event lasting 45s, resolved after FiO₂ increase to 60%.", icon: AlertTriangle },
    { id: 2, time: "11:30:55", priority: "warning", title: "Heart rate elevated", detail: "HR sustained above 110 bpm for 6 minutes. Patient remained hemodynamically stable.", icon: Heart },
    { id: 3, time: "11:02:14", priority: "info", title: "Ventilator mode changed to PRVC", detail: "Mode switched from SIMV per attending physician order.", icon: Wind },
    { id: 4, time: "10:45:01", priority: "stable", title: "Vitals within normal parameters", detail: "All metrics returned to baseline range.", icon: ShieldCheck },
  ];
  const colorFor = (p) => p === "critical" ? "#EF4444" : p === "warning" ? "#F59E0B" : p === "stable" ? "#22C55E" : "#3B82F6";
  return (
    <div style={{ borderRadius: 20, padding: 18, background: "rgba(17,24,39,0.7)", border: "1px solid rgba(148,163,184,0.1)" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#F1F5F9", marginBottom: 14 }}>Alert Timeline</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {alerts.map((a, idx) => {
          const c = colorFor(a.priority);
          const open = expanded === a.id;
          return (
            <div key={a.id} style={{ display: "flex", gap: 12, position: "relative" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: 999, background: `${c}1A`, border: `1px solid ${c}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <a.icon size={13} color={c} />
                </div>
                {idx < alerts.length - 1 && <div style={{ width: 1, flex: 1, background: "rgba(148,163,184,0.15)", minHeight: 16 }} />}
              </div>
              <div onClick={() => setExpanded(open ? null : a.id)} style={{ cursor: "pointer", paddingBottom: 16, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: "#E2E8F0" }}>{a.title}</span>
                  {open ? <ChevronDown size={13} color="#64748B" /> : <ChevronRight size={13} color="#64748B" />}
                </div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{a.time}</div>
                {open && <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 6, lineHeight: 1.5 }}>{a.detail}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- DOCTOR CONSOLE ---------------- */
function DoctorConsole() {
  const [messages, setMessages] = useState([
    { from: "nurse", name: "Nurse Devika", text: "Patient SpO2 dipped briefly at 11:42, resolved with FiO2 adjustment.", time: "11:43" },
    { from: "doctor", name: "Dr. Anand", text: "Noted. Continue monitoring, repeat ABG in 2 hours.", time: "11:45" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const send = () => {
    if (!input.trim()) return;
    setMessages(m => [...m, { from: "doctor", name: "Dr. Anand", text: input, time: "now" }]);
    setInput("");
    setTyping(true);
    setTimeout(() => setTyping(false), 1800);
  };

  return (
    <div style={{ borderRadius: 20, padding: 18, background: "rgba(17,24,39,0.7)", border: "1px solid rgba(148,163,184,0.1)", display: "flex", flexDirection: "column", height: 360 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#F1F5F9", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <Stethoscope size={15} color="#3B82F6" /> Doctor Console
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 8, flexDirection: m.from === "doctor" ? "row-reverse" : "row" }}>
            <div style={{ width: 26, height: 26, borderRadius: 999, background: m.from === "doctor" ? "linear-gradient(135deg,#2563EB,#3B82F6)" : "linear-gradient(135deg,#06B6D4,#22D3EE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0 }}>
              {m.name.split(" ").map(n => n[0]).slice(0,2).join("")}
            </div>
            <div style={{ maxWidth: "75%" }}>
              <div style={{ fontSize: 10.5, color: "#64748B", marginBottom: 3, textAlign: m.from === "doctor" ? "right" : "left" }}>{m.name} · {m.time}</div>
              <div style={{ background: m.from === "doctor" ? "rgba(37,99,235,0.18)" : "rgba(148,163,184,0.08)", border: `1px solid ${m.from === "doctor" ? "rgba(59,130,246,0.3)" : "rgba(148,163,184,0.12)"}`, borderRadius: 14, padding: "8px 12px", fontSize: 12.5, color: "#E2E8F0", lineHeight: 1.4 }}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
        {typing && <div style={{ fontSize: 11, color: "#64748B", paddingLeft: 34 }}>Nurse Devika is typing…</div>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <Paperclip size={16} color="#64748B" style={{ cursor: "pointer" }} />
        <Mic size={16} color="#64748B" style={{ cursor: "pointer" }} />
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message…" style={{ flex: 1, background: "rgba(11,18,32,0.6)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 999, padding: "8px 14px", fontSize: 12.5, color: "#E2E8F0", outline: "none" }} />
        <button onClick={send} style={{ width: 32, height: 32, borderRadius: 999, background: "linear-gradient(135deg,#2563EB,#06B6D4)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Send size={14} color="#fff" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- ALARM CENTER ---------------- */
function AlarmCenter({ status }) {
  const [silenced, setSilenced] = useState(false);
  const active = status !== "stable";
  const c = status === "critical" ? "#EF4444" : "#F59E0B";
  return (
    <div style={{ borderRadius: 20, padding: 18, background: "rgba(17,24,39,0.7)", border: `1px solid ${active && !silenced ? c + "55" : "rgba(148,163,184,0.1)"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
          {active && !silenced ? <Bell size={15} color={c} style={{ animation: "pulse 1.2s infinite" }} /> : <BellOff size={15} color="#64748B" />}
          Alarm Center
        </div>
        <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#94A3B8" }}>
          <span>⚠ {status === "stable" ? 0 : 2}</span>
          <span>🔴 {status === "critical" ? 1 : 0}</span>
        </div>
      </div>
      {active && !silenced ? (
        <div style={{ background: `${c}14`, border: `1px solid ${c}44`, borderRadius: 14, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, color: "#F1F5F9", fontWeight: 500 }}>
            {status === "critical" ? "Critical: Low SpO₂ detected" : "Warning: Elevated respiratory rate"}
          </div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>Bed requires attention</div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>No active alarms.</div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setSilenced(s => !s)} style={btnStyle("rgba(148,163,184,0.12)", "#CBD5E1")}>{silenced ? "Unsilence" : "Silence"}</button>
        <button style={btnStyle("rgba(34,197,94,0.15)", "#4ADE80")}>Acknowledge</button>
        <button style={btnStyle("rgba(239,68,68,0.12)", "#F87171")}>Dismiss</button>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
const btnStyle = (bg, color) => ({ flex: 1, background: bg, color, border: "none", borderRadius: 10, padding: "8px 0", fontSize: 11.5, fontWeight: 600, cursor: "pointer" });

/* ---------------- VENTILATOR CONTROLS ---------------- */
function VentilatorControls({ mode, vitals }) {
  const modes = ["PRVC", "P-ACV", "V-ACV", "SIMV", "CPAP"];
  const [active, setActive] = useState(mode);
  return (
    <div style={{ borderRadius: 20, padding: 18, background: "rgba(17,24,39,0.7)", border: "1px solid rgba(148,163,184,0.1)" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#F1F5F9", marginBottom: 14 }}>Ventilator Controls</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {modes.map(m => (
          <button key={m} onClick={() => setActive(m)} style={{
            padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: active === m ? "1px solid #3B82F6" : "1px solid rgba(148,163,184,0.15)",
            background: active === m ? "linear-gradient(135deg,rgba(37,99,235,0.3),rgba(6,182,212,0.2))" : "rgba(11,18,32,0.5)",
            color: active === m ? "#93C5FD" : "#94A3B8",
          }}>{m}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[["FiO₂", `${vitals.fio2}%`], ["PEEP", `${vitals.peep} cmH₂O`], ["Resp. Rate", `${vitals.rr}/min`], ["Insp. Time", "1.0s"], ["Rise Time", "150ms"], ["Trigger", "Flow 2L/min"], ["Weight", "68 kg"], ["Oxygen", `${vitals.fio2}%`]].map(([l, v]) => (
          <div key={l} style={{ background: "rgba(11,18,32,0.5)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 10.5, color: "#64748B", marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "#E2E8F0" }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- DEMO CONTROLS ---------------- */
function DemoControls({ status, setStatus }) {
  const actions = [
    { label: "Simulate Warning", fn: () => setStatus("warning") },
    { label: "Simulate Critical", fn: () => setStatus("critical") },
    { label: "Recover Patient", fn: () => setStatus("stable") },
    { label: "Randomize Vitals", fn: () => setStatus(s => s) },
  ];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {actions.map(a => (
        <button key={a.label} onClick={a.fn} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#93C5FD", cursor: "pointer" }}>
          {a.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- PATIENT DASHBOARD ---------------- */
function PatientDashboard({ patient, onBack }) {
  const [status, setStatus] = useState(patient.status);
  const [vitals, setVitals] = useState(vitalsFor(patient.status));
  useEffect(() => setVitals(vitalsFor(status)), [status]);
  useEffect(() => {
    const t = setInterval(() => setVitals(vitalsFor(status)), 4000);
    return () => clearInterval(t);
  }, [status]);
  const s = STATUS[status];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={onBack} style={{ background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 10, padding: "7px 12px", color: "#CBD5E1", fontSize: 12, cursor: "pointer" }}>← Back</button>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#2563EB,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff" }}>
            {patient.name.split(" ").map(n => n[0]).slice(0,2).join("")}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "#F1F5F9" }}>{patient.name} <span style={{ fontSize: 12, color: "#64748B", fontWeight: 400 }}>· {patient.age}y · {patient.gender}</span></div>
            <div style={{ fontSize: 11.5, color: "#64748B" }}>{patient.id} · {patient.bed}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <StatusBadge status={status} />
          <span style={{ fontSize: 11.5, background: "rgba(6,182,212,0.1)", color: "#22D3EE", padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(6,182,212,0.2)" }}>{patient.mode}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#4ADE80" }}><Wifi size={13} /> Connected</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#64748B" }}><Clock size={13} /> Just now</span>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <DemoControls status={status} setStatus={setStatus} />
      </div>

      {/* Live metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 22 }}>
        <MetricCard icon={Droplet} label="SpO₂" value={vitals.spo2} unit="%" color={s.color} seed={1} trend={status === "critical" ? "down" : "neutral"} />
        <MetricCard icon={Heart} label="Heart Rate" value={vitals.hr} unit="bpm" color="#EF4444" seed={2} trend={status !== "stable" ? "up" : "neutral"} />
        <MetricCard icon={Wind} label="Resp. Rate" value={vitals.rr} unit="/min" color="#3B82F6" seed={3} trend="neutral" />
        <MetricCard icon={Gauge} label="FiO₂" value={vitals.fio2} unit="%" color="#06B6D4" seed={4} trend="neutral" />
        <MetricCard icon={Activity} label="PEEP" value={vitals.peep} unit="cmH₂O" color="#8B5CF6" seed={5} trend="neutral" />
        <MetricCard icon={Wind} label="Tidal Volume" value={vitals.tidalVolume} unit="mL" color="#22C55E" seed={6} trend="neutral" />
        <MetricCard icon={Activity} label="Minute Vent." value={vitals.minuteVent.toFixed(1)} unit="L/min" color="#F59E0B" seed={7} trend="neutral" />
        <MetricCard icon={Gauge} label="Airway Press." value={vitals.airwayPressure} unit="cmH₂O" color="#EF4444" seed={8} trend="neutral" />
        <MetricCard icon={Gauge} label="Insp. Pressure" value={vitals.inspPressure} unit="cmH₂O" color="#3B82F6" seed={9} trend="neutral" />
        <MetricCard icon={Activity} label="I:E Ratio" value={vitals.ieRatio} unit="" color="#06B6D4" seed={10} trend="neutral" />
      </div>

      {/* Waveforms */}
      <div style={{ borderRadius: 20, padding: 18, background: "rgba(11,18,32,0.7)", border: "1px solid rgba(148,163,184,0.1)", marginBottom: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#F1F5F9", marginBottom: 12 }}>Live Waveforms</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          {[["Pressure (cmH₂O) vs Time", "pressure", "#3B82F6"], ["Flow (L/min) vs Time", "flow", "#22D3EE"], ["Volume (mL) vs Time", "volume", "#22C55E"]].map(([label, kind, color]) => (
            <div key={kind}>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6 }}>{label}</div>
              <div style={{ background: "#070D18", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(148,163,184,0.08)" }}>
                <WaveformCanvas kind={kind} color={color} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 18, marginBottom: 18 }}>
        <VentilatorControls mode={patient.mode} vitals={vitals} />
        <AIPanel status={status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
        <AlertTimeline status={status} />
        <DoctorConsole />
        <AlarmCenter status={status} />
      </div>
    </div>
  );
}

/* ---------------- ROOT APP ---------------- */
export default function ICUDashboard() {
  const [patientsVitals] = useState(() => Object.fromEntries(PATIENTS_SEED.map(p => [p.id, vitalsFor(p.status)])));
  const [selected, setSelected] = useState(null);

  const selectedPatient = PATIENTS_SEED.find(p => p.id === selected);

  return (
    <div style={{
      minHeight: "100vh", background: "radial-gradient(circle at 20% -10%, #14213D 0%, #0B1220 45%, #0B1220 100%)",
      fontFamily: "'Inter','Segoe UI',sans-serif", color: "#E2E8F0", padding: "26px 28px",
    }}>
      {/* top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#2563EB,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={19} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, color: "#F8FAFC" }}>AarogyaPulse ICU</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>AI Remote Monitoring · Demo</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "#94A3B8" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#4ADE80" }}><Wifi size={13} /> 8 Beds Online</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><User size={13} /> Dr. Anand</span>
        </div>
      </div>

      {!selectedPatient ? (
        <>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#F8FAFC", letterSpacing: -0.5, marginBottom: 4 }}>ICU Bed Overview</div>
            <div style={{ fontSize: 13, color: "#64748B" }}>Select a patient to view live ventilator monitoring</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
            {PATIENTS_SEED.map(p => (
              <PatientCard key={p.id} p={p} vitals={patientsVitals[p.id]} onOpen={setSelected} />
            ))}
          </div>
        </>
      ) : (
        <PatientDashboard patient={selectedPatient} onBack={() => setSelected(null)} />
      )}
    </div>
  );
}
