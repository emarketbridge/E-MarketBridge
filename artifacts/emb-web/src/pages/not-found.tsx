import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
        <Store className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="text-xl font-semibold text-foreground mt-3">{t("notFoundTitle")}</p>
      <p className="text-muted-foreground text-sm mt-2 max-w-sm">{t("notFoundDesc")}</p>
      <Link href="/">
        <Button className="mt-6" data-testid="button-go-home">{t("goToHome")}</Button>
      </Link>
    </div>
  );
}
