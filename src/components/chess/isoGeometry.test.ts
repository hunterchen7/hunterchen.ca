import { describe, expect, it } from "vitest";
import {
  BOARD_SIZE,
  DIAMOND,
  DIAMOND_PROJECTION,
  FILES,
  STRAIGHT,
  STRAIGHT_PROJECTION,
  blendProjections,
  createBoardGeometry,
  squareAtIndices,
  squareIndices,
} from "./isoGeometry";

const ALL_SQUARES = Array.from(FILES).flatMap((file) =>
  Array.from({ length: BOARD_SIZE }, (_, i) => `${file}${i + 1}`),
);

const PROJECTIONS = [
  ["diamond", DIAMOND],
  ["straight", STRAIGHT],
] as const;

function parseViewBox(viewBox: string) {
  const parts = viewBox.split(" ").map(Number);
  if (parts.length !== 4) throw new Error(`bad viewBox: ${viewBox}`);
  const [x, y, width, height] = parts as [number, number, number, number];
  return { x, y, width, height };
}

describe("square indexing", () => {
  it("round-trips every square through squareIndices and back", () => {
    for (const square of ALL_SQUARES) {
      const { row, column } = squareIndices(square);
      expect(squareAtIndices(row, column)).toBe(square);
    }
  });

  it("rejects indices off the board", () => {
    expect(squareAtIndices(-1, 0)).toBeNull();
    expect(squareAtIndices(0, BOARD_SIZE)).toBeNull();
  });
});

describe.each(PROJECTIONS)("%s projection", (_name, geometry) => {
  it("inverts exactly: the centre of every square maps back to that square", () => {
    for (const square of ALL_SQUARES) {
      const { x, y } = geometry.squareCenter(square);
      expect(geometry.squareAtPoint(x, y)).toBe(square);
    }
  });

  it("maps points just outside the board to null", () => {
    const far = geometry.point(-0.01, -0.01);
    expect(geometry.squareAtPoint(far.x, far.y)).toBeNull();
  });

  // Regression: the derived viewBox once measured piece centres but not the
  // board's own corners, so the board's edges fell just outside the frame.
  it("frames every board corner and every square centre", () => {
    const frame = parseViewBox(geometry.viewBox);
    const inside = ({ x, y }: { x: number; y: number }) =>
      x >= frame.x &&
      x <= frame.x + frame.width &&
      y >= frame.y &&
      y <= frame.y + frame.height;

    for (const corner of Object.values(geometry.corners)) {
      expect(inside(corner)).toBe(true);
    }
    for (const square of ALL_SQUARES) {
      expect(inside(geometry.squareCenter(square))).toBe(true);
    }
    // viewBox is formatted to two decimals; aspect is computed from the raw frame.
    expect(geometry.aspect).toBeCloseTo(frame.width / frame.height, 3);
  });

  it("has a positive, finite frame", () => {
    const frame = parseViewBox(geometry.viewBox);
    for (const value of Object.values(frame)) expect(Number.isFinite(value)).toBe(true);
    expect(frame.width).toBeGreaterThan(0);
    expect(frame.height).toBeGreaterThan(0);
  });

  it("keeps piece roundness consistent with the squares' foreshortening", () => {
    // A circle on the board projects with height/width equal to the ratio of
    // the two basis vectors' screen extents. Roundness should track it, or the
    // pieces sit in a different perspective from the squares.
    const a1 = geometry.squareCenter("a1");
    const a2 = geometry.squareCenter("a2");
    const b1 = geometry.squareCenter("b1");
    const rankStep = Math.hypot(a2.x - a1.x, a2.y - a1.y);
    const fileStep = Math.hypot(b1.x - a1.x, b1.y - a1.y);
    expect(rankStep).toBeGreaterThan(0);
    expect(fileStep).toBeGreaterThan(0);
    expect(geometry.pieceRoundness).toBeGreaterThan(0);
    expect(geometry.pieceRoundness).toBeLessThanOrEqual(1);
  });

  it("agrees with the light/dark parity used by the move cues", () => {
    for (const { light, square } of geometry.squares) {
      const parity = (FILES.indexOf(square[0]!) + Number(square[1])) % 2 === 0;
      expect(light).toBe(parity);
    }
  });
});

describe("blendProjections", () => {
  it("returns the endpoints at t=0 and t=1", () => {
    expect(blendProjections(DIAMOND_PROJECTION, STRAIGHT_PROJECTION, 0)).toEqual(
      DIAMOND_PROJECTION,
    );
    expect(blendProjections(DIAMOND_PROJECTION, STRAIGHT_PROJECTION, 1)).toEqual(
      STRAIGHT_PROJECTION,
    );
  });

  it("stays invertible partway through the swing", () => {
    for (const t of [0.15, 0.5, 0.85]) {
      const mid = createBoardGeometry(
        blendProjections(DIAMOND_PROJECTION, STRAIGHT_PROJECTION, t),
      );
      for (const square of ["a1", "h8", "e4", "d5"]) {
        const { x, y } = mid.squareCenter(square);
        expect(mid.squareAtPoint(x, y)).toBe(square);
      }
    }
  });
});
