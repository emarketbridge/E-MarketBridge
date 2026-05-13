import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useCart } from "@/hooks/use-cart";
import { ShoppingCart, Sun, Moon, User, LogOut, ChevronDown, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/marketplace", label: "Home" },
  { href: "/marketplace/products", label: "Shop" },
  { href: "/marketplace/orders", label: "My Orders" },
];

export function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { cartItems } = useCart();
  const [location] = useLocation();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/marketplace" className="flex items-center gap-2 font-bold text-lg text-foreground" data-testid="link-home">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Store className="w-4 h-4 text-primary-foreground" />
              </div>
              <span>e-MarketBridge</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    location === link.href || location.startsWith(link.href + "/")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-muted-foreground"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Link href="/marketplace/cart" className="relative" data-testid="link-cart">
                <Button variant="ghost" size="icon" className="relative text-muted-foreground" asChild>
                  <span>
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {cartCount}
                      </Badge>
                    )}
                  </span>
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" data-testid="button-user-menu">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline max-w-[100px] truncate">{user?.name}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/marketplace/orders" data-testid="menu-my-orders">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive" data-testid="menu-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <Store className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground text-sm">e-MarketBridge</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Empowering rural businesses in Jordan — connecting communities, one sale at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
