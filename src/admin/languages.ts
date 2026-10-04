export const INSTRUCTION_LANGUAGES = ["GE", "EN", "RU", "DE", "FR"] as const;
export type InstructionLanguage = (typeof INSTRUCTION_LANGUAGES)[number];

export function parseInstructionLanguages(value: string): InstructionLanguage[] {
  const found = new Set(
    value
      .split(/[^a-zA-Z]+/)
      .map((part) => part.trim().toUpperCase())
      .filter(Boolean)
  );
  return INSTRUCTION_LANGUAGES.filter((code) => found.has(code));
}

export function formatInstructionLanguages(selected: readonly string[]): string {
  const found = new Set(selected.map((code) => code.toUpperCase()));
  return INSTRUCTION_LANGUAGES.filter((code) => found.has(code)).join("/");
}
