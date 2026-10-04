import { useEffect, useRef, useState } from "react";
import {
  INSTRUCTION_LANGUAGES,
  type InstructionLanguage,
} from "../../admin/languages";

type LanguageSelectProps = {
  value: InstructionLanguage[];
  onChange: (next: InstructionLanguage[]) => void;
};

export default function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  function toggle(code: InstructionLanguage) {
    if (value.includes(code)) {
      onChange(value.filter((item) => item !== code));
      return;
    }
    onChange(INSTRUCTION_LANGUAGES.filter((item) => item === code || value.includes(item)));
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {value.length > 0 ? value.join(", ") : <span className="text-gray-400">Не выбраны</span>}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white p-2 shadow-lg">
          {INSTRUCTION_LANGUAGES.map((code) => (
            <label key={code} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={value.includes(code)}
                onChange={() => toggle(code)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {code}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
