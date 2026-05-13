import { AdminLayout } from "@/components/admin-layout";
import { useGetDashboardStats, useGetSalesByMonth, useGetTopProducts, useListOrders } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ShoppingBag, Package, TrendingUp, DollarSign, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: salesByMonth, isLoading: salesLoading } = useGetSalesByMonth();
  const { data: topProducts } = useGetTopProducts();
  const { data: orders } = useListOrders();

  const recentOrders = orders?.slice(0, 5) ?? [];

  const statCards = [
    { label: "Total Revenue", value: stats ? `JD ${stats.totalRevenue.toFixed(2)}` : null, icon: DollarSign, color: "text-emerald-600" },
    { label: "Total Orders", value: stats?.totalOrders, icon: ShoppingBag, color: "text-blue-600" },
    { label: "Products", value: stats?.totalProducts, icon: Package, color: "text-purple-600" },
    { label: "Pending Orders", value: stats?.pendingOrders, icon: Clock, color: "text-amber-600" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your store at a glance</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card className="border-border hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-24 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-foreground mt-1" data-testid={`stat-${card.label.toLowerCase().replace(/ /g, "-")}`}>
                          {card.value ?? 0}
                        </p>
                      )}
                    </div>
                    <div className={`p-3 rounded-xl bg-muted/60 ${card.color}`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Sales chart */}
          <Card className="xl:col-span-2 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-primary" />
                Monthly Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <Skeleton className="h-52 w-full" />
              ) : salesByMonth && salesByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={salesByMonth} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    />
                    <Bar dataKey="revenue" name="Revenue (JD)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                  No sales data yet. Start selling to see charts here.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top products */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts && topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map((product, i) => (
                    <div key={product.productId} className="flex items-center gap-3" data-testid={`top-product-${product.productId}`}>
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.totalSold} sold</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">JD {product.revenue.toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-6">No sales data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent orders */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0" data-testid={`order-row-${order.id}`}>
                    <div>
                      <p className="text-sm font-medium text-foreground">Order #{order.id}</p>
                      <p className="text-xs text-muted-foreground">{order.buyerName ?? "Customer"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[order.status] ?? ""}`}>
                        {order.status}
                      </span>
                      <p className="text-sm font-semibold text-foreground">JD {order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
