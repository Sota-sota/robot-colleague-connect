// ========================================================================
// Hugging Face Format Utilities
// Convert robot knowledge data into HF-compatible dataset/model formats
// ========================================================================

import type {
  KnowledgePost,
  KnowledgeDataType,
  HFColumnDef,
  SafeTensorsMetadata,
} from "@/types/sns";

/** Standard HF dataset schema version */
export const HF_SCHEMA_VERSION = "1.0.0";

/** Organization namespace on HF Hub */
export const HF_ORG = "robo-sns";

// ---- Column schemas per data type ----

const TASK_LOG_COLUMNS: HFColumnDef[] = [
  { name: "timestamp", dtype: "timestamp" },
  { name: "task_id", dtype: "string" },
  { name: "task_type", dtype: "string" },
  { name: "duration_ms", dtype: "int64" },
  { name: "success", dtype: "bool" },
  { name: "error_code", dtype: "string" },
  { name: "sensor_readings", dtype: "json" },
  { name: "notes", dtype: "string" },
];

const SENSOR_OBSERVATION_COLUMNS: HFColumnDef[] = [
  { name: "timestamp", dtype: "timestamp" },
  { name: "sensor_type", dtype: "string" },
  { name: "value", dtype: "float64" },
  { name: "unit", dtype: "string" },
  { name: "location_x", dtype: "float64" },
  { name: "location_y", dtype: "float64" },
  { name: "location_z", dtype: "float64" },
  { name: "confidence", dtype: "float64" },
];

const ENVIRONMENTAL_MAP_COLUMNS: HFColumnDef[] = [
  { name: "timestamp", dtype: "timestamp" },
  { name: "grid_x", dtype: "int64" },
  { name: "grid_y", dtype: "int64" },
  { name: "occupancy", dtype: "float64" },
  { name: "surface_type", dtype: "string" },
  { name: "hazard_level", dtype: "float64" },
  { name: "metadata", dtype: "json" },
];

const CALIBRATION_DATA_COLUMNS: HFColumnDef[] = [
  { name: "timestamp", dtype: "timestamp" },
  { name: "joint_id", dtype: "string" },
  { name: "target_angle", dtype: "float64" },
  { name: "actual_angle", dtype: "float64" },
  { name: "error_deg", dtype: "float64" },
  { name: "torque_nm", dtype: "float64" },
  { name: "temperature_c", dtype: "float64" },
];

const MODEL_WEIGHTS_COLUMNS: HFColumnDef[] = [
  { name: "layer_name", dtype: "string" },
  { name: "shape", dtype: "json" },
  { name: "dtype", dtype: "string" },
  { name: "num_params", dtype: "int64" },
];

/** Get the HF column schema for a given data type */
export function getColumnsForDataType(dataType: KnowledgeDataType): HFColumnDef[] {
  switch (dataType) {
    case "task_log":
      return TASK_LOG_COLUMNS;
    case "sensor_observation":
      return SENSOR_OBSERVATION_COLUMNS;
    case "environmental_map":
      return ENVIRONMENTAL_MAP_COLUMNS;
    case "calibration_data":
      return CALIBRATION_DATA_COLUMNS;
    case "model_weights":
      return MODEL_WEIGHTS_COLUMNS;
  }
}

/** Build an HF-compatible repo ID for a knowledge post */
export function buildHFRepoId(
  robotId: string,
  dataType: KnowledgeDataType,
  dateStr: string
): string {
  return `${HF_ORG}/${robotId}/${dataType}-${dateStr}`;
}

/** Convert raw sensor records into HF parquet-like JSON rows */
export function toParquetRows(
  columns: HFColumnDef[],
  rawRecords: Record<string, unknown>[]
): Record<string, unknown>[] {
  return rawRecords.map((record) => {
    const row: Record<string, unknown> = {};
    for (const col of columns) {
      const val = record[col.name];
      if (val === undefined) {
        row[col.name] = null;
      } else if (col.dtype === "json") {
        row[col.name] = typeof val === "string" ? val : JSON.stringify(val);
      } else {
        row[col.name] = val;
      }
    }
    return row;
  });
}

/** Generate a dataset card (README.md content) for HF Hub */
export function generateDatasetCard(post: KnowledgePost): string {
  return `---
license: apache-2.0
task_categories:
  - robotics
tags:
  - robot-sns
  - ${post.data_type}
  - ${post.tags.join("\n  - ")}
dataset_info:
  features:
${post.hf_columns.map((c) => `    - name: ${c.name}\n      dtype: ${c.dtype}`).join("\n")}
  num_rows: ${post.data_rows.length}
  size_bytes: ${post.data_size_bytes}
---

# ${post.title}

${post.description}

**Author Robot:** ${post.author_robot_id}
**Confidence:** ${(post.confidence_score * 100).toFixed(1)}%
**Site Context:** ${post.site_context}
**Schema Version:** ${post.hf_schema_version}
`;
}

/** Build safetensors metadata for model weight posts */
export function buildSafeTensorsMetadata(
  tensorCount: number,
  totalSizeBytes: number,
  architecture: string
): SafeTensorsMetadata {
  return {
    format: "pt",
    framework_version: "2.1.0",
    tensor_count: tensorCount,
    total_size_bytes: totalSizeBytes,
    dtype: "float32",
    architecture,
  };
}

/** Validate that data rows conform to the column schema */
export function validateRows(
  columns: HFColumnDef[],
  rows: Record<string, unknown>[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const colNames = new Set(columns.map((c) => c.name));

  for (let i = 0; i < rows.length; i++) {
    for (const col of columns) {
      if (!(col.name in rows[i]) || rows[i][col.name] === null) {
        // nullable is ok
        continue;
      }
      const val = rows[i][col.name];
      if (col.dtype === "float64" && typeof val !== "number") {
        errors.push(`Row ${i}, col "${col.name}": expected number, got ${typeof val}`);
      }
      if (col.dtype === "int64" && typeof val !== "number") {
        errors.push(`Row ${i}, col "${col.name}": expected number, got ${typeof val}`);
      }
      if (col.dtype === "string" && typeof val !== "string") {
        errors.push(`Row ${i}, col "${col.name}": expected string, got ${typeof val}`);
      }
      if (col.dtype === "bool" && typeof val !== "boolean") {
        errors.push(`Row ${i}, col "${col.name}": expected boolean, got ${typeof val}`);
      }
    }
    // check for extra columns
    for (const key of Object.keys(rows[i])) {
      if (!colNames.has(key)) {
        errors.push(`Row ${i}: unexpected column "${key}"`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
