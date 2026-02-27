"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

// ─── TYPES ────────────────────────────────────────────────────────
interface Scores {
  jiko_pr: number;
  shibou_douki: number;
  kyouchousei: number;
  seichou_iyoku: number;
  bunka_tekigou: number;
}

interface MonologueEntry {
  question: string;
  user_answer_summary: string;
  hr_thought: string;
  score_impact: string;
}

interface RewriteEntry {
  original_phrase: string;
  replacement_phrase: string;
  why_it_works: string;
  dimension_affected: string;
}

interface DebriefData {
  scores: Scores;
  monologue: MonologueEntry[];
  rewrites: RewriteEntry[];
  company_flag: string;
  overall_score: number;
}

// ─── MOCK DATA — used when backend not ready ───────────────────────
const MOCK_DEBRIEF: DebriefData = {
  scores: {
    jiko_pr: 5,
    shibou_douki: 4,
    kyouchousei: 6,
    seichou_iyoku: 5,
    bunka_tekigou: 4,
  },
  overall_score: 4.8,
  monologue: [
    {
      question: "Please introduce yourself.",
      user_answer_summary:
        "Candidate introduced their background, university, and goals in a direct Western style.",
      hr_thought:
        "The candidate speaks well but leads with personal achievement. There is no acknowledgment of the team or what they can give to this company. I hear ambition directed inward. In our culture, this reads as self-centered. I am already concerned about cultural fit.",
      score_impact: "-2 on 自己PR — individual framing, no humility markers",
    },
    {
      question: "Why did you choose this company specifically?",
      user_answer_summary:
        "Candidate mentioned growth opportunities and the company's global reputation.",
      hr_thought:
        "Growth opportunities. This phrase tells me the candidate sees us as a vehicle for their personal development. They did not mention our mission, our products, or what they intend to contribute. This is a common foreigner mistake. They want to take from us, not give to us. 志望動機 score is low.",
      score_impact: "-3 on 志望動機 — personal gain framing, no company knowledge demonstrated",
    },
    {
      question:
        "What are your strengths and how will you contribute to the team?",
      user_answer_summary:
        "Candidate listed three personal strengths with examples of individual achievements.",
      hr_thought:
        "The candidate is clearly capable. But every example is 'I did this.' 'I solved that.' 'I achieved.' In twenty years of interviewing, I have never hired someone who could not learn to say 'we.' The team orientation score reflects this.",
      score_impact: "-2 on 協調性 — no team language, achievement framed individually",
    },
  ],
  rewrites: [
    {
      original_phrase: "I want to grow my skills here.",
      replacement_phrase:
        "I hope to develop within this company's framework and contribute to the team's long-term goals.",
      why_it_works:
        "Shifts the framing from personal extraction to contribution. Japanese HR hears loyalty and alignment, not ambition.",
      dimension_affected: "志望動機",
    },
    {
      original_phrase: "I achieved top results in my project.",
      replacement_phrase:
        "Our team delivered strong results, and my contribution was to coordinate communication between departments.",
      why_it_works:
        "Group framing with a specific, humble personal role. Demonstrates wa without erasing your contribution.",
      dimension_affected: "協調性",
    },
    {
      original_phrase:
        "I chose this company because of the growth opportunities.",
      replacement_phrase:
        "I chose this company because I believe in the mission and want to contribute to what you are building over the long term.",
      why_it_works:
        "Removes the self-serving signal. Replaces it with loyalty language and company-first framing.",
      dimension_affected: "志望動機",
    },
  ],
  company_flag:
    "Toyota interviews specifically for kaizen mindset — the willingness to continuously improve within the company's framework, not outside it. Any language suggesting independent innovation, external ambition, or impatience with process will be penalized heavily. Toyota is the most traditional company on this list. Lifetime commitment is not just expected — it is the baseline assumption. If you did not signal permanence in every answer, your 志望動機 score reflects that.",
};

// ─── SCORE COLOR ──────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 8) return "#2E8B57";
  if (score >= 6) return "#2E75C8";
  if (score >= 4) return "#E8A838";
  return "#E84855";
}

