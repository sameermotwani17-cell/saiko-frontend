"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
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
  question_jp: string;
  user_answer_summary: string;
  hr_thought: string;
  hr_thought_jp: string;
  score_impact: string;
}
interface RewriteEntry {
  original_phrase: string;
  replacement_phrase: string;
  replacement_phrase_jp: string;
  why_it_works: string;
  why_it_works_jp: string;
  dimension_affected: string;
}
interface FullDebriefSection {
  dimension: string;
  dimension_jp: string;
  score: number;
  en_analysis: string;
  jp_analysis: string;
  en_advice: string;
  jp_advice: string;
}
interface DebriefData {
  scores: Scores;
  monologue: MonologueEntry[];
  rewrites: RewriteEntry[];
  company_flag: string;
  company_flag_jp: string;
  overall_score: number;
  full_report?: FullDebriefSection[];
}

// ─── MOCK DATA ────────────────────────────────────────────────────
const MOCK_DEBRIEF: DebriefData = {
  scores: { jiko_pr: 5, shibou_douki: 4, kyouchousei: 6, seichou_iyoku: 5, bunka_tekigou: 4 },
  overall_score: 4.8,
  company_flag: "Toyota interviews specifically for kaizen mindset — the willingness to continuously improve within the company's framework, not outside it. Any language suggesting independent innovation, external ambition, or impatience with process will be penalized heavily.",
  company_flag_jp: "トヨタは、会社の枠組みの中で継続的に改善しようとする「改善マインド」を重視しています。独立したイノベーションや外部への野心、プロセスへの苛立ちを示す発言は大きく減点されます。",
  monologue: [
    {
      question: "Please introduce yourself.",
      question_jp: "自己紹介をお願いします。",
      user_answer_summary: "Candidate introduced their background, university, and goals in a direct Western style.",
      hr_thought: "The candidate speaks well but leads with personal achievement. There is no acknowledgment of the team or what they can give to this company. I hear ambition directed inward. In our culture, this reads as self-centered. I am already concerned about cultural fit.",
      hr_thought_jp: "候補者は流暢に話しますが、個人的な実績から始めています。チームや会社への貢献への言及がありません。内向きの野心を感じます。我々の文化では、これは自己中心的に映ります。文化的適合性に懸念を感じています。",
      score_impact: "-2 on 自己PR — individual framing, no humility markers",
    },
    {
      question: "Why did you choose this company specifically?",
      question_jp: "なぜ弊社を志望されたのですか？",
      user_answer_summary: "Candidate mentioned growth opportunities and the company's global reputation.",
      hr_thought: "Growth opportunities. This phrase tells me the candidate sees us as a vehicle for their personal development. They did not mention our mission, our products, or what they intend to contribute. This is a common foreigner mistake. They want to take from us, not give to us. 志望動機 score is low.",
      hr_thought_jp: "「成長の機会」というフレーズが、候補者が弊社を自己成長の手段として見ていることを示しています。会社のミッションや製品、貢献意欲については全く触れませんでした。これは外国人候補者によくある間違いです。与えるのではなく、受け取ろうとしています。",
      score_impact: "-3 on 志望動機 — personal gain framing, no company knowledge demonstrated",
    },
    {
      question: "What are your strengths and how will you contribute to the team?",
      question_jp: "あなたの強みは何ですか？チームにどのように貢献できますか？",
      user_answer_summary: "Candidate listed three personal strengths with examples of individual achievements.",
      hr_thought: "The candidate is clearly capable. But every example is I did this. I solved that. I achieved. In twenty years of interviewing, I have never hired someone who could not learn to say we. The team orientation score reflects this.",
      hr_thought_jp: "候補者は確かに有能です。しかし、すべての例が「私がした」「私が解決した」「私が達成した」という表現です。20年の面接経験で、「私たち」と言えない人を採用したことはありません。チーム志向のスコアはこれを反映しています。",
      score_impact: "-2 on 協調性 — no team language, achievement framed individually",
    },
  ],
  rewrites: [
    {
      original_phrase: "I want to grow my skills here.",
      replacement_phrase: "I hope to develop within this company's framework and contribute to the team's long-term goals.",
      replacement_phrase_jp: "御社の枠組みの中で成長し、チームの長期的な目標に貢献したいと思っています。",
      why_it_works: "Shifts the framing from personal extraction to contribution. Japanese HR hears loyalty and alignment, not ambition.",
      why_it_works_jp: "個人的な利益から貢献へとフレームを変えます。日本のHRには野心ではなく、忠誠心と会社への適合性として響きます。",
      dimension_affected: "志望動機",
    },
    {
      original_phrase: "I achieved top results in my project.",
      replacement_phrase: "Our team delivered strong results, and my contribution was to coordinate communication between departments.",
      replacement_phrase_jp: "チーム全体で優れた結果を出しました。私の貢献は部門間のコミュニケーションを調整することでした。",
      why_it_works: "Group framing with a specific, humble personal role. Demonstrates wa without erasing your contribution.",
      why_it_works_jp: "グループを主体にしながら、控えめな個人的役割を明確に示します。自分の貢献を消すことなく「和」を体現できます。",
      dimension_affected: "協調性",
    },
    {
      original_phrase: "I chose this company because of the growth opportunities.",
      replacement_phrase: "I chose this company because I believe in the mission and want to contribute to what you are building over the long term.",
      replacement_phrase_jp: "御社のミッションを信じており、長期的な取り組みに貢献したいと考えているため、志望いたしました。",
      why_it_works: "Removes the self-serving signal. Replaces it with loyalty language and company-first framing.",
      why_it_works_jp: "自己利益のシグナルを除去し、忠誠心と会社優先のフレームに置き換えます。",
      dimension_affected: "志望動機",
    },
  ],
};

