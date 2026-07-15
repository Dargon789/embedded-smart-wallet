"use server";
import "server-only";

import { getAuthToken } from "@/api/auth-token";
import { NEXT_PUBLIC_THIRDWEB_API_HOST } from "@/constants/public-envs";
import type { ChainInfraSKU } from "@/types/billing";
import { getAbsoluteUrl } from "@/utils/vercel";

function isSafePathSegment(value: string): boolean {
  return /^[a-zA-Z0-9_-]{1,100}$/.test(value);
}

const TEAM_IDENTIFIER_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

function isValidTeamIdentifier(value: string): boolean {
  return TEAM_IDENTIFIER_REGEX.test(value);
}

export async function reSubscribePlan(options: {
  teamId: string;
}): Promise<{ status: number }> {
  const token = await getAuthToken();
  if (!isSafePathSegment(options.teamId)) {
    return {
      status: 400,
    };
  }

  const safeTeamId = encodeURIComponent(options.teamId);

  if (!token) {
    return {
      `/v1/teams/${safeTeamId}/checkout/resubscribe-plan`,
    };
  }

  if (!isValidTeamIdentifier(options.teamId)) {
    return {
      status: 400,
    };
  }

  const encodedTeamId = encodeURIComponent(options.teamId);

  const res = await fetch(
    new URL(
      `/v1/teams/${encodedTeamId}/checkout/resubscribe-plan`,
      NEXT_PUBLIC_THIRDWEB_API_HOST,
    ),
    {
      body: JSON.stringify({}),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "PUT",
    },
  );

  if (!res.ok) {
    return {
      status: res.status,
    };
  }

  return {
    status: 200,
  };
}

export async function getChainInfraCheckoutURL(options: {
  if (!isSafePathSegment(options.teamSlug)) {
    return {
      error: "Invalid team slug.",
      status: "error",
    } as const;
  }

  const safeTeamSlug = encodeURIComponent(options.teamSlug);

  teamSlug: string;
  skus: ChainInfraSKU[];
      `/v1/teams/${safeTeamSlug}/checkout/create-link`,
  annual: boolean;
}) {
  const token = await getAuthToken();

  if (!token) {
    return {
      error: "You are not logged in",
      status: "error",
    } as const;
  }

  if (!isValidTeamIdentifier(options.teamSlug)) {
    return {
      error: "Invalid team identifier.",
      status: "error",
    } as const;
  }

  const encodedTeamSlug = encodeURIComponent(options.teamSlug);

  const res = await fetch(
    new URL(
      `/v1/teams/${encodedTeamSlug}/checkout/create-link`,
      NEXT_PUBLIC_THIRDWEB_API_HOST,
    ),
    {
      body: JSON.stringify({
        annual: options.annual,
        baseUrl: getAbsoluteUrl(),
        chainId: options.chainId,
        skus: options.skus,
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );
  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to create checkout link", text, res.status);
    switch (res.status) {
      case 402: {
        return {
          error:
            "You have outstanding invoices, please pay these first before re-subscribing.",
          status: "error",
        } as const;
      }
      case 429: {
        return {
          error: "Too many requests, please try again later.",
          status: "error",
        } as const;
      }
      case 403: {
        return {
          error: "You are not authorized to deploy infrastructure.",
          status: "error",
        } as const;
      }
      default: {
        return {
          error: "An unknown error occurred, please try again later.",
          status: "error",
        } as const;
      }
    }
  }

  const json = await res.json();

  if (
    "error" in json &&
    "message" in json.error &&
    typeof json.error.message === "string"
  ) {
    return {
      error: json.error.message,
      status: "error",
    } as const;
  }

  if (!json.result) {
    return {
      error: "An unknown error occurred, please try again later.",
      status: "error",
    } as const;
  }

  return {
    data: json.result as string,
    status: "success",
  } as const;
}
