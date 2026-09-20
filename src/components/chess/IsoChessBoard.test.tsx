import { cleanup, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import IsoChessBoard, {
  IDLE_CLOCK,
  isLightSquare,
  piecesFromFen,
  renderPieces,
  useMoveClock,
  type MoveClock,
  type RenderInput,
} from "./IsoChessBoard";
import { RESET, SETUP_DURATION_MS, captureProgressAt } from "./isoEffects";
import { STRAIGHT } from "./isoGeometry";
import { BASE_RADIUS, PieceDefinitions, PieceModel } from "./isoPieces";
import type { AnimatedMove, BoardHighlights } from "../../hooks/useChessGame";

afterEach(cleanup);

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
/** After 1. e4 d5 2. exd5 — the black d-pawn is already gone from the position. */
const AFTER_EXD5 = "rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2";

const NO_HIGHLIGHTS: BoardHighlights = {
  checkSquare: null,
  lastMove: null,
  legalCaptures: [],
  legalQuiet: [],
  selected: null,
};

const CAPTURE_EXD5: AnimatedMove = {
  capturedColor: "b",
  capturedKind: "p",
  capturedSquare: "d5",
  from: "e4",
  isMate: false,
  secondary: null,
  seq: 1,
  to: "d5",
};

/** A move clock at a given travel progress, with the dependent stages derived. */
function clockAt(move: number, hasCapture = false): MoveClock {
  return {
    capture: hasCapture ? captureProgressAt(move) : 0,
    landing: 0,
    move,
    settle: 0,
  };
}

function layout(overrides: Partial<RenderInput>): ReturnType<typeof renderPieces> {
  return renderPieces({
    clock: IDLE_CLOCK,
    flipped: false,
    geometry: STRAIGHT,
    pieceStage: null,
    pieces: piecesFromFen(START),
    playing: null,
    waves: new Map(),
    ...overrides,
  });
}

const at = (square: string) => STRAIGHT.squareCenter(square);

describe("piecesFromFen", () => {
  it("reads the opening position", () => {
    const pieces = piecesFromFen(START);
    expect(pieces).toHaveLength(32);
    expect(pieces.find((p) => p.square === "e2")).toMatchObject({ color: "w", kind: "p" });
    expect(pieces.find((p) => p.square === "e8")).toMatchObject({ color: "b", kind: "k" });
    expect(pieces.find((p) => p.square === "e4")).toBeUndefined();
  });
});

describe("renderPieces at rest", () => {
  it("draws every piece opaque on its own square, painter-sorted", () => {
    const rendered = layout({});
    expect(rendered).toHaveLength(32);
    for (const piece of rendered) {
      expect(piece.opacity).toBe(1);
      expect(piece.x).toBeCloseTo(at(piece.square).x, 6);
      expect(piece.y).toBeCloseTo(at(piece.square).y, 6);
      for (const value of [piece.x, piece.y, piece.lift, piece.scale, piece.rotation]) {
        expect(Number.isFinite(value)).toBe(true);
      }
    }
    for (let i = 1; i < rendered.length; i += 1) {
      expect(rendered[i]!.depth).toBeGreaterThanOrEqual(rendered[i - 1]!.depth);
    }
  });
});

describe("renderPieces during a move", () => {
  // Regression: the board once painted a frame with the mover already on its
  // destination before the travel began, which read as a hop.
  it("draws the mover at its origin on the first frame", () => {
    const rendered = layout({
      clock: clockAt(0, true),
      pieces: piecesFromFen(AFTER_EXD5),
      playing: CAPTURE_EXD5,
    });
    const mover = rendered.find((p) => p.square === "d5" && p.color === "w");
    expect(mover).toBeDefined();
    expect(mover!.x).toBeCloseTo(at("e4").x, 6);
    expect(mover!.y).toBeCloseTo(at("e4").y, 6);
  });

  it("draws the mover on its destination once the travel is done", () => {
    const rendered = layout({
      clock: { ...clockAt(1, true), capture: 1 },
      pieces: piecesFromFen(AFTER_EXD5),
      playing: CAPTURE_EXD5,
    });
    const mover = rendered.find((p) => p.square === "d5" && p.color === "w");
    expect(mover!.x).toBeCloseTo(at("d5").x, 6);
    expect(mover!.y).toBeCloseTo(at("d5").y, 6);
  });

  // Regression: the victim was only drawn once the knockback had started, so
  // it vanished on the click and reappeared mid-travel.
  it("keeps the captured piece standing on its square until the mover arrives", () => {
    for (const progress of [0, 0.25, 0.5]) {
      const rendered = layout({
        clock: clockAt(progress, true),
        pieces: piecesFromFen(AFTER_EXD5),
        playing: CAPTURE_EXD5,
      });
      const victim = rendered.find((p) => p.color === "b" && p.square === "d5");
      expect(victim, `victim missing at progress ${progress}`).toBeDefined();
      expect(victim!.opacity).toBe(1);
      expect(victim!.x).toBeCloseTo(at("d5").x, 6);
      expect(victim!.y).toBeCloseTo(at("d5").y, 6);
    }
  });

  it("removes the captured piece once the knockback has finished", () => {
    const rendered = layout({
      clock: { ...clockAt(1, true), capture: 1 },
      pieces: piecesFromFen(AFTER_EXD5),
      playing: CAPTURE_EXD5,
    });
    expect(rendered.find((p) => p.color === "b" && p.square === "d5")).toBeUndefined();
  });

  it("animates both halves of a castle", () => {
    const castled = "rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4";
    const move: AnimatedMove = {
      capturedColor: null,
      capturedKind: null,
      capturedSquare: null,
      from: "e1",
      isMate: false,
      secondary: { from: "h1", to: "f1" },
      seq: 2,
      to: "g1",
    };
    const rendered = layout({ clock: clockAt(0), pieces: piecesFromFen(castled), playing: move });
    expect(rendered.find((p) => p.square === "g1")!.x).toBeCloseTo(at("e1").x, 6);
    expect(rendered.find((p) => p.square === "f1")!.x).toBeCloseTo(at("h1").x, 6);
  });
});

describe("renderPieces during setup and scatter", () => {
  // The board is meant to turn empty; this is the invariant that makes it so.
  it("draws every piece invisible at setup elapsed 0", () => {
    const rendered = layout({ pieceStage: { elapsed: 0, mode: "setup" } });
    expect(rendered).toHaveLength(32);
    for (const piece of rendered) expect(piece.opacity).toBe(0);
  });

  it("has every piece at rest once the setup has run its course", () => {
    const rendered = layout({ pieceStage: { elapsed: SETUP_DURATION_MS, mode: "setup" } });
    for (const piece of rendered) {
      expect(piece.opacity).toBeCloseTo(1, 6);
      expect(piece.x).toBeCloseTo(at(piece.square).x, 6);
      expect(piece.y).toBeCloseTo(at(piece.square).y, 6);
    }
  });

  it("has every piece gone once the scatter has run its course", () => {
    const pieces = piecesFromFen(START);
    const waves = new Map(pieces.map((p, i) => [`${p.color}${p.kind}-${p.square}`, i % 8]));
    const rendered = layout({
      pieceStage: { elapsed: RESET.totalMs + 200, mode: "scatter" },
      pieces,
      waves,
    });
    for (const piece of rendered) expect(piece.opacity).toBe(0);
  });
});

describe("useMoveClock", () => {
  // Regression for the pre-move hop: the very first render after a move arrives
  // must already report it as playing at progress 0, not wait for a frame.
  it("reports a new move as playing at progress 0 on its first render", () => {
    const { result } = renderHook(() => useMoveClock(CAPTURE_EXD5));
    expect(result.current.playing).toBe(CAPTURE_EXD5);
    expect(result.current.clock.move).toBe(0);
    expect(result.current.clock.capture).toBe(0);
  });

  it("is idle with no move", () => {
    const { result } = renderHook(() => useMoveClock(null));
    expect(result.current.playing).toBeNull();
    expect(result.current.clock).toEqual(IDLE_CLOCK);
  });
});

describe("board markup", () => {
  it("gives every click target a button role and exactly one tab stop", () => {
    const { container } = render(
      <IsoChessBoard fen={START} highlights={NO_HIGHLIGHTS} interactive onSelectSquare={() => {}} />,
    );
    const targets = container.querySelectorAll("[data-hit-square]");
    expect(targets).toHaveLength(64 + 32);
    for (const target of targets) expect(target.getAttribute("role")).toBe("button");
    expect(container.querySelectorAll('[data-hit-square][tabindex="0"]')).toHaveLength(1);
  });

  it("renders no click targets when not interactive", () => {
    const { container } = render(<IsoChessBoard fen={START} highlights={NO_HIGHLIGHTS} />);
    expect(container.querySelectorAll("[data-hit-square]")).toHaveLength(0);
  });

  // Regression: move cues were one fixed tone and vanished on light squares.
  it("gives legal-move dots opposite tones on light and dark squares", () => {
    expect(isLightSquare("e4")).toBe(true);
    expect(isLightSquare("e3")).toBe(false);
    const { container } = render(
      <IsoChessBoard
        fen={START}
        highlights={{ ...NO_HIGHLIGHTS, legalQuiet: ["e3", "e4"], selected: "e2" }}
        interactive
        onSelectSquare={() => {}}
      />,
    );
    const dots = container.querySelectorAll('[data-layer="legal-quiet"] ellipse');
    expect(dots).toHaveLength(2);
    expect(dots[0]!.getAttribute("fill")).not.toBe(dots[1]!.getAttribute("fill"));
  });

  it("paints highlights beneath the pieces", () => {
    const { container } = render(
      <IsoChessBoard fen={START} highlights={{ ...NO_HIGHLIGHTS, selected: "e2" }} />,
    );
    const shake = container.querySelector("svg > g")!;
    const order = [...shake.children].map((child) => child.getAttribute("data-layer"));
    expect(order.indexOf("selected")).toBeLessThan(order.indexOf("pieces"));
  });
});

describe("piece artwork", () => {
  const numbers = (d: string) => d.match(/-?\d*\.?\d+(?:e-?\d+)?/g)?.map(Number) ?? [];

  it("defines every piece in both colours plus one body gradient per colour", () => {
    const { container } = render(
      <svg>
        <PieceDefinitions detail prefix="t" roundness={0.8} />
      </svg>,
    );
    expect(container.querySelectorAll("defs > g[id]")).toHaveLength(12);
    expect(container.querySelectorAll("defs > linearGradient")).toHaveLength(2);
  });

  // Regression: path data was once assembled by string-replacing an arc and
  // produced degenerate curves, and one base wall closed back on its own start.
  it("builds only finite, well-formed path data", () => {
    const { container } = render(
      <svg>
        <PieceDefinitions detail prefix="t" roundness={0.8} />
      </svg>,
    );
    for (const path of container.querySelectorAll("path[d]")) {
      const d = path.getAttribute("d")!;
      expect(d).not.toMatch(/NaN|undefined|null/);
      for (const value of numbers(d)) expect(Number.isFinite(value)).toBe(true);
    }
  });

  // Regression: the pieces were once stacks of separately stroked shapes (a
  // puck, a stem, a collar, a head), and every seam between them showed. Each
  // piece is now one silhouette: its parts are drawn once in the rim colour
  // and then covered by their fills, so the only strokes left on top are open
  // interior lines.
  it("draws every piece as one outlined solid with no stroked seams", () => {
    const { container } = render(
      <svg>
        <PieceDefinitions detail prefix="t" roundness={0.8} />
      </svg>,
    );
    const defs = container.querySelectorAll("defs > g[id]");
    expect(defs).toHaveLength(12);
    for (const def of defs) {
      const rim = def.children[0]!;
      expect(rim.tagName).toBe("g");
      expect(rim.getAttribute("stroke")).toBe(rim.getAttribute("fill"));
      expect(rim.querySelectorAll("path").length).toBeGreaterThan(0);
      for (const path of rim.querySelectorAll("path")) {
        expect(path.getAttribute("d")).toMatch(/Z$/);
      }
      for (const stroked of def.querySelectorAll(":scope > :not(:first-child) [stroke]")) {
        expect(stroked.getAttribute("fill")).toBe("none");
      }
    }
  });

  it("stands every piece on a base of its own size, the pawn smallest", () => {
    expect(BASE_RADIUS.p).toBeLessThan(BASE_RADIUS.r);
    expect(BASE_RADIUS.r).toBeLessThan(BASE_RADIUS.k);
    expect(new Set(Object.values(BASE_RADIUS)).size).toBeGreaterThan(3);
  });

  // Regression: the contact shadow used to be offset from the base, which
  // read as the piece standing beside its shadow.
  it("centres the contact shadow under the base", () => {
    const { container } = render(
      <svg>
        <PieceModel
          color="w"
          depth={0}
          id="p"
          impact={0}
          kind="k"
          lift={0}
          opacity={1}
          prefix="t"
          rotation={0}
          scale={1}
          square="e1"
          verticalScale={1}
          x={10}
          y={20}
        />
      </svg>,
    );
    const shadows = container.querySelectorAll("ellipse");
    expect(shadows.length).toBe(2);
    for (const shadow of shadows) {
      expect(shadow.getAttribute("cx")).toBe("0");
      expect(shadow.getAttribute("cy")).toBe("0");
    }
  });
});
