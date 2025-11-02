import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Brand, InsertBrand } from "@shared/schema";

export default function Brands() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const { data: brands, isLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingBrand(null);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingBrand(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/brands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({
        title: "Brand deleted",
        description: "Brand has been deleted successfully.",
      });
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
        description: "Failed to delete brand. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Brands</h1>
          <p className="text-muted-foreground">Manage product brands</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} data-testid="button-add-brand">
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Button>
          </DialogTrigger>
          <DialogContent>
            <BrandForm brand={editingBrand || undefined} onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Brands</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !brands || brands.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No brands found. Add your first brand to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((brand, index) => (
                  <TableRow key={brand.id} data-testid={`row-brand-${brand.id}`}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-brand-name-${brand.id}`}>
                      {brand.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {brand.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(brand)}
                          data-testid={`button-edit-${brand.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(brand.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${brand.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BrandForm({ brand, onSuccess }: { brand?: Brand; onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<InsertBrand>({
    name: brand?.name || "",
    description: brand?.description || "",
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertBrand) => {
      if (brand) {
        await apiRequest("PATCH", `/api/brands/${brand.id}`, data);
      } else {
        await apiRequest("POST", "/api/brands", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({
        title: brand ? "Brand updated" : "Brand added",
        description: brand ? "Brand has been updated successfully." : "New brand has been added.",
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
        description: "Failed to save brand. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{brand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
        <DialogDescription>
          {brand ? "Update brand details" : "Add a new product brand"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Brand Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            data-testid="input-brand-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            data-testid="input-brand-description"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess} data-testid="button-cancel-form">
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-brand">
            {mutation.isPending ? "Saving..." : brand ? "Update Brand" : "Add Brand"}
          </Button>
        </div>
      </form>
    </>
  );
}
