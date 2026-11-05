import { useEffect, useState } from "react";
import { analyzeFen, formatApiError, recognizePosition } from "../api/client";
import { ChessBoard } from "./ChessBoard";
import { Chess } from "chess.js";
import { Navigation } from "./Navigation";
import { PipelineDebugPanel } from "./PipelineDebugPanel";
import { ResponsePreview } from "./ResponsePreview";
import { Field, PanelTitle } from "./ui";

const DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const VALID_VIEW_FROM = ["auto", "white", "black", "left", "right"] as const;
function isViewFrom(value: string): value is (typeof VALID_VIEW_FROM)[number] {
  return (VALID_VIEW_FROM as readonly string[]).includes(value);
}

function parseFen(fen: string) {
  return fen.trim().split(/\s+/);
}

function responseObject(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function responseString(value: unknown, keys: string[]): string | undefined {
  const object = responseObject(value);
  for (const key of keys) {
    if (typeof object?.[key] === "string") return object[key] as string;
  }
  return undefined;
}

function responseValue(value: unknown, keys: string[]): unknown {
  const object = responseObject(value);
  return keys.map((key) => object?.[key]).find((item) => item !== undefined);
}

function debugImageFromResponse(value: unknown): string | undefined {
  const image = responseString(value, ["debug_image_base64"]);
  return image &&
    /^data:image\/(?:jpeg|png|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
      image,
    )
    ? image
    : undefined;
}

type Evaluation = { label: string; pawns?: number; mate?: number };

function evaluationFromValue(value: unknown): Evaluation | undefined {
  if (typeof value === "number")
    return { label: value.toFixed(2), pawns: value };
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed)
      ? { label: parsed.toFixed(2), pawns: parsed }
      : { label: value };
  }
  const object = responseObject(value);
  if (typeof object?.mate === "number")
    return {
      label: `${object.mate < 0 ? "-M" : "M"}${Math.abs(object.mate)}`,
      mate: object.mate,
    };
  if (typeof object?.cp === "number" || typeof object?.cp === "string") {
    const cp = Number(object.cp);
    if (Number.isFinite(cp)) {
      const pawns = cp / 100;
      return { label: `${pawns > 0 ? "+" : ""}${pawns.toFixed(2)}`, pawns };
    }
  }
  return undefined;
}

function findEvaluation(value: unknown): Evaluation | undefined {
  const direct = evaluationFromValue(value);
  if (direct) return direct;
  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findEvaluation(item);
      if (nested) return nested;
    }
    return undefined;
  }
  const object = responseObject(value);
  if (!object) return undefined;
  const priorityKeys = [
    "score",
    "evaluation",
    "eval",
    "result",
    "analysis",
    "data",
  ];
  for (const key of priorityKeys) {
    const nested = findEvaluation(object[key]);
    if (nested) return nested;
  }
  for (const nestedValue of Object.values(object)) {
    const nested = findEvaluation(nestedValue);
    if (nested) return nested;
  }
  return undefined;
}

function stockfishEvaluation(value: unknown): Evaluation | undefined {
  const stockfish = responseObject(value)?.stockfish;
  const score = responseObject(stockfish)?.score;
  return evaluationFromValue(score);
}

function scoreLabel(value: unknown): string | undefined {
  return findEvaluation(value)?.label;
}

function variationsFromResponse(
  value: unknown,
): Array<{ move: string; score?: string; pv?: string }> {
  const stockfish = responseObject(value)?.stockfish;
  const raw = responseValue(stockfish ?? value, [
    "top_moves",
    "variations",
    "candidates",
    "lines",
  ]);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (typeof item === "string") return [{ move: item }];
    const object = responseObject(item);
    const move = responseString(item, ["move", "best_move", "bestMove"]);
    return move
      ? [
          {
            move,
            score: scoreLabel(
              object?.score ?? object?.evaluation ?? object?.cp,
            ),
            pv: typeof object?.pv === "string" ? object.pv : undefined,
          },
        ]
      : [];
  });
}

function validFen(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    new Chess(value);
    return value;
  } catch {
    return undefined;
  }
}

