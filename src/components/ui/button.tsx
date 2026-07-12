import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "dark"
  | "ghost"
  | "outline"
  | "destructive"
  | "success"
  | "icon";

export type ButtonSize = "sm" | "md" | "lg";

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  SharedProps & {
    loading?: boolean;
  };

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  SharedProps & {
    children: ReactNode;
  };

const variantClassName: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  dark: "btn-dark",
  ghost: "btn-ghost",
  outline: "btn-outline",
  destructive: "btn-destructive",
  success: "btn-success",
  icon: "btn-icon",
};

const sizeClassName: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

function buildClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className: string | undefined,
) {
  return [variantClassName[variant], sizeClassName[size], className]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buildClassName(variant, size, className)}
      data-loading={loading ? "true" : undefined}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a className={buildClassName(variant, size, className)} {...props}>
      {children}
    </a>
  );
}
