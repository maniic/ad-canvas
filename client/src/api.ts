import type { GenerateRequest, GenerateResponse } from "../../shared/types";

export async function generateAd(
  req: GenerateRequest
): Promise<GenerateResponse> {
  let response: Response;
  try {
    response = await fetch("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Network error — could not reach the server."
    );
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as unknown;
      if (
        body !== null &&
        typeof body === "object" &&
        "error" in body &&
        typeof (body as Record<string, unknown>)["error"] === "string"
      ) {
        message = (body as Record<string, string>)["error"];
      }
    } catch {
      // ignore parse failures; keep statusText
    }
    throw new Error(message);
  }

  const data = (await response.json()) as unknown;
  // Minimal structural check before casting
  if (
    data === null ||
    typeof data !== "object" ||
    !("spec" in data) ||
    !("assistantMessage" in data)
  ) {
    throw new Error("Unexpected response shape from server.");
  }
  return data as GenerateResponse;
}
