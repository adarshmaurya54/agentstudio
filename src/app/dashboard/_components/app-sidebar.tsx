"use client"
import { Button } from "@/components/ui/button";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { UserDetailContext } from "@/context/UserDetailContext";
import {
    LayoutDashboard,
    Bot,
    Database,
    WalletCards,
    User,
    Gem
} from "lucide-react";
import Image from "next/image"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext } from "react";

export function AppSidebar() {

    const menuOptions = [
        {
            id: 'dashboard',
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            id: 'ai-agents',
            title: "AI Agents",
            url: "/ai-agents",
            icon: Bot,
        },
        {
            id: 'data',
            title: "Data",
            url: "/data",
            icon: Database,
        },
        {
            id: 'pricing',
            title: "Pricing",
            url: "/pricing",
            icon: WalletCards,
        },
        {
            id: 'profile',
            title: "Profile",
            url: "/profile",
            icon: User,
        },
    ];
    const {open} = useSidebar();
    const {userDetail, setUserDetail} = useContext(UserDetailContext);
    const path = usePathname();
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex gap-3 items-center">
                    <Image src="/logo.svg" alt='logo' width={32} height={32} />
                    {open && <h2 className='font-bold'>AgentStudio</h2>}
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup >
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuOptions.map(menu => (
                                <SidebarMenuItem key={menu.id}>
                                    <Link href={menu.url}>
                                        <SidebarMenuButton isActive={path === menu.url} className="cursor-pointer rounded-xl" size={open? 'lg': 'default'}>
                                            <menu.icon />
                                            <span>{menu.title}</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup >
            </SidebarContent>
            <SidebarFooter className="mb-5 space-y-3" >
                <div className="flex items-center gap-3">
                    <Gem/>
                    {open && <h2>Remaining Credits: <span className="font-semibold">{userDetail?.token}</span></h2>}
                </div>
                {open && <Button className="rounded-xl cursor-pointer">Upgrade to Unlimited</Button>}
            </SidebarFooter >
        </Sidebar>
    )
}