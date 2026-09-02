import React, { useState, useRef, useEffect, useMemo, memo } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Terminal, Send, Save, Download, Tv, ChevronDown, ChevronRight, ChevronsUpDown, TextSearch } from "lucide-react";
import { toast } from "../../lib/notifications";

// Helper to parse each flat log line into metadata
const parseLogLine = (log: string) => {
  const isTxVal = log.includes("TX:") || log.startsWith(">") || log.includes("[sys] TX:");
  const logLower = log.toLowerCase();
  const isErrorVal = 
    logLower.includes("error") || 
    logLower.includes("failed") || 
    logLower.includes("invalid") || 
    logLower.includes("stopped") || 
    logLower.includes("abort") || 
    logLower.includes("exception") || 
    logLower.includes("no data") || 
    log.includes("?");
  
  let content = log;
  let timestamp = "";
  const tsMatch = log.match(/^\[(.*?)\]/);
  if (tsMatch) {
    timestamp = tsMatch[1];
    content = content.replace(/^\[.*?\]\s*/, "");
  }
  
  content = content.replace(/^(TX:|RX:|>\s*|\[sys\]\s*TX:|\[sys\]\s*RX:)\s*/i, "");
  
  return {
    raw: log,
    isTx: isTxVal,
    isError: isErrorVal,
    timestamp,
    content,
  };
};

interface CommandTransaction {
  id: string;
  tx: ReturnType<typeof parseLogLine> | null;
  responses: ReturnType<typeof parseLogLine>[];
}

// Custom grouping algorithm that packs flat oldest-to-newest logs into transaction sets
const parseTransactions = (flatLogs: string[]): CommandTransaction[] => {
  // Since flatLogs are stored newest-first in useObdTelemetry (setLogs([newVal, ...prev])),
  // we copy and reverse them to process chronologically
  const chronological = [...flatLogs].reverse();
  const transactions: CommandTransaction[] = [];
  
  let currentTx: CommandTransaction | null = null;
  
  chronological.forEach((log, index) => {
    const parsed = parseLogLine(log);
    
    if (parsed.isTx) {
      if (currentTx) {
        transactions.push(currentTx);
      }
      currentTx = {
        id: `tx-${index}-${parsed.timestamp}-${parsed.content}`,
        tx: parsed,
        responses: [],
      };
    } else {
      if (currentTx) {
        currentTx.responses.push(parsed);
      } else {
        currentTx = {
          id: `orphan-${index}-${parsed.timestamp}`,
          tx: null,
          responses: [parsed],
        };
      }
    }
  });
  
  if (currentTx) {
    transactions.push(currentTx);
  }
  
  return transactions;
};

