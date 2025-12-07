import { useState } from "react";
import { LogOut, Settings, Building } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { CompanyDTO } from "@/types";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  /** Current company data */
  company: CompanyDTO;
  /** Sign out callback */
  onSignOut: () => Promise<void>;
  /** Variant for different layouts */
  variant?: "sidebar" | "mobile";
}

/**
 * UserMenu component
 *
 * Renders a dropdown menu with user information and actions:
 * - Company name (disabled item)
 * - Settings links
 * - Sign out button
 *
 * Uses Shadcn DropdownMenu and Avatar components.
 *
 * @param props - UserMenu props
 * @returns User menu dropdown component
 */
export function UserMenu({ company, onSignOut, variant = "sidebar" }: UserMenuProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  /**
   * Handle sign out with loading state
   */
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await onSignOut();
    } catch (error) {
      console.error("Sign out error:", error);
      setIsSigningOut(false);
    }
  };

  // Get initials for avatar fallback
  const initials = company.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          variant === "sidebar" ? "w-full" : ""
        )}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{initials}</AvatarFallback>
        </Avatar>
        <div className={cn("flex flex-col items-start", variant === "mobile" ? "hidden" : "flex-1")}>
          <span className="text-sm font-medium">{company.name}</span>
          <span className="text-xs text-muted-foreground">Firma</span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          {company.name}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a href="/settings/profile" className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4" />
            Ustawienia firmy
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a href="/settings/account" className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4" />
            Ustawienia konta
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          {isSigningOut ? "Wylogowywanie..." : "Wyloguj"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
