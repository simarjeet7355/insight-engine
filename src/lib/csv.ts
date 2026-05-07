import Papa from "papaparse";

export type Row = Record<string, any>;
export type ColType = "number" | "date" | "category";
export type ColumnMeta = { name: string; type: ColType };

export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
];

export function detectType(values: any[]): ColType {
  const sample = values.filter((v) => v !== null && v !== undefined && v !== "").slice(0, 50);
  if (sample.length === 0) return "category";
  const numCount = sample.filter(
    (v) => typeof v === "number" || (!isNaN(Number(v)) && v !== true && v !== false)
  ).length;
  if (numCount / sample.length > 0.8) return "number";
  const dateCount = sample.filter((v) => !isNaN(Date.parse(String(v)))).length;
  if (dateCount / sample.length > 0.8 && typeof sample[0] === "string") return "date";
  return "category";
}

export function inferColumns(rows: Row[]): ColumnMeta[] {
  if (!rows.length) return [];
  return Object.keys(rows[0]).map((name) => ({
    name,
    type: detectType(rows.map((r) => r[name])),
  }));
}

export const fmt = (n: number) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

export function parseCSVFile(file: File): Promise<{ rows: Row[]; columns: ColumnMeta[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Row>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data as Row[];
        resolve({ rows, columns: inferColumns(rows) });
      },
      error: reject,
    });
  });
}

export function aggregateByCategory(rows: Row[], xCol: string, yCol: string, agg: "sum" | "avg" | "count" = "sum") {
  const map = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const k = String(r[xCol] ?? "—");
    const v = Number(r[yCol]);
    if (isNaN(v) && agg !== "count") continue;
    const cur = map.get(k) ?? { sum: 0, count: 0 };
    cur.sum += isNaN(v) ? 0 : v;
    cur.count += 1;
    map.set(k, cur);
  }
  return Array.from(map.entries())
    .map(([name, { sum, count }]) => ({
      name,
      value: agg === "avg" ? sum / count : agg === "count" ? count : sum,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);
}

export function summarize(rows: Row[], col: string) {
  const vals = rows.map((r) => Number(r[col])).filter((v) => !isNaN(v));
  if (!vals.length) return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
  const sum = vals.reduce((a, b) => a + b, 0);
  return {
    sum,
    avg: sum / vals.length,
    min: Math.min(...vals),
    max: Math.max(...vals),
    count: vals.length,
  };
}
