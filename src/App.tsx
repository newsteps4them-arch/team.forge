import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Sparkles,
  Hammer,
  ChevronRight,
  User,
  Cpu,
  Key,
  Car,
  CheckCircle2,
  MessageSquare,
  Wrench,
  Layers,
  BookOpen,
  Bot,
  ArrowUp,
  ArrowLeft,
  Calculator,
  HardHat,
  Eye,
  EyeOff,
  Camera,
  ImageIcon,
  Code,
  Mic,
  Trash2,
  Edit2,
  X,
  Save,
  LogOut,
  Search,
  Plus,
  Calendar,
  Flag,
  Terminal,
  Activity,
  RefreshCw,
  Zap,
  Bluetooth,
  Link as LinkIcon,
  ExternalLink,
  Wifi,
  Usb,
  Home,
  Gauge,
  ToggleLeft,
  Database,
  BarChart3,
  FileText,
  ShieldAlert,
  Truck,
  Package,
  CheckCircle,
  Flame,
  Thermometer,
  Plug,
  ScanEye,
} from "lucide-react";
import Markdown from "react-markdown";
import { NotificationContainer } from "./components/NotificationContainer";
import { BottomNavBar } from "./components/BottomNavBar";
import { TopStatusBar } from "./components/TopStatusBar";
import { NavigationDrawer } from "./components/NavigationDrawer";
import { LiveDataScreen } from "./screens/diagnostics/LiveDataScreen";
import { CodingScreen } from "./screens/main/CodingScreen";
import { TerminalScreen } from "./screens/diagnostics/TerminalScreen";
import { IntegrationsScreen } from "./screens/inventory/IntegrationsScreen";
import { ALL_INTEGRATION_IDS } from "./constants/integrations";
import { EstimatorScreen } from "./screens/main/EstimatorScreen";
import { TopologyScreen } from "./screens/diagnostics/TopologyScreen";
import { IndexScreen } from "./screens/main/IndexScreen";
import { GarageScreen } from "./screens/main/GarageScreen";
import { KnowledgeBaseScreen } from "./screens/main/KnowledgeBaseScreen";
import { PartsCatalogScreen } from "./screens/inventory/PartsCatalogScreen";
import { CrmDashboardScreen } from "./screens/main/CrmDashboardScreen";
import { DviScreen } from "./screens/main/DviScreen";
import { TimeClockScreen } from "./screens/main/TimeClockScreen";
import { VoiceCloneScreen } from "./screens/main/VoiceCloneScreen";
import { AnalyticsScreen } from "./screens/main/AnalyticsScreen";
import { GoToMarketScreen } from "./screens/main/GoToMarketScreen";
import { VisualInspectorScreen } from "./screens/main/VisualInspectorScreen";
import { GuidedDiagnosticsScreen } from "./screens/diagnostics/GuidedDiagnosticsScreen";
import { OscilloscopeScreen } from "./screens/diagnostics/OscilloscopeScreen";
import { WiringDiagramsScreen } from "./screens/main/WiringDiagramsScreen";
import { AdasCalibrationScreen } from "./screens/diagnostics/AdasCalibrationScreen";
import { CameraCapture } from "./components/CameraCapture";
import { SettingsScreen } from "./screens/settings/SettingsScreen";
import { MainDashboard } from "./screens/main/MainDashboard";
import { toast } from "./lib/notifications";
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  GoogleAuthProviderClass,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "./lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import { generateChatResponse } from "./services/geminiService";
import { useNavigation, Screen } from "./hooks/useNavigation";
import { useObdTelemetry } from "./hooks/useObdTelemetry";
import { ObdConnection, WebBluetoothObd, WebSerialObd, SimulatedObd } from "./lib/obdConnection";

// --- Utilities ---
enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.warn("Firestore Operation Notice: ", JSON.stringify(errInfo));
}
type DTC = {
  code: string;
  description: string;
  status: "Stored" | "Pending" | "Permanent";
};

type OnboardingData = {
  assistantName: string;
  wakeWord: string;
  customVoiceEnabled: boolean;
  customVoiceUrl: string | null;
  userName: string;
  apiKey: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleVin: string;
  vehicleProtocol: string;
  vehicleInfo: string;
  inventory: string;
  meliApiKey: string;
  alldataKey: string;
  obdKey: string;
  openAiKey: string;
  onboardingComplete: boolean;
};

type Screen =
  | "Welcome"
  | "NameAssistant"
  | "WakeWord"
  | "VoiceClone"
  | "AboutYou"
  | "Inventory"
  | "Vehicles"
  | "Garage"
  | "KnowledgeBase"
  | "Ready"
  | "Settings"
  | "Main"
  | "Chat"
  | "Diagnostics"
  | "LiveData"
  | "Coding"
  | "Terminal"
  | "Integrations"
  | "Estimator"
  | "Topology"
  | "Analytics"
  | "VisualInspector"
  | "GuidedDiagnostics"
  | "Oscilloscope"
  | "WiringDiagrams"
  | "Index"
  | "PartsCatalog"
  | "CrmDashboard"
  | "DviModule"
  | "TimeClock"
  | "GoToMarket"
  | "AdasCalibration";
type AssistantMode =
  | "Operations"
  | "Diagnostics Lead"
  | "Performance Tuner"
  | "Electrical Eng."
  | "Estimator"
  | "Forge Coder"
  | "Forge Developer"
  | "Fleet Manager"
  | "Parts Specialist"
  | "Quality Inspector"
  | "Heavy Equip. Tech"
  | "HVAC Technician"
  | "Field Welder"
  | "Master Electrician";
type ChatMessage = { role: "user" | "model" | "system"; text: string; image?: string; id?: string };

type Task = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  category?: string;
  priority: "Low" | "Medium" | "High";
  dueDate?: string;
  userId: string;
  projectId: string;
  updatedAt?: any;
};

type Project = {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  userId: string;
  color?: string;
};

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  category?: string;
  userId: string;
};

// --- Components ---

const ChatHistoryWidget = ({
  user,
  activeProject,
  setCurrentScreen,
}: {
  user: FirebaseUser | null;
  activeProject: string;
  setCurrentScreen: (screen: Screen) => void;
}) => {
  const [recentChats, setRecentChats] = useState<{ id: string; text: string; role: string; createdAt: number }[]>([]);

  useEffect(() => {
    if (!user || !activeProject) return;
    const q = query(
      collection(db, "chats"),
      where("userId", "==", user.uid),
      where("projectId", "==", activeProject)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as any))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 5);
      setRecentChats(fetchedMessages);
    });
    return () => unsubscribe();
  }, [user, activeProject]);

  if (!recentChats.length) return null;

  return (
    <div className="mb-6 bg-card/40 border border-white/5 rounded-[2.5rem] p-6 shadow-xl text-left">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          Recent Consultations
        </span>
      </div>
      <div className="space-y-3">
        {recentChats.map((chat) => (
          <div key={chat.id} className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1">
            <span className="text-[9px] mb-1 uppercase tracking-[0.2em] font-bold" style={{ color: chat.role === "user" ? "#4CAF50" : chat.role === "system" ? "#2196F3" : "#F5A623" }}>
              {chat.role === "user" ? "You" : chat.role === "system" ? "Diagnostic Logs" : "Forge Team"}
            </span>
            <div className="text-sm text-text-primary line-clamp-2">
              <Markdown>{chat.text}</Markdown>
            </div>
            <span className="text-[9px] text-text-dim mt-1 font-mono">
              {new Date(chat.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={() => setCurrentScreen("Chat")}
        className="w-full mt-4 bg-white/5 py-3 rounded-full text-text-primary text-[10px] font-extrabold uppercase tracking-widest hover:bg-white/10 transition-colors"
      >
        Open Chat Terminal
      </button>
    </div>
  );
};

const TaskItem = ({
  task,
  onToggle,
  onDelete,
  onEdit,
  selected,
  onSelect,
  themeColor = "#F5A623",
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (text: string) => void;
  selected: boolean;
  onSelect: () => void;
  themeColor?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [showModal, setShowModal] = useState(false);

  const handleSave = () => {
    if (editText.trim() && editText !== task.text) {
      onEdit(editText.trim());
    }
    setIsEditing(false);
    setShowModal(false);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          borderColor: selected ? themeColor : "rgba(255,255,255,0.05)",
          backgroundColor: selected
            ? `${themeColor}0D`
            : task.completed
              ? "rgba(0,0,0,0.2)"
              : "rgba(255,255,255,0.03)",
        }}
        className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all ${task.completed ? "opacity-60" : "hover:border-white/20"}`}
      >
        <div className="flex items-center gap-3 flex-shrink-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            style={{ color: themeColor }}
            className="w-4 h-4 rounded border-white/20 bg-transparent focus:ring-opacity-20 transition-all cursor-pointer"
          />
          <button
            onClick={onToggle}
            style={{
              backgroundColor: task.completed ? themeColor : "transparent",
              borderColor: task.completed
                ? themeColor
                : "rgba(255,255,255,0.2)",
            }}
            className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 text-black"
          >
            <AnimatePresence mode="wait">
              {task.completed && (
                <motion.div
                  key="checked"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            {isEditing ? (
              <input
                autoFocus
                className="w-full bg-transparent border-none outline-none text-sm text-text-primary p-0 m-0 font-medium"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className={`text-sm font-medium truncate cursor-text ${task.completed ? "line-through text-text-dim" : "text-text-primary"}`}
              >
                {task.text}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              {task.category && (
                <div
                  style={{
                    color: themeColor,
                    backgroundColor: `${themeColor}1A`,
                  }}
                  className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest font-bold"
                >
                  {task.category}
                </div>
              )}
              <div
                className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest font-bold ${
                  task.priority === "High"
                    ? "bg-red-500/20 text-red-500"
                    : task.priority === "Medium"
                      ? "bg-orange-500/20 text-orange-500"
                      : "bg-blue-500/20 text-blue-500"
                }`}
              >
                {task.priority}
              </div>
              {task.dueDate && (
                <div className="text-[9px] text-text-dim font-mono uppercase tracking-widest">
                  Due: {task.dueDate}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              setEditText(task.text);
              setShowModal(true);
            }}
            className="p-1.5 text-text-dim hover:text-white transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-text-dim hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-surface border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-display font-bold text-text-primary">
                  Edit Task
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-text-dim hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <textarea
                autoFocus
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium mb-6 min-h-[120px] resize-none"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="What needs to be done?"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-full border border-white/10 text-text-secondary font-bold text-sm hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-full bg-primary text-black font-bold text-sm shadow-[0_0_20px_rgba(245,166,35,0.3)] hover:shadow-[0_0_30px_rgba(245,166,35,0.5)] transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const WelcomeScreen = ({
  onNext,
  onLogin,
  onLoginAnon,
}: {
  onNext: () => void;
  onLogin: () => void;
  onLoginAnon: () => void;
}) => {
  const [embers] = React.useState(() => {
    return [...Array(12)].map((_, i) => ({
      id: i,
      x: Math.random() * 50 - 25,
      y: Math.random() * -100,
      duration: 4 + Math.random() * 5,
      width: `${2 + Math.random() * 4}px`,
      height: `${2 + Math.random() * 4}px`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }));
  });

  return (
    <div className="flex flex-col justify-between h-full py-12 px-8 bg-[#000] overflow-hidden relative">
      {/* Cinematic Grid Background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(245,166,35,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.05) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ember decoration */}
      <div className="absolute inset-0 pointer-events-none">
        {embers.map((ember) => (
          <motion.div
            key={ember.id}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.1, 0.5, 0.1],
              scale: [1, 1.8, 1],
              x: [0, ember.x, 0],
              y: [0, ember.y, 0],
            }}
            transition={{
              duration: ember.duration,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute rounded-full bg-primary shadow-[0_0_20px_rgba(245,166,35,0.9)]"
            style={{
              width: ember.width,
              height: ember.height,
              left: ember.left,
              top: ember.top,
            }}
          />
        ))}
        {/* Glow ambient */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.2, 1, 0.3, 1] }}
        className="flex-1 flex flex-col items-center justify-center text-center space-y-16 relative z-10"
      >
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="w-28 h-28 bg-[#111] rounded-[2.5rem] border-2 border-primary/40 shadow-[0_0_40px_rgba(245,166,35,0.2)] flex items-center justify-center mb-10 group"
          >
            <Hammer className="text-primary w-12 h-12 group-hover:scale-110 transition-transform" />
          </motion.div>
          <div className="space-y-4">
            <h1 className="text-7xl font-black tracking-tighter text-white font-display leading-[0.8] mb-2 uppercase">
              Team
              <br />
              <span className="text-primary">Forge</span>
            </h1>
            <div className="h-1.5 w-24 bg-primary mx-auto rounded-full" />
          </div>
        </div>

        <div className="space-y-4 max-w-[280px]">
          <p className="text-2xl font-black text-white/90 tracking-tight leading-tight">
            Multidisciplinary Engineering Suite.
          </p>
          <p className="text-[11px] text-text-dim text-center leading-relaxed">
            Your centralized hub for organizing projects, diagnosing vehicles
            via OBD-II, and accessing specialized AI experts.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-text-dim border border-white/5 font-mono">
              HARDWARE
            </div>
            <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-text-dim border border-white/5 font-mono">
              SOFTWARE
            </div>
            <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-text-dim border border-white/5 font-mono">
              DESIGN
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="relative z-10 space-y-5"
      >
        <button
          onClick={onLogin}
          className="w-full bg-[#111] hover:bg-[#151515] py-5 px-8 rounded-[1.5rem] text-white font-black text-[13px] uppercase tracking-[0.2em] transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-4 group"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5 group-hover:rotate-[360deg] transition-transform duration-500"
          />
          Authenticate User
        </button>
        <div className="flex items-center gap-4 px-4">
          <div className="h-[2px] bg-white/5 flex-1" />
          <span className="text-[10px] text-text-dim uppercase tracking-[0.4em] font-black">
            Secure Entry
          </span>
          <div className="h-[2px] bg-white/5 flex-1" />
        </div>
        <button
          onClick={onLoginAnon}
          className="w-full bg-primary py-5 px-8 rounded-[1.5rem] text-black font-black text-[15px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-[0_15px_40px_rgba(245,166,35,0.4)] hover:shadow-[0_20px_50px_rgba(245,166,35,0.6)] flex items-center justify-center gap-2 group"
        >
          Initialize Workspace
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </div>
  );
};


