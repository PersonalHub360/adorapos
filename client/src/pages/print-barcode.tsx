import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrintBarcode() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Print Barcode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Please go to the Product List page and select products to print their barcodes.</p>
            <p className="mt-2">The barcode printing feature is available from the Products page.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
