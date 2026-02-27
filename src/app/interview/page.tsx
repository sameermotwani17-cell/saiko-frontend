"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── TYPES ────────────────────────────────────────────────────────
type InterviewStatus =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "complete";

interface VoiceResponse {
  response_text: string;
  response_jp: string;
  audio_base64: string;
  interview_complete: boolean;
}

// ─── MOCK DATA ────────────────────────────────────────────────────
const MOCK_EXCHANGES = [
  {
    en: "Please introduce yourself.",
    jp: "自己紹介をお願いします。",
  },
  {
    en: "Why did you choose this company specifically?",
    jp: "なぜ弊社を志望されたのですか？",
  },
  {
    en: "What are your strengths and how will you contribute to the team?",
    jp: "あなたの強みは何ですか？チームにどのように貢献できますか？",
  },
  {
    en: "Thank you for your time. We will be in touch.",
    jp: "本日はお時間をいただきありがとうございました。後日ご連絡いたします。",
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function playAudioFromBase64(base64: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audio.onended = resolve;
    audio.onerror = resolve;
    audio.play().catch(resolve);
  });
}

// ─── WAVEFORM ─────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  const bars = 28;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "3px",
        height: "48px",
      }}
    >
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = 4;
        const maxExtra = 36;
        const seed = (i * 7 + 3) % bars;
        const naturalHeight = baseHeight + (seed / bars) * maxExtra * 0.4;
        return (
          <div
            key={i}
            style={{
              width: "3px",
              borderRadius: "2px",
              backgroundColor: active ? "#2E75C8" : "#1E2A3A",
              height: active ? `${naturalHeight}px` : "4px",
              transition: active
                ? `height ${0.3 + (i % 5) * 0.08}s ease ${(i % 7) * 0.04}s`
                : "height 0.4s ease",
              animation: active
                ? `wave-${i % 5} ${0.8 + (i % 4) * 0.2}s ease-in-out infinite alternate`
                : "none",
            }}
          />
        );
      })}
      <style>{`
        @keyframes wave-0 { from { transform: scaleY(0.6); } to { transform: scaleY(1.4); } }
        @keyframes wave-1 { from { transform: scaleY(1.0); } to { transform: scaleY(0.5); } }
        @keyframes wave-2 { from { transform: scaleY(0.7); } to { transform: scaleY(1.3); } }
        @keyframes wave-3 { from { transform: scaleY(1.2); } to { transform: scaleY(0.6); } }
        @keyframes wave-4 { from { transform: scaleY(0.8); } to { transform: scaleY(1.5); } }
      `}</style>
    </div>
  );
}

// ─── BILINGUAL SUBTITLE ───────────────────────────────────────────
function BilingualLine({
  en,
  jp,
  visible,
  isUser,
}: {
  en: string;
  jp?: string;
  visible: boolean;
  isUser?: boolean;
}) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        textAlign: "center",
        maxWidth: "620px",
        margin: "0 auto",
      }}
    >
      <p
        style={{
          color: isUser ? "rgba(226,232,240,0.55)" : "#E2E8F0",
          fontSize: isUser ? "15px" : "18px",
          fontWeight: isUser ? 400 : 500,
          lineHeight: 1.6,
          marginBottom: jp ? "8px" : "0",
          fontStyle: isUser ? "italic" : "normal",
        }}
      >
        {isUser ? `"${en}"` : en}
      </p>
      {jp && !isUser && (
        <p
          style={{
            color: "#2E75C8",
            fontSize: "14px",
            lineHeight: 1.5,
            letterSpacing: "0.02em",
          }}
        >
          {jp}
        </p>
      )}
    </div>
  );
}

