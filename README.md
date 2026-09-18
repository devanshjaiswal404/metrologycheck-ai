# MetrologyCheck AI

Create a complete, high-contrast Legal Metrology Compliance Inspection Platform called "MetrologyCheck AI" for enforcement officers under the Legal Metrology (Packaged Commodities) Rules, 2011.

Theme & Styling:

- Modern dark-slate institutional aesthetic with Emerald Green (Compliant), Crimson Red (Violation), and Amber (Review Required) badges.

- Tailwind CSS, Lucide React icons, and accessible card layouts.

Core Views & Navigation:

1. Top Bar:

   - Official title: "MetrologyCheck AI — Legal Metrology Division".

   - Inspector badge ("Officer Devansh - Zone 1").

   - Language selector toggle (English / हिन्दी).

   - "New Inspection" and "Registry Records" navigation tabs.

2. Main Inspection Workspace:

   - Top Action Bar: Add two quick-test simulation buttons for instant testing:

     * Button 1: "Load Compliant Sample" (Loads sample Atta pack data: MRP ₹240.00 incl. of all taxes, 5 kg, USP ₹48.00/kg, full mfr address, email, phone).

     * Button 2: "Load Non-Compliant Sample" (Loads sample Biscuit pack: MRP ₹30 without tax declaration, Net Qty "200 gms" violating Rule 6(1)(c), missing consumer care email).

   - Left Side (Image Upload & Annotation):

     * Multi-angle tabs: "Front (PDP)", "Back Label", "Ingredients / MRP Panel".

     * File upload drag-and-drop area + live webcam capture preview.

     * Visual preview card with toggleable green and red bounding-box tags over detected text segments.

   - Right Side (Compliance Audit Engine):

     * Overall Status Banner: Large badge ("NON-COMPLIANT" or "COMPLIANT") with violation counter.

     * Accordion checklist for LMPC 2011 statutory clauses:

       - Rule 6(1)(a): Manufacturer / Packer name and postal address with PIN.

       - Rule 6(1)(c) & Rule 12: Standard SI Unit check (flags non-standard symbols like "gms", "kilos", "ml.").

       - Rule 6(1)(e): MRP declaration format (flags missing "inclusive of all taxes").

       - Rule 6(11): Unit Sale Price (USP) calculation (validates MRP / quantity).

       - Rule 6(1)(n): Consumer grievance redressal (validates email, telephone helpline, and address).

     * Action Buttons:

       - "Save Inspection to Supabase" (inserts into inspected_products and detected_violations).

       - "Export Official PDF Notice" (generates a printable legal violation report using jsPDF).

3. Inspection Records Repository (Second View):

   - Searchable, filterable table showing past scans from the Supabase database.

   - Columns: Product Name, Brand, Scanned Date, Status Badge, Violations Count, Action (View Audit).

Include mock functions and local state fallbacks so the entire UI, bounding-box preview, and PDF export work seamlessly out of the box.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8c9ee891-ed8b-4925-a0d7-afe6e4773502).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
