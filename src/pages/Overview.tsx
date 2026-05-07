import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Upload, GitCompareArrows, FileSpreadsheet, TrendingUp, Sparkles } from "lucide-react";
import { fmt } from "@/lib/csv";

export default function Overview() {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("datasets")
      .select("id, name, row_count, created_at, columns")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDatasets(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const totalRows = datasets.reduce((s, d) => s + (d.row_count || 0), 0);
  const totalCols = datasets.reduce((s, d) => s + (Array.isArray(d.columns) ? d.columns.length : 0), 0);

  const stats = [
    { label: "Datasets", value: datasets.length, icon: Database, gradient: "var(--gradient-primary)" },
    { label: "Total rows", value: fmt(totalRows), icon: FileSpreadsheet, gradient: "var(--gradient-accent)" },
    { label: "Total columns", value: totalCols, icon: TrendingUp, gradient: "var(--gradient-warm)" },
  ];

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight mb-1">
          Welcome back<span className="text-gradient">.</span>
        </h1>
        <p className="text-muted-foreground">Here's your analytics workspace at a glance.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 border-2 shadow-card relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20" style={{ background: s.gradient }} />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{s.label}</div>
                <div className="text-3xl font-black tracking-tight">{s.value}</div>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-primary-foreground shadow-glow" style={{ background: s.gradient }}>
                <s.icon className="w-5 h-5" strokeWidth={2.5} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/app/upload">
          <Card className="p-6 border-2 hover:shadow-glow transition-all hover:-translate-y-1 cursor-pointer h-full">
            <Upload className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-bold text-lg mb-1">Upload data</h3>
            <p className="text-sm text-muted-foreground">Drop a CSV — instant insights, no setup.</p>
          </Card>
        </Link>
        <Link to="/app/datasets">
          <Card className="p-6 border-2 hover:shadow-glow transition-all hover:-translate-y-1 cursor-pointer h-full">
            <Database className="w-8 h-8 text-accent mb-3" />
            <h3 className="font-bold text-lg mb-1">Browse datasets</h3>
            <p className="text-sm text-muted-foreground">Open and analyze any dataset you saved.</p>
          </Card>
        </Link>
        <Link to="/app/compare">
          <Card className="p-6 border-2 hover:shadow-glow transition-all hover:-translate-y-1 cursor-pointer h-full">
            <GitCompareArrows className="w-8 h-8 text-warning mb-3" />
            <h3 className="font-bold text-lg mb-1">Compare periods</h3>
            <p className="text-sm text-muted-foreground">Stack two datasets to spot what changed.</p>
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Recent datasets
        </h2>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : datasets.length === 0 ? (
          <Card className="p-10 text-center border-2 border-dashed">
            <Database className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold mb-1">No datasets yet</p>
            <p className="text-sm text-muted-foreground mb-4">Upload your first CSV to get started.</p>
            <Button asChild className="bg-gradient-primary shadow-glow"><Link to="/app/upload">Upload now</Link></Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {datasets.slice(0, 6).map((d) => (
              <Link key={d.id} to={`/app/datasets/${d.id}`}>
                <Card className="p-4 border-2 hover:shadow-glow transition-all hover:-translate-y-0.5">
                  <div className="font-semibold truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {fmt(d.row_count)} rows · {Array.isArray(d.columns) ? d.columns.length : 0} cols
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1.5">
                    {new Date(d.created_at).toLocaleDateString()}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
