import {
  HeartIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  UsersIcon,
} from "lucide-react";
import type * as React from "react";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useWorkforce } from "../workforce-context";
import { href, type Route } from "../routes";

const nav = [
  {
    label: "Overview",
    href: href.dashboard,
    icon: LayoutDashboardIcon,
    match: ["dashboard"],
  },
  {
    label: "Bears",
    href: href.bears,
    icon: UsersIcon,
    match: ["bears", "bear"],
  },
  {
    label: "Missions",
    href: href.missions,
    icon: MapPinIcon,
    match: ["missions"],
  },
] as const;

export const AppShell = ({
  route,
  header,
  children,
}: {
  route: Route;
  /** Breadcrumb or title shown beside the sidebar toggle. */
  header: React.ReactNode;
  children: React.ReactNode;
}) => {
  const { missions } = useWorkforce();
  const unassigned = missions.filter((m) => m.status === "unassigned").length;

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={({ children, ...props }) => (
                  <a {...props} href={href.dashboard}>
                    {children}
                  </a>
                )}
                tooltip="Care-a-Lot Dispatch"
              >
                <span className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <HeartIcon aria-hidden />
                </span>
                <span className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Care-a-Lot Dispatch</span>
                  <span className="text-xs text-muted-foreground">
                    Workforce allocation
                  </span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workforce</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.map((item) => {
                  const active = (item.match as readonly string[]).includes(
                    route.name,
                  );
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.label}
                        render={({ children, ...props }) => (
                          <a
                            {...props}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                          >
                            {children}
                          </a>
                        )}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {item.label === "Missions" && unassigned > 0 && (
                        <SidebarMenuBadge
                          aria-label={`${unassigned} missions need a bear`}
                        >
                          {unassigned}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <p className="px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            Mock data · Caring Meter v2
          </p>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      {/* min-w-0 lets wide tables scroll in their own container instead of widening the page. */}
      <SidebarInset className="min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-center"
          />
          {header}
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
};
