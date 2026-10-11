import { useEffect, useRef, useState } from "react";
import {
  BILINGUAL_PAIRS,
  INSTRUCTION_LANGUAGES,
  bilingualToken,
  formatInstructionLanguagesLabel,
  instructionTokens,
  normalizeInstructionLanguages,
  toggleInstructionToken,
} from "../../admin/languages";

type LanguageSelectProps = {
  value: string;
  onChange: (next: string) => void;
};

export default function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = normalizeInstructionLanguages(value);
  const tokens = new Set(instructionTokens(selected));
  const label = formatInstructionLanguagesLabel(selected, "билингв.");

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  function toggle(token: string) {
    onChange(toggleInstructionToken(selected, token));
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id="school-languages"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {label ? label : <span className="text-gray-400">Не выбраны</span>}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-lg">
          <p className="px-2 py-1 text-xs font-medium text-gray-500">Один язык</p>
          {INSTRUCTION_LANGUAGES.map((code) => (
            <label
              key={code}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={tokens.has(code)}
                onChange={() => toggle(code)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {code}
            </label>
          ))}
          <p className="px-2 pb-1 pt-2 text-xs font-medium text-gray-500">Билингвальная</p>
          {BILINGUAL_PAIRS.map((pair) => {
            const token = bilingualToken(pair);
            return (
              <label
                key={token}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={tokens.has(token)}
                  onChange={() => toggle(token)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                {`билингв. ${pair[0]}/${pair[1]}`}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
