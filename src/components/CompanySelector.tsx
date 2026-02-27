"use client";

import { useSession } from "@/context/SessionContext";
import CompanyCard from "@/components/CompanyCard";

const companies = [
  {
    name: "Rakuten",
    personality: "Meritocratic and fast-paced. Values global ambition.",
  },
  {
    name: "Toyota",
    personality: "Process-driven and humble. Values kaizen mindset.",
  },
  {
    name: "Sony",
    personality: "Creative and technical. Values bold ideas with substance.",
  },
  {
    name: "SoftBank",
    personality: "Visionary and aggressive. Values conviction and scale.",
  },
  {
    name: "Uniqlo",
    personality: "Customer-obsessed and disciplined. Values execution.",
  },
];

interface CompanySelectorProps {
  onComplete: () => void;
}

export default function CompanySelector({ onComplete }: CompanySelectorProps) {
  const { company, setCompany } = useSession();

  const handleSelect = (name: string) => {
    setCompany(name);
    onComplete();
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Select a company</h3>
      <p className="text-sm text-primary-text/40 mb-6">
        Each company has a different hiring personality. Choose who you want to
        face.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {companies.map((c) => (
          <CompanyCard
            key={c.name}
            name={c.name}
            personality={c.personality}
            selected={company === c.name}
            onClick={() => handleSelect(c.name)}
          />
        ))}
      </div>
    </div>
  );
}