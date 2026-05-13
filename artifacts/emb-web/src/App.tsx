import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Loader2 } from "lucide-react";

import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";

import AdminDashboardPage from "@/pages/admin/dashboard";
import AdminProductsPage from "@/pages/admin/products";
import AdminOrdersPage from "@/pages/admin/orders";
import AdminStorePage from "@/pages/admin/store";
import AdminAnalyticsPage from "@/pages/admin/analytics";

import MarketplacePage from "@/pages/marketplace/home";
import ProductsListPage from "@/pages/marketplace/products-list";
import ProductDetailPage from "@/pages/marketplace/product-detail";
import CartPage from "@/pages/marketplace/cart";
import CheckoutPage from "@/pages/marketplace/checkout";
import BuyerOrdersPage from "@/pages/marketplace/orders";
import OrderDetailPage from "@/pages/marketplace/order-detail";

import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function HomeRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  if (user.role === "admin") return <Redirect to="/admin/dashboard" />;
  return <Redirect to="/marketplace" />;
}

function RequireAuth({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  if (role && user.role !== role) return <Redirect to={user.role === "admin" ? "/admin/dashboard" : "/marketplace"} />;
  return <>{children}</>;
}

function AppThemeInit() {
  useTheme();
  return null;
}

function Router() {
  return (
    <>
      <AppThemeInit />
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />

        <Route path="/admin/dashboard">
          <RequireAuth role="admin"><AdminDashboardPage /></RequireAuth>
        </Route>
        <Route path="/admin/products">
          <RequireAuth role="admin"><AdminProductsPage /></RequireAuth>
        </Route>
        <Route path="/admin/orders">
          <RequireAuth role="admin"><AdminOrdersPage /></RequireAuth>
        </Route>
        <Route path="/admin/store">
          <RequireAuth role="admin"><AdminStorePage /></RequireAuth>
        </Route>
        <Route path="/admin/analytics">
          <RequireAuth role="admin"><AdminAnalyticsPage /></RequireAuth>
        </Route>

        <Route path="/marketplace">
          <RequireAuth role="buyer"><MarketplacePage /></RequireAuth>
        </Route>
        <Route path="/marketplace/products">
          <RequireAuth role="buyer"><ProductsListPage /></RequireAuth>
        </Route>
        <Route path="/marketplace/products/:id">
          {(params) => <RequireAuth role="buyer"><ProductDetailPage id={Number(params.id)} /></RequireAuth>}
        </Route>
        <Route path="/marketplace/cart">
          <RequireAuth role="buyer"><CartPage /></RequireAuth>
        </Route>
        <Route path="/marketplace/checkout">
          <RequireAuth role="buyer"><CheckoutPage /></RequireAuth>
        </Route>
        <Route path="/marketplace/orders">
          <RequireAuth role="buyer"><BuyerOrdersPage /></RequireAuth>
        </Route>
        <Route path="/marketplace/orders/:id">
          {(params) => <RequireAuth role="buyer"><OrderDetailPage id={Number(params.id)} /></RequireAuth>}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
