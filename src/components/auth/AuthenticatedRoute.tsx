import { useCallback, useEffect, useState } from "react";
import { apiConfig } from "../../api/config";
import { getAuthenticatedSession } from "../../api/auth";
import { toUserFacingError, type UserFacingErrorInfo } from "../../api/client";
import type { SessionContextResponse } from "../../api/contracts";
import { LoginScreen } from "../../features/auth/LoginScreen";

interface AuthenticatedRouteProps {
  children: (session: SessionContextResponse | null) => React.ReactNode;
}

export default function AuthenticatedRoute({ children }: AuthenticatedRouteProps) {
  const [session, setSession] = useState<SessionContextResponse | null>(null);
  const [sessionError, setSessionError] = useState<UserFacingErrorInfo | null>(null);
  const [sessionChecking, setSessionChecking] = useState(apiConfig.authEnabled);

  const checkSession = useCallback(() => {
    if (!apiConfig.authEnabled) {
      setSessionChecking(false);
      return;
    }
    setSessionChecking(true);
    setSessionError(null);
    void getAuthenticatedSession()
      .then(setSession)
      .catch((error) => setSessionError(toUserFacingError(error)))
      .finally(() => setSessionChecking(false));
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  if (!apiConfig.authEnabled) return <>{children(null)}</>;
  if (session) return <>{children(session)}</>;

  return (
    <LoginScreen
      dataMode={apiConfig.demoEnabled ? "DEMO_SIMULATION" : apiConfig.baseUrl ? "LIVE_API" : "UNAVAILABLE"}
      authLoginUrl={apiConfig.authLoginUrl}
      sessionChecking={sessionChecking}
      sessionError={sessionError}
      onRetrySession={checkSession}
      onDemoLogin={() => undefined}
    />
  );
}
