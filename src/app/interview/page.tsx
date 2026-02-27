"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── TYPES ────────────────────────────────────────────────────────
type InterviewStatus =
  | "waiting"
  | "recording"
  | "processing"
  | "speaking"
  | "complete";

interface VoiceResponse {
  response_text: string;
  audio_base64: string;
  interview_complete: boolean;
  subtitle_jp?: string;
  subtitle_en?: string;
}

// ─── HELPERS ──────────────────────────────────────────────────────
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function playAudioFromBase64(base64: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audio.onended = resolve;
    audio.play().catch(resolve);
  });
}

// ─── STATUS LABEL ─────────────────────────────────────────────────
function StatusLabel({ status }: { status: InterviewStatus }) {
  const labels: Record<InterviewStatus, { text: string; color: string }> = {
    waiting: { text: "YOUR TURN — Hold to speak", color: "#64748B" },
    recording: { text: "RECORDING", color: "#E84855" },
    processing: { text: "PROCESSING", color: "#2E75C8" },
    speaking: { text: "INTERVIEWER SPEAKING", color: "#2E75C8" },
    complete: { text: "INTERVIEW COMPLETE", color: "#64748B" },
  };
  const { text, color } = labels[status];
  return (
    <p
      style={{
        color,
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        transition: "color 0.3s ease",
      }}
    >
      {text}
    </p>
  );
}

// ─── MIC BUTTON ───────────────────────────────────────────────────
function MicButton({
  status,
  onStart,
  onStop,
}: {
  status: InterviewStatus;
  onStart: () => void;
  onStop: () => void;
}) {
  const isRecording = status === "recording";
  const isDisabled =
    status === "processing" ||
    status === "speaking" ||
    status === "complete";

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings when recording */}
      {isRecording && (
        <>
          <div
            style={{
              position: "absolute",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              border: "2px solid #E84855",
              animation: "pulse_ring 1.2s ease-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              border: "2px solid #E84855",
              animation: "pulse_ring 1.2s ease-out infinite 0.4s",
            }}
          />
        </>
      )}

      {/* Main button */}
      <button
        onMouseDown={!isDisabled ? onStart : undefined}
        onMouseUp={!isDisabled ? onStop : undefined}
        onTouchStart={!isDisabled ? onStart : undefined}
        onTouchEnd={!isDisabled ? onStop : undefined}
        disabled={isDisabled}
        style={{
          width: "88px",
          height: "88px",
          borderRadius: "50%",
          border: `2px solid ${isRecording ? "#E84855" : isDisabled ? "#1E2A3A" : "#2E3A4A"}`,
          backgroundColor: isRecording
            ? "rgba(232,72,85,0.15)"
            : isDisabled
            ? "#0D1117"
            : "#0F1923",
          cursor: isDisabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          outline: "none",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Mic icon */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isRecording ? "#E84855" : isDisabled ? "#1E2A3A" : "#64748B"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>
    </div>
  );
}

