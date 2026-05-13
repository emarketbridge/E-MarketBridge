import { AdminLayout } from "@/components/admin-layout";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: orders, isLoading } = useListOrders();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const updateStatus = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: "Order status updated" });
      },
    },
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">{orders?.length ?? 0} total orders</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : !orders || orders.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-lg font-medium text-foreground">No orders yet</p>
              <p className="text-muted-foreground text-sm mt-1">Orders from buyers will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="border-border overflow-hidden" data-testid={`order-card-${order.id}`}>
                  <CardContent className="p-0">
                    <button
                      className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="font-semibold text-foreground">Order #{order.id}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[order.status] ?? ""}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {order.buyerName ?? "Customer"} · {format(new Date(order.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-foreground">JD {order.totalAmount.toFixed(2)}</p>
                        {expandedOrderId === order.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {expandedOrderId === order.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border px-4 py-4 space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Items</p>
                            <div className="space-y-1">
                              {order.items?.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span className="text-foreground">{item.productName ?? `Product #${item.productId}`} x{item.quantity}</span>
                                  <span className="text-muted-foreground">JD {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Shipping Address</p>
                              <p className="text-sm text-foreground">{order.shippingAddress}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Update Status</p>
                              <Select
                                value={order.status}
                                onValueChange={(value) => updateStatus.mutate({ id: order.id, data: { status: value as typeof STATUS_OPTIONS[number] } })}
                              >
                                <SelectTrigger className="w-48 bg-background" data-testid={`select-status-${order.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
