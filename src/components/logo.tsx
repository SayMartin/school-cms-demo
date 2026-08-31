export function SchoolLogo({
  size = 40,
  color = "#A6CFE6",
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="Demo Folk High School"
      className={className}
    >
      {/* Trefoil: three overlapping circles ("connections and opportunities together") */}
      <circle cx="100" cy="62" r="52" fill={color} />
      <circle cx="67.1" cy="119" r="52" fill={color} />
      <circle cx="132.9" cy="119" r="52" fill={color} />
    </svg>
  );
}
