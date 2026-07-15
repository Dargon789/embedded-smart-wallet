import "server-only";
import type { ProjectResponse } from "@thirdweb-dev/service-utils";
import { getAuthToken } from "@/api/auth-token";
import { NEXT_PUBLIC_THIRDWEB_API_HOST } from "@/constants/public-envs";

export type Project = ProjectResponse;

const SLUG_RE = /^[a-z0-9-]+$/;

function toSafeSlugOrNull(value: string): string | null {
  if (!SLUG_RE.test(value)) {
    return null;
  }
  return value;
}

export async function getProjects(teamSlug: string) {
  const token = await getAuthToken();

  if (!token) {
    return [];
  }

  const safeTeamSlug = toSafeSlugOrNull(teamSlug);
  if (!safeTeamSlug) {
    return [];
  }

  const teamsRes = await fetch(
    `${NEXT_PUBLIC_THIRDWEB_API_HOST}/v1/teams/${encodeURIComponent(safeTeamSlug)}/projects`,
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

  const safeTeamSlug = toSafeSlugOrNull(teamSlug);
  const safeProjectSlug = toSafeSlugOrNull(projectSlug);
  if (!safeTeamSlug || !safeProjectSlug) {
    return null;
  }

  const teamsRes = await fetch(
    `${NEXT_PUBLIC_THIRDWEB_API_HOST}/v1/teams/${encodeURIComponent(safeTeamSlug)}/projects/${encodeURIComponent(safeProjectSlug)}`,
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
