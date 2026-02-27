"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface CvData {
  name: string;
  background: string;
  target_role: string;
}

export interface ConversationEntry {
  role: "interviewer" | "user";
  text: string;
  text_en?: string;
}

export interface DimensionScore {
  dimension: string;
  dimension_en: string;
  score: number;
}

export interface QuestionDebrief {
  question: string;
  answer_summary: string;
  hr_monologue: string;
  score_penalty?: string;
}

export interface RewriteSuggestion {
  original: string;
  replacement: string;
  reason: string;
}

export interface DebriefData {
  overall_score: number;
  scores: DimensionScore[];
  questions: QuestionDebrief[];
  rewrites: RewriteSuggestion[];
  company_notes: string;
}

interface SessionState {
  session_id: string | null;
  cv_data: CvData | null;
  company: string | null;
  language_mode: "japanese" | "english" | null;
  conversation_history: ConversationEntry[];
  scores: DimensionScore[];
  debrief_data: DebriefData | null;
}

interface SessionContextType extends SessionState {
  setSessionId: (id: string) => void;
  setCvData: (data: CvData) => void;
  setCompany: (company: string) => void;
  setLanguageMode: (mode: "japanese" | "english") => void;
  addConversationEntry: (entry: ConversationEntry) => void;
  setScores: (scores: DimensionScore[]) => void;
  setDebriefData: (data: DebriefData) => void;
  resetSession: () => void;
}

const initialState: SessionState = {
  session_id: null,
  cv_data: null,
  company: null,
  language_mode: null,
  conversation_history: [],
  scores: [],
  debrief_data: null,
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState);

  const setSessionId = (id: string) =>
    setState((prev) => ({ ...prev, session_id: id }));

  const setCvData = (data: CvData) =>
    setState((prev) => ({ ...prev, cv_data: data }));

  const setCompany = (company: string) =>
    setState((prev) => ({ ...prev, company }));

  const setLanguageMode = (mode: "japanese" | "english") =>
    setState((prev) => ({ ...prev, language_mode: mode }));

  const addConversationEntry = (entry: ConversationEntry) =>
    setState((prev) => ({
      ...prev,
      conversation_history: [...prev.conversation_history, entry],
    }));

  const setScores = (scores: DimensionScore[]) =>
    setState((prev) => ({ ...prev, scores }));

  const setDebriefData = (data: DebriefData) =>
    setState((prev) => ({ ...prev, debrief_data: data }));

  const resetSession = () => setState(initialState);

  return (
    <SessionContext.Provider
      value={{
        ...state,
        setSessionId,
        setCvData,
        setCompany,
        setLanguageMode,
        addConversationEntry,
        setScores,
        setDebriefData,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}