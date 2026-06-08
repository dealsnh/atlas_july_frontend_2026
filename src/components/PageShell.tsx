import type { ReactNode } from "react";

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: "5xl" | "6xl" | "7xl";
}

const SHELL_WIDTH: Record<NonNullable<PageShellProps["maxWidth"]>, string> = {
  "5xl": "atlas-page-shell--5xl",
  "6xl": "atlas-page-shell--6xl",
  "7xl": "",
};

export default function PageShell({
  title,
  subtitle,
  actions,
  children,
  maxWidth = "7xl",
}: PageShellProps) {
  const widthClass = SHELL_WIDTH[maxWidth];

  return (
    <div className={`atlas-page-shell ${widthClass}`.trim()}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="atlas-page-title">{title}</h1>
          {subtitle ? <p className="atlas-page-subtitle">{subtitle}</p> : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
