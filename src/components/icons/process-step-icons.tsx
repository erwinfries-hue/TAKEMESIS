import { IconBase, type IconProps } from "./icon-base";

/**
 * Icon set for the process-timeline steps: enter question, refine, search
 * studies, check eligibility, free teaser, pay, full report. Used in full
 * (all 7, in order) by /methodology; the homepage's compressed 4-step
 * summary picks a subset of these by index (see src/app/page.tsx).
 */
export const PROCESS_STEP_ICONS: Array<(props: IconProps) => React.ReactElement> = [
  (props) => (
    <IconBase {...props}>
      <path d="M15.5 4.5l4 4L8 20H4v-4L15.5 4.5z" />
    </IconBase>
  ),
  (props) => (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  ),
  (props) => (
    <IconBase {...props}>
      <circle cx="10" cy="10" r="6" />
      <line x1="14.5" y1="14.5" x2="20" y2="20" />
    </IconBase>
  ),
  (props) => (
    <IconBase {...props}>
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </IconBase>
  ),
  (props) => (
    <IconBase {...props}>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.5" />
    </IconBase>
  ),
  (props) => (
    <IconBase {...props}>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </IconBase>
  ),
  (props) => (
    <IconBase {...props}>
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5A1 1 0 0 1 7 3.5z" />
      <path d="M14 3.5V8h4" />
      <line x1="8.5" y1="12" x2="15" y2="12" />
      <line x1="8.5" y1="15" x2="15" y2="15" />
    </IconBase>
  ),
];
