import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload as UploadIcon, FileSpreadsheet, Loader2, X } from "lucide-react";
import { parseCSVFile, type Row, type ColumnMeta } from "@/lib/csv";
import { toast } from "sonner";

export default function Upload() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [cols, setCols] = useState<ColumnMeta[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);

  const handleFile = async (f: File) => {
    setFile(f);
    setName(f.name.replace(/\.csv$/i, ""));
    setParsing(true);
    try {
      const { rows, columns } = await parseCSVFile(f);
      setRows(rows);
      setCols(columns);
      toast.success(`Parsed ${rows.length} rows`);
    } catch (e: any) {
      toast.error("Failed to parse CSV");
    } finally {
      setParsing(false);
    }
  };

  const save = async () => {
    if (!user || !rows.length) return;
    if (!name.trim()) return toast.error("Give it a name");
    setLoading(true);
    const { data, error } = await supabase
      .from("datasets")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: desc.trim() || null,
        row_count: rows.length,
        columns: cols as any,
        rows: rows as any,
      })
      .select("id")
      .single();
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Dataset saved");
    nav(`/app/datasets/${data.id}`);
  };

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight mb-1">Upload <span className="text-gradient">data</span></h1>
        <p className="text-muted-foreground">Drop a CSV. We'll parse it, infer types, and save it to your workspace.</p>
      </div>

      {!file ? (
        <label
          className="block border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-4">
            <UploadIcon className="w-7 h-7 text-primary-foreground" />
          </div>
          <p className="font-bold text-lg mb-1">Drop a CSV file here</p>
          <p className="text-sm text-muted-foreground">or click to browse · max 20MB</p>
        </label>
      ) : (
        <Card className="p-6 border-2">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-accent flex items-center justify-center shadow-glow">
                <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-semibold">{file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {parsing ? "Parsing…" : `${rows.length} rows · ${cols.length} columns`}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setFile(null); setRows([]); setCols([]); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="ds-name">Dataset name</Label>
              <Input id="ds-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </div>
            <div>
              <Label htmlFor="ds-desc">Description (optional)</Label>
              <Input id="ds-desc" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} placeholder="Q3 2026 paid ads" />
            </div>
          </div>

          {cols.length > 0 && (
            <div className="mb-4">
              <Label>Detected columns</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {cols.map((c) => (
                  <span key={c.name} className="text-xs px-2 py-1 rounded-md bg-secondary border font-medium">
                    {c.name}
                    <span className="ml-1.5 text-[10px] text-primary uppercase tracking-wider">{c.type}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button onClick={save} disabled={loading || parsing || !rows.length} className="bg-gradient-primary shadow-glow w-full h-11">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save & analyze
          </Button>
        </Card>
      )}
    </div>
  );
}
