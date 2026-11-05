export function ResponsePreview({
  response,
}: {
  bestMove?: string;
  response: unknown;
}) {
  const responseText = JSON.stringify(response, null, 2);

  return (
    <div className="raw-result min-h-48">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="result-badge">BACKEND RESPONSE</span>
        <small className="text-xs text-gray-500">JSON</small>
      </div>
      <pre className="max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-left text-xs leading-relaxed wrap-break-word whitespace-pre-wrap">
        {responseText ?? "Unable to serialize the backend response."}
      </pre>
    </div>
  );
}
