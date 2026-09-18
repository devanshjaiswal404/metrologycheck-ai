import { Link } from "@tanstack/react-router";
import { ScaleIcon, ShieldCheck, Languages } from "lucide-react";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/lmpc";

export function TopBar() {
  const { lang, setLang } = useLang();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/40">
            <ScaleIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-foreground sm:text-base">
              MetrologyCheck AI
              <span className="text-muted-foreground"> — Legal Metrology Division</span>
            </h1>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              LMPC Rules, 2011 · Enforcement Console
            </p>
          </div>
        </div>

        <nav className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            {t[lang].newInspection}
          </Link>
          <Link
            to="/records"
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            {t[lang].registry}
          </Link>
        </nav>

        <button
          onClick={() => setLang(lang === "en" ? "hi" : "en")}
          className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/60"
        >
          <Languages className="size-4 text-primary" />
          {lang === "en" ? "English" : "हिन्दी"}
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2">
          <ShieldCheck className="size-4 text-success" />
          <span className="text-xs font-semibold text-success">Officer Devansh · Zone 1</span>
        </div>
      </div>
    </header>
  );
}
