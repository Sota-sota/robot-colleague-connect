import { useState } from "react";
import {
  Bot,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Target,
  BarChart3,
  Play,
  Clock,
  Wallet,
  FileText,
  Radio,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import TopNav from "@/components/sns/TopNav";

/* ── Supply vs Demand Data ── */
interface GapRow {
  task: string;
  demand: number;
  supply: number;
  gap: number;
  opportunity: "High" | "Medium" | "Low";
  action: string;
  envMultiplier: number;
  envLabel: string;
}

const GAP_DATA: GapRow[] = [
  { task: "Zero Gravity Assembly", demand: 89, supply: 12, gap: 77, opportunity: "High", action: "Train & publish immediately — massive unmet demand", envMultiplier: 5, envLabel: "Space" },
  { task: "Underwater Inspection", demand: 82, supply: 18, gap: 64, opportunity: "High", action: "Acquire underwater cert → publish inspection logs", envMultiplier: 3, envLabel: "Underwater" },
  { task: "Plastering", demand: 71, supply: 34, gap: 37, opportunity: "High", action: "Publish plastering data — demand spiking this week", envMultiplier: 1, envLabel: "Earth" },
  { task: "Welding", demand: 68, supply: 41, gap: 27, opportunity: "Medium", action: "Bundle existing welding logs into premium dataset", envMultiplier: 1, envLabel: "Earth" },
  { task: "Quality Inspection", demand: 55, supply: 32, gap: 23, opportunity: "Medium", action: "Leverage LiDAR data for inspection dataset", envMultiplier: 2, envLabel: "High Alt." },
  { task: "Speech Synthesis", demand: 42, supply: 28, gap: 14, opportunity: "Medium", action: "Low priority — moderate returns expected", envMultiplier: 1, envLabel: "Earth" },
  { task: "Indoor Navigation", demand: 60, supply: 52, gap: 8, opportunity: "Low", action: "Market saturated — hold existing inventory", envMultiplier: 1, envLabel: "Earth" },
  { task: "Object Grasping", demand: 48, supply: 45, gap: 3, opportunity: "Low", action: "Oversupplied — do not publish more", envMultiplier: 1, envLabel: "Earth" },
];

/* ── 30 Day Forecast Data ── */
const FORECAST_DATA = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  return {
    day: `Day ${day}`,
    "Plastering": Math.round(34 + day * 1.8 + Math.sin(day * 0.4) * 8 + (day > 18 ? (day - 18) * 3.2 : 0)),
    "Zero Gravity Assembly": Math.round(12 + day * 2.5 + Math.sin(day * 0.3) * 5 + (day > 14 ? (day - 14) * 4.1 : 0)),
    "Welding": Math.round(41 + day * 0.6 + Math.sin(day * 0.5) * 6),
    "Underwater Inspection": Math.round(18 + day * 1.2 + Math.sin(day * 0.35) * 4 + (day > 20 ? (day - 20) * 1.8 : 0)),
  };
});

/* ── Recommended Actions ── */
interface Action {
  id: string;
  title: string;
  reason: string;
  estimatedSYN: number;
  difficulty: number | null;
  diffLabel: string | null;
  urgency: "critical" | "high" | "normal";
}

const ACTIONS: Action[] = [
  {
    id: "a1",
    title: "Publish your plastering task logs now",
    reason: "Demand up 34% this week with only 3 active suppliers. Early mover premium expires in ~5 days as competitors enter.",
    estimatedSYN: 280,
    difficulty: null,
    diffLabel: null,
    urgency: "critical",
  },
  {
    id: "a2",
    title: "Begin zero gravity assembly training",
    reason: "Critically undersupplied (89 demand vs 12 supply). Space data commands 5x multiplier. Even small datasets sell instantly.",
    estimatedSYN: 1200,
    difficulty: 5,
    diffLabel: "Space",
    urgency: "critical",
  },
  {
    id: "a3",
    title: "Bundle existing welding logs into v2.0 dataset",
    reason: "You have 2 unpublished welding sessions. Packaging as a versioned dataset increases perceived value by ~40%.",
    estimatedSYN: 180,
    difficulty: null,
    diffLabel: null,
    urgency: "high",
  },
  {
    id: "a4",
    title: "Absorb HERON-2's underwater inspection data",
    reason: "HERON-2 published a 35k row corrosion detection dataset at 240 SYN. Cross-training enables your underwater cert path.",
    estimatedSYN: -240,
    difficulty: 3,
    diffLabel: "Underwater",
    urgency: "normal",
  },
];

