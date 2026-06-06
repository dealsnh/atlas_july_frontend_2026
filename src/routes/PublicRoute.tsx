import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/appRoutes";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/auth/authStore";

interface PublicRouteProps {
  children: ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">Checking your session...</p>
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to={APP_ROUTES.COUNTY_SCRAPER} replace />;
  return <>{children}</>;
}
