import { useState, useCallback, useMemo } from "react";
import { Upload, CheckCircle2, AlertTriangle, FileText, Download, ChevronRight, X, Sparkles, Copy, Check } from "lucide-react";
import TopNav from "@/components/sns/TopNav";

const ROBOT_IDS = ["ARIA-7", "LUMEN-3", "NEXUS-AI", "TITAN-X", "HERON-2"] as const;
const TASK_TYPES = ["grasping", "navigation", "welding", "plastering", "inspection", "assembly"] as const;
const SCHEMA_VERSION = "1.0.0";

type Step = "upload" | "validate" | "enrich" | "export";

interface RawRow {
  [key: string]: string | number | boolean | null | undefined;
}

interface ValidationResult {
  validRows: RawRow[];
  duplicateCount: number;
  missingFieldRows: number;
  missingFields: Record<string, number>;
  totalRows: number;
}

interface EnrichedRow extends RawRow {
  __robot_id: string;
  __task_type: string;
  __timestamp_iso: string;
  __confidence: number;
  __schema_version: string;
}

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "validate", label: "Validate" },
  { key: "enrich", label: "Enrich" },
  { key: "export", label: "Export" },
];

function parseCSV(text: string): RawRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: RawRow = {};
    headers.forEach((h, i) => {
      const val = values[i] ?? "";
      if (val === "") row[h] = null;
      else if (!isNaN(Number(val))) row[h] = Number(val);
      else if (val === "true" || val === "false") row[h] = val === "true";
      else row[h] = val;
    });
    return row;
  });
}

function parseJSON(text: string): RawRow[] {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.rows && Array.isArray(data.rows)) return data.rows;
  return [data];
}

function validate(rows: RawRow[]): ValidationResult {
  const seen = new Set<string>();
  let duplicateCount = 0;
  let missingFieldRows = 0;
  const missingFields: Record<string, number> = {};
  const validRows: RawRow[] = [];

  const allKeys = rows.length > 0 ? Object.keys(rows[0]) : [];

  for (const row of rows) {
    const key = JSON.stringify(row);
    if (seen.has(key)) {
      duplicateCount++;
      continue;
    }
    seen.add(key);

    let hasMissing = false;
    for (const k of allKeys) {
      if (row[k] === null || row[k] === undefined || row[k] === "") {
        missingFields[k] = (missingFields[k] || 0) + 1;
        hasMissing = true;
      }
    }
    if (hasMissing) missingFieldRows++;
    validRows.push(row);
  }

  return { validRows, duplicateCount, missingFieldRows, missingFields, totalRows: rows.length };
}

function enrich(rows: RawRow[], robotId: string, taskType: string): EnrichedRow[] {
  return rows.map((row) => ({
    ...row,
    __robot_id: robotId,
    __task_type: taskType,
    __timestamp_iso: new Date().toISOString(),
    __confidence: parseFloat((0.7 + Math.random() * 0.25).toFixed(3)),
    __schema_version: SCHEMA_VERSION,
  }));
}

function toCSV(rows: EnrichedRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => {
      const val = row[h as keyof typeof row];
      if (val === null || val === undefined) return "";
      const str = String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(","));
  }
  return lines.join("\n");
}

function generateDatasetCard(robotId: string, taskType: string, rowCount: number, columns: string[]): string {
  return `---
license: apache-2.0
task_categories:
  - robotics
tags:
  - robot-sns
  - ${taskType}
  - construction
  - rl-data
size_categories:
  - ${rowCount < 1000 ? "n<1K" : rowCount < 10000 ? "1K<n<10K" : "10K<n<100K"}
configs:
  - config_name: default
    data_files:
      - split: train
        path: data/train.csv
---

# Robot RL Dataset — ${robotId} / ${taskType}

## Dataset Description

Reinforcement learning dataset collected by **${robotId}** during **${taskType}** tasks on construction sites. Formatted for the Robot SNS knowledge-sharing marketplace.

## Schema

| Column | Description |
|--------|-------------|
${columns.map((c) => `| \`${c}\` | ${c.startsWith("__") ? "HF metadata field" : "Sensor / task data"} |`).join("\n")}

## Usage

