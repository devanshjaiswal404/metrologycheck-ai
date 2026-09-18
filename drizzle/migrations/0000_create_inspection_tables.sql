CREATE TABLE public.inspected_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  brand TEXT,
  mrp TEXT,
  net_quantity TEXT,
  unit_sale_price TEXT,
  manufacturer_name TEXT,
  manufacturer_address TEXT,
  consumer_care_email TEXT,
  consumer_care_phone TEXT,
  status TEXT NOT NULL DEFAULT 'review',
  violations_count INTEGER NOT NULL DEFAULT 0,
  inspector TEXT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspected_products TO anon, authenticated;
GRANT ALL ON public.inspected_products TO service_role;
ALTER TABLE public.inspected_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read inspections" ON public.inspected_products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert inspections" ON public.inspected_products FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.detected_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.inspected_products(id) ON DELETE CASCADE,
  rule_code TEXT NOT NULL,
  rule_title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'violation',
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.detected_violations TO anon, authenticated;
GRANT ALL ON public.detected_violations TO service_role;
ALTER TABLE public.detected_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read violations" ON public.detected_violations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert violations" ON public.detected_violations FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX idx_violations_product ON public.detected_violations(product_id);