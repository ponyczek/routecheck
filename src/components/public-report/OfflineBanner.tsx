import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface OfflineBannerProps {
  isOnline: boolean;
}

/**
 * OfflineBanner - Alert shown when network connection is lost
 * Informs user that report will be queued and sent automatically when online
 *
 * @example
 * const isOnline = useNetworkStatus();
 * <OfflineBanner isOnline={isOnline} />
 */
export function OfflineBanner({ isOnline }: OfflineBannerProps) {
  if (isOnline) return null;

  return (
    <div className="mb-6" role="alert" aria-live="polite" aria-atomic="true">
      <Alert variant="default" className="border-orange-300 bg-orange-50">
        <Info className="h-5 w-5 text-orange-600" />
        <AlertTitle className="text-orange-900 font-semibold">Brak połączenia z internetem</AlertTitle>
        <AlertDescription className="text-orange-800">
          Raport zostanie zapisany i wysłany automatycznie po przywróceniu połączenia.
        </AlertDescription>
      </Alert>
    </div>
  );
}
