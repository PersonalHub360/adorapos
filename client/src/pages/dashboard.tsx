import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, AlertTriangle, Receipt, Wallet, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sale, Product } from "@shared/schema";

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  lowStockCount: number;
  totalCustomers: number;
  totalExpense: number;
  totalPurchase: number;
  profitLoss: number;
  totalOrders: number;
  salesByPaymentMethod: Record<string, { amount: number; count: number }>;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/low-stock"],
  });

  const { data: recentSales, isLoading: recentSalesLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales/recent"],
  });

  if (statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your store performance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent" data-testid="text-today-sales">
              ${stats?.todaySales.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Revenue for today</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 shadow-md">
              <Receipt className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent" data-testid="text-total-expense">
              ${stats?.totalExpense.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Purchase cost today</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchase</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 shadow-md">
              <Wallet className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent" data-testid="text-total-purchase">
              ${stats?.totalPurchase.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cost of goods sold</p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${(stats?.profitLoss || 0) >= 0 ? 'border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-950/50 dark:to-lime-950/50' : 'border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50'}`}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit / Loss</CardTitle>
            <div className={`p-2 rounded-lg shadow-md ${(stats?.profitLoss || 0) >= 0 ? 'bg-gradient-to-br from-green-500 to-lime-500' : 'bg-gradient-to-br from-red-500 to-orange-500'}`}>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold bg-gradient-to-r ${(stats?.profitLoss || 0) >= 0 ? 'from-green-600 to-lime-600 dark:from-green-400 dark:to-lime-400' : 'from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400'} bg-clip-text text-transparent`} data-testid="text-profit-loss">
              ${stats?.profitLoss.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{(stats?.profitLoss || 0) >= 0 ? 'Profit today' : 'Loss today'}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent" data-testid="text-today-transactions">
              {stats?.todayTransactions || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sales processed today</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 shadow-md">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent" data-testid="text-total-orders">
              {stats?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time orders</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 shadow-md">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent" data-testid="text-low-stock-count">
              {stats?.lowStockCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Items need restocking</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent" data-testid="text-total-customers">
              {stats?.totalCustomers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Registered customers</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Today's Sales by Payment Method</CardTitle>
          <CardDescription>Breakdown of sales by payment type</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.salesByPaymentMethod && Object.keys(stats.salesByPaymentMethod).length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {['CASH', 'CARD', 'ABA', 'ACLEDA', 'DUE'].map((method) => {
                const data = stats.salesByPaymentMethod[method];
                const colors: Record<string, { border: string; bg: string; gradient: string; icon: string }> = {
                  CASH: { border: 'border-emerald-200 dark:border-emerald-800', bg: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50', gradient: 'from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400', icon: 'bg-gradient-to-br from-emerald-500 to-green-500' },
                  CARD: { border: 'border-blue-200 dark:border-blue-800', bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50', gradient: 'from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400', icon: 'bg-gradient-to-br from-blue-500 to-indigo-500' },
                  ABA: { border: 'border-purple-200 dark:border-purple-800', bg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50', gradient: 'from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-400', icon: 'bg-gradient-to-br from-purple-500 to-violet-500' },
                  ACLEDA: { border: 'border-pink-200 dark:border-pink-800', bg: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/50', gradient: 'from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400', icon: 'bg-gradient-to-br from-pink-500 to-rose-500' },
                  DUE: { border: 'border-orange-200 dark:border-orange-800', bg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50', gradient: 'from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400', icon: 'bg-gradient-to-br from-orange-500 to-amber-500' },
                };
                const color = colors[method];
                
                return (
                  <Card key={method} className={`border-2 ${color.border} ${color.bg}`}>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{method}</CardTitle>
                      <div className={`p-2 rounded-lg shadow-md ${color.icon}`}>
                        <Wallet className="h-4 w-4 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold bg-gradient-to-r ${color.gradient} bg-clip-text text-transparent`} data-testid={`text-payment-${method.toLowerCase()}`}>
                        ${data?.amount.toFixed(2) || '0.00'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {data?.count || 0} {data?.count === 1 ? 'transaction' : 'transactions'}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No sales recorded yet today</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Low Stock Items</CardTitle>
            <CardDescription>Products that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                    data-testid={`card-low-stock-${product.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.category} • {product.size} • {product.color}
                      </p>
                    </div>
                    <Badge variant="destructive" className="ml-3">
                      {product.stock} left
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">All products are well stocked</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
            <CardDescription>Latest sales activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSalesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : recentSales && recentSales.length > 0 ? (
              <div className="space-y-3">
                {recentSales.slice(0, 5).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                    data-testid={`card-recent-sale-${sale.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Sale #{sale.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.createdAt!).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm tabular-nums">
                        ${parseFloat(sale.total).toFixed(2)}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {sale.paymentMethod}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No sales yet today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
