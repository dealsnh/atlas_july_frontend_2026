// Atlas App — Main routing and auth
// CLIENT_CONFIG lives in constants/clientConfig.ts

import { useState } from "react";
import { Route, Switch, Redirect } from "wouter";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import CountyScraper from "./pages/CountyScraper";
import PropertyCondition from "./pages/PropertyCondition";
import Settings from "./pages/Settings";
import { CLIENT_CONFIG } from "@/constants/clientConfig";

export { CLIENT_CONFIG };

export default function App() {
  const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem("atlas_auth"));
  const [apiKeys, setApiKeys] = useState<{ googleMaps: string; openAi: string }>(() => {
    try {
      return JSON.parse(localStorage.getItem("atlas_api_keys") || "{}");
    } catch {
      return { googleMaps: "", openAi: "" };
    }
  });

  const handleLogin = () => {
    localStorage.setItem("atlas_auth", "1");
    setIsAuth(true);
  };

  if (!isAuth) {
    return (
      <Login
        companyName={CLIENT_CONFIG.companyName}
        userEmail={CLIENT_CONFIG.userEmail}
        userPassword={CLIENT_CONFIG.userPassword}
        accentColor={CLIENT_CONFIG.accentColor}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <AppLayout
      companyName={CLIENT_CONFIG.companyName}
      userEmail={CLIENT_CONFIG.userEmail}
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
            accentColor={CLIENT_CONFIG.accentColor}
          />
        </Route>
        <Route path="/property-condition">
          <PropertyCondition
            googleMapsConfigured={!!apiKeys.googleMaps}
            openAiConfigured={!!apiKeys.openAi}
            accentColor={CLIENT_CONFIG.accentColor}
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
  );
}
