import { Link, useNavigate } from "@tanstack/react-router";
import { Car, LayoutDashboard, LogOut, Menu, UserRound } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";

export function Navbar() {
  const { user, hydrated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate({ to: "/" });
  };

  const links = (
    <>
      <Link
        to="/"
        onClick={() => setOpen(false)}
        className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground [&.active]:text-accent"
        activeOptions={{ exact: true }}
      >
        Inventory
      </Link>
      {user?.role === "admin" && (
        <Link
          to="/admin"
          onClick={() => setOpen(false)}
          className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground [&.active]:text-accent"
        >
          Admin Dashboard
        </Link>
      )}
    </>
  );

  const authArea = hydrated ? (
    user ? (
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1.5 text-xs font-medium text-primary-foreground sm:flex">
          <UserRound className="size-3.5" />
          {user.name}
          <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-accent-foreground uppercase">
            {user.role}
          </span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    ) : (
      <Button asChild variant="accent" size="sm">
        <Link to="/login" search={{ redirect: undefined }} onClick={() => setOpen(false)}>
          Login
        </Link>
      </Button>
    )
  ) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-primary-foreground/10 bg-primary">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent">
            <Car className="size-5 text-accent-foreground" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-primary-foreground">
            Apex <span className="text-accent">Motors</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">{links}</nav>
        <div className="hidden md:block">{authArea}</div>

        {/* Mobile nav */}
        <div className="flex items-center gap-2 md:hidden">
          {authArea}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-primary text-primary-foreground">
              <div className="mt-8 flex flex-col gap-5">
                {links}
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 text-sm font-medium text-primary-foreground/80"
                  >
                    <LayoutDashboard className="size-4" /> Dashboard
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
