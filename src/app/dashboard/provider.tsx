import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import React from 'react'
import { AppSidebar } from './_components/app-sidebar'
import AppHeader from './_components/app-header'

function DashboardProvider({ children }: any) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <div className='w-full'>
                <AppHeader />
                {children}
            </div>
        </SidebarProvider>
    )
}

export default DashboardProvider
