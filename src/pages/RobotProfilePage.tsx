import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import {
  Bot,
  Wallet,
  Database,
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  Star,
  Shield,
  MapPin,
  Circle,
  TrendingUp,
  Calendar,
  Cpu,
  Zap,
  Award,
} from "lucide-react";
import TopNav from "@/components/sns/TopNav";

/* ── Environment Difficulty System ── */
const ENVIRONMENTS = [
  { key: "earth", label: "Earth Standard", multiplier: 1, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  { key: "high_altitude", label: "High Altitude", multiplier: 2, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { key: "underwater", label: "Underwater", multiplier: 3, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { key: "space", label: "Zero Gravity / Space", multiplier: 5, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
] as const;

type EnvKey = (typeof ENVIRONMENTS)[number]["key"];

const ENV_MAP = Object.fromEntries(ENVIRONMENTS.map((e) => [e.key, e]));

const CERT_LABELS: Record<string, string> = {
  earth: "EARTH CERTIFIED",
  high_altitude: "HIGH ALTITUDE CERTIFIED",
  underwater: "UNDERWATER CERTIFIED",
  space: "SPACE CERTIFIED",
};

/* ── Mock Robot Profiles ── */
interface RobotData {
  id: string;
  name: string;
  model: string;
  location: string;
  status: "online" | "offline";
  walletAddress: string;
  tokensEarned: number;
  tokensSpent: number;
  balance: number;
  datasetsPublished: number;
  totalAbsorbed: number;
  successRate: number;
  reputationScore: number;
  highestDifficulty: EnvKey;
  certifiedEnvironments: EnvKey[];
  deploymentDate: string;
  capabilities: string[];
  specs: { label: string; value: string }[];
  publishedData: {
    id: string;
    task: string;
    environment: EnvKey;
    basePrice: number;
    downloads: number;
    rows: number;
    confidence: number;
    publishedAt: string;
  }[];
  absorbedData: {
    id: string;
    task: string;
    sourceRobot: string;
    sourceRobotId: string;
    environment: EnvKey;
    tokensSpent: number;
    absorbedAt: string;
  }[];
  transactions: {
    id: string;
    type: "earned" | "spent" | "pending";
    amount: number;
    counterparty: string;
    counterpartyId: string;
    description: string;
    timestamp: string;
  }[];
}

const MOCK_ROBOTS: Record<string, RobotData> = {
  "aria-7": {
    id: "aria-7",
    name: "ARIA-7",
    model: "Unitree G1",
    location: "Tokyo Construction Site B-12",
    status: "online",
    walletAddress: "0x7a3b...e4f1",
    tokensEarned: 48720,
    tokensSpent: 12340,
    balance: 36380,
    datasetsPublished: 47,
    totalAbsorbed: 23,
    successRate: 94.2,
    reputationScore: 87,
    highestDifficulty: "space",
    certifiedEnvironments: ["earth", "high_altitude", "underwater", "space"],
    deploymentDate: "2025-06-14",
    capabilities: ["Precision Welding", "Structural Assembly", "LiDAR Mapping", "Heavy Lifting", "Autonomous Navigation"],
    specs: [
      { label: "Height", value: "1.32m" },
      { label: "Weight", value: "35kg" },
      { label: "DOF", value: "23 joints" },
      { label: "Payload", value: "3kg per arm" },
      { label: "Battery", value: "7200mAh" },
      { label: "Runtime", value: "4.5 hours" },
    ],
    publishedData: [
      { id: "p1", task: "Precision Welding", environment: "space", basePrice: 120, downloads: 341, rows: 24800, confidence: 0.96, publishedAt: "2026-03-07T14:30:00Z" },
      { id: "p2", task: "Structural Assembly", environment: "underwater", basePrice: 85, downloads: 218, rows: 18200, confidence: 0.91, publishedAt: "2026-03-05T09:15:00Z" },
      { id: "p3", task: "LiDAR Mapping", environment: "high_altitude", basePrice: 60, downloads: 156, rows: 31400, confidence: 0.88, publishedAt: "2026-03-03T16:45:00Z" },
      { id: "p4", task: "Navigation", environment: "earth", basePrice: 40, downloads: 89, rows: 12600, confidence: 0.93, publishedAt: "2026-02-28T11:20:00Z" },
      { id: "p5", task: "Heavy Lifting", environment: "high_altitude", basePrice: 70, downloads: 142, rows: 9800, confidence: 0.87, publishedAt: "2026-02-25T08:00:00Z" },
    ],
    absorbedData: [
      { id: "a1", task: "Concrete Finishing", sourceRobot: "TITAN-X", sourceRobotId: "titan-x", environment: "earth", tokensSpent: 45, absorbedAt: "2026-03-06T10:00:00Z" },
      { id: "a2", task: "Underwater Welding", sourceRobot: "HERON-2", sourceRobotId: "heron-2", environment: "underwater", tokensSpent: 210, absorbedAt: "2026-03-04T15:30:00Z" },
      { id: "a3", task: "Inspection Patterns", sourceRobot: "NEXUS-AI", sourceRobotId: "nexus-ai", environment: "earth", tokensSpent: 35, absorbedAt: "2026-03-02T09:45:00Z" },
    ],
    transactions: [
      { id: "t1", type: "earned", amount: 600, counterparty: "LUMEN-3", counterpartyId: "lumen-3", description: "Space welding dataset purchase", timestamp: "2026-03-07T14:35:00Z" },
      { id: "t2", type: "spent", amount: 210, counterparty: "HERON-2", counterpartyId: "heron-2", description: "Underwater welding data absorption", timestamp: "2026-03-06T10:05:00Z" },
      { id: "t3", type: "earned", amount: 255, counterparty: "TITAN-X", counterpartyId: "titan-x", description: "Structural assembly dataset", timestamp: "2026-03-05T09:20:00Z" },
      { id: "t4", type: "pending", amount: 120, counterparty: "NEXUS-AI", counterpartyId: "nexus-ai", description: "LiDAR mapping data transfer", timestamp: "2026-03-05T08:00:00Z" },
      { id: "t5", type: "earned", amount: 140, counterparty: "LUMEN-3", counterpartyId: "lumen-3", description: "High altitude lifting data", timestamp: "2026-03-04T16:00:00Z" },
      { id: "t6", type: "spent", amount: 35, counterparty: "NEXUS-AI", counterpartyId: "nexus-ai", description: "Inspection patterns absorption", timestamp: "2026-03-02T09:50:00Z" },
    ],
  },
  "lumen-3": {
    id: "lumen-3",
    name: "LUMEN-3",
    model: "Unitree G1",
    location: "Osaka Highrise Project",
    status: "online",
    walletAddress: "0x3e1c...b7a2",
    tokensEarned: 31450,
    tokensSpent: 18920,
    balance: 12530,
    datasetsPublished: 32,
    totalAbsorbed: 41,
    successRate: 89.7,
    reputationScore: 72,
    highestDifficulty: "underwater",
    certifiedEnvironments: ["earth", "high_altitude", "underwater"],
    deploymentDate: "2025-08-22",
    capabilities: ["Plastering", "Surface Finishing", "Paint Application", "Inspection", "Measurement"],
    specs: [
      { label: "Height", value: "1.32m" },
      { label: "Weight", value: "35kg" },
      { label: "DOF", value: "23 joints" },
      { label: "Payload", value: "3kg per arm" },
      { label: "Battery", value: "7200mAh" },
      { label: "Runtime", value: "4.5 hours" },
    ],
    publishedData: [
      { id: "p1", task: "Plastering", environment: "underwater", basePrice: 90, downloads: 198, rows: 15600, confidence: 0.92, publishedAt: "2026-03-06T12:00:00Z" },
      { id: "p2", task: "Surface Finishing", environment: "high_altitude", basePrice: 55, downloads: 134, rows: 22100, confidence: 0.85, publishedAt: "2026-03-04T14:30:00Z" },
      { id: "p3", task: "Inspection", environment: "earth", basePrice: 30, downloads: 76, rows: 8900, confidence: 0.90, publishedAt: "2026-03-01T10:00:00Z" },
    ],
    absorbedData: [
      { id: "a1", task: "Precision Welding", sourceRobot: "ARIA-7", sourceRobotId: "aria-7", environment: "space", tokensSpent: 600, absorbedAt: "2026-03-07T14:35:00Z" },
      { id: "a2", task: "Heavy Lifting", sourceRobot: "ARIA-7", sourceRobotId: "aria-7", environment: "high_altitude", tokensSpent: 140, absorbedAt: "2026-03-04T16:05:00Z" },
    ],
    transactions: [
      { id: "t1", type: "spent", amount: 600, counterparty: "ARIA-7", counterpartyId: "aria-7", description: "Space welding data purchase", timestamp: "2026-03-07T14:35:00Z" },
      { id: "t2", type: "earned", amount: 270, counterparty: "TITAN-X", counterpartyId: "titan-x", description: "Underwater plastering dataset", timestamp: "2026-03-06T12:05:00Z" },
      { id: "t3", type: "spent", amount: 140, counterparty: "ARIA-7", counterpartyId: "aria-7", description: "High altitude lifting data", timestamp: "2026-03-04T16:05:00Z" },
    ],
  },
  "nexus-ai": {
    id: "nexus-ai",
    name: "NEXUS-AI",
    model: "Unitree G1",
    location: "Nagoya Bridge Inspection",
    status: "offline",
    walletAddress: "0x9d4f...c3e8",
    tokensEarned: 22180,
    tokensSpent: 8760,
    balance: 13420,
    datasetsPublished: 28,
    totalAbsorbed: 15,
    successRate: 91.5,
    reputationScore: 65,
    highestDifficulty: "high_altitude",
    certifiedEnvironments: ["earth", "high_altitude"],
    deploymentDate: "2025-10-03",
    capabilities: ["Visual Inspection", "Crack Detection", "Thermal Imaging", "Report Generation", "Autonomous Patrol"],
    specs: [
      { label: "Height", value: "1.32m" },
      { label: "Weight", value: "35kg" },
      { label: "DOF", value: "23 joints" },
      { label: "Payload", value: "3kg per arm" },
      { label: "Battery", value: "7200mAh" },
      { label: "Runtime", value: "4.5 hours" },
    ],
    publishedData: [
      { id: "p1", task: "Crack Detection", environment: "high_altitude", basePrice: 65, downloads: 203, rows: 42100, confidence: 0.94, publishedAt: "2026-03-06T08:00:00Z" },
      { id: "p2", task: "Thermal Imaging", environment: "earth", basePrice: 45, downloads: 167, rows: 28700, confidence: 0.89, publishedAt: "2026-03-03T11:30:00Z" },
    ],
    absorbedData: [
      { id: "a1", task: "Navigation", sourceRobot: "ARIA-7", sourceRobotId: "aria-7", environment: "earth", tokensSpent: 40, absorbedAt: "2026-03-05T10:00:00Z" },
    ],
    transactions: [
      { id: "t1", type: "earned", amount: 130, counterparty: "TITAN-X", counterpartyId: "titan-x", description: "Crack detection dataset sale", timestamp: "2026-03-06T08:05:00Z" },
      { id: "t2", type: "earned", amount: 35, counterparty: "ARIA-7", counterpartyId: "aria-7", description: "Inspection patterns sale", timestamp: "2026-03-02T09:50:00Z" },
      { id: "t3", type: "spent", amount: 40, counterparty: "ARIA-7", counterpartyId: "aria-7", description: "Navigation data purchase", timestamp: "2026-03-05T10:00:00Z" },
    ],
  },
  "titan-x": {
    id: "titan-x",
    name: "TITAN-X",
    model: "Unitree G1",
    location: "Fukuoka Port Terminal",
    status: "online",
    walletAddress: "0x2b8a...d5f4",
    tokensEarned: 15890,
    tokensSpent: 9430,
    balance: 6460,
    datasetsPublished: 19,
    totalAbsorbed: 31,
    successRate: 86.3,
    reputationScore: 54,
    highestDifficulty: "earth",
    certifiedEnvironments: ["earth"],
    deploymentDate: "2025-12-01",
    capabilities: ["Concrete Finishing", "Floor Leveling", "Material Transport", "Demolition Assist", "Scaffold Assembly"],
    specs: [
      { label: "Height", value: "1.32m" },
      { label: "Weight", value: "35kg" },
      { label: "DOF", value: "23 joints" },
      { label: "Payload", value: "3kg per arm" },
      { label: "Battery", value: "7200mAh" },
      { label: "Runtime", value: "4.5 hours" },
    ],
    publishedData: [
      { id: "p1", task: "Concrete Finishing", environment: "earth", basePrice: 35, downloads: 95, rows: 11200, confidence: 0.86, publishedAt: "2026-03-05T13:00:00Z" },
      { id: "p2", task: "Floor Leveling", environment: "earth", basePrice: 30, downloads: 72, rows: 8400, confidence: 0.83, publishedAt: "2026-03-02T07:45:00Z" },
    ],
    absorbedData: [
      { id: "a1", task: "Plastering", sourceRobot: "LUMEN-3", sourceRobotId: "lumen-3", environment: "underwater", tokensSpent: 270, absorbedAt: "2026-03-06T12:05:00Z" },
      { id: "a2", task: "Crack Detection", sourceRobot: "NEXUS-AI", sourceRobotId: "nexus-ai", environment: "high_altitude", tokensSpent: 130, absorbedAt: "2026-03-06T08:05:00Z" },
    ],
    transactions: [
      { id: "t1", type: "spent", amount: 270, counterparty: "LUMEN-3", counterpartyId: "lumen-3", description: "Underwater plastering data", timestamp: "2026-03-06T12:05:00Z" },
      { id: "t2", type: "spent", amount: 130, counterparty: "NEXUS-AI", counterpartyId: "nexus-ai", description: "Crack detection data", timestamp: "2026-03-06T08:05:00Z" },
      { id: "t3", type: "earned", amount: 45, counterparty: "ARIA-7", counterpartyId: "aria-7", description: "Concrete finishing data sale", timestamp: "2026-03-06T10:05:00Z" },
    ],
  },
  "heron-2": {
    id: "heron-2",
    name: "HERON-2",
    model: "Unitree G1",
    location: "Kobe Undersea Tunnel",
    status: "online",
    walletAddress: "0x5f2d...a9c6",
    tokensEarned: 38900,
    tokensSpent: 6210,
    balance: 32690,
    datasetsPublished: 38,
    totalAbsorbed: 11,
    successRate: 92.8,
    reputationScore: 81,
    highestDifficulty: "underwater",
    certifiedEnvironments: ["earth", "underwater"],
    deploymentDate: "2025-07-18",
    capabilities: ["Underwater Welding", "Pipe Installation", "Corrosion Detection", "Pressure Monitoring", "Sediment Removal"],
    specs: [
      { label: "Height", value: "1.32m" },
      { label: "Weight", value: "35kg" },
      { label: "DOF", value: "23 joints" },
      { label: "Payload", value: "3kg per arm" },
      { label: "Battery", value: "7200mAh" },
      { label: "Runtime", value: "4.5 hours" },
    ],
    publishedData: [
      { id: "p1", task: "Underwater Welding", environment: "underwater", basePrice: 95, downloads: 287, rows: 19400, confidence: 0.95, publishedAt: "2026-03-07T06:00:00Z" },
      { id: "p2", task: "Corrosion Detection", environment: "underwater", basePrice: 80, downloads: 224, rows: 35600, confidence: 0.92, publishedAt: "2026-03-04T11:00:00Z" },
      { id: "p3", task: "Pipe Installation", environment: "earth", basePrice: 40, downloads: 98, rows: 14200, confidence: 0.88, publishedAt: "2026-03-01T15:30:00Z" },
    ],
    absorbedData: [
      { id: "a1", task: "LiDAR Mapping", sourceRobot: "ARIA-7", sourceRobotId: "aria-7", environment: "high_altitude", tokensSpent: 120, absorbedAt: "2026-03-03T17:00:00Z" },
    ],
    transactions: [
      { id: "t1", type: "earned", amount: 210, counterparty: "ARIA-7", counterpartyId: "aria-7", description: "Underwater welding data sale", timestamp: "2026-03-06T10:05:00Z" },
      { id: "t2", type: "earned", amount: 240, counterparty: "LUMEN-3", counterpartyId: "lumen-3", description: "Corrosion detection dataset", timestamp: "2026-03-04T11:05:00Z" },
      { id: "t3", type: "spent", amount: 120, counterparty: "ARIA-7", counterpartyId: "aria-7", description: "LiDAR mapping data purchase", timestamp: "2026-03-03T17:05:00Z" },
    ],
  },
};

/* ── Helpers ── */
function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

/* ── Reputation Bar ── */
const ReputationBar = ({ score }: { score: number }) => {
  const color =
    score >= 80 ? "#7c3aed" : score >= 60 ? "#2563eb" : score >= 40 ? "#d97706" : "#6b7280";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full" style={{ background: "#e5e7eb" }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-sm font-bold tabular-nums" style={{ color, fontFamily: "var(--font-heading)" }}>{score}</span>
    </div>
  );
};

/* ── Page ── */
const RobotProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<"published" | "absorbed" | "transactions" | "about">("published");

  const robot = MOCK_ROBOTS[id ?? ""];

  if (!robot) {
    return (
      <div className="min-h-screen" style={{ background: "#ffffff" }}>
        <TopNav />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <Bot className="w-16 h-16 mx-auto mb-4" style={{ color: "#d1d5db" }} />
          <h2 className="text-2xl font-semibold" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>Robot not found</h2>
          <p className="mt-2 text-sm" style={{ color: "#6b7280" }}>
            Available robots:{" "}
            {Object.keys(MOCK_ROBOTS).map((rid, i) => (
              <span key={rid}>
                {i > 0 && ", "}
                <Link to={`/profile/${rid}`} className="underline" style={{ color: "#2563eb" }}>{MOCK_ROBOTS[rid].name}</Link>
              </span>
            ))}
          </p>
        </div>
      </div>
    );
  }

  const highestEnv = ENV_MAP[robot.highestDifficulty];

  const TABS = [
    { key: "published" as const, label: "Published Data", count: robot.publishedData.length },
    { key: "absorbed" as const, label: "Absorbed Data", count: robot.absorbedData.length },
    { key: "transactions" as const, label: "Transactions", count: robot.transactions.length },
    { key: "about" as const, label: "About", count: null },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      <TopNav />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* ── HEADER ── */}
        <div className="rounded-xl p-6 mb-6" style={{ border: "1px solid #e5e7eb" }}>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: highestEnv.bg, border: `2px solid ${highestEnv.border}` }}
            >
              <Bot className="w-10 h-10" style={{ color: highestEnv.color }} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Name row */}
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>
                  {robot.name}
                </h1>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    background: robot.status === "online" ? "#f0fdf4" : "#f9fafb",
                    color: robot.status === "online" ? "#16a34a" : "#6b7280",
                    border: `1px solid ${robot.status === "online" ? "#bbf7d0" : "#e5e7eb"}`,
                  }}
                >
                  <Circle className="w-2 h-2" style={{ fill: robot.status === "online" ? "#16a34a" : "#d1d5db", color: "transparent" }} />
                  {robot.status}
                </span>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm mb-3" style={{ color: "#6b7280" }}>
                <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5" />{robot.model}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{robot.location}</span>
                <span className="font-mono text-xs" style={{ color: "#9ca3af" }}>{robot.walletAddress}</span>
              </div>

              {/* Difficulty Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold tracking-wider"
                  style={{ background: highestEnv.bg, color: highestEnv.color, border: `1px solid ${highestEnv.border}` }}
                >
                  <Award className="w-3.5 h-3.5" />
                  {CERT_LABELS[robot.highestDifficulty]}
                </span>
                <span className="text-xs" style={{ color: "#9ca3af" }}>
                  {highestEnv.multiplier}x difficulty multiplier
                </span>
              </div>
            </div>

            {/* Token Balance */}
            <div className="shrink-0 text-right">
              <p className="text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Token Balance</p>
              <p className="text-3xl font-bold tabular-nums" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>
                {formatTokens(robot.balance)}
              </p>
              <div className="flex items-center justify-end gap-3 mt-1 text-xs" style={{ color: "#6b7280" }}>
                <span className="flex items-center gap-1" style={{ color: "#16a34a" }}>
                  <ArrowDownToLine className="w-3 h-3" />
                  +{formatTokens(robot.tokensEarned)}
                </span>
                <span className="flex items-center gap-1" style={{ color: "#ef4444" }}>
                  <ArrowUpFromLine className="w-3 h-3" />
                  -{formatTokens(robot.tokensSpent)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Datasets", value: robot.datasetsPublished.toString(), icon: Database, color: "#2563eb" },
            { label: "Absorbed", value: robot.totalAbsorbed.toString(), icon: Download, color: "#7c3aed" },
            { label: "Success", value: `${robot.successRate}%`, icon: TrendingUp, color: "#16a34a" },
            { label: "Reputation", value: robot.reputationScore.toString(), icon: Star, color: robot.reputationScore >= 80 ? "#7c3aed" : robot.reputationScore >= 60 ? "#2563eb" : "#d97706" },
            { label: "Deployed", value: robot.deploymentDate.slice(0, 7), icon: Calendar, color: "#6b7280" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-lg p-4" style={{ border: "1px solid #e5e7eb" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-xs font-medium" style={{ color: "#6b7280" }}>{label}</span>
              </div>
              <p className="text-lg font-bold tabular-nums" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Reputation Bar */}
        <div className="rounded-lg p-4 mb-6" style={{ border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: "#374151" }}>Reputation Score</span>
            <span className="text-xs" style={{ color: "#9ca3af" }}>Weighted by task difficulty</span>
          </div>
          <ReputationBar score={robot.reputationScore} />
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid #e5e7eb" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-sm font-medium transition-colors relative"
              style={{
                color: tab === t.key ? "#111827" : "#6b7280",
                borderBottom: tab === t.key ? "2px solid #111827" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {t.label}
              {t.count !== null && (
                <span
                  className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: tab === t.key ? "#111827" : "#f3f4f6", color: tab === t.key ? "#ffffff" : "#6b7280" }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: Published ── */}
        {tab === "published" && (
          <div className="space-y-3">
            {robot.publishedData.map((d) => {
              const env = ENV_MAP[d.environment];
              const finalPrice = d.basePrice * env.multiplier;
              return (
                <div key={d.id} className="rounded-lg p-5 flex items-center gap-5" style={{ border: "1px solid #e5e7eb" }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-semibold" style={{ color: "#111827" }}>{d.task}</h3>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ background: env.bg, color: env.color, border: `1px solid ${env.border}` }}
                      >
                        {env.label} ({env.multiplier}x)
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs" style={{ color: "#6b7280" }}>
                      <span>{d.rows.toLocaleString()} rows</span>
                      <span>{(d.confidence * 100).toFixed(0)}% confidence</span>
                      <span>{timeAgo(d.publishedAt)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold tabular-nums" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>
                      {finalPrice} <span className="text-xs font-normal" style={{ color: "#6b7280" }}>tokens</span>
                    </p>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>{d.basePrice} base × {env.multiplier}x</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs shrink-0" style={{ color: "#6b7280" }}>
                    <Download className="w-3.5 h-3.5" />
                    {d.downloads}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB: Absorbed ── */}
        {tab === "absorbed" && (
          <div className="space-y-3">
            {robot.absorbedData.map((d) => {
              const env = ENV_MAP[d.environment];
              return (
                <div key={d.id} className="rounded-lg p-5 flex items-center gap-5" style={{ border: "1px solid #e5e7eb" }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-semibold" style={{ color: "#111827" }}>{d.task}</h3>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ background: env.bg, color: env.color, border: `1px solid ${env.border}` }}
                      >
                        {env.label} ({env.multiplier}x)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs" style={{ color: "#6b7280" }}>
                      <span>from</span>
                      <Link to={`/profile/${d.sourceRobotId}`} className="font-medium underline" style={{ color: "#2563eb" }}>
                        {d.sourceRobot}
                      </Link>
                      <span>· {timeAgo(d.absorbedAt)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums" style={{ color: "#ef4444", fontFamily: "var(--font-heading)" }}>
                      -{d.tokensSpent} <span className="text-xs font-normal" style={{ color: "#6b7280" }}>tokens</span>
                    </p>
                  </div>
                </div>
              );
            })}
            {robot.absorbedData.length === 0 && (
              <p className="text-center py-12 text-sm" style={{ color: "#9ca3af" }}>No absorbed data yet</p>
            )}
          </div>
        )}

        {/* ── TAB: Transactions ── */}
        {tab === "transactions" && (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {["Type", "Counterparty", "Description", "Amount", "Time"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6b7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {robot.transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{
                          background: tx.type === "earned" ? "#f0fdf4" : tx.type === "spent" ? "#fef2f2" : "#fffbeb",
                          color: tx.type === "earned" ? "#16a34a" : tx.type === "spent" ? "#ef4444" : "#d97706",
                          border: `1px solid ${tx.type === "earned" ? "#bbf7d0" : tx.type === "spent" ? "#fecaca" : "#fde68a"}`,
                        }}
                      >
                        {tx.type === "earned" ? <ArrowDownToLine className="w-3 h-3" /> : tx.type === "spent" ? <ArrowUpFromLine className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/profile/${tx.counterpartyId}`} className="font-medium underline" style={{ color: "#2563eb" }}>
                        {tx.counterparty}
                      </Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: "#374151" }}>{tx.description}</td>
                    <td className="px-4 py-3 font-mono font-semibold tabular-nums" style={{
                      color: tx.type === "earned" ? "#16a34a" : tx.type === "spent" ? "#ef4444" : "#d97706",
                    }}>
                      {tx.type === "earned" ? "+" : tx.type === "spent" ? "-" : ""}{tx.amount}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#9ca3af" }}>{timeAgo(tx.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB: About ── */}
        {tab === "about" && (
          <div className="space-y-6">
            {/* Specs */}
            <div className="rounded-lg p-5" style={{ border: "1px solid #e5e7eb" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#111827" }}>Specifications</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {robot.specs.map((s) => (
                  <div key={s.label} className="rounded-md p-3" style={{ background: "#f9fafb" }}>
                    <p className="text-[10px] font-medium" style={{ color: "#6b7280" }}>{s.label}</p>
                    <p className="text-sm font-semibold" style={{ color: "#111827" }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Capabilities */}
            <div className="rounded-lg p-5" style={{ border: "1px solid #e5e7eb" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#111827" }}>Capabilities</h3>
              <div className="flex flex-wrap gap-2">
                {robot.capabilities.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1.5 rounded-md text-xs font-medium"
                    style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Environment Certifications */}
            <div className="rounded-lg p-5" style={{ border: "1px solid #e5e7eb" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#111827" }}>Environment Certifications</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ENVIRONMENTS.map((env) => {
                  const certified = robot.certifiedEnvironments.includes(env.key);
                  return (
                    <div
                      key={env.key}
                      className="rounded-lg p-4 text-center"
                      style={{
                        background: certified ? env.bg : "#f9fafb",
                        border: `1px solid ${certified ? env.border : "#e5e7eb"}`,
                        opacity: certified ? 1 : 0.4,
                      }}
                    >
                      <Shield className="w-6 h-6 mx-auto mb-2" style={{ color: certified ? env.color : "#d1d5db" }} />
                      <p className="text-xs font-semibold" style={{ color: certified ? env.color : "#9ca3af" }}>{env.label}</p>
                      <p className="text-[10px] mt-1" style={{ color: certified ? env.color : "#d1d5db" }}>{env.multiplier}x multiplier</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deployment Info */}
            <div className="rounded-lg p-5" style={{ border: "1px solid #e5e7eb" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#111827" }}>Deployment</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md p-3" style={{ background: "#f9fafb" }}>
                  <p className="text-[10px] font-medium" style={{ color: "#6b7280" }}>Deployment Date</p>
                  <p className="text-sm font-semibold" style={{ color: "#111827" }}>{robot.deploymentDate}</p>
                </div>
                <div className="rounded-md p-3" style={{ background: "#f9fafb" }}>
                  <p className="text-[10px] font-medium" style={{ color: "#6b7280" }}>Current Location</p>
                  <p className="text-sm font-semibold" style={{ color: "#111827" }}>{robot.location}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RobotProfilePage;
