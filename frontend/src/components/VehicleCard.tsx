import { Cog, Fuel, Gauge } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPrice, type Vehicle } from "@/lib/types";

interface VehicleCardProps {
  vehicle: Vehicle;
  onPurchase: (vehicle: Vehicle) => void;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <Badge variant="destructive" className="font-semibold">
        Sold out
      </Badge>
    );
  if (stock <= 2)
    return (
      <Badge className="bg-warning font-semibold text-warning-foreground hover:bg-warning">
        Only {stock} left
      </Badge>
    );
  return (
    <Badge className="bg-success font-semibold text-success-foreground hover:bg-success">
      In stock · {stock}
    </Badge>
  );
}

export function VehicleCard({ vehicle, onPurchase }: VehicleCardProps) {
  const soldOut = vehicle.stock === 0;

  return (
    <Card className="group overflow-hidden border-border pt-0 transition-shadow hover:shadow-lg">
      <div className="relative aspect-[8/5] overflow-hidden bg-muted">
        <img
          src={vehicle.image}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          loading="lazy"
          width={1024}
          height={640}
          className={cn(
            "size-full object-cover transition-transform duration-300 group-hover:scale-105",
            soldOut && "opacity-60 grayscale",
          )}
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="secondary" className="font-semibold shadow-sm">
            {vehicle.year}
          </Badge>
          <Badge className="bg-primary/85 font-semibold text-primary-foreground shadow-sm hover:bg-primary/85">
            {vehicle.type}
          </Badge>
        </div>
      </div>

      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg leading-tight font-bold">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground">{vehicle.color}</p>
          </div>
          <p className="font-display text-lg font-bold whitespace-nowrap text-primary">
            {formatPrice(vehicle.price)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Fuel className="size-3.5" /> {vehicle.fuel}
          </span>
          <span className="flex items-center gap-1.5">
            <Cog className="size-3.5" /> {vehicle.transmission}
          </span>
          <span className="flex items-center gap-1.5">
            <Gauge className="size-3.5" /> {vehicle.mileage} mi
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3">
        <StockBadge stock={vehicle.stock} />
        <Button
          variant={soldOut ? "outline" : "accent"}
          size="sm"
          disabled={soldOut}
          onClick={() => onPurchase(vehicle)}
        >
          {soldOut ? "Unavailable" : "Purchase"}
        </Button>
      </CardFooter>
    </Card>
  );
}
