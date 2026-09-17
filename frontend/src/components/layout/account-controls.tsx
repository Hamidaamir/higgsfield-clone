"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, History, LogOut, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

/** Right side of the top nav: login/signup links or the signed-in user menu. */
export function AccountControls() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const search = useSearchParams();

  if (isLoading) {
    return <span className="h-8 w-24 rounded-lg skeleton-shimmer" aria-hidden />;
  }

  if (!user) {
    // On the auth pages, keep whatever deep link brought the visitor there instead of dropping it.
    const onAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
    const target = onAuthPage ? search.get("next") : pathname;
    const next = target ? `?next=${encodeURIComponent(target)}` : "";
    return (
      <>
        <Button asChild variant="ghost" size="sm" className="text-accent hover:text-accent">
          <Link href={`/login${next}`}>Login</Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/signup${next}`}>Sign up</Link>
        </Button>
      </>
    );
  }

  return <UserMenu name={user.name} email={user.email} />;
}

function UserMenu({ name, email }: { name: string; email: string }) {
  const logout = useLogout();
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex h-8 items-center gap-2 rounded-lg pl-1 pr-2 text-[13px] font-medium text-text-primary hover:bg-surface-muted data-[state=open]:bg-surface-muted"
          aria-label="Account menu"
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-accent text-[11px] font-bold text-accent-foreground">
            {initials}
          </span>
          <span className="hidden max-w-28 truncate sm:inline">{name}</span>
          <ChevronDown className="size-3.5 text-text-secondary" aria-hidden />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-60 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-menu"
        >
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-text-secondary">{email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <MenuLink href="/generate/image" icon={Sparkles}>
            Create
          </MenuLink>
          <MenuLink href="/history" icon={History}>
            History
          </MenuLink>
          <MenuLink href="/settings" icon={Settings}>
            Settings
          </MenuLink>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={() => logout.mutate()}
            disabled={logout.isPending}
            className={cn(menuItemClasses, "text-danger data-[highlighted]:bg-danger/10")}
          >
            <LogOut className="size-4" aria-hidden />
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

const menuItemClasses =
  "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-surface-muted data-[disabled]:opacity-50";

function MenuLink({ href, icon: Icon, children }: { href: string; icon: typeof History; children: React.ReactNode }) {
  return (
    <DropdownMenu.Item asChild className={menuItemClasses}>
      <Link href={href}>
        <Icon className="size-4 text-text-secondary" aria-hidden />
        {children}
      </Link>
    </DropdownMenu.Item>
  );
}
