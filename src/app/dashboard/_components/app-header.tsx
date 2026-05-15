'use client';

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";

function AppHeader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center justify-between w-full px-5 py-2 bg-sidebar h-[10%]">
      <SidebarTrigger />
      {mounted && <UserButton />}
    </div>
  );
}

export default AppHeader;