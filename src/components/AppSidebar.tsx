import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserCircle,
  MessageSquare,
  FileText,
  User,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/database-config";

type UserRole = "editor" | "client" | "agency";

interface NavItem {
  title: string;
  url: string;
  icon: any;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["editor", "client", "agency"],
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderKanban,
    roles: ["editor", "client", "agency"],
  },
  {
    title: "Editors",
    url: "/editors",
    icon: UserCircle,
    roles: ["client", "agency"],
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
    roles: ["editor", "agency"],
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageSquare,
    roles: ["editor", "client", "agency"],
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: FileText,
    roles: ["editor", "client", "agency"],
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
    roles: ["editor", "client", "agency"],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["editor", "client", "agency"],
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role from user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (rolesError) {
        console.error("Error loading user role:", rolesError);
      } else if (userRoles) {
        setUserRole(userRoles.role as UserRole);
      }
    } catch (error) {
      console.error("Error loading user role:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNavItems = navItems.filter((item) =>
    userRole ? item.roles.includes(userRole) : false
  );

  const isActive = (path: string) => location.pathname === path;

  if (loading) {
    return (
      <Sidebar>
        <SidebarContent>
          <div className="p-4 text-muted-foreground">Loading...</div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <h2 className="text-xl font-bold gradient-text">Xrozen Workflow</h2>
        {userRole && (
          <div className="mt-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-xs font-medium text-primary capitalize">{userRole} Account</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          © 2025 Xrozen
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
