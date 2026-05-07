import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Database, Upload, GitCompareArrows, User, Activity, Sparkles } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { title: "Overview", url: "/app", icon: LayoutDashboard },
  { title: "Datasets", url: "/app/datasets", icon: Database },
  { title: "Upload", url: "/app/upload", icon: Upload },
  { title: "Compare", url: "/app/compare", icon: GitCompareArrows },
  { title: "Profile", url: "/app/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isActive = (path: string) => pathname === path || (path !== "/app" && pathname.startsWith(path));

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <NavLink to="/app" className="flex items-center gap-2 px-2 py-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
            <Activity className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm text-gradient">MarketPulse</span>
              <span className="text-[10px] text-muted-foreground font-medium">Analytics Suite</span>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} end={item.url === "/app"}>
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        {!collapsed && user && (
          <div className="px-2 py-2 rounded-lg bg-sidebar-accent/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <div className="flex flex-col leading-tight overflow-hidden">
                <span className="text-xs font-semibold truncate">{user.email}</span>
                <span className="text-[10px] text-muted-foreground">Signed in</span>
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
