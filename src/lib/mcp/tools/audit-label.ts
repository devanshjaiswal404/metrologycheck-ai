import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { auditProduct, summarize, type ProductData } from "@/lib/lmpc";

const input = {
  productName: z.string().default("").describe("Product name as printed on the pack."),
  brand: z.string().default("").describe("Brand name."),
  mrpText: z.string().default("").describe('MRP declaration text, e.g. "MRP ₹240.00 (inclusive of all taxes)".'),
  netQuantity: z.string().default("").describe('Net quantity declaration, e.g. "Net Qty: 5 kg".'),
  uspText: z.string().default("").describe('Unit sale price declaration, e.g. "₹48.00 per kg".'),
  manufacturerName: z.string().default("").describe("Manufacturer / packer / importer name."),
  manufacturerAddress: z.string().default("").describe("Complete postal address including 6-digit PIN."),
  consumerEmail: z.string().default("").describe("Consumer care email address."),
  consumerPhone: z.string().default("").describe("Consumer care telephone / helpline number."),
};

export default defineTool({
  name: "audit_label",
  title: "Audit a package label",
  description:
    "Run the Legal Metrology (Packaged Commodities) Rules, 2011 statutory clause audit on declared label text and return a per-rule verdict plus an overall compliance status.",
  inputSchema: input,
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (args) => {
    const product = args as ProductData;
    const checks = auditProduct(product);
    const summary = summarize(checks);
    const rows = checks.map((c) => ({
      code: c.code,
      title: c.title,
      status: c.status,
      detail: c.detail,
    }));
    const text = [
      `Overall status: ${summary.status.toUpperCase()} (${summary.violations} violation(s), ${summary.reviews} review item(s))`,
      ...rows.map((r) => `${r.code} — ${r.status.toUpperCase()}: ${r.title}. ${r.detail}`),
    ].join("\n");
    return {
      content: [{ type: "text", text }],
      structuredContent: {
        status: summary.status,
        violations: summary.violations,
        reviews: summary.reviews,
        checks: rows,
      },
    };
  },
});
