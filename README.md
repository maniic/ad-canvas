# ad-canvas

A minimal full-stack prototype that turns a chat message into a generated ad rendered on an editable 1080×1080 canvas. Send a brief, get a structured ad layout back from Claude, then refine it with follow-up messages or by dragging and editing elements directly on the canvas. Demonstrates LLM-to-UI structured generation with iterative editing.

---

<!-- TODO: replace with a screenshot or GIF of the chat + canvas UI -->
> **Screenshot:** add `docs/screenshot.png` showing the two-panel layout (chat sidebar + rendered canvas).

---

## How to run

**Prerequisites:** Node ≥ 18 and npm.

### 1. Server

```bash
cd server
npm install
cp .env.example .env          # then open .env and set ANTHROPIC_API_KEY=sk-ant-...
npm run dev                   # starts on http://localhost:3001
```

### 2. Client

```bash
cd client
npm install
npm run dev                   # starts Vite; open the printed URL (default http://localhost:5173)
```

The client proxies `/generate` requests to `http://localhost:3001`, so both processes must be running.

> A valid Anthropic API key is required for generation to work. Without it the server returns a 500 error before making any API call.

---

## How it works

1. You type a brief in the chat sidebar. The client sends `{ message, currentSpec }` to `POST /generate` on the server (`currentSpec` is `null` for the first request).
2. The server calls Claude (`claude-sonnet-4-6`) with a structured-output constraint and returns a JSON `AdSpec` — background colors, and an array of positioned text elements with coordinates, font sizes, and colors.
3. The canvas renders the spec as absolutely positioned elements scaled from the logical 1080×1080 space.
4. You can drag elements or double-click to edit text inline. Those changes mutate the spec in client state.
5. Your next message is sent alongside the updated spec, so Claude treats it as a targeted edit and changes only what you asked for.

---

## Design note — the AdSpec contract

Everything in the app flows through a single `AdSpec` type, defined once in `shared/types.ts` and imported by both the client and the server. This means there is no translation layer: the object Claude generates is the same object the canvas renders, and the same object sent back with the next edit request.

The key structural choice is that `elements` is a **generic array** of `AdElement` objects rather than fixed named fields like `headline`, `body`, and `cta`. This gives Claude full freedom to add, remove, or restyle elements in response to an edit instruction — it is not constrained to overwrite a fixed set of slots. A prompt asking to "add a disclaimer line" produces a new element in the array; one asking to "remove the subheading" just omits it.

The same `AdSpec` JSON schema (`AD_SPEC_JSON_SCHEMA`) that defines the TypeScript type is also passed to the API as a structured-output constraint, so the model is guided to produce well-formed JSON from the start. The server still validates the response with `validateAdSpec`; if validation fails it retries once with a corrective prompt, and if the second attempt also fails it returns a `422` rather than surfacing a malformed spec to the client.
