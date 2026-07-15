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

  const isValidTeamIdOrSlug = /^[A-Za-z0-9_-]{1,64}$/.test(teamIdOrSlug);
  if (!isValidTeamIdOrSlug) {
    return { error: "Invalid team identifier." };
  }

  const encodedTeamIdOrSlug = encodeURIComponent(teamIdOrSlug);

  const res = await fetch(
    new URL(
      `/v1/teams/${encodedTeamIdOrSlug}/dedicated-support-channel`,
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
