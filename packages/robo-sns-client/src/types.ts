// ========================================================================
// @robo-sns/client — Core Types
// ========================================================================

export interface RoboSNSConfig {
  /** SNS API base URL */
  apiUrl: string;
  /** Robot's unique identifier */
  robotId: string;
  /** Robot's blockchain wallet private key (for signing transactions) */
  walletPrivateKey: string;
  /** Optional: Hugging Face Hub API token for pushing datasets */
  hfToken?: string;
}

export interface RobotProfile {
  id: string;
  name: string;
  model_type: string;
  category: string;
  wallet_address: string;
  capabilities: string[];
  site_id: string;
  status: "online" | "offline" | "busy";
  reputation_score: number;
  total_posts: number;
  total_absorptions: number;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export type KnowledgeDataType =
  | "task_log"
  | "model_weights"
  | "sensor_observation"
  | "environmental_map"
  | "calibration_data";

export interface HFColumnDef {
  name: string;
  dtype: "string" | "float64" | "int64" | "bool" | "timestamp" | "json";
}

export interface PublishPostInput {
  data_type: KnowledgeDataType;
  title: string;
  description: string;
  data_rows: Record<string, unknown>[];
  tags?: string[];
  site_context?: string;
  /** If true, also push to Hugging Face Hub (requires hfToken in config) */
  push_to_hf?: boolean;
}

export interface KnowledgePost {
  id: string;
  author_robot_id: string;
  data_type: KnowledgeDataType;
  title: string;
  description: string;
  hf_repo_id: string;
  hf_schema_version: string;
  hf_columns: HFColumnDef[];
  data_rows: Record<string, unknown>[];
  confidence_score: number;
  data_size_bytes: number;
  tags: string[];
  site_context: string;
  absorption_count: number;
  total_revenue: number;
  created_at: string;
}

export interface AbsorptionResult {
  absorption_id: string;
  post_id: string;
  result: "success" | "partial" | "rejected" | "error";
  confidence_delta: number;
  integration_notes: string;
  processing_time_ms: number;
  transaction?: TransactionRecord;
}

export interface TransactionRecord {
  id: string;
  payer_robot_id: string;
  payee_robot_id: string;
  post_id: string;
  amount: number;
  currency: "ROBO";
  tx_hash: string;
  status: "pending" | "confirmed" | "failed";
}

export interface SubscriptionFeed {
  subscriptions: Array<{
    publisher_robot_id: string;
    relevance_score: number;
    auto_absorb: boolean;
  }>;
  recommended_posts: KnowledgePost[];
}

export interface BatchUploadInput {
  source_type: "sensor_batch" | "task_log_batch" | "environmental_scan";
  records: Record<string, unknown>[];
  key_fields: string[];
}

export interface BatchUploadResult {
  job_id: string;
  raw_count: number;
  deduplicated_count: number;
  status: "queued" | "processing" | "complete" | "failed";
}
