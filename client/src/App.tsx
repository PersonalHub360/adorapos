import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Customers from "@/pages/customers";
import Sales from "@/pages/sales";
import Inventory from "@/pages/inventory";
import Reports from "@/pages/reports";

function Router() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={Login} />
      </Switch>
    );
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between h-16 px-6 border-b bg-background shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {isAdmin ? 'Admin Panel' : 'Cashier Panel'}
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <Switch>
              {isAdmin ? (
                <>
                  <Route path="/" component={Dashboard} />
                  <Route path="/products" component={Products} />
                  <Route path="/customers" component={Customers} />
                  <Route path="/sales" component={Sales} />
                  <Route path="/inventory" component={Inventory} />
                  <Route path="/reports" component={Reports} />
                </>
              ) : (
                <>
                  <Route path="/" component={Sales} />
                  <Route path="/customers" component={Customers} />
                  <Route path="/products" component={Products} />
                </>
              )}
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
