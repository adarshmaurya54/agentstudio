import React from 'react'
import DashboardProvider from './provider'

function DashboardLayout({children}: any) {
  return (
    <DashboardProvider>
      {children}
    </DashboardProvider>
  )
}

export default DashboardLayout
