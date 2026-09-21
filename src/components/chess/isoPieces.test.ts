import { describe, expect, it } from "vitest";
import { silhouette } from "./isoPieces";

function pointsOf(d: string) {
  const body = d.replace(/^M/, "").replace(/Z$/, "");
  return body.split(" ").map((pair) => {
    const [x, y] = pair.split(",").map(Number) as [number, number];
    return { x, y };
  });
}

/** The outline's half-width at a screen y, from the nearest sampled point. */
function widthAt(points: { x: number; y: number }[], y: number) {
  let best = points[0]!;
  for (const point of points) if (Math.abs(point.y - y) < Math.abs(best.y - y)) best = point;
  return Math.abs(best.x);
}

describe("silhouette", () => {
  const roundness = 0.8;

  it("projects a cylinder with the board's foreshortening at both ends", () => {
    const points = pointsOf(silhouette([{ h: 0, r: 1 }, { h: 2, r: 1 }], roundness));
    const ys = points.map((p) => p.y);
    const xs = points.map((p) => Math.abs(p.x));
    // The front of the base bulges toward the viewer by r × roundness, and the
    // back of the top is the same distance behind it.
    expect(Math.max(...ys)).toBeCloseTo(roundness, 1);
    expect(Math.min(...ys)).toBeCloseTo(-2 - roundness, 1);
    expect(Math.max(...xs)).toBeCloseTo(1, 2);
  });

  it("is symmetric about the axis and closed", () => {
    const d = silhouette([{ h: 0, r: 1.5 }, { h: 1, r: 1.5 }, { h: 1, r: 0.6 }, { h: 3, r: 0.6 }], roundness);
    expect(d).toMatch(/^M.*Z$/);
    const points = pointsOf(d);
    for (const point of points) {
      const mirror = points.find((other) => other.y === point.y && other.x === -point.x);
      expect(mirror).toBeDefined();
    }
  });

  it("takes the widest cross-section at every height, so a collar throws a lip", () => {
    const stem = { h: 2, r: 0.5 };
    const points = pointsOf(
      silhouette([{ h: 0, r: 0.5 }, stem, { h: 2, r: 1.2 }, { h: 2.4, r: 1.2 }], roundness),
    );
    expect(widthAt(points, -1)).toBeCloseTo(0.5, 1);
    expect(widthAt(points, -2.2)).toBeCloseTo(1.2, 1);
    // Just below the collar, its front rim is still wider than the stem.
    expect(widthAt(points, -2 + 0.3)).toBeGreaterThan(0.9);
  });

  it("produces only finite coordinates for every piece at every camera angle", () => {
    for (const roundness of [0.5, 0.6, 0.83, 1]) {
      const d = silhouette([{ h: 0, r: 2 }, { h: 1, r: 1 }, { h: 4, r: 0 }], roundness);
      for (const { x, y } of pointsOf(d)) {
        expect(Number.isFinite(x)).toBe(true);
        expect(Number.isFinite(y)).toBe(true);
      }
    }
  });
});
