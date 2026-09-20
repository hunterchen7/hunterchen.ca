import { describe, expect, it } from "vitest";
import {
  SCATTER_MS,
  SEQUENCE_MS,
  SETUP_AT,
  SWING_AT,
  playSequenceAt,
} from "./ChessLandingSection";
import { DIAMOND, STRAIGHT } from "./chess/isoGeometry";

describe("play sequence", () => {
  it("sweeps the resting board first, without touching the live board", () => {
    for (const t of [0, SCATTER_MS / 2, SCATTER_MS - 1]) {
      const stage = playSequenceAt(t);
      expect(stage.restingBoard).toBe(true);
      expect(stage.pieceStage).toBeNull();
      expect(stage.geometry).toBe(DIAMOND);
    }
    expect(playSequenceAt(SCATTER_MS - 1).scatter).toBeGreaterThan(playSequenceAt(0).scatter);
  });

  // Regression: the drop-in once overlapped the rotation, so the board never
  // turned empty. Every sample inside the swing must draw the setup at elapsed
  // 0, which the renderer turns into an empty board.
  it("turns the board with nothing on it", () => {
    for (let t = SWING_AT; t < SETUP_AT; t += 25) {
      const stage = playSequenceAt(t);
      expect(stage.restingBoard, `resting board still up at ${t}`).toBe(false);
      expect(stage.pieceStage, `no stage at ${t}`).not.toBeNull();
      expect(stage.pieceStage!.mode).toBe("setup");
      expect(stage.pieceStage!.elapsed, `pieces already entering at ${t}`).toBe(0);
    }
  });

  it("starts the swing on the diamond and ends it head-on", () => {
    expect(playSequenceAt(SWING_AT).geometry.viewBox).toBe(DIAMOND.viewBox);
    expect(playSequenceAt(SETUP_AT).geometry).toBe(STRAIGHT);
  });

  it("only begins laying pieces out after the swing has finished", () => {
    expect(playSequenceAt(SETUP_AT).pieceStage!.elapsed).toBe(0);
    expect(playSequenceAt(SETUP_AT + 100).pieceStage!.elapsed).toBeGreaterThan(0);
    let previous = 0;
    for (let t = SETUP_AT; t < SEQUENCE_MS; t += 50) {
      const elapsed = playSequenceAt(t).pieceStage!.elapsed;
      expect(elapsed).toBeGreaterThanOrEqual(previous);
      previous = elapsed;
    }
  });

  it("settles to a resting head-on board", () => {
    const done = playSequenceAt(SEQUENCE_MS);
    expect(done.geometry).toBe(STRAIGHT);
    expect(done.pieceStage).toBeNull();
    expect(done.restingBoard).toBe(false);
  });
});
