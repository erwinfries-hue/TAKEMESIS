/**
 * A literal illustration of the brand claim ("FROM STUDIES TO CLARITY."):
 * a scattered cluster of study documents on the left resolves into one
 * clear, checked report on the right. Hand-drawn SVG (no external image
 * asset/tool), using only the existing brand palette (navy/teal/neutral)
 * so it reads as part of the same design system as the line icons rather
 * than a bolted-on illustration.
 */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 130" className={className} aria-hidden="true">
      {/* scattered studies, left */}
      <g stroke="#0b2540" strokeWidth={1.5} strokeLinejoin="round">
        <g transform="rotate(-10 50 55)">
          <rect x="30" y="30" width="46" height="58" rx="4" fill="#f8fafb" />
          <line x1="38" y1="44" x2="68" y2="44" stroke="#dde3e8" />
          <line x1="38" y1="53" x2="68" y2="53" stroke="#dde3e8" />
          <line x1="38" y1="62" x2="58" y2="62" stroke="#dde3e8" />
        </g>
        <g transform="rotate(7 78 58)">
          <rect x="56" y="26" width="46" height="58" rx="4" fill="#eef6f7" />
          <line x1="64" y1="40" x2="94" y2="40" stroke="#bcdadd" />
          <line x1="64" y1="49" x2="94" y2="49" stroke="#bcdadd" />
          <line x1="64" y1="58" x2="82" y2="58" stroke="#bcdadd" />
        </g>
        <g transform="rotate(-4 92 66)">
          <rect x="70" y="40" width="46" height="58" rx="4" fill="#ffffff" />
          <line x1="78" y1="54" x2="108" y2="54" stroke="#dde3e8" />
          <line x1="78" y1="63" x2="108" y2="63" stroke="#dde3e8" />
          <line x1="78" y1="72" x2="98" y2="72" stroke="#dde3e8" />
        </g>
      </g>

      {/* converging path toward clarity */}
      <path
        d="M124 62 C 175 30, 210 30, 246 62"
        fill="none"
        stroke="#0a7f8c"
        strokeWidth={2}
        strokeDasharray="1 7"
        strokeLinecap="round"
      />
      <path
        d="M238 55 L 248 62 L 238 69"
        fill="none"
        stroke="#0a7f8c"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* clarity: one resolved report, right */}
      <g>
        <rect
          x="256"
          y="20"
          width="70"
          height="90"
          rx="5"
          fill="#ffffff"
          stroke="#0b2540"
          strokeWidth={1.75}
        />
        <line x1="268" y1="38" x2="314" y2="38" stroke="#0b2540" strokeWidth={2.5} strokeLinecap="round" />
        <line x1="268" y1="50" x2="314" y2="50" stroke="#dde3e8" strokeWidth={1.5} />
        <line x1="268" y1="59" x2="314" y2="59" stroke="#dde3e8" strokeWidth={1.5} />
        <line x1="268" y1="68" x2="300" y2="68" stroke="#dde3e8" strokeWidth={1.5} />
        <circle cx="315" cy="92" r="16" fill="#0a7f8c" />
        <path
          d="M308 92 l 5 5 l 10 -11"
          fill="none"
          stroke="#ffffff"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
