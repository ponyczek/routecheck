import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { SessionExpiryReason } from "@/lib/auth/types";

interface SessionExpiryNoticeProps {
  reason: SessionExpiryReason;
}

export function SessionExpiryNotice({ reason }: SessionExpiryNoticeProps) {
  if (!reason) {
    return null;
  }

  const messages = {
    timeout: {
      title: "Sesja wygasła",
      description: "Twoja sesja wygasła z powodu braku aktywności. Zaloguj się ponownie.",
    },
    "signed-out": {
      title: "Wylogowano",
      description: "Zostałeś wylogowany. Zaloguj się ponownie, aby kontynuować.",
    },
  };

  const message = messages[reason];

  return (
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{message.title}</AlertTitle>
      <AlertDescription>{message.description}</AlertDescription>
    </Alert>
  );
}
