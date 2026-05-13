import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
        <Store className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="text-xl font-semibold text-foreground mt-3">Page not found</p>
      <p className="text-muted-foreground text-sm mt-2 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <a>
          <Button className="mt-6" data-testid="button-go-home">Go to Home</Button>
        </a>
      </Link>
    </div>
  );
}
