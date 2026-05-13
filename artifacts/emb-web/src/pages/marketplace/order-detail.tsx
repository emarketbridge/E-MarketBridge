import { MarketplaceLayout } from "@/components/marketplace-layout";
import { useGetOrder, useGetPayment, getGetOrderQueryKey, getGetPaymentQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Package, MapPin, CreditCard, CheckCircle2, Clock, Truck } from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-amber-600" },
  processing: { label: "Processing", icon: Clock, color: "text-blue-600" },
  shipped: { label: "Shipped", icon: Truck, color: "text-purple-600" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-emerald-600" },
  cancelled: { label: "Cancelled", icon: Clock, color: "text-red-600" },
};

export default function OrderDetailPage({ id }: { id: number }) {
  const { data: order, isLoading } = useGetOrder(id, {
    query: { queryKey: getGetOrderQueryKey(id) },
  });
  const { data: payment } = useGetPayment(id, {
    query: { enabled: !!order, queryKey: getGetPaymentQueryKey(id) },
  });

  if (isLoading) {
    return (
      <MarketplaceLayout>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </MarketplaceLayout>
    );
  }

  if (!order) {
    return (
      <MarketplaceLayout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-medium text-foreground">Order not found</p>
          <Link href="/marketplace/orders">
            <Button variant="outline" className="mt-4">View all orders</Button>
          </Link>
        </div>
      </MarketplaceLayout>
    );
  }

  const status = statusConfig[order.status] ?? { label: order.status, icon: Clock, color: "text-muted-foreground" };
  const StatusIcon = status.icon;

  return (
    <MarketplaceLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <Link href="/marketplace/orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Back to orders
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Order #{order.id}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Placed {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <div className={`flex items-center gap-2 ${status.color}`}>
            <StatusIcon className="w-5 h-5" />
            <span className="font-semibold text-base" data-testid="text-order-status">{status.label}</span>
          </div>
        </div>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Items Ordered</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-2 border-b border-border last:border-0" data-testid={`order-item-${item.id}`}>
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.productName ?? `Product #${item.productId}`}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity} × JD {item.price.toFixed(2)}</p>
                </div>
                <p className="font-semibold text-foreground">JD {(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-bold text-primary text-lg" data-testid="text-order-total">JD {order.totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Delivery Address</p>
                <p className="text-muted-foreground text-sm mt-0.5">{order.shippingAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {payment && (
          <Card className="border-border">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">Payment</p>
                  <p className="text-muted-foreground text-sm mt-0.5 capitalize">
                    {payment.paymentMethod.replace("_", " ")}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={payment.status === "completed" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0" : ""}
                    >
                      {payment.status}
                    </Badge>
                    {payment.transactionId && (
                      <span className="text-xs text-muted-foreground">ID: {payment.transactionId}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MarketplaceLayout>
  );
}
