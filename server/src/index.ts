import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env["PORT"] ?? 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// TODO: Task 3 — implement POST /generate with Anthropic API call
// Request: { message: string; currentSpec: AdSpec | null }
// Response: AdSpec
// Behavior: fresh generation if currentSpec is null, minimal edit otherwise
// Parse + validate response, retry once on failure, return 422 if still invalid

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
