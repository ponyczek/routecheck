import { HelpCircle } from "lucide-react";

interface HelpLinkProps {
  href: string;
  children?: React.ReactNode;
}

/**
 * Link do strony pomocy lub kontaktu
 * Wyświetlany w stopce kart jako prosty text link z ikoną
 */
export function HelpLink({ href, children }: HelpLinkProps) {
  return (
    <a href={href} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
      <HelpCircle className="w-4 h-4" />
      {children || "Potrzebujesz pomocy?"}
    </a>
  );
}
