import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

/** Shared line-icon defaults — decorative only (aria-hidden), inherits text color via currentColor so it adapts to light/dark without separate dark: variants. */
export function IconBase({ children, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}
