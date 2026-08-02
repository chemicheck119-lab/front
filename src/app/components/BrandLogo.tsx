interface BrandLogoProps {
  variant?: "header" | "login";
  className?: string;
}

export function BrandLogo({ variant = "header", className = "" }: BrandLogoProps) {
  const isLogin = variant === "login";

  return (
    <div
      className={`inline-flex items-center ${isLogin ? "gap-3" : "gap-2.5"} ${className}`}
      role="img"
      aria-label="케미체크119 화학재난대응지원시스템"
    >
      <img
        src="/brand/chemicheck119-mark.png"
        alt=""
        aria-hidden="true"
        className={`${isLogin ? "h-14 w-14" : "h-9 w-9"} shrink-0 object-contain`}
      />
      <span className="min-w-0 text-left leading-none">
        <span className={`${isLogin ? "text-2xl" : "text-lg"} block whitespace-nowrap font-black tracking-[-0.055em] text-foreground`}>
          케미체크<span className="text-primary">119</span>
        </span>
        <span className={`${isLogin ? "mt-1.5 text-[13px]" : "mt-1 text-xs"} block whitespace-nowrap font-semibold tracking-[-0.025em] text-muted-foreground`}>
          화학재난대응지원시스템
        </span>
      </span>
    </div>
  );
}
