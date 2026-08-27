import React from "react";
import { motion } from "framer-motion";
import { 
  Terminal, Activity, Zap, Wifi, Cpu, MessageSquare, 
  Settings, User, BookOpen, LayoutGrid, Box
} from "lucide-react";

interface MainDashboardProps {
  onboarding: any;
  isOnline: boolean;
  activeProject: string;
  projects: any[];
  obdMode: string;
  setObdMode: (mode: any) => void;
  updateData: (key: string, val: string) => void;
  obdConnected: boolean;
  handleConnect: () => void;
  setCurrentScreen: (screen: string) => void;
  setChatMode: (mode: any) => void;
  setChatInitialQuery?: (query: string) => void;
  projectPicker: React.ReactNode;
  chatHistoryWidget: React.ReactNode;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  onboarding,
  isOnline,
  activeProject,
  projects,
  obdMode,
  setObdMode,
  updateData,
  obdConnected,
  handleConnect,
  setCurrentScreen,
  setChatMode,
  setChatInitialQuery,
  projectPicker,
  chatHistoryWidget
}) => {
  const [omniInput, setOmniInput] = React.useState("");

  const handleOmniSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!omniInput.trim()) return;

    const lower = omniInput.toLowerCase();
    
    // Auto-categorize based on heuristics
    let targetCategory: any = "Operations";
    let targetScreen = "Chat";

    if (lower.includes("code") || lower.includes("scan") || lower.includes("dtc") || lower.includes("diagnose") || lower.includes("fault") || lower.includes("check engine")) {
      targetCategory = "Diagnostics Lead";
      targetScreen = "Chat"; // Chat handles it
    } else if (lower.includes("tune") || lower.includes("boost") || lower.includes("rpm") || lower.includes("log") || lower.includes("map")) {
      targetCategory = "Performance Tuner";
      targetScreen = "Chat";
    } else if (lower.includes("wire") || lower.includes("pin") || lower.includes("voltage") || lower.includes("harness")) {
       targetCategory = "Electrical Eng.";
       targetScreen = "Chat";
    } else if (lower.includes("part") || lower.includes("inventory") || lower.includes("tool") || lower.includes("stock")) {
       targetScreen = "Inventory";
    } else if (lower.includes("estimate") || lower.includes("cost") || lower.includes("quote") || lower.includes("labor")) {
       targetCategory = "Estimator";
       targetScreen = "Estimator";
    } else if (lower.includes("tsb") || lower.includes("recall") || lower.includes("procedure") || lower.includes("bulletin")) {
       targetScreen = "KnowledgeBase";
    } else if (lower.includes("garage") || lower.includes("client") || lower.includes("history")) {
       targetScreen = "Garage";
    } else if (lower.includes("order") || lower.includes("catalog") || lower.includes("buy")) {
       targetScreen = "PartsCatalog";
    } else if (lower.includes("sms") || lower.includes("revenue") || lower.includes("crm") || lower.includes("approval")) {
       targetScreen = "CrmDashboard";
    } else if (lower.includes("inspection") || lower.includes("dvi") || lower.includes("multi-point") || lower.includes("multi point") || lower.includes("photo")) {
       targetScreen = "DviModule";
    } else if (lower.includes("clock") || lower.includes("labor") || lower.includes("time") || lower.includes("efficiency")) {
       // 'labor' is also used for estimators, but 'timeline' or 'clock in' will trigger this
       targetScreen = "TimeClock";
    } else if (lower.includes("adas") || lower.includes("calibration") || lower.includes("radar") || lower.includes("camera") || lower.includes("blind spot") || lower.includes("chassis")) {
       targetScreen = "AdasCalibration";
    }

    if (targetScreen === "Chat") {
      setChatMode(targetCategory);
      setChatInitialQuery?.(omniInput);
      setCurrentScreen("Chat");
    } else {
      // If it's a specific screen like Inventory or Estimator
      // we navigate there. For Estimator we might want to pass the context, but for now just navigate.
      if (targetScreen === "Estimator") {
         setChatMode("Estimator");
         setChatInitialQuery?.(omniInput);
         setCurrentScreen("Chat"); // Route through chat for estimator too
      } else {
         setCurrentScreen(targetScreen);
      }
    }
  };

  const activeProjectData = projects.find((p) => p.id === activeProject);
  const activeProjectColor = activeProjectData?.color as string || "#F5A623";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full overflow-y-auto no-scrollbar pb-32 pt-8 px-4 sm:px-6 md:px-8"
    >
      <header className="flex justify-between items-start mb-8 relative">
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-primary animate-pulse shadow-[0_0_8px_#F5A623]" : "bg-error shadow-[0_0_8px_#E53935]"}`} />
            <h1 className="text-text-dim text-[10px] font-black uppercase tracking-[0.3em]">
              {isOnline ? "Active_Link" : "System.Offline"}
            </h1>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight font-display leading-none mb-2">
            Command Center
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-black uppercase tracking-widest bg-primary px-2 py-1 rounded border border-primary/20 shadow-[0_0_10px_rgba(245,166,35,0.2)]">
              User: {onboarding.assistantName}
            </span>
            <span className="text-[10px] font-mono text-primary/80 uppercase tracking-widest px-2 py-1 bg-white/5 rounded border border-white/5">
              Target: {onboarding.vehicleYear} {onboarding.vehicleMake}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen("Index")}
            className="w-12 h-12 rounded-2xl bg-[#111] flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors shadow-lg"
          >
            <BookOpen className="w-5 h-5 text-white/70" />
          </button>
          <div
            style={{
              background: `linear-gradient(135deg, ${activeProjectColor}, transparent)`,
              borderColor: `${activeProjectColor}66`,
            }}
            className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center font-bold text-black border-2 shadow-[0_10px_25px_rgba(0,0,0,0.5)] relative overflow-hidden group transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            onClick={() => setCurrentScreen("NameAssistant")}
          >
            <div className="absolute inset-0 bg-black/20" />
            <User className="w-6 h-6 text-white relative z-10" />
          </div>
        </div>
      </header>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min">
        
        {/* Project Context (Spans across) */}
        <div className="md:col-span-12">
          {projectPicker}
        </div>

        {/* AI Hub / Omnibar (Large feature) */}
        <div className="md:col-span-12 bg-gradient-to-b from-[#111] to-[#0A0A0A] rounded-[2rem] p-8 md:p-12 border border-primary/20 relative shadow-[0_10px_40px_rgba(245,166,35,0.08)] flex flex-col items-center justify-center text-center overflow-hidden min-h-[20rem]">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <Cpu className="w-48 h-48 text-primary" />
           </div>
           
           <div className="relative mb-6">
              <div className="absolute inset-[-15px] bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center border border-primary/40 relative z-10 shadow-[0_0_30px_rgba(245,166,35,0.2)]">
                <MessageSquare className="text-primary w-8 h-8" />
              </div>
           </div>
           
           <h3 className="font-display font-black text-3xl md:text-4xl text-white tracking-tight mb-2">
             How can we help today?
           </h3>
           <p className="text-xs text-text-dim/80 uppercase tracking-[0.2em] font-mono mb-8 max-w-md">
             Type what you need to do, and the AI will guide you to the right tool automatically.
           </p>

           <form onSubmit={handleOmniSubmit} className="w-full max-w-2xl relative z-10">
             <input
               type="text"
               value={omniInput}
               onChange={e => setOmniInput(e.target.value)}
               placeholder="e.g. Scan for codes, lookup a wiring diagram, or draft an estimate..."
               className="w-full bg-black/80 backdrop-blur-md border border-white/10 hover:border-primary/50 focus:border-primary px-6 py-5 rounded-2xl text-white outline-none pl-14 transition-all text-sm shadow-xl"
             />
             <MessageSquare className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
             <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(245,166,35,0.4)] transition-all">
               Execute
             </button>
           </form>
        </div>

        {/* Hardware Telemetry Block */}
        <div className="md:col-span-12 bg-[#050505] border border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <Activity className="w-6 h-6 text-primary" />
             </div>
             <div>
                <h4 className="text-lg font-display font-black text-white leading-tight">
                  Hardware Telemetry Link
                </h4>
                <p className="text-text-secondary text-xs max-w-sm mt-1">
                  Connect your diagnostic hardware to read real-time data, clear faults, and run advanced tests on your target asset.
                </p>
             </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
             <div className="flex flex-col gap-1 min-w-[140px]">
               <select
                  value={onboarding.vehicleProtocol}
                  onChange={(e) => updateData("vehicleProtocol", e.target.value)}
                  className="bg-[#111] border border-white/10 rounded-lg text-[10px] px-3 py-2 text-white outline-none font-bold uppercase tracking-wider h-10"
                >
                  <option value="Auto">Auto Detect</option>
                  <option value="ISO 15765-4 (CAN 11/500)">CAN Bus 11-bit</option>
                  <option value="ISO 15765-4 (CAN 29/500)">CAN Bus 29-bit</option>
                  <option value="ISO 14230-4 (KWP FAST)">KWP / Serial</option>
                </select>
             </div>
             
             <div className="flex flex-col gap-1 min-w-[140px]">
               <select
                  value={obdMode}
                  onChange={(e) => setObdMode(e.target.value as any)}
                  className="bg-[#111] border border-white/10 rounded-lg text-[10px] px-3 py-2 text-white outline-none font-bold uppercase tracking-wider h-10"
                >
                  <option value="Simulated">Demo Sim</option>
                  <option value="Bluetooth">Bluetooth/BLE</option>
                  <option value="USB">USB OTG Cable</option>
                </select>
             </div>

             <button
                onClick={handleConnect}
                className={`h-10 px-6 rounded-lg flex items-center justify-center gap-2 transition-all text-[10px] ${
                  obdConnected
                    ? "bg-success/20 text-success border border-success/40"
                    : "bg-primary text-black hover:bg-primary/90"
                } font-black uppercase tracking-widest`}
              >
                {obdConnected ? (
                  <>
                    <Wifi className="w-4 h-4" /> Connected
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> Establish Link
                  </>
                )}
             </button>
          </div>
        </div>
        
        {/* Quick Actions / Shortcuts */}
        <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
           <button onClick={() => setCurrentScreen("Index")} className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-[#1a1a1a] transition-all">
             <LayoutGrid className="w-6 h-6 text-primary" />
             <span className="text-xs uppercase font-bold tracking-widest font-mono text-white/70">Tools Menu</span>
           </button>
           <button onClick={() => setCurrentScreen("Terminal")} className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-[#1a1a1a] transition-all">
             <Terminal className="w-6 h-6 text-white" />
             <span className="text-xs uppercase font-bold tracking-widest font-mono text-white/70">Scan Target</span>
           </button>
           <button onClick={() => setCurrentScreen("Inventory")} className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-[#1a1a1a] transition-all">
             <Box className="w-6 h-6 text-white" />
             <span className="text-xs uppercase font-bold tracking-widest font-mono text-white/70">Inventory</span>
           </button>
           <button onClick={() => setCurrentScreen("Settings")} className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-[#1a1a1a] transition-all">
             <Settings className="w-6 h-6 text-white" />
             <span className="text-xs uppercase font-bold tracking-widest font-mono text-white/70">Settings</span>
           </button>
        </div>

        {/* Chat History Widget */}
        <div className="md:col-span-12">
          {chatHistoryWidget}
        </div>

      </div>
    </motion.div>
  );
};
