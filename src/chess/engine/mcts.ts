import { Chess } from "chess.js";
import { encodeFenHistory } from "./encoding";
import { runInference } from "./inference";
import { POLICY_INDEX_MAP } from "./policyIndex";
import { flipUci } from "./encoding";

const CPUCT = 2.5;

interface MCTSNode {
  move: string | null;
  parent: MCTSNode | null;
  children: Map<string, MCTSNode>;
  visits: number;
  totalValue: number;
  prior: number;
  expanded: boolean;
  terminal: boolean;
  terminalValue: number;
}

function createNode(
  move: string | null,
  parent: MCTSNode | null,
  prior: number,
): MCTSNode {
  return {
    move,
    parent,
    children: new Map(),
    visits: 0,
    totalValue: 0,
    prior,
    expanded: false,
    terminal: false,
    terminalValue: 0,
  };
}

function qValue(node: MCTSNode): number {
  if (node.visits === 0) return 0;
  return node.totalValue / node.visits;
}

function selectChild(node: MCTSNode): MCTSNode {
  const sqrtParent = Math.sqrt(node.visits);
  let best: MCTSNode | null = null;
  let bestScore = -Infinity;

  for (const child of node.children.values()) {
    const q = -qValue(child); // negate: child Q is from opponent's perspective
    const u = (CPUCT * child.prior * sqrtParent) / (1 + child.visits);
    const score = q + u;
    if (score > bestScore) {
      bestScore = score;
      best = child;
    }
  }

  return best!;
}

function getPriors(
  policy: Float32Array,
  legalMoves: string[],
  isBlack: boolean,
): Map<string, number> {
  const moveLogits: { move: string; logit: number }[] = [];

  for (const uci of legalMoves) {
    const canonical = isBlack ? flipUci(uci) : uci;
    let index = POLICY_INDEX_MAP.get(canonical);
    if (index === undefined && canonical.endsWith("n")) {
      index = POLICY_INDEX_MAP.get(canonical.slice(0, 4));
    }
    if (index === undefined) continue;
    moveLogits.push({ move: uci, logit: policy[index]! });
  }

  // Softmax (temperature=1)
  const maxLogit = Math.max(...moveLogits.map((m) => m.logit));
  const exps = moveLogits.map((m) => Math.exp(m.logit - maxLogit));
  const sumExp = exps.reduce((a, b) => a + b, 0);

  const priors = new Map<string, number>();
  for (let i = 0; i < moveLogits.length; i++) {
    priors.set(moveLogits[i]!.move, exps[i]! / sumExp);
  }
  return priors;
}

async function expandNode(
  node: MCTSNode,
  game: Chess,
  gameHistory: string[],
): Promise<{ value: number; wdl: [number, number, number] }> {
  // Check terminal
  if (game.isGameOver()) {
    node.terminal = true;
    node.expanded = true;
    if (game.isCheckmate()) {
      node.terminalValue = -1; // loss for side to move
    } else {
      node.terminalValue = 0; // draw
    }
    return {
      value: node.terminalValue,
      wdl: game.isCheckmate() ? [0, 0, 1] : [0, 1, 0],
    };
  }

  const fen = game.fen();
  const isBlack = fen.split(" ")[1] === "b";
  const legalMoves = game.moves({ verbose: true }).map((m) => {
    let uci = m.from + m.to;
    if (m.promotion) uci += m.promotion;
    return uci;
  });

  const inputTensor = encodeFenHistory(gameHistory);
  const { policy, wdl, value } = await runInference(inputTensor);

  const priors = getPriors(policy, legalMoves, isBlack);
  for (const [move, prior] of priors) {
    node.children.set(move, createNode(move, node, prior));
  }

  node.expanded = true;

  // Value is from the perspective of the side to move: positive = good for them
  // Lc0 WDL is [win, draw, loss] from side-to-move perspective
  const nodeValue = wdl[0] - wdl[2]; // win - loss, range [-1, 1]
  return { value: nodeValue, wdl };
}

function backpropagate(node: MCTSNode, value: number) {
  let current: MCTSNode | null = node;
  let v = value;
  while (current) {
    current.visits += 1;
    current.totalValue += v;
    v = -v; // flip perspective at each level
    current = current.parent;
  }
}

export interface TopMove {
  move: string;
  visits: number;
  probability: number;
}

