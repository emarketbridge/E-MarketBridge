import { AdminLayout } from "@/components/admin-layout";
import { useGetSalesByMonth, useGetTopProducts, useGetDashboardStats } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend
} from "recharts";
import { TrendingUp, Award, DollarSign } from "lucide-react";

export default function AdminAnalyticsPage() {
  const { data: salesByMonth, isLoading: salesLoading } = useGetSalesByMonth();
  const { data: topProducts, isLoading: topLoading } = useGetTopProducts();
  const { data: stats } = useGetDashboardStats();
  const { t } = useLanguage();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("analyticsTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("analyticsSubtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t("totalRevenue"), value: stats ? `JD ${stats.totalRevenue.toFixed(2)}` : null, icon: DollarSign },
            { label: t("ordersCompleted"), value: stats?.totalSales, icon: TrendingUp },
            { label: t("activeProducts"), value: stats?.totalProducts, icon: Award },
          ].map((card) => (
            <Card key={card.label} className="border-border">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
                    <card.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    {stats ? (
                      <p className="text-xl font-bold text-foreground">{card.value ?? 0}</p>
                    ) : (
                      <Skeleton className="h-6 w-20 mt-0.5" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {t("revenueOrders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : salesByMonth && salesByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={salesByMonth} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" name={t("revenueJD")} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="sales" name={t("ordersCompleted")} stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                {t("noAnalyticsData")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              {t("topSelling")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : topProducts && topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 24, left: 80, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="totalSold" name={t("unitsSold")} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                {t("noProductSales")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
