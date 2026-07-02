import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateAdSpec } from "./types.js";

const validSpec = {
  background: { color: "#0F172A", accentColor: "#38BDF8" },
  canvasSize: { width: 1080, height: 1080 },
  elements: [
    {
      id: "headline",
      text: "Ship ideas faster",
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

describe("validateAdSpec", () => {
  it("returns true for a valid AdSpec", () => {
    assert.equal(validateAdSpec(validSpec), true);
  });

  it("returns false when background is missing", () => {
    const { background: _bg, ...withoutBackground } = validSpec;
    assert.equal(validateAdSpec(withoutBackground), false);
  });

  it("returns false when elements is not an array", () => {
    assert.equal(
      validateAdSpec({ ...validSpec, elements: "not an array" }),
      false,
    );
  });

  it("returns false when an element has a non-numeric x", () => {
    const badElement = { ...validSpec.elements[0], x: "not a number" };
    assert.equal(
      validateAdSpec({ ...validSpec, elements: [badElement] }),
      false,
    );
  });

  it("returns false for null", () => {
    assert.equal(validateAdSpec(null), false);
  });

  it("returns false for a non-object", () => {
    assert.equal(validateAdSpec("string"), false);
    assert.equal(validateAdSpec(42), false);
    assert.equal(validateAdSpec(true), false);
  });
});
