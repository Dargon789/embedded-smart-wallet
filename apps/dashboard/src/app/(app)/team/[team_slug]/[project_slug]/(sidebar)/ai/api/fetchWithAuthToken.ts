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

    // Enforce endpoint as a strict relative path under the trusted host.
    // This prevents host override, protocol-relative URLs, and traversal tricks.
    const rawEndpoint = options.endpoint;

    if (!rawEndpoint.startsWith("/")) {
      throw new Error("Endpoint must be an absolute path starting with '/'");
    }

    if (
      rawEndpoint.startsWith("//") ||
      rawEndpoint.includes("\\") ||
      rawEndpoint.includes("#") ||
      rawEndpoint.startsWith("http://") ||
      rawEndpoint.startsWith("https://")
    ) {
      throw new Error("Invalid endpoint format");
    }

    const [pathOnly] = rawEndpoint.split("?");
    const segments = pathOnly.split("/");
    if (segments.some((segment) => segment === "." || segment === "..")) {
      throw new Error("Invalid endpoint path");
    }

    const endpointUrl = new URL(rawEndpoint, ALLOWED_AI_HOST_URL);

    if (
      endpointUrl.protocol !== "http:" &&
      endpointUrl.protocol !== "https:"
    ) {
      throw new Error("Invalid endpoint protocol");
    }

    if (endpointUrl.hostname !== ALLOWED_AI_HOST_URL.hostname) {
      throw new Error("Endpoint host is not allowed");
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
