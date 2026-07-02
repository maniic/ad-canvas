import type { AdSpec } from "../../shared/types";

export const SAMPLE_SPEC: AdSpec = {
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
      id: "body",
      text: "Turn a sentence into a polished ad in seconds.",
      x: 90,
      y: 360,
      fontSize: 40,
      color: "#CBD5E1",
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
