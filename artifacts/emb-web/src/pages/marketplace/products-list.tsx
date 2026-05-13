import { MarketplaceLayout } from "@/components/marketplace-layout";
import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { Product } from "@workspace/api-client-react";
import { useCart } from "@/hooks/use-cart";
import { useLanguage } from "@/hooks/use-language";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ShoppingCart, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { CATEGORY_LABELS } from "@/i18n/translations";

const CATEGORY_KEYS = ["All", "Agriculture", "Handicrafts", "Traditional Food", "Textiles", "Natural Products", "Other"] as const;

function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { t, lang } = useLanguage();

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
      <Card className="group overflow-hidden border-border hover:shadow-md transition-shadow h-full" data-testid={`card-product-${product.id}`}>
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
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Badge variant="destructive" className="text-xs">{t("outOfStock")}</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <Link href={`/marketplace/products/${product.id}`} className="block font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </Link>
          {product.storeName && <p className="text-xs text-muted-foreground mt-0.5">{product.storeName}</p>}
          {product.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>}
          <div className="flex items-center justify-between mt-3">
            <p className="text-lg font-bold text-primary" data-testid={`text-price-${product.id}`}>JD {product.price.toFixed(2)}</p>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={product.stock === 0}
              onClick={() => { addToCart(product); toast({ title: `${product.name} ${t("addedToCart")}` }); }}
              data-testid={`button-add-to-cart-${product.id}`}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {t("addToCart")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ProductsListPage() {
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);
  const initialCategory = params.get("category") ?? "";
  const { t, lang } = useLanguage();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory || "All");

  const queryParams = {
    category: category === "All" ? undefined : category,
    search: search || undefined,
  };

  const { data: products, isLoading } = useListProducts(queryParams, {
    query: { queryKey: getListProductsQueryKey(queryParams) },
  });

  return (
    <MarketplaceLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("browseProducts")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading ? t("loadingProducts") : `${products?.length ?? 0} ${t("productsAvailable")}`}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="ps-9 pe-10 bg-background"
            placeholder={t("searchProductsPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
          />
          {search && (
            <button className="absolute end-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORY_KEYS.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              data-testid={`filter-${cat.toLowerCase().replace(/ /g, "-")}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                category === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {CATEGORY_LABELS[cat]?.[lang] ?? cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden border-border">
                <Skeleton className="aspect-[4/3] w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">{t("noProductsFound")}</p>
            <p className="text-sm mt-1">{t("tryDifferentSearch")}</p>
            {(search || category !== "All") && (
              <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setCategory("All"); }}>
                {t("clearFilters")}
              </Button>
            )}
          </div>
        )}
      </div>
    </MarketplaceLayout>
  );
}
