import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailLogsList } from "./EmailLogsList";
import { useEmailLogs } from "@/lib/settings";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface EmailLogsSectionProps {
  initialLogs?:
    | {
        uuid: string;
        recipient: string;
        subject: string;
        status: "SENT" | "FAILED";
        sentAt: string;
        errorMessage: string | null;
        companyUuid: string;
      }[]
    | null;
}

/**
 * Sekcja wyświetlająca ostatnie logi e-mail (ostatnie 5-10 wysyłek)
 * Zawiera kartę z listą (EmailLogsList) i przyciskiem/linkiem do pełnych logów
 */
export function EmailLogsSection({ initialLogs }: EmailLogsSectionProps) {
  const { data: logs, isLoading, error } = useEmailLogs(initialLogs || undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ostatnie alerty</CardTitle>
        <CardDescription>Historia wysłanych powiadomień e-mail</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Nie udało się załadować logów e-mail. Spróbuj ponownie później.</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && logs && <EmailLogsList logs={logs} />}
      </CardContent>
    </Card>
  );
}
