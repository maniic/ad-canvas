import "dotenv/config";
import express from "express";
import cors from "cors";
import { validateAdSpec } from "../../shared/types.js";
import type { GenerateRequest } from "../../shared/types.js";
import { generateAdSpec, makeRealModelFn, ValidationExhaustedError } from "../anthropic.js";

const app = express();
const PORT = process.env["PORT"] ?? 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/generate", async (req, res) => {
  // Guard: require API key before attempting any SDK call
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY is not set" });
    return;
  }

  // Minimal request validation
  const body: unknown = req.body;
  if (body === null || typeof body !== "object") {
    res.status(400).json({ error: "Request body must be a JSON object" });
    return;
  }

  const b = body as Record<string, unknown>;

  if (typeof b["message"] !== "string" || b["message"].trim() === "") {
    res.status(400).json({ error: "message must be a non-empty string" });
    return;
  }

  const currentSpec = b["currentSpec"] ?? null;
  if (currentSpec !== null && !validateAdSpec(currentSpec)) {
    res.status(400).json({ error: "currentSpec is present but does not match the AdSpec schema" });
    return;
  }

  const generateReq: GenerateRequest = {
    message: b["message"],
    currentSpec: currentSpec,
  };

  try {
    const callModel = makeRealModelFn(apiKey);
    const result = await generateAdSpec(generateReq, callModel);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof ValidationExhaustedError) {
      res.status(422).json({ error: err.message });
      return;
    }
    console.error("Unexpected error in /generate:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
