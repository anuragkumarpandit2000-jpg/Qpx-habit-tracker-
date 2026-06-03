import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Character from "@/pages/character";
import Quests from "@/pages/quests";
import Achievements from "@/pages/achievements";
import Journal from "@/pages/journal";
import Stats from "@/pages/stats";
import BossBattles from "@/pages/boss-battles";
import Inventory from "@/pages/inventory";
import Rewards from "@/pages/rewards";
import Settings from "@/pages/settings";
import Chapter10 from "@/pages/chapter10";

import { Layout } from "@/components/layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const status = (error as { status?: number })?.status;
        if (status === 404 || status === 401 || status === 403) return false;
        return failureCount < 2;
      },
      throwOnError: false,
    },
    mutations: {
      throwOnError: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Onboarding} />
      
      <Route path="/dashboard">
        <Layout><Dashboard /></Layout>
      </Route>
      <Route path="/character">
        <Layout><Character /></Layout>
      </Route>
      <Route path="/quests">
        <Layout><Quests /></Layout>
      </Route>
      <Route path="/achievements">
        <Layout><Achievements /></Layout>
      </Route>
      <Route path="/journal">
        <Layout><Journal /></Layout>
      </Route>
      <Route path="/stats">
        <Layout><Stats /></Layout>
      </Route>
      <Route path="/boss-battles">
        <Layout><BossBattles /></Layout>
      </Route>
      <Route path="/inventory">
        <Layout><Inventory /></Layout>
      </Route>
      <Route path="/rewards">
        <Layout><Rewards /></Layout>
      </Route>
      <Route path="/settings">
        <Layout><Settings /></Layout>
      </Route>
      <Route path="/chapter10">
        <Layout><Chapter10 /></Layout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
