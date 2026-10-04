const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 30;
const hits = new Map<string, number[]>();

export function allowAssistantRequest(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}
