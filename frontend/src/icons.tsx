/* AgentFlow — SVG Icon Set (26 icons)
 *
 * Each icon is a pure React functional component that renders inline SVG.
 * Uses currentColor for fill/stroke so parent can control color via CSS.
 * Default viewBox is "0 0 20 20", size defaults to 16.
 */

import React from "react";

interface IconProps {
  size?: number;
  className?: string;
}

export const IconPlay: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path d="M5 3.5a.5.5 0 01.748-.434l11 7a.5.5 0 010 .868l-11 7A.5.5 0 015 17.5v-14z" />
  </svg>
);

export const IconStop: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <rect x="4" y="4" width="12" height="12" rx="1.5" />
  </svg>
);

export const IconDownload: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 2v12M4 10l6 6 6-6M2 16v1a1 1 0 001 1h14a1 1 0 001-1v-1" />
  </svg>
);

export const IconUpload: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 14V2M4 8l6-6 6 6M2 16v1a1 1 0 001 1h14a1 1 0 001-1v-1" />
  </svg>
);

export const IconSave: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 3h10l4 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" />
    <path d="M6 2v6h7V2M7 13h6v4H7z" />
  </svg>
);

export const IconUndo: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 8h8a5 5 0 015 5v0a5 5 0 01-5 5H8" />
    <path d="M7 4L3 8l4 4" />
  </svg>
);

export const IconRedo: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 8H9a5 5 0 00-5 5v0a5 5 0 005 5h1" />
    <path d="M13 4l4 4-4 4" />
  </svg>
);

export const IconLayout: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="16" height="16" rx="2" />
    <path d="M2 8h16M8 2v16" />
  </svg>
);

export const IconReset: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 10a7 7 0 10-7 7 6.94 6.94 0 004.9-2" />
    <path d="M17 4v5a1 1 0 01-1 1h-5" />
  </svg>
);

export const IconEvolution: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 2c0 0 1 3 3 4s3 1 4 1 3 1 4 4 1 5 1 7" />
    <path d="M16 2c0 0-1 3-3 4s-3 1-4 1-3 1-4 4-1 5-1 7" />
    <path d="M2 4c0 0 2 2 3 3s2 2 3 2 2 1 3 3 1 3 1 4" />
    <path d="M18 4c0 0-2 2-3 3s-2 2-3 2-2 1-3 3-1 3-1 4" />
  </svg>
);

export const IconAnalysis: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="12" width="4" height="6" rx="0.5" />
    <rect x="8" y="8" width="4" height="10" rx="0.5" />
    <rect x="14" y="4" width="4" height="14" rx="0.5" />
  </svg>
);

export const IconDesign: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1h-3" />
    <path d="M7 8l3 3 3-3" />
    <path d="M10 11V2" />
  </svg>
);

export const IconDevelop: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 6l4 4-4 4" />
    <path d="M10 14h6" />
  </svg>
);

export const IconTest: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M7 2h6l1 4H6l1-4z" />
    <path d="M4 6h12l-2 12H6L4 6z" />
    <path d="M10 10v4M10 10l-2-2M10 10l2-2" />
  </svg>
);

export const IconDoc: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 3h7l5 5v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" />
    <path d="M11 3v5h5" />
    <path d="M6 11h6M6 14h4" />
  </svg>
);

export const IconDeploy: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 2v12M6 10l4 4 4-4" />
    <path d="M2 16v1a1 1 0 001 1h14a1 1 0 001-1v-1" />
  </svg>
);

export const IconPlus: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="10" cy="10" r="8" />
    <path d="M10 6v8M6 10h8" />
  </svg>
);

export const IconTrash: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 5h14M6 5V3a1 1 0 011-1h6a1 1 0 011 1v2" />
    <path d="M5 5l1 12a1 1 0 001 1h6a1 1 0 001-1l1-12" />
    <path d="M8 8v6M12 8v6" />
  </svg>
);

export const IconSearch: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="8.5" cy="8.5" r="5.5" />
    <path d="M12.5 12.5L17 17" />
  </svg>
);

export const IconClose: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 5l10 10M15 5L5 15" />
  </svg>
);

export const IconChevronDown: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 8l4 4 4-4" />
  </svg>
);

export const IconChevronRight: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M8 6l4 4-4 4" />
  </svg>
);

export const IconMenu: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 5h14M3 10h14M3 15h14" />
  </svg>
);

export const IconSettings: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="10" cy="10" r="3" />
    <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M3.4 3.4l1.4 1.4M15.2 15.2l1.4 1.4M3.4 16.6l1.4-1.4M15.2 4.8l1.4-1.4" />
  </svg>
);

export const IconAI: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2z" />
    <path d="M6 13l-2 3h3l-1 2" />
    <path d="M14 13l2 3h-3l1 2" />
  </svg>
);

export const IconAgentFlow: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 3c0 0 1 3 3 4s3 1 4 1 3 1 4 4 1 5 1 5" />
    <path d="M16 3c0 0-1 3-3 4s-3 1-4 1-3 1-4 4-1 5-1 5" />
    <path d="M3 5c0 0 1 2 2 3s2 1 3 2 1 2 1 3" />
    <path d="M17 5c0 0-1 2-2 3s-2 1-3 2-1 2-1 3" />
    <circle cx="10" cy="3.5" r="1.2" fill="currentColor" />
    <circle cx="3.5" cy="10" r="1.2" fill="currentColor" />
    <circle cx="10" cy="16.5" r="1.2" fill="currentColor" />
    <circle cx="16.5" cy="10" r="1.2" fill="currentColor" />
  </svg>
);
