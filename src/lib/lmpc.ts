export type Lang = "en" | "hi";

export interface ProductData {
  productName: string;
  brand: string;
  mrpText: string;
  netQuantity: string;
  uspText: string;
  manufacturerName: string;
  manufacturerAddress: string;
  consumerEmail: string;
  consumerPhone: string;
}

export const emptyProduct: ProductData = {
  productName: "",
  brand: "",
  mrpText: "",
  netQuantity: "",
  uspText: "",
  manufacturerName: "",
  manufacturerAddress: "",
  consumerEmail: "",
  consumerPhone: "",
};

export const compliantSample: ProductData = {
  productName: "Chakki Fresh Atta",
  brand: "Annapurna Foods",
  mrpText: "MRP ₹240.00 (inclusive of all taxes)",
  netQuantity: "Net Qty: 5 kg",
  uspText: "Unit Sale Price: ₹48.00 per kg",
  manufacturerName: "Annapurna Foods Pvt. Ltd.",
  manufacturerAddress: "Plot 24, MIDC Industrial Area, Nashik, Maharashtra - 422007",
  consumerEmail: "care@annapurnafoods.in",
  consumerPhone: "1800-102-4455",
};

export const nonCompliantSample: ProductData = {
  productName: "Crunchy Glucose Biscuits",
  brand: "SweetBite",
  mrpText: "MRP ₹30",
  netQuantity: "Net Qty: 200 gms",
  uspText: "",
  manufacturerName: "SweetBite Bakers",
  manufacturerAddress: "Industrial Shed 8, Ghaziabad",
  consumerEmail: "",
  consumerPhone: "0120-4456",
};

export type CheckStatus = "pass" | "fail" | "review";

export interface RuleCheck {
  code: string;
  title: string;
  titleHi: string;
  status: CheckStatus;
  detail: string;
  detailHi: string;
}

const NON_STANDARD_UNITS = ["gms", "gm.", "grams", "kilos", "kgs", "ml.", "lts", "ltr", "litres."];

function parseNumber(text: string): number | null {
  const m = text.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  return m && m[1] ? parseFloat(m[1]) : null;
}

