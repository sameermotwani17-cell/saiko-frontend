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
  time_remaining_seconds?: number;
  question_number?: number;
}

// ─── MOCK DATA ────────────────────────────────────────────────────
const MOCK_EXCHANGES = [
  { en: "Please introduce yourself.", jp: "自己紹介をお願いします。" },
  { en: "Why did you choose this company specifically?", jp: "なぜ弊社を志望されたのですか？" },
  { en: "What are your strengths and how will you contribute to the team?", jp: "あなたの強みは何ですか？チームにどのように貢献できますか？" },
  { en: "Tell me about a time you worked closely with a team to solve a problem.", jp: "チームで問題を解決した経験について教えてください。" },
  { en: "How do you handle situations where you disagree with a group decision?", jp: "グループの決定に同意できない場合、どう対応しますか？" },
  { en: "What does continuous improvement mean to you?", jp: "あなたにとって「改善」とは何ですか？" },
  { en: "Why do you want to work in Japan specifically?", jp: "なぜ日本で働きたいのですか？" },
  { en: "How long do you plan to stay with this company?", jp: "弊社にどのくらい在籍する予定ですか？" },
  { en: "What would your previous colleagues say about you?", jp: "以前の同僚はあなたのことをどう言うと思いますか？" },
  { en: "What would you do if your manager asked you to do something you thought was wrong?", jp: "上司から間違っていると思うことを頼まれたらどうしますか？" },
  { en: "Thank you for your time. We will be in touch.", jp: "本日はお時間をいただきありがとうございました。後日ご連絡いたします。" },
];