export interface MCTSResult {
  bestMove: string;
  visits: number;
  wdl: [number, number, number];
  topMoves: TopMove[];
}

export async function mctsSearch(
  fen: string,
  history: string[],
  nodeLimit: number,
  temperature: number,
): Promise<MCTSResult> {
  const root = createNode(null, null, 0);
  const rootGame = new Chess(fen);

  // Expand root
  const rootResult = await expandNode(root, rootGame, history);
  backpropagate(root, rootResult.value);

  if (root.children.size === 0) {
    throw new Error("No legal moves");
  }

  // Single legal move — no need to search
  if (root.children.size === 1) {
    const [move] = root.children.keys();
    return {
      bestMove: move!,
      visits: 1,
      wdl: rootResult.wdl,
      topMoves: [{ move: move!, visits: 1, probability: 1 }],
    };
  }

  // MCTS iterations
  for (let i = 1; i < nodeLimit; i++) {
    // Clone game and history for this iteration
    const game = new Chess(fen);
    const gameHistory = [...history];

    // SELECT: walk tree to a leaf
    let node = root;
    while (node.expanded && !node.terminal && node.children.size > 0) {
      node = selectChild(node);
      game.move(uciToMove(node.move!));
      gameHistory.push(game.fen());
    }

    // Terminal node — backpropagate its known value
    if (node.terminal) {
      backpropagate(node, node.terminalValue);
      continue;
    }

    // EXPAND & EVALUATE
    const result = await expandNode(node, game, gameHistory);

    // BACKPROPAGATE
    backpropagate(node, result.value);
  }

  // Select move from visit counts
  const children = [...root.children.entries()];

  let bestMove: string;
  if (temperature === 0) {
    // Greedy: pick most visited
    children.sort((a, b) => b[1].visits - a[1].visits);
    bestMove = children[0]![0];
  } else {
    // Sample proportionally to visits^(1/temperature)
    const weights = children.map(([, child]) =>
      Math.pow(child.visits, 1 / temperature),
    );
    const sumWeights = weights.reduce((a, b) => a + b, 0);
    const rand = Math.random() * sumWeights;
    let cumulative = 0;
    bestMove = children[children.length - 1]![0];
    for (let i = 0; i < children.length; i++) {
      cumulative += weights[i]!;
      if (rand <= cumulative) {
        bestMove = children[i]![0];
        break;
      }
    }
  }

  // Compute top moves with temperature-adjusted probabilities
  const exp = temperature > 0 ? 1 / temperature : Infinity;
  const weights = children.map(([, c]) =>
    temperature > 0 ? Math.pow(c.visits, exp) : c.visits > 0 ? 0 : 0,
  );
  // For temperature=0, give all weight to the max-visit move
  if (temperature === 0) {
    let maxVisits = 0;
    let maxIdx = 0;
    for (let i = 0; i < children.length; i++) {
      if (children[i]![1].visits > maxVisits) {
        maxVisits = children[i]![1].visits;
        maxIdx = i;
      }
    }
    weights.fill(0);
    weights[maxIdx] = 1;
  }
  const sumWeights = weights.reduce((a, b) => a + b, 0);
  const topMoves: TopMove[] = children
    .map(([move, child], i) => ({
      move,
      visits: child.visits,
      probability: sumWeights > 0 ? weights[i]! / sumWeights : 0,
    }))
    .sort((a, b) => b.probability - a.probability)
    .filter((m) => m.probability > 0);

  // Aggregate WDL from root's children weighted by visits
  const totalVisits = root.visits - 1; // exclude root's own expansion visit
  const wdl: [number, number, number] = [0, 0, 0];
  for (const [, child] of root.children) {
    if (child.visits === 0) continue;
    const childQ = child.totalValue / child.visits;
    const w = (1 + childQ) / 2; // convert [-1,1] to [0,1] — but this is opponent's perspective
    // Child value is negated (opponent's view), so flip: our win = opponent's loss
    const weight = child.visits / totalVisits;
    wdl[0] += (1 - w) * weight; // our win prob
    wdl[2] += w * weight; // our loss prob
  }
  wdl[1] = Math.max(0, 1 - wdl[0] - wdl[2]);

  return { bestMove, visits: root.visits, wdl, topMoves };
}

function uciToMove(uci: string): {
  from: string;
  to: string;
  promotion?: string;
} {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  };
}
