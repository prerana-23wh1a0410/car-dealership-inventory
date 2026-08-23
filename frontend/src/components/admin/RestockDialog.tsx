import { useQueryClient } from "@tanstack/react-query";
import { PackagePlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { restockVehicle } from "@/lib/api";
import type { Vehicle } from "@/lib/types";

interface RestockDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestockDialog({ vehicle, open, onOpenChange }: RestockDialogProps) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(5);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setQuantity(5);
  }, [open]);

  if (!vehicle) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (quantity < 1) return;
    setBusy(true);
    try {
      await restockVehicle(vehicle.id, quantity);
      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success(`Restocked ${vehicle.make} ${vehicle.model}`, {
        description: `Added ${quantity} unit${quantity > 1 ? "s" : ""}. New stock: ${vehicle.stock + quantity}.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Restock failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Restock vehicle</DialogTitle>
          <DialogDescription>
            {vehicle.year} {vehicle.make} {vehicle.model} — current stock: {vehicle.stock}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restock-qty">Units to add</Label>
            <Input
              id="restock-qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={busy || quantity < 1}>
              <PackagePlus className="size-4" />
              {busy ? "Restocking…" : "Restock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
