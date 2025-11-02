import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Unit, InsertUnit } from "@shared/schema";

export default function Units() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  const { data: units, isLoading } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
  });

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingUnit(null);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingUnit(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/units/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({
        title: "Unit deleted",
        description: "Unit has been deleted successfully.",
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
        description: "Failed to delete unit. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Units</h1>
          <p className="text-muted-foreground">Manage product measurement units</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} data-testid="button-add-unit">
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <UnitForm unit={editingUnit || undefined} onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Units</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !units || units.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No units found. Add your first unit to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Unit Name</TableHead>
                  <TableHead>Short Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit, index) => (
                  <TableRow key={unit.id} data-testid={`row-unit-${unit.id}`}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-unit-name-${unit.id}`}>
                      {unit.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {unit.shortName}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(unit)}
                          data-testid={`button-edit-${unit.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(unit.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${unit.id}`}
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

function UnitForm({ unit, onSuccess }: { unit?: Unit; onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<InsertUnit>({
    name: unit?.name || "",
    shortName: unit?.shortName || "",
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertUnit) => {
      if (unit) {
        await apiRequest("PATCH", `/api/units/${unit.id}`, data);
      } else {
        await apiRequest("POST", "/api/units", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({
        title: unit ? "Unit updated" : "Unit added",
        description: unit ? "Unit has been updated successfully." : "New unit has been added.",
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
        description: "Failed to save unit. Please try again.",
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
        <DialogTitle>{unit ? "Edit Unit" : "Add New Unit"}</DialogTitle>
        <DialogDescription>
          {unit ? "Update unit details" : "Add a new measurement unit"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Unit Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Piece, Kilogram"
            required
            data-testid="input-unit-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortName">Short Name *</Label>
          <Input
            id="shortName"
            value={formData.shortName}
            onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
            placeholder="e.g., pcs, kg"
            required
            data-testid="input-unit-short-name"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess} data-testid="button-cancel-form">
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-unit">
            {mutation.isPending ? "Saving..." : unit ? "Update Unit" : "Add Unit"}
          </Button>
        </div>
      </form>
    </>
  );
}
