// ========================================================================
// Blockchain Micropayment Utilities
// ========================================================================

import type { Transaction, KnowledgePost, RobotProfile } from "@/types/sns";

/** Minimum payment threshold in ROBO tokens */
export const MIN_PAYMENT = 0.001;

/** Base gas fee for a transaction */
export const BASE_GAS_FEE = 0.0005;

/**
 * Calculate the micropayment price for absorbing a knowledge post.
 * Price = baseRate * confidenceScore * log2(dataSizeKB)
 */
export function calculateAbsorptionPrice(post: KnowledgePost): number {
  const baseRate = 0.01; // ROBO per unit
  const dataSizeKB = post.data_size_bytes / 1024;
  const sizeMultiplier = Math.max(1, Math.log2(dataSizeKB));
  const price = baseRate * post.confidence_score * sizeMultiplier;
  return Math.max(MIN_PAYMENT, parseFloat(price.toFixed(6)));
}

/** Generate a deterministic-looking tx hash */
export function generateTxHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/** Generate a wallet address */
export function generateWalletAddress(): string {
  const chars = "0123456789abcdef";
  let addr = "0x";
  for (let i = 0; i < 40; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)];
  }
  return addr;
}

/** Create a transaction record for a knowledge absorption */
export function createTransactionRecord(
  payer: RobotProfile,
  payee: RobotProfile,
  post: KnowledgePost
): Transaction {
  const amount = calculateAbsorptionPrice(post);
  return {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    payer_robot_id: payer.id,
    payee_robot_id: payee.id,
    post_id: post.id,
    amount,
    currency: "ROBO",
    tx_hash: generateTxHash(),
    status: "confirmed",
    block_number: Math.floor(Math.random() * 1000000) + 18000000,
    gas_fee: BASE_GAS_FEE,
    created_at: new Date().toISOString(),
  };
}

/** Format ROBO amount for display */
export function formatRobo(amount: number): string {
  if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K ROBO`;
  if (amount >= 1) return `${amount.toFixed(4)} ROBO`;
  return `${amount.toFixed(6)} ROBO`;
}

/** Truncate wallet address for display */
export function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
