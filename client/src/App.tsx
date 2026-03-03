import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Router as WouterRouter, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthGate from "./components/AuthGate";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import RequestAccess from "./pages/RequestAccess";
import Connections from "./pages/Connections";

// Strip trailing slash so wouter receives "/Intel-Platform" not "/Intel-Platform/"
// In dev BASE_URL is "/" → base becomes "" (wouter default = root).
const routerBase = import.meta.env.BASE_URL.replace(/\/$/, "");

function AppRoutes() {
  return (
    <Switch>
      <Route path="/">
        <AuthGate><Home /></AuthGate>
      </Route>
      <Route path="/profile/:id">
        <AuthGate><Profile /></AuthGate>
      </Route>
      <Route path="/admin">
        <AuthGate requireAdmin><Admin /></AuthGate>
      </Route>
      <Route path="/connections">
        <AuthGate><Connections /></AuthGate>
      </Route>
      <Route path="/request-access" component={RequestAccess} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <WouterRouter base={routerBase}>
            <AppRoutes />
          </WouterRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
