import { MarketplaceLayout } from "@/components/marketplace-layout";
import { useListFeaturedProducts, useListStores } from "@workspace/api-client-react";
import { Product } from "@workspace/api-client-react";
import { useCart } from "@/hooks/use-cart";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ShoppingCart, ChevronRight, Wheat, Scissors, UtensilsCrossed, Shirt, Leaf, Grid3X3 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { CATEGORY_LABELS } from "@/i18n/translations";

const CATEGORIES = [
  { key: "Agriculture",      icon: Wheat,           color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { key: "Handicrafts",      icon: Scissors,        color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  { key: "Traditional Food", icon: UtensilsCrossed, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  { key: "Textiles",         icon: Shirt,           color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { key: "Natural Products", icon: Leaf,            color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { key: "Other",            icon: Grid3X3,         color: "bg-muted text-muted-foreground" },
] as const;

function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { t, lang } = useLanguage();

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="group overflow-hidden border-border hover:shadow-lg transition-shadow h-full" data-testid={`card-product-${product.id}`}>
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {product.images ? (
            <img src={product.images} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground/40" />
            </div>
          )}
          <Badge className="absolute top-2 start-2 text-xs" variant="secondary">
            {CATEGORY_LABELS[product.category]?.[lang] ?? product.category}
          </Badge>
        </div>
        <CardContent className="p-4">
          <Link href={`/marketplace/products/${product.id}`} className="block font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </Link>
          {product.storeName && (
            <p className="text-xs text-muted-foreground mt-0.5">{product.storeName}</p>
          )}
          <div className="flex items-center justify-between mt-3">
            <p className="text-lg font-bold text-primary">JD {product.price.toFixed(2)}</p>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={product.stock === 0}
              onClick={() => {
                addToCart(product);
                toast({ title: `${product.name} ${t("addedToCart")}` });
              }}
              data-testid={`button-add-to-cart-${product.id}`}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {product.stock === 0 ? t("outOfStock") : t("addToCart")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function MarketplacePage() {
  const { data: featuredProducts, isLoading } = useListFeaturedProducts();
  const { data: stores } = useListStores();
  const { t, lang } = useLanguage();

  return (
    <MarketplaceLayout>
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              {t("ruralMarketplace")}
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              {t("heroTitle")}
              <span className="text-primary"> {t("heroHighlight")}</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg">
              {t("heroDesc")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 items-center">
              <Link href="/marketplace/products">
                <Button size="lg" className="gap-2" data-testid="button-shop-now">
                  {t("shopNow")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                {stores?.length ?? 0} {t("storesCount")} · {featuredProducts?.length ?? 0} {t("products")}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">{t("shopByCategory")}</h2>
          <Link href="/marketplace/products" className="text-sm text-primary hover:underline flex items-center gap-1">
            {t("browseAll")} <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                href={`/marketplace/products?category=${encodeURIComponent(cat.key)}`}
                className={`block rounded-xl p-4 text-center cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 border border-border ${cat.color}`}
                data-testid={`category-${cat.key.toLowerCase().replace(/ /g, "-")}`}
              >
                <cat.icon className="w-7 h-7 mx-auto mb-2" />
                <p className="text-xs font-medium">{CATEGORY_LABELS[cat.key]?.[lang] ?? cat.key}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">{t("featuredProducts")}</h2>
          <Link href="/marketplace/products" className="text-sm text-primary hover:underline flex items-center gap-1">
            {t("viewAllProducts")} <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden border-border">
                <Skeleton className="aspect-[4/3] w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : featuredProducts && featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">{t("noProductsAvailable")}</p>
            <p className="text-sm mt-1">{t("noProductsAvailableSubtitle")}</p>
          </div>
        )}
      </section>
    </MarketplaceLayout>
  );
}
