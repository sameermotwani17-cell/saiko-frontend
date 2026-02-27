"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── TYPES ────────────────────────────────────────────────────────
interface CVData {
  full_name: string;
  university: string;
  major: string;
  nationality: string;
  key_skills: string[];
  work_experience: string[];
  target_industry: string;
}

interface Company {
  id: string;
  name: string;
  kanji: string;
  personality: string;
  note: string;
}

// ─── DATA ─────────────────────────────────────────────────────────
const COMPANIES: Company[] = [
  {
    id: "rakuten",
    name: "Rakuten",
    kanji: "楽天",
    personality: "Global-hybrid. English welcomed.",
    note: "Must align with CEO Mikitani's principles",
  },
  {
    id: "toyota",
    name: "Toyota",
    kanji: "トヨタ",
    personality: "Most traditional. Kaizen-first.",
    note: "Lifetime commitment expected",
  },
  {
    id: "sony",
    name: "Sony",
    kanji: "ソニー",
    personality: "Creative meets formal.",
    note: "Innovation framed within team contribution",
  },
  {
    id: "softbank",
    name: "SoftBank",
    kanji: "ソフトバンク",
    personality: "Ambitious. Bold answers tolerated.",
    note: "Still requires visible humility",
  },
  {
    id: "uniqlo",
    name: "Uniqlo",
    kanji: "ユニクロ",
    personality: "Operational obsession.",
    note: "Full commitment signals required",
  },
];

