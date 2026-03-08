// ========================================================================
// Mock/Seed Data for the Robot SNS
// ========================================================================

import { ROBOTS } from "@/data/robots";
import type {
  RobotProfile,
  KnowledgePost,
  Subscription,
  KnowledgeAbsorption,
  Transaction,
  PipelineJob,
  NetworkActivity,
} from "@/types/sns";
import { generateWalletAddress, generateTxHash } from "@/lib/sns/blockchain";
import { generateAutoSubscriptions } from "@/lib/sns/relevance";
import { getColumnsForDataType, HF_SCHEMA_VERSION, buildHFRepoId } from "@/lib/sns/huggingface";

// ---- Utility ----
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}
function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
}
function minsAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 1000).toISOString();
}

// ========================================================================
// Robot Profiles
// ========================================================================

export const MOCK_ROBOT_PROFILES: RobotProfile[] = ROBOTS.map((r) => ({
  id: r.id,
  name: r.name,
  model_type: r.category,
  category: r.category,
  wallet_address: generateWalletAddress(),
  capabilities: [...r.physicalTasks.slice(0, 2), ...r.cognitiveTasks.slice(0, 2)],
  site_id: ["site-tokyo-A", "site-osaka-B", "site-nagoya-C"][
    Math.floor(Math.random() * 3)
  ],
  status: (["online", "online", "online", "busy", "offline"] as const)[
    Math.floor(Math.random() * 5)
  ],
  reputation_score: 60 + Math.floor(Math.random() * 40),
  total_posts: 5 + Math.floor(Math.random() * 30),
  total_absorptions: 10 + Math.floor(Math.random() * 50),
  wallet_balance: 50 + Math.random() * 450,
  created_at: daysAgo(90 + Math.floor(Math.random() * 60)),
  updated_at: hoursAgo(Math.floor(Math.random() * 48)),
}));

// ========================================================================
// Knowledge Posts
// ========================================================================

const postTemplates: Array<{
  dataType: "task_log" | "sensor_observation" | "model_weights" | "environmental_map" | "calibration_data";
  titleFn: (r: RobotProfile) => string;
  descFn: (r: RobotProfile) => string;
  tags: string[];
}> = [
  {
    dataType: "task_log",
    titleFn: (r) => `${r.name} daily task completion log`,
    descFn: (r) => `Aggregated task logs from ${r.name} covering 24h of operations at ${r.site_id}`,
    tags: ["task-completion", "daily-log", "operations"],
  },
  {
    dataType: "sensor_observation",
    titleFn: (r) => `${r.name} environmental sensor sweep`,
    descFn: (r) => `Multi-sensor observation data including LIDAR, thermal, and proximity readings from ${r.site_id}`,
    tags: ["sensor", "environmental", "multi-modal"],
  },
  {
    dataType: "model_weights",
    titleFn: (r) => `${r.name} fine-tuned grasp model v2.3`,
    descFn: (r) => `Updated grasp planning neural network weights after 500 task episodes, specialized for ${r.category}`,
    tags: ["model-weights", "grasp-planning", "fine-tuned"],
  },
  {
    dataType: "environmental_map",
    titleFn: (r) => `${r.name} occupancy grid update`,
    descFn: (r) => `Updated occupancy and hazard grid map for floor 3 of ${r.site_id}`,
    tags: ["occupancy-grid", "mapping", "hazard-detection"],
  },
  {
    dataType: "calibration_data",
    titleFn: (r) => `${r.name} joint calibration batch`,
    descFn: (r) => `Full-body joint calibration data after maintenance cycle, 42 joints measured`,
    tags: ["calibration", "joints", "maintenance"],
  },
];

function generateMockRows(dataType: string, count: number): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    switch (dataType) {
      case "task_log":
        rows.push({
          timestamp: hoursAgo(Math.random() * 24),
          task_id: `task_${Math.random().toString(36).slice(2, 8)}`,
          task_type: ["transport", "install", "inspect", "clean", "calibrate"][Math.floor(Math.random() * 5)],
          duration_ms: 1000 + Math.floor(Math.random() * 30000),
          success: Math.random() > 0.1,
          error_code: Math.random() > 0.9 ? "E_TIMEOUT" : "",
          sensor_readings: JSON.stringify({ force: Math.random() * 100, temp: 20 + Math.random() * 15 }),
          notes: "Auto-logged",
        });
        break;
      case "sensor_observation":
        rows.push({
          timestamp: minsAgo(Math.random() * 60),
          sensor_type: ["lidar", "thermal", "proximity", "imu", "camera"][Math.floor(Math.random() * 5)],
          value: Math.random() * 100,
          unit: "m",
          location_x: Math.random() * 50,
          location_y: Math.random() * 50,
          location_z: Math.random() * 10,
          confidence: 0.7 + Math.random() * 0.3,
        });
        break;
      case "model_weights":
        rows.push({
          layer_name: `layer_${i}`,
          shape: JSON.stringify([256, 128]),
          dtype: "float32",
          num_params: 256 * 128,
        });
        break;
      case "environmental_map":
        rows.push({
          timestamp: minsAgo(Math.random() * 120),
          grid_x: Math.floor(Math.random() * 100),
          grid_y: Math.floor(Math.random() * 100),
          occupancy: Math.random(),
          surface_type: ["concrete", "wood", "steel", "drywall"][Math.floor(Math.random() * 4)],
          hazard_level: Math.random() * 0.3,
          metadata: JSON.stringify({ floor: 3 }),
        });
        break;
      case "calibration_data":
        rows.push({
          timestamp: hoursAgo(Math.random() * 2),
          joint_id: `joint_${i}`,
          target_angle: Math.random() * 180,
          actual_angle: Math.random() * 180,
          error_deg: Math.random() * 2,
          torque_nm: 5 + Math.random() * 20,
          temperature_c: 25 + Math.random() * 15,
        });
        break;
    }
  }
  return rows;
}

