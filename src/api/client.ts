const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export type RecognizeOptions = {
  image: File;
  activeColor: string;
  viewFrom: "auto" | "white" | "black" | "left" | "right";
  castlingRights: string;
  enPassantSquare: string;
  halfmoveClock: string;
  fullmoveNumber: string;
  debug: boolean;
};

export type AnalyzeFenOptions = {
  fen: string;
  depth: number;
  showVariations: number;
};

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, details: unknown) {
    super(`Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function readResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new Error("Unable to reach the backend. Check VITE_API_BASE_URL and CORS settings.");
  }

  const body = await readResponse(response);
  if (!response.ok) {
    throw new ApiError(response.status, body);
  }
  return body;
}

export function checkHealth(): Promise<unknown> {
  return request("/health");
}

export function recognizePosition(options: RecognizeOptions): Promise<unknown> {
  if (!["auto", "white", "black", "left", "right"].includes(options.viewFrom)) {
    throw new Error("Invalid view_from value.");
  }
  const form = new FormData();
  form.append("image", options.image);
  form.append("active_color", options.activeColor);
  form.append("view_from", options.viewFrom);
  if (options.castlingRights) form.append("castling_rights", options.castlingRights);
  if (options.enPassantSquare) form.append("en_passant_square", options.enPassantSquare);
  if (options.halfmoveClock) form.append("halfmove_clock", options.halfmoveClock);
  if (options.fullmoveNumber) form.append("fullmove_number", options.fullmoveNumber);
  form.append("debug", String(options.debug));
  return request("/recognize", { method: "POST", body: form });
}

export function analyzeFen(options: AnalyzeFenOptions): Promise<unknown> {
  return request("/analyze-fen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fen: options.fen,
      depth: options.depth,
      show_variations: options.showVariations,
    }),
  });
}

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError && typeof error.details === "object" && error.details !== null) {
    const detail = (error.details as { detail?: Array<{ msg?: string }> }).detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((item) => item.msg ?? "Validation error").join(". ");
    }
    return `Backend rejected the request (${error.status}).`;
  }
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}
