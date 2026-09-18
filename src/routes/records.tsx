import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, FileSearch, Loader2 } from "lucide-react";
import { db } from "@/lib/supabase";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Registry Records — MetrologyCheck AI" },
      {
        name: "description",
        content: "Searchable repository of past packaged-commodity compliance inspections.",
      },
      { property: "og:title", content: "Registry Records — MetrologyCheck AI" },
      {
        property: "og:description",
        content: "Past LMPC 2011 inspections with status and violation counts.",
      },
    ],
  }),
  component: Records,
});

interface Row {
  id: string;
  product_name: string;
  brand: string | null;
  status: string;
  violations_count: number;
  scanned_at: string;
}


function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    compliant: "border-success/50 bg-success/10 text-success",
    violation: "border-danger/50 bg-danger/10 text-danger",
    review: "border-warning/50 bg-warning/10 text-warning",
  };
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${map[status] ?? map["review"]}`}
    >
      {status === "compliant" ? "Compliant" : status === "violation" ? "Violation" : "Review"}
    </span>
  );
}

function Records() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Row | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["records"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await db
        .from("inspected_products")
        .select("id, product_name, brand, status, violations_count, scanned_at")
        .order("scanned_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Row[];
    },
  });

  const rows = (data ?? []).filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      (r.product_name + " " + (r.brand ?? "")).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-lg font-bold">Inspection Records Repository</h1>
          <p className="text-xs text-muted-foreground">
            All packaged-commodity scans filed by the Legal Metrology Division.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search product or brand"
              className="w-56 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none"
          >
            <option value="all">All statuses</option>
            <option value="compliant">Compliant</option>
            <option value="violation">Violation</option>
            <option value="review">Review</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product Name</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Scanned Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Violations</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </td>
              </tr>
            )}
            {!isLoading && error && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-danger">
                  Could not load records: {error instanceof Error ? error.message : "unknown error"}
                </td>
              </tr>
            )}
            {!isLoading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No inspections match this filter.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-semibold text-foreground">{r.product_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.brand ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(r.scanned_at).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 font-bold text-foreground">{r.violations_count}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelected(r)}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-3 py-1.5 text-[11px] font-bold hover:border-primary/60"
                  >
                    <FileSearch className="size-3.5 text-primary" />
                    View Audit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold">{selected.product_name}</h2>
            <p className="mb-4 text-xs text-muted-foreground">{selected.brand}</p>
            <AuditDetail id={selected.id} count={selected.violations_count} />
            <button
              onClick={() => setSelected(null)}
              className="mt-5 w-full rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditDetail({ id, count }: { id: string; count: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["violations", id],
    queryFn: async () => {
      const { data } = await db
        .from("detected_violations")
        .select("rule_code, rule_title, severity, detail")
        .eq("product_id", id);
      return data ?? [];
    },
  });

  if (isLoading) return <Loader2 className="size-4 animate-spin text-primary" />;
  if (!data || data.length === 0)
    return (
      <p className="text-xs text-muted-foreground">
        {count > 0
          ? "Clause details are not stored for this legacy record."
          : "No contraventions recorded — all audited clauses passed."}
      </p>
    );

  return (
    <ul className="space-y-3">
      {data.map((v, i) => (
        <li key={i} className="rounded-lg border border-border bg-background/50 p-3">
          <p
            className={`text-[11px] font-black ${v.severity === "violation" ? "text-danger" : "text-warning"}`}
          >
            {v.rule_code} — {v.severity === "violation" ? "VIOLATION" : "REVIEW"}
          </p>
          <p className="mt-1 text-xs text-foreground">{v.rule_title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{v.detail}</p>
        </li>
      ))}
    </ul>
  );
}
