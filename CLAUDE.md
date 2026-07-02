# Project: ad-canvas

A minimal full-stack prototype that turns a chat message into a generated ad rendered on an editable canvas. Built to demonstrate LLM-to-UI structured generation with iterative editing.

## Stack

- `client/`: Vite + React + TypeScript
- `server/`: Node + Express + TypeScript, single endpoint
- Anthropic API (model: claude-sonnet-4-6) for generation
- No database, no auth, no CSS framework. Plain CSS or CSS modules.
- Monorepo with two package.json files (client/, server/). Root README.

## Core data contract

Everything revolves around one shared type. Define it in both client and server (or a shared/ folder):

```typescript
type AdElement = {
  id: string;
  text: string;
  x: number;        // px, relative to canvas top-left
  y: number;
  fontSize: number; // px
  color: string;    // hex
  fontWeight?: number;
  bgColor?: string; // only for CTA-style elements
  padding?: number;
};

type AdSpec = {
  background: { color: string; accentColor: string };
  elements: AdElement[];       // headline, body, cta, etc. as generic elements
  canvasSize: { width: 1080; height: 1080 };
};
```

Keep elements generic (an array, not fixed headline/body/cta fields) so Claude can add or remove elements freely when editing.

## Server

One endpoint: `POST /generate`

Request body:
```typescript
{
  message: string;          // the user's chat message
  currentSpec: AdSpec | null; // null on first generation, populated when editing
}
```

Behavior:
- If `currentSpec` is null: generate a fresh AdSpec from the brief.
- If `currentSpec` is present: treat the message as an edit instruction. Modify the existing spec minimally. Do not regenerate untouched elements.
- System prompt must instruct Claude to return ONLY valid JSON matching the AdSpec schema. No markdown fences, no preamble.
- Parse the response, validate it has `background`, `elements`, `canvasSize`. On parse failure, retry once with a corrective message, then return 422.
- API key from `process.env.ANTHROPIC_API_KEY`. Never expose it to the client.
- Use `max_tokens: 2000`.

System prompt requirements (write it in `server/prompt.ts`):
- Claude is an ad layout designer producing a 1080x1080 ad.
- Explain the AdSpec schema inline with field constraints (x/y within canvas bounds accounting for element size, fontSize 16–120, colors as hex).
- Design guidance: strong visual hierarchy, headline large and high, CTA visually distinct with bgColor and padding, body copy readable, colors cohesive with the background, generous spacing, no overlapping elements.
- For edits: "You will receive the current AdSpec. Apply the user's instruction with minimal changes and return the full updated AdSpec."

## Client

Two-panel layout: chat sidebar (left, ~320px), canvas area (right, fills remaining space).

**Chat.tsx**
- Message history (user + a short assistant acknowledgment per generation, e.g. "Updated the headline").
- Input + send button, Enter to send.
- Disabled state + spinner while a request is in flight.
- Sends `{ message, currentSpec }` to `/generate`, lifts the returned spec to App state.

**Canvas.tsx**
- Renders a square canvas scaled to fit the panel (1080x1080 logical size, CSS-scaled down; use a transform scale wrapper so element coordinates stay in logical px).
- Background from `spec.background.color`, a subtle accent shape or gradient using `accentColor`.
- Renders each AdElement as an absolutely positioned div.

**AdElement.tsx**
- Draggable via pointer events (pointerdown/move/up, no library). Update x/y in state on drag, account for the canvas scale factor.
- Double-click to edit text inline (contentEditable or a swapped-in input).
- Selected state with a subtle outline.
- Drag and text edits mutate the spec in App state, so subsequent edit requests include the user's manual changes.

**App.tsx**
- Holds `spec: AdSpec | null` and chat history.
- Empty state before first generation: centered hint text like "Describe an ad to get started."

## Build order

1. Scaffold client + server, hardcode a sample AdSpec, render it on the canvas.
2. Dragging + inline text editing on canvas elements.
3. Server endpoint with Anthropic call, fresh generation path.
4. Wire chat to endpoint.
5. Edit path: pass currentSpec back, minimal-change edits.
6. README: what it is (2–3 lines), a screenshot or GIF, how to run it, and a short note on the AdSpec contract design decision.

Commit at the end of each step with a clear message.

## Quality bar

- Strict TypeScript, no `any`.
- Client and server both run with a single command each (`npm run dev`).
- .env.example in server/ with ANTHROPIC_API_KEY placeholder.
- .gitignore covering node_modules, .env, dist.
- Code should read like a real project: small components, clear names, no dead code, no commented-out blocks.

## Out of scope (do not build)

- Image generation, auth, persistence, undo/redo, multiple canvases, export, deployment config, tests beyond what you need to verify the parse/validate logic.