// Mock full report generated on demand
const MOCK_FULL_REPORT: FullDebriefSection[] = [
  {
    dimension: "Self-Presentation", dimension_jp: "自己PR",
    score: 5,
    en_analysis: "Your self-introduction followed a Western structure — strong opening, clear achievements, direct confidence. In a Japanese corporate context, this reads as socially unaware rather than impressive. Japanese interviewers evaluate the first 60 seconds for humility markers, team references, and appropriate deference. Your answer had none of these.",
    jp_analysis: "あなたの自己紹介は西洋式の構成に従っていました。力強い始まり、明確な実績、直接的な自信。日本の企業環境では、これは印象的というよりも社会的に無自覚な印象を与えます。日本の面接官は最初の60秒で謙虚さのマーカー、チームへの言及、適切な敬意を評価します。",
    en_advice: "Structure your self-introduction as: background → contribution to team → reason you chose this company. Lead with where you came from, not what you achieved. End with what you want to give, not what you want to get.",
    jp_advice: "自己紹介は「背景→チームへの貢献→志望動機」の順に構成してください。実績ではなく、どこから来たかを先に述べましょう。得たいことではなく、提供したいことで締めくくります。",
  },
  {
    dimension: "Motivation & Loyalty", dimension_jp: "志望動機",
    score: 4,
    en_analysis: "This was your weakest area. Your answer signaled that you see this company as a platform for personal development rather than an organization you want to serve. Japanese HR reads 'growth opportunities' as a red flag — it implies you will leave when you stop growing. Long-term commitment language was completely absent.",
    jp_analysis: "これが最も弱い部分でした。あなたの回答は、この会社を奉仕したい組織ではなく、個人の成長のプラットフォームとして見ていることを示しました。日本のHRは「成長の機会」をリスクとして捉えます。成長が止まったら辞めるという含意があるためです。長期的なコミットメントを示す言葉が完全に欠けていました。",
    en_advice: "Research the company's specific mission and recent initiatives before your real interview. Reference them directly. Say something like: 'I have followed your expansion into X and I want to be part of building that.' This signals you know them and want to grow with them specifically.",
    jp_advice: "実際の面接前に会社の具体的なミッションと最近の取り組みを調査してください。直接言及しましょう。「X分野への展開を注目しており、その構築に携わりたいです」のように言えると効果的です。",
  },
  {
    dimension: "Team Orientation", dimension_jp: "協調性",
    score: 6,
    en_analysis: "Your score here was the strongest, which suggests you naturally reference collaborative work. However, you still defaulted to 'I' language in your achievement examples. The gap between your instinct and Japanese expectations is smaller here — you just need to consistently replace I with we and reframe your role as a contributor rather than a driver.",
    jp_analysis: "ここが最も高いスコアで、自然に協調的な仕事を参照できていることを示しています。ただし、実績の例では依然として「私」という言葉を使っていました。あなたの本能と日本の期待のギャップはここでは小さいです。「私」を「私たち」に一貫して置き換え、推進者ではなく貢献者として自分の役割を再定義するだけです。",
    en_advice: "Practice the formula: 'Our team achieved X. My specific contribution was Y. What I learned for future teamwork is Z.' This structure shows group success first, individual role second, and growth orientation third.",
    jp_advice: "「チームでXを達成しました。私の具体的な貢献はYでした。今後のチームワークのために学んだことはZです」という公式を練習してください。",
  },
  {
    dimension: "Growth Mindset", dimension_jp: "成長意欲",
    score: 5,
    en_analysis: "In Japan, growth mindset does not mean seeking new challenges externally. It means committing to mastery within the company's system. Your answers suggested outward-facing growth — new skills, new experiences. Japanese HR heard flight risk. The correct framing is: I want to master this company's way of doing things and improve continuously within that framework.",
    jp_analysis: "日本では「成長意欲」は外部で新しい挑戦を求めることではありません。会社のシステム内での習熟にコミットすることを意味します。あなたの回答は外向きの成長を示唆していました。正しいフレームは「御社のやり方を習得し、その枠組みの中で継続的に改善したい」です。",
    en_advice: "Replace 'I want to grow' with 'I want to deepen my contribution.' Replace 'new challenges' with 'mastering this role fully.' These small language shifts signal the right kind of ambition for a Japanese corporate environment.",
    jp_advice: "「成長したい」を「貢献を深めたい」に置き換えてください。「新しい挑戦」を「この役割を完全に習得する」に変えましょう。これらの小さな言語の変化が、日本の企業環境に適切な野心を示します。",
  },
  {
    dimension: "Cultural Fit", dimension_jp: "文化適合",
    score: 4,
    en_analysis: "Cultural fit is the hardest dimension to score well on as a foreigner because it is evaluated holistically across everything you say. Your interview showed awareness that Japanese work culture exists but not deep familiarity with its specific mechanics — wa, nemawashi, keigo, the role of silence. These gaps were visible to an experienced Japanese HR manager.",
    jp_analysis: "文化的適合性は、外国人にとって最もスコアを上げにくい側面です。なぜなら、話すすべてのことにわたって総合的に評価されるからです。あなたの面接は日本の職場文化の存在を認識していることを示しましたが、その具体的なメカニズム（和、根回し、敬語、沈黙の役割）への深い親しみは示せていませんでした。",
    en_advice: "Before your next interview, study these four concepts specifically: wa (group harmony), nemawashi (building consensus before decisions), keigo (formal language), and ma (the use of silence). You do not need to be perfect — you need to demonstrate awareness. Mentioning one of these concepts in your answer scores significantly higher than ignoring all of them.",
    jp_advice: "次の面接前に、特にこの4つの概念を学んでください：和（グループの調和）、根回し（決定前のコンセンサス構築）、敬語（フォーマルな言語）、間（沈黙の使用）。完璧である必要はありません。認識を示すことが重要です。",
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 8) return "#2E8B57";
  if (score >= 6) return "#2E75C8";
  if (score >= 4) return "#E8A838";
  return "#E84855";
}