// ─── CONVERSATION LOG ─────────────────────────────────────────────
interface Message {
  role: "ai" | "user";
  en: string;
  jp?: string;
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function InterviewPage() {
  const router = useRouter();
  const [status, setStatus] = useState<InterviewStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAiEn, setCurrentAiEn] = useState("");
  const [currentAiJp, setCurrentAiJp] = useState("");
  const [company, setCompany] = useState("—");
  const [questionCount, setQuestionCount] = useState(0);
  const [started, setStarted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionId = useRef<string | null>(null);
  const languageMode = useRef<string>("english_formal");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mockIndex = useRef(0);

  // ── Load session ─────────────────────────────────────────────
  useEffect(() => {
    sessionId.current = sessionStorage.getItem("saiko_session_id");
    const c = sessionStorage.getItem("saiko_company");
    const lm = sessionStorage.getItem("saiko_language_mode");
    if (c) setCompany(c.charAt(0).toUpperCase() + c.slice(1));
    if (lm) languageMode.current = lm;
  }, []);

  // ── Timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (started && status !== "complete") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, status]);

  // ── Auto scroll ───────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── AI speaks ─────────────────────────────────────────────────
  const aiSpeak = useCallback(async (en: string, jp: string, audioBase64?: string, isComplete?: boolean) => {
    setStatus("speaking");
    setCurrentAiEn(en);
    setCurrentAiJp(jp);

    if (audioBase64) {
      await playAudioFromBase64(audioBase64);
    } else {
      // Simulate speaking duration based on text length
      await new Promise((r) => setTimeout(r, Math.max(1500, en.length * 45)));
    }

    setMessages((prev) => [...prev, { role: "ai", en, jp }]);
    setCurrentAiEn("");
    setCurrentAiJp("");

    if (isComplete) {
      setStatus("complete");
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => router.push("/debrief"), 3000);
    } else {
      setStatus("listening");
      startListening();
    }
  }, [router]);

  // ── Start interview ───────────────────────────────────────────
  const startInterview = useCallback(async () => {
    setStarted(true);
    const first = MOCK_EXCHANGES[0];
    await aiSpeak(first.en, first.jp);
  }, [aiSpeak]);

