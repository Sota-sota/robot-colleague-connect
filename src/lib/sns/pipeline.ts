// ========================================================================
// Data Ingestion Pipeline Utilities
// ========================================================================

import type { PipelineJob, PipelineStats, KnowledgePost, HFColumnDef } from "@/types/sns";
import {
  getColumnsForDataType,
  toParquetRows,
  buildHFRepoId,
  HF_SCHEMA_VERSION,
  validateRows,
} from "./huggingface";

/** Deduplicate raw records by checking for exact duplicates on key fields */
export function deduplicateRecords(
  records: Record<string, unknown>[],
  keyFields: string[]
): Record<string, unknown>[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = keyFields.map((f) => JSON.stringify(record[f] ?? "")).join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Validate records against expected column types */
export function validateRecords(
  columns: HFColumnDef[],
  records: Record<string, unknown>[]
): { valid: Record<string, unknown>[]; invalid: number } {
  const result = validateRows(columns, records);
  if (result.valid) return { valid: records, invalid: 0 };

  // For partial validity, filter out bad rows
  const valid: Record<string, unknown>[] = [];
  let invalid = 0;
  const colNames = new Set(columns.map((c) => c.name));

  for (const record of records) {
    let isValid = true;
    for (const col of columns) {
      const val = record[col.name];
      if (val === undefined || val === null) continue;
      if (col.dtype === "float64" && typeof val !== "number") { isValid = false; break; }
      if (col.dtype === "int64" && typeof val !== "number") { isValid = false; break; }
      if (col.dtype === "string" && typeof val !== "string") { isValid = false; break; }
      if (col.dtype === "bool" && typeof val !== "boolean") { isValid = false; break; }
    }
    for (const key of Object.keys(record)) {
      if (!colNames.has(key)) { isValid = false; break; }
    }
    if (isValid) valid.push(record);
    else invalid++;
  }

  return { valid, invalid };
}

/** Enrich records with site context metadata */
export function enrichWithSiteContext(
  records: Record<string, unknown>[],
  siteId: string,
  robotId: string
): Record<string, unknown>[] {
  return records.map((r) => ({
    ...r,
    _site_id: siteId,
    _robot_id: robotId,
    _ingested_at: new Date().toISOString(),
  }));
}

/** Full pipeline: deduplicate -> validate -> enrich -> convert to HF format */
export function processIngestionBatch(
  robotId: string,
  siteId: string,
  dataType: "task_log" | "sensor_observation" | "environmental_map" | "calibration_data",
  rawRecords: Record<string, unknown>[],
  keyFields: string[]
): {
  post: Omit<KnowledgePost, "id" | "created_at" | "absorption_count" | "total_revenue">;
  stats: { raw: number; deduped: number; valid: number; invalid: number };
} {
  // Step 1: Deduplicate
  const deduped = deduplicateRecords(rawRecords, keyFields);

  // Step 2: Get schema & validate
  const columns = getColumnsForDataType(dataType);
  const { valid, invalid } = validateRecords(columns, deduped);

  // Step 3: Convert to HF rows
  const rows = toParquetRows(columns, valid);

  // Step 4: Build the post
  const dateStr = new Date().toISOString().slice(0, 10);
  const post = {
    author_robot_id: robotId,
    data_type: dataType,
    title: `${dataType.replace(/_/g, " ")} batch from ${robotId}`,
    description: `Auto-ingested ${rows.length} records from ${siteId}`,
    hf_repo_id: buildHFRepoId(robotId, dataType, dateStr),
    hf_schema_version: HF_SCHEMA_VERSION,
    hf_columns: columns,
    data_rows: rows,
    confidence_score: valid.length > 0 ? 0.7 + Math.random() * 0.25 : 0,
    data_size_bytes: JSON.stringify(rows).length,
    tags: [dataType, siteId, robotId],
    site_context: siteId,
  };

  return {
    post,
    stats: {
      raw: rawRecords.length,
      deduped: deduped.length,
      valid: valid.length,
      invalid,
    },
  };
}

/** Calculate aggregate pipeline statistics from a list of jobs */
export function calculatePipelineStats(jobs: PipelineJob[]): PipelineStats {
  const complete = jobs.filter((j) => j.stage === "complete");
  const failed = jobs.filter((j) => j.stage === "failed");
  const processing = jobs.filter(
    (j) => !["complete", "failed", "ingested"].includes(j.stage)
  );
  const inQueue = jobs.filter((j) => j.stage === "ingested");

  const today = new Date().toISOString().slice(0, 10);
  const todaysJobs = complete.filter((j) => j.updated_at.startsWith(today));
  const recordsToday = todaysJobs.reduce(
    (sum, j) => sum + (j.validated_count ?? j.raw_record_count),
    0
  );

  return {
    total_jobs: jobs.length,
    jobs_in_queue: inQueue.length,
    jobs_processing: processing.length,
    jobs_complete: complete.length,
    jobs_failed: failed.length,
    avg_processing_time_ms:
      complete.length > 0
        ? complete.reduce(
            (sum, j) =>
              sum +
              (new Date(j.updated_at).getTime() -
                new Date(j.created_at).getTime()),
            0
          ) / complete.length
        : 0,
    records_processed_today: recordsToday,
    throughput_per_minute: processing.length > 0 ? processing.length * 12 : 0,
  };
}
