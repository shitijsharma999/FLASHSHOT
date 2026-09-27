import type { HealthStatus } from "@flashshot/shared-types";

export async function checkApiHealth(apiBaseUrl: string): Promise<boolean> {
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/health`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    return false;
  }
  const body = (await response.json()) as HealthStatus;
  return body.status === "UP";
}
