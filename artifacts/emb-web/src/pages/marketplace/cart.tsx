import { MarketplaceLayout } from "@/components/marketplace-layout";
import { useCart } from "@/hooks/use-cart";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Trash2, Plus, Minus, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <MarketplaceLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Shopping Cart</h1>
            <p className="text-muted-foreground text-sm mt-1">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
          </div>
          {cartItems.length > 0 && (
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={clearCart} data-testid="button-clear-cart">
              <Trash2 className="h-4 w-4 mr-1" />
              Clear cart
            </Button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground">Your cart is empty</p>
            <p className="text-muted-foreground text-sm mt-1">Add some products to get started</p>
            <Link href="/marketplace/products">
              <Button className="mt-6 gap-2" data-testid="button-shop-now">
                <ShoppingCart className="h-4 w-4" />Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.2 }}
                    data-testid={`cart-item-${item.productId}`}
                  >
                    <Card className="border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg bg-muted border border-border overflow-hidden flex-shrink-0">
                            {item.images ? (
                              <img src={item.images} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground line-clamp-1">{item.name}</p>
                            {item.storeName && <p className="text-xs text-muted-foreground">{item.storeName}</p>}
                            <p className="text-sm font-bold text-primary mt-1">JD {item.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="flex items-center gap-1 border border-border rounded-lg">
                              <button className="p-1.5 hover:bg-muted transition-colors" onClick={() => updateQuantity(item.productId, item.quantity - 1)} data-testid={`button-minus-${item.productId}`}>
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="px-2 text-sm font-medium min-w-[24px] text-center" data-testid={`text-qty-${item.productId}`}>{item.quantity}</span>
                              <button className="p-1.5 hover:bg-muted transition-colors" onClick={() => updateQuantity(item.productId, item.quantity + 1)} data-testid={`button-plus-${item.productId}`}>
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-sm font-bold text-foreground w-20 text-right" data-testid={`text-subtotal-${item.productId}`}>
                              JD {(item.price * item.quantity).toFixed(2)}
                            </p>
                            <button className="text-muted-foreground hover:text-destructive transition-colors p-1" onClick={() => removeFromCart(item.productId)} data-testid={`button-remove-${item.productId}`}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <Card className="border-border bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                  <span className="font-medium text-foreground">JD {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-emerald-600 font-medium">Free</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-bold text-xl text-primary" data-testid="text-total">JD {total.toFixed(2)}</span>
                </div>
                <Link href="/marketplace/checkout">
                  <Button className="w-full gap-2 mt-2" size="lg" data-testid="button-checkout">
                    Proceed to Checkout
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/marketplace/products">
                  <Button variant="outline" className="w-full">Continue Shopping</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MarketplaceLayout>
  );
}
