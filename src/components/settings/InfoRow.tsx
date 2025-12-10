import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface InfoRowProps {
  label: string;
  value: string;
  copyable?: boolean;
}

/**
 * Pojedynczy wiersz informacji klucz–wartość
 * Opcjonalnie wspiera kopiowanie wartości do schowka (np. dla UUID)
 */
export function InfoRow({ label, value, copyable }: InfoRowProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Skopiowano do schowka", {
        description: value,
      });
    } catch {
      toast.error("Nie udało się skopiować");
    }
  };

  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{value}</span>
        {copyable && (
          <Button variant="ghost" size="icon" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
            <span className="sr-only">Kopiuj {label}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
