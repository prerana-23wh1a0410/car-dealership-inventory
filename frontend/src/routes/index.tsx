import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PurchaseDialog } from "@/components/PurchaseDialog";
import { VehicleCard } from "@/components/VehicleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { listVehicles } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { VEHICLE_TYPES, type Vehicle } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Apex Motors — Browse New & Premium Vehicles" },
      {
        name: "description",
        content:
          "Browse the Apex Motors inventory of sedans, SUVs, trucks, coupes, and electric vehicles. Search, filter, and purchase your next car online.",
      },
      { property: "og:title", content: "Apex Motors — Browse New & Premium Vehicles" },
      {
        property: "og:description",
        content:
          "Browse the Apex Motors inventory of sedans, SUVs, trucks, coupes, and electric vehicles. Search, filter, and purchase your next car online.",
      },
    ],
  }),
  component: InventoryPage,
});

type SortKey = "featured" | "price-asc" | "price-desc" | "year-desc";

function InventoryPage() {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [make, setMake] = useState("all");
  const [type, setType] = useState("all");
  const [maxPrice, setMaxPrice] = useState("any");
  const [sort, setSort] = useState<SortKey>("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [purchasing, setPurchasing] = useState<Vehicle | null>(null);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: listVehicles,
  });

  const makes = useMemo(
    () => [...new Set(vehicles.map((v) => v.make))].sort(),
    [vehicles],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cap = maxPrice === "any" ? Infinity : Number(maxPrice);
    const list = vehicles.filter((v) => {
      if (q && !`${v.make} ${v.model} ${v.year} ${v.type} ${v.color}`.toLowerCase().includes(q))
        return false;
      if (make !== "all" && v.make !== make) return false;
      if (type !== "all" && v.type !== type) return false;
      if (v.price > cap) return false;
      if (inStockOnly && v.stock === 0) return false;
      return true;
    });
    switch (sort) {
      case "price-asc":
        return list.sort((a, b) => a.price - b.price);
      case "price-desc":
        return list.sort((a, b) => b.price - a.price);
      case "year-desc":
        return list.sort((a, b) => b.year - a.year);
      default:
        return list;
    }
  }, [vehicles, search, make, type, maxPrice, sort, inStockOnly]);

  const hasFilters =
    search !== "" || make !== "all" || type !== "all" || maxPrice !== "any" || inStockOnly;

  const clearFilters = () => {
    setSearch("");
    setMake("all");
    setType("all");
    setMaxPrice("any");
    setInStockOnly(false);
  };

  const handlePurchase = (vehicle: Vehicle) => {
    if (!hydrated) return;
    if (!user) {
      toast.info("Please sign in to purchase a vehicle.");
      navigate({ to: "/login", search: { redirect: "/" } });
      return;
    }
    setPurchasing(vehicle);
  };

  return (
    <main>
      {/* Page header */}
      <section className="border-b border-border bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-sm font-semibold tracking-widest text-accent uppercase">
            Apex Motors Inventory
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl">
            Find your next car
          </h1>
          <p className="mt-3 max-w-xl text-primary-foreground/70">
            Every vehicle on our lot is inspected, priced transparently, and ready to drive home.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Search & filters */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <SlidersHorizontal className="size-4" />
            Search &amp; filter
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_repeat(4,auto)_auto]">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search make, model, color…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                aria-label="Search vehicles"
              />
            </div>

            <Select value={make} onValueChange={setMake}>
              <SelectTrigger className="w-full lg:w-40" aria-label="Filter by make">
                <SelectValue placeholder="All makes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All makes</SelectItem>
                {makes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full lg:w-40" aria-label="Filter by body type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {VEHICLE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={maxPrice} onValueChange={setMaxPrice}>
              <SelectTrigger className="w-full lg:w-40" aria-label="Filter by max price">
                <SelectValue placeholder="Any price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any price</SelectItem>
                <SelectItem value="40000">Under $40,000</SelectItem>
                <SelectItem value="55000">Under $55,000</SelectItem>
                <SelectItem value="80000">Under $80,000</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-full lg:w-44" aria-label="Sort vehicles">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
                <SelectItem value="year-desc">Newest year</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch
                id="in-stock"
                checked={inStockOnly}
                onCheckedChange={setInStockOnly}
              />
              <Label htmlFor="in-stock" className="cursor-pointer text-sm whitespace-nowrap">
                In stock only
              </Label>
            </div>
          </div>
        </div>

        {/* Result count */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
            vehicle{filtered.length === 1 ? "" : "s"} available
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="size-4" /> Clear filters
            </Button>
          )}
        </div>

        {/* Vehicle grid */}
        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Loading inventory…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-20 text-center">
            <p className="font-display text-lg font-bold">No vehicles match your filters</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or clearing the filters.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} onPurchase={handlePurchase} />
            ))}
          </div>
        )}
      </div>

      <PurchaseDialog
        vehicle={purchasing}
        open={purchasing !== null}
        onOpenChange={(open) => !open && setPurchasing(null)}
      />
    </main>
  );
}
