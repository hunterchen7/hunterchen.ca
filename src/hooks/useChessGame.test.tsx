import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** A scripted engine: ready on init, and replies from a queue of UCI moves. */
const scripted: string[] = [];
vi.mock("../chess/engine/workerInterface", () => {
  class Lc0Engine {
    private listeners = new Set<(state: object) => void>();
    subscribe(listener: (state: object) => void) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
    init() {
      for (const listener of this.listeners) listener({ isReady: true, isLoading: false });
    }
    mctsSearch() {
      return Promise.resolve({ move: scripted.shift() ?? "", confidence: 1, wdl: [0, 0, 0] });
    }
    terminate() {}
  }
  return { Lc0Engine };
});
vi.mock("../chess/engine/modelCache", () => ({ hasModelCached: () => Promise.resolve(true) }));
vi.mock("../components/chess/sounds", () => ({ playSoundForMove: () => {} }));

import { useChessGame } from "./useChessGame";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("useChessGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    scripted.length = 0;
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  /** Lets the engine's reply promise settle and its thinking pause elapse. */
  const settle = (ms = 1_100) => act(() => vi.advanceTimersByTimeAsync(ms));

  it("keeps the mating position up after game over until a new game is started", async () => {
    // Scholar's mate against the player, who has black in the first game.
    scripted.push("f1c4", "d1h5", "h5f7");
    const { result } = renderHook(() => useChessGame());

    act(() => result.current.startGame());
    await settle(); // loading minimum
    await settle(); // the engine's hard-coded 1. e4
    expect(result.current.fen).toContain("4P3");

    const replies = [["e7", "e5"], ["b8", "c6"], ["g8", "f6"]] as const;
    for (const [from, to] of replies) {
      act(() => result.current.selectSquare(from));
      act(() => result.current.selectSquare(to));
      await settle();
    }

    expect(result.current.phase).toBe("over");
    expect(result.current.finishedStatus).toBe("checkmate — you lose");
    const mated = result.current.fen;
    expect(mated).toContain("Q");

    await settle(10_000);
    expect(result.current.fen).toBe(mated);
    expect(result.current.phase).toBe("over");

    act(() => result.current.startNewGame());
    expect(result.current.fen).toBe(START);
    expect(result.current.phase).toBe("playing");
    expect(result.current.playerColor).toBe("w");
  });
});