// ─── SCORE BAR ────────────────────────────────────────────────────
function ScoreBar({
  label,
  labelJp,
  score,
  delay,
}: {
  label: string;
  labelJp: string;
  score: number;
  delay: number;
}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((score / 10) * 100), delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <div>
          <span style={{ color: "#E2E8F0", fontSize: "13px", fontWeight: 600 }}>
            {label}
          </span>
          <span
            style={{
              color: "rgba(226,232,240,0.35)",
              fontSize: "12px",
              marginLeft: "8px",
            }}
          >
            {labelJp}
          </span>
        </div>
        <span
          style={{
            color: scoreColor(score),
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          {score}/10
        </span>
      </div>
      <div
        style={{
          height: "4px",
          backgroundColor: "#1E2A3A",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            backgroundColor: scoreColor(score),
            borderRadius: "2px",
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}

// ─── OVERALL BADGE ────────────────────────────────────────────────
function OverallBadge({ score }: { score: number }) {
  const label =
    score >= 8
      ? "Strong"
      : score >= 6
      ? "Developing"
      : score >= 4
      ? "Needs Work"
      : "Critical";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          border: `3px solid ${scoreColor(score)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${scoreColor(score)}15`,
        }}
      >
        <span
          style={{
            color: scoreColor(score),
            fontSize: "22px",
            fontWeight: 800,
          }}
        >
          {score.toFixed(1)}
        </span>
      </div>
      <span
        style={{
          color: scoreColor(score),
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function DebriefPage() {
  const router = useRouter();
  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [activeTab, setActiveTab] = useState<"monologue" | "rewrites" | "flag">(
    "monologue"
  );
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState("—");

  // ── Fetch debrief ─────────────────────────────────────────────
  useEffect(() => {
    const c = sessionStorage.getItem("saiko_company");
    if (c) setCompany(c.charAt(0).toUpperCase() + c.slice(1));

    const fetchDebrief = async () => {
      const sessionId = sessionStorage.getItem("saiko_session_id");
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/debrief`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        if (!res.ok) throw new Error("Debrief failed");
        const data: DebriefData = await res.json();
        setDebrief(data);
      } catch {
        // Fallback to mock data
        await new Promise((r) => setTimeout(r, 1200));
        setDebrief(MOCK_DEBRIEF);
      } finally {
        setLoading(false);
      }
    };

    fetchDebrief();
  }, []);

  // ── Radar chart data ──────────────────────────────────────────
  const radarData = debrief
    ? [
        { dimension: "自己PR", score: debrief.scores.jiko_pr },
        { dimension: "志望動機", score: debrief.scores.shibou_douki },
        { dimension: "協調性", score: debrief.scores.kyouchousei },
        { dimension: "成長意欲", score: debrief.scores.seichou_iyoku },
        { dimension: "文化適合", score: debrief.scores.bunka_tekigou },
      ]
    : [];

  // ─── LOADING STATE ────────────────────────────────────────────
  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "#0A0A0F",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "2px solid #1E2A3A",
            borderTop: "2px solid #E84855",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p
          style={{
            color: "rgba(226,232,240,0.40)",
            fontSize: "13px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Generating your debrief...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (!debrief) return null;

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#0A0A0F",
        color: "#E2E8F0",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        style={{
          padding: "20px 28px",
          borderBottom: "1px solid #1E2A3A",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
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
            SAIKO — Interview Debrief
          </p>
          <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "12px", marginTop: "2px" }}>
            {company} Interview
          </p>
        </div>
        <button
          onClick={() => router.push("/onboard")}
          style={{
            padding: "6px 16px",
            backgroundColor: "transparent",
            color: "rgba(226,232,240,0.40)",
            border: "1px solid #1E2A3A",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "32px 24px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "32px",
        }}
      >
        {/* ── LEFT — Scores ──────────────────────────────────────── */}
        <div>
          {/* Overall badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              marginBottom: "32px",
              padding: "20px 24px",
              border: "1px solid #1E2A3A",
              borderRadius: "8px",
            }}
          >
            <OverallBadge score={debrief.overall_score} />
            <div>
              <p style={{ color: "#E2E8F0", fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>
                Overall Score
              </p>
              <p style={{ color: "rgba(226,232,240,0.40)", fontSize: "13px" }}>
                Across 5 Japanese HR dimensions
              </p>
            </div>
          </div>

          {/* Score bars */}
          <div
            style={{
              padding: "24px",
              border: "1px solid #1E2A3A",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                color: "rgba(226,232,240,0.30)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              Dimension Breakdown
            </p>
            <ScoreBar label="Self-Presentation" labelJp="自己PR" score={debrief.scores.jiko_pr} delay={100} />
            <ScoreBar label="Motivation" labelJp="志望動機" score={debrief.scores.shibou_douki} delay={200} />
            <ScoreBar label="Team Orientation" labelJp="協調性" score={debrief.scores.kyouchousei} delay={300} />
            <ScoreBar label="Growth Mindset" labelJp="成長意欲" score={debrief.scores.seichou_iyoku} delay={400} />
            <ScoreBar label="Cultural Fit" labelJp="文化適合" score={debrief.scores.bunka_tekigou} delay={500} />
          </div>

          {/* Radar chart */}
          <div
            style={{
              padding: "24px",
              border: "1px solid #1E2A3A",
              borderRadius: "8px",
            }}
          >
            <p
              style={{
                color: "rgba(226,232,240,0.30)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Performance Radar
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1E2A3A" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: "rgba(226,232,240,0.40)", fontSize: 12 }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#E84855"
                  fill="#E84855"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── RIGHT — Tabs ───────────────────────────────────────── */}
        <div>
          {/* Tab nav */}
          <div
            style={{
              display: "flex",
              gap: "0",
              marginBottom: "24px",
              border: "1px solid #1E2A3A",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {(
              [
                { key: "monologue", label: "What HR Thought" },
                { key: "rewrites", label: "How to Fix It" },
                { key: "flag", label: "Company Notes" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  backgroundColor:
                    activeTab === tab.key ? "#1E2A3A" : "transparent",
                  color:
                    activeTab === tab.key
                      ? "#E2E8F0"
                      : "rgba(226,232,240,0.35)",
                  border: "none",
                  borderRight: "1px solid #1E2A3A",
                  fontSize: "12px",
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  letterSpacing: "0.02em",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* MONOLOGUE TAB */}
            {activeTab === "monologue" &&
              debrief.monologue.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid #1E2A3A",
                    borderLeft: "3px solid #E84855",
                    borderRadius: "8px",
                    padding: "20px",
                    animation: "fadeIn 0.4s ease forwards",
                    animationDelay: `${i * 0.1}s`,
                    opacity: 0,
                  }}
                >
                  <p
                    style={{
                      color: "rgba(226,232,240,0.35)",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    Q{i + 1}
                  </p>
                  <p
                    style={{
                      color: "#E2E8F0",
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "12px",
                    }}
                  >
                    {entry.question}
                  </p>
                  <p
                    style={{
                      color: "rgba(226,232,240,0.40)",
                      fontSize: "12px",
                      marginBottom: "12px",
                      fontStyle: "italic",
                    }}
                  >
                    You said: {entry.user_answer_summary}
                  </p>
                  <div
                    style={{
                      backgroundColor: "rgba(232,72,85,0.05)",
                      border: "1px solid rgba(232,72,85,0.15)",
                      borderRadius: "6px",
                      padding: "14px",
                      marginBottom: "10px",
                    }}
                  >
                    <p
                      style={{
                        color: "rgba(226,232,240,0.30)",
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                      }}
                    >
                      HR Internal Monologue
                    </p>
                    <p
                      style={{
                        color: "rgba(226,232,240,0.75)",
                        fontSize: "13px",
                        lineHeight: 1.7,
                        fontStyle: "italic",
                      }}
                    >
                      &ldquo;{entry.hr_thought}&rdquo;
                    </p>
                  </div>
                  <p
                    style={{
                      color: "#E84855",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {entry.score_impact}
                  </p>
                </div>
              ))}

            {/* REWRITES TAB */}
            {activeTab === "rewrites" &&
              debrief.rewrites.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid #1E2A3A",
                    borderRadius: "8px",
                    padding: "20px",
                    animation: "fadeIn 0.4s ease forwards",
                    animationDelay: `${i * 0.1}s`,
                    opacity: 0,
                  }}
                >
                  <p
                    style={{
                      color: "rgba(226,232,240,0.30)",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      marginBottom: "12px",
                    }}
                  >
                    {entry.dimension_affected}
                  </p>

                  {/* Original */}
                  <div style={{ marginBottom: "10px" }}>
                    <p style={{ color: "#E84855", fontSize: "11px", marginBottom: "6px", fontWeight: 600 }}>
                      ✕ What you said
                    </p>
                    <p
                      style={{
                        backgroundColor: "rgba(232,72,85,0.06)",
                        border: "1px solid rgba(232,72,85,0.15)",
                        borderRadius: "6px",
                        padding: "12px",
                        color: "rgba(226,232,240,0.60)",
                        fontSize: "13px",
                        fontStyle: "italic",
                      }}
                    >
                      &ldquo;{entry.original_phrase}&rdquo;
                    </p>
                  </div>

                  {/* Replacement */}
                  <div style={{ marginBottom: "12px" }}>
                    <p style={{ color: "#2E8B57", fontSize: "11px", marginBottom: "6px", fontWeight: 600 }}>
                      ✓ Say this instead
                    </p>
                    <p
                      style={{
                        backgroundColor: "rgba(46,139,87,0.06)",
                        border: "1px solid rgba(46,139,87,0.20)",
                        borderRadius: "6px",
                        padding: "12px",
                        color: "#E2E8F0",
                        fontSize: "13px",
                        fontStyle: "italic",
                      }}
                    >
                      &ldquo;{entry.replacement_phrase}&rdquo;
                    </p>
                  </div>

                  {/* Why */}
                  <p style={{ color: "rgba(226,232,240,0.40)", fontSize: "12px", lineHeight: 1.6 }}>
                    {entry.why_it_works}
                  </p>
                </div>
              ))}

            {/* COMPANY FLAG TAB */}
            {activeTab === "flag" && (
              <div
                style={{
                  border: "1px solid #1E2A3A",
                  borderLeft: "3px solid #E8A838",
                  borderRadius: "8px",
                  padding: "24px",
                  animation: "fadeIn 0.4s ease forwards",
                }}
              >
                <p
                  style={{
                    color: "#E8A838",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  {company} — Specific Warning
                </p>
                <p
                  style={{
                    color: "rgba(226,232,240,0.75)",
                    fontSize: "14px",
                    lineHeight: 1.8,
                  }}
                >
                  {debrief.company_flag}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
