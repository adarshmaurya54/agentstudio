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

function Navbar() {
  const [isTop, setIsTop] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const { isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    const handleScroll = () => {
      setIsTop(window.scrollY === 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`md:px-1 px-4 ${isTop ? "md:w-full border-none" : "background-blur md:w-[45rem]"} transition-all duration-500 md:border md:border-black/5 md:dark:border-white/5 md:rounded-full md:fixed sticky top-0 md:top-3 md:left-1/2 md:-translate-x-1/2 z-20`}>
      
      <div className='flex items-center justify-between p-3'>
        
        {/* Logo */}
        <h1 className='font-bold text-2xl dark:text-white'>OstrichTech</h1>

        {/* Desktop Links */}
        <div className='md:flex items-center gap-1 hidden'>
          <Link href='/about' className='text-sm hover:bg-black/10 hover:dark:bg-white/10 rounded-full px-3 py-1'>About</Link>
          <Link href='#services' className='text-sm hover:bg-black/10 hover:dark:bg-white/10 rounded-full px-3 py-1'>Services</Link>
          <Link href='/contact' className='text-sm hover:bg-black/10 hover:dark:bg-white/10 rounded-full px-3 py-1'>Contact</Link>
        </div>

        {/* Right Side */}
        <div className="flex h-5 items-center gap-2">

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" className="relative hover:bg-transparent">
            <Sun className="h-5 w-5 dark:hidden" />
            <Moon className="h-5 w-5 hidden dark:block" />
          </Button>

          <Separator orientation="vertical" />

          {/* Auth Section */}
          <div className="hidden md:block">
            {!isLoaded ? (
              <Loader2 className="animate-spin" />
            ) : isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="h-9 w-9 relative cursor-pointer">
                    <Image
                      src="/images/user.png"
                      alt="profile"
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                  
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User size={16} />
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem className="text-red-500 cursor-pointer">
                    <SignOutButton>
                      <div className="flex items-center gap-2">
                        <LogOut size={16} />
                        Logout
                      </div>
                    </SignOutButton>
                  </DropdownMenuItem>

                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/sign-in">
                <Button className="text-xs px-3 rounded-xl">
                  Sign in
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            <Menu className={`h-6 w-6 ${isOpen ? "rotate-90" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all ${isOpen ? "max-h-[500px]" : "max-h-0"}`}>
        <div className="flex flex-col gap-3 px-4 pb-4 pt-2 border-t">

          <Link href="/about" onClick={() => setIsOpen(false)}>About</Link>
          <Link href="#services" onClick={() => setIsOpen(false)}>Services</Link>
          <Link href="/contact" onClick={() => setIsOpen(false)}>Contact</Link>

          <Separator />

          {!isLoaded ? (
            <Loader2 className="animate-spin" />
          ) : isSignedIn ? (
            <>
              <Link href="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
              <Link href="/profile" onClick={() => setIsOpen(false)}>Profile</Link>

              <SignOutButton>
                <button className="text-red-500 text-left">Logout</button>
              </SignOutButton>
            </>
          ) : (
            <Link href="/sign-in" onClick={() => setIsOpen(false)}>
              <Button className="w-full">Sign in</Button>
            </Link>
          )}

        </div>
      </div>
    </nav>
  )
}

export default Navbar