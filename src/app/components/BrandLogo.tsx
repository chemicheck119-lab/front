import darkLogo from "@/imports/logo-dark.png";
import lightLogo from "@/imports/logo-light.png";

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
      aria-label="케미체크119 화학재난대응지원시스템"
    >
      <img
        src={lightLogo}
        alt=""
        aria-hidden="true"
        className={`${isLogin ? "h-16 max-w-[360px]" : "h-10 max-w-[230px]"} w-auto shrink-0 object-contain dark:hidden`}
      />
      <img
        src={darkLogo}
        alt=""
        aria-hidden="true"
        className={`${isLogin ? "h-16 max-w-[360px]" : "h-10 max-w-[230px]"} hidden w-auto shrink-0 object-contain dark:block`}
      />
    </div>
  );
}
