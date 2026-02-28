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

interface LanguageMode {
  id: string;
  label: string;
  sublabel: string;
  interview_lang: "japanese" | "english";
  subtitle_lang: "japanese" | "english";
  flag: string;
  description: string;
}

interface SessionDuration {
  minutes: number;
  label: string;
  sublabel: string;
  description: string;
}

// ─── DATA ─────────────────────────────────────────────────────────
const COMPANIES: Company[] = [
  { id: "rakuten", name: "Rakuten", kanji: "楽天", personality: "Global-hybrid. English welcomed.", note: "Must align with CEO Mikitani's principles" },
  { id: "toyota", name: "Toyota", kanji: "トヨタ", personality: "Most traditional. Kaizen-first.", note: "Lifetime commitment expected" },
  { id: "sony", name: "Sony", kanji: "ソニー", personality: "Creative meets formal.", note: "Innovation framed within team contribution" },
  { id: "softbank", name: "SoftBank", kanji: "ソフトバンク", personality: "Ambitious. Bold answers tolerated.", note: "Still requires visible humility" },
  { id: "uniqlo", name: "Uniqlo", kanji: "ユニクロ", personality: "Operational obsession.", note: "Full commitment signals required" },
];

const LANGUAGE_MODES: LanguageMode[] = [
  {
    id: "jp_jp",
    label: "Japanese",
    sublabel: "with Japanese subtitles",
    interview_lang: "japanese",
    subtitle_lang: "japanese",
    flag: "🇯🇵",
    description: "Full Japanese interview. Subtitles in Japanese. Maximum immersion — for advanced learners.",
  },
  {
    id: "jp_en",
    label: "Japanese",
    sublabel: "with English subtitles",
    interview_lang: "japanese",
    subtitle_lang: "english",
    flag: "🇯🇵",
    description: "Interview conducted in Japanese keigo. English translation shown below each line so you can follow along.",
  },
  {
    id: "en_jp",
    label: "English",
    sublabel: "with Japanese subtitles",
    interview_lang: "english",
    subtitle_lang: "japanese",
    flag: "🌐",
    description: "Interview in formal English HR tone. Japanese translation shown below — learn how your answers translate culturally.",
  },
  {
    id: "en_en",
    label: "English",
    sublabel: "with English subtitles",
    interview_lang: "english",
    subtitle_lang: "english",
    flag: "🌐",
    description: "Full English interview with formal Japanese HR scoring standards applied. No Japanese text shown.",
  },
];

const SESSION_DURATIONS: SessionDuration[] = [
  { minutes: 5, label: "5 min", sublabel: "Quick", description: "~3–4 questions. Demo or quick warm-up." },
  { minutes: 10, label: "10 min", sublabel: "Standard", description: "~5–7 questions. Good first practice." },
  { minutes: 15, label: "15 min", sublabel: "Extended", description: "~8–10 questions. Recommended for most users." },
  { minutes: 20, label: "20 min", sublabel: "Deep", description: "~11–14 questions. Thorough practice session." },
  { minutes: 30, label: "30 min", sublabel: "Thorough", description: "~16–20 questions. Full category rotation." },
  { minutes: 45, label: "45 min", sublabel: "Full Sim", description: "~24–30 questions. Near-complete coverage." },
  { minutes: 60, label: "60 min", sublabel: "Marathon", description: "~32–40 questions. Full question bank." },
];

// ─── STEP WRAPPER ─────────────────────────────────────────────────
function StepWrapper({ visible, children }: { visible: boolean; children: React.ReactNode }) {
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

// ─── STEP DOTS ────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2 mb-12">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? "24px" : "6px",
            height: "6px",
            borderRadius: "3px",
            backgroundColor: i === current ? "#E84855" : i < current ? "#2E75C8" : "#1E2A3A",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// ─── BUTTON HELPERS ───────────────────────────────────────────────
function PrimaryBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "14px",
        backgroundColor: disabled ? "#1E2A3A" : "#E84855",
        color: disabled ? "#64748B" : "#fff",
        border: "none", borderRadius: "6px",
        fontWeight: 700, fontSize: "15px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background-color 0.2s ease",
        letterSpacing: "0.03em",
      }}
    >
      {children}
    </button>
  );
}

function SecondaryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: "14px",
        backgroundColor: "transparent",
        color: "#64748B", border: "1px solid #1E2A3A",
        borderRadius: "6px", fontWeight: 600, fontSize: "15px",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const TOTAL_STEPS = 5;

  // Step 1 — CV
  const [file, setFile] = useState<File | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 — Company
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // Step 3 — Role language
  const [roleRequiresJapanese, setRoleRequiresJapanese] = useState<boolean | null>(null);

  // Step 4 — Language mode
  const [selectedLanguageMode, setSelectedLanguageMode] = useState<string | null>(null);

  // Step 5 — Duration
  const [selectedDuration, setSelectedDuration] = useState<number>(15);

  // ── Transition ────────────────────────────────────────────────
  const goToStep = (next: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => { setStep(next); setTransitioning(false); }, 500);
  };

  // ── CV Upload ─────────────────────────────────────────────────
  const handleFile = async (f: File) => {
    if (!f || f.type !== "application/pdf") { setUploadError("Please upload a PDF file."); return; }
    setFile(f);
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", f);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/cv`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data: CVData = await res.json();
      setCvData(data);
    } catch {
      setCvData({
        full_name: f.name.replace(".pdf", ""),
        university: "Ritsumeikan Asia Pacific University",
        major: "International Management",
        nationality: "International",
        key_skills: ["Communication", "Project Management", "AI Literacy"],
        work_experience: [],
        target_industry: "General",
      });
    } finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // ── Final start ───────────────────────────────────────────────
  const handleStart = async () => {
    if (!cvData || !selectedCompany || !selectedLanguageMode || !selectedDuration) return;
    const mode = LANGUAGE_MODES.find((m) => m.id === selectedLanguageMode)!;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: selectedCompany,
          cv_data: cvData,
          language_mode: selectedLanguageMode,
          session_duration_minutes: selectedDuration,
        }),
      });
      if (res.ok) {
        const { session_id } = await res.json();
        sessionStorage.setItem("saiko_session_id", session_id);
      }
    } catch { /* continue with mock */ }
    sessionStorage.setItem("saiko_company", selectedCompany);
    sessionStorage.setItem("saiko_language_mode", selectedLanguageMode);
    sessionStorage.setItem("saiko_interview_lang", mode.interview_lang);
    sessionStorage.setItem("saiko_subtitle_lang", mode.subtitle_lang);
    sessionStorage.setItem("saiko_cv_data", JSON.stringify(cvData));
    sessionStorage.setItem("saiko_session_duration", String(selectedDuration));
    router.push("/interview");
  };

  // ── Filtered language modes ───────────────────────────────────
  const filteredModes = roleRequiresJapanese === true
    ? LANGUAGE_MODES.filter((m) => m.interview_lang === "japanese")
    : roleRequiresJapanese === false
    ? LANGUAGE_MODES.filter((m) => m.interview_lang === "english")
    : LANGUAGE_MODES;

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <main className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "#0A0A0F" }}>

      {/* Step dots */}
      <div className="absolute top-8 left-0 right-0 flex justify-center z-20">
        <StepDots current={step} total={TOTAL_STEPS} />
      </div>

      {/* ── STEP 1 — CV Upload ──────────────────────────────────── */}
      <StepWrapper visible={step === 0 && !transitioning}>
        <div className="max-w-lg w-full text-center">
          <p style={{ color: "#E84855", fontSize: "11px", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "16px" }}>Step 1 of {TOTAL_STEPS}</p>
          <h2 style={{ color: "#E2E8F0", fontSize: "36px", fontWeight: 700, marginBottom: "8px" }}>Upload your CV</h2>
          <p style={{ color: "rgba(226,232,240,0.40)", fontSize: "14px", marginBottom: "36px" }}>We&apos;ll extract your background so the interview feels personal.</p>

          {!cvData ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${isDragging ? "#E84855" : "#1E2A3A"}`,
                borderRadius: "8px", padding: "48px 32px", cursor: "pointer",
                transition: "border-color 0.2s ease",
                backgroundColor: isDragging ? "rgba(232,72,85,0.04)" : "transparent",
              }}
            >
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div style={{ width: "32px", height: "32px", border: "2px solid #1E2A3A", borderTop: "2px solid #E84855", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <p style={{ color: "rgba(226,232,240,0.40)", fontSize: "14px" }}>Reading your CV...</p>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: "40px", marginBottom: "16px" }}>📄</div>
                  <p style={{ color: "rgba(226,232,240,0.60)", fontSize: "14px" }}>Drag & drop your PDF here</p>
                  <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "12px", marginTop: "6px" }}>or click to browse</p>
                </>
              )}
            </div>
          ) : (
            <div style={{ border: "1px solid #1E2A3A", borderLeft: "3px solid #E84855", borderRadius: "8px", padding: "24px", textAlign: "left" }}>
              <div className="flex items-center justify-between mb-4">
                <p style={{ color: "#E84855", fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>CV Detected</p>
                <button onClick={() => { setCvData(null); setFile(null); }} style={{ color: "rgba(226,232,240,0.30)", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>Change</button>
              </div>
              <p style={{ color: "#E2E8F0", fontWeight: 700, fontSize: "17px", marginBottom: "4px" }}>{cvData.full_name}</p>
              <p style={{ color: "rgba(226,232,240,0.50)", fontSize: "13px", marginBottom: "4px" }}>{cvData.university} — {cvData.major}</p>
              <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "12px" }}>{cvData.key_skills.slice(0, 3).join(" · ")}</p>
            </div>
          )}

          {uploadError && <p style={{ color: "#E84855", fontSize: "12px", marginTop: "12px" }}>{uploadError}</p>}
          <div style={{ marginTop: "28px" }}>
            <PrimaryBtn onClick={() => goToStep(1)} disabled={!cvData}>Continue →</PrimaryBtn>
          </div>
        </div>
      </StepWrapper>

      {/* ── STEP 2 — Company ────────────────────────────────────── */}
      <StepWrapper visible={step === 1 && !transitioning}>
        <div className="max-w-2xl w-full text-center">
          <p style={{ color: "#E84855", fontSize: "11px", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "16px" }}>Step 2 of {TOTAL_STEPS}</p>
          <h2 style={{ color: "#E2E8F0", fontSize: "36px", fontWeight: 700, marginBottom: "8px" }}>Which company?</h2>
          <p style={{ color: "rgba(226,232,240,0.40)", fontSize: "14px", marginBottom: "32px" }}>Each company interviews differently. We&apos;ll adapt the questions and scoring.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {COMPANIES.map((c) => (
              <button key={c.id} onClick={() => setSelectedCompany(c.id)} style={{
                padding: "20px 24px", textAlign: "left",
                border: `1px solid ${selectedCompany === c.id ? "#E84855" : "#1E2A3A"}`,
                borderRadius: "8px",
                backgroundColor: selectedCompany === c.id ? "rgba(232,72,85,0.06)" : "transparent",
                cursor: "pointer", transition: "all 0.2s ease", position: "relative", overflow: "hidden",
              }}>
                <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "44px", opacity: 0.06, color: "#E84855", fontWeight: 900, pointerEvents: "none", userSelect: "none" }} aria-hidden="true">{c.kanji}</span>
                <p style={{ color: selectedCompany === c.id ? "#E84855" : "#E2E8F0", fontWeight: 700, fontSize: "15px", marginBottom: "3px" }}>{c.name}</p>
                <p style={{ color: "#64748B", fontSize: "12px", marginBottom: "3px" }}>{c.personality}</p>
                <p style={{ color: "rgba(226,232,240,0.22)", fontSize: "11px" }}>{c.note}</p>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div style={{ flex: 1 }}><SecondaryBtn onClick={() => goToStep(0)}>← Back</SecondaryBtn></div>
            <div style={{ flex: 2 }}><PrimaryBtn onClick={() => goToStep(2)} disabled={!selectedCompany}>Continue →</PrimaryBtn></div>
          </div>
        </div>
      </StepWrapper>

      {/* ── STEP 3 — Does the role require Japanese? ─────────────── */}
      <StepWrapper visible={step === 2 && !transitioning}>
        <div className="max-w-lg w-full text-center">
          <p style={{ color: "#E84855", fontSize: "11px", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "16px" }}>Step 3 of {TOTAL_STEPS}</p>
          <h2 style={{ color: "#E2E8F0", fontSize: "36px", fontWeight: 700, marginBottom: "8px" }}>Does this role require Japanese?</h2>
          <p style={{ color: "rgba(226,232,240,0.40)", fontSize: "14px", marginBottom: "32px" }}>This helps us suggest the right interview language for you.</p>

          <div className="flex flex-col gap-4 mb-6">
            {[
              { val: true, emoji: "🇯🇵", label: "Yes — Japanese is required", desc: "The job posting requires Japanese proficiency. We will suggest Japanese interview modes." },
              { val: false, emoji: "🌐", label: "No — English is fine for this role", desc: "The position does not require Japanese. We will suggest English interview modes." },
            ].map(({ val, emoji, label, desc }) => (
              <button key={String(val)} onClick={() => setRoleRequiresJapanese(val)} style={{
                padding: "24px", textAlign: "left",
                border: `1px solid ${roleRequiresJapanese === val ? "#E84855" : "#1E2A3A"}`,
                borderRadius: "8px",
                backgroundColor: roleRequiresJapanese === val ? "rgba(232,72,85,0.06)" : "transparent",
                cursor: "pointer", transition: "all 0.2s ease",
              }}>
                <div className="flex items-start gap-4">
                  <span style={{ fontSize: "28px" }}>{emoji}</span>
                  <div>
                    <p style={{ color: roleRequiresJapanese === val ? "#E84855" : "#E2E8F0", fontWeight: 700, fontSize: "15px", marginBottom: "6px", textAlign: "left" }}>{label}</p>
                    <p style={{ color: "#64748B", fontSize: "13px", textAlign: "left" }}>{desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div style={{ flex: 1 }}><SecondaryBtn onClick={() => goToStep(1)}>← Back</SecondaryBtn></div>
            <div style={{ flex: 2 }}><PrimaryBtn onClick={() => goToStep(3)} disabled={roleRequiresJapanese === null}>Continue →</PrimaryBtn></div>
          </div>
        </div>
      </StepWrapper>

      {/* ── STEP 4 — Language Mode ───────────────────────────────── */}
      <StepWrapper visible={step === 3 && !transitioning}>
        <div className="max-w-xl w-full text-center">
          <p style={{ color: "#E84855", fontSize: "11px", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "16px" }}>Step 4 of {TOTAL_STEPS}</p>
          <h2 style={{ color: "#E2E8F0", fontSize: "36px", fontWeight: 700, marginBottom: "8px" }}>Choose your interview mode</h2>
          <p style={{ color: "rgba(226,232,240,0.40)", fontSize: "14px", marginBottom: "32px" }}>
            {roleRequiresJapanese ? "Showing Japanese interview modes based on your selection." : "Showing English interview modes based on your selection."}
            {" "}
            <button onClick={() => goToStep(2)} style={{ color: "#2E75C8", background: "none", border: "none", cursor: "pointer", fontSize: "13px", textDecoration: "underline" }}>Change</button>
          </p>

          <div className="flex flex-col gap-3 mb-6">
            {filteredModes.map((mode) => (
              <button key={mode.id} onClick={() => setSelectedLanguageMode(mode.id)} style={{
                padding: "20px 24px", textAlign: "left",
                border: `1px solid ${selectedLanguageMode === mode.id ? "#E84855" : "#1E2A3A"}`,
                borderRadius: "8px",
                backgroundColor: selectedLanguageMode === mode.id ? "rgba(232,72,85,0.06)" : "transparent",
                cursor: "pointer", transition: "all 0.2s ease",
              }}>
                <div className="flex items-center gap-4">
                  <span style={{ fontSize: "26px" }}>{mode.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-baseline gap-2">
                      <p style={{ color: selectedLanguageMode === mode.id ? "#E84855" : "#E2E8F0", fontWeight: 700, fontSize: "15px" }}>{mode.label}</p>
                      <p style={{ color: "#64748B", fontSize: "13px" }}>{mode.sublabel}</p>
                    </div>
                    <p style={{ color: "rgba(226,232,240,0.35)", fontSize: "12px", marginTop: "4px" }}>{mode.description}</p>
                  </div>
                  {selectedLanguageMode === mode.id && (
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#E84855", flexShrink: 0 }} />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div style={{ flex: 1 }}><SecondaryBtn onClick={() => goToStep(2)}>← Back</SecondaryBtn></div>
            <div style={{ flex: 2 }}><PrimaryBtn onClick={() => goToStep(4)} disabled={!selectedLanguageMode}>Continue →</PrimaryBtn></div>
          </div>
        </div>
      </StepWrapper>

      {/* ── STEP 5 — Session Duration ────────────────────────────── */}
      <StepWrapper visible={step === 4 && !transitioning}>
        <div className="max-w-2xl w-full text-center">
          <p style={{ color: "#E84855", fontSize: "11px", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "16px" }}>Step 5 of {TOTAL_STEPS}</p>
          <h2 style={{ color: "#E2E8F0", fontSize: "36px", fontWeight: 700, marginBottom: "8px" }}>How long do you want to practice?</h2>
          <p style={{ color: "rgba(226,232,240,0.40)", fontSize: "14px", marginBottom: "32px" }}>The interview runs continuously until time is up. More time = more questions from different categories.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {SESSION_DURATIONS.map((d) => (
              <button
                key={d.minutes}
                onClick={() => setSelectedDuration(d.minutes)}
                style={{
                  padding: "20px 16px",
                  textAlign: "center",
                  border: `1px solid ${selectedDuration === d.minutes ? "#E84855" : "#1E2A3A"}`,
                  borderRadius: "8px",
                  backgroundColor: selectedDuration === d.minutes ? "rgba(232,72,85,0.06)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
              >
                <p style={{
                  color: selectedDuration === d.minutes ? "#E84855" : "#E2E8F0",
                  fontWeight: 800,
                  fontSize: "22px",
                  marginBottom: "4px",
                  letterSpacing: "-0.02em",
                }}>
                  {d.label}
                </p>
                <p style={{
                  color: selectedDuration === d.minutes ? "#E84855" : "#64748B",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}>
                  {d.sublabel}
                </p>
                {selectedDuration === d.minutes && (
                  <div style={{
                    position: "absolute", top: "8px", right: "8px",
                    width: "6px", height: "6px", borderRadius: "50%",
                    backgroundColor: "#E84855",
                  }} />
                )}
              </button>
            ))}
          </div>

          {/* Description for selected duration */}
          <p style={{ color: "rgba(226,232,240,0.35)", fontSize: "13px", marginBottom: "24px", minHeight: "20px" }}>
            {SESSION_DURATIONS.find((d) => d.minutes === selectedDuration)?.description || ""}
          </p>

          {/* Summary card */}
          {selectedLanguageMode && cvData && selectedCompany && (
            <div style={{ border: "1px solid #1E2A3A", borderRadius: "8px", padding: "16px 20px", marginBottom: "20px", textAlign: "left" }}>
              <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "12px" }}>Interview Summary</p>
              {[
                ["Candidate", cvData.full_name],
                ["Company", COMPANIES.find((c) => c.id === selectedCompany)?.name || ""],
                ["Mode", LANGUAGE_MODES.find((m) => m.id === selectedLanguageMode)?.label + " " + LANGUAGE_MODES.find((m) => m.id === selectedLanguageMode)?.sublabel],
                ["Duration", `${selectedDuration} minutes`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between" style={{ marginBottom: "6px" }}>
                  <span style={{ color: "rgba(226,232,240,0.40)", fontSize: "13px" }}>{label}</span>
                  <span style={{ color: "#E2E8F0", fontSize: "13px", fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <div style={{ flex: 1 }}><SecondaryBtn onClick={() => goToStep(3)}>← Back</SecondaryBtn></div>
            <div style={{ flex: 2 }}>
              <button
                onClick={handleStart}
                disabled={!selectedDuration}
                style={{
                  width: "100%", padding: "14px",
                  backgroundColor: selectedDuration ? "#E84855" : "#1E2A3A",
                  color: selectedDuration ? "#fff" : "#64748B",
                  border: "none", borderRadius: "6px", fontWeight: 700, fontSize: "15px",
                  cursor: selectedDuration ? "pointer" : "not-allowed",
                  letterSpacing: "0.05em",
                }}
              >
                I&apos;m Ready →
              </button>
            </div>
          </div>
          <p style={{ color: "rgba(226,232,240,0.18)", fontSize: "11px", marginTop: "12px" }}>The interview begins immediately when you click.</p>
        </div>
      </StepWrapper>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
