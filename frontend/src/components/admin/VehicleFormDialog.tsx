import { useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createVehicle, updateVehicle } from "@/lib/api";
import { VEHICLE_IMAGES } from "@/lib/vehicle-images";
import {
  VEHICLE_TYPES,
  type Vehicle,
  type VehicleInput,
  type VehicleType,
} from "@/lib/types";

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
}

/*
 * Frontend form format:
 * type  -> body type
 * stock -> quantity
 *
 * Backend format:
 * category -> body type
 * quantity -> stock
 */
interface BackendVehicleInput {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
}

const EMPTY: VehicleInput = {
  make: "",
  model: "",
  year: new Date().getFullYear(),
  price: 0,
  type: "Sedan",
  fuel: "Petrol",
  transmission: "Automatic",
  mileage: 0,
  color: "",
  stock: 0,
  image: VEHICLE_IMAGES[0]?.value ?? "",
};

export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
}: VehicleFormDialogProps) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<VehicleInput>(EMPTY);
  const [busy, setBusy] = useState(false);

  const editing = vehicle !== null;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (vehicle) {
      setForm({
        make: vehicle.make ?? "",
        model: vehicle.model ?? "",
        year: vehicle.year ?? new Date().getFullYear(),
        price: vehicle.price ?? 0,
        type: vehicle.type ?? "Sedan",
        fuel: vehicle.fuel ?? "Petrol",
        transmission: vehicle.transmission ?? "Automatic",
        mileage: vehicle.mileage ?? 0,
        color: vehicle.color ?? "",
        stock: vehicle.stock ?? 0,
        image:
          vehicle.image ??
          VEHICLE_IMAGES[0]?.value ??
          "",
      });
    } else {
      setForm({ ...EMPTY });
    }
  }, [open, vehicle]);

  const set = <K extends keyof VehicleInput>(
    key: K,
    value: VehicleInput[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (busy) {
      return;
    }

    setBusy(true);

    try {
      /*
       * Convert frontend fields to the fields
       * expected by the FastAPI backend.
       */
      const backendVehicle: BackendVehicleInput = {
        make: form.make.trim(),
        model: form.model.trim(),
        category: form.type,
        price: Number(form.price),
        quantity: Number(form.stock),
      };

      if (!backendVehicle.make || !backendVehicle.model) {
        throw new Error("Make and model are required.");
      }

      if (backendVehicle.price < 0) {
        throw new Error("Price cannot be negative.");
      }

      if (backendVehicle.quantity < 0) {
        throw new Error("Stock quantity cannot be negative.");
      }

      if (editing && vehicle) {
        /*
         * `as any` is intentional here because the existing
         * frontend api.ts types still use VehicleInput,
         * while the FastAPI backend expects category/quantity.
         */
        await updateVehicle(
          vehicle.id,
          backendVehicle as any,
        );

        toast.success(
          `${backendVehicle.make} ${backendVehicle.model} updated.`,
        );
      } else {
        await createVehicle(
          backendVehicle as any,
        );

        toast.success(
          `${backendVehicle.make} ${backendVehicle.model} added to inventory.`,
        );
      }

      await queryClient.invalidateQueries({
        queryKey: ["vehicles"],
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Vehicle save error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save the vehicle.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing
              ? "Edit vehicle"
              : "Add a new vehicle"}
          </DialogTitle>

          <DialogDescription>
            {editing
              ? "Update the details of this vehicle."
              : "Fill in the details to add a vehicle to the inventory."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">

            {/* Make */}
            <div className="space-y-2">
              <Label htmlFor="vf-make">
                Make
              </Label>

              <Input
                id="vf-make"
                required
                placeholder="Toyota"
                value={form.make}
                onChange={(e) =>
                  set("make", e.target.value)
                }
              />
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="vf-model">
                Model
              </Label>

              <Input
                id="vf-model"
                required
                placeholder="Camry XSE"
                value={form.model}
                onChange={(e) =>
                  set("model", e.target.value)
                }
              />
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="vf-year">
                Year
              </Label>

              <Input
                id="vf-year"
                type="number"
                required
                min={1950}
                max={2100}
                value={form.year}
                onChange={(e) =>
                  set(
                    "year",
                    Number(e.target.value),
                  )
                }
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="vf-price">
                Price (USD)
              </Label>

              <Input
                id="vf-price"
                type="number"
                required
                min={0}
                step={100}
                value={form.price}
                onChange={(e) =>
                  set(
                    "price",
                    Number(e.target.value),
                  )
                }
              />
            </div>

            {/* Body Type */}
            <div className="space-y-2">
              <Label>
                Body type
              </Label>

              <Select
                value={form.type}
                onValueChange={(value) =>
                  set(
                    "type",
                    value as VehicleType,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {VEHICLE_TYPES.map((type) => (
                    <SelectItem
                      key={type}
                      value={type}
                    >
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="vf-color">
                Color
              </Label>

              <Input
                id="vf-color"
                required
                placeholder="Midnight Black"
                value={form.color}
                onChange={(e) =>
                  set(
                    "color",
                    e.target.value,
                  )
                }
              />
            </div>

            {/* Fuel */}
            <div className="space-y-2">
              <Label htmlFor="vf-fuel">
                Fuel
              </Label>

              <Input
                id="vf-fuel"
                required
                placeholder="Petrol / Diesel / Hybrid / Electric"
                value={form.fuel}
                onChange={(e) =>
                  set(
                    "fuel",
                    e.target.value,
                  )
                }
              />
            </div>

            {/* Transmission */}
            <div className="space-y-2">
              <Label htmlFor="vf-trans">
                Transmission
              </Label>

              <Input
                id="vf-trans"
                required
                placeholder="Automatic"
                value={form.transmission}
                onChange={(e) =>
                  set(
                    "transmission",
                    e.target.value,
                  )
                }
              />
            </div>

            {/* Mileage */}
            <div className="space-y-2">
              <Label htmlFor="vf-mileage">
                Mileage (mi)
              </Label>

              <Input
                id="vf-mileage"
                type="number"
                required
                min={0}
                value={form.mileage}
                onChange={(e) =>
                  set(
                    "mileage",
                    Number(e.target.value),
                  )
                }
              />
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="vf-stock">
                Units in stock
              </Label>

              <Input
                id="vf-stock"
                type="number"
                required
                min={0}
                value={form.stock}
                onChange={(e) =>
                  set(
                    "stock",
                    Number(e.target.value),
                  )
                }
              />
            </div>
          </div>

          {/* Photo */}
          <div className="space-y-2">
            <Label>
              Photo
            </Label>

            <div className="grid grid-cols-4 gap-2">
              {VEHICLE_IMAGES.map((img) => (
                <button
                  key={img.label}
                  type="button"
                  title={img.label}
                  onClick={() =>
                    set(
                      "image",
                      img.value,
                    )
                  }
                  className={`overflow-hidden rounded-md border-2 transition-colors ${
                    form.image === img.value
                      ? "border-accent"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img.value}
                    alt={img.label}
                    className="aspect-[8/5] w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(false)
              }
              disabled={busy}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="accent"
              disabled={busy}
            >
              {busy
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Add vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}