"use client";

interface CompanyCardProps {
  name: string;
  personality: string;
  selected: boolean;
  onClick: () => void;
}

export default function CompanyCard({
  name,
  personality,
  selected,
  onClick,
}: CompanyCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-lg border transition-all duration-200 ${
        selected
          ? "border-accent bg-accent/10"
          : "border-border hover:border-primary-text/20 bg-transparent"
      }`}
    >
      <h3
        className={`font-semibold text-lg mb-1 ${
          selected ? "text-accent" : "text-primary-text"
        }`}
      >
        {name}
      </h3>
      <p className="text-sm text-primary-text/50">{personality}</p>
    </button>
  );
}