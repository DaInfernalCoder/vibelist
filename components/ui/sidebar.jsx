"use client";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  ChevronsUpDown,
  PlusCircle,
  Users,
  LogOut,
  Megaphone,
  Search,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
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
import { useWaitlist } from "@/contexts/WaitlistContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

// Skeleton loader component for waitlist items
const SkeletonWaitlistItem = () => (
  <div className="flex items-center px-3 py-2 animate-pulse">
    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
    <div className="ml-3 flex-1">
      <div className="h-4 bg-gray-200 rounded mb-1"></div>
      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
    </div>
  </div>
);

// Empty state component
const EmptyWaitlistState = ({ hasSearchTerm, searchTerm, clearSearch }) => (
  <div className="px-3 py-4 text-center text-gray-500">
    {hasSearchTerm ? (
      <>
        <p className="text-sm">No waitlists match &quot;{searchTerm}&quot;</p>
        <button
          onClick={clearSearch}
          className="text-blue-500 text-sm mt-1 hover:underline"
        >
          Clear search
        </button>
      </>
    ) : (
      <p className="text-sm">No waitlists yet</p>
    )}
  </div>
);

// Error display component
const ErrorDisplay = ({ error, onRetry }) => (
  <div className="px-3 py-2">
    <Alert variant="destructive" className="py-2">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="text-xs font-medium">Error</AlertTitle>
      <AlertDescription className="text-xs">{error}</AlertDescription>
    </Alert>
    <Button
      variant="outline"
      size="sm"
      className="w-full mt-2 text-xs h-8"
      onClick={onRetry}
    >
      <RefreshCw className="h-3 w-3 mr-1" /> Retry
    </Button>
  </div>
);

export function SessionNavBar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  // Get user data directly from auth
  const [user, setUser] = useState(null);
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  // Get waitlists from context with enhanced functionality
  const {
    waitlists,
    filteredWaitlists,
    selectedWaitlist,
    selectWaitlist,
    isLoading: waitlistsLoading,
    error: waitlistsError,
    errorType,
    searchTerm,
    setSearchTerm,
    getSignupCount,
    retryFetch,
    clearError,
  } = useWaitlist();

  const handleSignOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    window.location.href = "/";
    setIsLoading(false);
  };

  const handleWaitlistSelect = useCallback(
    (waitlist) => {
      selectWaitlist(waitlist);
      router.push(`/dashboard/waitlist/${waitlist.id}`);
    },
    [selectWaitlist, router]
  );

  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, [setSearchTerm]);

  // Check if user has waitlists
  const hasWaitlists = waitlists.length > 0;

  return (
    <motion.div
      className={cn("sidebar fixed left-0 z-40 h-full shrink-0 border-r")}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className={`relative z-40 flex text-muted-foreground h-full shrink-0 flex-col bg-white dark:bg-black transition-all`}
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            <div className="flex h-[54px] w-full shrink-0 border-b p-2">
              <div className="mt-[1.5px] flex w-full">
                {hasWaitlists ? (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full" asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex w-fit items-center gap-2 px-2"
                      >
                        <Avatar className="rounded size-4">
                          <AvatarFallback>W</AvatarFallback>
                        </Avatar>
                        <motion.li
                          variants={variants}
                          className="flex w-fit items-center gap-2"
                        >
                          {!isCollapsed && (
                            <>
                              <p className="text-sm font-medium truncate max-w-[120px]">
                                {selectedWaitlist
                                  ? selectedWaitlist.name
                                  : "Select a waitlist"}
                              </p>
                              <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
                            </>
                          )}
                        </motion.li>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      {/* Search input */}
                      <div className="px-3 py-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search waitlists..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-md border border-input px-8 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                          {searchTerm && (
                            <button
                              onClick={clearSearch}
                              className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Error state */}
                      {waitlistsError && (
                        <ErrorDisplay
                          error={waitlistsError}
                          onRetry={retryFetch}
                        />
                      )}

                      {/* Scrollable waitlist area */}
                      {!waitlistsError && (
                        <div className="max-h-60 overflow-y-auto py-1">
                          {waitlistsLoading ? (
                            // Loading state
                            Array(3)
                              .fill(0)
                              .map((_, i) => <SkeletonWaitlistItem key={i} />)
                          ) : filteredWaitlists.length > 0 ? (
                            // Waitlist items
                            filteredWaitlists.map((waitlist) => (
                              <DropdownMenuItem
                                key={waitlist.id}
                                onClick={() => handleWaitlistSelect(waitlist)}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2",
                                  waitlist._isOptimistic && "opacity-70"
                                )}
                                disabled={waitlist._isOptimistic}
                              >
                                <Users className="h-4 w-4" />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {waitlist.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {getSignupCount(waitlist.id)} signups
                                  </span>
                                </div>
                                {selectedWaitlist?.id === waitlist.id && (
                                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                )}
                                {waitlist._isOptimistic && (
                                  <span className="ml-auto text-xs text-muted-foreground italic">
                                    Creating...
                                  </span>
                                )}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            // Empty state
                            <EmptyWaitlistState
                              hasSearchTerm={!!searchTerm.trim()}
                              searchTerm={searchTerm}
                              clearSearch={clearSearch}
                            />
                          )}
                        </div>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2"
                      >
                        <Link href="/dashboard/create">
                          <PlusCircle className="h-4 w-4" /> Create new waitlist
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : waitlistsLoading ? (
                  // Loading state when checking if user has waitlists
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  // No waitlists state
                  <Link
                    href="/dashboard/create"
                    className="flex items-center gap-2 px-2"
                  >
                    <Avatar className="rounded size-4">
                      <AvatarFallback>+</AvatarFallback>
                    </Avatar>
                    <motion.li
                      variants={variants}
                      className="flex w-fit items-center gap-2"
                    >
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
                      )}
                    >
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
                      )}
                    >
                      <BarChart3 className="h-4 w-4" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <div className="flex items-center gap-2">
                            <p className="ml-2 text-sm font-medium">
                              Analytics
                            </p>
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
                      )}
                    >
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
                <div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full">
                      <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary">
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
                              {user?.email
                                ? user.email.charAt(0).toUpperCase()
                                : "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <motion.li
                          variants={variants}
                          className="flex w-full items-center gap-2"
                        >
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
                              {user?.email
                                ? user.email.charAt(0).toUpperCase()
                                : "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium">
                            {user?.user_metadata?.name ||
                              user?.email?.split("@")[0] ||
                              "User"}
                          </span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {user?.email || ""}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                        {isLoading && (
                          <span className="loading loading-spinner loading-xs ml-2"></span>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}
