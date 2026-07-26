/**
 * Visualizes what the methodology steps describe in words: many raw
 * candidate hits are screened down to a small set of actually-included
 * studies. Hand-coded SVG, same brand palette as hero-illustration.tsx —
 * no external image asset/tool.
 */
export function MethodologyFunnelIllustration({ className }: { className?: string }) {
  const candidateX = [20, 44, 68, 92, 116, 140, 164, 188, 212, 236, 260, 284];

  return (
    <svg viewBox="0 0 304 140" className={className} aria-hidden="true">
      {/* raw candidates, scattered along the top */}
      {candidateX.map((x, i) => (
        <rect
          key={x}
          x={x}
          y={i % 2 === 0 ? 8 : 16}
          width="10"
          height="10"
          rx="2"
          fill={i % 3 === 0 ? "#bcdadd" : "#dde3e8"}
        />
      ))}

      {/* the funnel */}
      <path
        d="M12 34 L292 34 L184 92 L184 118 L120 118 L120 92 Z"
        fill="#eef6f7"
        stroke="#0a7f8c"
        strokeWidth={1.75}
        strokeLinejoin="round"
      />

      {/* included studies, narrowed at the bottom */}
      <g stroke="#0b2540" strokeWidth={1.5}>
        <rect x="126" y="98" width="16" height="20" rx="2" fill="#0a7f8c" stroke="none" />
        <rect x="146" y="98" width="16" height="20" rx="2" fill="#0b2540" stroke="none" />
        <rect x="166" y="98" width="16" height="20" rx="2" fill="#0a7f8c" stroke="none" />
      </g>
    </svg>
  );
}