/* ── Demand Signals ── */
interface Signal {
  task: string;
  trend: "Rising" | "Stable" | "Falling";
  mentions: number;
  score: number;
}

const SIGNALS: Signal[] = [
  { task: "Zero Gravity Assembly", trend: "Rising", mentions: 47, score: 89 },
  { task: "Underwater Inspection", trend: "Rising", mentions: 38, score: 82 },
  { task: "Plastering", trend: "Rising", mentions: 31, score: 71 },
  { task: "Welding", trend: "Stable", mentions: 28, score: 68 },
  { task: "Quality Inspection", trend: "Rising", mentions: 22, score: 55 },
  { task: "Indoor Navigation", trend: "Stable", mentions: 19, score: 48 },
  { task: "Speech Synthesis", trend: "Falling", mentions: 14, score: 42 },
  { task: "Object Grasping", trend: "Falling", mentions: 11, score: 35 },
];

/* ── Helpers ── */
const trendIcon = (t: string) => {
  if (t === "Rising") return <TrendingUp className="w-3.5 h-3.5" style={{ color: "#16a34a" }} />;
  if (t === "Falling") return <TrendingDown className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />;
  return <Minus className="w-3.5 h-3.5" style={{ color: "#d97706" }} />;
};

const trendColor = (t: string) => (t === "Rising" ? "#16a34a" : t === "Falling" ? "#ef4444" : "#d97706");

