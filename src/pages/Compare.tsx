import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowDown, ArrowUp, GitCompareArrows, Minus } from "lucide-react";
import { fmt, summarize, aggregateByCategory, type ColumnMeta, type Row } from "@/lib/csv";

export default function Compare() {
  const [list, setList] = useState<any[]>([]);
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");
  const [a, setA] = useState<any>(null);
  const [b, setB] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("datasets")
      .select("id, name, columns")
      .order("created_at", { ascending: false })
      .then(({ data }) => setList(data ?? []));
  }, []);

  useEffect(() => {
    if (aId) supabase.from("datasets").select("*").eq("id", aId).single().then(({ data }) => setA(data));
    else setA(null);
  }, [aId]);
  useEffect(() => {
    if (bId) supabase.from("datasets").select("*").eq("id", bId).single().then(({ data }) => setB(data));
    else setB(null);
  }, [bId]);

  const sharedNumeric = useMemo(() => {
    if (!a || !b) return [];
    const aNums = (a.columns as ColumnMeta[]).filter((c) => c.type === "number").map((c) => c.name);
    const bNums = new Set((b.columns as ColumnMeta[]).filter((c) => c.type === "number").map((c) => c.name));
    return aNums.filter((n) => bNums.has(n));
  }, [a, b]);

  const sharedCategory = useMemo(() => {
    if (!a || !b) return [];
    const aCats = (a.columns as ColumnMeta[]).filter((c) => c.type !== "number").map((c) => c.name);
    const bCats = new Set((b.columns as ColumnMeta[]).filter((c) => c.type !== "number").map((c) => c.name));
    return aCats.filter((n) => bCats.has(n));
  }, [a, b]);

  const [groupCol, setGroupCol] = useState("");
  const [measure, setMeasure] = useState("");
  useEffect(() => { if (sharedCategory[0]) setGroupCol(sharedCategory[0]); }, [sharedCategory]);
  useEffect(() => { if (sharedNumeric[0]) setMeasure(sharedNumeric[0]); }, [sharedNumeric]);

  const compareData = useMemo(() => {
    if (!a || !b || !groupCol || !measure) return [];
    const aMap = new Map(aggregateByCategory(a.rows as Row[], groupCol, measure).map((r) => [r.name, r.value]));
    const bMap = new Map(aggregateByCategory(b.rows as Row[], groupCol, measure).map((r) => [r.name, r.value]));
    const keys = new Set([...aMap.keys(), ...bMap.keys()]);
    return Array.from(keys).map((k) => ({
      name: k,
      [a.name]: aMap.get(k) ?? 0,
      [b.name]: bMap.get(k) ?? 0,
    })).sort((x: any, y: any) => (y[a.name] + y[b.name]) - (x[a.name] + x[b.name])).slice(0, 15);
  }, [a, b, groupCol, measure]);

  const kpiDelta = useMemo(() => {
    if (!a || !b) return [];
    return sharedNumeric.slice(0, 4).map((c) => {
      const sa = summarize(a.rows as Row[], c).sum;
      const sb = summarize(b.rows as Row[], c).sum;
      const delta = sa === 0 ? 0 : ((sb - sa) / Math.abs(sa)) * 100;
      return { name: c, a: sa, b: sb, delta };
    });
  }, [a, b, sharedNumeric]);

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight mb-1">Compare <span className="text-gradient">datasets</span></h1>
        <p className="text-muted-foreground">Stack two periods or campaigns to see what shifted.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 border-2">
          <Label>Baseline (A)</Label>
          <Select value={aId} onValueChange={setAId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Pick a dataset" /></SelectTrigger>
            <SelectContent>
              {list.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {a && <div className="text-xs text-muted-foreground mt-2">{a.row_count.toLocaleString()} rows · {(a.columns as any[]).length} cols</div>}
        </Card>
        <Card className="p-5 border-2">
          <Label>Comparison (B)</Label>
          <Select value={bId} onValueChange={setBId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Pick a dataset" /></SelectTrigger>
            <SelectContent>
              {list.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {b && <div className="text-xs text-muted-foreground mt-2">{b.row_count.toLocaleString()} rows · {(b.columns as any[]).length} cols</div>}
        </Card>
      </div>

      {!a || !b ? (
        <Card className="p-12 text-center border-2 border-dashed">
          <GitCompareArrows className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">Pick two datasets to start comparing</p>
        </Card>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-bold mb-3">Headline metrics</h2>
            {kpiDelta.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shared numeric columns between the two datasets.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {kpiDelta.map((k) => {
                  const up = k.delta > 0, down = k.delta < 0;
                  return (
                    <Card key={k.name} className="p-4 border-2">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground truncate">{k.name}</div>
                      <div className="text-2xl font-black mt-1">{fmt(k.b)}</div>
                      <div className="text-xs text-muted-foreground">vs {fmt(k.a)}</div>
                      <Badge variant="secondary" className={`mt-2 gap-1 ${up ? "bg-success/15 text-success" : down ? "bg-destructive/15 text-destructive" : ""}`}>
                        {up ? <ArrowUp className="w-3 h-3" /> : down ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {Math.abs(k.delta).toFixed(1)}%
                      </Badge>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <Card className="p-5 border-2">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h2 className="font-bold mr-auto">Side-by-side breakdown</h2>
              <Select value={groupCol} onValueChange={setGroupCol}>
                <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Group by" /></SelectTrigger>
                <SelectContent>
                  {sharedCategory.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={measure} onValueChange={setMeasure}>
                <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Measure" /></SelectTrigger>
                <SelectContent>
                  {sharedNumeric.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: any) => fmt(v)} />
                  <Legend />
                  <Bar dataKey={a.name} fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={b.name} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
