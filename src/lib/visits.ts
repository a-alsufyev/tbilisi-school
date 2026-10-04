import { getVisitTotal, incrementVisitTotal } from "../db/queries";

export type VisitStats = {
  total: number;
};

export async function getVisitStats(): Promise<VisitStats> {
  return { total: await getVisitTotal() };
}

export async function incrementVisitStats(): Promise<VisitStats> {
  return { total: await incrementVisitTotal() };
}
