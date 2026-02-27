"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center">
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
          <button className="bg-accent hover:bg-accent/90 text-white font-semibold text-lg px-10 py-4 rounded transition-colors duration-200">
            Start Your Interview
          </button>
        </Link>

        <div className="mt-16 flex items-center justify-center gap-8 text-xs text-primary-text/30 uppercase tracking-widest">
          <span>5 HR Dimensions</span>
          <span className="w-1 h-1 rounded-full bg-primary-text/20" />
          <span>Real Scoring</span>
          <span className="w-1 h-1 rounded-full bg-primary-text/20" />
          <span>Honest Debrief</span>
        </div>
      </div>
    </main>
  );
}