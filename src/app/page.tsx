"use client";

import { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center relative">
        {/* Japanese watermark */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
          style={{
            fontSize: "280px",
            lineHeight: 1,
            color: "rgba(232, 72, 85, 0.06)",
            fontWeight: 900,
            zIndex: 0,
          }}
          aria-hidden="true"
        >
          採用
        </div>

        <div className="relative z-10">
          <div className="mb-8">
            <h1 className="text-sm font-semibold tracking-[0.3em] uppercase text-accent mb-6">
              SAIKO
            </h1>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
            The AI that thinks like a{" "}
            <span className="text-accent">Japanese HR manager</span>
          </h2>

          <p className="text-lg md:text-xl text-primary-text/60 leading-relaxed mb-12 max-w-xl mx-auto">
            Upload your CV. Pick a company. Get interviewed.
            <br />
            Find out what they were really thinking.
          </p>

          <Link href="/onboard">
            <div
              className="relative inline-block"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Animated pulse ring on hover */}
              {isHovered && (
                <>
                  <span className="absolute inset-0 rounded bg-accent/30 animate-pulse_ring pointer-events-none" />
                  <span
                    className="absolute inset-0 rounded bg-accent/20 animate-pulse_ring pointer-events-none"
                    style={{ animationDelay: "0.4s" }}
                  />
                </>
              )}
              <button className="relative bg-accent hover:bg-accent/90 text-white font-semibold text-lg px-10 py-4 rounded transition-colors duration-200">
                Start Your Interview
              </button>
            </div>
          </Link>

          {/* Tagline below CTA */}
          <p className="mt-4 text-xs text-accent/50">
            採用コーチ — used by international students at APU, Japan
          </p>

          {/* Problem statement row */}
          <div className="mt-16 flex items-center justify-center gap-8 text-xs uppercase tracking-widest" style={{ color: "rgba(226, 232, 240, 0.25)" }}>
            <span>Job postings in Japanese you can&apos;t read</span>
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "rgba(226, 232, 240, 0.2)" }} />
            <span>Interviews you can&apos;t prepare for</span>
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "rgba(226, 232, 240, 0.2)" }} />
            <span>Rejection with no explanation</span>
          </div>
        </div>
      </div>
    </main>
  );
}