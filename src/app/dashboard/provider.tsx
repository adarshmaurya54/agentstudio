import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import React from 'react'
import { AppSidebar } from './_components/app-sidebar'
import AppHeader from './_components/app-header'

function DashboardProvider({ children }: any) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <div className='w-full bg-sidebar h-screen'>
                <AppHeader />
                <div className="bg-sidebar flex items-center justify-center h-[90%] md:py-3 md:pr-3 pr-2 md:ps-0 ps-2">
                    <div className='bg-card rounded-2xl overflow-hidden border w-full h-full'>
                        <div className="overflow-y-auto h-full">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </SidebarProvider>
    )
}

export default DashboardProvider
