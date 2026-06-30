import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Heart, Wind, AlertCircle, CheckCircle2, 
  MessageSquare, Settings, Bell, ActivitySquare, Play, 
  RefreshCcw, Stethoscope, ChevronRight 
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

// --- Mock Data ---
const PATIENTS = [
  { id: 'TN-ICU-2025-001', name: 'Arul Kumar', age: 58, gender: 'Male', bed: 'ICU-01', status: 'critical', mode: 'PRVC', vitals: { spo2: 88, hr: 112, rr: 28 } },
  { id: 'TN-ICU-2025-002', name: 'Lakshmi Priya', age: 46, gender: 'Female', bed: 'ICU-02', status: 'stable', mode: 'SIMV', vitals: { spo2: 98, hr: 72, rr: 16 } },
  { id: 'TN-ICU-2025-003', name: 'Karthikeyan S', age: 65, gender: 'Male', bed: 'ICU-03', status: 'warning', mode: 'P-ACV', vitals: { spo2: 93, hr: 95, rr: 22 } },
  { id: 'TN-ICU-2025-004', name: 'Meenakshi Devi', age: 54, gender: 'Female', bed: 'ICU-04', status: 'stable', mode: 'CPAP', vitals: { spo2: 99, hr: 68, rr: 14 } },
  { id: 'TN-ICU-2025-005', name: 'Praveen Kumar', age: 39, gender: 'Male', bed: 'ICU-05', status: 'stable', mode: 'V-ACV', vitals: { spo2: 97, hr: 75, rr: 15 } },
  { id: 'TN-ICU-2025-006', name: 'Nandhini R', age: 28, gender: 'Female', bed: 'ICU-06', status: 'stable', mode: 'PRVC', vitals: { spo2: 98, hr: 70, rr: 16 } },
  { id: 'TN-ICU-2025-007', name: 'Murugan P', age: 71, gender: 'Male', bed: 'ICU-07', status: 'warning', mode: 'SIMV', vitals: { spo2: 92, hr: 105, rr: 24 } },
];

const STATUS_COLORS = {
  stable: 'text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]',
  warning: 'text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
  critical: 'text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
};

const STATUS_BG = {
  stable: 'bg-green-500/10',
  warning: 'bg-amber-500/10',
  critical: 'bg-red-500/10'
};

// Dummy Sparkline Data
const generateSparkline = () => Array.from({ length: 20 }, () => Math.floor(Math.random() * 20) + 60);

