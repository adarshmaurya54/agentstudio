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
import { useAuth } from "@clerk/nextjs";
import { useConvex } from "convex/react";
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
import { useContext, useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";

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
            url: "/dashboard/ai-agents",
            icon: Bot,
        }, 
        {
            id: 'pricing',
            title: "Pricing",
            url: "/dashboard/pricing",
            icon: WalletCards,
        },
        {
            id: 'profile',
            title: "Profile",
            url: "/dashboard/profile",
            icon: User,
        },
    ];
    const {open} = useSidebar();
    const {userDetail, setUserDetail} = useContext(UserDetailContext);
    const path = usePathname();
    const {has} = useAuth();

    const isPaidUser = has && has({plan: 'unlimited_plan'});
    const convex = useConvex();
    const [totalRemainingCredits, setTotalRemainingCredits] = useState(0);
    useEffect(() => {
        if(!isPaidUser && userDetail?._id){
            getUserAgents();
        }
    }, [userDetail?._id])

    const getUserAgents = async() => {
        const result = await convex.query(api.agent.GetUserAgents, {
            userId: userDetail?._id
        })
        setTotalRemainingCredits(4 - Number(result?.length || 0))
        setUserDetail((prev: any) => ({...prev, remainingCredits: 4 - Number(result?.length || 0)}))
    }
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
                {!isPaidUser && <div className="flex items-center gap-3">
                    <Gem/>
                    {open && <h2>Remaining Credits: <span className="font-semibold">{totalRemainingCredits}/4</span></h2>}
                </div>}
                {open && (!isPaidUser ? <Link className="w-full" href="/dashboard/pricing"><Button className="rounded-xl w-full cursor-pointer">Upgrade to Unlimited</Button></Link> : <h2 className="text-xs">You can create unlimited agents with your plan.</h2>)}
            </SidebarFooter >
        </Sidebar>
    )
}