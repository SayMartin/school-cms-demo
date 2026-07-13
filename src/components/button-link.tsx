import Link from "next/link";
import { ExternalLink } from "lucide-react";

type Variant = "primary" | "secondary" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:   "border border-brand-green-dark bg-brand-green text-gray-900 hover:bg-brand-green-dark hover:text-white",
  secondary: "border border-gray-900 text-gray-900 hover:bg-gray-100",
  outline:   "border border-gray-300 text-gray-700 hover:bg-gray-50",
};

const SIZE: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-sm",
};

interface ButtonLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  external?: boolean;
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  external = false,
}: ButtonLinkProps) {
  const cls = `btn-link inline-flex items-center gap-2 rounded-md font-semibold transition-colors ${VARIANT[variant]} ${SIZE[size]}${className ? ` ${className}` : ""}`;

  if (external) {
    const showIcon = href.startsWith("http");
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
        {showIcon && <ExternalLink className="h-4 w-4 shrink-0" />}
      </a>
    );
  }

  return <Link href={href} className={cls}>{children}</Link>;
}
