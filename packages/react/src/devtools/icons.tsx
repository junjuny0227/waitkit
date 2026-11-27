import type { ReactNode } from 'react';

interface IconProps {
  size?: number;
}

const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

/** Hourglass mark: Waitkit is about waiting. */
export function LogoIcon({ size = 14 }: IconProps): ReactNode {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" {...common}>
      <path d="M4 2h8M4 14h8M5 2c0 3 6 3.5 6 6s-6 3-6 6M11 2c0 3-6 3.5-6 6s6 3 6 6" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 14 }: IconProps): ReactNode {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" {...common}>
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

export function InfoIcon({ size = 14 }: IconProps): ReactNode {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" {...common}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7.5v3.5M8 5h.01" />
    </svg>
  );
}
