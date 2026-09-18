import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { auditProduct, summarize, type ProductData } from "@/lib/lmpc";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "save_inspection",
  title: "Save an inspection",
  description:
    "Audit the declared label text against LMPC 2011 and save the result to the inspection registry, including every detected violation.",
  inputSchema: {
    productName: z.string().min(1).describe("Product name as printed on the pack."),
    brand: z.string().default("").describe("Brand name."),
    mrpText: z.string().default("").describe("MRP declaration text."),
    netQuantity: z.string().default("").describe("Net quantity declaration."),
    uspText: z.string().default("").describe("Unit sale price declaration."),
    manufacturerName: z.string().default("").describe("Manufacturer / packer name."),
    manufacturerAddress: z.string().default("").describe("Complete postal address including PIN."),
    consumerEmail: z.string().default("").describe("Consumer care email address."),
    consumerPhone: z.string().default("").describe("Consumer care telephone number."),
    inspector: z.string().default("Officer Devansh - Zone 1").describe("Inspecting officer recorded on the entry."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ inspector, ...rest }) => {
    const product = rest as ProductData;
    const checks = auditProduct(product);
    const summary = summarize(checks);
    const supabase = supabaseAnon();

    const { data, error } = await supabase
      .from("inspected_products")
      .insert({
        product_name: product.productName,
        brand: product.brand,
        mrp: product.mrpText,
        net_quantity: product.netQuantity,
        unit_sale_price: product.uspText,
        manufacturer_name: product.manufacturerName,
        manufacturer_address: product.manufacturerAddress,
        consumer_care_email: product.consumerEmail,
        consumer_care_phone: product.consumerPhone,
        status: summary.status,
        violations_count: summary.violations,
        inspector,
      })
      .select("id")
      .single();
    if (error) throw new ToolError(error.message);

    const failing = checks.filter((c) => c.status !== "pass");
    if (failing.length) {
      const { error: vErr } = await supabase.from("detected_violations").insert(
        failing.map((c) => ({
          product_id: data.id,
          rule_code: c.code,
          rule_title: c.title,
          severity: c.status === "fail" ? "violation" : "review",
          detail: c.detail,
        })),
      );
      if (vErr) throw new ToolError(vErr.message);
    }

    return {
      content: [
        {
          type: "text",
          text: `Saved inspection ${data.id} for ${product.productName}: ${summary.status.toUpperCase()} with ${summary.violations} violation(s) and ${summary.reviews} review item(s).`,
        },
      ],
      structuredContent: {
        id: String(data.id),
        status: summary.status,
        violations: summary.violations,
        reviews: summary.reviews,
      },
    };
  },
});
