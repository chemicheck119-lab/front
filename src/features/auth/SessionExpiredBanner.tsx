import { ExternalLink, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { normalizeAuthLoginUrl } from "./LoginScreen";

interface SessionExpiredBannerProps {
  authLoginUrl: string;
  hasIncident: boolean;
  requestId?: string;
}

export function SessionExpiredBanner({ authLoginUrl, hasIncident, requestId }: SessionExpiredBannerProps) {
  const [copied, setCopied] = useState(false);
  const safeAuthLoginUrl = normalizeAuthLoginUrl(authLoginUrl);

  return (
    <aside className="fixed left-1/2 top-16 z-[95] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-amber-500/40 bg-card p-4 shadow-2xl" role="alert" aria-label="로그인 세션 만료">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300"><LockKeyhole size={18} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">로그인 세션을 다시 확인해주세요</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {hasIncident
              ? "현재 사고·후보·현장 확인 기록은 이 화면에 유지됩니다. 새 창에서 로그인한 뒤 실패한 작업을 다시 실행하세요."
              : "새 창에서 로그인한 뒤 이 화면으로 돌아와 작업을 다시 실행하세요."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {safeAuthLoginUrl ? (
              <a href={safeAuthLoginUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-[11px] font-bold text-background">새 창에서 다시 로그인<ExternalLink size={12} /></a>
            ) : (
              <span className="inline-flex min-h-9 items-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 text-[10px] font-semibold text-amber-800 dark:text-amber-200">운영 인증 URL 설정 필요</span>
            )}
            {requestId && <button type="button" onClick={() => void navigator.clipboard.writeText(requestId).then(() => setCopied(true)).catch(() => setCopied(false))} className="min-h-9 rounded-lg border border-border px-3 text-[10px] font-semibold">{copied ? "요청 ID 복사됨" : `요청 ID ${requestId} 복사`}</button>}
          </div>
        </div>
      </div>
    </aside>
  );
}
