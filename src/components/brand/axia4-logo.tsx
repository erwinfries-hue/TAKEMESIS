import Image from "next/image";

/**
 * Official AXIA4 logo (docs/assets/brand/AXIA4_OFFICIAL_LOGO_REFERENCE.png,
 * copied verbatim into public/brand/ — geometry/wording/colors unchanged per
 * 13_DESIGN_SYSTEM_BRAND_AND_ASSETS.md). The source file is a baseline JPEG
 * with a white background baked in (no alpha channel) — wrapping it in a
 * small white badge keeps it legible on this app's real dark-mode background
 * instead of showing a stray white box. A transparent PNG/SVG requested
 * directly from AXIA4 would let this wrapper go away; not done here since
 * only this reference file currently exists (see OPEN_RISKS.md).
 */
export function Axia4Logo({ alt, className }: { alt: string; className?: string }) {
  return (
    <span className={`inline-block rounded-md bg-white p-1.5 shadow-sm ${className ?? ""}`}>
      <Image
        src="/brand/axia4-logo.jpg"
        alt={alt}
        width={1536}
        height={466}
        className="h-5 w-auto"
      />
    </span>
  );
}
