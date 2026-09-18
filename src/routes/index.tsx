import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Camera,
  CameraOff,
  Eye,
  EyeOff,
  FileDown,
  Save,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/supabase";
import { useLang } from "@/lib/lang";
import {
  auditProduct,
  boxTagsFor,
  compliantSample,
  emptyProduct,
  nonCompliantSample,
  summarize,
  t,
  type ProductData,
} from "@/lib/lmpc";
import { exportNotice } from "@/lib/pdf-notice";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "New Inspection — MetrologyCheck AI" },
      {
        name: "description",
        content:
          "Audit packaged commodity labels against Legal Metrology (Packaged Commodities) Rules, 2011 and issue official violation notices.",
      },
      { property: "og:title", content: "New Inspection — MetrologyCheck AI" },
      {
        property: "og:description",
        content: "Field console for Legal Metrology enforcement officers.",
      },
    ],
  }),
  component: Workspace,
});

const ANGLES = ["Front (PDP)", "Back Label", "Ingredients / MRP Panel"] as const;

function Workspace() {
  const { lang } = useLang();
  const [product, setProduct] = useState<ProductData>(emptyProduct);
  const [angle, setAngle] = useState<string>(ANGLES[0]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [showBoxes, setShowBoxes] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<string | null>("Rule 6(1)(a)");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const checks = useMemo(() => auditProduct(product), [product]);
  const { violations, reviews, status } = summarize(checks);
  const tags = useMemo(() => boxTagsFor(product, checks), [product, checks]);
  const hasData = product.productName.length > 0;

  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((tr) => tr.stop());
  }, []);

  async function toggleCam() {
    if (camOn) {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      setCamOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCamOn(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 50);
    } catch {
      toast.error("Camera unavailable on this device or permission denied.");
    }
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setImages((prev) => ({ ...prev, [angle]: canvas.toDataURL("image/jpeg", 0.8) }));
    toast.success(`Captured ${angle}`);
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImages((prev) => ({ ...prev, [angle]: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  async function saveInspection() {
    if (!hasData) {
      toast.error("Load or enter package declarations first.");
      return;
    }
    setSaving(true);
    try {
      const {
        data: { user },
      } = await db.auth.getUser();

      const dbStatus =
        status === "compliant"
          ? "COMPLIANT"
          : status === "review"
            ? "REVIEW_REQUIRED"
            : "NON_COMPLIANT";

      const payload: Record<string, unknown> = {
        product_name: product.productName,
        brand_name: product.brand,
        category: "Packaged Commodity",
        image_url:
          images.front ||
          images.back ||
          images.ingredients ||
          "https://placehold.co/600x400?text=Product+Scan",
        status: dbStatus,
        total_violations: violations,
      };
      if (user) payload.inspector_id = user.id;

      const { data, error } = await db
        .from("inspected_products")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;

      const failing = checks.filter((c) => c.status !== "pass");
      if (failing.length && data) {
        const { error: vErr } = await db.from("detected_violations").insert(
          failing.map((c) => ({
            product_id: data.id,
            rule_clause: c.code,
            violation_title: c.title,
            severity: c.status === "fail" ? "CRITICAL" : "MODERATE",
            extracted_text: c.detail,
            remediation:
              c.status === "fail"
                ? "Rectify the label declaration and re-verify before retail display."
                : "Manual officer review required to confirm compliance.",
          })),
        );
        if (vErr) throw vErr;
      }
      toast.success("Inspection saved to the registry.");
    } catch (error) {
      console.error("Supabase Save Error Details:", error);
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : error instanceof Error
            ? error.message
            : "unknown error";
      toast.error(`Could not save to the registry: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  const banner =
    status === "compliant"
      ? { label: t[lang].compliant, cls: "border-success/50 bg-success/10 text-success", Icon: CheckCircle2 }
      : status === "review"
        ? { label: t[lang].review, cls: "border-warning/50 bg-warning/10 text-warning", Icon: AlertTriangle }
        : { label: t[lang].nonCompliant, cls: "border-danger/50 bg-danger/10 text-danger", Icon: XCircle };

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6">
      {/* Quick test bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <FlaskConical className="size-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Simulation harness
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={() => setProduct(compliantSample)}
            className="rounded-lg border border-success/50 bg-success/10 px-4 py-2 text-xs font-bold text-success transition-colors hover:bg-success/20"
          >
            Load Compliant Sample
          </button>
          <button
            onClick={() => setProduct(nonCompliantSample)}
            className="rounded-lg border border-danger/50 bg-danger/10 px-4 py-2 text-xs font-bold text-danger transition-colors hover:bg-danger/20"
          >
            Load Non-Compliant Sample
          </button>
          <button
            onClick={() => setProduct(emptyProduct)}
            className="rounded-lg border border-border bg-muted px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT: capture */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-muted p-1">
            {ANGLES.map((a) => (
              <button
                key={a}
                onClick={() => setAngle(a)}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                  angle === a
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            className="mb-4 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background/60 px-4 py-6 text-center"
          >
            <Upload className="size-5 text-primary" />
            <p className="text-xs text-muted-foreground">
              Drag &amp; drop the <span className="font-semibold text-foreground">{angle}</span> image, or
            </p>
            <label className="cursor-pointer rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/60">
              Browse files
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
            <div className="mt-2 flex gap-2">
              <button
                onClick={toggleCam}
                className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-semibold hover:border-primary/60"
              >
                {camOn ? <CameraOff className="size-3.5" /> : <Camera className="size-3.5" />}
                {camOn ? "Stop webcam" : "Live webcam"}
              </button>
              {camOn && (
                <button
                  onClick={captureFrame}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                >
                  Capture frame
                </button>
              )}
            </div>
          </div>

          {camOn && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="mb-4 w-full rounded-lg border border-border"
            />
          )}

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Annotated preview — {angle}</h2>
            <button
              onClick={() => setShowBoxes((s) => !s)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-semibold hover:border-primary/60"
            >
              {showBoxes ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              {showBoxes ? "Hide tags" : "Show tags"}
            </button>
          </div>

          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-border bg-background">
            {images[angle] ? (
              <img src={images[angle]} alt={angle} className="size-full object-cover opacity-80" />
            ) : (
              <div className="flex size-full items-center justify-center bg-[repeating-linear-gradient(45deg,transparent,transparent_12px,var(--muted)_12px,var(--muted)_13px)]">
                <p className="max-w-[60%] text-center text-xs text-muted-foreground">
                  No image for this angle. Bounding-box tags below are rendered from the detected
                  declarations.
                </p>
              </div>
            )}
            {showBoxes &&
              hasData &&
              tags.map((b) => (
                <div
                  key={b.label + b.y}
                  className={`absolute rounded-md border-2 ${
                    b.ok ? "border-success bg-success/10" : "border-danger bg-danger/10"
                  }`}
                  style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
                >
                  <span
                    className={`absolute -top-2 left-1 max-w-[95%] truncate rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      b.ok ? "bg-success text-success-foreground" : "bg-danger text-danger-foreground"
                    }`}
                  >
                    {b.label}
                  </span>
                </div>
              ))}
          </div>
        </section>

        {/* RIGHT: audit engine */}
        <section className="space-y-4">
          <div className={`flex items-center gap-4 rounded-xl border p-5 ${banner.cls}`}>
            <banner.Icon className="size-9 shrink-0" />
            <div>
              <p className="text-2xl font-black tracking-tight">{banner.label}</p>
              <p className="text-xs font-semibold opacity-90">
                {violations} violation(s) · {reviews} review item(s) · {checks.length} clauses audited
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold">LMPC 2011 statutory checklist</h2>
              <p className="text-xs text-muted-foreground">
                {hasData ? product.productName : "Load a sample to run the audit engine."}
              </p>
            </div>
            <div className="divide-y divide-border">
              {checks.map((c) => {
                const isOpen = open === c.code;
                const tone =
                  c.status === "pass"
                    ? "text-success"
                    : c.status === "review"
                      ? "text-warning"
                      : "text-danger";
                const Icon =
                  c.status === "pass" ? CheckCircle2 : c.status === "review" ? AlertTriangle : XCircle;
                return (
                  <div key={c.code}>
                    <button
                      onClick={() => setOpen(isOpen ? null : c.code)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
                    >
                      <Icon className={`size-4 shrink-0 ${tone}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground">{c.code}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {lang === "en" ? c.title : c.titleHi}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black uppercase ${tone}`}>
                        {c.status === "pass" ? "PASS" : c.status === "review" ? "REVIEW" : "VIOLATION"}
                      </span>
                      <ChevronDown
                        className={`size-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-border bg-background/40 px-4 py-3">
                        <p className="text-xs leading-relaxed text-foreground">
                          {lang === "en" ? c.title : c.titleHi}
                        </p>
                        <p className={`mt-2 text-xs leading-relaxed ${tone}`}>
                          {lang === "en" ? c.detail : c.detailHi}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={saveInspection}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Inspection
            </button>
            <button
              onClick={() => exportNotice(product, checks, "Officer Devansh - Zone 1")}
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm font-bold text-foreground transition-colors hover:border-primary/60"
            >
              <FileDown className="size-4 text-primary" />
              Export Official PDF Notice
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-bold">Detected declarations (editable)</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["productName", "Product name"],
                  ["brand", "Brand"],
                  ["mrpText", "Retail sale price line"],
                  ["netQuantity", "Net quantity line"],
                  ["uspText", "Unit sale price line"],
                  ["manufacturerName", "Manufacturer / packer"],
                  ["manufacturerAddress", "Postal address with PIN"],
                  ["consumerEmail", "Consumer care e-mail"],
                  ["consumerPhone", "Consumer care telephone"],
                ] as [keyof ProductData, string][]
              ).map(([key, label]) => (
                <label key={key} className="text-xs">
                  <span className="mb-1 block font-semibold text-muted-foreground">{label}</span>
                  <input
                    value={product[key]}
                    onChange={(e) => setProduct({ ...product, [key]: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                  />
                </label>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
