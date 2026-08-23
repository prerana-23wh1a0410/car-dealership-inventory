import { useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { purchaseVehicle } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice, type Vehicle } from "@/lib/types";

interface PurchaseDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseDialog({ vehicle, open, onOpenChange }: PurchaseDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setQuantity(1);
  }, [open]);

  if (!vehicle) return null;

  const max = Math.max(1, vehicle.stock);
  const total = vehicle.price * quantity;

  const handleConfirm = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await purchaseVehicle(vehicle.id, user.id, quantity);
      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Purchase confirmed!", {
        description: `${quantity} × ${vehicle.make} ${vehicle.model} — ${formatPrice(total)}. Our sales team will contact you to arrange delivery.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Purchase failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Confirm your purchase</DialogTitle>
          <DialogDescription>
            Signed in as {user?.name} ({user?.email})
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 rounded-lg border border-border bg-muted/40 p-3">
          <img
            src={vehicle.image}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="h-20 w-32 rounded-md object-cover"
          />
          <div className="min-w-0">
            <p className="font-display font-bold">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
            <p className="text-sm text-muted-foreground">
              {vehicle.color} · {vehicle.transmission}
            </p>
            <p className="mt-1 text-sm font-semibold text-primary">
              {formatPrice(vehicle.price)} <span className="font-normal text-muted-foreground">each</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Quantity</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
            >
              <Minus className="size-4" />
            </Button>
            <span className="w-8 text-center font-display text-lg font-bold">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={quantity >= max}
              onClick={() => setQuantity((q) => Math.min(max, q + 1))}
              aria-label="Increase quantity"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
          <span className="text-sm font-medium text-secondary-foreground">Total</span>
          <span className="font-display text-xl font-bold text-primary">{formatPrice(total)}</span>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="accent" onClick={handleConfirm} disabled={submitting}>
            <ShoppingCart className="size-4" />
            {submitting ? "Processing…" : "Confirm Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