// ─── HELPERS ──────────────────────────────────────────────────────
function formatCountdown(seconds: number) {
  if (seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function playAudioFromBase64(base64: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}

// ─── WAVEFORM ─────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  const bars = 28;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", height: "48px" }}>
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = 4;
        const maxExtra = 36;
        const seed = (i * 7 + 3) % bars;
        const naturalHeight = baseHeight + (seed / bars) * maxExtra * 0.4;
        return (
          <div
            key={i}
            style={{
              width: "3px", borderRadius: "2px",
              backgroundColor: active ? "#2E75C8" : "#1E2A3A",
              height: active ? `${naturalHeight}px` : "4px",
              transition: active ? `height ${0.3 + (i % 5) * 0.08}s ease ${(i % 7) * 0.04}s` : "height 0.4s ease",
              animation: active ? `wave-${i % 5} ${0.8 + (i % 4) * 0.2}s ease-in-out infinite alternate` : "none",
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
function BilingualLine({ en, jp, visible }: { en: string; jp?: string; visible: boolean }) {
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
      textAlign: "center", maxWidth: "620px", margin: "0 auto",
    }}>
      <p style={{ color: "#E2E8F0", fontSize: "18px", fontWeight: 500, lineHeight: 1.6, marginBottom: jp ? "8px" : "0" }}>{en}</p>
      {jp && <p style={{ color: "#2E75C8", fontSize: "14px", lineHeight: 1.5, letterSpacing: "0.02em" }}>{jp}</p>}
    </div>
  );
}

// ─── MESSAGE TYPE ─────────────────────────────────────────────────
interface Message { role: "ai" | "user"; en: string; jp?: string; }

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function InterviewPage() {
  const router = useRouter();
  const [status, setStatus] = useState<InterviewStatus>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAiEn, setCurrentAiEn] = useState("");
  const [currentAiJp, setCurrentAiJp] = useState("");
  const [company, setCompany] = useState("—");
  const [questionCount, setQuestionCount] = useState(0);
  const [started, setStarted] = useState(false);

  // Timer state
  const [sessionDuration, setSessionDuration] = useState(15); // minutes
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // seconds
  const [timerStarted, setTimerStarted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionId = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mockIndex = useRef(0);

  // ── Load session ─────────────────────────────────────────────
  useEffect(() => {
    sessionId.current = sessionStorage.getItem("saiko_session_id");
    const c = sessionStorage.getItem("saiko_company");
    const dur = sessionStorage.getItem("saiko_session_duration");
    if (c) setCompany(c.charAt(0).toUpperCase() + c.slice(1));
    if (dur) {
      const mins = parseInt(dur, 10);
      setSessionDuration(mins);
      setTimeRemaining(mins * 60);
    }
  }, []);

  // ── Countdown timer ───────────────────────────────────────────
  useEffect(() => {
    if (timerStarted && status !== "complete") {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerStarted, status]);

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
    setTimerStarted(true);
    const first = MOCK_EXCHANGES[0];
    setQuestionCount(1);
    await aiSpeak(first.en, first.jp);
  }, [aiSpeak]);

  // ── Stop listening and send ───────────────────────────────────
  const stopListeningAndSend = useCallback(async () => {
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

        setMessages((prev) => [...prev, { role: "user", en: "Your answer was received." }]);

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const res = await fetch(`${apiUrl}/api/voice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId.current, audio_base64: base64 }),
          });

          if (!res.ok) throw new Error("API failed");
          const data: VoiceResponse = await res.json();

          // Update timer from backend (source of truth)
          if (data.time_remaining_seconds !== undefined) {
            setTimeRemaining(data.time_remaining_seconds);
          }
          if (data.question_number !== undefined) {
            setQuestionCount(data.question_number);
          } else {
            setQuestionCount((prev) => prev + 1);
          }

          await aiSpeak(data.response_text, data.response_jp, data.audio_base64, data.interview_complete);
        } catch {
          // Mock fallback — simulate time-based ending
          const newCount = questionCount + 1;
          setQuestionCount(newCount);
          mockIndex.current = Math.min(newCount, MOCK_EXCHANGES.length - 2);

          const isTimeUp = timeRemaining <= 30;
          const closingExchange = MOCK_EXCHANGES[MOCK_EXCHANGES.length - 1];
          const nextExchange = MOCK_EXCHANGES[mockIndex.current];

          await aiSpeak(
            isTimeUp ? closingExchange.en : nextExchange.en,
            isTimeUp ? closingExchange.jp : nextExchange.jp,
            undefined,
            isTimeUp,
          );
        }
      };
    };
  }, [questionCount, timeRemaining, aiSpeak]);

  // ── Start listening ───────────────────────────────────────────
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      let silenceStart: number | null = null;
      const SILENCE_THRESHOLD = 12;
      const SILENCE_DURATION = 2200;
      const MIN_SPEAK_TIME = 1500;
      const speakStart = Date.now();

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
  const timerIsLow = timeRemaining <= 60 && timerStarted;

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0A0A0F", display: "flex", flexDirection: "column" }}>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 28px", borderBottom: "1px solid #1E2A3A",
      }}>
        {/* Left: company + question count */}
        <div>
          <p style={{ color: "#E84855", fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            {company}
          </p>
          <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "11px", marginTop: "2px" }}>
            Question {questionCount}
          </p>
        </div>

        {/* Center: countdown timer */}
        <div style={{ textAlign: "center" }}>
          <p style={{
            color: status === "complete" ? "rgba(226,232,240,0.30)" : timerIsLow ? "#E84855" : "rgba(226,232,240,0.50)",
            fontSize: "24px",
            fontFamily: "monospace",
            fontWeight: 700,
            letterSpacing: "0.1em",
            transition: "color 0.3s ease",
          }}>
            {status === "complete" ? "Complete" : formatCountdown(timeRemaining)}
          </p>
          <p style={{ color: "rgba(226,232,240,0.20)", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {status === "complete" ? "" : timerIsLow ? "finishing up" : "remaining"}
          </p>
        </div>

        {/* Right: end button */}
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
                  <p style={{ color: "#E2E8F0", fontSize: "17px", lineHeight: 1.6, marginBottom: "6px" }}>{msg.en}</p>
                  {msg.jp && <p style={{ color: "#2E75C8", fontSize: "13px", lineHeight: 1.5 }}>{msg.jp}</p>}
                </div>
              ) : (
                <div style={{ textAlign: "center", maxWidth: "520px", margin: "0 auto" }}>
                  <p style={{ color: "rgba(226,232,240,0.20)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "6px" }}>YOU</p>
                  <p style={{ color: "rgba(226,232,240,0.40)", fontSize: "15px", fontStyle: "italic", lineHeight: 1.6 }}>Answer received</p>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Live area ─────────────────────────────────────────── */}
        <div style={{
          borderTop: "1px solid #1E2A3A",
          padding: "28px 24px",
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: "20px", minHeight: "180px", justifyContent: "center",
        }}>

          <Waveform active={status === "speaking" || status === "listening"} />

          {(currentAiEn || status === "listening") && (
            <BilingualLine en={currentAiEn || ""} jp={currentAiJp} visible={!!currentAiEn} />
          )}

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

          <p style={{
            color: statusColor, fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.18em", textTransform: "uppercase",
            transition: "color 0.3s ease",
          }}>
            {statusText}
          </p>

          {!started && status === "idle" && (
            <button
              onClick={startInterview}
              style={{
                padding: "14px 48px", backgroundColor: "#E84855", color: "#fff",
                border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 700,
                cursor: "pointer", letterSpacing: "0.05em", transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.backgroundColor = "#d03a45"; }}
              onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.backgroundColor = "#E84855"; }}
            >
              Begin Interview
            </button>
          )}

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
