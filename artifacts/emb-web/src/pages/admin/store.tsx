import { AdminLayout } from "@/components/admin-layout";
import { useGetMyStore, useUpdateStore, useCreateStore, getGetMyStoreQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, MapPin, Phone, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { motion } from "framer-motion";

const schema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  ruralArea: z.string().min(1, "Rural area is required"),
  contactInfo: z.string().optional(),
  logo: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AdminStorePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: store, isLoading } = useGetMyStore();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { storeName: "", description: "", location: "", ruralArea: "", contactInfo: "", logo: "" },
  });

  useEffect(() => {
    if (store) {
      form.reset({
        storeName: store.storeName,
        description: store.description ?? "",
        location: store.location,
        ruralArea: store.ruralArea,
        contactInfo: store.contactInfo ?? "",
        logo: store.logo ?? "",
      });
    }
  }, [store, form]);

  const updateStore = useUpdateStore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyStoreQueryKey() });
        toast({ title: "Store updated successfully" });
      },
    },
  });

  const createStore = useCreateStore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyStoreQueryKey() });
        toast({ title: "Store created!" });
      },
    },
  });

  const onSubmit = (data: FormData) => {
    if (store) {
      updateStore.mutate({ id: store.id, data });
    } else {
      createStore.mutate({ data: { storeName: data.storeName, description: data.description, location: data.location, ruralArea: data.ruralArea, contactInfo: data.contactInfo, logo: data.logo } });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Store Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">{store ? "Manage your store information" : "Set up your store to start selling"}</p>
        </div>

        {isLoading ? (
          <Card className="border-border">
            <CardContent className="pt-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </CardContent>
          </Card>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Store preview */}
            {store && (
              <Card className="border-border mb-6 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/10" />
                <CardContent className="-mt-10 pb-5">
                  <div className="flex items-end gap-4">
                    <div className="w-16 h-16 rounded-xl border-2 border-background bg-muted flex items-center justify-center overflow-hidden shadow-md">
                      {store.logo ? (
                        <img src={store.logo} alt={store.storeName} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>
                    <div className="pb-1">
                      <h3 className="font-bold text-foreground text-lg">{store.storeName}</h3>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <MapPin className="w-3 h-3" />
                        <span>{store.location}, {store.ruralArea}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">{store ? "Edit Store" : "Create Your Store"}</CardTitle>
                <CardDescription>This information will be visible to buyers in the marketplace</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField control={form.control} name="storeName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Store className="w-3.5 h-3.5" />Store Name</FormLabel>
                        <FormControl><Input {...field} placeholder="Al-Baraka Natural Products" data-testid="input-store-name" className="bg-background" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Textarea {...field} rows={3} placeholder="Tell buyers about your store and products..." className="bg-background resize-none" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="location" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />City/Region</FormLabel>
                          <FormControl><Input {...field} placeholder="Azraq" data-testid="input-location" className="bg-background" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="ruralArea" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rural Area</FormLabel>
                          <FormControl><Input {...field} placeholder="Badia" data-testid="input-rural-area" className="bg-background" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="contactInfo" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />Contact Info</FormLabel>
                        <FormControl><Input {...field} placeholder="+962 7X XXX XXXX" className="bg-background" /></FormControl>
                        <FormDescription>Phone number or WhatsApp for buyers</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="logo" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Image className="w-3.5 h-3.5" />Logo URL (optional)</FormLabel>
                        <FormControl><Input {...field} type="url" placeholder="https://..." className="bg-background" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={updateStore.isPending || createStore.isPending} data-testid="button-save-store">
                      {store ? "Save Changes" : "Create Store"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