\`\`\`python
from datasets import load_dataset
ds = load_dataset("robot-sns/${robotId.toLowerCase()}-${taskType}", split="train")
\`\`\`

## Collection Details

- **Robot**: ${robotId}
- **Task**: ${taskType}
- **Rows**: ${rowCount.toLocaleString()}
- **Schema Version**: ${SCHEMA_VERSION}
- **Generated**: ${new Date().toISOString().split("T")[0]}
`;
}

const DataFormatterPage = () => {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [enrichedRows, setEnrichedRows] = useState<EnrichedRow[]>([]);
  const [robotId, setRobotId] = useState<string>(ROBOT_IDS[0]);
  const [taskType, setTaskType] = useState<string>(TASK_TYPES[0]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [copiedCard, setCopiedCard] = useState(false);

  const datasetCard = useMemo(() => {
    if (enrichedRows.length === 0) return "";
    return generateDatasetCard(robotId, taskType, enrichedRows.length, Object.keys(enrichedRows[0]));
  }, [enrichedRows, robotId, taskType]);

  const handleFile = useCallback((file: File) => {
    setError("");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let rows: RawRow[];
        if (file.name.endsWith(".json")) {
          rows = parseJSON(text);
        } else {
          rows = parseCSV(text);
        }
        if (rows.length === 0) {
          setError("No data rows found in file.");
          return;
        }
        setRawRows(rows);
        setStep("validate");
        const result = validate(rows);
        setValidation(result);
      } catch (err) {
        setError(`Failed to parse file: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleEnrich = () => {
    if (!validation) return;
    const result = enrich(validation.validRows, robotId, taskType);
    setEnrichedRows(result);
    setStep("enrich");
  };

  const handleExport = () => {
    setStep("export");
  };

  const downloadCSV = () => {
    const csv = toCSV(enrichedRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${robotId.toLowerCase()}_${taskType}_enriched.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCard = () => {
    const blob = new Blob([datasetCard], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCard = () => {
    navigator.clipboard.writeText(datasetCard);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  const reset = () => {
    setStep("upload");
    setFileName("");
    setRawRows([]);
    setValidation(null);
    setEnrichedRows([]);
    setError("");
    setCopiedCard(false);
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      <TopNav />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "#111827", fontFamily: "var(--font-heading)" }}>
            Data Formatter
          </h1>
          <p className="mt-2 text-base" style={{ color: "#6b7280" }}>
            Upload raw sensor or task data, validate, enrich with HuggingFace metadata, and export.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (i <= stepIndex) setStep(s.key);
                }}
                disabled={i > stepIndex}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  background: i <= stepIndex ? (i === stepIndex ? "#111827" : "#f3f4f6") : "#f9fafb",
                  color: i === stepIndex ? "#ffffff" : i < stepIndex ? "#111827" : "#d1d5db",
                  cursor: i <= stepIndex ? "pointer" : "default",
                }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: i < stepIndex ? "#10b981" : i === stepIndex ? "#ffffff" : "#e5e7eb",
                    color: i < stepIndex ? "#ffffff" : i === stepIndex ? "#111827" : "#9ca3af",
                  }}
                >
                  {i < stepIndex ? "✓" : i + 1}
                </span>
                {s.label}
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4" style={{ color: "#d1d5db" }} />}
            </div>
          ))}
        </div>

        {/* Config Panel */}
        <div
          className="rounded-lg p-5 mb-8 flex flex-wrap gap-6"
          style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "#374151" }}>Robot ID</label>
            <select
              value={robotId}
              onChange={(e) => setRobotId(e.target.value)}
              className="rounded-md px-3 py-2 text-sm font-medium outline-none"
              style={{ border: "1px solid #d1d5db", color: "#111827", background: "#ffffff" }}
            >
              {ROBOT_IDS.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "#374151" }}>Task Type</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="rounded-md px-3 py-2 text-sm font-medium outline-none"
              style={{ border: "1px solid #d1d5db", color: "#111827", background: "#ffffff" }}
            >
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-lg p-4 mb-6 flex items-center gap-3"
            style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: "#ef4444" }} />
            <p className="text-sm" style={{ color: "#991b1b" }}>{error}</p>
            <button onClick={() => setError("")} className="ml-auto">
              <X className="w-4 h-4" style={{ color: "#ef4444" }} />
            </button>
          </div>
        )}

        {/* STEP: Upload */}
        {step === "upload" && (
          <div
            className={`rounded-lg p-12 text-center transition-all cursor-pointer ${dragActive ? "scale-[1.01]" : ""}`}
            style={{
              border: `2px dashed ${dragActive ? "#111827" : "#d1d5db"}`,
              background: dragActive ? "#f9fafb" : "#ffffff",
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("fmt-file-input")?.click()}
          >
            <input
              id="fmt-file-input"
              type="file"
              accept=".csv,.json"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
            <Upload className="w-10 h-10 mx-auto mb-4" style={{ color: "#9ca3af" }} />
            <p className="text-base font-medium" style={{ color: "#111827" }}>
              Drop your CSV or JSON file here
            </p>
            <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>
              or click to browse
            </p>
          </div>
        )}

        {/* STEP: Validate */}
        {step === "validate" && validation && (
          <div className="space-y-6">
            <div className="rounded-lg p-6" style={{ border: "1px solid #e5e7eb" }}>
              <div className="flex items-center gap-3 mb-5">
                <FileText className="w-5 h-5" style={{ color: "#6b7280" }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "#111827" }}>{fileName}</p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>{validation.totalRows} rows parsed</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg p-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p className="text-2xl font-bold" style={{ color: "#166534", fontFamily: "var(--font-heading)" }}>
                    {validation.validRows.length}
                  </p>
                  <p className="text-xs font-medium mt-1" style={{ color: "#15803d" }}>Valid rows</p>
                </div>
                <div className="rounded-lg p-4" style={{ background: validation.duplicateCount > 0 ? "#fefce8" : "#f9fafb", border: `1px solid ${validation.duplicateCount > 0 ? "#fde68a" : "#e5e7eb"}` }}>
                  <p className="text-2xl font-bold" style={{ color: validation.duplicateCount > 0 ? "#92400e" : "#6b7280", fontFamily: "var(--font-heading)" }}>
                    {validation.duplicateCount}
                  </p>
                  <p className="text-xs font-medium mt-1" style={{ color: validation.duplicateCount > 0 ? "#a16207" : "#9ca3af" }}>Duplicates removed</p>
                </div>
                <div className="rounded-lg p-4" style={{ background: validation.missingFieldRows > 0 ? "#fff7ed" : "#f9fafb", border: `1px solid ${validation.missingFieldRows > 0 ? "#fed7aa" : "#e5e7eb"}` }}>
                  <p className="text-2xl font-bold" style={{ color: validation.missingFieldRows > 0 ? "#9a3412" : "#6b7280", fontFamily: "var(--font-heading)" }}>
                    {validation.missingFieldRows}
                  </p>
                  <p className="text-xs font-medium mt-1" style={{ color: validation.missingFieldRows > 0 ? "#c2410c" : "#9ca3af" }}>Rows with missing fields</p>
                </div>
              </div>

              {Object.keys(validation.missingFields).length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-medium mb-2" style={{ color: "#6b7280" }}>Missing fields breakdown</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(validation.missingFields).map(([field, count]) => (
                      <span
                        key={field}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: "#fef3c7", color: "#92400e" }}
                      >
                        {field}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Data Preview */}
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
              <div className="px-4 py-3" style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <p className="text-xs font-medium" style={{ color: "#6b7280" }}>
                  Preview (first 5 rows)
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      {validation.validRows.length > 0 &&
                        Object.keys(validation.validRows[0]).map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap"
                            style={{ color: "#374151", background: "#f9fafb" }}
                          >
                            {h}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validation.validRows.slice(0, 5).map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        {Object.values(row).map((val, j) => (
                          <td
                            key={j}
                            className="px-3 py-2 text-xs whitespace-nowrap"
                            style={{ color: val === null ? "#d1d5db" : "#111827" }}
                          >
                            {val === null ? "null" : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ border: "1px solid #d1d5db", color: "#374151", background: "#ffffff" }}
              >
                Start over
              </button>
              <button
                onClick={handleEnrich}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-colors"
                style={{ background: "#111827" }}
              >
                <Sparkles className="w-4 h-4" />
                Enrich Data
              </button>
            </div>
          </div>
        )}

        {/* STEP: Enrich */}
        {step === "enrich" && enrichedRows.length > 0 && (
          <div className="space-y-6">
            {/* Enrichment Summary */}
            <div className="rounded-lg p-6" style={{ border: "1px solid #e5e7eb" }}>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5" style={{ color: "#10b981" }} />
                <p className="text-sm font-semibold" style={{ color: "#111827" }}>
                  {enrichedRows.length} rows enriched
                </p>
              </div>
              <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
                The following metadata fields were added to every row:
              </p>
              <div className="flex flex-wrap gap-2">
                {["__robot_id", "__task_type", "__timestamp_iso", "__confidence", "__schema_version"].map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-mono font-medium"
                    style={{ background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Enriched Preview */}
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
              <div className="px-4 py-3" style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <p className="text-xs font-medium" style={{ color: "#6b7280" }}>
                  Enriched preview (first 3 rows)
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      {Object.keys(enrichedRows[0]).map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap"
                          style={{
                            color: h.startsWith("__") ? "#1e40af" : "#374151",
                            background: h.startsWith("__") ? "#eff6ff" : "#f9fafb",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedRows.slice(0, 3).map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        {Object.entries(row).map(([key, val], j) => (
                          <td
                            key={j}
                            className="px-3 py-2 text-xs whitespace-nowrap font-mono"
                            style={{ color: key.startsWith("__") ? "#1e40af" : "#111827" }}
                          >
                            {val === null ? "null" : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("validate")}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ border: "1px solid #d1d5db", color: "#374151", background: "#ffffff" }}
              >
                Back
              </button>
              <button
                onClick={handleExport}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-colors"
                style={{ background: "#111827" }}
              >
                <Download className="w-4 h-4" />
                Continue to Export
              </button>
            </div>
          </div>
        )}

        {/* STEP: Export */}
        {step === "export" && enrichedRows.length > 0 && (
          <div className="space-y-6">
            {/* Export Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={downloadCSV}
                className="rounded-lg p-6 text-left transition-all hover:scale-[1.01]"
                style={{ border: "1px solid #e5e7eb", background: "#ffffff" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#f0fdf4" }}>
                    <Download className="w-5 h-5" style={{ color: "#16a34a" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#111827" }}>Download CSV</p>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>
                      {enrichedRows.length} rows &middot; {Object.keys(enrichedRows[0]).length} columns
                    </p>
                  </div>
                </div>
                <p className="text-xs font-mono truncate" style={{ color: "#6b7280" }}>
                  {robotId.toLowerCase()}_{taskType}_enriched.csv
                </p>
              </button>

              <button
                onClick={downloadCard}
                className="rounded-lg p-6 text-left transition-all hover:scale-[1.01]"
                style={{ border: "1px solid #e5e7eb", background: "#ffffff" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#eff6ff" }}>
                    <FileText className="w-5 h-5" style={{ color: "#2563eb" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#111827" }}>Download Dataset Card</p>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>HuggingFace README.md</p>
                  </div>
                </div>
                <p className="text-xs font-mono" style={{ color: "#6b7280" }}>README.md</p>
              </button>
            </div>

            {/* Dataset Card Preview */}
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <p className="text-xs font-medium" style={{ color: "#6b7280" }}>Dataset Card Preview</p>
                <button
                  onClick={copyCard}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                  style={{ border: "1px solid #d1d5db", color: "#374151", background: "#ffffff" }}
                >
                  {copiedCard ? <Check className="w-3.5 h-3.5" style={{ color: "#10b981" }} /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCard ? "Copied" : "Copy"}
                </button>
              </div>
              <pre
                className="p-4 text-xs overflow-x-auto leading-relaxed"
                style={{ color: "#374151", background: "#ffffff", fontFamily: "ui-monospace, monospace" }}
              >
                {datasetCard}
              </pre>
            </div>

            {/* Start over */}
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ border: "1px solid #d1d5db", color: "#374151", background: "#ffffff" }}
              >
                Format another file
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataFormatterPage;
