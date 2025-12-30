"use client"

import { LayoutDashboard, Users, CalendarCheck, FileText, Building2, Settings, Building } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Employees",
    url: "/employees",
    icon: Users,
  },
  {
    title: "Attendance",
    url: "/attendance",
    icon: CalendarCheck,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
  },
  {
    title: "Work Sites",
    url: "/work-sites",
    icon: Building2,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  const handleItemClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center gap-3 h-16 px-4 py-1 border-b border-[#23887C]/20 bg-[#0F1629] group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center fix">
        <div className="flex items-center justify-center p-2 bg-[#23887C] rounded-lg shadow-sm">
          <Building className="h-5 w-5 text-white" />
        </div>
        <div className="flex items-center group-data-[collapsible=icon]:hidden">
          <span className="text-xl font-bold text-white">True Wood EMS</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-[#0F1629]">
        <SidebarGroup>
          <SidebarGroupContent className="pt-2 text-white">
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url} 
                    tooltip={item.title}
                    className="mb-3 p-1 hover:bg-[#182544] data-[active=true]:bg-[#182544] data-[active=true]:text-white data-[active=true]:shadow-md rounded-lg transition-all duration-200 group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:justify-center active:bg-inherit active:text-inherit focus-visible:bg-inherit focus-visible:text-inherit focus:bg-inherit focus:text-inherit"
                  >
                    <Link
                      href={item.url}
                      onClick={handleItemClick}
                      className="flex items-center gap-3 py-5 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center"
                    >
                      {/* Slightly more visible on hover for the icon bg too */}
                      <div
                        className={`p-1.5 rounded-sm ${
                          pathname === item.url
                            ? "bg-[#36CAB8]/20"
                            : "bg-[#182544]/10 hover:bg-white/10"
                        } group-data-[collapsible=icon]:p-2`}
                      >
                        <item.icon
                          className={"h-5 w-5 text-[#36CAB8]"}
                        />
                      </div>
                      <span className={`font-base text-sm group-data-[collapsible=icon]:hidden ${pathname === item.url ? "text-[#36CAB8]" : "text-gray-200"}`}>
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}