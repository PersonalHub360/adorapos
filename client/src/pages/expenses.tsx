import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Download, Upload, FileSpreadsheet, FileText, Plus, Eye, Search, Trash2, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import type { Expense } from "@shared/schema";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface ExpenseWithUser extends Expense {
  user?: { username: string; firstName?: string; lastName?: string } | null;
}

const expenseFormSchema = z.object({
  date: z.string(),
  category: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  reference: z.string().optional(),
  warehouse: z.string().optional(),
  description: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export default function Expenses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: expenses, isLoading, refetch } = useQuery<ExpenseWithUser[]>({
    queryKey: ["/api/expenses"],
  });

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      category: "",
      amount: "",
      paymentMethod: "CASH",
      reference: "",
      warehouse: "",
      description: "",
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormValues) => {
      const response = await apiRequest("POST", "/api/expenses", {
        ...data,
        date: new Date(data.date),
        createdBy: user!.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      setIsAddOpen(false);
      toast({
        title: "Expense added",
        description: "Expense has been recorded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDetailOpen(false);
      toast({
        title: "Expense deleted",
        description: "Expense has been removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  const filteredExpenses = expenses?.filter((expense) => {
    const searchLower = searchQuery.toLowerCase();
    const category = expense.category.toLowerCase();
    const paymentMethod = expense.paymentMethod.toLowerCase();
    const amount = expense.amount.toString();
    const reference = expense.reference?.toLowerCase() || "";
    
    return (
      category.includes(searchLower) ||
      paymentMethod.includes(searchLower) ||
      amount.includes(searchLower) ||
      reference.includes(searchLower)
    );
  });

  const totalExpenses = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0;

  const handleViewDetails = (expense: ExpenseWithUser) => {
    setSelectedExpense(expense);
    setIsDetailOpen(true);
  };

  const onSubmit = (data: ExpenseFormValues) => {
    createExpenseMutation.mutate(data);
  };

  const handleExportCSV = () => {
    if (!expenses || expenses.length === 0) {
      toast({
        title: "No data",
        description: "No expense data to export",
        variant: "destructive",
      });
      return;
    }

    const csvData = expenses.map((expense) => ({
      'Date': new Date(expense.date).toLocaleDateString(),
      'Category': expense.category,
      'Amount': parseFloat(expense.amount).toFixed(2),
      'Payment Method': expense.paymentMethod,
      'Reference': expense.reference || '',
      'Warehouse': expense.warehouse || '',
      'Description': expense.description || '',
      'Created By': expense.user?.firstName && expense.user?.lastName 
        ? `${expense.user.firstName} ${expense.user.lastName}`
        : expense.user?.username || 'N/A',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expenses_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Export successful",
      description: "Expense data exported to CSV",
    });
  };

  const handleExportPDF = () => {
    if (!expenses || expenses.length === 0) {
      toast({
        title: "No data",
        description: "No expense data to export",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Expense Report', 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    const tableData = expenses.map((expense) => [
      new Date(expense.date).toLocaleDateString(),
      expense.category,
      expense.paymentMethod,
      `$${parseFloat(expense.amount).toFixed(2)}`,
      expense.reference || '',
    ]);

    autoTable(doc, {
      head: [['Date', 'Category', 'Payment', 'Amount', 'Reference']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(`expense_report_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Export successful",
      description: "Expense report exported to PDF",
    });
  };

  const handleExportExcel = () => {
    if (!expenses || expenses.length === 0) {
      toast({
        title: "No data",
        description: "No expense data to export",
        variant: "destructive",
      });
      return;
    }

    const excelData = expenses.map((expense) => ({
      'Date': new Date(expense.date).toLocaleDateString(),
      'Category': expense.category,
      'Amount': parseFloat(expense.amount).toFixed(2),
      'Payment Method': expense.paymentMethod,
      'Reference': expense.reference || '',
      'Warehouse': expense.warehouse || '',
      'Description': expense.description || '',
      'Created By': expense.user?.firstName && expense.user?.lastName 
        ? `${expense.user.firstName} ${expense.user.lastName}`
        : expense.user?.username || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

    const colWidths = [
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `expenses_export_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Export successful",
      description: "Expense data exported to Excel",
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
          const response = await fetch('/api/expenses/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expenses: results.data }),
          });

          if (!response.ok) {
            throw new Error('Import failed');
          }

          const data = await response.json();
          
          await refetch();
          
          toast({
            title: "Import successful",
            description: `Imported ${data.imported} expenses`,
          });
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Failed to import expense data",
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
        'Date': '2024-01-15',
        'Category': 'Rent',
        'Amount': '2000.00',
        'Payment Method': 'CARD',
        'Reference': 'INV-2024-001',
        'Warehouse': 'Main Store',
        'Description': 'Monthly rent payment',
      },
      {
        'Date': '2024-01-16',
        'Category': 'Utilities',
        'Amount': '350.50',
        'Payment Method': 'CASH',
        'Reference': 'UTIL-JAN',
        'Warehouse': 'Main Store',
        'Description': 'Electricity and water',
      },
      {
        'Date': '2024-01-17',
        'Category': 'Supplies',
        'Amount': '125.00',
        'Payment Method': 'ABA',
        'Reference': '',
        'Warehouse': '',
        'Description': 'Office supplies',
      },
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'expense_import_sample.csv';
    link.click();

    toast({
      title: "Sample downloaded",
      description: "Use this template to import expenses",
    });
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      CASH: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CARD: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      ABA: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      ACLEDA: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };
    
    return colors[method.toUpperCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent" data-testid="text-expenses-title">
            Expense Management
          </h1>
          <p className="text-muted-foreground mt-1">Track, import, and export business expenses</p>
        </div>
        <Button size="lg" className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700" onClick={() => setIsAddOpen(true)} data-testid="button-add-expense">
          <Plus className="h-5 w-5 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent" data-testid="text-total-expenses">
                  ${totalExpenses.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 shadow-md">
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

        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  {expenses?.length || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-gradient">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <div>
            <CardTitle>Expense Records</CardTitle>
            <CardDescription>Complete list of all expenses</CardDescription>
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
              placeholder="Search by category, payment method, amount, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-expenses"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredExpenses && filteredExpenses.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} data-testid={`row-expense-${expense.id}`}>
                      <TableCell className="font-medium">
                        {new Date(expense.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>
                        <Badge className={getPaymentMethodBadge(expense.paymentMethod)}>
                          {expense.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums" data-testid={`text-expense-amount-${expense.id}`}>
                        ${parseFloat(expense.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{expense.reference || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(expense)}
                          data-testid={`button-view-${expense.id}`}
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
                  {searchQuery ? "No expenses found" : "No expense records yet"}
                </p>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>Record a new business expense</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-expense-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Rent, Utilities, Salary" {...field} data-testid="input-expense-category" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-expense-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-method">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CASH">CASH</SelectItem>
                          <SelectItem value="CARD">CARD</SelectItem>
                          <SelectItem value="ABA">ABA</SelectItem>
                          <SelectItem value="ACLEDA">ACLEDA</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="Invoice/Receipt number" {...field} data-testid="input-expense-reference" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="warehouse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warehouse</FormLabel>
                      <FormControl>
                        <Input placeholder="Location" {...field} data-testid="input-expense-warehouse" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional details about this expense" {...field} data-testid="input-expense-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700" disabled={createExpenseMutation.isPending} data-testid="button-submit-expense">
                  {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Expense Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              Expense ID: {selectedExpense?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(selectedExpense.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedExpense.category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg tabular-nums">${parseFloat(selectedExpense.amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <Badge className={getPaymentMethodBadge(selectedExpense.paymentMethod)}>
                    {selectedExpense.paymentMethod}
                  </Badge>
                </div>
                {selectedExpense.reference && (
                  <div>
                    <p className="text-muted-foreground">Reference</p>
                    <p className="font-medium">{selectedExpense.reference}</p>
                  </div>
                )}
                {selectedExpense.warehouse && (
                  <div>
                    <p className="text-muted-foreground">Warehouse</p>
                    <p className="font-medium">{selectedExpense.warehouse}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Created By</p>
                  <p className="font-medium">
                    {selectedExpense.user?.firstName && selectedExpense.user?.lastName 
                      ? `${selectedExpense.user.firstName} ${selectedExpense.user.lastName}`
                      : selectedExpense.user?.username || 'N/A'}
                  </p>
                </div>
              </div>

              {selectedExpense.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{selectedExpense.description}</p>
                  </div>
                </>
              )}

              <Separator />
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => deleteExpenseMutation.mutate(selectedExpense.id)}
                  disabled={deleteExpenseMutation.isPending}
                  data-testid="button-delete-expense"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteExpenseMutation.isPending ? "Deleting..." : "Delete Expense"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
