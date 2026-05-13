import { MarketplaceLayout } from "@/components/marketplace-layout";
import { useCart } from "@/hooks/use-cart";
import { useCreateOrder, useProcessPayment } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Package, CreditCard, Truck, AlertCircle, CheckCircle2, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const schema = z.object({
  shippingAddress: z.string().min(5, "Please enter a full shipping address"),
  paymentMethod: z.enum(["cash_on_delivery", "card"]),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const [orderComplete, setOrderComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { shippingAddress: "", paymentMethod: "cash_on_delivery", cardNumber: "", cardExpiry: "", cardCvv: "" },
  });

  const paymentMethod = form.watch("paymentMethod");

  const processPayment = useProcessPayment();
  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: async (order) => {
        processPayment.mutate(
          { data: { orderId: order.id, paymentMethod: form.getValues("paymentMethod") } },
          {
            onSuccess: () => {
              clearCart();
              setOrderComplete(true);
              setTimeout(() => setLocation("/marketplace/orders"), 2500);
            },
            onError: () => setError("Payment processing failed. Please try again."),
          }
        );
      },
      onError: () => setError("Order creation failed. Please try again."),
    },
  });

  const onSubmit = (data: FormData) => {
    if (cartItems.length === 0) return;
    setError(null);
    createOrder.mutate({
      data: {
        shippingAddress: data.shippingAddress,
        paymentMethod: data.paymentMethod,
        items: cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      },
    });
  };

  if (orderComplete) {
    return (
      <MarketplaceLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Order Confirmed!</h2>
            <p className="text-muted-foreground">Your order has been placed successfully. Redirecting to your orders...</p>
          </motion.div>
        </div>
      </MarketplaceLayout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <MarketplaceLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-medium text-foreground">Your cart is empty</p>
          <Link href="/marketplace/products">
            <Button className="mt-4">Shop Now</Button>
          </Link>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/marketplace/cart" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4" />
          Back to cart
        </Link>
        <h1 className="text-2xl font-bold text-foreground mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField control={form.control} name="shippingAddress" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Street, City, Governorate, Jordan" data-testid="input-shipping-address" className="bg-background" />
                        </FormControl>
                        <FormDescription>Enter your full shipping address in Jordan</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3" data-testid="radio-payment-method">
                            <div
                              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${field.value === "cash_on_delivery" ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                              onClick={() => field.onChange("cash_on_delivery")}
                            >
                              <RadioGroupItem value="cash_on_delivery" id="cod" className="mt-0.5" />
                              <div>
                                <Label htmlFor="cod" className="font-medium cursor-pointer flex items-center gap-2">
                                  <Truck className="w-4 h-4" /> Cash on Delivery
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">Pay when your order arrives. Available across rural Jordan.</p>
                              </div>
                            </div>
                            <div
                              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${field.value === "card" ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                              onClick={() => field.onChange("card")}
                            >
                              <RadioGroupItem value="card" id="card" className="mt-0.5" />
                              <div className="flex-1">
                                <Label htmlFor="card" className="font-medium cursor-pointer flex items-center gap-2">
                                  <CreditCard className="w-4 h-4" /> Card Payment
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">Test mode — simulated gateway. No real payment processed.</p>
                              </div>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {paymentMethod === "card" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 pt-2">
                        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-2.5">
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>Test mode: Enter any values. No real payment is processed.</span>
                        </div>
                        <FormField control={form.control} name="cardNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Number</FormLabel>
                            <FormControl><Input {...field} placeholder="4242 4242 4242 4242" data-testid="input-card-number" className="bg-background" /></FormControl>
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="cardExpiry" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry</FormLabel>
                              <FormControl><Input {...field} placeholder="MM/YY" data-testid="input-card-expiry" className="bg-background" /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="cardCvv" render={({ field }) => (
                            <FormItem>
                              <FormLabel>CVV</FormLabel>
                              <FormControl><Input {...field} placeholder="123" data-testid="input-card-cvv" className="bg-background" /></FormControl>
                            </FormItem>
                          )} />
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg" data-testid="text-checkout-error">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={createOrder.isPending || processPayment.isPending}
                  data-testid="button-place-order"
                >
                  {createOrder.isPending || processPayment.isPending ? "Processing..." : `Place Order · JD ${total.toFixed(2)}`}
                </Button>
              </form>
            </Form>
          </div>

          <div className="lg:col-span-2">
            <Card className="border-border sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Order Summary</CardTitle>
                <CardDescription>{cartItems.length} items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm" data-testid={`summary-item-${item.productId}`}>
                    <span className="text-muted-foreground line-clamp-1 flex-1">{item.name} x{item.quantity}</span>
                    <span className="font-medium text-foreground ml-2">JD {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary text-lg" data-testid="text-order-total">JD {total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