// ─── SUBTITLE DISPLAY ─────────────────────────────────────────────
function SubtitleDisplay({
  text,
  subtext,
  visible,
}: {
  text: string;
  subtext?: string;
  visible: boolean;
}) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        textAlign: "center",
        maxWidth: "560px",
        minHeight: "80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}
    >
      {text && (
        <p
          style={{
            color: "#2E75C8",
            fontSize: "17px",
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          {text}
        </p>
      )}
      {subtext && (
        <p
          style={{
            color: "rgba(226,232,240,0.35)",
            fontSize: "13px",
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function InterviewPage() {
  const router = useRouter();
  const [status, setStatus] = useState<InterviewStatus>("waiting");
  const [elapsed, setElapsed] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [currentSubtitleEn, setCurrentSubtitleEn] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [company, setCompany] = useState("—");
  const [languageMode, setLanguageMode] = useState("english_formal");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionId = useRef<string | null>(null);

  // ── Load session data ─────────────────────────────────────────
  useEffect(() => {
    sessionId.current = sessionStorage.getItem("saiko_session_id");
    const c = sessionStorage.getItem("saiko_company");
    const lm = sessionStorage.getItem("saiko_language_mode");
    if (c) setCompany(c.charAt(0).toUpperCase() + c.slice(1));
    if (lm) setLanguageMode(lm);
  }, []);

  // ── Timer ─────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Stop timer when complete ──────────────────────────────────
  useEffect(() => {
    if (status === "complete" && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [status]);

  // ── Recording start ───────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (status !== "waiting") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setStatus("recording");
      setCurrentSubtitle("");
      setCurrentSubtitleEn("");
    } catch {
      console.error("Microphone access denied");
    }
  }, [status]);

  // ── Recording stop + send ─────────────────────────────────────
  const stopRecording = useCallback(async () => {
    if (status !== "recording") return;
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    setStatus("processing");

    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((t) => t.stop());

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];

        try {
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const res = await fetch(`${apiUrl}/api/voice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId.current,
              audio_base64: base64,
            }),
          });

          if (!res.ok) throw new Error("Voice API failed");
          const data: VoiceResponse = await res.json();

          setQuestionCount((q) => q + 1);

          // Show subtitles
          setCurrentSubtitle(data.subtitle_jp || data.response_text);
          setCurrentSubtitleEn(
            languageMode === "japanese" ? data.subtitle_en || "" : ""
          );

          // Play audio
          setStatus("speaking");
          if (data.audio_base64) {
            await playAudioFromBase64(data.audio_base64);
          }

          // Check if complete
          if (data.interview_complete) {
            setStatus("complete");
            setTimeout(() => router.push("/debrief"), 3000);
          } else {
            setStatus("waiting");
          }
        } catch {
          // Demo fallback — mock response if backend not ready
          const mockResponses = [
            "自己紹介をお願いします。",
            "Why did you choose this company specifically?",
            "What are your strengths and how will you contribute to the team?",
          ];
          const mockText = mockResponses[questionCount % mockResponses.length];
          setCurrentSubtitle(mockText);
          setCurrentSubtitleEn(
            languageMode === "japanese"
              ? "Please introduce yourself."
              : ""
          );
          setQuestionCount((q) => q + 1);
          setStatus("speaking");

          // Simulate speaking delay
          await new Promise((r) => setTimeout(r, 2000));

          if (questionCount >= 2) {
            setCurrentSubtitle("Thank you for your time. We will be in touch.");
            setCurrentSubtitleEn("");
            await new Promise((r) => setTimeout(r, 2000));
            setStatus("complete");
            setTimeout(() => router.push("/debrief"), 3000);
          } else {
            setStatus("waiting");
          }
        }
      };
    };
  }, [status, questionCount, languageMode, router]);

  // ── End interview early ───────────────────────────────────────
  const handleEnd = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.push("/debrief");
  };

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#0A0A0F",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 28px",
          borderBottom: "1px solid #1E2A3A",
        }}
      >
        {/* Company + question count */}
        <div>
          <p
            style={{
              color: "#E84855",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            {company}
          </p>
          <p
            style={{
              color: "rgba(226,232,240,0.30)",
              fontSize: "11px",
              marginTop: "2px",
            }}
          >
            Question {Math.min(questionCount + 1, 3)} of 3
          </p>
        </div>

        {/* Timer */}
        <p
          style={{
            color: "rgba(226,232,240,0.30)",
            fontSize: "13px",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.1em",
            fontFamily: "monospace",
          }}
        >
          {formatTime(elapsed)}
        </p>

        {/* End button */}
        <button
          onClick={handleEnd}
          style={{
            padding: "6px 16px",
            backgroundColor: "transparent",
            color: "rgba(226,232,240,0.30)",
            border: "1px solid #1E2A3A",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.color = "#E84855";
            (e.target as HTMLButtonElement).style.borderColor = "#E84855";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.color =
              "rgba(226,232,240,0.30)";
            (e.target as HTMLButtonElement).style.borderColor = "#1E2A3A";
          }}
        >
          End Interview
        </button>
      </div>

      {/* ── Main interview area ──────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "48px",
          padding: "40px 24px",
        }}
      >
        {/* Subtitle display */}
        <SubtitleDisplay
          text={currentSubtitle}
          subtext={currentSubtitleEn}
          visible={!!currentSubtitle}
        />

        {/* Complete state */}
        {status === "complete" && (
          <div
            style={{
              textAlign: "center",
              animation: "fadeIn 0.5s ease forwards",
            }}
          >
            <p
              style={{
                color: "rgba(226,232,240,0.60)",
                fontSize: "15px",
                marginBottom: "8px",
              }}
            >
              Interview complete.
            </p>
            <p
              style={{
                color: "rgba(226,232,240,0.30)",
                fontSize: "13px",
              }}
            >
              Generating your debrief...
            </p>
          </div>
        )}

        {/* Mic button */}
        {status !== "complete" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <MicButton
              status={status}
              onStart={startRecording}
              onStop={stopRecording}
            />
            <StatusLabel status={status} />
          </div>
        )}

        {/* Processing indicator */}
        {status === "processing" && (
          <div
            style={{
              display: "flex",
              gap: "6px",
              alignItems: "center",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  backgroundColor: "#2E75C8",
                  animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom hint ──────────────────────────────────────────── */}
      {status === "waiting" && (
        <div
          style={{
            textAlign: "center",
            padding: "16px",
            borderTop: "1px solid #1E2A3A",
          }}
        >
          <p
            style={{
              color: "rgba(226,232,240,0.15)",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Hold the button while speaking — release when done
          </p>
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes pulse_ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
