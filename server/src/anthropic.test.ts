import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateAdSpec, ValidationExhaustedError } from "../anthropic.js";
import type { ModelFn } from "../anthropic.js";
import type { GenerateRequest } from "../../shared/types.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validSpec = {
  background: { color: "#0F172A", accentColor: "#38BDF8" },
  canvasSize: { width: 1080 as const, height: 1080 as const },
  elements: [
    {
      id: "headline",
      text: "Ship faster",
      x: 90,
      y: 140,
      fontSize: 92,
      color: "#F8FAFC",
      fontWeight: 800,
    },
    {
      id: "cta",
      text: "Get started",
      x: 90,
      y: 560,
      fontSize: 36,
      color: "#0F172A",
      fontWeight: 700,
      bgColor: "#38BDF8",
      padding: 24,
    },
  ],
};

const validModelResponse = JSON.stringify({
  note: "Generated a bold ad",
  spec: validSpec,
});

const freshRequest: GenerateRequest = {
  message: "Create a tech startup ad with a dark theme",
  currentSpec: null,
};

const editRequest: GenerateRequest = {
  message: "Make the headline red",
  currentSpec: validSpec,
};

// ---------------------------------------------------------------------------
// Helper: fake model that returns predefined responses in sequence
// ---------------------------------------------------------------------------

function makeFakeModel(responses: string[]): { fn: ModelFn; callCount: () => number } {
  let count = 0;
  const fn: ModelFn = async () => {
    const response = responses[count];
    if (response === undefined) {
      throw new Error(`Fake model called more times (${count + 1}) than responses provided (${responses.length})`);
    }
    count++;
    return response;
  };
  return { fn, callCount: () => count };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("generateAdSpec", () => {
  it("returns parsed spec+note on a valid first response (fresh)", async () => {
    const { fn, callCount } = makeFakeModel([validModelResponse]);

    const result = await generateAdSpec(freshRequest, fn);

    assert.equal(callCount(), 1, "model should be called exactly once");
    assert.equal(result.assistantMessage, "Generated a bold ad");
    assert.deepEqual(result.spec, validSpec);
  });

  it("returns parsed spec+note on a valid first response (edit)", async () => {
    const { fn, callCount } = makeFakeModel([validModelResponse]);

    const result = await generateAdSpec(editRequest, fn);

    assert.equal(callCount(), 1, "model should be called exactly once");
    assert.equal(result.assistantMessage, "Generated a bold ad");
    assert.deepEqual(result.spec, validSpec);
  });

  it("retries once when first response is invalid JSON", async () => {
    const invalidResponse = "this is not json at all";
    const { fn, callCount } = makeFakeModel([invalidResponse, validModelResponse]);

    const result = await generateAdSpec(freshRequest, fn);

    assert.equal(callCount(), 2, "model should be called twice (retry happened)");
    assert.equal(result.assistantMessage, "Generated a bold ad");
    assert.deepEqual(result.spec, validSpec);
  });

  it("retries once when first response has a valid note but invalid spec", async () => {
    const badSpec = JSON.stringify({
      note: "Done",
      spec: { background: { color: "#000" }, elements: "not-an-array", canvasSize: { width: 1080, height: 1080 } },
    });
    const { fn, callCount } = makeFakeModel([badSpec, validModelResponse]);

    const result = await generateAdSpec(freshRequest, fn);

    assert.equal(callCount(), 2, "model should be called twice");
    assert.deepEqual(result.spec, validSpec);
  });

  it("retries once when first response is missing the note field", async () => {
    const missingNote = JSON.stringify({ spec: validSpec });
    const { fn, callCount } = makeFakeModel([missingNote, validModelResponse]);

    const result = await generateAdSpec(freshRequest, fn);

    assert.equal(callCount(), 2, "model should be called twice (missing note treated as invalid)");
    assert.deepEqual(result.spec, validSpec);
  });

  it("throws ValidationExhaustedError when both responses are invalid", async () => {
    const bad = "not json";
    const { fn, callCount } = makeFakeModel([bad, bad]);

    await assert.rejects(
      () => generateAdSpec(freshRequest, fn),
      (err: unknown) => {
        assert.ok(err instanceof ValidationExhaustedError, "should throw ValidationExhaustedError");
        assert.equal(err.statusCode, 422);
        return true;
      },
    );

    assert.equal(callCount(), 2, "model should be called exactly twice, no third attempt");
  });

  it("does not make a third call after two failures", async () => {
    const { fn, callCount } = makeFakeModel(["bad1", "bad2"]);

    await assert.rejects(() => generateAdSpec(freshRequest, fn), ValidationExhaustedError);

    assert.equal(callCount(), 2);
  });
});
