export type SeriesPoint = { at: string; value: number; publishedAt?: string };
export type Notice = { id: number; title: string; unit: string; status: string; from: string; to: string; unavailableMw: number | null; publishedAt: string };
export type Insights = {
  retrievedAt: string; frequency: { at: string; hz: number; delayed: boolean } | null;
  demand: SeriesPoint[]; demandForecast: SeriesPoint[]; windForecast: SeriesPoint[];
  carbonForecast: SeriesPoint[]; notices: Notice[]; errors: string[];
};
