import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Car,
  CircleDollarSign,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { RestockDialog } from "@/components/admin/RestockDialog";
import { VehicleFormDialog } from "@/components/admin/VehicleFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteVehicle, listVehicles } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice, type Vehicle } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Apex Motors" },
      { name: "description", content: "Manage the Apex Motors vehicle inventory: add, edit, restock, and remove vehicles." },
      { property: "og:title", content: "Admin Dashboard — Apex Motors" },
      { property: "og:description", content: "Manage the Apex Motors vehicle inventory: add, edit, restock, and remove vehicles." },
    ],
  }),
  component: AdminPage,
});

function StockCell({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="destructive">Out of stock</Badge>;
  if (stock <= 2)
    return <Badge className="bg-warning text-warning-foreground hover:bg-warning">Low · {stock}</Badge>;
  return <Badge className="bg-success text-success-foreground hover:bg-success">{stock} units</Badge>;
}

function AdminPage() {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [restocking, setRestocking] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (hydrated && !isAdmin) {
      navigate({ to: "/login", search: { redirect: "/admin" } });
    }
  }, [hydrated, isAdmin, navigate]);

 const {
  data: vehicles = [],
  isLoading,
  refetch: refetchVehicles,
} = useQuery({
  queryKey: ["vehicles"],
  queryFn: listVehicles,
  enabled: isAdmin,
  staleTime: 0,
});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) =>
      `${v.make} ${v.model} ${v.year} ${v.type}`.toLowerCase().includes(q),
    );
  }, [vehicles, search]);

  const stats = useMemo(() => {
    const unitsInStock = vehicles.reduce((sum, v) => sum + v.stock, 0);
    const inventoryValue = vehicles.reduce((sum, v) => sum + v.stock * v.price, 0);
    const unitsSold = vehicles.reduce((sum, v) => sum + v.sold, 0);
    const lowStock = vehicles.filter((v) => v.stock <= 2).length;
    return { models: vehicles.length, unitsInStock, inventoryValue, unitsSold, lowStock };
  }, [vehicles]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteVehicle(deleting.id);
      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success(`${deleting.make} ${deleting.model} removed from inventory.`);
      setDeleting(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeleteBusy(false);
    }
  };

  if (!hydrated || !isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-muted-foreground">
        <ShieldAlert className="mr-2 size-5" />
        {hydrated ? "Redirecting to login…" : "Loading…"}
      </div>
    );
  }

  const statCards = [
    { label: "Models", value: stats.models, icon: Car },
    { label: "Units in stock", value: stats.unitsInStock, icon: Package },
    { label: "Inventory value", value: formatPrice(stats.inventoryValue), icon: CircleDollarSign },
    { label: "Units sold", value: stats.unitsSold, icon: TrendingUp },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage vehicles, stock levels, and pricing.
          </p>
        </div>
        <Button
          variant="accent"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> Add Vehicle
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="size-4 text-accent-foreground" />
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl font-extrabold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.lowStock > 0 && (
        <div className="mt-4 rounded-lg border border-warning/50 bg-warning/15 px-4 py-3 text-sm font-medium text-warning-foreground">
          {stats.lowStock} model{stats.lowStock > 1 ? "s are" : " is"} low on stock (2 or fewer
          units). Consider restocking.
        </div>
      )}

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Search by make, model, year, or type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-card"
          aria-label="Search inventory"
        />
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {vehicles.length} vehicles
        </p>
      </div>

      {/* Table */}
      <Card className="mt-4 overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead>Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Loading inventory…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No vehicles match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={v.image}
                          alt={`${v.make} ${v.model}`}
                          loading="lazy"
                          className="h-12 w-20 rounded-md object-cover"
                        />
                        <div>
                          <p className="font-semibold">
                            {v.make} {v.model}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {v.year} · {v.color}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{v.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatPrice(v.price)}</TableCell>
                    <TableCell>
                      <StockCell stock={v.stock} />
                    </TableCell>
                    <TableCell className="text-right">{v.sold}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRestocking(v)}
                          title="Restock"
                        >
                          <PackagePlus className="size-4" />
                          <span className="hidden xl:inline">Restock</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing({ ...v});
                            setFormOpen(true);
                          }}
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                          <span className="hidden xl:inline">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleting(v)}
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                          <span className="hidden xl:inline">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dialogs */}
      <VehicleFormDialog
  open={formOpen}
  onOpenChange={async (open) => {
    setFormOpen(open);

    if (!open) {
      setEditing(null);

      // Get the latest inventory from FastAPI
      await refetchVehicles();
    }
  }}
  vehicle={editing}
/>

      <RestockDialog
        vehicle={restocking}
        open={restocking !== null}
        onOpenChange={(open) => !open && setRestocking(null)}
      />
      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && (
                <>
                  This will permanently remove the {deleting.year} {deleting.make} {deleting.model}{" "}
                  from the inventory. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBusy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