  // ── Silence detection ─────────────────────────────────────────
  const stopListeningAndSend = useCallback(async () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state !== "recording") return;

    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    setStatus("processing");

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];

        // Add user message to log
        setMessages((prev) => [...prev, {
          role: "user",
          en: "Your answer was received.",
        }]);

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const res = await fetch(`${apiUrl}/api/voice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId.current,
              audio_base64: base64,
            }),
          });

          if (!res.ok) throw new Error("API failed");
          const data: VoiceResponse = await res.json();
          const newCount = questionCount + 1;
          setQuestionCount(newCount);
          await aiSpeak(
            data.response_text,
            data.response_jp,
            data.audio_base64,
            data.interview_complete
          );
        } catch {
          // Mock fallback
          const newCount = questionCount + 1;
          setQuestionCount(newCount);
          mockIndex.current = Math.min(newCount, MOCK_EXCHANGES.length - 1);
          const next = MOCK_EXCHANGES[mockIndex.current];
          const isLast = newCount >= 3;
          await aiSpeak(
            isLast ? MOCK_EXCHANGES[3].en : next.en,
            isLast ? MOCK_EXCHANGES[3].jp : next.jp,
            undefined,
            isLast
          );
        }
      };
    };
  }, [questionCount, aiSpeak]);

  // ── Start listening ───────────────────────────────────────────
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Silence detection via AudioContext
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      let silenceStart: number | null = null;
      const SILENCE_THRESHOLD = 12;
      const SILENCE_DURATION = 2200; // 2.2s silence = done speaking
      const MIN_SPEAK_TIME = 1500; // must speak for at least 1.5s
      let speakStart = Date.now();

      const checkSilence = () => {
        if (mediaRecorder.state !== "recording") return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const now = Date.now();
        const hasSpokenEnough = now - speakStart > MIN_SPEAK_TIME;

        if (avg < SILENCE_THRESHOLD && hasSpokenEnough) {
          if (!silenceStart) silenceStart = now;
          else if (now - silenceStart > SILENCE_DURATION) {
            audioCtx.close();
            stopListeningAndSend();
            return;
          }
        } else {
          silenceStart = null;
        }
        requestAnimationFrame(checkSilence);
      };

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      speakStart = Date.now();
      requestAnimationFrame(checkSilence);
      setStatus("listening");
    } catch {
      console.error("Mic access denied");
    }
  }, [stopListeningAndSend]);

  // ── Status label ──────────────────────────────────────────────
  const statusLabel = () => {
    switch (status) {
      case "idle": return { text: "Click to begin your interview", color: "rgba(226,232,240,0.35)" };
      case "listening": return { text: "Listening — speak naturally", color: "#2E75C8" };
      case "processing": return { text: "Processing your answer...", color: "rgba(226,232,240,0.35)" };
      case "speaking": return { text: "Interviewer speaking", color: "rgba(226,232,240,0.50)" };
      case "complete": return { text: "Interview complete — generating your debrief...", color: "rgba(226,232,240,0.35)" };
    }
  };

  const { text: statusText, color: statusColor } = statusLabel();

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0A0A0F", display: "flex", flexDirection: "column" }}>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 28px", borderBottom: "1px solid #1E2A3A",
      }}>
        <div>
          <p style={{ color: "#E84855", fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            {company}
          </p>
          <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "11px", marginTop: "2px" }}>
            Question {Math.min(questionCount + 1, 3)} of 3
          </p>
        </div>
        <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "13px", fontFamily: "monospace", letterSpacing: "0.1em" }}>
          {formatTime(elapsed)}
        </p>
        <button
          onClick={() => router.push("/debrief")}
          style={{
            padding: "6px 16px", backgroundColor: "transparent",
            color: "rgba(226,232,240,0.30)", border: "1px solid #1E2A3A",
            borderRadius: "4px", fontSize: "12px", cursor: "pointer",
          }}
          onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.color = "#E84855"; (e.target as HTMLButtonElement).style.borderColor = "#E84855"; }}
          onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.color = "rgba(226,232,240,0.30)"; (e.target as HTMLButtonElement).style.borderColor = "#1E2A3A"; }}
        >
          End Interview
        </button>
      </div>

      {/* ── Conversation area ────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Message log */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "32px 24px",
          display: "flex", flexDirection: "column", gap: "24px",
          scrollbarWidth: "thin", scrollbarColor: "#1E2A3A #0A0A0F",
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ animation: "fadeIn 0.4s ease forwards", opacity: 0, animationDelay: "0s" }}>
              {msg.role === "ai" ? (
                <div style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto" }}>
                  <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px" }}>
                    INTERVIEWER
                  </p>
                  <p style={{ color: "#E2E8F0", fontSize: "17px", lineHeight: 1.6, marginBottom: "6px" }}>
                    {msg.en}
                  </p>
                  {msg.jp && (
                    <p style={{ color: "#2E75C8", fontSize: "13px", lineHeight: 1.5 }}>
                      {msg.jp}
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", maxWidth: "520px", margin: "0 auto" }}>
                  <p style={{ color: "rgba(226,232,240,0.20)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "6px" }}>
                    YOU
                  </p>
                  <p style={{ color: "rgba(226,232,240,0.40)", fontSize: "15px", fontStyle: "italic", lineHeight: 1.6 }}>
                    Answer received
                  </p>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Live AI line (currently speaking) ─────────────────── */}
        <div style={{
          borderTop: "1px solid #1E2A3A",
          padding: "28px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          minHeight: "180px",
          justifyContent: "center",
        }}>

          {/* Waveform */}
          <Waveform active={status === "speaking" || status === "listening"} />

          {/* Live subtitle */}
          {(currentAiEn || status === "listening") && (
            <BilingualLine
              en={currentAiEn || ""}
              jp={currentAiJp}
              visible={!!currentAiEn}
            />
          )}

          {/* Processing dots */}
          {status === "processing" && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: "5px", height: "5px", borderRadius: "50%",
                  backgroundColor: "#2E75C8",
                  animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
          )}

          {/* Status label */}
          <p style={{
            color: statusColor,
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            transition: "color 0.3s ease",
          }}>
            {statusText}
          </p>

          {/* Start button — only shown before interview begins */}
          {!started && status === "idle" && (
            <button
              onClick={startInterview}
              style={{
                padding: "14px 48px",
                backgroundColor: "#E84855",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.05em",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.backgroundColor = "#d03a45"; }}
              onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.backgroundColor = "#E84855"; }}
            >
              Begin Interview
            </button>
          )}

          {/* Listening indicator pulse */}
          {status === "listening" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                backgroundColor: "#2E75C8",
                animation: "livePulse 1s ease-in-out infinite",
              }} />
              <p style={{ color: "#2E75C8", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Recording — pause to submit
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </main>
  );
}