// ─── STEP WRAPPER ─────────────────────────────────────────────────
function StepWrapper({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-6"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}

// ─── STEP INDICATOR ───────────────────────────────────────────────
function StepDots({ current }: { current: number }) {
  return (
    <div className="flex gap-2 mb-12">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: i === current ? "24px" : "6px",
            height: "6px",
            borderRadius: "3px",
            backgroundColor: i === current ? "#E84855" : "#1E2A3A",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  // Step 1 state
  const [file, setFile] = useState<File | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 state
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // Step 3 state
  const [languageMode, setLanguageMode] = useState<string | null>(null);

  // ── Transitions ──────────────────────────────────────────────
  const goToStep = (next: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setStep(next);
      setTransitioning(false);
    }, 500);
  };

  // ── CV Upload ────────────────────────────────────────────────
  const handleFile = async (f: File) => {
    if (!f || f.type !== "application/pdf") {
      setUploadError("Please upload a PDF file.");
      return;
    }
    setFile(f);
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", f);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/cv`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data: CVData = await res.json();
      setCvData(data);
    } catch {
      // Fallback for demo — mock CV data if backend not ready
      setCvData({
        full_name: f.name.replace(".pdf", ""),
        university: "Ritsumeikan Asia Pacific University",
        major: "International Management",
        nationality: "International",
        key_skills: ["Communication", "Project Management", "AI Literacy"],
        work_experience: [],
        target_industry: "General",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // ── Final submit ─────────────────────────────────────────────
  const handleStart = async () => {
    if (!cvData || !selectedCompany || !languageMode) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: selectedCompany,
          cv_data: cvData,
          language_mode: languageMode,
        }),
      });
      if (res.ok) {
        const { session_id } = await res.json();
        sessionStorage.setItem("saiko_session_id", session_id);
        sessionStorage.setItem("saiko_company", selectedCompany);
        sessionStorage.setItem("saiko_language_mode", languageMode);
        sessionStorage.setItem("saiko_cv_data", JSON.stringify(cvData));
      }
    } catch {
      // Continue to interview even if session creation fails
      // Backend will handle gracefully
    }

    router.push("/interview");
  };

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: "#0A0A0F" }}
    >
      {/* Step dots — always visible */}
      <div className="absolute top-8 left-0 right-0 flex justify-center z-20">
        <StepDots current={step} />
      </div>

      {/* ── STEP 1 — CV Upload ──────────────────────────────────── */}
      <StepWrapper visible={step === 0 && !transitioning}>
        <div className="max-w-lg w-full text-center">
          <p className="text-xs text-accent tracking-[0.3em] uppercase mb-4">
            Step 1 of 3
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-primary-text">
            Upload your CV
          </h2>
          <p className="text-primary-text/40 text-sm mb-10">
            We&apos;ll extract your background so the interview feels personal.
          </p>

          {/* Drop zone */}
          {!cvData ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${isDragging ? "#E84855" : "#1E2A3A"}`,
                borderRadius: "8px",
                padding: "48px 32px",
                cursor: "pointer",
                transition: "border-color 0.2s ease",
                backgroundColor: isDragging
                  ? "rgba(232,72,85,0.04)"
                  : "transparent",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      border: "2px solid #1E2A3A",
                      borderTop: "2px solid #E84855",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <p className="text-primary-text/40 text-sm">
                    Reading your CV...
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-4xl mb-4" aria-hidden="true">
                    📄
                  </div>
                  <p className="text-primary-text/60 text-sm">
                    Drag & drop your PDF here
                  </p>
                  <p className="text-primary-text/30 text-xs mt-2">
                    or click to browse
                  </p>
                </>
              )}
            </div>
          ) : (
            // CV confirmed view
            <div
              style={{
                border: "1px solid #1E2A3A",
                borderLeft: "3px solid #E84855",
                borderRadius: "8px",
                padding: "24px",
                textAlign: "left",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-accent text-xs tracking-widest uppercase">
                  CV Detected
                </p>
                <button
                  onClick={() => {
                    setCvData(null);
                    setFile(null);
                  }}
                  className="text-primary-text/30 text-xs hover:text-primary-text/60 transition-colors"
                >
                  Change
                </button>
              </div>
              <p className="text-primary-text font-semibold text-lg mb-1">
                {cvData.full_name}
              </p>
              <p className="text-primary-text/50 text-sm mb-1">
                {cvData.university} — {cvData.major}
              </p>
              <p className="text-primary-text/30 text-xs">
                {cvData.key_skills.slice(0, 3).join(" · ")}
              </p>
            </div>
          )}

          {uploadError && (
            <p className="text-accent text-xs mt-3">{uploadError}</p>
          )}

          <button
            onClick={() => goToStep(1)}
            disabled={!cvData}
            style={{
              marginTop: "32px",
              width: "100%",
              padding: "14px",
              backgroundColor: cvData ? "#E84855" : "#1E2A3A",
              color: cvData ? "#fff" : "#64748B",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "15px",
              cursor: cvData ? "pointer" : "not-allowed",
              transition: "background-color 0.2s ease",
            }}
          >
            Continue →
          </button>
        </div>
      </StepWrapper>

      {/* ── STEP 2 — Company Selector ────────────────────────────── */}
      <StepWrapper visible={step === 1 && !transitioning}>
        <div className="max-w-2xl w-full text-center">
          <p className="text-xs text-accent tracking-[0.3em] uppercase mb-4">
            Step 2 of 3
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-primary-text">
            Which company?
          </h2>
          <p className="text-primary-text/40 text-sm mb-10">
            Each company interviews differently. We&apos;ll adapt the questions
            and scoring.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {COMPANIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCompany(c.id)}
                style={{
                  padding: "20px 24px",
                  textAlign: "left",
                  border: `1px solid ${selectedCompany === c.id ? "#E84855" : "#1E2A3A"}`,
                  borderRadius: "8px",
                  backgroundColor:
                    selectedCompany === c.id
                      ? "rgba(232,72,85,0.06)"
                      : "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Background kanji */}
                <span
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "48px",
                    opacity: 0.06,
                    color: "#E84855",
                    fontWeight: 900,
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                  aria-hidden="true"
                >
                  {c.kanji}
                </span>

                <p
                  style={{
                    color:
                      selectedCompany === c.id ? "#E84855" : "#E2E8F0",
                    fontWeight: 700,
                    fontSize: "16px",
                    marginBottom: "4px",
                  }}
                >
                  {c.name}
                </p>
                <p
                  style={{
                    color: "#64748B",
                    fontSize: "12px",
                    marginBottom: "4px",
                  }}
                >
                  {c.personality}
                </p>
                <p
                  style={{
                    color: "rgba(226,232,240,0.25)",
                    fontSize: "11px",
                  }}
                >
                  {c.note}
                </p>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => goToStep(0)}
              style={{
                flex: 1,
                padding: "14px",
                backgroundColor: "transparent",
                color: "#64748B",
                border: "1px solid #1E2A3A",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
            <button
              onClick={() => goToStep(2)}
              disabled={!selectedCompany}
              style={{
                flex: 2,
                padding: "14px",
                backgroundColor: selectedCompany ? "#E84855" : "#1E2A3A",
                color: selectedCompany ? "#fff" : "#64748B",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "15px",
                cursor: selectedCompany ? "pointer" : "not-allowed",
                transition: "background-color 0.2s ease",
              }}
            >
              Continue →
            </button>
          </div>
        </div>
      </StepWrapper>

      {/* ── STEP 3 — Language Mode ───────────────────────────────── */}
      <StepWrapper visible={step === 2 && !transitioning}>
        <div className="max-w-lg w-full text-center">
          <p className="text-xs text-accent tracking-[0.3em] uppercase mb-4">
            Step 3 of 3
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-primary-text">
            Does this role require Japanese?
          </h2>
          <p className="text-primary-text/40 text-sm mb-10">
            This changes how the interview is conducted.
          </p>

          <div className="flex flex-col gap-4 mb-8">
            {/* Option 1 — Japanese required */}
            <button
              onClick={() => setLanguageMode("japanese")}
              style={{
                padding: "28px 28px",
                textAlign: "left",
                border: `1px solid ${languageMode === "japanese" ? "#E84855" : "#1E2A3A"}`,
                borderRadius: "8px",
                backgroundColor:
                  languageMode === "japanese"
                    ? "rgba(232,72,85,0.06)"
                    : "transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div className="flex items-start gap-4">
                <span style={{ fontSize: "28px" }}>🇯🇵</span>
                <div>
                  <p
                    style={{
                      color:
                        languageMode === "japanese" ? "#E84855" : "#E2E8F0",
                      fontWeight: 700,
                      fontSize: "16px",
                      marginBottom: "6px",
                      textAlign: "left",
                    }}
                  >
                    Yes — this role requires Japanese
                  </p>
                  <p
                    style={{
                      color: "#64748B",
                      fontSize: "13px",
                      textAlign: "left",
                    }}
                  >
                    Interview conducted in formal Japanese keigo. English
                    subtitles shown in real time.
                  </p>
                </div>
              </div>
            </button>

            {/* Option 2 — English friendly */}
            <button
              onClick={() => setLanguageMode("english_formal")}
              style={{
                padding: "28px 28px",
                textAlign: "left",
                border: `1px solid ${languageMode === "english_formal" ? "#E84855" : "#1E2A3A"}`,
                borderRadius: "8px",
                backgroundColor:
                  languageMode === "english_formal"
                    ? "rgba(232,72,85,0.06)"
                    : "transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div className="flex items-start gap-4">
                <span style={{ fontSize: "28px" }}>🌐</span>
                <div>
                  <p
                    style={{
                      color:
                        languageMode === "english_formal"
                          ? "#E84855"
                          : "#E2E8F0",
                      fontWeight: 700,
                      fontSize: "16px",
                      marginBottom: "6px",
                      textAlign: "left",
                    }}
                  >
                    No — this role is English-friendly
                  </p>
                  <p
                    style={{
                      color: "#64748B",
                      fontSize: "13px",
                      textAlign: "left",
                    }}
                  >
                    Interview in formal English with Japanese HR phrasing and
                    scoring standards applied.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Ready state — shows candidate summary before starting */}
          {languageMode && cvData && selectedCompany && (
            <div
              style={{
                border: "1px solid #1E2A3A",
                borderRadius: "8px",
                padding: "16px 20px",
                marginBottom: "20px",
                textAlign: "left",
              }}
            >
              <p className="text-xs text-primary-text/30 uppercase tracking-widest mb-3">
                Interview Summary
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-primary-text/50">Candidate</span>
                <span className="text-primary-text font-medium">
                  {cvData.full_name}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-primary-text/50">Company</span>
                <span className="text-primary-text font-medium">
                  {COMPANIES.find((c) => c.id === selectedCompany)?.name}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-primary-text/50">Language</span>
                <span className="text-primary-text font-medium">
                  {languageMode === "japanese"
                    ? "Japanese + EN subtitles"
                    : "Formal English"}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => goToStep(1)}
              style={{
                flex: 1,
                padding: "14px",
                backgroundColor: "transparent",
                color: "#64748B",
                border: "1px solid #1E2A3A",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleStart}
              disabled={!languageMode}
              style={{
                flex: 2,
                padding: "14px",
                backgroundColor: languageMode ? "#E84855" : "#1E2A3A",
                color: languageMode ? "#fff" : "#64748B",
                border: "none",
                borderRadius: "6px",
                fontWeight: 700,
                fontSize: "15px",
                cursor: languageMode ? "pointer" : "not-allowed",
                transition: "background-color 0.2s ease",
                letterSpacing: "0.05em",
              }}
            >
              I&apos;m Ready →
            </button>
          </div>

          <p className="text-primary-text/20 text-xs mt-4">
            The interview begins immediately when you click.
          </p>
        </div>
      </StepWrapper>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
