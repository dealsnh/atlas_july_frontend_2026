// Atlas App — Main routing and auth
// CLIENT_CONFIG lives in constants/clientConfig.ts

import { useEffect, useState } from "react";
import { Route, Switch, Redirect } from "wouter";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CountyScraper from "./pages/CountyScraper";
import PropertyCondition from "./pages/PropertyCondition";
import Settings from "./pages/Settings";
import { CLIENT_CONFIG } from "@/constants/clientConfig";
import { APP_ROUTES } from "@/constants/appRoutes";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/store";

export { CLIENT_CONFIG };

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const [apiKeys, setApiKeys] = useState<{ googleMaps: string; openAi: string }>(() => {
    try {
      return JSON.parse(localStorage.getItem("atlas_api_keys") || "{}");
    } catch {
      return { googleMaps: "", openAi: "" };
    }
  });

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isLoading) {
    return (
      <>
        <Toaster />
        <div className="min-h-screen bg-[#080810] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster />
        <Switch>
          <Route path={APP_ROUTES.SIGNUP}>
            <Signup
              companyName={CLIENT_CONFIG.companyName}
              accentColor={CLIENT_CONFIG.accentColor}
            />
          </Route>
          <Route path={APP_ROUTES.LOGIN}>
            <Login
              companyName={CLIENT_CONFIG.companyName}
              accentColor={CLIENT_CONFIG.accentColor}
            />
          </Route>
          <Route>
            <Login
              companyName={CLIENT_CONFIG.companyName}
              accentColor={CLIENT_CONFIG.accentColor}
            />
          </Route>
        </Switch>
      </>
    );
  }

  return (
    <>
    <Toaster />
    <AppLayout
      companyName={CLIENT_CONFIG.companyName}
      accentColor={CLIENT_CONFIG.accentColor}
    >
      <Switch>
        <Route path="/">
          <Redirect to="/county-scraper" />
        </Route>
        <Route path="/county-scraper">
          <CountyScraper
            counties={CLIENT_CONFIG.counties.map((c) => ({
              name: c.name,
              state: c.state,
              leadTypes: [...c.leadTypes],
            }))}
          />
        </Route>
        <Route path="/property-condition">
          <PropertyCondition
            googleMapsConfigured={!!apiKeys.googleMaps}
            openAiConfigured={!!apiKeys.openAi}
          />
        </Route>
        <Route path="/settings">
          <Settings />
        </Route>
        <Route>
          <Redirect to="/county-scraper" />
        </Route>
      </Switch>
    </AppLayout>
    </>
  );
}
