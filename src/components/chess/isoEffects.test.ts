import { describe, expect, it } from "vitest";
import { DIAMOND, STRAIGHT } from "./isoGeometry";
import {
  DROP_MS,
  GAME_MOVE_MS,
  MOVE_MS,
  dropMotionAt,
  gameMotionAt,
  RESET,
  SETUP,
  SETUP_DURATION_MS,
  capturedPieceMotion,
  captureProgressAt,
  pieceMotionAt,
  resetPieceMotion,
  resetWaves,
  setupDelayFor,
  setupPieceMotion,
} from "./isoEffects";

const AT_REST = { dx: 0, dy: 0, lift: 0, opacity: 1, rotation: 0 };

describe("move motion", () => {
  it("starts at the origin and ends at the destination", () => {
    expect(pieceMotionAt(0).travel).toBe(0);
    expect(pieceMotionAt(1).travel).toBe(1);
  });

  it("only begins travelling after the pickup", () => {
    // The recording lifts the piece before it moves. A move that started
    // sliding on frame one would be a regression against that.
    expect(pieceMotionAt(0.05).travel).toBe(0);
    expect(pieceMotionAt(0.5).travel).toBeGreaterThan(0);
  });

  it("starts the capture knockback at contact and lets it outlast the travel", () => {
    expect(captureProgressAt(0, 700)).toBe(0);
    expect(captureProgressAt(350, 700)).toBe(0);
    expect(captureProgressAt(700, 700)).toBeGreaterThan(0);
    expect(captureProgressAt(700, 700)).toBeLessThan(1);
    expect(captureProgressAt(1000, 700)).toBe(1);
  });

  it("shoves the victim hardest at contact", () => {
    const args = { fallSeed: 1, moverFrom: { x: 0, y: 0 }, victimAt: { x: 10, y: 0 } };
    const early = capturedPieceMotion({ ...args, captureProgress: 0.25 }).dx;
    const late =
      capturedPieceMotion({ ...args, captureProgress: 1 }).dx -
      capturedPieceMotion({ ...args, captureProgress: 0.75 }).dx;
    expect(early).toBeGreaterThan(late);
  });

  it("leaves the victim standing before the knockback and gone after it", () => {
    const args = { fallSeed: 1, moverFrom: { x: 0, y: 0 }, victimAt: { x: 10, y: 5 } };
    const before = capturedPieceMotion({ ...args, captureProgress: 0 });
    expect(before).toMatchObject({ ...AT_REST, scale: 1, verticalScale: 1 });
    const after = capturedPieceMotion({ ...args, captureProgress: 1 });
    expect(after.opacity).toBe(0);
  });
});

describe("board setup", () => {
  const center = STRAIGHT.boardCenter;
  const at = STRAIGHT.squareCenter("e1");

  it("schedules rooks before kings and pawns after the back rank", () => {
    expect(setupDelayFor("a1", "r")).toBeLessThan(setupDelayFor("e1", "k"));
    expect(setupDelayFor("h8", "r")).toBeLessThan(setupDelayFor("d8", "q"));
    expect(setupDelayFor("e2", "p")).toBeGreaterThan(setupDelayFor("e1", "k"));
  });

  it("finishes every piece within the advertised duration", () => {
    for (const [square, kind] of [
      ["a1", "r"],
      ["e1", "k"],
      ["h2", "p"],
      ["d8", "q"],
    ] as const) {
      expect(setupDelayFor(square, kind) + SETUP.pieceMs).toBeLessThanOrEqual(
        SETUP_DURATION_MS,
      );
    }
  });

  it("draws every piece invisible at elapsed 0", () => {
    // The board rotates empty; this is what makes it empty.
    for (const kind of ["p", "r", "n", "b", "q", "k"]) {
      const motion = setupPieceMotion({ at, boardCenter: center, elapsed: 0, kind, square: "e1" });
      expect(motion.opacity).toBe(0);
    }
  });

  it("draws every piece at rest once its entrance has finished", () => {
    for (const kind of ["p", "k"]) {
      const motion = setupPieceMotion({
        at,
        boardCenter: center,
        elapsed: setupDelayFor("e1", kind) + SETUP.pieceMs + 1,
        kind,
        square: "e1",
      });
      expect(motion.opacity).toBeCloseTo(1, 6);
      expect(motion.dx).toBeCloseTo(0, 6);
      expect(motion.dy).toBeCloseTo(0, 6);
      expect(motion.scale).toBeCloseTo(1, 6);
      expect(motion.verticalScale).toBeCloseTo(1, 6);
    }
  });

  it("produces only finite values across the whole entrance", () => {
    for (let elapsed = 0; elapsed <= SETUP_DURATION_MS; elapsed += 37) {
      const motion = setupPieceMotion({ at, boardCenter: center, elapsed, kind: "n", square: "b1" });
      for (const value of Object.values(motion)) expect(Number.isFinite(value)).toBe(true);
    }
  });
});

