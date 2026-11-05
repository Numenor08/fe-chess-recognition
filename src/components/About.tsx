import { Navigation } from "./Navigation";

export default function About() {
  return (
    <div className="app-shell">
      <Navigation />
      <main className="mx-auto max-w-[950px] px-7 py-20 max-[700px]:px-5 max-[700px]:py-[50px]">
        <p className="eyebrow">ABOUT THE PROJECT</p>
        <h1 className="m-0 text-[38px] font-semibold tracking-[-0.04em] text-[#17201d] max-[700px]:text-[32px]">
          Making chess positions
          <br />
          <i className="text-[#73936e] not-italic">machine-readable.</i>
        </h1>
        <p className="my-7 mb-11 max-w-[650px] text-xl leading-normal text-[#5d7067]">
          FEN Lab is an thesis prototype for exploring how computer
          vision can help people move from a physical chessboard to digital
          analysis.
        </p>
        <div className="grid grid-cols-3 gap-4 max-[700px]:grid-cols-1">
          <article className="rounded-[14px] border border-[#dce4de] bg-white p-6">
            <span className="text-[11px] text-[#85a47a]">01</span>
            <h2 className="my-7 mb-2 text-[17px]">U-Net segmentation</h2>
            <p className="leading-1.6 text-xs text-[#718079]">
              The backend uses board segmentation to isolate the chessboard from
              its surroundings before the position is interpreted.
            </p>
          </article>
          <article className="rounded-[14px] border border-[#dce4de] bg-white p-6">
            <span className="text-[11px] text-[#85a47a]">02</span>
            <h2 className="my-7 mb-2 text-[17px]">YOLO26 detection</h2>
            <p className="leading-1.6 text-xs text-[#718079]">
              Piece detection identifies the visual objects on the board. The
              browser only presents the backend&apos;s result; it does not run
              machine learning locally.
            </p>
          </article>
          <article className="rounded-[14px] border border-[#dce4de] bg-white p-6">
            <span className="text-[11px] text-[#85a47a]">03</span>
            <h2 className="my-7 mb-2 text-[17px]">FEN notation</h2>
            <p className="leading-1.6 text-xs text-[#718079]">
              Forsyth–Edwards Notation describes a position in a compact,
              portable six-field string that chess software can understand.
            </p>
          </article>
        </div>
        <div className="mt-7 rounded-[14px] border border-dashed border-[#dbeab8] bg-lime-50 p-9 text-[13px] text-[#567052]">
          Recognition quality depends on image clarity, board visibility,
          lighting, and piece appearance. This interface makes no accuracy or
          performance claims beyond the responses provided by the backend.
        </div>
      </main>
    </div>
  );
}
