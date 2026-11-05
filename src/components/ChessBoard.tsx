import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

type ChessBoardProps = {
  fen: string;
  flipped: boolean;
  bestMove?: string;
};

function parsePlacement(fen: string): string | undefined {
  const placement = fen.trim().split(/\s+/)[0] ?? "";
  const ranks = placement.split("/");
  if (ranks.length !== 8) return undefined;
  const cells: string[] = [];
  for (const rank of ranks) {
    let count = 0;
    for (const token of rank) {
      if (/^[1-8]$/.test(token)) {
        count += Number(token);
        cells.push(...Array(Number(token)).fill(""));
      } else if (/^[pnbrqkPNBRQK]$/.test(token)) {
        count += 1;
        cells.push(token);
      } else {
        return undefined;
      }
    }
    if (count !== 8) return undefined;
  }
  return cells.length === 64 ? placement : undefined;
}

function IllegalBoard({ fen, flipped, bestMove, reason }: ChessBoardProps & { reason: string }) {
  const placement = parsePlacement(fen);
  if (!placement) {
    return <div className="board-placeholder"><strong>Malformed FEN</strong><span>The piece-placement field cannot be rendered safely.</span></div>;
  }
  const rows = placement.split("/").flatMap((rank) => {
    const cells: string[] = [];
    for (const token of rank) {
      if (/\d/.test(token)) cells.push(...Array(Number(token)).fill(""));
      else cells.push(token);
    }
    return cells;
  });
  const ordered = flipped ? [...rows].reverse() : rows;
  const move = bestMove && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(bestMove) ? bestMove.slice(0, 4).toLowerCase() : undefined;
  return <div className="illegal-board-wrap">
    <div className="illegal-board-warning"><strong>Illegal Board</strong><span>{reason}</span></div>
    <div className="illegal-board" role="grid" aria-label="Detected piece placement, legality warning">
      {ordered.map((piece, index) => <div className={`square ${(Math.floor(index / 8) + index) % 2 === 0 ? "light" : "dark"}`} key={index} role="gridcell"><span className="piece">{piece && ({ K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙", k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" } as Record<string, string>)[piece]}</span></div>)}
      {move && <div className="illegal-move-note">Recommended move: {move}</div>}
    </div>
  </div>;
}

export function ChessBoard({ fen, flipped, bestMove }: ChessBoardProps) {
  try {
    new Chess(fen);
  } catch {
    return <IllegalBoard fen={fen} flipped={flipped} bestMove={bestMove} reason="The piece placement is shown, but chess.js rejected the full position as illegal." />;
  }

  const move = bestMove && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(bestMove)
    ? bestMove.slice(0, 4).toLowerCase()
    : undefined;

  return (
    <Chessboard
      options={{
        position: fen,
        boardOrientation: flipped ? "black" : "white",
        allowDragging: false,
        showNotation: true,
        allowDrawingArrows: false,
        arrows: move ? [{ startSquare: move.slice(0, 2), endSquare: move.slice(2, 4), color: "#f7c948" }] : [],
        boardStyle: { borderRadius: "8px", overflow: "hidden" },
        darkSquareStyle: { backgroundColor: "#70907b" },
        lightSquareStyle: { backgroundColor: "#d8e1d0" },
      }}
    />
  );
}
