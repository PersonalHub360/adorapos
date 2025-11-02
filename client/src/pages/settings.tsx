import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import type { PaperSize, InsertPaperSize } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Settings() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPaperSize, setEditingPaperSize] = useState<PaperSize | null>(null);
  const [deletingPaperSize, setDeletingPaperSize] = useState<PaperSize | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const { data: paperSizes, isLoading } = useQuery<PaperSize[]>({
    queryKey: ["/api/paper-sizes"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/paper-sizes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/paper-sizes"] });
      toast({
        title: "Paper size deleted",
        description: "The paper size has been removed.",
      });
      setDeletingPaperSize(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete paper size. Please try again.",
        variant: "destructive",
      });
    },
  });

  const mmToInch = (mm: number) => (mm / 25.4).toFixed(2);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-settings-title">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage system settings and configurations</p>
        </div>
      </div>

      {/* Paper Sizes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Barcode Paper Sizes</h2>
            <p className="text-sm text-muted-foreground">Configure available paper sizes for barcode printing</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-paper-size">
              <Plus className="h-4 w-4 mr-2" />
              Add Paper Size
            </Button>
          )}
        </div>

        {isLoading ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">Loading paper sizes...</div>
          </Card>
        ) : paperSizes && paperSizes.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Width (mm)</TableHead>
                  <TableHead>Height (mm)</TableHead>
                  <TableHead>Inches</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-center">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paperSizes.map((size) => (
                  <TableRow key={size.id} data-testid={`row-paper-size-${size.id}`}>
                    <TableCell className="font-medium">{size.name}</TableCell>
                    <TableCell>{size.widthMm} mm</TableCell>
                    <TableCell>{size.heightMm} mm</TableCell>
                    <TableCell className="text-muted-foreground">
                      {mmToInch(size.widthMm)}" × {mmToInch(size.heightMm)}"
                    </TableCell>
                    <TableCell>
                      {size.isActive ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-muted-foreground">Inactive</span>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600"
                            onClick={() => setEditingPaperSize(size)}
                            data-testid={`button-edit-${size.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-red-500/10 hover:bg-red-500/20 text-red-600"
                            onClick={() => setDeletingPaperSize(size)}
                            data-testid={`button-delete-${size.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <h3 className="font-semibold text-lg mb-2">No paper sizes configured</h3>
              <p className="text-muted-foreground mb-6">
                Add paper sizes to enable barcode printing
              </p>
              {isAdmin && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Paper Size
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      {(isAddDialogOpen || editingPaperSize) && (
        <Dialog 
          open={isAddDialogOpen || !!editingPaperSize} 
          onOpenChange={() => {
            setIsAddDialogOpen(false);
            setEditingPaperSize(null);
          }}
        >
          <DialogContent>
            <PaperSizeForm
              paperSize={editingPaperSize || undefined}
              onSuccess={() => {
                setIsAddDialogOpen(false);
                setEditingPaperSize(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPaperSize} onOpenChange={() => setDeletingPaperSize(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Paper Size</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPaperSize?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPaperSize && deleteMutation.mutate(deletingPaperSize.id)}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PaperSizeForm({ paperSize, onSuccess }: { paperSize?: PaperSize; onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<InsertPaperSize>({
    name: paperSize?.name || "",
    widthMm: paperSize?.widthMm || 0,
    heightMm: paperSize?.heightMm || 0,
    isActive: paperSize?.isActive ?? true,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: InsertPaperSize) => {
      if (paperSize) {
        return await apiRequest("PATCH", `/api/paper-sizes/${paperSize.id}`, data);
      } else {
        return await apiRequest("POST", "/api/paper-sizes", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/paper-sizes"] });
      toast({
        title: paperSize ? "Paper size updated" : "Paper size created",
        description: paperSize ? "The paper size has been updated successfully." : "The paper size has been created successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: `Failed to ${paperSize ? "update" : "create"} paper size. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.widthMm <= 0 || formData.heightMm <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  const mmToInch = (mm: number) => (mm / 25.4).toFixed(2);

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{paperSize ? "Edit Paper Size" : "Add Paper Size"}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., 38mm Label"
            required
            data-testid="input-name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="widthMm">Width (mm) *</Label>
            <Input
              id="widthMm"
              type="number"
              min="1"
              value={formData.widthMm || ""}
              onChange={(e) => setFormData({ ...formData, widthMm: parseInt(e.target.value) || 0 })}
              required
              data-testid="input-width"
            />
            {formData.widthMm > 0 && (
              <p className="text-xs text-muted-foreground">{mmToInch(formData.widthMm)} inches</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="heightMm">Height (mm) *</Label>
            <Input
              id="heightMm"
              type="number"
              min="1"
              value={formData.heightMm || ""}
              onChange={(e) => setFormData({ ...formData, heightMm: parseInt(e.target.value) || 0 })}
              required
              data-testid="input-height"
            />
            {formData.heightMm > 0 && (
              <p className="text-xs text-muted-foreground">{mmToInch(formData.heightMm)} inches</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4"
            data-testid="checkbox-active"
          />
          <Label htmlFor="isActive" className="font-normal cursor-pointer">
            Active (available for selection)
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save">
          {saveMutation.isPending ? "Saving..." : paperSize ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
