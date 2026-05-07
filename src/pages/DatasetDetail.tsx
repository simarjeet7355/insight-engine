import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter,
} from "recharts";
import { ArrowLeft, ArrowUpDown, Plus, Trash2, LayoutDashboard, BarChart3, X } from "lucide-react";
import { fmt, summarize, aggregateByCategory, CHART_COLORS, type ColumnMeta, type Row } from "@/lib/csv";

type ChartKind = "bar" | "line" | "area" | "pie" | "scatter";
type Widget = { id: string; kind: ChartKind; x: string; y: string };

export default function DatasetDetail() {
  const { id } = useParams();
  const [ds, setDs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [widgets, setWidgets] = useState<Widget[]>([]);

  useEffect(() => {
    if (!id) return;
    supabase.from("datasets").select("*").eq("id", id).single().then(({ data }) => {
      setDs(data);
      setLoading(false);
      if (data) {
        const cols = data.columns as unknown as ColumnMeta[];
        const cats = cols.filter((c) => c.type === "category");
        const nums = cols.filter((c) => c.type === "number");
        const dates = cols.filter((c) => c.type === "date");
        const initial: Widget[] = [];
        if (cats[0] && nums[0]) initial.push({ id: "w1", kind: "bar", x: cats[0].name, y: nums[0].name });
        if (dates[0] && nums[0]) initial.push({ id: "w2", kind: "area", x: dates[0].name, y: nums[0].name });
        if (cats[1] && nums[1]) initial.push({ id: "w3", kind: "pie", x: cats[1].name, y: nums[1].name });
        if (nums[0] && nums[1]) initial.push({ id: "w4", kind: "scatter", x: nums[0].name, y: nums[1].name });
        setWidgets(initial);
      }
    });
  }, [id]);

  const cols: ColumnMeta[] = (ds?.columns as unknown as ColumnMeta[]) ?? [];
  const rows: Row[] = (ds?.rows as unknown as Row[]) ?? [];

  const filtered = useMemo(() => {
    return rows.filter((r) =>
      Object.entries(filters).every(([k, v]) => !v || String(r[k] ?? "").toLowerCase().includes(v.toLowerCase()))
    );
  }, [rows, filters]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return arr;
  }, [filtered, sortCol, sortDir]);

  const numericCols = cols.filter((c) => c.type === "number");
  const categoryCols = cols.filter((c) => c.type !== "number");

  const kpis = numericCols.slice(0, 4).map((c) => ({ name: c.name, ...summarize(filtered, c.name) }));

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
  };

  const addWidget = () => {
    if (!categoryCols[0] || !numericCols[0]) return;
    setWidgets((w) => [...w, { id: crypto.randomUUID(), kind: "bar", x: categoryCols[0].name, y: numericCols[0].name }]);
  };
  const updateWidget = (id: string, patch: Partial<Widget>) =>
    setWidgets((w) => w.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeWidget = (id: string) => setWidgets((w) => w.filter((x) => x.id !== id));

  const renderChart = (w: Widget) => {
    if (w.kind === "scatter") {
      const data = filtered
        .map((r) => ({ x: Number(r[w.x]), y: Number(r[w.y]) }))
        .filter((d) => !isNaN(d.x) && !isNaN(d.y))
        .slice(0, 500);
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" dataKey="x" name={w.x} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
            <YAxis type="number" dataKey="y" name={w.y} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} tickFormatter={fmt} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Scatter data={data} fill="hsl(var(--chart-1))" />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }
    const data = aggregateByCategory(filtered, w.x, w.y, "sum");
    if (w.kind === "pie") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.slice(0, 8)} dataKey="value" nameKey="name" outerRadius={90} innerRadius={45}>
              {data.slice(0, 8).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: any) => fmt(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (w.kind === "line") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={fmt} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: any) => fmt(v)} />
            <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (w.kind === "area") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${w.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.6} />
                <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={fmt} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: any) => fmt(v)} />
            <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2.5} fill={`url(#grad-${w.id})`} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
          <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={fmt} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: any) => fmt(v)} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (loading) return <div className="container py-8 text-muted-foreground">Loading…</div>;
  if (!ds) return <div className="container py-8">Not found. <Link to="/app/datasets" className="underline">Back</Link></div>;

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2"><Link to="/app/datasets"><ArrowLeft className="w-4 h-4 mr-1" /> All datasets</Link></Button>
          <h1 className="text-3xl font-black tracking-tight">{ds.name}</h1>
          <p className="text-sm text-muted-foreground">{ds.description || `${fmt(ds.row_count)} rows · ${cols.length} columns`}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(filters).filter(([, v]) => v).map(([k, v]) => (
            <Badge key={k} variant="secondary" className="gap-1">
              {k}: {v}
              <button onClick={() => setFilters((f) => ({ ...f, [k]: "" }))}><X className="w-3 h-3" /></button>
            </Badge>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <Card key={k.name} className="p-4 border-2 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-10" style={{ background: CHART_COLORS[i] }} />
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{k.name}</div>
            <div className="text-2xl font-black mt-0.5">{fmt(k.sum)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">avg {fmt(k.avg)} · max {fmt(k.max)}</div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard"><LayoutDashboard className="w-4 h-4 mr-1.5" /> Dashboard</TabsTrigger>
          <TabsTrigger value="data"><BarChart3 className="w-4 h-4 mr-1.5" /> Data table</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Live charts</h2>
            <Button onClick={addWidget} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Add chart</Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {widgets.map((w) => (
              <Card key={w.id} className="p-4 border-2">
                <div className="flex flex-wrap gap-2 mb-3 items-center">
                  <Select value={w.kind} onValueChange={(v) => updateWidget(w.id, { kind: v as ChartKind })}>
                    <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="area">Area</SelectItem>
                      <SelectItem value="pie">Pie</SelectItem>
                      <SelectItem value="scatter">Scatter</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={w.x} onValueChange={(v) => updateWidget(w.id, { x: v })}>
                    <SelectTrigger className="h-8 flex-1 min-w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(w.kind === "scatter" ? numericCols : cols).map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={w.y} onValueChange={(v) => updateWidget(w.id, { y: v })}>
                    <SelectTrigger className="h-8 flex-1 min-w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {numericCols.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeWidget(w.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="h-72">{renderChart(w)}</div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data">
          <Card className="border-2 overflow-hidden">
            <div className="p-3 border-b grid grid-cols-2 md:grid-cols-4 gap-2">
              {cols.slice(0, 4).map((c) => (
                <Input
                  key={c.name}
                  placeholder={`Filter ${c.name}…`}
                  value={filters[c.name] ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, [c.name]: e.target.value }))}
                  className="h-8 text-xs"
                />
              ))}
            </div>
            <div className="overflow-auto max-h-[60vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    {cols.map((c) => (
                      <TableHead key={c.name} className="cursor-pointer whitespace-nowrap" onClick={() => toggleSort(c.name)}>
                        <span className="inline-flex items-center gap-1">
                          {c.name}
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                          {sortCol === c.name && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">{sortDir}</Badge>}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.slice(0, 200).map((r, i) => (
                    <TableRow key={i}>
                      {cols.map((c) => (
                        <TableCell key={c.name} className="text-xs whitespace-nowrap">
                          {typeof r[c.name] === "number" ? fmt(r[c.name]) : String(r[c.name] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="px-3 py-2 border-t text-xs text-muted-foreground">
              Showing {Math.min(200, sorted.length)} of {sorted.length} filtered rows
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
