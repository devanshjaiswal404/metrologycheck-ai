import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_inspections",
  title: "List inspection records",
  description:
    "List saved inspection records from the registry, newest first. Optionally filter by compliance status or search product/brand name.",
  inputSchema: {
    search: z.string().optional().describe("Case-insensitive text to match against product name or brand."),
    status: z.enum(["compliant", "violation", "review"]).optional().describe("Filter by compliance status."),
    limit: z.number().int().min(1).max(100).default(20).describe("Maximum records to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, status, limit }) => {
    const supabase = supabaseAnon();
    let query = supabase
      .from("inspected_products")
      .select("id, product_name, brand, status, violations_count, inspector, scanned_at")
      .order("scanned_at", { ascending: false })
      .limit(limit);
    if (status) query = query.eq("status", status);
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`product_name.ilike.${term},brand.ilike.${term}`);
    }
    const { data, error } = await query;
    if (error) throw new ToolError(error.message);
    const rows = (data ?? []).map((r) => ({
      id: String(r.id),
      productName: r.product_name ?? "",
      brand: r.brand ?? "",
      status: r.status ?? "review",
      violationsCount: r.violations_count ?? 0,
      inspector: r.inspector ?? "",
      scannedAt: r.scanned_at ?? "",
    }));
    const text = rows.length
      ? rows
          .map((r) => `${r.productName} (${r.brand}) — ${String(r.status).toUpperCase()}, ${r.violationsCount} violation(s), ${r.scannedAt} [${r.id}]`)
          .join("\n")
      : "No inspection records found.";
    return { content: [{ type: "text", text }], structuredContent: { records: rows } };
  },
});
