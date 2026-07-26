import { IconBase, type IconProps } from "./icon-base";

/** Leading icon for the amber warning-style notices (HighRiskNotice, SearchLimitNotice). */
export function WarningIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.5 21.5 20h-19L12 3.5z" strokeLinejoin="round" />
      <line x1="12" y1="10" x2="12" y2="14.5" />
      <circle cx="12" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

/** Leading icon for the neutral white informational notices (NotEligibleNotice, SearchFailedNotice). */
export function InfoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <circle cx="12" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  );
}
