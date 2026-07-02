export type AdElement = {
  id: string;
  text: string;
  x: number;        // px, relative to canvas top-left (logical 1080x1080 space)
  y: number;
  fontSize: number; // px, 16–120
  color: string;    // hex
  fontWeight?: number;
  bgColor?: string; // only for CTA-style elements
  padding?: number;
};

export type AdSpec = {
  background: { color: string; accentColor: string };
  elements: AdElement[];
  canvasSize: { width: 1080; height: 1080 };
};

export const AD_SPEC_JSON_SCHEMA = {
  type: "object",
  required: ["background", "elements", "canvasSize"],
  additionalProperties: false,
  properties: {
    background: {
      type: "object",
      required: ["color", "accentColor"],
      additionalProperties: false,
      properties: {
        color: { type: "string" },
        accentColor: { type: "string" },
      },
    },
    elements: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "text", "x", "y", "fontSize", "color"],
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          text: { type: "string" },
          x: { type: "integer" },
          y: { type: "integer" },
          fontSize: { type: "integer" },
          color: { type: "string" },
          fontWeight: { type: "integer" },
          bgColor: { type: "string" },
          padding: { type: "integer" },
        },
      },
    },
    canvasSize: {
      type: "object",
      required: ["width", "height"],
      additionalProperties: false,
      properties: {
        width: { type: "integer", const: 1080 },
        height: { type: "integer", const: 1080 },
      },
    },
  },
} as const;

export type GenerateRequest = { message: string; currentSpec: AdSpec | null };
export type GenerateResponse = { spec: AdSpec; assistantMessage: string };

export function validateAdSpec(value: unknown): value is AdSpec {
  if (value === null || typeof value !== "object") return false;

  const v = value as Record<string, unknown>;

  // Validate background
  if (typeof v["background"] !== "object" || v["background"] === null) return false;
  const bg = v["background"] as Record<string, unknown>;
  if (typeof bg["color"] !== "string") return false;
  if (typeof bg["accentColor"] !== "string") return false;

  // Validate elements
  if (!Array.isArray(v["elements"])) return false;
  for (const el of v["elements"]) {
    if (el === null || typeof el !== "object") return false;
    const elem = el as Record<string, unknown>;
    if (typeof elem["id"] !== "string") return false;
    if (typeof elem["text"] !== "string") return false;
    if (typeof elem["color"] !== "string") return false;
    if (typeof elem["x"] !== "number") return false;
    if (typeof elem["y"] !== "number") return false;
    if (typeof elem["fontSize"] !== "number") return false;
  }

  // Validate canvasSize
  if (typeof v["canvasSize"] !== "object" || v["canvasSize"] === null) return false;
  const cs = v["canvasSize"] as Record<string, unknown>;
  if (cs["width"] !== 1080) return false;
  if (cs["height"] !== 1080) return false;

  return true;
}