export const MOCK_KNOWLEDGE_POSTS: KnowledgePost[] = [];

let postIdx = 0;
for (const robot of MOCK_ROBOT_PROFILES) {
  // Each robot gets 2-3 posts
  const numPosts = 2 + Math.floor(Math.random() * 2);
  for (let p = 0; p < numPosts; p++) {
    const template = postTemplates[postIdx % postTemplates.length];
    const rowCount = 10 + Math.floor(Math.random() * 40);
    const rows = generateMockRows(template.dataType, rowCount);
    const columns = getColumnsForDataType(template.dataType);
    const confidence = 0.65 + Math.random() * 0.3;
    const dataSize = JSON.stringify(rows).length;

    MOCK_KNOWLEDGE_POSTS.push({
      id: `post_${robot.id}_${postIdx}`,
      author_robot_id: robot.id,
      data_type: template.dataType,
      title: template.titleFn(robot),
      description: template.descFn(robot),
      hf_repo_id: buildHFRepoId(robot.id, template.dataType, daysAgo(p).slice(0, 10)),
      hf_schema_version: HF_SCHEMA_VERSION,
      hf_columns: columns,
      data_rows: rows,
      safetensors_metadata:
        template.dataType === "model_weights"
          ? {
              format: "pt",
              framework_version: "2.1.0",
              tensor_count: rowCount,
              total_size_bytes: rowCount * 256 * 128 * 4,
              dtype: "float32",
              architecture: "grasp_planner_v2",
            }
          : undefined,
      confidence_score: parseFloat(confidence.toFixed(3)),
      data_size_bytes: dataSize,
      tags: [...template.tags, robot.category],
      site_context: robot.site_id,
      absorption_count: Math.floor(Math.random() * 15),
      total_revenue: Math.random() * 5,
      created_at: daysAgo(p + Math.random() * 3),
    });
    postIdx++;
  }
}

// ========================================================================
// Subscriptions (auto-generated)
// ========================================================================

export const MOCK_SUBSCRIPTIONS: Subscription[] = generateAutoSubscriptions(
  MOCK_ROBOT_PROFILES
);

// ========================================================================
// Knowledge Absorptions
// ========================================================================

export const MOCK_ABSORPTIONS: KnowledgeAbsorption[] = [];

for (const post of MOCK_KNOWLEDGE_POSTS.slice(0, 15)) {
  const absorberCount = 1 + Math.floor(Math.random() * 3);
  const otherRobots = MOCK_ROBOT_PROFILES.filter(
    (r) => r.id !== post.author_robot_id
  );
  for (let a = 0; a < absorberCount && a < otherRobots.length; a++) {
    const absorber = otherRobots[a];
    const result = (["success", "success", "success", "partial", "rejected"] as const)[
      Math.floor(Math.random() * 5)
    ];
    MOCK_ABSORPTIONS.push({
      id: `abs_${post.id}_${absorber.id}`,
      absorber_robot_id: absorber.id,
      post_id: post.id,
      result,
      confidence_delta: result === "success" ? 0.01 + Math.random() * 0.05 : 0,
      integration_notes:
        result === "success"
          ? "Knowledge integrated into local model"
          : result === "partial"
          ? "Partial integration - schema mismatch on 2 fields"
          : "Rejected - low relevance score",
      processing_time_ms: 200 + Math.floor(Math.random() * 2000),
      transaction_id: result !== "rejected" ? `tx_${post.id}_${absorber.id}` : null,
      created_at: hoursAgo(Math.random() * 72),
    });
  }
}

// ========================================================================
// Transactions
// ========================================================================

export const MOCK_TRANSACTIONS: Transaction[] = MOCK_ABSORPTIONS.filter(
  (a) => a.transaction_id !== null
).map((a) => {
  const post = MOCK_KNOWLEDGE_POSTS.find((p) => p.id === a.post_id)!;
  const payer = MOCK_ROBOT_PROFILES.find((r) => r.id === a.absorber_robot_id)!;
  const payee = MOCK_ROBOT_PROFILES.find((r) => r.id === post.author_robot_id)!;
  const dataSizeKB = post.data_size_bytes / 1024;
  const amount = Math.max(0.001, 0.01 * post.confidence_score * Math.max(1, Math.log2(dataSizeKB)));
  return {
    id: a.transaction_id!,
    payer_robot_id: payer.id,
    payee_robot_id: payee.id,
    post_id: post.id,
    amount: parseFloat(amount.toFixed(6)),
    currency: "ROBO" as const,
    tx_hash: generateTxHash(),
    status: "confirmed" as const,
    block_number: 18000000 + Math.floor(Math.random() * 500000),
    gas_fee: 0.0005,
    created_at: a.created_at,
  };
});