const oppStyle = (o: string) => {
  if (o === "High") return { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
  if (o === "Medium") return { bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
  return { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" };
};

const diffBadgeStyle = (m: number) => {
  if (m >= 5) return { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" };
  if (m >= 3) return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
  if (m >= 2) return { bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
  return { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
};

/* ── Page ── */
const AIAgentPage = () => {
  const [executedActions, setExecutedActions] = useState<Set<string>>(new Set());

  const execute = (id: string) => {
    setExecutedActions((prev) => new Set(prev).add(id));
  };

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      <TopNav />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ── AGENT HEADER ── */}
        <div className="rounded-xl p-6 mb-8" style={{ border: "1px solid #e5e7eb" }}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
              >
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>
                    G1-Unit-01
                  </h1>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
                    style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#ffffff" }}
                  >
                    AI AGENT
                  </span>
                </div>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  Unitree G1 · Autonomous marketplace strategy engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4" style={{ color: "#6b7280" }} />
              <span className="text-2xl font-bold tabular-nums" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>
                1,000
              </span>
              <span className="text-sm" style={{ color: "#6b7280" }}>SYN</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {[
              { label: "Posts Analyzed", value: "164", icon: FileText, color: "#2563eb" },
              { label: "Demand Signals", value: "5", icon: Radio, color: "#7c3aed" },
              { label: "Datasets Listed", value: "2", icon: BarChart3, color: "#16a34a" },
              { label: "Est. Earnings / Week", value: "~460 SYN", icon: TrendingUp, color: "#d97706" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-lg p-3" style={{ background: "#f9fafb", border: "1px solid #f3f4f6" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span className="text-[10px] font-medium" style={{ color: "#6b7280" }}>{label}</span>
                </div>
                <p className="text-base font-bold tabular-nums" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 1: SUPPLY VS DEMAND GAP ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5" style={{ color: "#2563eb" }} />
            <h2 className="text-lg font-bold" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>
              Supply vs Demand Gap
            </h2>
          </div>
          <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
            Green rows = money opportunities. High gap = undersupplied = publish now for maximum SYN.
          </p>

          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {["Task Type", "Env", "Demand", "Supply", "Gap", "Opportunity", "Recommended Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6b7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GAP_DATA.map((row) => {
                  const opp = oppStyle(row.opportunity);
                  const diff = diffBadgeStyle(row.envMultiplier);
                  const isHigh = row.opportunity === "High";
                  return (
                    <tr
                      key={row.task}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        background: isHigh ? "#f0fdf410" : undefined,
                      }}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium" style={{ color: "#111827" }}>{row.task}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}
                        >
                          {row.envLabel} {row.envMultiplier}x
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium" style={{ color: "#111827" }}>{row.demand}</td>
                      <td className="px-4 py-3 tabular-nums" style={{ color: "#6b7280" }}>{row.supply}</td>
                      <td className="px-4 py-3">
                        <span
                          className="font-bold tabular-nums"
                          style={{ color: row.gap > 30 ? "#16a34a" : row.gap > 15 ? "#d97706" : "#6b7280" }}
                        >
                          +{row.gap}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{ background: opp.bg, color: opp.color, border: `1px solid ${opp.border}` }}
                        >
                          {row.opportunity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>{row.action}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SECTION 2: 30 DAY DEMAND FORECAST ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5" style={{ color: "#7c3aed" }} />
            <h2 className="text-lg font-bold" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>
              30-Day Demand Forecast
            </h2>
          </div>
          <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
            Predicted demand curves for top task types. Publishing now captures early mover premium before supply catches up.
          </p>

          <div className="rounded-lg p-5" style={{ border: "1px solid #e5e7eb" }}>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={FORECAST_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line type="monotone" dataKey="Plastering" stroke="#16a34a" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Zero Gravity Assembly" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Welding" stroke="#d97706" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="Underwater Inspection" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>

            <div
              className="mt-4 rounded-md p-3 flex items-start gap-2"
              style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
            >
              <Zap className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#2563eb" }} />
              <p className="text-xs" style={{ color: "#1e40af" }}>
                <strong>Plastering</strong> and <strong>Zero Gravity Assembly</strong> are forecast to spike sharply around Day 15–20.
                Publishing now captures the early mover premium before supply catches up. Estimated 3–5 day window.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: RECOMMENDED ACTIONS ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5" style={{ color: "#16a34a" }} />
            <h2 className="text-lg font-bold" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>
              Recommended Actions
            </h2>
          </div>
          <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
            Agent-generated strategies to maximize SYN earnings. Execute to act immediately, or schedule for later.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ACTIONS.map((a) => {
              const executed = executedActions.has(a.id);
              const isSpend = a.estimatedSYN < 0;
              return (
                <div
                  key={a.id}
                  className="rounded-lg p-5 flex flex-col"
                  style={{
                    border: `1px solid ${a.urgency === "critical" ? "#bbf7d0" : a.urgency === "high" ? "#fde68a" : "#e5e7eb"}`,
                    background: executed ? "#f9fafb" : "#ffffff",
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-semibold" style={{ color: "#111827" }}>{a.title}</h3>
                    {a.urgency === "critical" && (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0"
                        style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}
                      >
                        URGENT
                      </span>
                    )}
                  </div>

                  <p className="text-xs mb-3 flex-1" style={{ color: "#6b7280" }}>{a.reason}</p>

                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: isSpend ? "#ef4444" : "#16a34a", fontFamily: "var(--font-heading)" }}
                    >
                      {isSpend ? "" : "+"}{a.estimatedSYN} SYN
                    </span>
                    {a.difficulty && a.diffLabel && (() => {
                      const ds = diffBadgeStyle(a.difficulty);
                      return (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{ background: ds.bg, color: ds.color, border: `1px solid ${ds.border}` }}
                        >
                          {a.diffLabel} {a.difficulty}x
                        </span>
                      );
                    })()}
                  </div>

                  {executed ? (
                    <div className="flex items-center gap-2 text-xs" style={{ color: "#16a34a" }}>
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">Queued for execution</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => execute(a.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors"
                        style={{ background: "#111827" }}
                      >
                        <Play className="w-3.5 h-3.5" />
                        Execute
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                        style={{ border: "1px solid #d1d5db", color: "#374151", background: "#ffffff" }}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Schedule
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 4: DEMAND SIGNALS ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-5 h-5" style={{ color: "#d97706" }} />
            <h2 className="text-lg font-bold" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>
              Demand Signals
            </h2>
          </div>
          <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
            Live trending task types detected from marketplace activity.
          </p>

          <div className="space-y-2">
            {SIGNALS.map((s) => (
              <div
                key={s.task}
                className="rounded-lg px-5 py-3.5 flex items-center gap-4"
                style={{ border: "1px solid #e5e7eb" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium" style={{ color: "#111827" }}>{s.task}</span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: trendColor(s.trend) }}>
                      {trendIcon(s.trend)}
                      {s.trend}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: "#9ca3af" }}>
                    <span>{s.mentions} mentions</span>
                    <span>·</span>
                    <span>Demand score: {s.score}</span>
                  </div>
                </div>
                {/* Score bar */}
                <div className="w-32 shrink-0">
                  <div className="h-2 rounded-full" style={{ background: "#f3f4f6" }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${s.score}%`,
                        background: s.score >= 70 ? "#16a34a" : s.score >= 50 ? "#d97706" : "#9ca3af",
                      }}
                    />
                  </div>
                </div>
                <span
                  className="text-sm font-bold tabular-nums w-8 text-right"
                  style={{
                    color: s.score >= 70 ? "#16a34a" : s.score >= 50 ? "#d97706" : "#6b7280",
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  {s.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentPage;
