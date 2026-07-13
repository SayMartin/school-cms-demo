type Variant = "primary" | "secondary" | "outline" | "outline-green" | "danger" | "warning";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "border border-brand-green-dark bg-brand-green text-gray-900 hover:bg-brand-green-dark hover:text-white",
  secondary: "border border-gray-900 text-gray-900 hover:bg-gray-100",
  outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  "outline-green":
    "border border-brand-green-dark bg-white text-brand-green-dark hover:bg-brand-green-light",
  danger: "border border-red-700 bg-red-600 text-white hover:bg-red-700",
  warning: "border border-orange-500 bg-orange-500 text-white hover:bg-orange-600",
};

const SIZE: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-sm",
};

type ButtonProps =
  | {
      href: string;
      target?: string;
      rel?: string;
      variant?: Variant;
      size?: Size;
      className?: string;
      children?: React.ReactNode;
    }
  | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement> & {
        variant?: Variant;
        size?: Size;
      });

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base = `inline-flex items-center gap-2 rounded-md font-semibold transition-colors ${VARIANT[variant]} ${SIZE[size]}${className ? ` ${className}` : ""}`;
  if ("href" in props && props.href) {
    const { href, target, rel } = props as {
      href: string;
      target?: string;
      rel?: string;
    };
    return (
      <a href={href} target={target} rel={rel} className={base}>
        {children}
      </a>
    );
  }
  const {
    href: _href,
    target: _target,
    rel: _rel,
    ...buttonProps
  } = props as {
    href?: undefined;
    target?: string;
    rel?: string;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button {...buttonProps} className={`${base} disabled:opacity-50`}>
      {children}
    </button>
  );
}
