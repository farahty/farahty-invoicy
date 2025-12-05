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
  LogOut,
  Plus,
  ChevronRight,
  LucideIcon,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { signOut } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { OrganizationSwitcher } from "@/components/organizations/organization-switcher";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  organizationName: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

function NavLink({
  item,
  onClick,
  pathname,
}: {
  item: NavItem;
  onClick?: () => void;
  pathname: string;
}) {
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{item.name}</span>
    </Link>
  );
}

function SidebarContent({
  onClose,
  mainNavigation,
  bottomNavigation,
  pathname,
  initials,
  user,
  handleSignOut,
  t,
  organizationName,
}: {
  onClose?: () => void;
  mainNavigation: NavItem[];
  bottomNavigation: NavItem[];
  pathname: string;
  initials: string;
  user: { name: string; email: string };
  handleSignOut: () => void;
  t: ReturnType<typeof useTranslations>;
  organizationName: string;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link
        href="/dashboard"
        onClick={onClose}
        className="flex items-center gap-2 h-14 px-4 border-b border-border shrink-0 hover:bg-accent transition-colors"
      >
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <FileText className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-lg text-foreground truncate">
          {organizationName}
        </span>
      </Link>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNavigation.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            onClick={onClose}
            pathname={pathname}
          />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto border-t border-border">
        {/* Settings */}
        <div className="px-3 py-2">
          {bottomNavigation.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              onClick={onClose}
              pathname={pathname}
            />
          ))}
        </div>

        {/* Language & Theme */}
        <div className="px-3 py-2 border-t border-border flex items-center justify-between">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        {/* Quick Action */}
        <div className="px-3 py-3 border-t border-border">
          <Link href="/invoices/new" onClick={onClose}>
            <Button className="w-full gap-2">
              <Plus className="h-4 w-4" />
              {t("invoices.newInvoice")}
            </Button>
          </Link>
        </div>

        {/* User Profile */}
        <div className="px-3 py-3 border-t border-border">
          {/* Organization Switcher */}
          <div className="mb-3">
            <OrganizationSwitcher />
          </div>

          <Link
            href="/account"
            onClick={onClose}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors group"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors rtl:rotate-180" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start mt-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="me-2 h-4 w-4" />
            {t("nav.signOut")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ user, organizationName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const t = useTranslations();

  const mainNavigation: NavItem[] = [
    { name: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("nav.invoices"), href: "/invoices", icon: FileText },
    { name: t("nav.clients"), href: "/clients", icon: Users },
    { name: t("nav.activity"), href: "/activity", icon: History },
  ];

  const bottomNavigation: NavItem[] = [
    { name: t("nav.settings"), href: "/settings", icon: Settings },
  ];

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

  const sidebarProps = {
    mainNavigation,
    bottomNavigation,
    pathname,
    initials,
    user,
    handleSignOut,
    t,
    organizationName,
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:start-0 bg-background border-e border-border">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-50 h-14 bg-background border-b border-border flex items-center justify-between px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 min-w-0 flex-1"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg text-foreground truncate">
            {organizationName}
          </span>
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <VisuallyHidden>
              <SheetTitle>{t("nav.menu")}</SheetTitle>
            </VisuallyHidden>
            <SidebarContent {...sidebarProps} onClose={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {[...mainNavigation, ...bottomNavigation].map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn("h-5 w-5", isActive && "text-foreground")}
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
