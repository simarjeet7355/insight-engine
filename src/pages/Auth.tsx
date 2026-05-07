import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Activity, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { z } from "zod";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passSchema = z.string().min(6, "Min 6 characters").max(72);

export default function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passSchema.parse(password);
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message ?? "Invalid input");
      return;
    }
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
          data: { full_name: fullName, company },
        },
      });
      if (error) toast.error(error.message);
      else {
        toast.success("Account created — welcome aboard!");
        navigate("/app");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else {
        toast.success("Welcome back");
        navigate("/app");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <header className="container flex items-center justify-between py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Activity className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="font-bold text-lg text-gradient">MarketPulse</div>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-8 shadow-elevated border-2">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black tracking-tight mb-1">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signup" ? "Start exploring your data in seconds" : "Sign in to access your dashboards"}
            </p>
          </div>

          <Tabs value={mode} onValueChange={setMode} className="mb-5">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow h-11">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
