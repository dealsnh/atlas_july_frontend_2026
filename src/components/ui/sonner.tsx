import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ theme = "dark", ...props }: ToasterProps) => (
  <Sonner
    theme={theme}
    className="toaster group"
    richColors
    closeButton
    position="top-right"
    style={
      {
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
      } as React.CSSProperties
    }
    {...props}
  />
);

export { Toaster };
