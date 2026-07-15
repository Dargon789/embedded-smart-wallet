"use server";

import { getAuthToken } from "@/api/auth-token";
import type { Project } from "@/api/project/projects";
import { NEXT_PUBLIC_THIRDWEB_AI_HOST } from "@/constants/public-envs";

type FetchWithKeyOptions = {
  endpoint: string;
  project: Project;
  timeout?: number;
} & (
  | {
      method: "POST" | "PUT";
      body: Record<string, unknown>;
    }
  | {
      method: "GET" | "DELETE";
    }
);

const ALLOWED_AI_HOST_URL = new URL(NEXT_PUBLIC_THIRDWEB_AI_HOST);

export async function fetchWithAuthToken(options: FetchWithKeyOptions) {
  const timeout = options.timeout || 30000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error("No auth token found");
    }

    // Only allow root-relative API endpoints to prevent SSRF via host/scheme override.
    if (!options.endpoint.startsWith("/")) {
      throw new Error("Endpoint must be a root-relative path");
    }

    if (options.endpoint.startsWith("//") || options.endpoint.includes("\\")) {
      throw new Error("Invalid endpoint format");
    }

    // Reject path traversal and dot-segments before URL resolution.
    const endpointPathOnly = options.endpoint.split("?")[0] || "/";
    const endpointSegments = endpointPathOnly.split("/");
    if (endpointSegments.some((segment) => segment === "." || segment === "..")) {
      throw new Error("Invalid endpoint path");
    }

    const endpointUrl = new URL(options.endpoint, ALLOWED_AI_HOST_URL);

    if (
      endpointUrl.protocol !== "http:" &&
      endpointUrl.protocol !== "https:"
    ) {
      throw new Error("Invalid endpoint protocol");
    }

    if (endpointUrl.origin !== ALLOWED_AI_HOST_URL.origin) {
      throw new Error("Endpoint host is not allowed");
    }

    const allowedBasePath = ALLOWED_AI_HOST_URL.pathname.endsWith("/")
      ? ALLOWED_AI_HOST_URL.pathname
      : `${ALLOWED_AI_HOST_URL.pathname}/`;
    if (!endpointUrl.pathname.startsWith(allowedBasePath)) {
      throw new Error("Endpoint path escapes allowed base path");
    }

    const response = await fetch(endpointUrl.toString(), {
      body: "body" in options ? JSON.stringify(options.body) : undefined,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
        "x-team-id": options.project.teamId,
        "x-client-id": options.project.publishableKey,
        "Content-Type": "application/json",
      },
      method: options.method,
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 504) {
        throw new Error("Request timed out. Please try again.");
      }

      const data = await response.text();
      throw new Error(`HTTP error! status: ${response.status}: ${data}`);
    }

    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
