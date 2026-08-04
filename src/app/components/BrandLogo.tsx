import darkLogo from "@/imports/logo-dark.jpg";
import lightLogo from "@/imports/logo-light.jpg";

interface BrandLogoProps {
  variant?: "header" | "login";
  className?: string;
}

export function BrandLogo({ variant = "header", className = "" }: BrandLogoProps) {
  const isLogin = variant === "login";

  return (
    <div
      className={`inline-flex items-center ${className}`}
      role="img"
      aria-label="케미가드 119 화학재난대응지원시스템"
    >
      <img
        src={lightLogo}
        alt=""
        aria-hidden="true"
        className={`${isLogin ? "h-14 max-w-[340px]" : "h-9 max-w-[220px]"} w-auto shrink-0 object-contain dark:hidden`}
      />
      <img
        src={darkLogo}
        alt=""
        aria-hidden="true"
        className={`${isLogin ? "h-14 max-w-[340px]" : "h-9 max-w-[220px]"} hidden w-auto shrink-0 object-contain dark:block`}
      />
    </div>
  );
}