const getTransactionDate = (t: CommandTransaction): Date | null => {
  const ts = t.tx?.timestamp || (t.responses[0]?.timestamp);
  if (ts && ts !== "sys") {
    if (ts.includes("-")) {
      const cleanTs = ts.trim().replace(" ", "T");
      const d = new Date(cleanTs);
      if (!isNaN(d.getTime())) return d;
    } else if (ts.includes(":")) {
      const todayStr = new Date().toISOString().split("T")[0];
      const d = new Date(`${todayStr}T${ts.trim()}`);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
};

// ResponseLineItem handles individual line truncation and folding to prevent layout disruption with huge outputs
const ResponseLineItem = memo(function ResponseLineItem({ resp, codeScanEnabled }: { resp: ReturnType<typeof parseLogLine>, codeScanEnabled?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const isTooLong = resp.content.length > 80;
  
  const displayedContent = isTooLong && !expanded 
    ? `${resp.content.substring(0, 80)}...` 
    : resp.content;

  const renderHighlightedContent = (content: string) => {
    if (!codeScanEnabled) return content;
    const parts = content.split(/(error|failed|invalid|exception|abort|syntax error|no data)/gi);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <span key={i} className="bg-red-500/20 text-red-400 font-bold border border-red-500/50 px-1 rounded mx-0.5 animate-pulse">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className={`flex items-start gap-3 text-sm py-0.5 ${resp.isError ? "text-red-500" : "text-[#00ff41]/80"}`}>
      <span className="text-[10px] text-[#00ff41]/40 select-none flex-shrink-0 mt-0.5 font-bold uppercase w-6 text-center">
        RX
      </span>
      <span className="text-[#00ff41]/20 select-none">|</span>
      {resp.timestamp && (
        <span className="text-[#00ff41]/30 text-xs font-mono mt-0.5 select-none">
          [{resp.timestamp}]
        </span>
      )}
      <div className="flex-1 font-mono break-all text-xs md:text-sm">
        <span>{renderHighlightedContent(displayedContent)}</span>
        {isTooLong && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="ml-2 px-1.5 py-0.5 rounded bg-[#00ff41]/10 text-[#00ff41] hover:bg-[#00ff41]/20 text-[10px] select-none align-middle font-sans transition-colors border border-[#00ff41]/20 outline-none"
          >
            {expanded ? "Fold" : `Expand (${resp.content.length} chars)`}
          </button>
        )}
      </div>
    </div>
  );
});

export const TerminalScreen = ({
  onBack,
  onCommand,
  logs = [],
}: {
  onBack: () => void;
  onCommand: (cmd: string) => void;
  logs?: string[];
}) => {
  const [input, setInput] = useState("");
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [codeScanEnabled, setCodeScanEnabled] = useState(false);
  const [collapsedTxIds, setCollapsedTxIds] = useState<Record<string, boolean>>({});
  const logEndRef = useRef<HTMLDivElement>(null);

  // "all" | "no-system" (hides system initialization stream/orphans) | "commands" (raw commands and replies) | "errors"
  const [filterMode, setFilterMode] = useState<"all" | "no-system" | "commands" | "errors">("all");

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Parse transactions for rendering folding nodes
  const transactions = useMemo(() => parseTransactions(logs), [logs]);

  // Apply filtering logic to find matching transaction telemetry frames with status & date constraints
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
    // 1. Category Status Filters
    if (filterMode === "no-system") {
      if (t.tx === null) return false;
    }
    if (filterMode === "commands") {
      if (t.tx === null) return false;
    }
    if (filterMode === "errors") {
      const txHasError = t.tx?.isError || false;
      const rxHasError = t.responses.some(r => r.isError);
      if (!txHasError && !rxHasError) return false;
    }

    // 2. Date-Range Session filter bounds
    const tDate = getTransactionDate(t);
    if (startDate || endDate) {
      if (!tDate) {
        // Fallback check: if timestamp is unparsed or "sys", check if today falls inside range
        const today = new Date();
        if (startDate) {
          const start = new Date(`${startDate}T00:00:00`);
          if (today < start) return false;
        }
        if (endDate) {
          const end = new Date(`${endDate}T23:59:59`);
          if (today > end) return false;
        }
      } else {
        if (startDate) {
          const start = new Date(`${startDate}T00:00:00`);
          if (tDate < start) return false;
        }
        if (endDate) {
          const end = new Date(`${endDate}T23:59:59`);
          if (tDate > end) return false;
        }
      }
    }

    return true; // "all"
  });
  }, [transactions, filterMode, startDate, endDate]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, filterMode, startDate, endDate]);

  const handleSend = () => {
    if (!input.trim()) return;
    onCommand(input.trim());
    setInput("");
  };

  const handleExport = () => {
    if (logs.length === 0) {
      toast.show("No logs to export", "info");
      return;
    }
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,Type,Data\n"
      + logs.map(e => {
        const type = e.includes("TX:") ? "TX" : "RX";
        const match = e.match(/\[(.*?)\]/);
        const tstamp = match ? match[1] : new Date().toLocaleTimeString();
        const raw = e.replace(/\[.*?\]\s*(TX|RX):\s*/, "").replace(/"/g, '""');
        return `"${tstamp}","${type}","${raw}"`;
      }).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TorquePro_Log_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.show("Logs exported as CSV for Torque Pro", "success");
  };

  // Toggles collapsing for *all* transactions that contain outputs
  const handleToggleAllFolds = () => {
    const hasAnyCollapsed = transactions.some(t => t.responses.length > 0 && collapsedTxIds[t.id]);
    
    if (hasAnyCollapsed) {
      // If any is collapsed, unfold all
      setCollapsedTxIds({});
    } else {
      // Otherwise, fold all that have response outputs
      const nextCollapsed: Record<string, boolean> = {};
      transactions.forEach(t => {
        if (t.responses.length > 0) {
          nextCollapsed[t.id] = true;
        }
      });
      setCollapsedTxIds(nextCollapsed);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`absolute inset-0 bg-[#000000] ${crtEnabled ? "scanlines-pattern" : ""} flex flex-col pt-8 pb-32 z-20`}
    >
      <div className="flex items-center gap-3 px-6 mb-4 relative z-10">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-white/10 text-[#00ff41] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className={`flex items-center gap-2 text-[#00ff41] ${crtEnabled ? "crt-text" : ""}`}>
          <Terminal className="w-5 h-5" />
          <h2 className="text-xl font-black uppercase tracking-widest text-[#00ff41]">
            Terminal
          </h2>
        </div>
        <div className="ml-auto flex gap-2">
          {/* Collapse/Expand All Outputs */}
          <button
            onClick={handleToggleAllFolds}
            disabled={transactions.length === 0}
            className="p-2 border border-[#00ff41]/30 rounded-md text-[#00ff41]/70 hover:bg-[#00ff41]/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Toggle All Log Folding"
          >
            <ChevronsUpDown className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setCodeScanEnabled(prev => !prev)}
            className={`p-2 border border-[#00ff41]/30 rounded-md transition-colors ${codeScanEnabled ? "bg-[#00ff41]/20 text-[#00ff41]" : "text-[#00ff41]/70 hover:bg-[#00ff41]/10"}`}
            title="Toggle Code Scan"
          >
            <TextSearch className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setCrtEnabled(prev => !prev)}
            className={`p-2 border border-[#00ff41]/30 rounded-md transition-colors ${crtEnabled ? "bg-[#00ff41]/20 text-[#00ff41]" : "text-[#00ff41]/70 hover:bg-[#00ff41]/10"}`}
            title="Toggle CRT Scanlines"
          >
            <Tv className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleExport}
            className="p-2 border border-[#00ff41]/30 rounded-md text-[#00ff41]/70 hover:bg-[#00ff41]/10 transition-colors"
            title="Export CSV for Torque Pro"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => toast.show("Scripts not implemented", "info")}
            className="p-2 border border-[#00ff41]/30 rounded-md text-[#00ff41]/70 hover:bg-[#00ff41]/10 transition-colors"
            title="Save Command Script"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto px-6 font-mono text-sm mb-4 space-y-3 no-scrollbar ${crtEnabled ? "crt-text" : ""} relative z-10`}>
        <div className="text-[#00ff41]/50 mb-4 border-b border-[#00ff41]/20 pb-4">
          FORGE OS SECURE TERMINAL<br/>
          CONNECTION ESTABLISHED: OBD-II / CAN<br/>
          PROTOCOL: ISO 15765-4 (CAN 11/500)<br/>
          SYSTEM v4.5 ONLINE
        </div>
        
        {/* INTERACTIVE NEON FILTER CONTROL PANEL */}
        <div className="bg-[#00ff41]/5 border border-[#00ff41]/20 p-4 rounded-none space-y-4 mb-6" id="terminal-filter-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00ff41] uppercase tracking-wider select-none">
              <span className="w-1.5 h-1.5 bg-[#00ff41] rounded-full animate-pulse" />
              <span>Telemetry Stream Filter Matrix:</span>
            </div>
            
            {/* Quick Presets for Date Range */}
            <div className="flex gap-2.5 items-center">
              <span className="text-[9px] text-[#00ff41]/50 uppercase tracking-widest font-mono">Date Presets:</span>
              <button
                id="preset-btn-today"
                onClick={() => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  setStartDate(todayStr);
                  setEndDate(todayStr);
                  toast.show("Range set to today's records.", "success");
                }}
                className="text-[9px] px-2 py-1 bg-[#00ff41]/10 text-[#00ff41] hover:bg-[#00ff41]/25 border border-[#00ff41]/30 uppercase transition-all cursor-pointer"
              >
                Today
              </button>
              <button
                id="preset-btn-clear"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  toast.show("Resetting all historical sessions.", "info");
                }}
                className="text-[9px] px-2 py-1 bg-white/5 text-zinc-400 hover:text-[#00ff41] hover:bg-[#00ff41]/20 border border-white/10 hover:border-[#00ff41]/30 uppercase transition-all cursor-pointer"
              >
                Clear Range
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              id="filter-btn-all"
              onClick={() => {
                setFilterMode("all");
                toast.show("Displaying all telemetry sequence frames.", "info");
              }}
              className={`text-[10px] px-3.5 py-1.5 border uppercase font-mono tracking-widest transition-all cursor-pointer ${
                filterMode === "all"
                  ? "bg-[#00ff41] text-black border-[#00ff41] font-extrabold"
                  : "bg-transparent text-[#00ff41]/70 border-[#00ff41]/30 hover:border-[#00ff41] hover:text-[#00ff41]"
              }`}
            >
              [ All Frames ]
            </button>
            <button
              id="filter-btn-no-sys"
              onClick={() => {
                setFilterMode("no-system");
                toast.show("Filtered: Hiding start-up stream & beacon logs.", "info");
              }}
              className={`text-[10px] px-3.5 py-1.5 border uppercase font-mono tracking-widest transition-all cursor-pointer ${
                filterMode === "no-system"
                  ? "bg-[#00ff41] text-black border-[#00ff41] font-extrabold"
                  : "bg-transparent text-[#00ff41]/70 border-[#00ff41]/30 hover:border-[#00ff41] hover:text-[#00ff41]"
              }`}
            >
              [ Hide System Info ]
            </button>
            <button
              id="filter-btn-commands"
              onClick={() => {
                setFilterMode("commands");
                toast.show("Filtered: Focusing only on HEX commands & direct responses.", "info");
              }}
              className={`text-[10px] px-3.5 py-1.5 border uppercase font-mono tracking-widest transition-all cursor-pointer ${
                filterMode === "commands"
                  ? "bg-[#00ff41] text-black border-[#00ff41] font-extrabold"
                  : "bg-transparent text-[#00ff41]/70 border-[#00ff41]/30 hover:border-[#00ff41] hover:text-[#00ff41]"
              }`}
            >
              [ Raw Cmd/Resp ]
            </button>
            <button
              id="filter-btn-errors"
              onClick={() => {
                setFilterMode("errors");
                toast.show("Filtered: Querying system faults & query anomalies.", "info");
              }}
              className={`text-[10px] px-3.5 py-1.5 border uppercase font-mono tracking-widest transition-all cursor-pointer ${
                filterMode === "errors"
                  ? "bg-[#00ff41]/20 text-red-400 border-red-500 font-extrabold shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                  : "bg-transparent text-red-500/70 border-red-500/30 hover:border-red-500 hover:text-red-400"
              }`}
            >
              [ Faults & Errors Only ]
            </button>
          </div>

          {/* Date Picker Range Row */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#00ff41]/10 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff41]/50 text-[10px] uppercase tracking-widest">Session Start:</span>
              <input
                type="date"
                id="input-start-date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  toast.show(`Start boundary set: ${e.target.value}`, "info");
                }}
                className="bg-black/80 text-[#00ff41] border border-[#00ff41]/30 rounded-none px-2 py-1 text-xs focus:outline-none focus:border-[#00ff41] select-none [color-scheme:dark]"
              />
            </div>
            
            <span className="text-[#00ff41]/30 hidden sm:inline">|</span>

            <div className="flex items-center gap-2">
              <span className="text-[#00ff41]/50 text-[10px] uppercase tracking-widest">Session End:</span>
              <input
                type="date"
                id="input-end-date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  toast.show(`End boundary set: ${e.target.value}`, "info");
                }}
                className="bg-black/80 text-[#00ff41] border border-[#00ff41]/30 rounded-none px-2 py-1 text-xs focus:outline-none focus:border-[#00ff41] select-none [color-scheme:dark]"
              />
            </div>

            {(startDate || endDate) && (
              <span className="ml-auto text-[10px] text-[#00ff41] font-bold animate-pulse uppercase tracking-wider">
                ⚡ Active Session Frame Focus Mode
              </span>
            )}
          </div>
        </div>
        
        {/* Render filtered transactions as folded/unfolded groups */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 border border-[#00ff41]/20 bg-[#00ff41]/5 text-[#00ff41]/40 text-xs font-mono uppercase tracking-widest leading-relaxed">
            -- NO VALID TELEMETRY SEQUENCE FRAMES UNDER FILTER "{filterMode.replace("-", " ")}" --
          </div>
        ) : (
          filteredTransactions.map((t) => {
          const isCollapsed = !!collapsedTxIds[t.id];
          const hasResponses = t.responses.length > 0;
          
          if (!t.tx) {
            // Orphan start-up system initialization logs
            return (
              <div key={t.id} className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-3 rounded-none relative">
                <div className="flex items-center gap-2 mb-2 text-xs text-[#00ff41]/50 select-none font-bold uppercase transition-opacity">
                  <Terminal className="w-3.5 h-3.5 text-[#00ff41]/40" />
                  <span>System Diagnostics Stream</span>
                  {hasResponses && (
                    <button 
                      onClick={() => setCollapsedTxIds(prev => ({ ...prev, [t.id]: !isCollapsed }))} 
                      className="ml-auto bg-[#00ff41]/10 border border-[#00ff41]/20 px-2 py-0.5 text-[#00ff41] hover:bg-[#00ff41]/20 rounded-sm text-[10px]"
                    >
                      {isCollapsed ? "[+] Unfold Info" : "[-] Fold Info"}
                    </button>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="space-y-1">
                    {t.responses.map((resp, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-[#00ff41]/70 font-mono text-xs">
                        <span className="opacity-50 select-none flex-shrink-0">RX</span>
                        <span className="opacity-30">|</span>
                        <span className="break-all">
                          {codeScanEnabled ? (() => {
                            const parts = resp.content.split(/(error|failed|invalid|exception|abort|syntax error|no data)/gi);
                            return parts.map((part, i) => i % 2 === 1 ? <span key={i} className="bg-red-500/20 text-red-400 font-bold border border-red-500/50 px-1 rounded mx-0.5 animate-pulse">{part}</span> : part);
                          })() : resp.content}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Transmit-Receive command block with interactive fold
          return (
            <div key={t.id} className="border border-[#00ff41]/20 bg-black/40 rounded-none overflow-hidden hover:bg-black/60 transition-colors">
              {/* Header Command line representing the transmitter TX trigger */}
              <div 
                onClick={() => hasResponses && setCollapsedTxIds(prev => ({ ...prev, [t.id]: !isCollapsed }))}
                className={`flex items-center gap-3 px-3 py-2.5 select-none user-none ${hasResponses ? "cursor-pointer hover:bg-[#00ff41]/5" : "pointer-events-none"}`}
              >
                {/* Expand / Collapse Icon */}
                {hasResponses ? (
                  <span className="text-[#00ff41] flex-shrink-0">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-[#00ff41]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#00ff41]" />
                    )}
                  </span>
                ) : (
                  <span className="w-4 h-4 flex-shrink-0" />
                )}
                
                {/* Green TX Indicator Badge */}
                <span className="bg-[#00ff41]/10 text-[#00ff41] text-[10px] font-black px-1.5 py-0.5 rounded border border-[#00ff41]/20 flex-shrink-0 select-none">
                  TX
                </span>
                
                {/* Timestamp tag */}
                {t.tx.timestamp && (
                  <span className="text-[#00ff41]/40 text-xs font-mono select-none">
                    [{t.tx.timestamp}]
                  </span>
                )}
                
                {/* Command text content */}
                <span className="text-[#00ff41] font-bold font-mono text-sm break-all">
                  {t.tx.content}
                </span>

                {/* Badge telling you how many lines or bytes are folded */}
                {hasResponses && isCollapsed && (
                  <span className="ml-auto bg-[#00ff41]/15 text-[#00ff41]/70 border border-[#00ff41]/20 text-[10px] px-2 py-0.5 rounded font-mono select-none">
                    {t.responses.length} output line{t.responses.length > 1 ? "s" : ""} folded
                  </span>
                )}
              </div>

              {/* Foldable Content containing individual RX packages with line folding */}
              {!isCollapsed && hasResponses && (
                <div className="border-t border-[#00ff41]/15 bg-[#00ff41]/2 pl-8 pr-3 py-2 space-y-1.5 relative">
                  {/* Visual vertical connector rail */}
                  <div className="absolute left-[21px] top-0 bottom-4 w-[1px] bg-[#00ff41]/15 pointer-events-none" />

                  {t.responses.map((resp, idx) => (
                    <ResponseLineItem key={idx} resp={resp} codeScanEnabled={codeScanEnabled} />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

        {/* Flashing cursor sequence line */}
        <div className="flex items-start gap-3 text-[#00ff41] animate-pulse py-1">
           <span className="opacity-50 select-none flex-shrink-0">TX</span>
           <span className="opacity-30">|</span>
           <span className="w-2 h-4 bg-[#00ff41] inline-block" />
        </div>
        <div ref={logEndRef} />
      </div>

      <div className="px-6 relative z-10">
        <div className="relative group">
            <div className="absolute inset-0 bg-[#00ff41]/5 blur-md rounded-none pointer-events-none transition-opacity opacity-0 group-focus-within:opacity-100" />
            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="ENTER HEX COMMAND_ (e.g. 01 0C)"
            className={`w-full bg-black/80 border-2 border-[#00ff41]/20 p-4 text-[#00ff41] font-mono text-sm uppercase outline-none focus:border-[#00ff41] transition-colors pr-14 placeholder:text-[#00ff41]/30 placeholder:normal-case rounded-none ${crtEnabled ? "crt-text" : ""}`}
            />
            <button
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#00ff41]/10 text-[#00ff41] hover:bg-[#00ff41] hover:text-black transition-colors rounded-none outline-none focus:bg-[#00ff41] focus:text-black"
            >
            <Send className="w-4 h-4" />
            </button>
        </div>
      </div>
    </motion.div>
  );
};
