"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, FolderOpen, Library, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

/**
 * The `?next=` carried by the Login / Sign up links. On the auth pages themselves the
 * existing deep link is preserved rather than overwritten with "/login". Behaviour is
 * unchanged from before the redesign — only the presentation around it moved.
 */
export function useAuthNextQuery(): string {
  const pathname = usePathname();
  const search = useSearchParams();
  const onAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const target = onAuthPage ? search.get("next") : pathname;
  return target ? `?next=${encodeURIComponent(target)}` : "";
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Right side of the header: login/signup links, or the signed-in account menu. */
export function AccountControls() {
  const { user, isLoading } = useAuth();
  const next = useAuthNextQuery();

  if (isLoading) {
    return <span className="h-8 w-24 skeleton-shimmer" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/login${next}`}>Login</Link>
        </Button>
        <Button asChild size="sm" className="rounded-none">
          <Link href={`/signup${next}`}>Sign up</Link>
        </Button>
      </div>
    );
  }

  return <UserMenu name={user.name} email={user.email} />;
}

function UserMenu({ name, email }: { name: string; email: string }) {
  const logout = useLogout();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex h-8 items-center gap-2 pl-0.5 pr-1 text-[13px] text-foreground transition-colors hover:text-accent-text data-[state=open]:text-accent-text"
          aria-label="Account menu"
        >
          <span className="flex size-7 items-center justify-center border border-border-default bg-surface-subtle text-[11px] font-semibold text-foreground">
            {initialsOf(name)}
          </span>
          <span className="hidden max-w-28 truncate sm:inline">{name}</span>
          <ChevronDown className="size-3.5 text-foreground-subtle" aria-hidden />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-50 w-64 border border-border-default bg-surface-raised p-1.5 shadow-float"
        >
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-foreground-muted">{email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border-subtle" />
          <MenuLink href="/history" icon={Library}>
            Archive
          </MenuLink>
          <MenuLink href="/projects" icon={FolderOpen}>
            Projects
          </MenuLink>
          <MenuLink href="/settings" icon={Settings}>
            Settings
          </MenuLink>
          <DropdownMenu.Separator className="my-1 h-px bg-border-subtle" />
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
  "flex cursor-pointer select-none items-center gap-2.5 px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-surface-subtle data-[disabled]:opacity-50";

function MenuLink({ href, icon: Icon, children }: { href: string; icon: typeof Settings; children: React.ReactNode }) {
  return (
    <DropdownMenu.Item asChild className={menuItemClasses}>
      <Link href={href}>
        <Icon className="size-4 text-foreground-subtle" aria-hidden />
        {children}
      </Link>
    </DropdownMenu.Item>
  );
}

/**
 * Account block for the mobile drawer. Shares `useAuthNextQuery` and the same auth hooks as
 * the header menu, so both surfaces stay in step.
 */
export function AccountPanel({ onNavigate }: { onNavigate: () => void }) {
  const { user, isLoading } = useAuth();
  const logout = useLogout();
  const next = useAuthNextQuery();

  if (isLoading) return <span className="block h-10 w-full skeleton-shimmer" aria-hidden />;

  if (!user) {
    return (
      <div className="flex flex-col gap-2">
        <Button asChild size="lg" className="w-full rounded-none">
          <Link href={`/signup${next}`} onClick={onNavigate}>
            Sign up
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full rounded-none">
          <Link href={`/login${next}`} onClick={onNavigate}>
            Login
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center border border-border-default bg-surface-subtle text-xs font-semibold text-foreground">
          {initialsOf(user.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{user.name}</span>
          <span className="block truncate text-xs text-foreground-muted">{user.email}</span>
        </span>
      </div>
      <div className="mt-3 flex flex-col">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-2.5 py-2 text-sm text-foreground-muted hover:text-foreground"
        >
          <Settings className="size-4" aria-hidden />
          Settings
        </Link>
        <button
          type="button"
          onClick={() => {
            onNavigate();
            logout.mutate();
          }}
          disabled={logout.isPending}
          className="flex items-center gap-2.5 py-2 text-left text-sm text-danger disabled:opacity-50"
        >
          <LogOut className="size-4" aria-hidden />
          Log out
        </button>
      </div>
    </div>
  );
}
