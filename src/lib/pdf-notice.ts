import jsPDF from "jspdf";
import type { ProductData, RuleCheck } from "./lmpc";

export function exportNotice(p: ProductData, checks: RuleCheck[], inspector: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const M = 48;
  let y = M;
  const W = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("LEGAL METROLOGY DIVISION", W / 2, y, { align: "center" });
  y += 18;
  doc.setFontSize(11);
  doc.text("INSPECTION NOTICE — Legal Metrology (Packaged Commodities) Rules, 2011", W / 2, y, {
    align: "center",
  });
  y += 10;
  doc.setLineWidth(1);
  doc.line(M, y, W - M, y);
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const meta = [
    ["Notice No.", `MC/${Date.now().toString().slice(-8)}`],
    ["Date of inspection", new Date().toLocaleString("en-IN")],
    ["Inspecting officer", inspector],
    ["Product", p.productName || "—"],
    ["Brand", p.brand || "—"],
    ["Manufacturer / Packer", p.manufacturerName || "—"],
    ["Address", p.manufacturerAddress || "—"],
    ["Declared MRP", p.mrpText || "—"],
    ["Net quantity", p.netQuantity || "—"],
    ["Unit sale price", p.uspText || "—"],
  ];
  meta.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${k}:`, M, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(String(v), W - M - 180);
    doc.text(lines, M + 130, y);
    y += 14 * lines.length;
  });

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("STATUTORY CLAUSE AUDIT", M, y);
  y += 8;
  doc.line(M, y, W - M, y);
  y += 18;

  checks.forEach((c, i) => {
    if (y > 740) {
      doc.addPage();
      y = M;
    }
    const verdict =
      c.status === "pass" ? "COMPLIANT" : c.status === "review" ? "REVIEW REQUIRED" : "VIOLATION";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${i + 1}. ${c.code} — ${verdict}`, M, y);
    y += 13;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const title = doc.splitTextToSize(c.title, W - 2 * M);
    doc.text(title, M + 12, y);
    y += 11 * title.length;
    const det = doc.splitTextToSize(c.detail, W - 2 * M - 12);
    doc.text(det, M + 12, y);
    y += 11 * det.length + 8;
  });

  const violations = checks.filter((c) => c.status === "fail").length;
  if (y > 680) {
    doc.addPage();
    y = M;
  }
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(
    violations > 0
      ? `FINDING: ${violations} contravention(s) of the LMPC Rules, 2011 detected. The packer/manufacturer is directed to show cause within 15 days.`
      : "FINDING: No contravention of the LMPC Rules, 2011 detected in the declarations examined.",
    M,
    y,
    { maxWidth: W - 2 * M },
  );
  y += 60;
  doc.setFont("helvetica", "normal");
  doc.text("Signature of Inspecting Officer", W - M - 170, y);
  doc.text(inspector, W - M - 170, y + 14);

  doc.save(`LMPC-Notice-${(p.productName || "inspection").replace(/\s+/g, "-")}.pdf`);
}