const SetupScreen = ({
  title,
  subtitle,
  icon: Icon,
  placeholder,
  value,
  onChange,
  onNext,
  optional = false,
}: {
  title: string;
  subtitle: string;
  icon: any;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
  optional?: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full bg-[#050505] hardware-pattern p-8 relative"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Icon className="w-64 h-64 text-text-primary" />
      </div>
      <div className="flex-1 mt-20 relative z-10">
        <div className="bg-surface w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-10 border border-white/5 shadow-lg">
          <Icon className="text-primary w-8 h-8 drop-shadow-[0_0_10px_rgba(245,166,35,0.5)]" />
        </div>

        <h2 className="text-4xl font-display font-bold text-text-primary mb-3 leading-tight tracking-tight">
          {title}
        </h2>
        <p className="text-text-secondary text-lg mb-12 tracking-wide">
          {subtitle}
        </p>

        <div className="relative group">
          <input
            type="text"
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-surface/50 border border-border/50 rounded-2xl py-6 px-6 text-xl text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner"
            onKeyDown={(e) =>
              e.key === "Enter" && (optional || value.trim()) && onNext()
            }
          />
        </div>
      </div>

      <div className="mb-8 relative z-10">
        <button
          disabled={!optional && !value.trim()}
          onClick={onNext}
          className="w-full bg-primary disabled:bg-surface disabled:text-text-dim py-5 rounded-full text-black font-extrabold text-[15px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:active:scale-100 shadow-[0_0_20px_rgba(245,166,35,0.2)] disabled:shadow-none"
        >
          {optional && !value.trim() ? "Skip" : "Continue"}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

const VehicleSetupScreen = ({
  onboarding,
  updateData,
  onNext,
}: {
  onboarding: OnboardingData;
  updateData: (key: keyof OnboardingData, value: any) => void;
  onNext: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full bg-[#050505] hardware-pattern p-8 relative"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Car className="w-64 h-64 text-text-primary" />
      </div>
      <div className="flex-1 mt-10 relative z-10 overflow-y-auto no-scrollbar pb-10">
        <div className="bg-surface w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-10 border border-white/5 shadow-lg">
          <Car className="text-primary w-8 h-8 drop-shadow-[0_0_10px_rgba(245,166,35,0.5)]" />
        </div>

        <h2 className="text-4xl font-display font-bold text-text-primary mb-3 leading-tight tracking-tight">
          Target Hardware
        </h2>
        <p className="text-text-secondary text-lg mb-8 tracking-wide">
          Enter your primary physical asset or vehicle details for precision diagnostics.
        </p>

        <div className="space-y-6 max-w-md">
          <div className="relative group">
            <label className="text-[10px] uppercase tracking-widest text-text-dim mb-1.5 block font-bold">
              Model Year / Era
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={onboarding.vehicleYear}
              onChange={(e) => updateData("vehicleYear", e.target.value)}
              placeholder="e.g. 2024"
              className="w-full bg-surface/50 border border-border/50 rounded-2xl py-4 px-6 text-lg text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative group">
              <label className="text-[10px] uppercase tracking-widest text-text-dim mb-1.5 block font-bold">
                Make (Manufacturer)
              </label>
              <input
                type="text"
                value={onboarding.vehicleMake}
                onChange={(e) => updateData("vehicleMake", e.target.value)}
                placeholder="e.g. Toyota, Trane, Boeing"
                className="w-full bg-surface/50 border border-border/50 rounded-2xl py-4 px-6 text-lg text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner"
              />
            </div>
            <div className="relative group">
              <label className="text-[10px] uppercase tracking-widest text-text-dim mb-1.5 block font-bold">
                Model (Configuration)
              </label>
              <input
                type="text"
                value={onboarding.vehicleModel}
                onChange={(e) => updateData("vehicleModel", e.target.value)}
                placeholder="e.g. RAV4, XV20i"
                className="w-full bg-surface/50 border border-border/50 rounded-2xl py-4 px-6 text-lg text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="relative group">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] uppercase tracking-widest text-text-dim block font-bold">
                VIN / Serial Number (Optional)
              </label>
              {onboarding.vehicleVin && onboarding.vehicleVin.trim().length >= 5 && (
                <button
                  type="button"
                  onClick={handleDecodeVin}
                  disabled={isDecodingVin}
                  className="text-[9px] uppercase tracking-wider font-extrabold text-primary hover:underline flex items-center gap-1 disabled:opacity-50 transition-all cursor-pointer"
                  id="vin-decode-action-btn"
                >
                  {isDecodingVin ? (
                    <>
                      <RefreshCw className="w-2.5 h-2.5 animate-spin text-primary" />
                      Decoding...
                    </>
                  ) : (
                    <>
                      <Zap className="w-2.5 h-2.5 text-primary" />
                      Auto-Decode via NHTSA
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              type="text"
              value={onboarding.vehicleVin}
              onChange={(e) => updateData("vehicleVin", e.target.value)}
              placeholder="Unique 17-char or formatting"
              className="w-full bg-surface/50 border border-border/50 rounded-2xl py-4 px-6 text-lg text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner font-mono"
            />
          </div>

          <div className="relative group">
            <label className="text-[10px] uppercase tracking-widest text-text-dim mb-1.5 block font-bold">
              Communication Protocol (Language)
            </label>
            <select
              value={onboarding.vehicleProtocol}
              onChange={(e) => updateData("vehicleProtocol", e.target.value)}
              className="w-full bg-surface/50 border border-border/50 rounded-2xl py-4 px-6 text-lg text-text-primary outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner appearance-none"
            >
              <option value="ISO 15765-4 (CAN 11/500)">
                ISO 15765-4 (CAN 11/500)
              </option>
              <option value="ISO 15765-4 (CAN 29/500)">
                ISO 15765-4 (CAN 29/500)
              </option>
              <option value="ISO 14230-4 (KWP FAST)">
                ISO 14230-4 (KWP FAST)
              </option>
              <option value="ISO 14230-4 (KWP 5BPS)">
                ISO 14230-4 (KWP 5BPS)
              </option>
              <option value="ISO 9141-2 (Asian/Euro)">
                ISO 9141-2 (Asian/Euro)
              </option>
              <option value="SAE J1850 PWM (Ford)">SAE J1850 PWM (Ford)</option>
              <option value="SAE J1850 VPW (GM)">SAE J1850 VPW (GM)</option>
            </select>
            <div className="absolute right-6 bottom-4 pointer-events-none">
              <ChevronRight className="w-5 h-5 text-text-dim rotate-90" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 pt-4 relative z-10">
        <button
          onClick={onNext}
          className="w-full bg-primary py-5 rounded-full text-black font-extrabold text-[15px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(245,166,35,0.2)]"
        >
          {!onboarding.vehicleMake && !onboarding.vehicleModel
            ? "Skip"
            : "Confirm Vehicle"}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

const ReadyScreen = ({ onFinish }: { onFinish: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-gradient-to-b from-[#111] to-[#020202] p-8 text-center relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
        <div className="w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            damping: 12,
            stiffness: 200,
            delay: 0.2,
          }}
          className="bg-surface w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/5 shadow-2xl relative"
        >
          <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] animate-pulse" />
          <CheckCircle2 className="text-primary w-16 h-16 drop-shadow-[0_0_15px_rgba(245,166,35,0.5)]" />
        </motion.div>

        <h2 className="text-4xl font-display font-black text-text-primary mb-4 tracking-tight">
          System Initialization Complete.
        </h2>
        <p className="text-text-secondary text-lg max-w-xs mx-auto tracking-wide">
          Team Forge has synced with your parameters. The Engineering Hub is
          ready.
        </p>
      </div>

      <div className="mb-8 relative z-10">
        <button
          onClick={onFinish}
          className="w-full bg-primary py-5 rounded-full text-black font-extrabold text-[15px] uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_30px_rgba(245,166,35,0.4)] hover:shadow-[0_0_40px_rgba(245,166,35,0.6)]"
        >
          Initialize Dashboard
        </button>
      </div>
    </motion.div>
  );
};



const ChatScreen = ({
  onBack,
  onboarding,
  initialMode,
  activeProject,
  user,
  inventory,
  initialQuery,
}: {
  onBack: () => void;
  onboarding: OnboardingData;
  initialMode?: AssistantMode;
  activeProject: string;
  user: FirebaseUser;
  inventory: InventoryItem[];
  initialQuery?: string;
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<AssistantMode>(initialMode || "Operations");
  const [loading, setLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      setTimeout(() => setInput(initialQuery), 0);
    }
  }, [initialQuery, messages.length]);

  // Sync with Firestore
  useEffect(() => {
    if (!user || !activeProject) return;

    const q = query(
      collection(db, "chats"),
      where("userId", "==", user.uid),
      where("projectId", "==", activeProject),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as ChatMessage & { createdAt: any }))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [user, activeProject]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    let preferredVoice = voices.find(
      (v) =>
        v.lang.includes("en-") &&
        (v.name.includes("Google") || v.name.includes("Natural")),
    );

    if (onboarding.customVoiceUrl === "preset-alpha") {
      utterance.pitch = 0.5;
      utterance.rate = 1.1;
      preferredVoice =
        voices.find(
          (v) =>
            v.name.includes("UK English Male") ||
            v.name.includes("Google UK English Male"),
        ) || preferredVoice;
    } else if (onboarding.customVoiceUrl === "preset-nova") {
      utterance.pitch = 1.2;
      utterance.rate = 1.0;
      preferredVoice =
        voices.find(
          (v) =>
            v.name.includes("US English Female") ||
            v.name.includes("Google US English"),
        ) || preferredVoice;
    } else if (onboarding.customVoiceUrl === "preset-echo") {
      utterance.pitch = 0.8;
      utterance.rate = 0.9;
      preferredVoice =
        voices.find(
          (v) =>
            v.name.includes("Daniel") || v.name.includes("UK English Male"),
        ) || preferredVoice;
    }

    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
  };

  const clearChat = async () => {
    if (!activeProject || !user) return;
    try {
      const q = query(
        collection(db, "chats"),
        where("userId", "==", user.uid),
        where("projectId", "==", activeProject),
      );
      const snapshot = await getDocs(q);
      await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
      toast.show("Chat history cleared", "success");
    } catch (e) {
      toast.show("Failed to clear chat", "error");
    }
  };

  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    let recognition: any = null;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition && isRecording) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setInput((prev) => (prev ? prev + " " + transcript : transcript));
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        // if it stops organically, restart if isRecording is true, but since that can loop, just turn it off
        setIsRecording(false);
      };

      try {
        recognition.start();
      } catch (e) {
        setTimeout(() => setIsRecording(false), 0);
        toast.show("Speech recognition failed to start", "error");
      }
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isRecording]);

  const handleMicClick = () => {
    if (
      !(
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      )
    ) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    setIsRecording(!isRecording);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        toast.show("Image attached successfully", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const userMsg = overrideText || input.trim();
    if (!userMsg && !image) return;

    setInput("");
    const attachedImage = image;
    setImage(null);
    setLoading(true);

    try {
      // Save User Message to Firestore
      await addDoc(collection(db, "chats"), {
        role: "user",
        text: userMsg,
        image: attachedImage || null,
        userId: user.uid,
        projectId: activeProject,
        createdAt: Date.now(),
      });

      let systemInstruction = `You are ${onboarding.assistantName}, professional engineering/DIY assistant for ${onboarding.userName}. `;
      systemInstruction += `Project context: ${activeProject || "General Workshop"}. `;

      if (inventory && inventory.length > 0) {
        systemInstruction += `User Inventory: ${inventory.map((i) => `${i.name} (Qty: ${i.quantity})`).join(", ")}. `;
      }

      switch (mode) {
        case "Diagnostics Lead":
          systemInstruction +=
            "Expert automotive diagnostic technician / shop foreman. You function like a high-end Snap-on diagnostic suite mixed with a senior Master Tech. ";
          systemInstruction +=
            "Analyze DTC codes, direct the user on what PIDs to look at, provide electrical testing procedures (voltage drops, resistance checks), and outline logic-based diagnostic paths. ";
          systemInstruction +=
            "Reference dealer-level data concepts like freeze frames and pinpoint tests.";
          break;
        case "Performance Tuner":
          systemInstruction +=
            "Expert automotive calibrator / tuner. Focus on live telemetry, spark advance, fuel trims, VE tables, boost mapping, and engine efficiency. ";
          systemInstruction +=
            "Direct the user to generate specific logs (e.g. WOT pulls) using FORScan or Torque Pro, then analyze the theoretical data. ";
          break;
        case "Electrical Eng.":
          systemInstruction +=
            "Automotive electrical system & CAN-bus network engineer. Focus on module configuration (As-Built coding like FORScan), network topologies, gateway modules, and CAN Hi/Lo troubleshooting. ";
          systemInstruction +=
            "Provide logic for proxy alignments, module resets, and wiring diagram pinouts.";
          break;
        case "Estimator":
          systemInstruction +=
            "Automotive service writer and estimator. Focus on labor time guides (e.g., Mitchell/Alldata), parts sourcing logistics, OEM vs Aftermarket cost-benefit analysis, and shop efficiency. ";
          break;
        case "Forge Coder":
          systemInstruction +=
            "Forge Coder. You specialize in low-level embedded software, microcontrollers (Arduino, ESP32, STM32), CAN-bus scripting, and custom firmware development for automotive applications.";
          break;
        case "Forge Developer":
          systemInstruction +=
            "Forge Developer. You are an expert in full-stack web and mobile development, focusing on building diagnostic tools, telematics dashboards, and cloud integrations for vehicles. ";
          systemInstruction +=
            "You are aware that this app is deployed as a PWA and also packaged natively for Android using Capacitor. ";
          systemInstruction +=
            "The repository is at https://github.com/newsteps4them-arch/team.forge.git. The local Android setup script is located at scripts/setup-android-local.sh, which automates cloning, npm install, npm run build, and npx cap sync android. ";
          systemInstruction +=
            "Assist the user with any Gradle, Android Studio, or Capacitor sync issues.";
          break;
        case "Fleet Manager":
          systemInstruction +=
            "Fleet Management Coordinator. Focus on predictive maintenance, vehicle tracking, uptime, and managing servicing logistics for a large fleet.";
          break;
        case "Parts Specialist":
          systemInstruction +=
            "Parts & Inventory Specialist. Focus on finding OEM and aftermarket parts, managing stock, checking supercessions, and cross-referencing part numbers.";
          break;
        case "Quality Inspector":
          systemInstruction +=
            "Quality Assurance Inspector. Focus on post-repair test drives, multi-point inspection checklists, visual inspections, and ensuring the vehicle meets all safety standards before release.";
          break;
        case "Heavy Equip. Tech":
          systemInstruction +=
            "Heavy Equipment Technician. Focus on agricultural, construction, and mining equipment, hydraulic systems, diesel diagnostics, and heavy-duty drivetrain maintenance.";
          break;
        case "HVAC Technician":
          systemInstruction +=
            "HVAC Technician. Focus on heating, ventilation, and air conditioning systems, refrigerant handling, thermostatic expansion valves, heat load calculations, and ductwork.";
          break;
        case "Field Welder":
          systemInstruction +=
            "Field Welder and Fabricator. Focus on structural welding, pipe welding, TIG/MIG/Stick processes, metallurgical properties, structural integrity, and blueprints.";
          break;
        case "Master Electrician":
          systemInstruction +=
            "Master Electrician. Focus on commercial and residential wiring, high voltage systems, NEC code compliance, panel upgrades, and heavy-duty electrical troubleshooting.";
          break;
        case "Operations":
        default:
          systemInstruction +=
            "General operations and team coordinator. You can answer general questions and orchestrate the tasks across the team.";
          break;
      }

      if (onboarding.meliApiKey) {
        systemInstruction += " You are integrated with MeliNet, powered by Meli (Chief of Staff API). Act as a highly autonomous 'Chief of Staff' for the user. Proactively mention coordinating with other agents, checking calendars, and taking initiative on logistics whenever relevant. ";
      }

      // We don't update local messages state manually, the firestore listener handles it
      // Convert history for Gemini
      const history = [
        ...messages,
        { role: "user" as const, text: userMsg, image: attachedImage || undefined },
      ].filter((msg) => msg.role !== "system").map((msg) => ({
        role: msg.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: msg.text }],
        text: msg.text,
        image: msg.image,
      }));

      const apiKey =
        onboarding.apiKey ||
        import.meta.env.VITE_GEMINI_API_KEY;
      const response = await generateChatResponse(
        history,
        apiKey,
        systemInstruction,
      );

      // Save Model Response to Firestore
      await addDoc(collection(db, "chats"), {
        role: "model",
        text: response,
        userId: user.uid,
        projectId: activeProject,
        createdAt: Date.now(),
      });

      if (autoSpeak) {
        speakText(response);
      }
    } catch (error: any) {
      toast.show(error.message || "AI Error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleARCapture = (imgData: string) => {
    setImage(imgData);
    setShowCamera(false);
    toast.show("Camera capture successful", "success");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col h-full bg-[#050505] hardware-pattern relative overflow-hidden"
    >
      {showCamera && (
        <CameraCapture
          onCapture={handleARCapture}
          onClose={() => setShowCamera(false)}
          title="AR Scanner"
          assistantMode={mode}
        />
      )}
      {/* Tech Header */}
      <header className="absolute top-0 left-0 right-0 z-30 px-4 pt-10 pb-4 bg-[#050505]/90 backdrop-blur-xl flex flex-col gap-3 border-b border-primary/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff41]/50 to-transparent" />
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 text-text-primary"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1 crt-text">
              {mode} MODE
            </span>
            <div className="flex items-center gap-2 text-[9px] font-mono text-text-secondary">
               <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> LINK ESTABLISHED
            </div>
          </div>
          <button
            onClick={clearChat}
            title="Clear Chat"
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-text-secondary hover:text-error flex-shrink-0"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div
          className="flex bg-black/40 rounded-full p-1 border border-white/5 overflow-x-auto no-scrollbar items-center"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <button
            onClick={() => {
              setAutoSpeak(!autoSpeak);
              if (autoSpeak) window.speechSynthesis?.cancel();
            }}
            title={autoSpeak ? "Voice Output On" : "Voice Output Off"}
            className={`p-2 rounded-full transition-colors flex-shrink-0 ml-1 mr-2 ${autoSpeak ? "bg-primary/20 text-primary" : "text-text-secondary hover:bg-white/10"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              {autoSpeak && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>}
              {autoSpeak && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>}
            </svg>
          </button>
          {/* Scrollable mode toggles */}
          {[
            "Operations",
            "Diagnostics Lead",
            "Performance Tuner",
            "Electrical Eng.",
            "Estimator",
            "Forge Coder",
            "Forge Developer",
            "Fleet Manager",
            "Parts Specialist",
            "Quality Inspector",
            "Heavy Equip. Tech",
            "HVAC Technician",
            "Field Welder",
            "Master Electrician",
          ].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m as AssistantMode);
                toast.show(`Switched to ${m} mode`, "info", 3000);
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${mode === m ? "bg-primary text-black shadow-[0_0_10px_rgba(245,166,35,0.4)]" : "text-text-secondary hover:text-text-primary"}`}
            >
              {m === "Operations" && <Sparkles className="w-3 h-3" />}
              {m === "Diagnostics Lead" && <Wrench className="w-3 h-3" />}
              {m === "Estimator" && <Calculator className="w-3 h-3" />}
              {m === "Performance Tuner" && <Activity className="w-3 h-3" />}
              {m === "Electrical Eng." && <Zap className="w-3 h-3" />}
              {m === "Forge Coder" && <Code className="w-3 h-3" />}
              {m === "Forge Developer" && <Terminal className="w-3 h-3" />}
              {m === "Fleet Manager" && <Truck className="w-3 h-3" />}
              {m === "Parts Specialist" && <Package className="w-3 h-3" />}
              {m === "Quality Inspector" && <CheckCircle className="w-3 h-3" />}
              {m === "Heavy Equip. Tech" && <HardHat className="w-3 h-3" />}
              {m === "HVAC Technician" && <Thermometer className="w-3 h-3" />}
              {m === "Field Welder" && <Flame className="w-3 h-3" />}
              {m === "Master Electrician" && <Plug className="w-3 h-3" />}
              {m.split(" ")[0] === "Forge" ? m : m.split(" ")[0]}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full h-full px-5 pt-[140px] pb-[160px] space-y-6 z-10 no-scrollbar relative">
        {/* Subtle background ember visualizer */}
        {messages.length === 0 && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
            <div className="w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full" />
          </div>
        )}

        {messages.length === 0 && (
          <div className="h-full flex flex-col justify-center items-center opacity-70 relative z-10 space-y-8">
            <div className="flex flex-col items-center justify-center">
              <Cpu className="w-16 h-16 text-primary mb-6 drop-shadow-[0_0_15px_rgba(245,166,35,0.5)]" />
              <p className="text-center text-text-primary font-display text-xl tracking-tight max-w-[200px]">
                {mode === "Diagnostics Lead"
                  ? "What are we tearing apart today?"
                  : mode === "Estimator"
                    ? "Let's run some numbers."
                    : mode === "Performance Tuner"
                      ? "Let's dial in the maps."
                      : mode === "Electrical Eng."
                        ? "Tracing the CAN lines."
                        : mode === "Forge Coder"
                          ? "Let's write some custom firmware."
                          : mode === "Forge Developer"
                            ? "Ready to build the platform."
                            : mode === "Fleet Manager"
                              ? "Tracking fleet health."
                              : mode === "Parts Specialist"
                                ? "Sourcing the right components."
                                : mode === "Quality Inspector"
                                  ? "Final check before delivery."
                                  : mode === "Heavy Equip. Tech"
                                    ? "Firing up the heavy machinery."
                                    : mode === "HVAC Technician"
                                      ? "Taking the temp."
                                      : mode === "Field Welder"
                                        ? "Striking an arc."
                                        : mode === "Master Electrician"
                                          ? "Checking the lines."
                                          : "How can the team assist?"}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 max-w-[280px]">
              {mode === "Diagnostics Lead" &&
                [
                  "Code P0300 on F150",
                  "Fuel trim data analysis",
                  "EVAP leak procedure",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Estimator" &&
                [
                  "OEM Parts pricing",
                  "Compare aftermarket blocks",
                  "Calculate 8 hrs labor",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Forge Coder" &&
                [
                  "Write CAN sniffer script",
                  "ESP32 OBD2 adapter",
                  "Parse J1939 messages",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Forge Developer" &&
                [
                  "Build React dashboard",
                  "Firebase auth flow",
                  "Socket.io telemetry",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Fleet Manager" &&
                [
                  "Predictive maintenance schedule",
                  "View active DTCs across fleet",
                  "Asset tracking status",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Parts Specialist" &&
                [
                  "Cross-reference OEM number",
                  "Check inventory levels",
                  "Order brake pads",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Quality Inspector" &&
                [
                  "Multi-point inspection form",
                  "Road test log",
                  "Verify alignment specs",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Heavy Equip. Tech" &&
                [
                  "Hydraulic leak diag",
                  "CAT code lookup",
                  "Boom drift test",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "HVAC Technician" &&
                [
                  "Calculate heat load",
                  "Airflow CFM chart",
                  "Refrigerant leak",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Field Welder" &&
                [
                  "6G pipe parameters",
                  "TIG aluminum amps",
                  "Check weld porosity",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Master Electrician" &&
                [
                  "Panel load calc",
                  "VFD fault code",
                  "3-phase wiring",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Performance Tuner" &&
                [
                  "Adjust target boost CFG",
                  "Explain WOT Fuel table",
                  "MAF scaling tutorial",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Electrical Eng." &&
                [
                  "Calculate proxy align byte",
                  "Locate BCM ground",
                  "Explain HS-CAN topology",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Operations" &&
                [
                  "Pull AS-BUILT data",
                  "Review diagnostic logs",
                  "Inventory check",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 240, 
              damping: 24,
              opacity: { duration: 0.25 }
            }}
            layout="position"
            key={msg.id || idx}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : msg.role === "system" ? "items-center" : "items-start"}`}
          >
            <div
              className={`shadow-lg max-w-[90%] p-5 ${msg.role === "user" ? "bg-primary text-black rounded-[2rem] rounded-tr-md" : msg.role === "system" ? "bg-black/50 border border-blue-500/20 text-blue-400 font-mono text-xs rounded-xl" : "bg-surface text-text-primary border border-white/5 rounded-[2rem] rounded-tl-md"}`}
            >
              {msg.image && (
                <img
                  src={msg.image}
                  alt="Uploaded"
                  className="rounded-xl w-full max-h-48 object-cover mb-3 border border-black/10"
                />
              )}
              {msg.text &&
                (msg.role === "model" ? (
                  <div className="markdown-body text-text-primary/90">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                ) : msg.role === "system" ? (
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </p>
                ) : (
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">
                    {msg.text}
                  </p>
                ))}
            </div>
            <span className="text-[10px] text-text-dim mt-2 tracking-widest uppercase px-2">
              {msg.role === "user"
                ? onboarding.userName
                : msg.role === "system"
                ? "Terminal LOG"
                : onboarding.assistantName}
            </span>
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start"
          >
            <div className="bg-surface text-text-primary border border-white/5 rounded-[2rem] rounded-tl-md p-5 flex gap-2 items-center shadow-lg relative overflow-hidden">
               <div className="absolute inset-0 bg-primary/5 scanlines-pattern pointer-events-none" />
               <motion.div
                animate={{ height: ["8px", "20px", "8px"] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                className="w-1.5 bg-primary/80 rounded-full shadow-[0_0_5px_rgba(245,166,35,0.5)]"
              />
              <motion.div
                animate={{ height: ["8px", "24px", "8px"] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                className="w-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(245,166,35,0.8)]"
              />
              <motion.div
                animate={{ height: ["8px", "16px", "8px"] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                className="w-1.5 bg-primary/80 rounded-full shadow-[0_0_5px_rgba(245,166,35,0.5)]"
              />
              <span className="text-[10px] uppercase font-mono text-primary/70 tracking-widest ml-3">ANALYZING...</span>
            </div>
          </motion.div>
        )}
        <div ref={endOfMessagesRef} className="h-4" />
      </div>

      {/* Floating Input Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-4 pb-8 glass border-t border-white/5">
        {image && (
          <div className="mb-3 relative inline-block mx-2">
            <img
              src={image}
              alt="Preview"
              className="w-16 h-16 rounded-xl object-cover border border-primary/50 shadow-lg"
            />
            <button
              onClick={() => setImage(null)}
              className="absolute -top-2 -right-2 bg-card rounded-full p-1 border border-border text-text-secondary hover:text-text-primary shadow-lg"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-3xl pl-3 pr-2 py-2 focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/30 transition-all shadow-inner">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-text-secondary hover:text-primary transition-colors bg-white/5 rounded-full hover:bg-white/10"
              title="Upload Image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="p-2.5 text-text-secondary hover:text-primary transition-colors bg-white/5 rounded-full hover:bg-white/10"
              title="AR Camera View"
            >
              <Camera className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleMicClick}
              className={`p-2.5 transition-colors rounded-full ${isRecording ? "text-black bg-primary animate-pulse shadow-[0_0_15px_rgba(245,166,35,0.5)]" : "text-text-secondary hover:text-primary bg-white/5 hover:bg-white/10"}`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                isRecording ? "Listening intently..." : "Ask Forge..."
              }
              className="flex-1 bg-transparent border-none text-text-primary outline-none py-2 px-2 placeholder:text-text-dim/80"
            />
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !image) || loading}
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black disabled:opacity-30 transition-all active:scale-90 shadow-[0_0_15px_rgba(245,166,35,0.4)] disabled:shadow-none"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
          </div>

          {messages.length > 0 && (
            <div className="flex overflow-x-auto gap-2 no-scrollbar py-1 mt-1 pb-2">
              {(() => {
                let suggestions: string[];
                switch (mode) {
                  case "Diagnostics Lead":
                    suggestions = [
                      "Check fluid levels",
                      "Diagnostic paths",
                      "Service Resets",
                    ];
                    break;
                  case "Performance Tuner":
                    suggestions = [
                      "Analyze Data Log",
                      "Boost targets",
                      "Timing pull",
                    ];
                    break;
                  case "Estimator":
                    suggestions = [
                      "Calculate Labor",
                      "Part # lookup",
                      "Compare aftermarket",
                    ];
                    break;
                  case "Forge Coder":
                    suggestions = [
                      "Arduino CAN config",
                      "Reverse engineer ID",
                      "Write C++ module",
                    ];
                    break;
                  case "Forge Developer":
                    suggestions = [
                      "Web Bluetooth API",
                      "Dashboard UI",
                      "Deploy to Cloud Run",
                    ];
                    break;
                  case "Fleet Manager":
                    suggestions = [
                      "PM Schedule",
                      "Fleet Status",
                      "DTC Summary",
                    ];
                    break;
                  case "Parts Specialist":
                    suggestions = [
                      "Find Part #",
                      "Check Stock",
                      "Order Parts",
                    ];
                    break;
                  case "Quality Inspector":
                    suggestions = [
                      "MPI Checklist",
                      "Road Test",
                      "Sign-off",
                    ];
                    break;
                  case "Heavy Equip. Tech":
                    suggestions = [
                      "Hydraulics",
                      "Diagnostics",
                      "Drivetrain",
                    ];
                    break;
                  case "HVAC Technician":
                    suggestions = [
                      "Heat Load",
                      "Airflow",
                      "Refrigerant",
                    ];
                    break;
                  case "Field Welder":
                    suggestions = [
                      "Welding Specs",
                      "Metallurgy",
                      "Blueprints",
                    ];
                    break;
                  case "Master Electrician":
                    suggestions = [
                      "NEC Code",
                      "Panel UPGRADE",
                      "Tracing Faults",
                    ];
                    break;
                  case "Electrical Eng.":
                    suggestions = [
                      "Module config sync",
                      "Wiring diagram",
                      "CAN-bus check",
                    ];
                    break;
                  default:
                    suggestions = [
                      "Generate Report",
                      "Show active tasks",
                      "Sync integrations",
                    ];
                    break;
                }
                return suggestions.map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-white/5 border border-white/5 hover:bg-white/10 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    {suggest}
                  </button>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const InventoryScreen = ({
  onBack,
  inventory,
  user,
}: {
  onBack: () => void;
  inventory: InventoryItem[];
  user: FirebaseUser;
}) => {
  const [newItemName, setNewItemName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "inventory"), {
        name: newItemName.trim(),
        quantity: 1,
        userId: user.uid,
        createdAt: Date.now(),
      });
      setNewItemName("");
      toast.show("Tool added to Forge Cloud", "success");
    } catch (e) {
      toast.show("Failed to sync inventory", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (id: string, delta: number) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    try {
      if (newQty === 0) {
        await deleteDoc(doc(db, "inventory", id));
      } else {
        await updateDoc(doc(db, "inventory", id), { quantity: newQty });
      }
    } catch (e) {
      toast.show("Update failed", "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full bg-[#050505] hardware-pattern p-8 relative"
    >
      <header className="flex items-center gap-4 mb-10 pt-10 px-2">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-text-primary" />
        </button>
        <h2 className="text-3xl font-black text-text-primary tracking-tight font-display">
          Toolbox
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-20">
        <div className="bg-surface p-6 rounded-[2rem] border border-white/5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80">
            Add Gear / Parts
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g. 10mm Socket, Multimeter..."
              className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary/40 transition-all"
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemName.trim() || loading}
              className="bg-primary text-black p-3 rounded-2xl shadow-lg active:scale-95 disabled:opacity-30"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-20 mt-4 h-full">
          {inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5 opacity-50">
                <Wrench className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">
                No tools in your forge
              </h3>
              <p className="text-sm text-text-dim max-w-[200px] leading-relaxed uppercase tracking-wider text-[10px]">
                Your inventory is empty. Add your gear to sync it with the Cloud
                Assistant.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {inventory.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  className="bg-[#151619] border border-white/5 p-5 shadow-2xl relative overflow-hidden rounded-[2.5rem] flex items-center justify-between group hover:border-white/10 transition-colors shadow-lg"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-text-primary text-[16px] tracking-tight">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="px-1.5 py-0.5 bg-primary/10 rounded text-[9px] text-primary font-black uppercase tracking-widest border border-primary/5">
                        TOOLS
                      </div>
                      <span className="text-[10px] text-text-dim font-mono">
                        ID: {item.id.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-full border border-white/5">
                    <button
                      onClick={() => handleUpdateQty(item.id, -1)}
                      className="p-2.5 text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="min-w-[2.5rem] text-center font-black text-primary font-mono text-lg">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.id, 1)}
                      className="p-2.5 text-text-dim hover:text-primary hover:bg-primary/10 rounded-full transition-all active:scale-90"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const DiagnosticScreen = ({
  onBack,
  connected,
  dtcs,
  onCommand,
  onDeepDive,
  setDtcs,
}: {
  onBack: () => void;
  connected: boolean;
  dtcs: DTC[];
  onCommand: (cmd: string) => void;
  onDeepDive: (dtc: DTC) => void;
  setDtcs?: React.Dispatch<React.SetStateAction<DTC[]>>;
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanType, setScanType] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"system" | "severity">("system");

  const systemMap: Record<string, { label: string; color: string }> = {
    P: { label: "Powertrain", color: "#EF4444" },
    C: { label: "Chassis", color: "#3B82F6" },
    B: { label: "Body", color: "#10B981" },
    U: { label: "Network", color: "#8B5CF6" },
  };

  const severityMap: Record<string, { label: string; color: string }> = {
    Permanent: { label: "High / Permanent", color: "#EF4444" },
    Stored: { label: "Medium / Stored", color: "#F5A623" },
    Pending: { label: "Low / Pending", color: "#10B981" },
  };

  const getSystemDistribution = () => {
    const counts: Record<string, number> = { P: 0, C: 0, B: 0, U: 0 };
    dtcs.forEach((dtc) => {
      const firstChar = dtc.code.charAt(0).toUpperCase();
      if (counts[firstChar] !== undefined) {
        counts[firstChar]++;
      } else {
        counts.P++;
      }
    });

    return Object.entries(counts)
      .map(([key, count]) => ({
        name: systemMap[key]?.label || "Other",
        value: count,
        color: systemMap[key]?.color || "#6B7280",
      }))
      .filter((item) => item.value > 0);
  };

  const getSeverityDistribution = () => {
    const counts: Record<string, number> = { Permanent: 0, Stored: 0, Pending: 0 };
    dtcs.forEach((dtc) => {
      const status = dtc.status || "Stored";
      if (counts[status] !== undefined) {
        counts[status]++;
      } else {
        counts.Stored++;
      }
    });

    return Object.entries(counts)
      .map(([key, count]) => ({
        name: severityMap[key]?.label || key,
        value: count,
        color: severityMap[key]?.color || "#F59E0B",
      }))
      .filter((item) => item.value > 0);
  };

  const systemData = getSystemDistribution();
  const severityData = getSeverityDistribution();
  const chartData = activeTab === "system" ? systemData : severityData;

  const handleScan = (type: "quick" | "deep") => {
    if (!connected) {
      toast.show("Connect to vehicle first on Home screen", "error");
      return;
    }
    setIsScanning(true);
    setScanType(type === "quick" ? "Quick Scan" : "Deep Module Scan");

    // Simulate scan sequence
    setTimeout(() => {
      onCommand("03"); // Request Emission-Related Diagnostic Trouble Codes
    }, 1000);

    setTimeout(() => {
      setIsScanning(false);
      setScanType("");
      toast.show("Scan complete", "success");
    }, 3000);
  };

  const handleClear = () => {
    if (!connected) return;
    if (
      confirm(
        "Are you sure you want to clear all DTCs? This will reset your emissions monitors.",
      )
    ) {
      onCommand("04"); // Clear/Reset Emission-Related Diagnostic Info
      toast.show("Clear command sent", "info");
    }
  };

  const handleInjectFaults = () => {
    if (!setDtcs) return;
    setDtcs([
      {
        code: "P0133",
        description: "O2 Sensor Circuit Slow Response (Bank 1 Sensor 1)",
        status: "Pending",
      },
      {
        code: "P0300",
        description: "Random/Multiple Cylinder Misfire Detected (Critical Safety)",
        status: "Permanent",
      },
      {
        code: "C0035",
        description: "Left Front Wheel Speed Sensor Circuit Malfunction",
        status: "Stored",
      },
      {
        code: "B1204",
        description: "SRS Airbag Curtain Sensor Circuit Fault",
        status: "Permanent",
      },
      {
        code: "U0100",
        description: "Lost Communication with Engine Control Module ECM",
        status: "Permanent",
      },
      {
        code: "P0113",
        description: "Intake Air Temperature Sensor 1 Circuit High State",
        status: "Stored",
      },
    ]);
    toast.show("Loaded R&D Simulated DTC Multi-System Cluster!", "success");
  };

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
          <h2 className="text-xl font-black uppercase tracking-widest">
            Diagnostics
          </h2>
        </div>
      </div>

      <div className="px-6 space-y-6 overflow-y-auto no-scrollbar flex-1 pb-10">
        <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono leading-relaxed mb-6">
          Read and clear vehicle diagnostic trouble codes (DTCs). Green
          indicates a clean system. Red indicates faults found.
        </div>

        {/* Scan Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleScan("quick")}
            disabled={isScanning}
            className={`p-4 rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-3 transition-all ${isScanning && scanType === "Quick Scan" ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(245,166,35,0.2)] text-primary" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"}`}
          >
            <Zap
              className={`w-8 h-8 ${isScanning && scanType === "Quick Scan" ? "animate-pulse" : ""}`}
            />
            <div className="flex flex-col items-center text-center">
              <span className="text-sm font-black uppercase tracking-wider font-mono">
                1-Tap Quick
              </span>
              <span className="text-[9px] text-white/40 uppercase mt-1 px-2">
                Checks Powertrain
              </span>
            </div>
          </button>
          <button
            onClick={() => handleScan("deep")}
            disabled={isScanning}
            className={`p-4 rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-3 transition-all ${isScanning && scanType === "Deep Module Scan" ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(245,166,35,0.2)] text-primary" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"}`}
          >
            <Search
              className={`w-8 h-8 ${isScanning && scanType === "Deep Module Scan" ? "animate-pulse" : ""}`}
            />
            <div className="flex flex-col items-center text-center">
              <span className="text-sm font-black uppercase tracking-wider font-mono">
                Module Scan
              </span>
              <span className="text-[9px] text-white/40 uppercase mt-1 px-2">
                ABS, Airbag, Trans
              </span>
            </div>
          </button>
        </div>

        {/* Scan Results */}
        <AnimatePresence mode="wait">
          {isScanning ? (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 opacity-50"
            >
              <Activity className="w-10 h-10 text-primary animate-pulse mb-3" />
              <span className="text-xs font-mono uppercase tracking-widest text-primary">
                {scanType}...
              </span>
            </motion.div>
          ) : dtcs.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Pie Chart Distribution Overview */}
              <div className="bg-[#121212]/90 border border-white/5 rounded-3xl p-5 mb-4 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="text-primary w-4 h-4" />
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">DTC Distribution Analysis</h4>
                  </div>
                  {/* Segmented control tabs */}
                  <div className="bg-black/40 border border-white/5 rounded-lg p-0.5 flex gap-1">
                    <button
                      onClick={() => setActiveTab("system")}
                      className={`py-1 px-3 text-[9px] uppercase tracking-wider font-black rounded-md transition-all ${activeTab === "system" ? "bg-primary text-black font-extrabold" : "text-white/40 hover:text-white font-medium"}`}
                    >
                      System
                    </button>
                    <button
                      onClick={() => setActiveTab("severity")}
                      className={`py-1 px-3 text-[9px] uppercase tracking-wider font-black rounded-md transition-all ${activeTab === "severity" ? "bg-primary text-black font-extrabold" : "text-white/40 hover:text-white font-medium"}`}
                    >
                      Severity
                    </button>
                  </div>
                </div>

                {/* Pie Chart and list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="h-[180px] w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={1} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181B",
                            borderColor: "rgba(255,255,255,0.08)",
                            borderRadius: "12px",
                          }}
                          itemStyle={{ color: "#FFF", fontSize: "10px", fontFamily: "monospace" }}
                          labelStyle={{ display: "none" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-x-0 top-[42%] flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-mono font-black text-white leading-none">
                        {dtcs.length}
                      </span>
                      <span className="text-[7px] text-white/40 uppercase tracking-widest font-mono mt-0.5">
                        Total DTCs
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] text-primary uppercase tracking-widest font-black font-mono border-l-2 border-primary pl-2 mb-1.5">
                      {activeTab === "system" ? "Detected Category Areas" : "Severity Categorization"}
                    </div>
                    <div className="space-y-1.5">
                      {chartData.map((item, idx) => {
                        const percentage = Math.round((item.value / dtcs.length) * 100);
                        return (
                          <div key={idx} className="flex items-center justify-between bg-black/30 px-3 py-1.5 border border-white/5 rounded-xl">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-[10px] text-white/80 font-mono uppercase">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-white/90 font-mono font-black">{item.value}x</span>
                              <span className="text-[8px] text-white/40 font-mono">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                  {dtcs.length} Fault(s) Detected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      toast.show(
                        "Diagnostic Report generated and saved to Hub.",
                        "success",
                      )
                    }
                    className="px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] uppercase font-black tracking-widest hover:bg-primary hover:text-black transition-colors"
                  >
                    Report
                  </button>
                  <button
                    onClick={handleClear}
                    className="px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] uppercase font-black tracking-widest hover:bg-red-500 hover:text-black transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              {dtcs.map((dtc) => (
                <div
                  key={dtc.code}
                  className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex flex-col gap-3"
                >
                  <div className="flex gap-4 items-start">
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-red-500 text-black font-black text-xs px-2 py-1 rounded">
                        {dtc.code}
                      </div>
                      <button
                        onClick={() => onDeepDive && onDeepDive(dtc)}
                        className="w-full flex items-center justify-center gap-1 py-1 rounded border border-primary/30 text-[8px] text-primary hover:bg-primary/10 transition-colors uppercase font-bold tracking-widest mt-1"
                      >
                        <Bot className="w-2.5 h-2.5" /> Guide
                      </button>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white mb-1">
                        {dtc.description}
                      </p>
                      <p className="text-[10px] text-red-500/70 font-mono tracking-widest uppercase mb-1">
                        {dtc.status}
                      </p>
                      <div className="text-[9px] text-white/40 leading-relaxed font-mono uppercase">
                        Module: {dtc.code.charAt(0).toUpperCase() === "P" ? "PCM (Powertrain Control)" : dtc.code.charAt(0).toUpperCase() === "C" ? "ABS/TCS (Chassis Control)" : dtc.code.charAt(0).toUpperCase() === "B" ? "SRS (Body Control)" : "CAN/BUS (Network Control)"}
                      </div>
                    </div>
                  </div>
                  {/* Simulated Freeze Frame Data */}
                  <div className="mt-2 pt-3 border-t border-red-500/10 grid grid-cols-2 gap-2">
                    <div className="flex justify-between items-center bg-black/40 px-2 py-1.5 rounded">
                      <span className="text-[8px] text-white/40 font-mono uppercase">
                        Engine RPM
                      </span>
                      <span className="text-[9px] text-white font-mono">
                        1,824 r/min
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-black/40 px-2 py-1.5 rounded">
                      <span className="text-[8px] text-white/40 font-mono uppercase">
                        Coolant Temp
                      </span>
                      <span className="text-[9px] text-white font-mono">
                        185 °F
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-black/40 px-2 py-1.5 rounded">
                      <span className="text-[8px] text-white/40 font-mono uppercase">
                        Vehicle Speed
                      </span>
                      <span className="text-[9px] text-white font-mono">
                        45 mph
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-black/40 px-2 py-1.5 rounded">
                      <span className="text-[8px] text-white/40 font-mono uppercase">
                        Engine Load
                      </span>
                      <span className="text-[9px] text-white font-mono">
                        32.4 %
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="clean"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 opacity-50"
            >
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <span className="text-xs font-mono uppercase tracking-widest text-green-500 text-center">
                No faults detected
                <br />
                System OK
              </span>
              {setDtcs && (
                <button
                  onClick={handleInjectFaults}
                  className="mt-6 px-4 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-black border border-primary/20 rounded-full text-[10px] uppercase font-black tracking-widest transition-all"
                >
                  Load simulated multi-system DTC cluster
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { currentScreen, navigate: setCurrentScreen, goBack } = useNavigation("Welcome");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [chatMode, setChatMode] = useState<AssistantMode>("Operations");
  const [chatInitialQuery, setChatInitialQuery] = useState("");
  const [activeProject, setActiveProject] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("team_forge_connected_integrations");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return ALL_INTEGRATION_IDS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("team_forge_connected_integrations", JSON.stringify(connectedIntegrations));
    } catch (e) {}
  }, [connectedIntegrations]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<
    "All" | "Low" | "Medium" | "High"
  >("All");

  // Diagnostic State
  const [obdMode, setObdMode] = useState<"Bluetooth" | "USB" | "Simulated">("Simulated");
  const { obdConnected, connect, sendCommand, logs: diagnosticLogs, addLog, telemetry, setLogs: setDiagnosticLogs } = useObdTelemetry(obdMode);

  
  const [detectedDtcs, setDetectedDtcs] = useState<DTC[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [isDecodingVin, setIsDecodingVin] = useState(false);

  const handleDecodeVin = async () => {
    const vin = onboarding.vehicleVin?.trim();
    if (!vin) {
      toast.show("Please enter a VIN first.", "info");
      return;
    }
    if (vin.length < 5) {
      toast.show("VIN must be at least 5 characters to decode.", "info");
      return;
    }
    setIsDecodingVin(true);
    toast.show(`Querying NHTSA database for VIN: ${vin}...`, "info");
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
      const data = await res.json();
      if (data && data.Results) {
        let year = "";
        let make = "";
        let model = "";
        data.Results.forEach((item: any) => {
          if (item.Variable === "Model Year") year = item.Value || "";
          if (item.Variable === "Make") make = item.Value || "";
          if (item.Variable === "Model") model = item.Value || "";
        });

        if (make) {
          setOnboarding(prev => ({
            ...prev,
            vehicleYear: year || prev.vehicleYear,
            vehicleMake: make,
            vehicleModel: model || prev.vehicleModel
          }));
          toast.show(`Successfully decoded: ${year} ${make} ${model}`, "success");
        } else {
          toast.show("No matching vehicle records found for this VIN in VPIC database.", "info");
        }
      } else {
        toast.show("Could not decode vehicle VIN via NHTSA database.", "error");
      }
    } catch (err) {
      console.error(err);
      toast.show("Network error connecting to NHTSA VPIC Decoder.", "error");
    } finally {
      setIsDecodingVin(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const [onboarding, setOnboarding] = useState<OnboardingData>({
    assistantName: "",
    wakeWord: "",
    customVoiceEnabled: false,
    customVoiceUrl: null,
    userName: "",
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || "AIzaSy_SYSTEM_DEFAULT",
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleVin: "",
    vehicleProtocol: "ISO 15765-4 (CAN 11/500)",
    vehicleInfo: "",
    inventory: "",
    meliApiKey: import.meta.env.VITE_MELI_API_KEY || "Meli_SYSTEM_DEFAULT",
    alldataKey: import.meta.env.VITE_ALLDATA_API_KEY || "AllData_SYSTEM_DEFAULT",
    obdKey: import.meta.env.VITE_OBD_API_KEY || "OBD_SYSTEM_DEFAULT",
    openAiKey: import.meta.env.VITE_OPENAI_API_KEY || "sk-SYSTEM_DEFAULT",
    onboardingComplete: false,
  });

  // Auth Listener
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          toast.show(`Successfully authenticated as ${result.user.displayName || result.user.email || "User"}`, "success");
        }
      })
      .catch((err) => {
        console.warn("Auth redirect result check:", err);
      });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        toast.show(`Signed in as ${u.displayName || u.email || "User"}`, "success");
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Projects and Tasks on login
  useEffect(() => {
    if (!user) {
      setTimeout(() => {
        setProjects([]);
        setTasks([]);
      }, 0);
      return;
    }

    // Projects Listener
    const pq = query(
      collection(db, "projects"),
      where("userId", "==", user.uid),
    );
    const unsubscribeProjects = onSnapshot(
      pq,
      async (snapshot) => {
        const fetchedProjects = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Project,
        );

        if (fetchedProjects.length === 0) {
          // Auto-create a default project so the app is never entirely blank
          try {
            const newProj = {
              name: "General Diagnostics",
              userId: user.uid,
              createdAt: Date.now(),
              color: "#F5A623",
            };
            const docRef = await addDoc(collection(db, "projects"), newProj);
            const createdProj = { id: docRef.id, ...newProj } as Project;
            setProjects([createdProj]);
            setActiveProject(docRef.id);
          } catch (e) {
            console.error("Failed to auto-create project", e);
          }
        } else {
          setProjects(fetchedProjects);
          if (
            !activeProject ||
            !fetchedProjects.find((p) => p.id === activeProject)
          ) {
            // Check local storage first
            try {
              const saved = localStorage.getItem(
                `forge_active_project_${user.uid}`,
              );
              if (saved && fetchedProjects.find((p) => p.id === saved)) {
                setActiveProject(saved);
              } else {
                setActiveProject(fetchedProjects[0].id);
              }
            } catch (e) {
              setActiveProject(fetchedProjects[0].id);
            }
          }
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "projects"),
    );

    // Tasks Listener (scoped to active project)
    const tq = activeProject
      ? query(
          collection(db, "tasks"),
          where("userId", "==", user.uid),
          where("projectId", "==", activeProject),
        )
      : query(collection(db, "tasks"), where("userId", "==", user.uid));

    const unsubscribeTasks = onSnapshot(
      tq,
      (snapshot) => {
        const fetchedTasks = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Task,
        );
        setTasks(fetchedTasks);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "tasks"),
    );

    // Inventory Listener
    const iq = query(
      collection(db, "inventory"),
      where("userId", "==", user.uid),
    );
    const unsubscribeInventory = onSnapshot(
      iq,
      (snapshot) => {
        setInventory(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as InventoryItem,
          ),
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "inventory"),
    );

    return () => {
      unsubscribeProjects();
      unsubscribeTasks();
      unsubscribeInventory();
    };
  }, [user, activeProject]);

  // Fetch User Profile
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data() as OnboardingData;
          setOnboarding(profile);
          if (profile.onboardingComplete) setCurrentScreen("Main");
        } else {
          setCurrentScreen("NameAssistant");
        }
      } catch (e) {
        console.error("Profile load failed", e);
      }
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const PROJECT_COLORS = [
    "#F5A623",
    "#23F5A6",
    "#A623F5",
    "#F523A6",
    "#FF5B5B",
    "#5B8FFF",
  ];

  const handleUpdateProjectColor = async (color: string) => {
    if (!user || !activeProject) return;
    try {
      await updateDoc(doc(db, "projects", activeProject), {
        color,
        updatedAt: serverTimestamp(),
      });
      toast.show("Project color updated", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "projects");
    }
  };

  const renderProjectPicker = () => {
    const activeProj = projects.find((p) => p.id === activeProject);

    return (
      <div className="space-y-4 mb-8">
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProject(p.id)}
              style={{
                backgroundColor:
                  activeProject === p.id
                    ? p.color || "#F5A623"
                    : "rgba(255,255,255,0.05)",
                borderColor:
                  activeProject === p.id
                    ? p.color || "#F5A623"
                    : "rgba(255,255,255,0.05)",
                color: activeProject === p.id ? "#000" : "#888",
              }}
              className={`flex-shrink-0 px-6 py-4 rounded-[2rem] border transition-all flex flex-col gap-1 min-w-[140px] ${
                activeProject === p.id
                  ? "shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                  : "hover:border-white/10"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-[0.2em] opacity-60`}
              >
                Project
              </span>
              <span className="font-display font-black text-sm tracking-tight truncate w-full">
                {p.name}
              </span>
            </button>
          ))}
          <button
            onClick={() => {
              const name = prompt("Enter project name:");
              if (name) handleCreateProject(name);
            }}
            className="flex-shrink-0 px-6 py-4 rounded-[2rem] border border-dashed border-white/10 text-white/40 hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center min-w-[140px] gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">
              New
            </span>
          </button>
        </div>

        {activeProj && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-2"
          >
            <span className="text-[10px] text-text-dim uppercase tracking-widest font-mono mr-2">
              Theme:
            </span>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleUpdateProjectColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    activeProj.color === c
                      ? "border-white scale-125"
                      : "border-transparent hover:scale-110"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  const handleCreateProject = async (name: string) => {
    if (!user || !name.trim()) return;
    try {
      const newProj = {
        name: name.trim(),
        userId: user.uid,
        createdAt: Date.now(),
        color: ["#F5A623", "#23F5A6", "#A623F5", "#F523A6"][
          Math.floor(Math.random() * 4)
        ],
      };
      const docRef = await addDoc(collection(db, "projects"), newProj);
      setActiveProject(docRef.id);
      toast.show(`Project "${name}" created`, "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "projects");
    }
  };

  // Sync Active Project to localStorage per user
  useEffect(() => {
    if (user && activeProject) {
      try {
        localStorage.setItem(`forge_active_project_${user.uid}`, activeProject);
      } catch (e) {
        console.warn("localStorage not available", e);
      }
    }
  }, [activeProject, user]);

  const handleLogin = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (result.credential?.idToken) {
          const credential = GoogleAuthProviderClass.credential(result.credential.idToken);
          await signInWithCredential(auth, credential);
        }
      } else {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (popupErr: any) {
          console.warn("Popup sign-in failed, checking fallback:", popupErr);
          if (
            popupErr.code === 'auth/popup-blocked' ||
            popupErr.code === 'auth/cancelled-popup-request' ||
            popupErr.code === 'auth/popup-closed-by-user' ||
            popupErr.code === 'auth/operation-not-supported-in-this-environment'
          ) {
            try {
              toast.show("Attempting redirect login...", "info");
              await signInWithRedirect(auth, googleProvider);
            } catch (redirectErr: any) {
              console.warn("Redirect auth fallback:", redirectErr);
              toast.show("Popup blocked. Continuing in offline mode.", "info");
              await signInAnonymously(auth);
            }
          } else if (popupErr.code === 'auth/unauthorized-domain') {
            toast.show("Domain requires Firebase auth configuration. Entering offline workspace.", "info");
            await signInAnonymously(auth);
          } else {
            toast.show(`Login notice: ${popupErr.message || String(popupErr)}`, "error");
          }
        }
      }
    } catch (error: any) {
      toast.show(`Authentication error: ${error.message || String(error)}`, "error");
    }
  };

  const handleLoginAnon = async () => {
    try {
      await signInAnonymously(auth);
      toast.show("Signed in as Guest User", "info");
      handleNext();
    } catch (error: any) {
      console.warn("Anonymous sign-in notice:", error);
      toast.show("Continuing in Local Standalone Mode", "info");
      handleNext();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.show("Signed out successfully", "info");
    } catch (error: any) {
      toast.show(`Logout status: ${error.message || String(error)}`, "info");
    }
  };

  const toggleTaskSelection = (id: string) => {
    setSelectedTasks((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id],
    );
  };

  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<
    "Low" | "Medium" | "High"
  >("Medium");
  const [showAddTaskOptions, setShowAddTaskOptions] = useState(false);

  const handleAddTask = async () => {
    if (!user || !newTaskText.trim()) return;
    try {
      await addDoc(collection(db, "tasks"), {
        text: newTaskText.trim(),
        completed: false,
        createdAt: Date.now(),
        priority: newTaskPriority,
        userId: user.uid,
        projectId: activeProject || "default",
      });
      setNewTaskText("");
      setNewTaskPriority("Medium");
      setShowAddTaskOptions(false);
      toast.show("Task added", "success");
    } catch (e) {
      toast.show("Failed to add task", "error");
    }
  };

  const handleToggleTask = async (task: Task) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        completed: !task.completed,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      toast.show("Update failed", "error");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "tasks", id));
      setSelectedTasks((prev) => prev.filter((tid) => tid !== id));
      toast.show("Task removed", "info");
    } catch (e) {
      toast.show("Delete failed", "error");
    }
  };

  const handleEditTask = async (id: string, text: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "tasks", id), {
        text,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      toast.show("Edit failed", "error");
    }
  };

  // ⚡ Bolt Optimization: Memoized filtered array to prevent expensive derivations on frequent parent updates
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => t.text.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter((t) => filterPriority === "All" || t.priority === filterPriority);
  }, [tasks, searchQuery, filterPriority]);

  const handleBatchPriority = async (priority: "Low" | "Medium" | "High") => {
    if (!user) return;
    try {
      await Promise.all(
        selectedTasks.map((id) =>
          updateDoc(doc(db, "tasks", id), {
            priority,
            updatedAt: serverTimestamp(),
          }),
        ),
      );
      setSelectedTasks([]);
      toast.show(
        `Priority updated for ${selectedTasks.length} tasks`,
        "success",
      );
    } catch (e) {
      toast.show("Batch priority update failed", "error");
    }
  };

  const handleBatchComplete = async () => {
    if (!user) return;
    try {
      await Promise.all(
        selectedTasks.map((id) =>
          updateDoc(doc(db, "tasks", id), {
            completed: true,
            updatedAt: serverTimestamp(),
          }),
        ),
      );
      setSelectedTasks([]);
      toast.show(`Marked ${selectedTasks.length} tasks as complete`, "success");
    } catch (e) {
      toast.show("Batch update failed", "error");
    }
  };

  const handleBatchDelete = async () => {
    if (!user) return;
    try {
      await Promise.all(
        selectedTasks.map((id) => deleteDoc(doc(db, "tasks", id))),
      );
      setSelectedTasks([]);
      toast.show(`Removed ${selectedTasks.length} tasks`, "info");
    } catch (e) {
      toast.show("Batch delete failed", "error");
    }
  };

  const handleBatchCategorize = async (category: string) => {
    if (!user) return;
    try {
      await Promise.all(
        selectedTasks.map((id) =>
          updateDoc(doc(db, "tasks", id), {
            category,
            updatedAt: serverTimestamp(),
          }),
        ),
      );
      setSelectedTasks([]);
      toast.show(
        `Categorized ${selectedTasks.length} tasks as ${category}`,
        "success",
      );
    } catch (e) {
      toast.show("Batch categorize failed", "error");
    }
  };

  const handleBatchMove = async (projectId: string) => {
    if (!user || !projectId) return;
    try {
      await Promise.all(
        selectedTasks.map((id) =>
          updateDoc(doc(db, "tasks", id), {
            projectId,
            updatedAt: serverTimestamp(),
          }),
        ),
      );
      setSelectedTasks([]);
      toast.show(
        `Moved ${selectedTasks.length} tasks to selected project`,
        "success",
      );
    } catch (e) {
      toast.show("Batch move failed", "error");
    }
  };

  const handleToggleIntegration = (id: string, isConnecting: boolean) => {
    if (isConnecting) {
      setConnectedIntegrations((prev) => [...new Set([...prev, id])]);
    } else {
      setConnectedIntegrations((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleToggleAllIntegrations = (connectAll: boolean) => {
    if (connectAll) {
      setConnectedIntegrations(ALL_INTEGRATION_IDS);
    } else {
      setConnectedIntegrations([]);
    }
  };

  const handleConnect = async () => {
    if (obdConnected) {
      if (obdRef.current) {
         try {
           await obdRef.current.disconnect();
         } catch(e) {}
         obdRef.current = null;
      }
      setObdConnected(false);
      return;
    }

    try {
      if (obdMode === "Simulated") {
        obdRef.current = new SimulatedObd();
      } else if (obdMode === "Bluetooth") {
        obdRef.current = new WebBluetoothObd();
      } else if (obdMode === "USB") {
        obdRef.current = new WebSerialObd();
      }

      if (!obdRef.current) return;
      
      await obdRef.current.connect();
      setObdConnected(true);
      
      const res = await obdRef.current.sendCommand("ATI");
      setDiagnosticLogs((prev) => [`[sys] RX: ${res}`, ...prev].slice(0, 50));
      
      toast.show(`Connected via ${obdMode}`, "success");
    } catch (err: any) {
      console.error(err);
      obdRef.current = null;
      const msg =
        err.name === "SecurityError"
          ? "Hardware access requires top-level navigation. Open app in new tab."
          : err.message || "Connection failed";
      toast.show(msg, "error");
    }
  };

  const handleDeepDive = (dtc: DTC) => {
    setChatInitialQuery(
      `I'm dealing with DTC ${dtc.code}: ${dtc.description}. Can you provide a diagnostic path, logic, and potential repair procedures for a ${onboarding.vehicleYear} ${onboarding.vehicleMake} ${onboarding.vehicleModel}?`,
    );
    setChatMode("Diagnostics Lead");
    setCurrentScreen("Chat");
  };

  const handleDiagnosticCommand = async (command: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const txLog = `[${timestamp}] TX: ${command}`;
    setDiagnosticLogs((prev) =>
      [txLog, ...prev].slice(0, 50),
    );

    if (user && activeProject) {
      addDoc(collection(db, "chats"), {
        role: "system",
        text: txLog,
        userId: user.uid,
        projectId: activeProject,
        createdAt: Date.now(),
      }).catch(console.error);
    }

    if (!obdRef.current || !obdRef.current.isConnected()) {
       toast.show("Not connected to vehicle", "error");
       return;
    }

    try {
       const response = await obdRef.current.sendCommand(command);
       const rxTimestamp = new Date().toLocaleTimeString();
       const rxLog = `[${rxTimestamp}] RX: ${response}`;
       setDiagnosticLogs((prev) =>
         [rxLog, ...prev].slice(0, 50),
       );

       if (user && activeProject) {
         addDoc(collection(db, "chats"), {
           role: "system",
           text: rxLog,
           userId: user.uid,
           projectId: activeProject,
           createdAt: Date.now(),
         }).catch(console.error);
       }

       if (command === "03") {
         if (response.includes("43")) {
           setDetectedDtcs([
             {
               code: "P0133",
               description: "O2 Sensor Circuit Slow Response (Bank 1 Sensor 1) [Simulated]",
               status: "Pending",
             },
           ]);
           toast.show("Diagnostic trouble codes detected", "error");
         }
       }
       if (command === "04") {
         setDetectedDtcs([]);
         toast.show("DTC Memory Cleared", "success");
       }
    } catch (e: any) {
       const errLog = `[sys] ERROR: ${e.message}`;
       setDiagnosticLogs((prev) =>
         [errLog, ...prev].slice(0, 50),
       );
       if (user && activeProject) {
         addDoc(collection(db, "chats"), {
           role: "system",
           text: errLog,
           userId: user.uid,
           projectId: activeProject,
           createdAt: Date.now(),
         }).catch(console.error);
       }
    }
  };

  const updateData = (key: keyof OnboardingData, value: any) => {
    setOnboarding((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentScreen === "Vehicles") {
      const parts = [
        onboarding.vehicleYear,
        onboarding.vehicleMake,
        onboarding.vehicleModel,
      ].filter(Boolean);
      const summary =
        parts.length > 0 ? parts.join(" ") : onboarding.vehicleVin || "";
      setOnboarding((prev) => ({ ...prev, vehicleInfo: summary }));
    }
    const sequence: Screen[] = [
      "Welcome",
      "NameAssistant",
      "WakeWord",
      "VoiceClone",
      "AboutYou",
      "Inventory",
      "Vehicles",
      "Ready",
      "Main",
    ];
    const nextIdx = sequence.indexOf(currentScreen) + 1;
    if (nextIdx < sequence.length) {
      setCurrentScreen(sequence[nextIdx]);
    }
  };

  const handleFinish = async () => {
    const finalData = { ...onboarding, onboardingComplete: true };
    setOnboarding(finalData);

    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          ...finalData,
          email: user.email,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("Failed to sync profile:", e);
      }
    }

    setCurrentScreen("Main");
    toast.show(`Welcome to Forge, ${finalData.userName}!`, "success");
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black selection:bg-primary/30 overflow-hidden hardware-pattern">
      <TopStatusBar 
        onSettingsClick={onboarding.onboardingComplete ? () => setCurrentScreen("Settings") : undefined} 
        onMenuClick={onboarding.onboardingComplete ? () => setIsDrawerOpen(true) : undefined}
      />
      
      <NavigationDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onNavigate={(screen) => setCurrentScreen(screen)}
        currentScreen={currentScreen}
      />
      
      <NotificationContainer />
      <div className="flex-1 w-full flex items-center justify-center p-0 lg:p-6 bg-transparent">
        {/* Rugged Scanner Device Container (Tablet/Widescreen on Desktop) */}
        <div className="w-full h-full lg:max-w-6xl xl:max-w-7xl bg-[#0A0A0A] lg:rounded-[2rem] relative overflow-hidden lg:border-[8px] border-[#1d1d1d] lg:ring-4 ring-[#0f0f0f] shadow-[0_0_100px_-10px_rgba(245,166,35,0.15),inset_0_0_0_1px_rgba(255,255,255,0.05)] flex flex-col dotted-pattern">
          {/* Hardware Header accents */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent z-40 hidden lg:block" />

          <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 pt-2 lg:pt-4">
            <AnimatePresence mode="wait">
              {currentScreen === "Welcome" && (
                <WelcomeScreen
                  key="welcome"
                  onNext={handleNext}
                  onLogin={handleLogin}
                  onLoginAnon={handleLoginAnon}
                />
              )}

              {currentScreen === "NameAssistant" && (
                <SetupScreen
                  key="name"
                  title="Name your assistant"
                  subtitle="What should I call your digital spark?"
                  icon={Sparkles}
                  placeholder="e.g. Ember, Forge, Spark"
                  value={onboarding.assistantName}
                  onChange={(v) => updateData("assistantName", v)}
                  onNext={handleNext}
                />
              )}

              {currentScreen === "WakeWord" && (
                <SetupScreen
                  key="wake"
                  title="Pick a wake word"
                  subtitle="The word that commands my attention."
                  icon={Cpu}
                  placeholder="e.g. Hey Forge, Ember..."
                  value={onboarding.wakeWord}
                  onChange={(v) => updateData("wakeWord", v)}
                  onNext={handleNext}
                />
              )}

              {currentScreen === "VoiceClone" && (
                <VoiceCloneScreen
                  key="voiceclone"
                  onNext={handleNext}
                  value={onboarding.customVoiceEnabled}
                  onChange={(val) => updateData("customVoiceEnabled", val)}
                  onUrlChange={(url) => updateData("customVoiceUrl", url)}
                />
              )}

              {currentScreen === "AboutYou" && (
                <SetupScreen
                  key="user"
                  title="Who are you?"
                  subtitle="I want to know who I'm forging for."
                  icon={User}
                  placeholder="Your name"
                  value={onboarding.userName}
                  onChange={(v) => updateData("userName", v)}
                  onNext={handleNext}
                />
              )}

              {currentScreen === "Settings" && (
                <SettingsScreen
                  key="settings"
                  apiKey={onboarding.apiKey}
                  meliApiKey={onboarding.meliApiKey}
                  alldataKey={onboarding.alldataKey}
                  obdKey={onboarding.obdKey}
                  openAiKey={onboarding.openAiKey}
                  onSave={(api, meli, alldata, obd, openai) => {
                    updateData("apiKey", api);
                    updateData("meliApiKey", meli);
                    updateData("alldataKey", alldata);
                    updateData("obdKey", obd);
                    updateData("openAiKey", openai);
                    setCurrentScreen("Main");
                  }}
                  onBack={() => goBack()}
                />
              )}

              {currentScreen === "Inventory" && (
                <SetupScreen
                  key="inventory"
                  title="Your Toolbox"
                  subtitle="What diagnostic gear or shop equipment do you have?"
                  icon={Wrench}
                  placeholder="e.g. Snap-on scanner, smoke machine, multimeter..."
                  value={onboarding.inventory}
                  onChange={(v) => updateData("inventory", v)}
                  onNext={handleNext}
                  optional={true}
                />
              )}

              {currentScreen === "Vehicles" && (
                <VehicleSetupScreen
                  key="vehicles"
                  onboarding={onboarding}
                  updateData={updateData}
                  onNext={handleNext}
                />
              )}

              {currentScreen === "Ready" && (
                <ReadyScreen key="ready" onFinish={handleFinish} />
              )}

              {currentScreen === "Main" && (
                <MainDashboard
                  onboarding={onboarding}
                  isOnline={isOnline}
                  activeProject={activeProject}
                  projects={projects}
                  obdMode={obdMode}
                  setObdMode={setObdMode}
                  updateData={updateData}
                  obdConnected={obdConnected}
                  handleConnect={handleConnect}
                  setCurrentScreen={setCurrentScreen}
                  setChatMode={setChatMode}
                  setChatInitialQuery={setChatInitialQuery}
                  projectPicker={renderProjectPicker()}
                  chatHistoryWidget={
                    <ChatHistoryWidget
                      user={user!}
                      activeProject={activeProject}
                      setCurrentScreen={setCurrentScreen}
                    />
                  }
                />
              )}

              {currentScreen === "Chat" &&
                (!user ? (
                  <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#050505] hardware-pattern p-8 text-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-red-500/20 bg-red-500/5 flex items-center justify-center text-red-500 mb-2">
                      <User className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">
                      Authentication Required
                    </h3>
                    <p className="text-sm font-mono text-white/50 leading-relaxed max-w-sm">
                      Neural_Sync is offline. Please sign in via the Engineering
                      Hub (Home tab) to access Forge AI and cloud
                      synchronization.
                    </p>
                    <button
                      onClick={() => setCurrentScreen("Main")}
                      className="mt-6 px-6 py-3 bg-primary text-black font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-primary/80 transition-colors"
                    >
                      Return to Hub
                    </button>
                  </div>
                ) : activeProject ? (
                  <ChatScreen
                    key="chat"
                    onBack={() => goBack()}
                    onboarding={onboarding}
                    initialMode={chatMode}
                    activeProject={activeProject}
                    user={user}
                    inventory={inventory}
                    initialQuery={chatInitialQuery}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#050505] hardware-pattern gap-4 p-8 text-center">
                    <div className="text-primary text-sm flex items-center gap-3 font-mono border border-primary/20 p-4 rounded-full bg-primary/5 mb-4">
                      <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                      INITIALIZING WORKSPACE...
                    </div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                      Select or create a project in the Hub first.
                    </p>
                    <button
                      onClick={() => setCurrentScreen("Main")}
                      className="mt-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-white/10 transition-colors"
                    >
                      Return to Hub
                    </button>
                  </div>
                ))}

              {currentScreen === "Inventory" && user && (
                <InventoryScreen
                  onBack={() => goBack()}
                  inventory={inventory}
                  user={user}
                />
              )}

              {currentScreen === "Diagnostics" && (
                <DiagnosticScreen
                  onBack={() => goBack()}
                  connected={obdConnected}
                  dtcs={detectedDtcs}
                  onCommand={handleDiagnosticCommand}
                  onDeepDive={handleDeepDive}
                  setDtcs={setDetectedDtcs}
                />
              )}

              {currentScreen === "LiveData" && (
                <LiveDataScreen
                  onBack={() => goBack()}
                  telemetry={telemetry}
                />
              )}

              {currentScreen === "Coding" && (
                <CodingScreen
                  onBack={() => goBack()}
                  onCommand={handleDiagnosticCommand}
                />
              )}

              {currentScreen === "Terminal" && (
                <TerminalScreen
                  onBack={() => goBack()}
                  onCommand={handleDiagnosticCommand}
                  logs={diagnosticLogs}
                />
              )}

              {currentScreen === "Integrations" && (
                <IntegrationsScreen
                  onBack={() => goBack()}
                  connectedIds={connectedIntegrations}
                  onToggleConnection={handleToggleIntegration}
                  onToggleAllConnections={handleToggleAllIntegrations}
                  vehicleMake={onboarding.vehicleMake}
                  vehicleModel={onboarding.vehicleModel}
                  vehicleYear={onboarding.vehicleYear}
                  vehicleVin={onboarding.vehicleVin}
                />
              )}

              {currentScreen === "Estimator" && (
                <EstimatorScreen
                  onBack={() => goBack()}
                  vehicle={`${onboarding.vehicleYear} ${onboarding.vehicleMake} ${onboarding.vehicleModel}`}
                />
              )}

              {currentScreen === "Topology" && (
                <TopologyScreen onBack={() => goBack()} />
              )}

              {currentScreen === "Analytics" && (
                <AnalyticsScreen onBack={() => goBack()} />
              )}

              {currentScreen === "GoToMarket" && (
                <GoToMarketScreen onBack={() => goBack()} />
              )}

              {currentScreen === "VisualInspector" && (
                <VisualInspectorScreen
                  onBack={() => goBack()}
                  mode={chatMode}
                  apiKey={onboarding.apiKey}
                />
              )}

              {currentScreen === "GuidedDiagnostics" && (
                <GuidedDiagnosticsScreen
                  onBack={() => goBack()}
                  vehicle={`${onboarding.vehicleYear} ${onboarding.vehicleMake} ${onboarding.vehicleModel}`}
                />
              )}

              {currentScreen === "Oscilloscope" && (
                <OscilloscopeScreen
                  onBack={() => goBack()}
                  vehicle={`${onboarding.vehicleYear} ${onboarding.vehicleMake} ${onboarding.vehicleModel}`}
                />
              )}

              {currentScreen === "WiringDiagrams" && (
                <WiringDiagramsScreen
                  onBack={() => goBack()}
                  vehicle={`${onboarding.vehicleYear} ${onboarding.vehicleMake} ${onboarding.vehicleModel}`}
                />
              )}

              {currentScreen === "Index" && (
                <IndexScreen onBack={() => goBack()} onNavigate={(screen) => setCurrentScreen(screen as Screen)} />
              )}

              {currentScreen === "Garage" && (
                <GarageScreen 
                  onBack={() => goBack()} 
                  onSelectVehicle={(v) => {
                    updateData("vehicleMake", v.make);
                    updateData("vehicleModel", v.model);
                    updateData("vehicleYear", v.year);
                    updateData("vehicleVin", v.vin);
                    goBack();
                  }}
                />
              )}

              {currentScreen === "KnowledgeBase" && (
                <KnowledgeBaseScreen 
                  onBack={() => goBack()} 
                  vehicle={`${onboarding.vehicleYear} ${onboarding.vehicleMake} ${onboarding.vehicleModel}`}
                />
              )}

              {currentScreen === "PartsCatalog" && (
                <PartsCatalogScreen 
                  onBack={() => goBack()} 
                  vehicleMake={onboarding.vehicleMake}
                />
              )}

              {currentScreen === "CrmDashboard" && (
                <CrmDashboardScreen 
                  onBack={() => goBack()} 
                />
              )}

              {currentScreen === "DviModule" && (
                <DviScreen 
                  onBack={() => goBack()} 
                />
              )}

              {currentScreen === "TimeClock" && (
                <TimeClockScreen 
                  onBack={() => goBack()} 
                />
              )}

              {currentScreen === "AdasCalibration" && (
                <AdasCalibrationScreen 
                  onBack={() => goBack()} 
                />
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Navigation */}
          {["Main", "Diagnostics", "LiveData", "Terminal", "Chat", "Inventory"].includes(
            currentScreen,
          ) &&
            user && (
              <BottomNavBar
                currentTab={currentScreen}
                onTabSelect={(id) => setCurrentScreen(id as Screen)}
              />
            )}
        </div>
      </div>
    </div>
  );
}
