import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Gauge, Activity, Zap, Search, CheckCircle } from "lucide-react";
import { D3StreamChart } from "../../components/D3StreamChart";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Component for a dynamic circular gauge
const CircularGauge = ({
  value,
  max,
  label,
  unit,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
}) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / max) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative w-full aspect-square max-w-[180px] mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="12"
          fill="transparent"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          stroke="#F5A623"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black text-white">
          {Math.round(value)}
        </span>
        <span className="text-[10px] text-white/50 font-black uppercase tracking-widest leading-none mt-1">
          {unit}
        </span>
      </div>
      <div className="absolute bottom-2 text-[10px] text-primary/60 font-bold uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
};

const AVAILABLE_PIDS = [
  { id: "RPM", name: "Engine RPM", group: "General", unit: "RPM", icon: Activity },
  { id: "ECT", name: "Coolant Temp", group: "Cooling", unit: "°F", icon: Zap },
  { id: "MAP", name: "Manifold Pressure", group: "Air", unit: "psi", icon: Gauge },
  { id: "VSS", name: "Vehicle Speed", group: "General", unit: "mph", icon: Activity },
  { id: "SPARK", name: "Spark Advance", group: "Spark", unit: "°", icon: Zap },
  { id: "STFT1", name: "Short Term Fuel Trim", group: "Fuel", unit: "%", icon: Activity },
  { id: "LTFT1", name: "Long Term Fuel Trim", group: "Fuel", unit: "%", icon: Activity },
  { id: "MAF", name: "Mass Air Flow", group: "Air", unit: "g/s", icon: Gauge },
  { id: "IAT", name: "Intake Air Temp", group: "Air", unit: "°F", icon: Zap },
  { id: "TP", name: "Throttle Pos", group: "Air", unit: "%", icon: Gauge },
  { id: "O2S", name: "O2 Sensor Voltage", group: "Fuel", unit: "V", icon: Zap },
];

