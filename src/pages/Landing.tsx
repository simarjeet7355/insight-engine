import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, BarChart3, Database, GitCompareArrows, Sparkles, Upload, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: Upload, title: "Smart CSV Upload", desc: "Drop any marketing CSV. We auto-detect columns and types." },
  { icon: BarChart3, title: "Instant Dashboards", desc: "KPIs, trends, breakdowns — generated the moment data lands." },
  { icon: GitCompareArrows, title: "Period Comparison", desc: "Pit this quarter against last. Spot what changed, fast." },
  { icon: Database, title: "Personal Vault", desc: "Save datasets to your profile. Revisit and re-analyze anytime." },
  { icon: Sparkles, title: "Vibrant Visuals", desc: "Color-tuned charts built for clarity and quick scanning." },
  { icon: Zap, title: "Filter & Slice", desc: "Excel-style filters and sorting baked into every view." },
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background bg-mesh">
      <header className="container flex items-center justify-between py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Activity className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-lg text-gradient">MarketPulse</div>
            <div className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Analytics</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Button asChild className="bg-gradient-primary shadow-glow"><Link to="/app">Open app</Link></Button>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
              <Button asChild className="bg-gradient-primary shadow-glow"><Link to="/auth?mode=signup">Get started</Link></Button>
            </>
          )}
        </div>
      </header>

      <section className="container py-20 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6">
          <Sparkles className="w-3.5 h-3.5" /> AI-ready marketing analytics
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
          Turn raw campaign data into <span className="text-gradient">decisions you can ship.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Upload your CSVs, build instant dashboards, and compare periods side-by-side.
          Built for marketing teams who don't have time to wait for a BI license.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button size="lg" asChild className="bg-gradient-primary shadow-glow text-base h-12 px-7">
            <Link to={user ? "/app" : "/auth?mode=signup"}>
              {user ? "Go to dashboard" : "Create free account"}
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base h-12 px-7 border-2">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </section>

      <section className="container pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl bg-card border shadow-card hover:shadow-elevated transition-all hover:-translate-y-1"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-primary-foreground shadow-glow"
                style={{ background: i % 3 === 0 ? "var(--gradient-primary)" : i % 3 === 1 ? "var(--gradient-accent)" : "var(--gradient-warm)" }}
              >
                <f.icon className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-lg mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        MarketPulse Analytics · Built for marketers who move fast
      </footer>
    </div>
  );
}