export function auditProduct(p: ProductData): RuleCheck[] {
  const checks: RuleCheck[] = [];

  // Rule 6(1)(a)
  const hasPin = /\b\d{6}\b/.test(p.manufacturerAddress);
  const hasName = p.manufacturerName.trim().length > 2;
  checks.push({
    code: "Rule 6(1)(a)",
    title: "Manufacturer / Packer name and complete postal address with PIN",
    titleHi: "निर्माता / पैकर का नाम और पिन सहित पूरा डाक पता",
    status: hasName && hasPin ? "pass" : "fail",
    detail: hasName
      ? hasPin
        ? `Declared: ${p.manufacturerName}, ${p.manufacturerAddress}`
        : "Postal address does not contain a valid 6-digit PIN code."
      : "Manufacturer / packer name is not declared on the principal display panel.",
    detailHi:
      hasName && hasPin
        ? "निर्माता का नाम और पता पिन कोड सहित घोषित है।"
        : "निर्माता का नाम / पिन कोड सहित पता अधूरा है।",
  });

  // Rule 6(1)(c) & Rule 12
  const qty = p.netQuantity.toLowerCase();
  const badUnit = NON_STANDARD_UNITS.find((u) => qty.includes(u));
  const hasQty = parseNumber(p.netQuantity) !== null;
  checks.push({
    code: "Rule 6(1)(c) & Rule 12",
    title: "Net quantity declared in standard SI units",
    titleHi: "मानक SI इकाइयों में शुद्ध मात्रा की घोषणा",
    status: !hasQty ? "fail" : badUnit ? "fail" : "pass",
    detail: !hasQty
      ? "Net quantity is not declared."
      : badUnit
        ? `Non-standard unit symbol "${badUnit}" used. Correct symbol is "g" / "kg" / "ml" / "l" without punctuation or plural.`
        : `Declared quantity "${p.netQuantity}" uses an approved SI symbol.`,
    detailHi: badUnit
      ? `अमानक इकाई "${badUnit}" का प्रयोग — सही प्रतीक "g" / "kg" / "ml" होना चाहिए।`
      : "मात्रा मानक SI प्रतीक में घोषित है।",
  });

  // Rule 6(1)(e)
  const mrpLower = p.mrpText.toLowerCase();
  const hasMrpValue = parseNumber(p.mrpText) !== null;
  const hasTaxPhrase = /incl|inclusive of all taxes/.test(mrpLower);
  checks.push({
    code: "Rule 6(1)(e)",
    title: "Retail sale price declared as MRP inclusive of all taxes",
    titleHi: "अधिकतम खुदरा मूल्य सभी करों सहित घोषित",
    status: hasMrpValue && hasTaxPhrase ? "pass" : hasMrpValue ? "fail" : "fail",
    detail: !hasMrpValue
      ? "No retail sale price declared."
      : hasTaxPhrase
        ? `Declared as "${p.mrpText}".`
        : 'Price declared without the mandatory phrase "inclusive of all taxes".',
    detailHi: hasTaxPhrase
      ? "मूल्य सभी करों सहित घोषित है।"
      : '"सभी करों सहित" वाक्यांश अनुपस्थित है।',
  });

  // Rule 6(11) USP
  const mrpValue = parseNumber(p.mrpText);
  const qtyValue = parseNumber(p.netQuantity);
  const uspValue = parseNumber(p.uspText);
  let uspStatus: CheckStatus = "fail";
  let uspDetail = "Unit sale price is not declared.";
  if (uspValue !== null && mrpValue !== null && qtyValue !== null && qtyValue > 0) {
    const expected = mrpValue / qtyValue;
    const ok = Math.abs(expected - uspValue) <= Math.max(0.05, expected * 0.02);
    uspStatus = ok ? "pass" : "review";
    uspDetail = ok
      ? `USP ₹${uspValue.toFixed(2)} matches MRP ₹${mrpValue.toFixed(2)} ÷ ${qtyValue}.`
      : `Declared USP ₹${uspValue.toFixed(2)} differs from computed ₹${expected.toFixed(2)} (MRP ÷ quantity).`;
  } else if (uspValue !== null) {
    uspStatus = "review";
    uspDetail = "USP declared but MRP or net quantity could not be parsed for verification.";
  }
  checks.push({
    code: "Rule 6(11)",
    title: "Unit sale price declaration and arithmetic verification",
    titleHi: "इकाई विक्रय मूल्य की घोषणा और गणना सत्यापन",
    status: uspStatus,
    detail: uspDetail,
    detailHi: uspStatus === "pass" ? "इकाई विक्रय मूल्य सही है।" : "इकाई विक्रय मूल्य अनुपस्थित/असंगत है।",
  });

  // Rule 6(1)(n)
  const emailOk = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(p.consumerEmail.trim());
  const phoneOk = p.consumerPhone.replace(/\D/g, "").length >= 10;
  const addrOk = p.manufacturerAddress.trim().length > 10;
  const grievanceOk = emailOk && phoneOk && addrOk;
  const missing = [
    !emailOk ? "consumer care e-mail" : null,
    !phoneOk ? "valid telephone helpline (min. 10 digits)" : null,
    !addrOk ? "grievance postal address" : null,
  ].filter(Boolean);
  checks.push({
    code: "Rule 6(1)(n)",
    title: "Consumer grievance redressal: name, address, e-mail and telephone",
    titleHi: "उपभोक्ता शिकायत निवारण: नाम, पता, ई-मेल और दूरभाष",
    status: grievanceOk ? "pass" : "fail",
    detail: grievanceOk
      ? `Helpline ${p.consumerPhone} and e-mail ${p.consumerEmail} declared.`
      : `Missing / invalid: ${missing.join(", ")}.`,
    detailHi: grievanceOk ? "शिकायत निवारण विवरण पूर्ण है।" : "शिकायत निवारण विवरण अपूर्ण है।",
  });

  return checks;
}

export function summarize(checks: RuleCheck[]) {
  const violations = checks.filter((c) => c.status === "fail").length;
  const reviews = checks.filter((c) => c.status === "review").length;
  const status: "compliant" | "violation" | "review" =
    violations > 0 ? "violation" : reviews > 0 ? "review" : "compliant";
  return { violations, reviews, status };
}

export interface BoxTag {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  ok: boolean;
}

export function boxTagsFor(p: ProductData, checks: RuleCheck[]): BoxTag[] {
  const byCode = (code: string) => checks.find((c) => c.code.startsWith(code))?.status !== "fail";
  return [
    { label: p.mrpText || "MRP not detected", x: 8, y: 10, w: 52, h: 14, ok: byCode("Rule 6(1)(e)") },
    { label: p.netQuantity || "Net qty not detected", x: 8, y: 32, w: 44, h: 13, ok: byCode("Rule 6(1)(c)") },
    { label: p.uspText || "USP not detected", x: 55, y: 32, w: 38, h: 13, ok: byCode("Rule 6(11)") },
    {
      label: p.manufacturerName || "Manufacturer not detected",
      x: 8,
      y: 56,
      w: 70,
      h: 16,
      ok: byCode("Rule 6(1)(a)"),
    },
    {
      label: p.consumerEmail || "Consumer care e-mail missing",
      x: 8,
      y: 78,
      w: 60,
      h: 13,
      ok: byCode("Rule 6(1)(n)"),
    },
  ];
}

export const t = {
  en: {
    newInspection: "New Inspection",
    registry: "Registry Records",
    compliant: "COMPLIANT",
    nonCompliant: "NON-COMPLIANT",
    review: "REVIEW REQUIRED",
  },
  hi: {
    newInspection: "नई जाँच",
    registry: "रजिस्ट्री रिकॉर्ड",
    compliant: "अनुपालक",
    nonCompliant: "गैर-अनुपालक",
    review: "समीक्षा आवश्यक",
  },
} as const;