function hasFenSyntax(value: string | undefined): value is string {
  if (!value || value.trim().split(/\s+/).length !== 6) return false;
  const ranks = value.trim().split(/\s+/)[0]?.split("/") ?? [];
  return (
    ranks.length === 8 &&
    ranks.every((rank) => {
      let count = 0;
      for (const token of rank)
        count += /^[1-8]$/.test(token)
          ? Number(token)
          : /^[pnbrqkPNBRQK]$/.test(token)
            ? 1
            : 99;
      return count === 8;
    })
  );
}

function isFenLegal(value: string): boolean {
  try {
    new Chess(value);
    return true;
  } catch {
    return false;
  }
}

function Workspace() {
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState("");
  const [dragging, setDragging] = useState(false);
  const [activeColor, setActiveColor] = useState("w");
  const [viewFrom, setViewFrom] = useState<
    "auto" | "white" | "black" | "left" | "right"
  >("auto");
  const [castlingRights, setCastlingRights] = useState("");
  const [enPassantSquare, setEnPassantSquare] = useState("");
  const [halfmoveClock, setHalfmoveClock] = useState("");
  const [fullmoveNumber, setFullmoveNumber] = useState("");
  const [depth, setDepth] = useState(12);
  const [variations, setVariations] = useState(3);
  const [debug, setDebug] = useState(false);
  const [busy, setBusy] = useState(false);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rawResponse, setRawResponse] = useState<unknown>();
  const [analysisResponse, setAnalysisResponse] = useState<unknown>();
  const [debugImage, setDebugImage] = useState<string>();
  const [debugImageError, setDebugImageError] = useState("");
  const [fen, setFen] = useState(DEFAULT_FEN);
  const [fenInput, setFenInput] = useState("");
  const [bestMove, setBestMove] = useState("");
  const [flipped, setFlipped] = useState(false);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const setSelectedFile = (selected?: File) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (selected.size > 15 * 1024 * 1024) {
      setError("Image must be 15 MB or smaller.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError("");
    setNotice("");
  };

  const evaluation =
    analysisResponse === undefined
      ? undefined
      : (stockfishEvaluation(analysisResponse) ??
        findEvaluation(analysisResponse));
  const score = evaluation?.label;
  const variationsFromApi = variationsFromResponse(analysisResponse);
  const runRecognition = async () => {
    if (!file) {
      setError("Upload a chessboard image first.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    setRawResponse(undefined);
    setDebugImage(undefined);
    setDebugImageError("");
    try {
      const result = await recognizePosition({
        image: file,
        activeColor,
        viewFrom,
        castlingRights,
        enPassantSquare,
        halfmoveClock,
        fullmoveNumber,
        debug,
      });
      setRawResponse(result);
      const returnedDebugImage = debugImageFromResponse(result);
      setDebugImage(returnedDebugImage);
      setDebugImageError(
        debug && !returnedDebugImage
          ? "The response did not include a valid debug_image_base64 image."
          : "",
      );
      setAnalysisResponse(undefined);
      const returnedFen = responseString(result, ["fen", "FEN"]);
      if (hasFenSyntax(returnedFen)) {
        setFen(returnedFen);
        setFenInput(returnedFen);
      }
      setBestMove("");
      setNotice(
        hasFenSyntax(returnedFen)
          ? isFenLegal(returnedFen)
            ? "Position extracted. Click Analyze to request engine analysis."
            : "Position extracted, but the board is illegal. The detected placement remains visible; engine analysis is disabled."
          : "Recognition completed, but the response did not expose a renderable FEN field in the documented contract.",
      );
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setBusy(false);
    }
  };

  const runFenAnalysis = async () => {
    if (!fenInput.trim()) {
      setError("Enter a FEN before starting engine analysis.");
      return;
    }
    setAnalysisBusy(true);
    setError("");
    setNotice("");
    try {
      const currentFen = validFen(fenInput.trim());
      if (!currentFen) {
        setError("Engine analysis requires a legal chess position.");
        return;
      }
      const result = await analyzeFen({
        fen: currentFen,
        depth,
        showVariations: variations,
      });
      setRawResponse(result);
      setAnalysisResponse(result);
      setFen(currentFen);
      const stockfish = responseObject(result)?.stockfish;
      setBestMove(
        responseString(stockfish, ["best_move", "bestMove", "move"]) ??
          responseString(result, ["best_move", "bestMove", "move"]) ??
          "",
      );
      setNotice(
        "Analysis completed. Best-move visualization is shown only when the runtime response includes a valid coordinate move.",
      );
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setAnalysisBusy(false);
    }
  };

  const showFen = () => {
    const currentFen = fenInput.trim();
    if (!hasFenSyntax(currentFen)) {
      setError(
        "Enter a syntactically valid six-field FEN to preview the board.",
      );
      return;
    }
    setFen(currentFen);
    setError("");
    setBestMove("");
    setAnalysisResponse(undefined);
    setNotice(
      isFenLegal(currentFen)
        ? "FEN preview loaded locally. Click Analyze to request the backend analysis."
        : "Illegal Board: the FEN is renderable but engine analysis is unavailable.",
    );
  };

  const copyFen = async () => {
    if (!fen) return;
    try {
      await navigator.clipboard.writeText(fen);
      setNotice("FEN copied to clipboard.");
    } catch {
      setError("Clipboard access failed. Copy the FEN manually.");
    }
  };

  return (
    <div className="app-shell">
      <Navigation />
      <main className="mx-auto max-w-330 px-7 pt-[58px] pb-20 max-[700px]:px-4 max-[700px]:py-[35px]">
          <section className="mb-[34px] flex items-end justify-between max-[700px]:block">
            <div>
              <p className="eyebrow">IMAGE TO INSIGHT / 01</p>
              <h1 className="leading-1.05 m-0 text-[38px] font-semibold tracking-[-0.04em] text-[#17201d] max-[700px]:text-[32px]">Analyze a chess position</h1>
              <p className="text-sm text-[#718079]">
                Upload a board image and let the recognition pipeline extract a
                position for analysis.
              </p>
            </div>
            <div className="rounded-full border border-[#dce4de] px-4 py-2.5 text-[10px] tracking-[0.12em] text-[#315d49] max-[700px]:mt-4 max-[700px]:inline-block">
              U-NET <span>×</span> YOLO26
            </div>
          </section>
          {error && <div className="mt-[-10px] mb-5 rounded-lg bg-[#fff0ef] px-4 py-3 text-xs text-[#9b4b48]">{error}</div>}
          {notice && <div className="mt-[-10px] mb-5 rounded-lg bg-[#eef8e7] px-4 py-3 text-xs text-[#4b754e]">{notice}</div>}
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 xl:grid-cols-12">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg xl:col-span-4">
              <PanelTitle
                number="01"
                title="Input & recognition"
                subtitle="Configure the image pipeline"
              />
              <label
                className={`relative flex min-h-[174px] flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-[1.5px] border-dashed text-center text-[#718079] ${dragging ? "border-[#315d49] bg-[#eff8d9]" : "border-[#bfd0c4] bg-[#f9fbf8]"}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  setSelectedFile(event.dataTransfer.files[0]);
                }}
              >
                {preview ? (
                  <img className="h-[174px] w-full object-cover" src={preview} alt="Selected chessboard preview" />
                ) : (
                  <>
                    <span className="text-[26px] leading-none text-[#315d49]">↑</span>
                    <strong className="text-xs text-[#17201d]">Drop your board image here</strong>
                    <span className="text-[10px]">or click to browse · JPG, PNG, WEBP</span>
                  </>
                )}
                <input
                  className="absolute inset-0 cursor-pointer opacity-0"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setSelectedFile(event.target.files?.[0])}
                />
              </label>
              {file && (
                <div className="flex items-center gap-2.5 border-b border-[#dce4de] py-3">
                  <span className="text-[#315d49]">◈</span>
                  <div className="flex-1">
                    <strong className="block text-[11px]">{file.name}</strong>
                    <small className="mt-0.5 block text-[11px] text-[#718079]">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </small>
                  </div>
                  <button className="text-[11px] text-[#a36868]"
                    onClick={() => {
                      setFile(undefined);
                      setPreview("");
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Active side">
                  <select
                    value={activeColor}
                    onChange={(e) => setActiveColor(e.target.value)}
                  >
                    <option value="w">White to move</option>
                    <option value="b">Black to move</option>
                  </select>
                </Field>
                <Field label="View from (White Perspective)">
                  <select
                    value={viewFrom}
                    onChange={(e) => {
                      if (isViewFrom(e.target.value))
                        setViewFrom(e.target.value);
                    }}
                  >
                    {VALID_VIEW_FROM.map((option) => (
                      <option value={option} key={option}>
                        {option === "auto" ? "Auto detect" : `From ${option}`}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <details className="mt-4 border-t border-[#dce4de] pt-4">
                <summary className="cursor-pointer text-[11px] font-semibold">Advanced recognition parameters</summary>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Castling rights" hint="Optional">
                    <input
                      value={castlingRights}
                      onChange={(e) => setCastlingRights(e.target.value)}
                      placeholder="KQkq"
                    />
                  </Field>
                  <Field label="En passant" hint="Optional">
                    <input
                      value={enPassantSquare}
                      onChange={(e) => setEnPassantSquare(e.target.value)}
                      placeholder="e3"
                    />
                  </Field>
                  <Field label="Halfmove clock" hint="Optional">
                    <input
                      value={halfmoveClock}
                      onChange={(e) => setHalfmoveClock(e.target.value)}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Fullmove number" hint="Optional">
                    <input
                      value={fullmoveNumber}
                      onChange={(e) => setFullmoveNumber(e.target.value)}
                      placeholder="1"
                    />
                  </Field>
                </div>
              </details>
              <label className="my-[18px] flex items-center gap-2 text-[11px]">
                <input
                  type="checkbox"
                  checked={debug}
                  onChange={(e) => setDebug(e.target.checked)}
                />{" "}
                Include pipeline debug data
              </label>
              <button
                className="flex h-11 w-full items-center justify-center rounded-lg bg-emerald-900 text-xs font-semibold text-white transition-colors hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-55"
                onClick={runRecognition}
                disabled={busy}
              >
                {busy ? "Processing image…" : "Extract position  →"}
              </button>
              <button
                className="mt-3 block text-xs text-red-900"
                onClick={() => {
                  setFile(undefined);
                  setPreview("");
                  setFen(DEFAULT_FEN);
                  setFenInput("");
                  setRawResponse(undefined);
                  setAnalysisResponse(undefined);
                  setDebugImage(undefined);
                  setDebugImageError("");
                  setBestMove("");
                  setError("");
                  setNotice("");
                }}
              >
                Reset workspace
              </button>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg xl:col-span-5">
              <PanelTitle
                number="02"
                title="Position board"
                subtitle={
                  rawResponse === undefined
                    ? "Default starting position — not a recognition result"
                    : "Position loaded from the backend"
                }
              />
              <div className="board-stage">
                <EvaluationBar evaluation={evaluation} flipped={flipped} />
                <div className="board-wrap">
                  <ChessBoard fen={fen} flipped={flipped} bestMove={bestMove} />
                </div>
              </div>
              <div className="flex justify-between px-0 pt-3 pb-1">
                <button onClick={() => setFlipped(!flipped)}>
                  ↔ Flip board
                </button>
                <button
                  onClick={() => {
                    setFen(DEFAULT_FEN);
                    setBestMove("");
                    setAnalysisResponse(undefined);
                  }}
                >
                  Reset board
                </button>
              </div>
              <div className="mt-5 border-t border-[#dce4de] pt-4">
                <label>
                  Preview a complete FEN{" "}
                  <input
                    value={fenInput}
                    onChange={(e) => setFenInput(e.target.value)}
                    placeholder="Paste FEN to validate locally"
                  />
                </label>
                <div className="flex gap-2">
                  <button className="flex-1 rounded-lg px-1 py-2 text-xs transition-colors bg-[#73936e] hover:brightness-80 font-semibold text-white" onClick={showFen}>
                    Preview FEN
                  </button>
                  <button
                    className="flex h-11 flex-1 items-center justify-center rounded-lg bg-emerald-900 text-xs font-semibold text-white transition-colors hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-55"
                    onClick={runFenAnalysis}
                    disabled={analysisBusy || !fen || !isFenLegal(fen)}
                  >
                    {analysisBusy ? "Analyzing…" : "Analyze"}
                  </button>
                </div>
              </div>
            </section>
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg lg:col-span-2 xl:col-span-3">
              <PanelTitle
                number="03"
                title="Position analysis"
                subtitle="Explicitly triggered via POST /analyze-fen"
              />
              {rawResponse === undefined ? (
                <div className="flex h-80 flex-col items-center justify-center rounded-xl border border-dashed border-[#dce4de] p-5 text-center">
                  <span>✦</span>
                  <strong>Waiting for analysis</strong>
                  <p>
                    Recognize an image, then click Analyze to request engine
                    results.
                  </p>
                </div>
              ) : (
                <ResponsePreview response={rawResponse}/>
              )}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Search depth">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={depth}
                    onChange={(e) =>
                      setDepth(
                        Math.min(30, Math.max(1, Number(e.target.value))),
                      )
                    }
                  />
                </Field>
                <Field label="Variations">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={variations}
                    onChange={(e) =>
                      setVariations(
                        Math.min(5, Math.max(1, Number(e.target.value))),
                      )
                    }
                  />
                </Field>
              </div>
              <div className="mt-4 border-t border-[#dce4de] pt-3">
                <strong className="block text-[13px]">
                  {score ? `Evaluation ${score}` : "Evaluation unavailable"}
                </strong>
                <small className="mt-1 block text-[10px] text-[#718079]">
                  {score
                    ? "Shown from the runtime response"
                    : "Not defined in the current OpenAPI response schema"}
                </small>
              </div>
              <div className="mt-4 border-t border-[#dce4de] pt-3">
                <strong className="mb-2 block text-[11px]">Engine variations</strong>
                {variationsFromApi.length ? (
                  variationsFromApi.slice(0, 5).map((line, index) => (
                    <button
                      className="grid w-full grid-cols-[36px_1fr_auto] items-center gap-1.5 border-t border-[#edf1ed] py-2 text-left"
                      key={`${line.move}-${index}`}
                      onClick={() => setBestMove(line.move)}
                    >
                      <span className="text-[8px] text-[#769578]">{index === 0 ? "BEST" : `#${index + 1}`}</span>
                      <b className="text-[11px]">{line.move}</b>
                      <small className="truncate text-[9px] text-[#718079]">
                        {line.score ?? "Score unavailable"}
                        {line.pv ? ` · ${line.pv}` : ""}
                      </small>
                    </button>
                  ))
                ) : (
                  <small className="text-[10px] text-[#718079]">No candidate variations were returned.</small>
                )}
              </div>
              <div className="mt-[18px] border-t border-[#dce4de] pt-4">
                <div className="flex items-center justify-between text-[9px] font-bold tracking-[0.13em] text-[#82938a]">
                  <span>FEN OUTPUT</span>
                  <button className="text-[10px] font-normal tracking-normal text-[#315d49]" onClick={copyFen} disabled={!fen}>
                    Copy FEN
                  </button>
                </div>
                <code className="mt-2 block rounded-md bg-[#f5f7f4] p-2.5 text-[10px] break-all whitespace-pre-wrap text-[#17201d]">
                  {fen ||
                    "No FEN available from the documented response schema."}
                </code>
                {fen && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {parseFen(fen).map((field, index) => (
                      <span className="overflow-hidden text-[10px] text-ellipsis" key={field + index}>
                        <small className="mb-0.5 block text-[8px] text-[#93a198]">
                          {
                            [
                              "Placement",
                              "Side",
                              "Castling",
                              "En passant",
                              "Halfmove",
                              "Fullmove",
                            ][index]
                          }
                        </small>
                        {field}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
          <PipelineDebugPanel
            busy={busy}
            debug={debug}
            debugImage={debugImage}
            debugImageError={debugImageError}
            onDebugChange={setDebug}
          />
      </main>
    </div>
  );
}

function EvaluationBar({
  evaluation,
  flipped,
}: {
  evaluation?: Evaluation;
  flipped: boolean;
}) {
  const numeric = evaluation?.pawns ?? Number.NaN;
  const whiteShare = Number.isFinite(numeric)
    ? 50 + Math.tanh(numeric / 4) * 45
    : evaluation?.mate !== undefined
      ? evaluation.mate > 0
        ? 95
        : 5
      : 50;
  const label = evaluation?.label;
  const barStyle = evaluation
    ? {
        background: flipped
          ? `linear-gradient(to bottom, #f6f7f4 0 ${whiteShare}%, #3b4b44 ${whiteShare}% 100%)`
          : `linear-gradient(to bottom, #3b4b44 0 ${100 - whiteShare}%, #f6f7f4 ${100 - whiteShare}% 100%)`,
      }
    : undefined;
  return (
    <div
      className={`evaluation-bar ${evaluation ? "has-evaluation" : "pending"}`}
      style={barStyle}
      aria-label={label ? `Evaluation ${label}` : "Analysis not run"}
    >
      <b>{label ?? "—"}</b>
    </div>
  );
}

export default Workspace;
