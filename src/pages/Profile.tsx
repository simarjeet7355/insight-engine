import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState({ full_name: "", company: "", role: "", bio: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) setP({
        full_name: data.full_name ?? "",
        company: data.company ?? "",
        role: data.role ?? "",
        bio: data.bio ?? "",
      });
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...p });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  if (loading) return <div className="container py-8 text-muted-foreground">Loading…</div>;

  const initials = (p.full_name || user?.email || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="text-4xl font-black tracking-tight mb-1">Your <span className="text-gradient">profile</span></h1>
      <p className="text-muted-foreground mb-6">This is how your workspace identifies you.</p>

      <Card className="p-6 border-2 mb-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow text-primary-foreground font-black text-xl">
          {initials}
        </div>
        <div>
          <div className="font-bold text-lg">{p.full_name || "Unnamed"}</div>
          <div className="text-sm text-muted-foreground">{user?.email}</div>
          {p.role && <div className="text-xs text-primary font-semibold mt-0.5">{p.role}{p.company && ` · ${p.company}`}</div>}
        </div>
      </Card>

      <Card className="p-6 border-2 space-y-4">
        <div>
          <Label htmlFor="fn">Full name</Label>
          <Input id="fn" value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} maxLength={100} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="co">Company</Label>
            <Input id="co" value={p.company} onChange={(e) => setP({ ...p, company: e.target.value })} maxLength={100} />
          </div>
          <div>
            <Label htmlFor="ro">Role</Label>
            <Input id="ro" value={p.role} onChange={(e) => setP({ ...p, role: e.target.value })} maxLength={80} placeholder="Marketing Analyst" />
          </div>
        </div>
        <div>
          <Label htmlFor="bio">Short bio</Label>
          <Textarea id="bio" value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} maxLength={500} rows={3} />
        </div>
        <Button onClick={save} disabled={saving} className="bg-gradient-primary shadow-glow">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save profile
        </Button>
      </Card>
    </div>
  );
}
