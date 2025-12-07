import { Badge } from "@/components/ui/badge";
import type { EmailLogDTO } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

interface EmailLogItemProps {
  log: EmailLogDTO;
}

/**
 * Pojedynczy wiersz/karta reprezentująca log e-mail
 * Wyświetla: recipient, subject, status badge, sentAt (formatowana data)
 * Opcjonalnie: errorMessage (jeśli status FAILED)
 */
export function EmailLogItem({ log }: EmailLogItemProps) {
  const statusVariant = log.status === "SENT" ? "default" : "destructive";
  const statusLabel = log.status === "SENT" ? "Wysłano" : "Błąd";

  const formattedDate = formatDistanceToNow(new Date(log.sentAt), {
    addSuffix: true,
    locale: pl,
  });

  return (
    <li className="flex flex-col gap-2 py-3 border-b last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{log.subject}</p>
          <p className="text-xs text-muted-foreground truncate">{log.recipient}</p>
        </div>
        <Badge variant={statusVariant} className="shrink-0 self-start">
          {statusLabel}
        </Badge>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
        {log.errorMessage && (
          <p className="text-xs text-destructive line-clamp-1 sm:truncate" title={log.errorMessage}>
            {log.errorMessage}
          </p>
        )}
      </div>
    </li>
  );
}
