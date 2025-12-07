import { EmailLogItem } from "./EmailLogItem";
import type { EmailLogDTO } from "@/types";

interface EmailLogsListProps {
  logs: EmailLogDTO[];
}

/**
 * Lista ostatnich logów e-mail
 * Wyświetla w formie listy (responsive): recipient, subject, status (badge), sentAt
 */
export function EmailLogsList({ logs }: EmailLogsListProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Brak logów e-mail do wyświetlenia</p>
      </div>
    );
  }

  return (
    <ul className="space-y-0">
      {logs.map((log) => (
        <EmailLogItem key={log.uuid} log={log} />
      ))}
    </ul>
  );
}


