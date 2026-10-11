import type { CostCurrency } from "../types";

export type GelPerCurrency = Record<CostCurrency, number>;

export type ExchangeRates = {
  source: "National Bank of Georgia";
  date: string;
  gelPer: GelPerCurrency;
};

const NBG_URL = "https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?currencies=USD,EUR";
const TTL_MS = 6 * 60 * 60 * 1000;

let cached: { at: number; rates: ExchangeRates } | null = null;

type NbgCurrency = { code?: string; rate?: number; quantity?: number };
type NbgDay = { date?: string; currencies?: NbgCurrency[] };

function gelPerUnit(item: NbgCurrency): number | null {
  const rate = item.rate;
  const quantity = item.quantity;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) return null;
  if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) return null;
  return rate / quantity;
}

export async function loadExchangeRates(): Promise<ExchangeRates | null> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.rates;
  try {
    const response = await fetch(NBG_URL, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return cached?.rates ?? null;
    const body = (await response.json()) as NbgDay[];
    const day = body[0];
    const currencies = day?.currencies ?? [];
    const usd = currencies.find((item) => item.code === "USD");
    const eur = currencies.find((item) => item.code === "EUR");
    const gelPerUsd = usd ? gelPerUnit(usd) : null;
    const gelPerEur = eur ? gelPerUnit(eur) : null;
    if (gelPerUsd == null || gelPerEur == null) return cached?.rates ?? null;
    const rates: ExchangeRates = {
      source: "National Bank of Georgia",
      date: typeof day?.date === "string" ? day.date : new Date().toISOString(),
      gelPer: { USD: gelPerUsd, EUR: gelPerEur, GEL: 1 },
    };
    cached = { at: Date.now(), rates };
    return rates;
  } catch {
    return cached?.rates ?? null;
  }
}