export default function PremiumICUDashboard() {
  const [activePatient, setActivePatient] = useState(PATIENTS[0]);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden flex">
      
      {/* Sidebar: Patient Selection */}
      <aside className="w-80 border-r border-white/5 bg-[#111827]/80 backdrop-blur-xl p-4 flex flex-col gap-4 z-10">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <ActivitySquare className="text-cyan-500" />
            SVCE Health Institute
          </h2>
          <p className="text-xs text-slate-500 mt-1">AI Critical Care Monitor</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {PATIENTS.map((p) => (
            <motion.div
              key={p.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActivePatient(p)}
              className={`p-4 rounded-2xl cursor-pointer border transition-all duration-300 ${
                activePatient.id === p.id 
                  ? 'bg-[#1E293B] border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                  : 'bg-[#111827] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-white">{p.name}</h3>
                  <p className="text-xs text-slate-400">{p.bed} • {p.age}y {p.gender}</p>
                </div>
                <span className={`h-2 w-2 rounded-full ${p.status === 'stable' ? 'bg-green-500' : p.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div className="bg-black/30 p-2 rounded-lg text-center">
                  <span className="block text-slate-500">SpO₂</span>
                  <span className={`font-semibold ${p.vitals.spo2 < 92 ? 'text-red-400' : 'text-slate-200'}`}>{p.vitals.spo2}%</span>
                </div>
                <div className="bg-black/30 p-2 rounded-lg text-center">
                  <span className="block text-slate-500">HR</span>
                  <span className="font-semibold text-slate-200">{p.vitals.hr}</span>
                </div>
                <div className="bg-black/30 p-2 rounded-lg text-center">
                  <span className="block text-slate-500">RR</span>
                  <span className="font-semibold text-slate-200">{p.vitals.rr}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* Header */}
        <header className="h-20 border-b border-white/5 bg-[#0B1220]/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{activePatient.name}</h1>
              <p className="text-sm text-slate-400 flex items-center gap-2">
                {activePatient.id} <span className="w-1 h-1 bg-slate-600 rounded-full"/> {activePatient.bed}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[activePatient.status]} ${STATUS_BG[activePatient.status]}`}>
              {activePatient.status}
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-medium border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              Mode: {activePatient.mode}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <p className="text-sm text-slate-300 font-mono">{currentTime}</p>
              <p className="text-xs text-green-400 flex items-center justify-end gap-1">
                <CheckCircle2 size={12} /> System Online
              </p>
            </div>
            <button className="p-2 rounded-xl bg-[#1E293B] border border-white/10 hover:bg-white/5 transition-colors relative">
              <Bell size={18} className="text-slate-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>
            <button className="p-2 rounded-xl bg-[#1E293B] border border-white/10 hover:bg-white/5 transition-colors">
              <Settings size={18} className="text-slate-300" />
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="p-8 grid grid-cols-12 gap-6 flex-1">
          
          {/* Left Column: Vitals & Waveforms (Span 8) */}
          <div className="col-span-8 flex flex-col gap-6">
            
            {/* Vitals Cards */}
            <div className="grid grid-cols-3 gap-6">
              <VitalCard title="SpO₂" value={activePatient.vitals.spo2} unit="%" icon={Wind} color="#06B6D4" trend="-1%" />
              <VitalCard title="Heart Rate" value={activePatient.vitals.hr} unit="bpm" icon={Heart} color="#EF4444" trend="+3bpm" alert={activePatient.status === 'critical'} />
              <VitalCard title="Resp Rate" value={activePatient.vitals.rr} unit="bpm" icon={Activity} color="#22C55E" trend="Stable" />
              <VitalCard title="FiO₂" value={40} unit="%" color="#3B82F6" />
              <VitalCard title="PEEP" value={5} unit="cmH₂O" color="#F59E0B" />
              <VitalCard title="Tidal Volume" value={420} unit="mL" color="#8B5CF6" />
            </div>

            {/* Waveforms (Simulated) */}
            <div className="bg-[#111827] border border-white/5 rounded-3xl p-6 shadow-2xl flex-1 flex flex-col min-h-[300px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Live Telemetry</h3>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] rounded border border-cyan-500/20">Pressure</span>
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] rounded border border-green-500/20">Flow</span>
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-[10px] rounded border border-purple-500/20">Volume</span>
                </div>
              </div>
              
              {/* CSS Animated Mock Waveforms to replicate ventilator screen */}
              <div className="flex-1 flex flex-col gap-4 relative overflow-hidden bg-[#0B1220] rounded-xl border border-white/5 p-4">
                 {/* Grid overlay */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
                 
                 <Waveform color="#06B6D4" label="Paw" />
                 <Waveform color="#22C55E" label="Flow" />
                 <Waveform color="#A855F7" label="Vol" />
              </div>
            </div>
          </div>

          {/* Right Column: AI, Alerts, & Controls (Span 4) */}
          <div className="col-span-4 flex flex-col gap-6">
            
            {/* AI Recommendation Engine */}
            <div className="bg-gradient-to-b from-[#1E293B] to-[#111827] border border-blue-500/20 rounded-3xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ActivitySquare size={100} />
              </div>
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                AI Clinical Insight
              </h3>
              
              <div className="space-y-4 relative z-10">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Patient exhibits signs of moderate respiratory distress. SpO₂ has dropped 2% over the last hour. 
                  <span className="text-white font-medium"> Recommendation:</span> Consider increasing FiO₂ to 45% and evaluate for suctioning.
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded-lg transition-colors font-medium">Apply Protocol</button>
                  <button className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 text-xs py-2 rounded-lg transition-colors border border-white/10">View Trends</button>
                </div>
              </div>
            </div>

            {/* Doctor Console / Alerts */}
            <div className="bg-[#111827] border border-white/5 rounded-3xl flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0B1220]/50">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <MessageSquare size={16} /> Console & Alerts
                </h3>
              </div>
              
              <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar text-sm">
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex gap-3">
                   <AlertCircle className="text-red-400 shrink-0" size={18} />
                   <div>
                     <p className="text-red-200 font-medium text-xs">High Peak Airway Pressure</p>
                     <p className="text-slate-400 text-[10px] mt-1">10 mins ago</p>
                   </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Stethoscope size={14} className="text-blue-400" />
                  </div>
                  <div className="bg-[#1E293B] p-3 rounded-2xl rounded-tl-none border border-white/5">
                    <p className="text-slate-300 text-xs">Please check airway clearance. Adjusting alarm limits temporarily.</p>
                    <p className="text-slate-500 text-[10px] mt-2 font-mono">Dr. Swaminathan • 12:25 PM</p>
                  </div>
                </div>
              </div>

              {/* Chat Input Placeholder */}
              <div className="p-3 border-t border-white/5 bg-[#0B1220]/50">
                <div className="bg-[#1E293B] border border-white/10 rounded-xl p-2 flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Type an instruction..." 
                    className="bg-transparent border-none outline-none text-xs text-slate-300 w-full placeholder:text-slate-600 px-2"
                  />
                  <button className="p-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Demo Presentation Controls */}
            <div className="grid grid-cols-2 gap-3 mt-auto">
                <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-slate-300 flex items-center justify-center gap-2 transition-all">
                  <AlertCircle size={14} className="text-amber-400"/> Sim Warning
                </button>
                <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-slate-300 flex items-center justify-center gap-2 transition-all">
                  <RefreshCcw size={14} className="text-cyan-400"/> Reset Vitals
                </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Subcomponents ---

function VitalCard({ title, value, unit, icon: Icon, color, trend, alert = false }: any) {
  const data = generateSparkline().map((val, i) => ({ time: i, value: val }));
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#111827] border rounded-3xl p-5 relative overflow-hidden group transition-colors ${
        alert ? 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-white/5 hover:border-white/10 shadow-lg'
      }`}
    >
      {alert && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />}
      
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
        {Icon && <Icon size={18} style={{ color }} className="opacity-70 group-hover:opacity-100 transition-opacity" />}
      </div>
      
      <div className="flex items-end gap-2 z-10 relative">
        <motion.span 
          key={value}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-bold tracking-tighter"
          style={{ color: alert ? '#F87171' : 'white' }}
        >
          {value}
        </motion.span>
        <span className="text-slate-500 mb-1">{unit}</span>
      </div>

      {trend && (
        <div className="mt-4 flex items-center justify-between h-8 relative">
           <span className="text-xs text-slate-500">{trend}</span>
           <div className="w-24 h-full absolute right-0 bottom-0 opacity-50">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      )}
    </motion.div>
  );
}

function Waveform({ color, label }: { color: string, label: string }) {
  // A CSS trick to simulate a moving waveform for the demo without heavy Canvas/WebGL setup
  return (
    <div className="flex-1 relative flex items-center border-b border-white/5 last:border-0">
      <div className="absolute left-2 top-2 text-[10px] font-mono text-slate-500 bg-[#0B1220] px-1 rounded z-10">{label}</div>
      <div className="w-full h-12 overflow-hidden relative opacity-80">
        <svg viewBox="0 0 500 50" className="absolute top-0 left-0 w-[200%] h-full animate-[wave_4s_linear_infinite]" preserveAspectRatio="none">
          <path 
            d="M0,25 C25,5 75,45 100,25 C125,5 175,45 200,25 C225,5 275,45 300,25 C325,5 375,45 400,25 C425,5 475,45 500,25 L500,50 L0,50 Z" 
            fill="none" 
            stroke={color} 
            strokeWidth="2"
            className="drop-shadow-[0_0_5px_currentColor]"
          />
        </svg>
      </div>
    </div>
  );
}
