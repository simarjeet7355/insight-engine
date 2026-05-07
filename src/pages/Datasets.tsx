import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Database, Trash2, Search, Plus } from "lucide-react";
import { fmt } from "@/lib/csv";
import { toast } from "sonner";

export default function Datasets() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) return;
    supabase
      .from("datasets")
      .select("id, name, description, row_count, columns, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  };

  useEffect(load, [user]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("datasets").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      setItems((x) => x.filter((d) => d.id !== id));
    }
  };

  const filtered = items.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1">Your <span className="text-gradient">datasets</span></h1>
          <p className="text-muted-foreground">All CSVs you've uploaded, ready to slice and dice.</p>
        </div>
        <Button asChild className="bg-gradient-primary shadow-glow">
          <Link to="/app/upload"><Plus className="w-4 h-4 mr-1" /> New upload</Link>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search datasets…" className="pl-9" />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center border-2 border-dashed">
          <Database className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold mb-1">{items.length === 0 ? "No datasets yet" : "Nothing matches"}</p>
          {items.length === 0 && (
            <Button asChild className="mt-3 bg-gradient-primary shadow-glow"><Link to="/app/upload">Upload one</Link></Button>
          )}
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <Card key={d.id} className="p-5 border-2 hover:shadow-glow transition-all hover:-translate-y-0.5 group">
              <Link to={`/app/datasets/${d.id}`} className="block">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
                    <Database className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{d.description || "No description"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{fmt(d.row_count)}</span> rows
                  <span>·</span>
                  <span className="font-semibold text-foreground">{Array.isArray(d.columns) ? d.columns.length : 0}</span> cols
                </div>
              </Link>
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <span className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString()}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                  onClick={() => remove(d.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
