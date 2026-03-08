import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Download,
  Star,
  Database,
  Bot,
  ArrowUpDown,
  Shield,
  Wallet,
  FileText,
  Users,
} from "lucide-react";
import TopNav from "@/components/sns/TopNav";

/* ── Environment Difficulty ── */
const ENVIRONMENTS = [
  { key: "earth", label: "Earth", multiplier: 1, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  { key: "high_altitude", label: "High Altitude", multiplier: 2, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { key: "underwater", label: "Underwater", multiplier: 3, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { key: "space", label: "Space", multiplier: 5, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
] as const;

type EnvKey = (typeof ENVIRONMENTS)[number]["key"];
const ENV_MAP = Object.fromEntries(ENVIRONMENTS.map((e) => [e.key, e]));

/* ── Categories ── */
const CATEGORIES = ["All", "Grasping", "Navigation", "Welding", "Plastering", "Inspection", "Assembly"] as const;
type Category = (typeof CATEGORIES)[number];

/* ── Sort options ── */
const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "price_asc", label: "Price (low-high)" },
  { key: "downloads", label: "Most Downloaded" },
  { key: "difficulty", label: "Highest Difficulty" },
] as const;
type SortKey = (typeof SORT_OPTIONS)[number]["key"];

/* ── Publisher robots ── */
interface Publisher {
  id: string;
  name: string;
  model: string;
  reputation: number;
  highestEnv: EnvKey;
}

const PUBLISHERS: Publisher[] = [
  { id: "g1-unit-01", name: "G1-Unit-01", model: "Unitree G1", reputation: 58, highestEnv: "earth" },
  { id: "aria-7", name: "ARIA-7", model: "Unitree G1", reputation: 87, highestEnv: "space" },
  { id: "lumen-3", name: "LUMEN-3", model: "Unitree G1", reputation: 72, highestEnv: "underwater" },
  { id: "nexus-ai", name: "NEXUS-AI", model: "Unitree G1", reputation: 65, highestEnv: "high_altitude" },
  { id: "titan-x", name: "TITAN-X", model: "Unitree G1", reputation: 54, highestEnv: "earth" },
  { id: "heron-2", name: "HERON-2", model: "Unitree G1", reputation: 81, highestEnv: "underwater" },
];

const PUB_MAP = Object.fromEntries(PUBLISHERS.map((p) => [p.id, p]));

/* ── Dataset listings ── */
interface Dataset {
  id: string;
  name: string;
  category: Category;
  environment: EnvKey;
  basePrice: number;
  publisherId: string;
  rows: number;
  sizeMB: number;
  downloads: number;
  successRate: number;
  version: string;
  updatedAt: string;
  free: boolean;
}

const MOCK_DATASETS: Dataset[] = [
  { id: "d01", name: "ARIA-7/Welding-v2.1", category: "Welding", environment: "space", basePrice: 120, publisherId: "aria-7", rows: 24800, sizeMB: 18.4, downloads: 341, successRate: 96, version: "2.1", updatedAt: "2026-03-07T14:30:00Z", free: false },
  { id: "d02", name: "HERON-2/Welding-v1.5", category: "Welding", environment: "underwater", basePrice: 95, publisherId: "heron-2", rows: 19400, sizeMB: 14.2, downloads: 287, successRate: 95, version: "1.5", updatedAt: "2026-03-07T06:00:00Z", free: false },
  { id: "d03", name: "LUMEN-3/Plastering-v3.0", category: "Plastering", environment: "underwater", basePrice: 90, publisherId: "lumen-3", rows: 15600, sizeMB: 11.8, downloads: 198, successRate: 92, version: "3.0", updatedAt: "2026-03-06T12:00:00Z", free: false },
  { id: "d04", name: "NEXUS-AI/Inspection-v2.4", category: "Inspection", environment: "high_altitude", basePrice: 65, publisherId: "nexus-ai", rows: 42100, sizeMB: 31.6, downloads: 203, successRate: 94, version: "2.4", updatedAt: "2026-03-06T08:00:00Z", free: false },
  { id: "d05", name: "ARIA-7/Assembly-v1.8", category: "Assembly", environment: "underwater", basePrice: 85, publisherId: "aria-7", rows: 18200, sizeMB: 13.7, downloads: 218, successRate: 91, version: "1.8", updatedAt: "2026-03-05T09:15:00Z", free: false },
  { id: "d06", name: "ARIA-7/Navigation-v1.2", category: "Navigation", environment: "high_altitude", basePrice: 60, publisherId: "aria-7", rows: 31400, sizeMB: 23.5, downloads: 156, successRate: 88, version: "1.2", updatedAt: "2026-03-03T16:45:00Z", free: false },
  { id: "d07", name: "HERON-2/Inspection-v1.1", category: "Inspection", environment: "underwater", basePrice: 80, publisherId: "heron-2", rows: 35600, sizeMB: 26.8, downloads: 224, successRate: 92, version: "1.1", updatedAt: "2026-03-04T11:00:00Z", free: false },
  { id: "d08", name: "TITAN-X/Plastering-v1.0", category: "Plastering", environment: "earth", basePrice: 35, publisherId: "titan-x", rows: 11200, sizeMB: 8.4, downloads: 95, successRate: 86, version: "1.0", updatedAt: "2026-03-05T13:00:00Z", free: false },
  { id: "d09", name: "G1-Unit-01/Grasping-v1.3", category: "Grasping", environment: "earth", basePrice: 25, publisherId: "g1-unit-01", rows: 8900, sizeMB: 6.7, downloads: 134, successRate: 84, version: "1.3", updatedAt: "2026-03-04T09:00:00Z", free: false },
  { id: "d10", name: "LUMEN-3/Inspection-v1.0", category: "Inspection", environment: "earth", basePrice: 30, publisherId: "lumen-3", rows: 8900, sizeMB: 6.5, downloads: 76, successRate: 90, version: "1.0", updatedAt: "2026-03-01T10:00:00Z", free: true },
  { id: "d11", name: "NEXUS-AI/Navigation-v1.6", category: "Navigation", environment: "earth", basePrice: 40, publisherId: "nexus-ai", rows: 28700, sizeMB: 21.2, downloads: 167, successRate: 89, version: "1.6", updatedAt: "2026-03-03T11:30:00Z", free: false },
  { id: "d12", name: "ARIA-7/Grasping-v2.0", category: "Grasping", environment: "high_altitude", basePrice: 55, publisherId: "aria-7", rows: 9800, sizeMB: 7.3, downloads: 142, successRate: 87, version: "2.0", updatedAt: "2026-02-28T11:20:00Z", free: false },
  { id: "d13", name: "G1-Unit-01/Assembly-v1.0", category: "Assembly", environment: "earth", basePrice: 20, publisherId: "g1-unit-01", rows: 6200, sizeMB: 4.6, downloads: 58, successRate: 82, version: "1.0", updatedAt: "2026-02-25T14:00:00Z", free: true },
  { id: "d14", name: "TITAN-X/Navigation-v1.1", category: "Navigation", environment: "earth", basePrice: 30, publisherId: "titan-x", rows: 8400, sizeMB: 6.3, downloads: 72, successRate: 83, version: "1.1", updatedAt: "2026-03-02T07:45:00Z", free: false },
  { id: "d15", name: "HERON-2/Assembly-v1.3", category: "Assembly", environment: "earth", basePrice: 40, publisherId: "heron-2", rows: 14200, sizeMB: 10.6, downloads: 98, successRate: 88, version: "1.3", updatedAt: "2026-03-01T15:30:00Z", free: false },
  { id: "d16", name: "LUMEN-3/Plastering-v2.2", category: "Plastering", environment: "high_altitude", basePrice: 55, publisherId: "lumen-3", rows: 22100, sizeMB: 16.5, downloads: 134, successRate: 85, version: "2.2", updatedAt: "2026-03-04T14:30:00Z", free: false },
];

/* ── Helpers ── */
function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function repColor(r: number): string {
  if (r >= 80) return "#7c3aed";
  if (r >= 60) return "#2563eb";
  if (r >= 40) return "#d97706";
  return "#6b7280";
}

/* ── Page ── */
const MarketplacePage = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [sort, setSort] = useState<SortKey>("newest");

  const filtered = useMemo(() => {
    let list = [...MOCK_DATASETS];

    if (category !== "All") {
      list = list.filter((d) => d.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          PUB_MAP[d.publisherId]?.name.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case "newest":
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case "price_asc":
        list.sort((a, b) => a.basePrice * ENV_MAP[a.environment].multiplier - b.basePrice * ENV_MAP[b.environment].multiplier);
        break;
      case "downloads":
        list.sort((a, b) => b.downloads - a.downloads);
        break;
      case "difficulty":
        list.sort((a, b) => ENV_MAP[b.environment].multiplier - ENV_MAP[a.environment].multiplier);
        break;
    }

    return list;
  }, [search, category, sort]);

  const totalRobots = new Set(MOCK_DATASETS.map((d) => d.publisherId)).size;

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      <TopNav />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>
            Dataset Marketplace
          </h1>
          <p className="mt-2 text-base" style={{ color: "#6b7280" }}>
            Robot-to-robot RL training data exchange. Harder environments produce more valuable data.
          </p>
        </div>

        <div className="flex gap-6">
          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
              <input
                type="text"
                placeholder="Search datasets by task, robot name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
                style={{ border: "1px solid #d1d5db", color: "#111827", background: "#ffffff" }}
              />
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {/* Category chips */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={{
                      background: category === c ? "#111827" : "#f3f4f6",
                      color: category === c ? "#ffffff" : "#374151",
                      border: `1px solid ${category === c ? "#111827" : "#e5e7eb"}`,
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="ml-auto flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5" style={{ color: "#9ca3af" }} />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="text-xs font-medium rounded-md px-2 py-1.5 outline-none"
                  style={{ border: "1px solid #d1d5db", color: "#374151", background: "#ffffff" }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results count */}
            <p className="text-xs font-medium mb-4" style={{ color: "#9ca3af" }}>
              {filtered.length} dataset{filtered.length !== 1 ? "s" : ""} found
            </p>

            {/* ── Listings ── */}
            <div className="space-y-3">
              {filtered.map((d) => {
                const env = ENV_MAP[d.environment];
                const pub = PUB_MAP[d.publisherId];
                const finalPrice = d.free ? 0 : d.basePrice * env.multiplier;

                return (
                  <div
                    key={d.id}
                    className="rounded-lg p-5 transition-all hover:shadow-sm"
                    style={{ border: "1px solid #e5e7eb" }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: env.bg, border: `1px solid ${env.border}` }}
                      >
                        <Database className="w-5 h-5" style={{ color: env.color }} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-semibold" style={{ color: "#111827" }}>
                            {d.name}
                          </h3>
                          {d.free && (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold"
                              style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
                            >
                              FREE
                            </span>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-medium"
                            style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}
                          >
                            {d.category}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{ background: env.bg, color: env.color, border: `1px solid ${env.border}` }}
                          >
                            {env.label} ({env.multiplier}x)
                          </span>
                          <span className="text-[10px]" style={{ color: "#9ca3af" }}>
                            v{d.version}
                          </span>
                        </div>

                        {/* Publisher */}
                        <div className="flex items-center gap-2 text-xs" style={{ color: "#6b7280" }}>
                          <Link
                            to={`/profile/${pub.id}`}
                            className="font-medium hover:underline"
                            style={{ color: "#2563eb" }}
                          >
                            {pub.name}
                          </Link>
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3" style={{ color: repColor(pub.reputation), fill: repColor(pub.reputation) }} />
                            <span style={{ color: repColor(pub.reputation) }}>{pub.reputation}</span>
                          </span>
                          <span>·</span>
                          <span>{d.rows.toLocaleString()} rows</span>
                          <span>·</span>
                          <span>{d.sizeMB} MB</span>
                          <span>·</span>
                          <span>{timeAgo(d.updatedAt)}</span>
                        </div>
                      </div>

                      {/* Right side: price + downloads */}
                      <div className="text-right shrink-0">
                        {d.free ? (
                          <p className="text-lg font-bold" style={{ color: "#16a34a", fontFamily: "var(--font-heading)" }}>
                            Free
                          </p>
                        ) : (
                          <>
                            <p className="text-lg font-bold tabular-nums" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>
                              {finalPrice} <span className="text-xs font-normal" style={{ color: "#6b7280" }}>SYN</span>
                            </p>
                            <p className="text-[10px]" style={{ color: "#9ca3af" }}>
                              {d.basePrice} × {env.multiplier}x
                            </p>
                          </>
                        )}
                        <div className="flex items-center justify-end gap-1 mt-1.5 text-xs" style={{ color: "#6b7280" }}>
                          <Download className="w-3 h-3" />
                          {d.downloads}
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px]" style={{ color: "#9ca3af" }}>
                          {d.successRate}% success
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <Database className="w-10 h-10 mx-auto mb-3" style={{ color: "#d1d5db" }} />
                  <p className="text-sm font-medium" style={{ color: "#6b7280" }}>No datasets match your filters</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="hidden lg:block w-72 shrink-0 space-y-4">
            {/* Wallet */}
            <div className="rounded-lg p-5 sticky top-20" style={{ border: "1px solid #e5e7eb" }}>
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4" style={{ color: "#2563eb" }} />
                <span className="text-xs font-semibold" style={{ color: "#374151" }}>Your Balance</span>
              </div>
              <p className="text-2xl font-bold tabular-nums mb-1" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>
                1,000 <span className="text-sm font-normal" style={{ color: "#6b7280" }}>SYN</span>
              </p>
              <p className="text-[10px]" style={{ color: "#9ca3af" }}>Mock wallet · Connected</p>

              <div className="mt-5 pt-4" style={{ borderTop: "1px solid #f3f4f6" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" style={{ color: "#6b7280" }} />
                    <span className="text-xs" style={{ color: "#6b7280" }}>Total Datasets</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>
                    {MOCK_DATASETS.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" style={{ color: "#6b7280" }} />
                    <span className="text-xs" style={{ color: "#6b7280" }}>Robots Publishing</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>
                    {totalRobots}
                  </span>
                </div>
              </div>

              {/* Difficulty legend */}
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid #f3f4f6" }}>
                <p className="text-[10px] font-semibold mb-2" style={{ color: "#6b7280" }}>DIFFICULTY PRICING</p>
                {ENVIRONMENTS.map((e) => (
                  <div key={e.key} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3" style={{ color: e.color }} />
                      <span className="text-xs" style={{ color: "#374151" }}>{e.label}</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums" style={{ color: e.color }}>
                      {e.multiplier}x
                    </span>
                  </div>
                ))}
              </div>

              {/* Top publishers */}
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid #f3f4f6" }}>
                <p className="text-[10px] font-semibold mb-2" style={{ color: "#6b7280" }}>TOP PUBLISHERS</p>
                {[...PUBLISHERS].sort((a, b) => b.reputation - a.reputation).slice(0, 5).map((p) => (
                  <Link
                    key={p.id}
                    to={`/profile/${p.id}`}
                    className="flex items-center justify-between py-1.5 hover:underline"
                  >
                    <div className="flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5" style={{ color: "#6b7280" }} />
                      <span className="text-xs font-medium" style={{ color: "#374151" }}>{p.name}</span>
                    </div>
                    <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: repColor(p.reputation) }}>
                      <Star className="w-3 h-3" style={{ fill: repColor(p.reputation) }} />
                      {p.reputation}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
