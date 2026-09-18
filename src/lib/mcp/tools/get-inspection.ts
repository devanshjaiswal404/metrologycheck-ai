import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "get_inspection",
  title: "Get an inspection record",
  description:
    "Fetch one saved inspection record by id, including its declared label fields and every detected statutory violation.",
  inputSchema: { id: z.string().min(1).describe("Inspection record id returned by list_inspections.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }) => {
    const supabase = supabaseAnon();
    const { data, error } = await supabase
      .from("inspected_products")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError(`No inspection record found with id ${id}`);

    const { data: violations, error: vErr } = await supabase
      .from("detected_violations")
      .select("rule_code, rule_title, severity, detail")
      .eq("product_id", id);
    if (vErr) throw new ToolError(vErr.message);

    const record = {
      id: String(data.id),
      productName: data.product_name ?? "",
      brand: data.brand ?? "",
      mrp: data.mrp ?? "",
      netQuantity: data.net_quantity ?? "",
      unitSalePrice: data.unit_sale_price ?? "",
      manufacturerName: data.manufacturer_name ?? "",
      manufacturerAddress: data.manufacturer_address ?? "",
      consumerCareEmail: data.consumer_care_email ?? "",
      consumerCarePhone: data.consumer_care_phone ?? "",
      status: data.status ?? "review",
      violationsCount: data.violations_count ?? 0,
      inspector: data.inspector ?? "",
      scannedAt: data.scanned_at ?? "",
      violations: (violations ?? []).map((v) => ({
        ruleCode: v.rule_code ?? "",
        ruleTitle: v.rule_title ?? "",
        severity: v.severity ?? "violation",
        detail: v.detail ?? "",
      })),
    };

    const text = [
      `${record.productName} (${record.brand}) — ${String(record.status).toUpperCase()}`,
      `MRP: ${record.mrp} | Net qty: ${record.netQuantity} | USP: ${record.unitSalePrice}`,
      `Manufacturer: ${record.manufacturerName}, ${record.manufacturerAddress}`,
      `Consumer care: ${record.consumerCareEmail} / ${record.consumerCarePhone}`,
      ...record.violations.map((v) => `${v.ruleCode} [${v.severity}] ${v.ruleTitle}: ${v.detail}`),
    ].join("\n");

    return { content: [{ type: "text", text }], structuredContent: { record } };
  },
});
