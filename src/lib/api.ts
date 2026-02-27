const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadCV(file: File): Promise<{
  session_id: string;
  name: string;
  background: string;
  target_role: string;
}> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/cv`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload CV");
  }

  return res.json();
}

export async function startInterview(params: {
  session_id: string;
  company: string;
  language_mode: "japanese" | "english";
}): Promise<{
  response_text: string;
  response_text_en?: string;
  audio_base64?: string;
}> {
  const res = await fetch(`${API_URL}/api/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error("Failed to start interview");
  }

  return res.json();
}

export async function sendVoice(params: {
  session_id: string;
  audio_base64: string;
}): Promise<{
  response_text: string;
  response_text_en?: string;
  audio_base64?: string;
  interview_complete: boolean;
}> {
  const res = await fetch(`${API_URL}/api/voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error("Failed to send voice");
  }

  return res.json();
}

export async function getDebrief(session_id: string): Promise<{
  overall_score: number;
  scores: { dimension: string; dimension_en: string; score: number }[];
  questions: {
    question: string;
    answer_summary: string;
    hr_monologue: string;
    score_penalty?: string;
  }[];
  rewrites: {
    original: string;
    replacement: string;
    reason: string;
  }[];
  company_notes: string;
}> {
  const res = await fetch(`${API_URL}/api/debrief/${session_id}`, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error("Failed to get debrief");
  }

  return res.json();
}