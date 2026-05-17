'use client';

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

function AppHeader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center justify-between w-full px-5 py-2 bg-sidebar h-[10%]">
      <SidebarTrigger />
      <div className="flex items-center gap-3">
        {mounted && <ThemeSwitcher />}
        {mounted && <UserButton />}
      </div>
    </div>
  );
}

export default AppHeader;