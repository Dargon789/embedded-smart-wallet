import "server-only";
import type { ProjectResponse } from "@thirdweb-dev/service-utils";
import { getAuthToken } from "@/api/auth-token";
import { NEXT_PUBLIC_THIRDWEB_API_HOST } from "@/constants/public-envs";

export type Project = ProjectResponse;

const SLUG_PATTERN = /^[A-Za-z0-9_-]+$/;

function toSafePathSegment(value: string): string | null {
  if (!SLUG_PATTERN.test(value)) {
    return null;
  }
  return encodeURIComponent(value);
}

export async function getProjects(teamSlug: string) {
  const token = await getAuthToken();

  if (!token) {
    return [];
  }

  const safeTeamSlug = toSafePathSegment(teamSlug);
  if (!safeTeamSlug) {
    return [];
  }

  const teamsRes = await fetch(
    `${NEXT_PUBLIC_THIRDWEB_API_HOST}/v1/teams/${safeTeamSlug}/projects`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  if (teamsRes.ok) {
    return (await teamsRes.json())?.result as Project[];
  }
  return [];
}

export async function getProject(teamSlug: string, projectSlug: string) {
  const token = await getAuthToken();

  if (!token) {
    return null;
  }

  const safeTeamSlug = toSafePathSegment(teamSlug);
  const safeProjectSlug = toSafePathSegment(projectSlug);
  if (!safeTeamSlug || !safeProjectSlug) {
    return null;
  }

  const teamsRes = await fetch(
    `${NEXT_PUBLIC_THIRDWEB_API_HOST}/v1/teams/${safeTeamSlug}/projects/${safeProjectSlug}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  if (teamsRes.ok) {
    return (await teamsRes.json())?.result as Project;
  }
  return null;
}
