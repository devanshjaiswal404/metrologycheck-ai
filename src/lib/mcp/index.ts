import { defineMcp } from "@lovable.dev/mcp-js";
import auditLabelTool from "./tools/audit-label";
import listInspectionsTool from "./tools/list-inspections";
import getInspectionTool from "./tools/get-inspection";
import saveInspectionTool from "./tools/save-inspection";

export default defineMcp({
  name: "metrologycheck-ai",
  title: "MetrologyCheck AI",
  version: "0.1.0",
  instructions:
    "Tools for MetrologyCheck AI, a Legal Metrology (Packaged Commodities) Rules, 2011 compliance inspection platform. Use `audit_label` to check declared package label text against the statutory clauses, `save_inspection` to audit and record an inspection, and `list_inspections` / `get_inspection` to browse the registry of past inspections.",
  tools: [auditLabelTool, saveInspectionTool, listInspectionsTool, getInspectionTool],
});
