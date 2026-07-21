"use server";
import "server-only";

import { getAuthToken } from "@/api/auth-token";
import { NEXT_PUBLIC_THIRDWEB_API_HOST } from "@/constants/public-envs";

const TEAM_ID_OR_SLUG_REGEX = /^[A-Za-z0-9_-]+$/;

function getVerifiedDomainUrl(teamIdOrSlug: string): string {
  if (!TEAM_ID_OR_SLUG_REGEX.test(teamIdOrSlug)) {
    throw new Error("Invalid team identifier");
  }

  return `${NEXT_PUBLIC_THIRDWEB_API_HOST}/v1/teams/${encodeURIComponent(teamIdOrSlug)}/verified-domain`;
}

function toSafeTeamPathSegment(teamIdOrSlug: string): string | null {
  // Allow typical team IDs/slugs only; reject path/control characters.
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(teamIdOrSlug)) {
    return null;
  }

  return encodeURIComponent(teamIdOrSlug);
}

export type VerifiedDomainResponse =
  | {
      status: "pending";
      domain: string;
      dnsSublabel: string;
      dnsValue: string;
    }
  | {
      status: "verified";
      domain: string;
      verifiedAt: Date;
    };

  const res = await fetch(getVerifiedDomainUrl(teamIdOrSlug), {
    headers: {
      Authorization: `Bearer ${token}`,
    return null;
  });

  const safeTeamIdOrSlug = toSafeTeamPathSegment(teamIdOrSlug);
  if (!safeTeamIdOrSlug) {
    return null;
  }

  const res = await fetch(
    `${NEXT_PUBLIC_THIRDWEB_API_HOST}/v1/teams/${safeTeamIdOrSlug}/verified-domain`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  if (res.ok) {
    return (await res.json())?.result as VerifiedDomainResponse;
  }

  return null;
  const res = await fetch(getVerifiedDomainUrl(teamIdOrSlug), {
    body: JSON.stringify({ domain }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    return {
    method: "POST",
  });
    };
  }

  const safeTeamIdOrSlug = toSafeTeamPathSegment(teamIdOrSlug);
  if (!safeTeamIdOrSlug) {
    return {
      error: "Invalid team identifier.",
    };
  }

  const res = await fetch(
    `${NEXT_PUBLIC_THIRDWEB_API_HOST}/v1/teams/${safeTeamIdOrSlug}/verified-domain`,
    {
      body: JSON.stringify({ domain }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (res.ok) {
    return (await res.json())?.result as VerifiedDomainResponse;
  }

  const resJson = (await res.json()) as {
    error: {
      code: string;
      message: string;
      statusCode: number;
    };
  };

  switch (resJson?.error?.statusCode) {
    case 400:
      return {
        error: "The domain you provided is not valid.",
      };
    case 409:
      return {
        error: "This domain is already verified by another team.",
      };
    default:
      return {
        error: resJson?.error?.message ?? "Failed to verify domain",
      };
  }
}
