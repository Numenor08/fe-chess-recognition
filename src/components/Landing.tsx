import { Link } from "react-router-dom";
import { ChessBoard } from "./ChessBoard";
import { Navigation } from "./Navigation";

const HERO_FEN = "2r1nbk1/5p1p/p5p1/1N2Q3/q3P3/6Pb/2P2P1P/1R2N1K1 w - - 0 33";

export default function Landing() {
  return (
    <div className="landing">
      <Navigation />
      <main className="hero">
        <div className="hero-copy">
          <p className="eyebrow">COMPUTER VISION / CHESS RESEARCH</p>
          <h1>
            From a board image
            <br />
            <i>to a position</i> you can explore.
          </h1>
          <p className="hero-text">
            A research prototype that turns real-world chess positions into
            structured FEN notation using image recognition and engine analysis.
          </p>
          <Link className="flex h-11 items-center justify-center rounded-lg bg-emerald-900 px-6 text-xs font-semibold text-white transition-colors hover:bg-emerald-950" to="/workspace">
            Analyze a position <span>→</span>
          </Link>
          <p className="hero-note">
            Powered by U-Net segmentation · YOLO26 detection · FEN generation
          </p>
        </div>
        <div className="hero-art">
          <div className="art-glow" />
          <div className="hero-board">
            <ChessBoard fen={HERO_FEN} flipped={false} />
          </div>
          <div className="art-label">
            <span>POSITION RECOGNITION</span>
            <b>8 × 8</b>
          </div>
        </div>
      </main>
      <section className="workflow">
        <p className="eyebrow">THE WORKFLOW</p>
        <div>
          {[
            ["Upload image", "↑", "Provide a clear board photo"],
            ["Recognize board", "⌗", "Segment and detect pieces"],
            ["Generate FEN", "≡", "Build a six-field notation"],
            ["Analyze position", "✦", "Review engine insights"],
          ].map(([step, icon, description], i) => (
            <article key={step}>
              <b>0{i + 1}</b>
              <span>{icon}</span>
              <strong>{step}</strong>
              <small>{description}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