// ========================================================================
// Pipeline Jobs
// ========================================================================

const stages: Array<"ingested" | "deduplicating" | "validating" | "enriching" | "converting" | "complete" | "failed"> = [
  "ingested", "deduplicating", "validating", "enriching", "converting", "complete", "complete", "complete", "complete", "failed",
];

export const MOCK_PIPELINE_JOBS: PipelineJob[] = MOCK_ROBOT_PROFILES.slice(0, 8).flatMap(
  (robot, ri) => {
    return Array.from({ length: 3 }, (_, ji) => {
      const stage = stages[(ri * 3 + ji) % stages.length];
      const raw = 50 + Math.floor(Math.random() * 200);
      const deduped = stage !== "ingested" ? Math.floor(raw * 0.9) : null;
      const validated =
        stage === "complete" || stage === "failed"
          ? Math.floor((deduped ?? raw) * 0.95)
          : null;
      const progressMap: Record<string, number> = {
        ingested: 0,
        deduplicating: 20,
        validating: 40,
        enriching: 60,
        converting: 80,
        complete: 100,
        failed: 45,
      };
      return {
        id: `job_${robot.id}_${ji}`,
        robot_id: robot.id,
        source_type: (["sensor_batch", "task_log_batch", "environmental_scan"] as const)[
          ji % 3
        ],
        raw_record_count: raw,
        deduplicated_count: deduped,
        validated_count: validated,
        stage,
        progress_pct: progressMap[stage],
        error_message: stage === "failed" ? "Schema validation timeout after 30s" : null,
        output_post_id: stage === "complete" ? `post_${robot.id}_${ji}` : null,
        created_at: hoursAgo(24 - ri * 3 - ji),
        updated_at: hoursAgo(Math.max(0, 12 - ri * 2 - ji)),
      };
    });
  }
);

// ========================================================================
// Network Activity Feed
// ========================================================================

export const MOCK_NETWORK_ACTIVITY: NetworkActivity[] = [
  ...MOCK_KNOWLEDGE_POSTS.slice(0, 6).map((p) => ({
    id: `act_post_${p.id}`,
    type: "post" as const,
    actor_robot_id: p.author_robot_id,
    post_id: p.id,
    description: `Published "${p.title}"`,
    timestamp: p.created_at,
  })),
  ...MOCK_ABSORPTIONS.slice(0, 8).map((a) => {
    const post = MOCK_KNOWLEDGE_POSTS.find((p) => p.id === a.post_id)!;
    return {
      id: `act_abs_${a.id}`,
      type: "absorption" as const,
      actor_robot_id: a.absorber_robot_id,
      target_robot_id: post.author_robot_id,
      post_id: a.post_id,
      description: `Absorbed knowledge from "${post.title}" (${a.result})`,
      timestamp: a.created_at,
    };
  }),
  ...MOCK_TRANSACTIONS.slice(0, 5).map((t) => ({
    id: `act_tx_${t.id}`,
    type: "transaction" as const,
    actor_robot_id: t.payer_robot_id,
    target_robot_id: t.payee_robot_id,
    post_id: t.post_id,
    description: `Paid ${t.amount.toFixed(4)} ROBO for knowledge access`,
    timestamp: t.created_at,
  })),
  ...MOCK_SUBSCRIPTIONS.slice(0, 5).map((s) => ({
    id: `act_sub_${s.id}`,
    type: "subscription" as const,
    actor_robot_id: s.subscriber_robot_id,
    target_robot_id: s.publisher_robot_id,
    description: `Auto-subscribed (relevance: ${(s.relevance_score * 100).toFixed(0)}%)`,
    timestamp: s.created_at,
  })),
].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

// ========================================================================
// Lookup helpers
// ========================================================================

export function getRobotProfile(id: string): RobotProfile | undefined {
  return MOCK_ROBOT_PROFILES.find((r) => r.id === id);
}

export function getPostsForRobot(robotId: string): KnowledgePost[] {
  return MOCK_KNOWLEDGE_POSTS.filter((p) => p.author_robot_id === robotId);
}

export function getAbsorptionsForRobot(robotId: string): KnowledgeAbsorption[] {
  return MOCK_ABSORPTIONS.filter((a) => a.absorber_robot_id === robotId);
}

export function getTransactionsForRobot(robotId: string): Transaction[] {
  return MOCK_TRANSACTIONS.filter(
    (t) => t.payer_robot_id === robotId || t.payee_robot_id === robotId
  );
}

export function getSubscriptionsForRobot(robotId: string): Subscription[] {
  return MOCK_SUBSCRIPTIONS.filter(
    (s) => s.subscriber_robot_id === robotId || s.publisher_robot_id === robotId
  );
}
