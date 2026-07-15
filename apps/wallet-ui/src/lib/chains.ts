"use server";
import type { ChainMetadata } from "thirdweb/chains";

export async function getChains() {
  const response = await fetch(
    "https://api.thirdweb.com/v1/chains",
    // revalidate every hour
    { next: { revalidate: 60 * 60 } },
  );

  if (!response.ok) {
    const error = await response.text().catch(() => null);
    throw new Error(
      `Failed to fetch chains: ${response.status} - ${response.statusText}: ${error || "unknown error"}`,
    );
  }

  return (await response.json()).data as ChainMetadata[];
}

function sanitizeChainIdOrSlug(input: string): string {
  const trimmed = input.trim();
  // Allow only common identifier characters to prevent path traversal or injection
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new Error("Invalid chain identifier");
  }
  return trimmed;
}

export async function getChain(chainIdOrSlug: string): Promise<ChainMetadata> {
  const safeChainIdOrSlug = sanitizeChainIdOrSlug(chainIdOrSlug);
  const res = await fetch(
    `https://api.thirdweb.com/v1/chains/${safeChainIdOrSlug}`,
    // revalidate every 15 minutes
    { next: { revalidate: 15 * 60 } },
  );

  const result = await res.json();
  if (!result.data) {
    throw new Error("Failed to fetch chain");
  }

  return result.data as ChainMetadata;
}
