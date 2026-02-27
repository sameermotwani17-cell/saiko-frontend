"use client";

import { useSession } from "@/context/SessionContext";

export default function LanguageSelector() {
  const { language_mode, setLanguageMode } = useSession();

  const options: {
    value: "japanese" | "english";
    label: string;
    description: string;
  }[] = [
    {
      value: "japanese",
      label: "This role requires Japanese",
      description:
        "Interview conducted in Japanese with English subtitles. The real experience.",
    },
    {
      value: "english",
      label: "This role is English-friendly",
      description:
        "Interview conducted in formal English with Japanese HR tone and expectations.",
    },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Language mode</h3>
      <p className="text-sm text-primary-text/40 mb-6">
        Choose how the interview will be conducted.
      </p>

      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setLanguageMode(opt.value)}
            className={`w-full text-left p-5 rounded-lg border transition-all duration-200 ${
              language_mode === opt.value
                ? "border-accent bg-accent/10"
                : "border-border hover:border-primary-text/20"
            }`}
          >
            <h4
              className={`font-semibold mb-1 ${
                language_mode === opt.value
                  ? "text-accent"
                  : "text-primary-text"
              }`}
            >
              {opt.label}
            </h4>
            <p className="text-sm text-primary-text/50">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}