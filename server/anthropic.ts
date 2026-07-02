import type AnthropicSdk from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages.js";
import { AD_SPEC_JSON_SCHEMA, validateAdSpec } from "../shared/types.js";
import type { AdSpec, GenerateRequest, GenerateResponse } from "../shared/types.js";
import { SYSTEM_PROMPT } from "./prompt.js";

/**
 * The response schema passed to output_config.format.
 * Wraps the AdSpec schema inside a "spec" field plus a "note" field.
 */
const RESPONSE_SCHEMA = {
  type: "object",
  required: ["note", "spec"],
  additionalProperties: false,
  properties: {
    note: { type: "string" },
    spec: AD_SPEC_JSON_SCHEMA,
  },
} as const;

/**
 * The shape returned by the structured-output model call.
 * This is what we parse from the text block.
 */
type ModelResponse = {
  note: string;
  spec: AdSpec;
};

/**
 * Typed error thrown when validation is exhausted after the retry.
 * The endpoint maps this to HTTP 422.
 */
export class ValidationExhaustedError extends Error {
  readonly statusCode = 422;
  constructor(message: string) {
    super(message);
    this.name = "ValidationExhaustedError";
  }
}

/**
 * The injected model function. Takes a messages array and returns the raw
 * text string from the first text block in the model's response.
 * Production code passes the real Anthropic client; tests pass a fake.
 */
export type ModelFn = (messages: MessageParam[]) => Promise<string>;

/**
 * Build the messages array for a fresh generation or an edit.
 */
function buildMessages(req: GenerateRequest): MessageParam[] {
  if (req.currentSpec === null) {
    return [{ role: "user", content: req.message }];
  }

  return [
    {
      role: "user",
      content: [
        "Here is the current AdSpec:\n",
        "```json",
        JSON.stringify(req.currentSpec, null, 2),
        "```",
        "",
        `Apply this edit with minimal changes and return the full updated AdSpec: ${req.message}`,
      ].join("\n"),
    },
  ];
}

/**
 * Parse and validate the raw model text.
 * Returns a typed ModelResponse or null on any failure.
 */
function parseModelText(text: string): ModelResponse | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  if (parsed === null || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;

  if (typeof p["note"] !== "string") return null;
  if (!validateAdSpec(p["spec"])) return null;

  return { note: p["note"], spec: p["spec"] };
}

/**
 * Generate or edit an AdSpec via the injected model function.
 * Retries once on parse/validation failure, then throws ValidationExhaustedError.
 */
export async function generateAdSpec(
  req: GenerateRequest,
  callModel: ModelFn,
): Promise<GenerateResponse> {
  const messages = buildMessages(req);

  const firstText = await callModel(messages);
  const firstResult = parseModelText(firstText);

  if (firstResult !== null) {
    return {
      spec: firstResult.spec,
      assistantMessage: firstResult.note,
    };
  }

  // First attempt failed — retry with a corrective message appended.
  const retryMessages: MessageParam[] = [
    ...messages,
    { role: "assistant", content: firstText },
    {
      role: "user",
      content:
        "Your previous response was not valid JSON matching the schema. Return ONLY the JSON object.",
    },
  ];

  const secondText = await callModel(retryMessages);
  const secondResult = parseModelText(secondText);

  if (secondResult !== null) {
    return {
      spec: secondResult.spec,
      assistantMessage: secondResult.note,
    };
  }

  throw new ValidationExhaustedError(
    "Model failed to return a valid AdSpec after two attempts.",
  );
}

/**
 * Build the real ModelFn from an Anthropic client.
 * Exported so index.ts can construct it without importing Anthropic directly.
 */
export function makeRealModelFn(apiKey: string): ModelFn {
  // Lazily import the SDK and construct the client once; reused across all
  // invocations of this ModelFn (including the retry inside generateAdSpec).
  // Tests that never call makeRealModelFn pay zero SDK import cost.
  let clientPromise: Promise<AnthropicSdk> | null = null;

  return async (messages: MessageParam[]) => {
    if (clientPromise === null) {
      clientPromise = import("@anthropic-ai/sdk").then(
        ({ default: Anthropic }) => new Anthropic({ apiKey }),
      );
    }
    const client = await clientPromise;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      thinking: { type: "disabled" },
      system: SYSTEM_PROMPT,
      messages,
      output_config: {
        format: { type: "json_schema", schema: RESPONSE_SCHEMA },
      },
    });

    if (response.stop_reason === "refusal") {
      throw new Error("Model refused the request");
    }

    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock && textBlock.type === "text" ? textBlock.text : "";
  };
}
