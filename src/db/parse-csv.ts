export type CsvSchool = {
  id: number;
  slug: string;
  name: string;
  address: string;
  coordinates: string;
  languages: string;
  cost?: string;
  program?: string;
  comment?: string;
};

function slugifySchoolName(name: string, index: number): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04FF]/g, "_")
    .substring(0, 50);
  if (!slug || slug.replace(/_/g, "").length === 0) {
    slug = `school_${index}`;
  }
  return slug;
}

export function parseSchoolsCsv(csv: string): CsvSchool[] {
  const lines = csv.split("\n").filter((line) => line.trim() !== "");

  return lines
    .slice(1)
    .map((line, index): CsvSchool | null => {
      const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
      if (!matches) return null;

      const [name, address, coordinates, languages, cost, program, comment] =
        matches.map((s) => s.replace(/^"|"$/g, "").trim());

      return {
        id: index,
        slug: slugifySchoolName(name, index),
        name,
        address,
        coordinates,
        languages,
        cost,
        program,
        comment,
      };
    })
    .filter((school): school is CsvSchool => school !== null);
}
