import { MarketplaceLayout } from "@/components/marketplace-layout";
import { useGetProduct, useGetStore, getGetProductQueryKey, getGetStoreQueryKey } from "@workspace/api-client-react";
import { useCart } from "@/hooks/use-cart";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ShoppingCart, Store, MapPin, ChevronLeft, Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ProductDetailPage({ id }: { id: number }) {
  const { data: product, isLoading } = useGetProduct(id, {
    query: { queryKey: getGetProductQueryKey(id) },
  });
  const { data: store } = useGetStore(product?.storeId ?? 0, {
    query: { enabled: !!product?.storeId, queryKey: getGetStoreQueryKey(product?.storeId ?? 0) },
  });
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <MarketplaceLayout>
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  if (!product) {
    return (
      <MarketplaceLayout>
        <div className="max-w-5xl mx-auto px-4 py-20 text-center text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Product not found</p>
          <Link href="/marketplace/products">
            <Button variant="outline" className="mt-4">Back to products</Button>
          </Link>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/marketplace/products" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 w-fit">
          <ChevronLeft className="h-4 w-4" />
          Back to products
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
            <div className="aspect-square rounded-xl overflow-hidden bg-muted border border-border">
              {product.images ? (
                <img src={product.images} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-20 h-20 text-muted-foreground/40" />
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div>
              <Badge variant="secondary" className="mb-2">{product.category}</Badge>
              <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
              {product.storeName && (
                <p className="text-muted-foreground text-sm mt-1">by {product.storeName}</p>
              )}
            </div>

            <p className="text-4xl font-bold text-primary">JD {product.price.toFixed(2)}</p>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            <div className="flex items-center gap-2 text-sm">
              <span className={product.stock > 0 ? "text-emerald-600 font-medium" : "text-destructive font-medium"}>
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </span>
            </div>

            {product.stock > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">Quantity</span>
                  <div className="flex items-center gap-2 border border-border rounded-lg overflow-hidden">
                    <button className="p-2 hover:bg-muted transition-colors" onClick={() => setQty(Math.max(1, qty - 1))} data-testid="button-qty-minus">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-2 text-sm font-medium" data-testid="text-qty">{qty}</span>
                    <button className="p-2 hover:bg-muted transition-colors" onClick={() => setQty(Math.min(product.stock, qty + 1))} data-testid="button-qty-plus">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={() => {
                    for (let i = 0; i < qty; i++) addToCart(product);
                    toast({ title: `${qty}x ${product.name} added to cart` });
                  }}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </Button>
                <Link href="/marketplace/cart">
                  <Button variant="outline" size="lg" className="w-full">View Cart</Button>
                </Link>
              </div>
            )}

            {store && (
              <div className="border border-border rounded-xl p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 font-semibold">Sold by</p>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                    {store.logo ? (
                      <img src={store.logo} alt={store.storeName} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{store.storeName}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span>{store.location}, {store.ruralArea}</span>
                    </div>
                    {store.contactInfo && <p className="text-xs text-muted-foreground mt-0.5">{store.contactInfo}</p>}
                    {store.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{store.description}</p>}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
