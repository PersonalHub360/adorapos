import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, TrendingUp, DollarSign, Package, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Sale, Product } from "@shared/schema";

interface SalesReport {
  totalSales: number;
  totalRevenue: number;
  totalTransactions: number;
  averageTicket: number;
  topProducts: Array<{
    product: Product;
    quantitySold: number;
    revenue: number;
  }>;
  salesByPaymentMethod: Record<string, number>;
}

export default function Reports() {
  const [period, setPeriod] = useState<string>("today");

  const { data: report, isLoading } = useQuery<SalesReport>({
    queryKey: ["/api/reports/sales", period],
  });

  const { data: recentSales, isLoading: salesLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales/recent", period],
  });

  const getPeriodLabel = (p: string) => {
    switch (p) {
      case "today": return "Today";
      case "week": return "This Week";
      case "month": return "This Month";
      default: return "Today";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-reports-title">Sales Reports</h1>
          <p className="text-muted-foreground mt-1">Analyze sales performance and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="period" className="text-sm">Period:</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]" data-testid="select-period">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-total-revenue">
                  ${report?.totalRevenue.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{getPeriodLabel(period)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-total-transactions">
                  {report?.totalTransactions || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Completed sales</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
                <Package className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-total-items">
                  {report?.totalSales || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total units</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Ticket</CardTitle>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-average-ticket">
                  ${report?.averageTicket.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Best Selling Products</CardTitle>
                <CardDescription>Top performers for {getPeriodLabel(period).toLowerCase()}</CardDescription>
              </CardHeader>
              <CardContent>
                {report?.topProducts && report.topProducts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.topProducts.map((item, index) => (
                        <TableRow key={item.product.id} data-testid={`row-top-product-${index}`}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{item.product.name}</p>
                              <p className="text-xs text-muted-foreground">{item.product.category}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {item.quantitySold}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            ${item.revenue.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No sales data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Payment Methods</CardTitle>
                <CardDescription>Revenue breakdown by payment type</CardDescription>
              </CardHeader>
              <CardContent>
                {report?.salesByPaymentMethod && Object.keys(report.salesByPaymentMethod).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(report.salesByPaymentMethod).map(([method, amount]) => (
                      <div key={method} className="flex items-center justify-between" data-testid={`payment-method-${method}`}>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="capitalize">
                            {method.replace('_', ' ')}
                          </Badge>
                        </div>
                        <span className="font-bold tabular-nums">
                          ${amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No payment data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
              <CardDescription>Latest sales for {getPeriodLabel(period).toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : recentSales && recentSales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.map((sale) => (
                      <TableRow key={sale.id} data-testid={`row-sale-${sale.id}`}>
                        <TableCell className="font-mono text-sm">
                          {sale.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(sale.createdAt!).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {sale.paymentMethod.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums">
                          ${parseFloat(sale.total).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge>{sale.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No transactions for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
