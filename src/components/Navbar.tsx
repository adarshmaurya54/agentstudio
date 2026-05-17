'use client'

import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu'
import {
  ArrowRight,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Sun,
  User
} from 'lucide-react'
import { Separator } from './ui/separator'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useUser, SignOutButton } from '@clerk/nextjs'
import { LiquidGlassCard } from './ui/liquid-glass'
import { ThemeSwitcher } from './ThemeSwitcher'

function Navbar() {
  const [isTop, setIsTop] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setIsTop(window.scrollY === 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <LiquidGlassCard
      blurIntensity='sm'
      className={`${isTop ? "w-full border-none top-0 bg-transparent" : "md:w-[45rem] top-3 w-[90%] bg-white/20"} transition-all border border-black/10 shadow-none duration-500 md:rounded-full fixed md:top-3 left-1/2 -translate-x-1/2 z-20`}
    >
      {/* <nav className={`${isTop ? "md:w-full border-none" : "backdrop-blur md:w-[45rem]"} transition-all duration-500 md:rounded-full md:fixed sticky top-0 md:top-3 md:left-1/2 md:-translate-x-1/2 z-20`}> */}
        <div className="mx-auto relative z-30 flex w-full max-w-6xl items-center justify-between px-2 py-2 sm:px-6 lg:px-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="AgentStudio logo" width={30} height={30} />
            <span className="text-sm font-semibold sm:text-base">AgentStudio</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Button asChild size="sm">
              <Link href="/dashboard" className="bg-[#8b5cf6] rounded-full text-white hover:bg-[#7c3aed]">
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      {/* </nav> */}
    </LiquidGlassCard>
  )
}

export default Navbar