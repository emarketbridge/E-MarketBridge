import { AdminLayout } from "@/components/admin-layout";
import {
  useListStoreProducts, useGetMyStore, useCreateProduct, useUpdateProduct, useDeleteProduct,
  getListStoreProductsQueryKey,
} from "@workspace/api-client-react";
import { Product } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Package, Search } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Agriculture", "Handicrafts", "Traditional Food", "Textiles", "Natural Products", "Other"];

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  stock: z.coerce.number().int().min(0, "Stock must be positive"),
  category: z.string().min(1, "Category is required"),
  images: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: store } = useGetMyStore();
  const { data: products, isLoading } = useListStoreProducts(store?.id ?? 0, {
    query: { enabled: !!store?.id, queryKey: getListStoreProductsQueryKey(store?.id ?? 0) },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", description: "", price: 0, stock: 0, category: "", images: "" },
  });

  const createProduct = useCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStoreProductsQueryKey(store?.id ?? 0) });
        setDialogOpen(false);
        form.reset();
        toast({ title: "Product added successfully" });
      },
    },
  });

  const updateProduct = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStoreProductsQueryKey(store?.id ?? 0) });
        setDialogOpen(false);
        setEditingProduct(null);
        form.reset();
        toast({ title: "Product updated successfully" });
      },
    },
  });

  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStoreProductsQueryKey(store?.id ?? 0) });
        toast({ title: "Product deleted" });
      },
    },
  });

  const openAdd = () => {
    setEditingProduct(null);
    form.reset({ name: "", description: "", price: 0, stock: 0, category: "", images: "" });
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      stock: product.stock,
      category: product.category,
      images: product.images ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: ProductForm) => {
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data });
    } else {
      createProduct.mutate({ data });
    }
  };

  const filtered = products?.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground text-sm mt-1">{products?.length ?? 0} items in your store</p>
          </div>
          <Button onClick={openAdd} className="gap-2" data-testid="button-add-product">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-background"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-lg font-medium text-foreground">No products yet</p>
              <p className="text-muted-foreground text-sm mt-1">Add your first product to start selling</p>
              <Button className="mt-4 gap-2" onClick={openAdd}>
                <Plus className="w-4 h-4" /> Add Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product, i) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      data-testid={`product-row-${product.id}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images ? (
                            <img src={product.images} alt={product.name} className="w-10 h-10 rounded-md object-cover border border-border" />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium text-foreground">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">JD {product.price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={product.stock === 0 ? "text-destructive font-medium" : "text-foreground"}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)} data-testid={`button-edit-${product.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteProduct.mutate({ id: product.id })}
                            data-testid={`button-delete-${product.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Add/Edit dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl><Input {...field} data-testid="input-product-name" className="bg-background" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea {...field} rows={3} data-testid="input-product-description" className="bg-background resize-none" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (JD)</FormLabel>
                      <FormControl><Input {...field} type="number" step="0.01" min="0" data-testid="input-product-price" className="bg-background" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="stock" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl><Input {...field} type="number" min="0" data-testid="input-product-stock" className="bg-background" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category" className="bg-background">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="images" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (optional)</FormLabel>
                    <FormControl><Input {...field} type="url" placeholder="https://..." data-testid="input-product-images" className="bg-background" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending} data-testid="button-save-product">
                    {editingProduct ? "Save Changes" : "Add Product"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
