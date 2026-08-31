import { SchoolLogo } from "@/components/logo";

export function AuthBrand() {
  return (
    <div className="mb-8 flex items-center gap-3">
      <SchoolLogo size={36} color="#1f5a78" />
      <div>
        <p className="leading-tight">Demo Folk High School</p>
        <p className="leading-tight">Staff Portal</p>
      </div>
    </div>
  );
}
