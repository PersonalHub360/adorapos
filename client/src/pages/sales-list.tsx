import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Upload, FileSpreadsheet, FileText, Plus, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Sale } from "@shared/schema";
import { Link } from "wouter";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface SaleWithDetails extends Sale {
  customer?: { name: string } | null;
  user?: { username: string; firstName?: string; lastName?: string } | null;
  items?: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
}

export default function SalesList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: sales, isLoading, refetch } = useQuery<SaleWithDetails[]>({
    queryKey: ["/api/sales"],
  });

  const filteredSales = sales?.filter((sale) => {
    const searchLower = searchQuery.toLowerCase();
    const customerName = sale.customer?.name?.toLowerCase() || "";
    const userName = sale.user?.username?.toLowerCase() || "";
    const paymentMethod = sale.paymentMethod.toLowerCase();
    const total = sale.total.toString();
    
    return (
      customerName.includes(searchLower) ||
      userName.includes(searchLower) ||
      paymentMethod.includes(searchLower) ||
      total.includes(searchLower) ||
      sale.id.includes(searchLower)
    );
  });

  const handleViewDetails = (sale: SaleWithDetails) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  const handleExportCSV = () => {
    if (!sales || sales.length === 0) {
      toast({
        title: "No data",
        description: "No sales data to export",
        variant: "destructive",
      });
      return;
    }

    const csvData = sales.map((sale) => ({
      'Sale ID': sale.id.substring(0, 8),
      'Date': new Date(sale.createdAt!).toLocaleDateString(),
      'Customer': sale.customer?.name || 'Walk-in',
      'Cashier': sale.user?.firstName && sale.user?.lastName 
        ? `${sale.user.firstName} ${sale.user.lastName}`
        : sale.user?.username || 'N/A',
      'Payment Method': sale.paymentMethod.toUpperCase(),
      'Subtotal': parseFloat(sale.subtotal).toFixed(2),
      'Discount': parseFloat(sale.discountAmount).toFixed(2),
      'Total': parseFloat(sale.total).toFixed(2),
      'Status': sale.status,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Export successful",
      description: "Sales data exported to CSV",
    });
  };

  const handleExportPDF = () => {
    if (!sales || sales.length === 0) {
      toast({
        title: "No data",
        description: "No sales data to export",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Sales Report', 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    const tableData = sales.map((sale) => [
      sale.id.substring(0, 8),
      new Date(sale.createdAt!).toLocaleDateString(),
      sale.customer?.name || 'Walk-in',
      sale.paymentMethod.toUpperCase(),
      `$${parseFloat(sale.total).toFixed(2)}`,
      sale.status,
    ]);

    autoTable(doc, {
      head: [['ID', 'Date', 'Customer', 'Payment', 'Total', 'Status']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(`sales_report_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Export successful",
      description: "Sales report exported to PDF",
    });
  };

  const handleExportExcel = () => {
    if (!sales || sales.length === 0) {
      toast({
        title: "No data",
        description: "No sales data to export",
        variant: "destructive",
      });
      return;
    }

    const excelData = sales.map((sale) => ({
      'Sale ID': sale.id.substring(0, 8),
      'Date': new Date(sale.createdAt!).toLocaleDateString(),
      'Time': new Date(sale.createdAt!).toLocaleTimeString(),
      'Customer': sale.customer?.name || 'Walk-in',
      'Cashier': sale.user?.firstName && sale.user?.lastName 
        ? `${sale.user.firstName} ${sale.user.lastName}`
        : sale.user?.username || 'N/A',
      'Payment Method': sale.paymentMethod.toUpperCase(),
      'Subtotal': parseFloat(sale.subtotal).toFixed(2),
      'Discount': parseFloat(sale.discountAmount).toFixed(2),
      'Total': parseFloat(sale.total).toFixed(2),
      'Points Used': sale.pointsUsed,
      'Points Earned': sale.pointsEarned,
      'Status': sale.status,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');

    const colWidths = [
      { wch: 12 }, // Sale ID
      { wch: 12 }, // Date
      { wch: 10 }, // Time
      { wch: 20 }, // Customer
      { wch: 15 }, // Cashier
      { wch: 15 }, // Payment Method
      { wch: 10 }, // Subtotal
      { wch: 10 }, // Discount
      { wch: 10 }, // Total
      { wch: 12 }, // Points Used
      { wch: 12 }, // Points Earned
      { wch: 10 }, // Status
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `sales_export_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Export successful",
      description: "Sales data exported to Excel",
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const response = await fetch('/api/sales/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sales: results.data }),
          });

          if (!response.ok) {
            throw new Error('Import failed');
          }

          const data = await response.json();
          
          await refetch();
          
          toast({
            title: "Import successful",
            description: `Imported ${data.imported} sales`,
          });
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Failed to import sales data",
            variant: "destructive",
          });
        }
      },
      error: () => {
        toast({
          title: "Parse error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
      },
    });

    event.target.value = '';
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Customer Name': 'John Doe',
        'Payment Method': 'CASH',
        'Subtotal': '99.99',
        'Discount': '10.00',
        'Total': '89.99',
        'Status': 'completed',
      },
      {
        'Customer Name': 'Jane Smith',
        'Payment Method': 'CARD',
        'Subtotal': '149.50',
        'Discount': '0.00',
        'Total': '149.50',
        'Status': 'completed',
      },
      {
        'Customer Name': '',
        'Payment Method': 'ABA',
        'Subtotal': '75.00',
        'Discount': '5.00',
        'Total': '70.00',
        'Status': 'completed',
      },
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sales_import_sample.csv';
    link.click();

    toast({
      title: "Sample downloaded",
      description: "Use this template to import sales",
    });
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      CASH: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CARD: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      ABA: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      ACLEDA: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      DUE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    
    return colors[method.toUpperCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent" data-testid="text-sales-list-title">
            Sales Management
          </h1>
          <p className="text-muted-foreground mt-1">View, import, and export sales transactions</p>
        </div>
        <Link href="/pos">
          <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" data-testid="button-add-sale">
            <Plus className="h-5 w-5 mr-2" />
            New Sale
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent" data-testid="text-total-sales">
                  {sales?.length || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start gap-2 hover-elevate"
          onClick={handleExportCSV}
          data-testid="button-export-csv"
        >
          <div className="flex items-center gap-2 w-full">
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">Export CSV</span>
          </div>
          <p className="text-xs text-muted-foreground">Download as spreadsheet</p>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start gap-2 hover-elevate"
          onClick={handleExportPDF}
          data-testid="button-export-pdf"
        >
          <div className="flex items-center gap-2 w-full">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Export PDF</span>
          </div>
          <p className="text-xs text-muted-foreground">Generate report</p>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start gap-2 hover-elevate"
          onClick={handleExportExcel}
          data-testid="button-export-excel"
        >
          <div className="flex items-center gap-2 w-full">
            <FileSpreadsheet className="h-4 w-4" />
            <span className="text-sm font-medium">Export Excel</span>
          </div>
          <p className="text-xs text-muted-foreground">Download as XLSX</p>
        </Button>
      </div>

      <Card className="border-2 border-gradient">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <div>
            <CardTitle>Sales Transactions</CardTitle>
            <CardDescription>Complete list of all sales</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadSample} data-testid="button-download-sample">
              <Download className="h-4 w-4 mr-2" />
              Sample CSV
            </Button>
            <Button variant="outline" onClick={handleImportClick} data-testid="button-import">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, cashier, payment method, or total..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-sales"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredSales && filteredSales.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id} data-testid={`row-sale-${sale.id}`}>
                      <TableCell className="font-medium">
                        {new Date(sale.createdAt!).toLocaleDateString()}
                        <span className="text-xs text-muted-foreground block">
                          {new Date(sale.createdAt!).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell>{sale.customer?.name || 'Walk-in'}</TableCell>
                      <TableCell>
                        {sale.user?.firstName && sale.user?.lastName 
                          ? `${sale.user.firstName} ${sale.user.lastName}`
                          : sale.user?.username || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentMethodBadge(sale.paymentMethod)}>
                          {sale.paymentMethod.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums" data-testid={`text-sale-total-${sale.id}`}>
                        ${parseFloat(sale.total).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                          {sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(sale)}
                          data-testid={`button-view-${sale.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No sales found" : "No sales transactions yet"}
                </p>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              Transaction ID: {selectedSale?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {new Date(selectedSale.createdAt!).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedSale.customer?.name || 'Walk-in'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cashier</p>
                  <p className="font-medium">
                    {selectedSale.user?.firstName && selectedSale.user?.lastName 
                      ? `${selectedSale.user.firstName} ${selectedSale.user.lastName}`
                      : selectedSale.user?.username || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <Badge className={getPaymentMethodBadge(selectedSale.paymentMethod)}>
                    {selectedSale.paymentMethod.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <Separator />

              {selectedSale.items && selectedSale.items.length > 0 && (
                <>
                  <div>
                    <h4 className="font-semibold mb-2">Items</h4>
                    <div className="space-y-2">
                      {selectedSale.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded-md">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              ${parseFloat(item.unitPrice).toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          <p className="font-bold tabular-nums">
                            ${parseFloat(item.totalPrice).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">${parseFloat(selectedSale.subtotal).toFixed(2)}</span>
                </div>
                {parseFloat(selectedSale.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="tabular-nums">-${parseFloat(selectedSale.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                {selectedSale.pointsUsed > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Points Used</span>
                    <span>{selectedSale.pointsUsed} pts</span>
                  </div>
                )}
                {selectedSale.pointsEarned > 0 && (
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Points Earned</span>
                    <span>+{selectedSale.pointsEarned} pts</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="tabular-nums">${parseFloat(selectedSale.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
