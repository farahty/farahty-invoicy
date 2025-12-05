"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const renderNavLinks = () => (
    <>
      {navigation.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200">
        {/* Logo */}
        <div className="flex items-center gap-2 h-16 px-6 border-b border-slate-200">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg text-slate-900">Farahty</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {renderNavLinks()}
        </nav>

        {/* Quick Actions */}
        <div className="px-4 py-3 border-t border-slate-200">
          <Link href="/invoices/new">
            <Button className="w-full gap-2">
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        </div>

        {/* User Menu */}
        <div className="px-4 py-3 border-t border-slate-200">
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-slate-200 text-slate-700 text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3 w-full p-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-slate-200 text-slate-700 text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg text-slate-900">Farahty</span>
        </div>

        {mounted ? (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="flex flex-col h-full">
                {/* Sheet Header */}
                <div className="flex items-center justify-between h-14 px-4 border-b border-slate-200">
                  <span className="font-semibold text-slate-900">Menu</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                  {renderNavLinks()}
                </nav>

                {/* Quick Actions */}
                <div className="px-3 py-3 border-t border-slate-200">
                  <Link href="/invoices/new" onClick={() => setOpen(false)}>
                    <Button className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      New Invoice
                    </Button>
                  </Link>
                </div>

                {/* User Menu */}
                <div className="px-3 py-3 border-t border-slate-200">
                  <div className="flex items-center gap-3 p-2">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-slate-200 text-slate-700 text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {navigation.slice(0, 4).map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                  isActive
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <item.icon
                  className={cn("h-5 w-5", isActive && "text-slate-900")}
                />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
