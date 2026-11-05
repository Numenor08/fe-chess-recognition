import { useState } from "react";

type PipelineDebugPanelProps = {
  busy: boolean;
  debug: boolean;
  debugImage?: string;
  debugImageError: string;
  onDebugChange: (enabled: boolean) => void;
};

export function PipelineDebugPanel({
  busy,
  debug,
  debugImage,
  debugImageError,
  onDebugChange,
}: PipelineDebugPanelProps) {
  const [enlarged, setEnlarged] = useState(false);

  return (
    <>
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <details open>
          <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-3">
              <b className="text-xs text-slate-400">04</b>
              <strong className="text-sm">Pipeline debugging</strong>
              <small className="text-xs font-normal text-gray-500">
                Inspect artifacts returned by the backend
              </small>
            </span>
            <em className="text-xs text-emerald-800 not-italic">Open panel⌃</em>
          </summary>
          <div className="px-2 pt-5 text-sm">
            <p className="text-xs text-gray-500">
              Enable debug data before recognition to inspect the image returned by the pipeline.
            </p>
            <label className="my-4 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={debug}
                onChange={(event) => onDebugChange(event.target.checked)}
                className="accent-emerald-800"
              />
              Enable debug data on the next recognition request
            </label>
            {busy && <DebugState>Processing debug image…</DebugState>}
            {!busy && !debugImage && !debugImageError && (
              <DebugState>
                {debug
                  ? "Run recognition to generate a debug image."
                  : "Enable debug data and run recognition to view the pipeline image."}
              </DebugState>
            )}
            {!busy && debugImageError && (
              <DebugState error>{debugImageError}</DebugState>
            )}
            {debugImage && (
              <article className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2.5 flex items-start justify-between gap-3">
                  <div>
                    <strong className="block text-xs">Recognition debug image</strong>
                    <small className="mt-0.5 block text-xs text-gray-500">
                      debug_image_base64 · JPEG
                    </small>
                  </div>
                  <button
                    className="text-xs text-emerald-800"
                    onClick={() => setEnlarged(true)}
                  >
                    Enlarge
                  </button>
                </div>
                <button
                  className="block w-full overflow-hidden rounded-lg bg-slate-100 p-0"
                  onClick={() => setEnlarged(true)}
                >
                  <img
                    className="block max-h-75 w-full object-contain"
                    src={debugImage}
                    alt="Recognition pipeline debug output"
                  />
                </button>
              </article>
            )}
          </div>
        </details>
      </section>
      {enlarged && debugImage && (
        <div
          className="fixed inset-0 z-10 grid place-items-center bg-slate-900/80 p-7"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged recognition debug image"
          onClick={() => setEnlarged(false)}
        >
          <div
            className="relative max-h-screen max-w-full rounded-xl bg-white p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="absolute -top-3 -right-3 size-8 rounded-full bg-white text-2xl leading-none text-slate-900 shadow-md"
              onClick={() => setEnlarged(false)}
              aria-label="Close enlarged image"
            >
              ×
            </button>
            <img
              className="block max-h-screen max-w-full object-contain"
              src={debugImage}
              alt="Enlarged recognition pipeline debug output"
            />
          </div>
        </div>
      )}
    </>
  );
}

function DebugState({
  children,
  error = false,
}: {
  children: string;
  error?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-dashed p-6 text-center text-xs ${
        error
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-slate-200 text-gray-500"
      }`}
    >
      {children}
    </div>
  );
}
