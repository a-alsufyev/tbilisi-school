import { parseInstructionLanguages, type InstructionLanguage } from "../admin/languages";
import { confirmedInternationalStatuses } from "../lib/lookups";
import type { School } from "../types";

const LANGUAGE_TONE: Record<InstructionLanguage, string> = {
  EN: "bg-sky-100 text-sky-800",
  RU: "bg-emerald-100 text-emerald-800",
  GE: "bg-rose-100 text-rose-800",
  DE: "bg-amber-100 text-amber-800",
  FR: "bg-violet-100 text-violet-800",
};

const base = "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap";

type SchoolBadgesProps = {
  school: School;
  /** Max programme badges before collapsing into "+N". */
  maxPrograms?: number;
  className?: string;
};

export default function SchoolBadges({ school, maxPrograms = 2, className = "" }: SchoolBadgesProps) {
  const languages = parseInstructionLanguages(school.languages);
  const programs = school.programs.slice(0, maxPrograms);
  const hiddenPrograms = school.programs.length - programs.length;
  const statuses = confirmedInternationalStatuses(school.internationalStatuses);
  const international = statuses.length > 0;

  if (languages.length === 0 && programs.length === 0 && !international) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {languages.map((code) => (
        <span key={code} className={`${base} ${LANGUAGE_TONE[code] ?? "bg-gray-100 text-gray-700"}`}>
          {code}
        </span>
      ))}
      {international && (
        <span className={`${base} bg-amber-400 text-amber-950`} title={statuses.join(", ")}>
          ★ {statuses[0]}
        </span>
      )}
      {programs.map((program) => (
        <span key={program} className={`${base} bg-indigo-100 text-indigo-800`}>
          {program}
        </span>
      ))}
      {hiddenPrograms > 0 && <span className={`${base} bg-gray-100 text-gray-600`}>+{hiddenPrograms}</span>}
    </div>
  );
}
