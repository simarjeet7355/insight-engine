import { useMemo, useState, useCallback } from "react";
import Papa from "papaparse";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, AreaChart, Area,
} from "recharts";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, BarChart3, ArrowUpDown, X, Database, TrendingUp, Plus, LayoutDashboard, Trash2 } from "lucide-react";

type Row = Record<string, any>;
type ColType = "number" | "date" | "category";
type ChartKind = "bar" | "line" | "area" | "pie" | "scatter";
type Widget = { id: string; kind: ChartKind; x: string; y: string };

const COLORS = ["hsl(221 83% 53%)", "hsl(142 71% 45%)", "hsl(262 83% 58%)", "hsl(346 77% 50%)", "hsl(38 92% 50%)", "hsl(199 89% 48%)", "hsl(280 65% 60%)", "hsl(173 58% 39%)"];

function detectType(values: any[]): ColType {
  const sample = values.filter(v => v !== null && v !== undefined && v !== "").slice(0, 50);
  if (sample.length === 0) return "category";
  const numCount = sample.filter(v => typeof v === "number" || (!isNaN(Number(v)) && v !== true && v !== false)).length;
  if (numCount / sample.length > 0.8) return "number";
  const dateCount = sample.filter(v => !isNaN(Date.parse(String(v)))).length;
  if (dateCount / sample.length > 0.8 && typeof sample[0] === "string") return "date";
  return "category";
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const Index = () => {
  const [data, setData] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [chartXCol, setChartXCol] = useState<string>("");
  const [chartYCol, setChartYCol] = useState<string>("");
  const [groupCol, setGroupCol] = useState<string>("");
  const [widgets, setWidgets] = useState<Widget[]>([]);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data as Row[];
        setData(rows);
        setFilters({});
        setSortCol(null);
        if (rows[0]) {
          const cols = Object.keys(rows[0]);
          const types = cols.map(c => ({ c, t: detectType(rows.map(r => r[c])) }));
          const firstCat = types.find(x => x.t === "category" || x.t === "date")?.c || cols[0];
          const firstNum = types.find(x => x.t === "number")?.c || cols[1] || cols[0];
          setChartXCol(firstCat);
          setChartYCol(firstNum);
          const otherCat = types.find(x => (x.t === "category") && x.c !== firstCat)?.c || "";
          setGroupCol(otherCat);
          // Auto-generate dashboard widgets
          const nums = types.filter(x => x.t === "number").map(x => x.c);
          const cats = types.filter(x => x.t !== "number").map(x => x.c);
          const auto: Widget[] = [];
          if (cats[0] && nums[0]) auto.push({ id: "w1", kind: "bar", x: cats[0], y: nums[0] });
          if (cats[0] && nums[1]) auto.push({ id: "w2", kind: "line", x: cats[0], y: nums[1] });
          if (cats[1] && nums[0]) auto.push({ id: "w3", kind: "pie", x: cats[1], y: nums[0] });
          if (nums[0] && nums[1]) auto.push({ id: "w4", kind: "scatter", x: nums[0], y: nums[1] });
          setWidgets(auto);
        }
      },
    });
  }, []);

  const columns = useMemo(() => data[0] ? Object.keys(data[0]) : [], [data]);
  const colTypes = useMemo(() => {
    const m: Record<string, ColType> = {};
    columns.forEach(c => { m[c] = detectType(data.map(r => r[c])); });
    return m;
  }, [columns, data]);

  const numericCols = columns.filter(c => colTypes[c] === "number");
  const categoryCols = columns.filter(c => colTypes[c] !== "number");

  const filtered = useMemo(() => {
    let rows = data;
    Object.entries(filters).forEach(([col, val]) => {
      if (val && val !== "__all__") rows = rows.filter(r => String(r[col]) === val);
    });
    if (sortCol) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortCol], bv = b[sortCol];
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
        return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return rows;
  }, [data, filters, sortCol, sortDir]);

  const kpis = useMemo(() => {
    return numericCols.slice(0, 4).map(col => {
      const vals = filtered.map(r => Number(r[col])).filter(v => !isNaN(v));
      const sum = vals.reduce((a, b) => a + b, 0);
      const avg = vals.length ? sum / vals.length : 0;
      return { col, sum, avg, count: vals.length, max: Math.max(...vals), min: Math.min(...vals) };
    });
  }, [numericCols, filtered]);

  const aggData = useMemo(() => {
    if (!chartXCol || !chartYCol) return [];
    const map = new Map<string, number>();
    filtered.forEach(r => {
      const key = String(r[chartXCol] ?? "—");
      const val = Number(r[chartYCol]) || 0;
      map.set(key, (map.get(key) || 0) + val);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 20);
  }, [filtered, chartXCol, chartYCol]);

  const groupedData = useMemo(() => {
    if (!groupCol) return [];
    const map = new Map<string, number>();
    filtered.forEach(r => {
      const key = String(r[groupCol] ?? "—");
      const val = chartYCol ? Number(r[chartYCol]) || 0 : 1;
      map.set(key, (map.get(key) || 0) + val);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filtered, groupCol, chartYCol]);

  const scatterData = useMemo(() => {
    if (numericCols.length < 2) return [];
    const x = numericCols[0], y = numericCols[1];
    return filtered.slice(0, 500).map(r => ({ x: Number(r[x]), y: Number(r[y]) })).filter(p => !isNaN(p.x) && !isNaN(p.y));
  }, [filtered, numericCols]);

  const uniqueValues = (col: string) => Array.from(new Set(data.map(r => String(r[col] ?? "")))).filter(v => v !== "").slice(0, 100);

  const loadSample = async () => {
    try {
      const res = await fetch("/marketpulse/marketing_campaigns.csv");
      const text = await res.text();
      const blob = new Blob([text], { type: "text/csv" });
      const file = new File([blob], "marketing_campaigns.csv", { type: "text/csv" });
      handleFile(file);
    } catch {
      // fallback: tiny inline sample
      const csv = "channel,region,spend,revenue,conversions\nGoogle,US,1200,4500,42\nMeta,EU,800,2200,28\nGoogle,EU,1500,5100,55\nTikTok,US,600,1800,15\nMeta,US,950,3300,30";
      handleFile(new File([csv], "sample.csv", { type: "text/csv" }));
    }
  };

  const renderWidget = (w: Widget) => {
    if (w.kind === "scatter") {
      const pts = filtered.slice(0, 500).map(r => ({ x: Number(r[w.x]), y: Number(r[w.y]) })).filter(p => !isNaN(p.x) && !isNaN(p.y));
      return (
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="x" name={w.x} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={fmt} />
            <YAxis dataKey="y" name={w.y} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={fmt} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Scatter data={pts} fill={COLORS[1]} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }
    const map = new Map<string, number>();
    filtered.forEach(r => {
      const key = String(r[w.x] ?? "—");
      map.set(key, (map.get(key) || 0) + (Number(r[w.y]) || 0));
    });
    const d = Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 20);
    const tip = <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />;
    if (w.kind === "pie") return (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={d} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
            {d.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          {tip}
        </PieChart>
      </ResponsiveContainer>
    );
    if (w.kind === "line") return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={d}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} angle={-25} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={fmt} />
          {tip}
          <Line type="monotone" dataKey="value" stroke={COLORS[2]} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    );
    if (w.kind === "area") return (
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={d}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} angle={-25} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={fmt} />
          {tip}
          <Area type="monotone" dataKey="value" stroke={COLORS[3]} fill={COLORS[3]} fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    );
    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={d}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} angle={-25} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={fmt} />
          {tip}
          <Bar dataKey="value" fill={COLORS[0]} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const addWidget = () => {
    const x = categoryCols[0] || columns[0];
    const y = numericCols[0] || columns[1] || columns[0];
    setWidgets(ws => [...ws, { id: `w${Date.now()}`, kind: "bar", x, y }]);
  };
  const updateWidget = (id: string, patch: Partial<Widget>) => setWidgets(ws => ws.map(w => w.id === id ? { ...w, ...patch } : w));
  const removeWidget = (id: string) => setWidgets(ws => ws.filter(w => w.id !== id));

  if (!data.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full shadow-lg">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-3xl">MarketPulse Insights</CardTitle>
            <p className="text-muted-foreground">Upload a CSV to get an instant interactive dashboard — KPIs, charts, filters, and sorting.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/60 hover:bg-muted/30 transition-colors">
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium mb-1">Drop your CSV here or click to upload</p>
              <p className="text-sm text-muted-foreground">Auto-detects columns, builds charts & filters</p>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={loadSample}>
              <Database className="w-4 h-4 mr-2" /> Try with sample marketing dataset
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold leading-tight">MarketPulse Insights</h1>
              <p className="text-xs text-muted-foreground">{fileName} · {filtered.length.toLocaleString()} of {data.length.toLocaleString()} rows</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <label>
              <Button variant="outline" size="sm" asChild><span className="cursor-pointer"><Upload className="w-4 h-4 mr-2" />New file</span></Button>
              <input type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
            <Button variant="ghost" size="sm" onClick={() => { setData([]); setFileName(""); }}><X className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Filters</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {categoryCols.slice(0, 6).map(col => (
              <div key={col} className="min-w-[180px]">
                <label className="text-xs text-muted-foreground mb-1 block">{col}</label>
                <Select value={filters[col] || "__all__"} onValueChange={v => setFilters(f => ({ ...f, [col]: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All</SelectItem>
                    {uniqueValues(col).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {Object.values(filters).some(v => v && v !== "__all__") && (
              <Button variant="ghost" size="sm" className="self-end" onClick={() => setFilters({})}>Clear all</Button>
            )}
          </CardContent>
        </Card>

        {/* KPIs */}
        {kpis.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((k, i) => (
              <Card key={k.col}>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide truncate">{k.col}</p>
                  <p className="text-2xl font-semibold mt-1" style={{ color: COLORS[i % COLORS.length] }}>{fmt(k.sum)}</p>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>avg {fmt(k.avg)}</span>
                    <span>max {fmt(k.max)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Chart controls */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Chart configuration</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <div className="min-w-[180px]">
              <label className="text-xs text-muted-foreground mb-1 block">Group by (X)</label>
              <Select value={chartXCol} onValueChange={setChartXCol}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px]">
              <label className="text-xs text-muted-foreground mb-1 block">Measure (Y, sum)</label>
              <Select value={chartYCol} onValueChange={setChartYCol}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{numericCols.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px]">
              <label className="text-xs text-muted-foreground mb-1 block">Pie segment by</label>
              <Select value={groupCol || "__none__"} onValueChange={v => setGroupCol(v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— none —</SelectItem>
                  {categoryCols.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">{chartYCol} by {chartXCol}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={aggData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={fmt} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="value" fill={COLORS[0]} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={aggData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={fmt} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="value" stroke={COLORS[2]} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {groupedData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Distribution by {groupCol}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={groupedData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e) => e.name}>
                      {groupedData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {scatterData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">{numericCols[0]} vs {numericCols[1]}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="x" name={numericCols[0]} tick={{ fontSize: 11 }} tickFormatter={fmt} />
                    <YAxis dataKey="y" name={numericCols[1]} tick={{ fontSize: 11 }} tickFormatter={fmt} />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Scatter data={scatterData} fill={COLORS[1]} />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Data table */}
        <Card>
          <CardHeader><CardTitle className="text-base">Data ({filtered.length.toLocaleString()} rows)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-auto border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    {columns.map(c => (
                      <TableHead key={c}>
                        <button
                          className="flex items-center gap-1 hover:text-foreground font-medium"
                          onClick={() => {
                            if (sortCol === c) setSortDir(d => d === "asc" ? "desc" : "asc");
                            else { setSortCol(c); setSortDir("asc"); }
                          }}
                        >
                          {c}
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                          {sortCol === c && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{sortDir}</Badge>}
                        </button>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 200).map((r, i) => (
                    <TableRow key={i}>
                      {columns.map(c => (
                        <TableCell key={c} className="text-sm">
                          {typeof r[c] === "number" ? r[c].toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(r[c] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filtered.length > 200 && <p className="text-xs text-muted-foreground mt-2">Showing first 200 of {filtered.length.toLocaleString()} rows</p>}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
