import { MarketplaceLayout } from "@/components/marketplace-layout";
import { useListOrders } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, ChevronRight, Package, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useState } from "react";
import { STATUS_LABELS } from "@/i18n/translations";

const statusConfig: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function BuyerOrdersPage() {
  const { data: orders, isLoading } = useListOrders();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { t, lang } = useLanguage();

  return (
    <MarketplaceLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("myOrdersTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{orders?.length ?? 0} {t("ordersCount")}</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground">{t("noOrdersBuyer")}</p>
            <p className="text-muted-foreground text-sm mt-1">{t("noOrdersBuyerSubtitle")}</p>
            <Link href="/marketplace/products">
              <Button className="mt-6" data-testid="button-shop">{t("startShoppingBtn")}</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const statusClass = statusConfig[order.status] ?? "";
              const statusLabel = STATUS_LABELS[order.status]?.[lang] ?? order.status;
              const expanded = expandedId === order.id;

              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border-border overflow-hidden" data-testid={`order-card-${order.id}`}>
                    <CardContent className="p-0">
                      <button
                        className="w-full flex items-center gap-4 px-4 py-4 text-start hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedId(expanded ? null : order.id)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground">
                              {lang === "ar" ? `طلب #${order.id}` : `Order #${order.id}`}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass}`} data-testid={`status-${order.id}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {order.items?.length ?? 0} {t("itemsPlural")} · {format(new Date(order.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <p className="font-bold text-foreground" data-testid={`total-${order.id}`}>JD {order.totalAmount.toFixed(2)}</p>
                          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </button>

                      {expanded && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border px-4 py-4 space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-semibold">{t("items")}</p>
                            {order.items?.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm py-1">
                                <span className="text-foreground">{item.productName ?? `#${item.productId}`} x{item.quantity}</span>
                                <span className="text-muted-foreground">JD {(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">{t("shippingTo")}</p>
                            <p className="text-sm text-foreground mt-1">{order.shippingAddress}</p>
                          </div>
                          <Link href={`/marketplace/orders/${order.id}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
                            {t("viewFullDetails")} <ChevronRight className="h-3 w-3" />
                          </Link>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </MarketplaceLayout>
  );
}
