import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

/**
 * Information banner about export limits and processing time
 * Displayed in the export CSV modal to inform users about constraints
 */
export function ExportInfoBanner() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Eksport może objąć maksymalnie 31 dni. Generowanie pliku może potrwać kilka sekund w zależności od liczby
        raportów.
      </AlertDescription>
    </Alert>
  );
}