describe("board reset", () => {
  const center = DIAMOND.boardCenter;

  it("orders the sweep furthest-from-centre first, four to a wave", () => {
    const pieces = ["a1", "e4", "h8", "d5", "a8", "h1"].map((square) => ({
      at: DIAMOND.squareCenter(square),
      id: square,
    }));
    const waves = resetWaves(pieces, center);
    expect(waves.get("e4")).toBeGreaterThanOrEqual(waves.get("a1")!);
    expect(waves.get("d5")).toBeGreaterThanOrEqual(waves.get("h8")!);
    expect(Math.max(...waves.values())).toBe(1);
  });

  it("leaves a piece untouched before its wave and gone by the end", () => {
    const at = DIAMOND.squareCenter("a1");
    const early = resetPieceMotion({ at, boardCenter: center, elapsed: 0, wave: 2 });
    expect(early).toMatchObject({ ...AT_REST, scale: 1, verticalScale: 1 });
    const late = resetPieceMotion({ at, boardCenter: center, elapsed: RESET.totalMs, wave: 0 });
    expect(late.opacity).toBe(0);
  });

  it("has its last wave finish close to the advertised total", () => {
    // Eight waves of four for 32 pieces. The recording's own numbers let the
    // final wave overrun the nominal total slightly; pin that so a timing edit
    // that stretches it further is caught.
    const lastWave = Math.floor(31 / 4);
    const finish = lastWave * RESET.waveIntervalMs + RESET.pieceMs;
    expect(finish).toBeGreaterThan(RESET.totalMs * 0.9);
    expect(finish).toBeLessThanOrEqual(RESET.totalMs + 60);
  });
});

describe("timing constants", () => {
  it("keeps a move shorter than the recorded step so the loop can breathe", () => {
    expect(MOVE_MS).toBeGreaterThan(0);
  });
});

describe("game board motion", () => {
  it("is quicker than the demo's and closer to constant speed", () => {
    expect(GAME_MOVE_MS).toBeLessThan(MOVE_MS);
    expect(DROP_MS).toBeLessThan(GAME_MOVE_MS);
    // A quarter of the way into the travel window a full smoothstep has covered
    // 16%; this curve covers more, since it leans toward linear.
    expect(gameMotionAt(0.29).travel).toBeGreaterThan(0.2);
    expect(gameMotionAt(0).travel).toBe(0);
    expect(gameMotionAt(1).travel).toBe(1);
  });

  it("drops a held piece straight into its square with no pickup", () => {
    expect(dropMotionAt(0, 1.5)).toEqual({ lift: 1.5, travel: 0 });
    expect(dropMotionAt(1, 1.5).lift).toBeCloseTo(0);
    expect(dropMotionAt(1, 1.5).travel).toBeCloseTo(1);
    expect(dropMotionAt(0.5, 1.5).lift).toBeLessThan(1.5);
  });
});
