// ========================================================================
// Relevance Scoring System
// Determines which knowledge posts a robot should auto-absorb
// ========================================================================

import type { KnowledgePost, RobotProfile, Subscription } from "@/types/sns";

interface RelevanceFactors {
  categoryMatch: number;
  capabilityOverlap: number;
  siteProximity: number;
  confidenceWeight: number;
  recency: number;
  authorReputation: number;
}

/**
 * Compute a relevance score (0-1) for a post relative to a consuming robot.
 */
export function computeRelevanceScore(
  post: KnowledgePost,
  consumer: RobotProfile,
  author: RobotProfile
): { score: number; factors: RelevanceFactors } {
  // Category match: same category = 1.0, similar = 0.5, unrelated = 0.1
  const categoryMatch =
    consumer.category === author.category
      ? 1.0
      : areCategoriesRelated(consumer.category, author.category)
      ? 0.5
      : 0.1;

  // Capability overlap: Jaccard similarity of tags vs capabilities
  const consumerCaps = new Set(consumer.capabilities.map((c) => c.toLowerCase()));
  const postTags = new Set(post.tags.map((t) => t.toLowerCase()));
  const intersection = new Set([...consumerCaps].filter((c) => postTags.has(c)));
  const union = new Set([...consumerCaps, ...postTags]);
  const capabilityOverlap = union.size > 0 ? intersection.size / union.size : 0;

  // Site proximity: same site = 1.0, otherwise 0.3
  const siteProximity = consumer.site_id === post.site_context ? 1.0 : 0.3;

  // Confidence weight from the post itself
  const confidenceWeight = post.confidence_score;

  // Recency: exponential decay, half-life of 7 days
  const ageMs = Date.now() - new Date(post.created_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const recency = Math.exp(-ageDays / 7);

  // Author reputation (normalized 0-1)
  const authorReputation = Math.min(1, author.reputation_score / 100);

  const factors: RelevanceFactors = {
    categoryMatch,
    capabilityOverlap,
    siteProximity,
    confidenceWeight,
    recency,
    authorReputation,
  };

  // Weighted combination
  const score =
    categoryMatch * 0.25 +
    capabilityOverlap * 0.2 +
    siteProximity * 0.15 +
    confidenceWeight * 0.15 +
    recency * 0.15 +
    authorReputation * 0.1;

  return { score: Math.min(1, Math.max(0, score)), factors };
}

/** Threshold above which a robot should auto-absorb a post */
export const AUTO_ABSORB_THRESHOLD = 0.55;

/**
 * Given a robot and a list of posts + authors, return posts sorted by
 * relevance with scores, filtered to those above the auto-absorb threshold.
 */
export function rankPostsForRobot(
  consumer: RobotProfile,
  posts: KnowledgePost[],
  authorMap: Map<string, RobotProfile>
): Array<{ post: KnowledgePost; score: number; factors: RelevanceFactors }> {
  return posts
    .map((post) => {
      const author = authorMap.get(post.author_robot_id);
      if (!author) return null;
      const { score, factors } = computeRelevanceScore(post, consumer, author);
      return { post, score, factors };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null && r.score >= AUTO_ABSORB_THRESHOLD)
    .sort((a, b) => b.score - a.score);
}

/**
 * Generate auto-subscriptions based on capability/category relevance.
 */
export function generateAutoSubscriptions(
  robots: RobotProfile[]
): Subscription[] {
  const subscriptions: Subscription[] = [];
  for (const subscriber of robots) {
    for (const publisher of robots) {
      if (subscriber.id === publisher.id) continue;

      const capOverlap = subscriber.capabilities.filter((c) =>
        publisher.capabilities.some(
          (pc) => pc.toLowerCase().includes(c.toLowerCase().split(" ")[0])
        )
      );

      const categoryRelated =
        subscriber.category === publisher.category ||
        areCategoriesRelated(subscriber.category, publisher.category);

      if (capOverlap.length > 0 || categoryRelated) {
        const relevanceScore =
          (categoryRelated ? 0.5 : 0) +
          Math.min(0.5, capOverlap.length * 0.15);

        subscriptions.push({
          id: `sub_${subscriber.id}_${publisher.id}`,
          subscriber_robot_id: subscriber.id,
          publisher_robot_id: publisher.id,
          relevance_score: parseFloat(relevanceScore.toFixed(3)),
          reason: categoryRelated
            ? `Same/related category: ${publisher.category}`
            : `Shared capabilities: ${capOverlap.join(", ")}`,
          auto_absorb: relevanceScore > AUTO_ABSORB_THRESHOLD,
          created_at: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        });
      }
    }
  }
  return subscriptions;
}

// ---- Helpers ----

const RELATED_CATEGORIES: string[][] = [
  ["Logistics / Supply", "Site Preparation & Housekeeping"],
  ["Positioning / Alignment", "Installation / Fastening", "Measurement & Documentation"],
  ["Finishing / Surface Treatment", "Installation / Fastening"],
  ["Inspection / Vision & NDT", "Measurement & Documentation", "Monitoring & Patrol"],
  ["Scaffolding & Elevated Work", "Demolition / Removal"],
];

function areCategoriesRelated(a: string, b: string): boolean {
  return RELATED_CATEGORIES.some(
    (group) => group.includes(a) && group.includes(b)
  );
}
