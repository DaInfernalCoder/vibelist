"use client";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  ChevronsUpDown,
  PlusCircle,
  Settings,
  Users,
  LogOut,
  Megaphone,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/libs/supabase/client";
import Image from "next/image";

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "3.05rem",
  },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
  staggerChildren: 0.1,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};


export function SessionNavBar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if user has waitlists (this would be replaced with actual logic)
  const hasWaitlists = true; // Simulate having waitlists
  
  // Current selected waitlist (this would be replaced with actual state management)
  const [selectedWaitlist, setSelectedWaitlist] = useState("My First Waitlist");
  
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    window.location.href = "/";
    setIsLoading(false);
  };

  const handleBilling = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating billing portal:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    (<motion.div
      className={cn("sidebar fixed left-0 z-40 h-full shrink-0 border-r")}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}>
      <motion.div
        className={`relative z-40 flex text-muted-foreground h-full shrink-0 flex-col bg-white dark:bg-black transition-all`}
        variants={contentVariants}>
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            <div className="flex h-[54px] w-full shrink-0 border-b p-2">
              <div className="mt-[1.5px] flex w-full">
                {hasWaitlists ? (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full" asChild>
                      <Button variant="ghost" size="sm" className="flex w-fit items-center gap-2 px-2">
                        <Avatar className='rounded size-4'>
                          <AvatarFallback>W</AvatarFallback>
                        </Avatar>
                        <motion.li variants={variants} className="flex w-fit items-center gap-2">
                          {!isCollapsed && (
                            <>
                              <p className="text-sm font-medium truncate max-w-[120px]">
                                {selectedWaitlist}
                              </p>
                              <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
                            </>
                          )}
                        </motion.li>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem 
                        onClick={() => setSelectedWaitlist("My First Waitlist")}
                        className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> My First Waitlist
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="flex items-center gap-2">
                        <Link href="/dashboard/create">
                          <PlusCircle className="h-4 w-4" /> Create new waitlist
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/dashboard/create" className="flex items-center gap-2 px-2">
                    <Avatar className='rounded size-4'>
                      <AvatarFallback>+</AvatarFallback>
                    </Avatar>
                    <motion.li variants={variants} className="flex w-fit items-center gap-2">
                      {!isCollapsed && (
                        <p className="text-sm font-medium">Create Waitlist</p>
                      )}
                    </motion.li>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className={cn("flex w-full flex-col gap-1")}>
                    {/* Main Navigation Items */}
                    <Link
                      href="/dashboard/create"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                        pathname?.includes("/dashboard/create") &&
                          "bg-muted text-primary"
                      )}>
                      <PlusCircle className="h-4 w-4" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Create</p>
                        )}
                      </motion.li>
                    </Link>
                    
                    <Link
                      href="/dashboard/analytics"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                        pathname?.includes("/dashboard/analytics") &&
                          "bg-muted text-primary"
                      )}>
                      <BarChart3 className="h-4 w-4" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <div className="flex items-center gap-2">
                            <p className="ml-2 text-sm font-medium">Analytics</p>
                          </div>
                        )}
                      </motion.li>
                    </Link>
                    
                    <Link
                      href="/dashboard/market"
                      className={cn(
                        "flex h-8 flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                        pathname?.includes("/dashboard/market") && 
                          "bg-muted text-primary"
                      )}>
                      <Megaphone className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <div className="ml-2 flex items-center gap-2">
                            <p className="text-sm font-medium">Market</p>
                          </div>
                        )}
                      </motion.li>
                    </Link>
                    
                    {/* Add More Nav Items Here */}
                  </div>
                </ScrollArea>
              </div>
              <div className="flex flex-col p-2">
                <Link
                  href="/dashboard/settings"
                  className={cn(
                    "mt-auto flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                    pathname?.includes("/dashboard/settings") &&
                      "bg-muted text-primary"
                  )}>
                  <Settings className="h-4 w-4 shrink-0" />{" "}
                  <motion.li variants={variants}>
                    {!isCollapsed && (
                      <p className="ml-2 text-sm font-medium">Settings</p>
                    )}
                  </motion.li>
                </Link>
                <div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full">
                      <div
                        className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary">
                        <Avatar className="size-4">
                          {user?.user_metadata?.avatar_url ? (
                            <Image
                              src={user.user_metadata.avatar_url}
                              alt="Profile"
                              width={16}
                              height={16}
                              className="w-full h-full object-cover rounded-full"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <AvatarFallback>
                              {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <motion.li variants={variants} className="flex w-full items-center gap-2">
                          {!isCollapsed && (
                            <>
                              <p className="text-sm font-medium">Account</p>
                              <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground/50" />
                            </>
                          )}
                        </motion.li>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={5}>
                      <div className="flex flex-row items-center gap-2 p-2">
                        <Avatar className="size-6">
                          {user?.user_metadata?.avatar_url ? (
                            <Image 
                              src={user.user_metadata.avatar_url} 
                              alt="Profile"
                              width={24}
                              height={24}
                              className="w-full h-full object-cover rounded-full"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <AvatarFallback>
                              {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium">
                            {user?.user_metadata?.name || user?.email?.split("@")[0] || "User"}
                          </span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {user?.email || ""}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleBilling}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v6A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-6zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm4.75-.75a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Billing
                        {isLoading && <span className="loading loading-spinner loading-xs ml-2"></span>}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleSignOut}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                        {isLoading && <span className="loading loading-spinner loading-xs ml-2"></span>}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>)
  );
}