function ScoreBar({ label, labelJp, score, delay }: { label: string; labelJp: string; score: number; delay: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((score / 10) * 100), delay);
    return () => clearTimeout(t);
  }, [score, delay]);
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <div>
          <span style={{ color: "#E2E8F0", fontSize: "13px", fontWeight: 600 }}>{label}</span>
          <span style={{ color: "rgba(226,232,240,0.35)", fontSize: "12px", marginLeft: "8px" }}>{labelJp}</span>
        </div>
        <span style={{ color: scoreColor(score), fontSize: "13px", fontWeight: 700 }}>{score}/10</span>
      </div>
      <div style={{ height: "4px", backgroundColor: "#1E2A3A", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${width}%`, backgroundColor: scoreColor(score), borderRadius: "2px", transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function OverallBadge({ score }: { score: number }) {
  const label = score >= 8 ? "Strong" : score >= 6 ? "Developing" : score >= 4 ? "Needs Work" : "Critical";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: `3px solid ${scoreColor(score)}`, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${scoreColor(score)}22` }}>
        <span style={{ color: scoreColor(score), fontSize: "22px", fontWeight: 800 }}>{score.toFixed(1)}</span>
      </div>
      <span style={{ color: scoreColor(score), fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

// ─── FULL REPORT SECTION ──────────────────────────────────────────
function FullReportSection({ sections }: { sections: FullDebriefSection[] }) {
  const [expandedLang, setExpandedLang] = useState<"en" | "jp" | "both">("both");

  return (
    <div style={{ marginTop: "48px", borderTop: "1px solid #1E2A3A", paddingTop: "40px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p style={{ color: "#E84855", fontSize: "11px", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "4px" }}>Full Debrief Report</p>
          <p style={{ color: "rgba(226,232,240,0.40)", fontSize: "13px" }}>Complete dimension-by-dimension analysis with bilingual coaching notes</p>
        </div>
        {/* Language toggle */}
        <div style={{ display: "flex", border: "1px solid #1E2A3A", borderRadius: "6px", overflow: "hidden" }}>
          {(["en", "jp", "both"] as const).map((lang) => (
            <button key={lang} onClick={() => setExpandedLang(lang)} style={{
              padding: "6px 14px", fontSize: "12px", fontWeight: expandedLang === lang ? 600 : 400,
              backgroundColor: expandedLang === lang ? "#1E2A3A" : "transparent",
              color: expandedLang === lang ? "#E2E8F0" : "rgba(226,232,240,0.35)",
              border: "none", borderRight: lang !== "both" ? "1px solid #1E2A3A" : "none",
              cursor: "pointer",
            }}>
              {lang === "en" ? "EN" : lang === "jp" ? "日本語" : "Both"}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {sections.map((sec, i) => (
          <div key={i} style={{
            border: "1px solid #1E2A3A",
            borderRadius: "10px",
            overflow: "hidden",
            animation: "fadeIn 0.5s ease forwards",
            animationDelay: `${i * 0.08}s`,
            opacity: 0,
          }}>
            {/* Section header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #1E2A3A", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0D1117" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: `2px solid ${scoreColor(sec.score)}`, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${scoreColor(sec.score)}15` }}>
                  <span style={{ color: scoreColor(sec.score), fontSize: "12px", fontWeight: 800 }}>{sec.score}</span>
                </div>
                <div>
                  <p style={{ color: "#E2E8F0", fontWeight: 700, fontSize: "15px" }}>{sec.dimension}</p>
                  <p style={{ color: "#2E75C8", fontSize: "12px" }}>{sec.dimension_jp}</p>
                </div>
              </div>
              <div style={{ height: "4px", width: "100px", backgroundColor: "#1E2A3A", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(sec.score / 10) * 100}%`, backgroundColor: scoreColor(sec.score), borderRadius: "2px" }} />
              </div>
            </div>

            {/* Analysis */}
            <div style={{ padding: "20px", display: "grid", gridTemplateColumns: expandedLang === "both" ? "1fr 1fr" : "1fr", gap: "20px" }}>

              {/* EN analysis */}
              {(expandedLang === "en" || expandedLang === "both") && (
                <div>
                  <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "10px" }}>
                    Analysis
                  </p>
                  <p style={{ color: "rgba(226,232,240,0.70)", fontSize: "13px", lineHeight: 1.75, marginBottom: "16px" }}>
                    {sec.en_analysis}
                  </p>
                  <div style={{ borderLeft: "2px solid #2E8B57", paddingLeft: "12px" }}>
                    <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "6px" }}>Advice</p>
                    <p style={{ color: "#E2E8F0", fontSize: "13px", lineHeight: 1.75 }}>{sec.en_advice}</p>
                  </div>
                </div>
              )}

              {/* JP analysis */}
              {(expandedLang === "jp" || expandedLang === "both") && (
                <div style={{ borderLeft: expandedLang === "both" ? "1px solid #1E2A3A" : "none", paddingLeft: expandedLang === "both" ? "20px" : "0" }}>
                  <p style={{ color: "rgba(46,117,200,0.60)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "10px" }}>
                    分析
                  </p>
                  <p style={{ color: "rgba(226,232,240,0.70)", fontSize: "13px", lineHeight: 1.85, marginBottom: "16px" }}>
                    {sec.jp_analysis}
                  </p>
                  <div style={{ borderLeft: "2px solid #2E75C8", paddingLeft: "12px" }}>
                    <p style={{ color: "rgba(46,117,200,0.60)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "6px" }}>アドバイス</p>
                    <p style={{ color: "#E2E8F0", fontSize: "13px", lineHeight: 1.85 }}>{sec.jp_advice}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom note */}
      <div style={{ marginTop: "32px", padding: "16px 20px", border: "1px solid #1E2A3A", borderRadius: "8px", textAlign: "center" }}>
        <p style={{ color: "rgba(226,232,240,0.25)", fontSize: "12px" }}>
          This debrief was generated based on your interview responses and Japanese HR cultural standards.
          <br />
          <span style={{ color: "#2E75C8" }}>採用コーチ SAIKO</span> — AI-powered Japanese interview preparation
        </p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function DebriefPage() {
  const router = useRouter();
  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [activeTab, setActiveTab] = useState<"monologue" | "rewrites" | "flag">("monologue");
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState("—");
  const [generatingFull, setGeneratingFull] = useState(false);
  const [fullReport, setFullReport] = useState<FullDebriefSection[] | null>(null);

  useEffect(() => {
    const c = sessionStorage.getItem("saiko_company");
    if (c) setCompany(c.charAt(0).toUpperCase() + c.slice(1));
    const fetchDebrief = async () => {
      const sessionId = sessionStorage.getItem("saiko_session_id");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/debrief`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        if (!res.ok) throw new Error();
        setDebrief(await res.json());
      } catch {
        await new Promise((r) => setTimeout(r, 1200));
        setDebrief(MOCK_DEBRIEF);
      } finally { setLoading(false); }
    };
    fetchDebrief();
  }, []);

  const handleGenerateFull = async () => {
    setGeneratingFull(true);
    try {
      const sessionId = sessionStorage.getItem("saiko_session_id");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/debrief/full`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFullReport(data.sections);
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
      setFullReport(MOCK_FULL_REPORT);
    } finally { setGeneratingFull(false); }
    setTimeout(() => {
      document.getElementById("full-report")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  const radarData = debrief ? [
    { dimension: "自己PR", score: debrief.scores.jiko_pr },
    { dimension: "志望動機", score: debrief.scores.shibou_douki },
    { dimension: "協調性", score: debrief.scores.kyouchousei },
    { dimension: "成長意欲", score: debrief.scores.seichou_iyoku },
    { dimension: "文化適合", score: debrief.scores.bunka_tekigou },
  ] : [];

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#0A0A0F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
        <div style={{ width: "40px", height: "40px", border: "2px solid #1E2A3A", borderTop: "2px solid #E84855", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "rgba(226,232,240,0.40)", fontSize: "13px", letterSpacing: "0.15em", textTransform: "uppercase" }}>Generating your debrief...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (!debrief) return null;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0A0A0F", color: "#E2E8F0" }}>

      {/* Header */}
      <div style={{ padding: "20px 28px", borderBottom: "1px solid #1E2A3A", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ color: "#E84855", fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>SAIKO — Interview Debrief</p>
          <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "12px", marginTop: "2px" }}>{company} Interview</p>
        </div>
        <button onClick={() => router.push("/onboard")} style={{ padding: "6px 16px", backgroundColor: "transparent", color: "rgba(226,232,240,0.40)", border: "1px solid #1E2A3A", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>
          Try Again
        </button>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>

        {/* Main two-col grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>

          {/* LEFT — Scores */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px", padding: "20px 24px", border: "1px solid #1E2A3A", borderRadius: "8px" }}>
              <OverallBadge score={debrief.overall_score} />
              <div>
                <p style={{ color: "#E2E8F0", fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>Overall Score</p>
                <p style={{ color: "rgba(226,232,240,0.40)", fontSize: "13px" }}>Across 5 Japanese HR dimensions</p>
              </div>
            </div>

            <div style={{ padding: "24px", border: "1px solid #1E2A3A", borderRadius: "8px", marginBottom: "24px" }}>
              <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "20px" }}>Dimension Breakdown</p>
              <ScoreBar label="Self-Presentation" labelJp="自己PR" score={debrief.scores.jiko_pr} delay={100} />
              <ScoreBar label="Motivation" labelJp="志望動機" score={debrief.scores.shibou_douki} delay={200} />
              <ScoreBar label="Team Orientation" labelJp="協調性" score={debrief.scores.kyouchousei} delay={300} />
              <ScoreBar label="Growth Mindset" labelJp="成長意欲" score={debrief.scores.seichou_iyoku} delay={400} />
              <ScoreBar label="Cultural Fit" labelJp="文化適合" score={debrief.scores.bunka_tekigou} delay={500} />
            </div>

            <div style={{ padding: "24px", border: "1px solid #1E2A3A", borderRadius: "8px" }}>
              <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "16px" }}>Performance Radar</p>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1E2A3A" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: "rgba(226,232,240,0.40)", fontSize: 12 }} />
                  <Radar name="Score" dataKey="score" stroke="#E84855" fill="#E84855" fillOpacity={0.12} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT — Tabs */}
          <div>
            <div style={{ display: "flex", marginBottom: "24px", border: "1px solid #1E2A3A", borderRadius: "8px", overflow: "hidden" }}>
              {(["monologue", "rewrites", "flag"] as const).map((tab, i) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: "12px 8px",
                  backgroundColor: activeTab === tab ? "#1E2A3A" : "transparent",
                  color: activeTab === tab ? "#E2E8F0" : "rgba(226,232,240,0.35)",
                  border: "none", borderRight: i < 2 ? "1px solid #1E2A3A" : "none",
                  fontSize: "12px", fontWeight: activeTab === tab ? 600 : 400,
                  cursor: "pointer",
                }}>
                  {tab === "monologue" ? "What HR Thought" : tab === "rewrites" ? "How to Fix It" : "Company Notes"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* MONOLOGUE */}
              {activeTab === "monologue" && debrief.monologue.map((entry, i) => (
                <div key={i} style={{ border: "1px solid #1E2A3A", borderLeft: "3px solid #E84855", borderRadius: "8px", padding: "20px", animation: "fadeIn 0.4s ease forwards", opacity: 0 }}>
                  <p style={{ color: "rgba(226,232,240,0.35)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px" }}>Q{i + 1}</p>
                  <p style={{ color: "#E2E8F0", fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>{entry.question}</p>
                  <p style={{ color: "#2E75C8", fontSize: "12px", marginBottom: "12px" }}>{entry.question_jp}</p>
                  <p style={{ color: "rgba(226,232,240,0.40)", fontSize: "12px", marginBottom: "12px", fontStyle: "italic" }}>You said: {entry.user_answer_summary}</p>
                  <div style={{ backgroundColor: "rgba(232,72,85,0.05)", border: "1px solid rgba(232,72,85,0.15)", borderRadius: "6px", padding: "14px", marginBottom: "10px" }}>
                    <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px" }}>HR Internal Monologue</p>
                    <p style={{ color: "rgba(226,232,240,0.75)", fontSize: "13px", lineHeight: 1.7, fontStyle: "italic", marginBottom: "10px" }}>&ldquo;{entry.hr_thought}&rdquo;</p>
                    <p style={{ color: "#2E75C8", fontSize: "12px", lineHeight: 1.6, fontStyle: "italic", borderTop: "1px solid rgba(46,117,200,0.15)", paddingTop: "10px" }}>「{entry.hr_thought_jp}」</p>
                  </div>
                  <p style={{ color: "#E84855", fontSize: "11px", fontWeight: 600 }}>{entry.score_impact}</p>
                </div>
              ))}

              {/* REWRITES */}
              {activeTab === "rewrites" && debrief.rewrites.map((entry, i) => (
                <div key={i} style={{ border: "1px solid #1E2A3A", borderRadius: "8px", padding: "20px", animation: "fadeIn 0.4s ease forwards", opacity: 0 }}>
                  <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "12px" }}>{entry.dimension_affected}</p>
                  <div style={{ marginBottom: "10px" }}>
                    <p style={{ color: "#E84855", fontSize: "11px", fontWeight: 600, marginBottom: "6px" }}>✕ What you said</p>
                    <p style={{ backgroundColor: "rgba(232,72,85,0.06)", border: "1px solid rgba(232,72,85,0.15)", borderRadius: "6px", padding: "12px", color: "rgba(226,232,240,0.60)", fontSize: "13px", fontStyle: "italic" }}>&ldquo;{entry.original_phrase}&rdquo;</p>
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <p style={{ color: "#2E8B57", fontSize: "11px", fontWeight: 600, marginBottom: "6px" }}>✓ Say this instead</p>
                    <p style={{ backgroundColor: "rgba(46,139,87,0.06)", border: "1px solid rgba(46,139,87,0.20)", borderRadius: "6px", padding: "12px", color: "#E2E8F0", fontSize: "13px", fontStyle: "italic", marginBottom: "6px" }}>&ldquo;{entry.replacement_phrase}&rdquo;</p>
                    <p style={{ backgroundColor: "rgba(46,117,200,0.06)", border: "1px solid rgba(46,117,200,0.15)", borderRadius: "6px", padding: "12px", color: "#2E75C8", fontSize: "12px", fontStyle: "italic" }}>「{entry.replacement_phrase_jp}」</p>
                  </div>
                  <p style={{ color: "rgba(226,232,240,0.40)", fontSize: "12px", lineHeight: 1.6, marginBottom: "6px" }}>{entry.why_it_works}</p>
                  <p style={{ color: "rgba(46,117,200,0.60)", fontSize: "12px", lineHeight: 1.6 }}>{entry.why_it_works_jp}</p>
                </div>
              ))}

              {/* COMPANY FLAG */}
              {activeTab === "flag" && (
                <div style={{ border: "1px solid #1E2A3A", borderLeft: "3px solid #E8A838", borderRadius: "8px", padding: "24px", animation: "fadeIn 0.4s ease forwards" }}>
                  <p style={{ color: "#E8A838", fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "12px" }}>{company} — Specific Warning</p>
                  <p style={{ color: "rgba(226,232,240,0.75)", fontSize: "14px", lineHeight: 1.8, marginBottom: "16px" }}>{debrief.company_flag}</p>
                  <div style={{ borderTop: "1px solid rgba(46,117,200,0.15)", paddingTop: "14px" }}>
                    <p style={{ color: "rgba(46,117,200,0.50)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px" }}>日本語</p>
                    <p style={{ color: "rgba(46,117,200,0.80)", fontSize: "13px", lineHeight: 1.8 }}>{debrief.company_flag_jp}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── GENERATE FULL DEBRIEF BUTTON ─────────────────────────── */}
        {!fullReport && (
          <div style={{ marginTop: "48px", textAlign: "center" }}>
            <div style={{ width: "1px", height: "40px", backgroundColor: "#1E2A3A", margin: "0 auto 28px" }} />
            <p style={{ color: "rgba(226,232,240,0.30)", fontSize: "13px", marginBottom: "20px" }}>
              Want a complete dimension-by-dimension coaching report in English and Japanese?
            </p>
            <button
              onClick={handleGenerateFull}
              disabled={generatingFull}
              style={{
                padding: "16px 48px",
                backgroundColor: generatingFull ? "#1E2A3A" : "#E84855",
                color: generatingFull ? "#64748B" : "#fff",
                border: "none", borderRadius: "6px",
                fontSize: "15px", fontWeight: 700,
                cursor: generatingFull ? "not-allowed" : "pointer",
                letterSpacing: "0.05em",
                transition: "all 0.2s ease",
                display: "inline-flex", alignItems: "center", gap: "10px",
              }}
            >
              {generatingFull ? (
                <>
                  <div style={{ width: "14px", height: "14px", border: "2px solid #64748B", borderTop: "2px solid #E84855", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Generating full debrief...
                </>
              ) : (
                <>
                  Generate Full Debrief — EN / 日本語
                </>
              )}
            </button>
            <p style={{ color: "rgba(226,232,240,0.18)", fontSize: "11px", marginTop: "10px" }}>
              Full analysis with bilingual coaching notes for all 5 dimensions
            </p>
          </div>
        )}

        {/* ── FULL REPORT ───────────────────────────────────────────── */}
        {fullReport && (
          <div id="full-report">
            <FullReportSection sections={fullReport} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
