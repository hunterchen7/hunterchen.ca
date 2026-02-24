// Messages from main thread to worker
export type WorkerRequest =
  | { type: 'init'; modelUrl: string }
  | { type: 'getBestMove'; fen: string; history: string[]; legalMoves: string[]; temperature: number }
  | { type: 'mctsSearch'; fen: string; history: string[]; nodeLimit: number; temperature: number }

// Messages from worker to main thread
export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'initProgress'; progress: number; message: string }
  | { type: 'initError'; error: string }
  | {
      type: 'bestMove'
      move: string
      confidence: number
      wdl: [number, number, number]
      topMoves?: { move: string; visits: number; probability: number }[]
    }
  | { type: 'error'; error: string }

// Engine state visible to the UI
export interface EngineState {
  isReady: boolean
  isThinking: boolean
  isLoading: boolean
  loadingProgress: number
  loadingMessage: string
  lastMove: string | null
  lastConfidence: number | null
  wdl: [number, number, number] | null
  topMoves: { move: string; visits: number; probability: number }[] | null
  error: string | null
}
