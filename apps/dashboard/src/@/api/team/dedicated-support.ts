"use server";
import "server-only";

import { getAuthToken } from "@/api/auth-token";
import { NEXT_PUBLIC_THIRDWEB_API_HOST } from "@/constants/public-envs";

export async function createDedicatedSupportChannel(
  teamIdOrSlug: string,
  channelType: "slack" | "telegram",
): Promise<{ error: string | null }> {
  const token = await getAuthToken();
  if (!token) {
    return { error: "Unauthorized" };
  }

  // Restrict untrusted input to an expected team id/slug character set.
  if (!/^[A-Za-z0-9_-]+$/.test(teamIdOrSlug)) {
    return { error: "Invalid team identifier." };
  }
  const safeTeamIdOrSlug = encodeURIComponent(teamIdOrSlug);

  const res = await fetch(
    new URL(
      `/v1/teams/${safeTeamIdOrSlug}/dedicated-support-channel`,
      NEXT_PUBLIC_THIRDWEB_API_HOST,
    ),
    {
      body: JSON.stringify({
        type: channelType,
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );
  if (!res.ok) {
    const json = await res.json();
    return {
      error:
        json.error?.message ?? "Failed to create dedicated support channel.",
    };
  }
  return { error: null };
}
