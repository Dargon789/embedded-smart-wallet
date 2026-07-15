"use server";
import "server-only";

import { getAuthToken } from "@/api/auth-token";
import { NEXT_PUBLIC_THIRDWEB_API_HOST } from "@/constants/public-envs";

const TEAM_ID_OR_SLUG_REGEX = /^[A-Za-z0-9_-]{1,64}$/;

function isValidTeamIdOrSlug(value: string): boolean {
  return TEAM_ID_OR_SLUG_REGEX.test(value);
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

function getSafeTeamPathSegment(teamIdOrSlug: string): string | null {
  const normalized = teamIdOrSlug.trim();
  if (!/^[A-Za-z0-9_-]+$/.test(normalized)) {
    return null;
  }

  return encodeURIComponent(normalized);
}

  if (!isValidTeamIdOrSlug(teamIdOrSlug)) {
    return null;
  }

  const encodedTeamIdOrSlug = encodeURIComponent(teamIdOrSlug);
export async function checkDomainVerification(
    `${NEXT_PUBLIC_THIRDWEB_API_HOST}/v1/teams/${encodedTeamIdOrSlug}/verified-domain`,
): Promise<VerifiedDomainResponse | null> {
  const token = await getAuthToken();

  if (!token) {
    return null;
  }

  const safeTeamPathSegment = getSafeTeamPathSegment(teamIdOrSlug);
  if (!safeTeamPathSegment) {
    return null;
  }

  const res = await fetch(
    `${NEXT_PUBLIC_THIRDWEB_API_HOST}/v1/teams/${safeTeamPathSegment}/verified-domain`,
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
  if (!isValidTeamIdOrSlug(teamIdOrSlug)) {
    return {
      error: "Invalid team identifier.",
    };
  }

  const encodedTeamIdOrSlug = encodeURIComponent(teamIdOrSlug);
}
    `${NEXT_PUBLIC_THIRDWEB_API_HOST}/v1/teams/${encodedTeamIdOrSlug}/verified-domain`,
export async function createDomainVerification(
  teamIdOrSlug: string,
  domain: string,
): Promise<VerifiedDomainResponse | { error: string }> {
  const token = await getAuthToken();

  if (!token) {
    return {
      error: "Unauthorized",
    };
  }

  const safeTeamPathSegment = getSafeTeamPathSegment(teamIdOrSlug);
  if (!safeTeamPathSegment) {
    return {
      error: "Invalid team identifier.",
    };
  }

  const res = await fetch(
    `${NEXT_PUBLIC_THIRDWEB_API_HOST}/v1/teams/${safeTeamPathSegment}/verified-domain`,
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
