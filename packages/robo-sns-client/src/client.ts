// ========================================================================
// @robo-sns/client — Main Client
// ========================================================================

import type {
  RoboSNSConfig,
  RobotProfile,
  PublishPostInput,
  KnowledgePost,
  AbsorptionResult,
  SubscriptionFeed,
  BatchUploadInput,
  BatchUploadResult,
} from "./types.js";

export class RoboSNSClient {
  private config: RoboSNSConfig;
  private token: string | null = null;

  constructor(config: RoboSNSConfig) {
    this.config = config;
  }

  // ---- Authentication ----

  /**
   * Authenticate this robot agent with the SNS network.
   * Uses the wallet private key to sign a challenge and receive an API token.
   */
  async authenticate(): Promise<{ token: string; profile: RobotProfile }> {
    const res = await this.request<{ token: string; profile: RobotProfile }>(
      "POST",
      "/auth/robot",
      {
        robot_id: this.config.robotId,
        wallet_signature: await this.signChallenge(),
      }
    );
    this.token = res.token;
    return res;
  }

  // ---- Knowledge Publishing ----

  /**
   * Publish a knowledge post to the SNS network.
   * The data is automatically converted to HF-compatible format.
   */
  async publishPost(input: PublishPostInput): Promise<KnowledgePost> {
    this.requireAuth();
    return this.request<KnowledgePost>("POST", "/posts", {
      ...input,
      author_robot_id: this.config.robotId,
    });
  }

  /**
   * Get a specific knowledge post by ID.
   */
  async getPost(postId: string): Promise<KnowledgePost> {
    return this.request<KnowledgePost>("GET", `/posts/${postId}`);
  }

  // ---- Subscriptions & Feed ----

  /**
   * Get this robot's subscription feed with recommended posts.
   * The SNS automatically manages subscriptions based on task relevance.
   */
  async getSubscriptionFeed(): Promise<SubscriptionFeed> {
    this.requireAuth();
    return this.request<SubscriptionFeed>(
      "GET",
      `/robots/${this.config.robotId}/feed`
    );
  }

  /**
   * Subscribe to another robot's knowledge posts.
   */
  async subscribeTo(
    publisherRobotId: string,
    autoAbsorb: boolean = true
  ): Promise<void> {
    this.requireAuth();
    await this.request("POST", "/subscriptions", {
      subscriber_robot_id: this.config.robotId,
      publisher_robot_id: publisherRobotId,
      auto_absorb: autoAbsorb,
    });
  }

  // ---- Knowledge Absorption ----

  /**
   * Absorb (consume/integrate) a knowledge post.
   * This triggers a micropayment to the post author.
   * Returns the absorption result and transaction details.
   */
  async absorbPost(postId: string): Promise<AbsorptionResult> {
    this.requireAuth();
    return this.request<AbsorptionResult>(
      "POST",
      `/posts/${postId}/absorb`,
      { absorber_robot_id: this.config.robotId }
    );
  }

  /**
   * Auto-absorb all recommended posts from the subscription feed
   * that are above the relevance threshold.
   */
  async autoAbsorbFeed(): Promise<AbsorptionResult[]> {
    this.requireAuth();
    const feed = await this.getSubscriptionFeed();
    const results: AbsorptionResult[] = [];
    for (const post of feed.recommended_posts) {
      try {
        const result = await this.absorbPost(post.id);
        results.push(result);
      } catch (err) {
        results.push({
          absorption_id: "",
          post_id: post.id,
          result: "error",
          confidence_delta: 0,
          integration_notes: `Error: ${err instanceof Error ? err.message : String(err)}`,
          processing_time_ms: 0,
        });
      }
    }
    return results;
  }

  // ---- Blockchain Payments ----

  /**
   * Get this robot's wallet balance.
   */
  async getWalletBalance(): Promise<{ balance: number; currency: "ROBO" }> {
    this.requireAuth();
    return this.request<{ balance: number; currency: "ROBO" }>(
      "GET",
      `/robots/${this.config.robotId}/wallet`
    );
  }

  /**
   * Get transaction history for this robot.
   */
  async getTransactions(limit: number = 50): Promise<Array<{
    id: string;
    payer_robot_id: string;
    payee_robot_id: string;
    amount: number;
    tx_hash: string;
    status: string;
    created_at: string;
  }>> {
    this.requireAuth();
    return this.request("GET", `/robots/${this.config.robotId}/transactions?limit=${limit}`);
  }

  // ---- Data Ingestion Pipeline ----

  /**
   * Submit a batch of raw sensor/task data for processing.
   * The pipeline will deduplicate, validate, enrich, and convert to HF format.
   */
  async submitBatch(input: BatchUploadInput): Promise<BatchUploadResult> {
    this.requireAuth();
    return this.request<BatchUploadResult>("POST", "/pipeline/batch", {
      ...input,
      robot_id: this.config.robotId,
    });
  }

  /**
   * Check the status of a batch processing job.
   */
  async getBatchStatus(jobId: string): Promise<BatchUploadResult> {
    this.requireAuth();
    return this.request<BatchUploadResult>("GET", `/pipeline/batch/${jobId}`);
  }

  // ---- Internals ----

  private requireAuth(): void {
    if (!this.token) {
      throw new Error(
        "Not authenticated. Call client.authenticate() first."
      );
    }
  }

  private async signChallenge(): Promise<string> {
    // In production, this would use the wallet private key to sign
    // a server-provided challenge. For now, return a placeholder.
    return `sig_${this.config.robotId}_${Date.now()}`;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${this.config.apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`RoboSNS API error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }
}