export const LiveDataScreen = ({
  onBack,
  telemetry = [],
}: {
  onBack: () => void;
  telemetry?: any[];
}) => {
  const [localData, setLocalData] = useState<any[]>(telemetry);
  const [selectedChartPid, setSelectedChartPid] = useState<string>("RPM");
  const [searchPid, setSearchPid] = useState("");
  const [filterGroup, setFilterGroup] = useState("All");

  // Simulate live data if no real telemetry is provided via props
  useEffect(() => {
    let interval: any;
    if (telemetry.length === 0) {
      interval = setInterval(() => {
        setLocalData((prev) => {
          const lastVal = prev.length ? (prev[prev.length - 1][selectedChartPid] || (selectedChartPid === "RPM" ? 800 : 50)) : (selectedChartPid === "RPM" ? 800 : 50);
          const newVal = Math.max(
            0,
            lastVal + (Math.random() - 0.5) * (selectedChartPid === "RPM" ? 500 : 5),
          );
          const newData = {
            time: new Date().toLocaleTimeString(),
            [selectedChartPid]: Math.round(newVal * 10) / 10,
            RPM: selectedChartPid !== "RPM" 
              ? Math.max(700, prev.length ? prev[prev.length - 1].RPM + (Math.random() - 0.5) * 500 : 800)
              : Math.round(newVal),
          };
          return [...prev.slice(-40), newData];
        });
      }, 800);
    } else {
      // Defer state update to avoid cascading effect warning
      setTimeout(() => setLocalData(telemetry), 0);
    }
    return () => clearInterval(interval);
  }, [telemetry, selectedChartPid]);

  const currentRpm =
    localData.length > 0 ? localData[localData.length - 1].RPM || 0 : 0;
  const currentChartVal = 
    localData.length > 0 ? localData[localData.length - 1][selectedChartPid] || 0 : 0;
    
  const activePidDef = AVAILABLE_PIDS.find(p => p.id === selectedChartPid) || AVAILABLE_PIDS[0];

  // ⚡ Bolt Optimization: Memoized filtered array to prevent expensive derivations on every live data tick
  const filteredPids = useMemo(() => {
    return AVAILABLE_PIDS.filter(pid => {
      const matchesSearch = pid.name.toLowerCase().includes(searchPid.toLowerCase()) || pid.id.toLowerCase().includes(searchPid.toLowerCase());
      const matchesGroup = filterGroup === "All" || pid.group === filterGroup;
      return matchesSearch && matchesGroup;
    });
  }, [searchPid, filterGroup]);

  const [tab, setTab] = useState<"dashboard" | "maps">("dashboard");

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-[#0A0A0A] flex flex-col pt-8 pb-32 z-20"
    >
      <div className="flex items-center gap-3 px-6 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-primary">
          <Activity className="w-5 h-5" />
          <div>
             <h2 className="text-xl font-black uppercase tracking-widest leading-none">
               Tuner Hub
             </h2>
             <span className="text-[9px] uppercase tracking-widest text-primary/70 font-mono">Team Powertrain</span>
          </div>
        </div>
      </div>

      <div className="px-6 mb-4 flex gap-2">
        <button
          onClick={() => setTab("dashboard")}
          className={`flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-colors border ${tab === "dashboard" ? "bg-primary text-black border-primary" : "bg-white/5 text-white/60 border-white/10"}`}
        >
          Live Dash
        </button>
        <button
          onClick={() => setTab("maps")}
          className={`flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-colors border ${tab === "maps" ? "bg-primary text-black border-primary" : "bg-white/5 text-white/60 border-white/10"}`}
        >
          ECU Maps
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 no-scrollbar pb-10">
        {tab === "dashboard" && (
          <motion.div
            key="dash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* RPM Circular Gauge */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-center">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />
              <CircularGauge
                value={currentRpm}
                max={7000}
                label="Engine RPM"
                unit="r/min"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Coolant", value: "185", unit: "°F", icon: Zap },
                { label: "Boost", value: "14.2", unit: "psi", icon: Gauge },
                { label: "Voltage", value: "13.8", unit: "V", icon: Zap },
                { label: "Load", value: "24", unit: "%", icon: Activity },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 hover:bg-white/10 transition-colors cursor-default"
                >
                  <div className="flex items-center justify-between text-white/50">
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {metric.label}
                    </span>
                    <metric.icon className="w-4 h-4 text-primary opacity-60" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">
                      {metric.value}
                    </span>
                    <span className="text-xs text-white/40">{metric.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Live D3 Stream Chart */}
            <D3StreamChart
              data={localData.length ? localData : [{ time: "0", [selectedChartPid]: 0 }]}
              dataKey={selectedChartPid}
              unit={activePidDef.unit}
              label={activePidDef.name}
              color="#F5A623"
              height={260}
            />

            {/* PID Selection List */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-4 relative flex flex-col">
              <div className="flex flex-col gap-3 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/70 px-2">Data Stream Selection</h3>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchPid}
                      onChange={(e) => setSearchPid(e.target.value)}
                      placeholder="Search PIDs (e.g. RPM, Fuel)..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                  <select 
                    value={filterGroup} 
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    <option value="All">All Groups</option>
                    <option value="General">General</option>
                    <option value="Cooling">Cooling</option>
                    <option value="Air">Air</option>
                    <option value="Spark">Spark</option>
                    <option value="Fuel">Fuel</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                {filteredPids.map(pid => (
                  <button
                    key={pid.id}
                    onClick={() => setSelectedChartPid(pid.id)}
                    className={`w-full text-left p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      selectedChartPid === pid.id 
                        ? "bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(245,166,35,0.1)]" 
                        : "bg-black/40 border-white/5 hover:border-primary/30 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                       <div className={`p-3 rounded-xl border ${selectedChartPid === pid.id ? "bg-primary/20 text-primary border-primary/30" : "bg-white/5 text-white/40 border-white/10"}`}>
                         <pid.icon className="w-5 h-5" />
                       </div>
                       <div>
                         <div className="flex items-center gap-2">
                            <h4 className={`font-bold text-sm ${selectedChartPid === pid.id ? "text-primary" : "text-white"}`}>{pid.name}</h4>
                            {selectedChartPid === pid.id && <CheckCircle className="w-3 h-3 text-primary" />}
                         </div>
                         <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono mt-0.5 inline-block">{pid.id} • {pid.group}</span>
                       </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                       <span className={`text-lg font-black font-mono ${selectedChartPid === pid.id ? "text-primary" : "text-white/70"}`}>
                         {selectedChartPid === pid.id ? currentChartVal : "--"}
                       </span>
                       <span className="text-[10px] text-white/40 font-mono tracking-widest">{pid.unit}</span>
                    </div>
                  </button>
                ))}
                {filteredPids.length === 0 && (
                   <div className="text-center py-8 text-white/40 text-sm">
                     No PIDs found matching your criteria.
                   </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {tab === "maps" && (
          <motion.div
            key="maps"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex gap-3">
              <Zap className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">
                  Tuning Mode Active
                </p>
                <p className="text-xs text-primary/70 leading-relaxed">
                  Modifying 3D volumetric efficiency maps. Ensure ECU is
                  unlocked before writing flash data.
                </p>
              </div>
            </div>

            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">
              Target Maps
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: "Fuel_Base", name: "Open Loop Fueling Map", load: "10x10" },
                {
                  id: "Spark_Adv",
                  name: "Ignition Timing Advance",
                  load: "12x12",
                },
                { id: "Boost_Tgt", name: "Wastegate Duty Cycle", load: "8x8" },
              ].map((map) => (
                <div
                  key={map.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-primary/30 transition-colors cursor-pointer group flex flex-col"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">
                      {map.id}
                    </span>
                    <span className="text-[9px] min-w-12 text-center py-0.5 bg-white/10 text-white rounded font-mono shadow-inner">
                      {map.load}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-4 flex-1">
                    {map.name}
                  </h4>

                  {/* Fake Grid Map */}
                  <div className="grid grid-cols-4 gap-1 opacity-50 group-hover:opacity-100 transition-opacity mt-auto">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-4 rounded-sm ${i % 3 === 0 ? "bg-primary/40" : i % 2 === 0 ? "bg-orange-500/40" : "bg-red-500/40"}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 bg-primary text-black py-4 rounded-xl text-[12px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 hover:bg-primary/90 shadow-[0_4px_15px_rgba(245,166,35,0.3)]">
              Write Flash Data
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
