"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import CVUpload from "@/components/CVUpload";
import CompanySelector from "@/components/CompanySelector";
import LanguageSelector from "@/components/LanguageSelector";

export default function OnboardPage() {
  const router = useRouter();
  const { cv_data, company, language_mode } = useSession();
  const [currentStep, setCurrentStep] = useState(1);

  const allComplete = cv_data !== null && company !== null && language_mode !== null;

  const handleReady = () => {
    if (allComplete) {
      router.push("/interview");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-sm font-semibold tracking-[0.3em] uppercase text-accent mb-2">
            SAIKO
          </h1>
          <p className="text-primary-text/40 text-sm">Prepare your interview</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-3 mb-10">
          {[1, 2, 3].map((step) => {
            const isComplete =
              (step === 1 && cv_data !== null) ||
              (step === 2 && company !== null) ||
              (step === 3 && language_mode !== null);
            const isActive = currentStep === step;

            return (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-border text-primary-text"
                    : isComplete
                    ? "bg-border/50 text-accent"
                    : "bg-transparent text-primary-text/30 border border-border"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    isComplete
                      ? "bg-accent text-white"
                      : isActive
                      ? "bg-primary-text/20 text-primary-text"
                      : "bg-border text-primary-text/30"
                  }`}
                >
                  {isComplete ? "✓" : step}
                </span>
                <span>
                  {step === 1 && "CV Upload"}
                  {step === 2 && "Company"}
                  {step === 3 && "Language"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="mb-10">
          {currentStep === 1 && (
            <CVUpload onComplete={() => setCurrentStep(2)} />
          )}
          {currentStep === 2 && (
            <CompanySelector onComplete={() => setCurrentStep(3)} />
          )}
          {currentStep === 3 && <LanguageSelector />}
        </div>

        {/* Ready Button */}
        <div className="flex justify-center">
          <button
            onClick={handleReady}
            disabled={!allComplete}
            className={`font-semibold text-lg px-12 py-4 rounded transition-all duration-200 ${
              allComplete
                ? "bg-accent hover:bg-accent/90 text-white cursor-pointer"
                : "bg-border text-primary-text/20 cursor-not-allowed"
            }`}
          >
            I&apos;m Ready
          </button>
        </div>
      </div>
    </main>
  );
}