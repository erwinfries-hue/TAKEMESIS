import { IconBase, type IconProps } from "./icon-base";

/**
 * One simple line icon per topic slug — purely visual navigation aid for the
 * topic grid/cards, never a source of factual meaning (the accessible name
 * stays the topic's text name; icons are aria-hidden via IconBase).
 */
const ICONS: Record<string, (props: IconProps) => React.ReactElement> = {
  "gesundheit-praevention": (props) => (
    <IconBase {...props}>
      <path d="M12 21s-7.5-4.6-9.5-9.1C1.2 8.7 2.6 5.5 5.7 5c2-.3 3.6.8 4.3 2.2C10.7 5.8 12.3 4.7 14.3 5c3.1.5 4.5 3.7 3.2 6.9C15.5 16.4 12 21 12 21z" />
    </IconBase>
  ),
  "ernaehrung-supplements": (props) => (
    <IconBase {...props}>
      <path d="M12 7c-.5-1.5-2-2.5-3.5-2M12 7c.5-1.5 2-2.5 3.5-2" />
      <path d="M12 7c4 0 6.5 2.8 6.5 6.3 0 3.8-3 7.2-6.5 7.2s-6.5-3.4-6.5-7.2C5.5 9.8 8 7 12 7z" />
    </IconBase>
  ),
  "schlaf-regeneration": (props) => (
    <IconBase {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
    </IconBase>
  ),
  "fitness-leistungsfaehigkeit": (props) => (
    <IconBase {...props}>
      <rect x="2" y="9" width="3" height="6" rx="1" />
      <rect x="19" y="9" width="3" height="6" rx="1" />
      <rect x="6" y="7" width="2" height="10" rx="1" />
      <rect x="16" y="7" width="2" height="10" rx="1" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </IconBase>
  ),
  "lernen-bildung": (props) => (
    <IconBase {...props}>
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13z" />
      <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13z" />
    </IconBase>
  ),
  "arbeit-produktivitaet": (props) => (
    <IconBase {...props}>
      <rect x="3" y="7.5" width="18" height="12" rx="1.5" />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </IconBase>
  ),
  "psychologie-wohlbefinden": (props) => (
    <IconBase {...props}>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V16h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z" />
    </IconBase>
  ),
  "beziehungen-kommunikation": (props) => (
    <IconBase {...props}>
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H6a2 2 0 0 1-2-2V6z" />
      <circle cx="9" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.8" fill="currentColor" stroke="none" />
    </IconBase>
  ),
  "kinder-erziehung": (props) => (
    <IconBase {...props}>
      <circle cx="8" cy="6" r="2.2" />
      <path d="M4 19v-2.5A3.5 3.5 0 0 1 7.5 13h1A3.5 3.5 0 0 1 12 16.5V19" />
      <circle cx="17" cy="9" r="1.6" />
      <path d="M14.3 19v-2A2.7 2.7 0 0 1 17 14.3h0A2.7 2.7 0 0 1 19.7 17v2" />
    </IconBase>
  ),
  "konsum-kaufentscheidungen": (props) => (
    <IconBase {...props}>
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </IconBase>
  ),
  "umwelt-nachhaltigkeit": (props) => (
    <IconBase {...props}>
      <path d="M5 19c8 0 14-6 14-14 0 0-11-2-14 6-2 5 0 8 0 8z" />
      <path d="M5 19c2-4 5-7 9-9" />
    </IconBase>
  ),
  "technologie-digital-life": (props) => (
    <IconBase {...props}>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3" />
    </IconBase>
  ),
};

/** Falls back to a plain circle outline for any slug without a dedicated icon, so a future 13th topic doesn't break rendering. */
function FallbackIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" />
    </IconBase>
  );
}

export function TopicIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? FallbackIcon;
  return <Icon className={className} />;
}
