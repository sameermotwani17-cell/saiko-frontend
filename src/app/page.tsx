"use client";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Background kanji watermark */}
      <div
        className="absolute select-none pointer-events-none"
        style={{
          fontSize: "320px",
          color: "#E84855",
          opacity: 0.05,
          fontWeight: 900,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          lineHeight: 1,
          userSelect: "none",
        }}
        aria-hidden="true"
      >
        採用
      </div>

      {/* Content */}
      <div className="max-w-2xl text-center relative z-10">

        {/* Logo label */}
        <div className="mb-8">
          <h1 className="text-sm font-semibold tracking-[0.3em] uppercase text-accent mb-6">
            SAIKO
          </h1>
        </div>

        {/* Headline */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
          The AI that thinks like a{" "}
          <span className="text-accent">Japanese HR manager</span>
        </h2>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-primary-text/60 leading-relaxed mb-12 max-w-xl mx-auto">
          Upload your CV. Pick a company. Get interviewed.
          <br />
          Find out what they were really thinking.
        </p>

        {/* CTA Button */}
        <div className="relative inline-block group">
          {/* Pulse ring on hover */}
          <span
            className="absolute inset-0 rounded opacity-0 group-hover:opacity-100 group-hover:animate-pulse_ring"
            style={{ background: "rgba(232,72,85,0.25)", borderRadius: "6px" }}
            aria-hidden="true"
          />
          <Link href="/onboard">
            <button className="relative bg-accent hover:bg-accent/90 text-white font-semibold text-lg px-10 py-4 rounded transition-colors duration-200">
              Start Your Interview
            </button>
          </Link>
        </div>

        {/* Japanese subtitle */}
        <p className="mt-4 text-xs text-accent/50 tracking-widest">
          採用コーチ — used by international students at APU, Japan
        </p>

        {/* Pain point row */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-widest">
          <span style={{ color: "rgba(226,232,240,0.25)" }}>
            Job postings in Japanese you can&apos;t read
          </span>
          <span className="w-1 h-1 rounded-full bg-primary-text/20" />
          <span style={{ color: "rgba(226,232,240,0.25)" }}>
            Interviews you can&apos;t prepare for
          </span>
          <span className="w-1 h-1 rounded-full bg-primary-text/20" />
          <span style={{ color: "rgba(226,232,240,0.25)" }}>
            Rejection with no explanation
          </span>
        </div>

      </div>
    </main>
  );
}
