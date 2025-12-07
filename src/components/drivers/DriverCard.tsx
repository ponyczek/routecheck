import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { Mail, Clock, Calendar, Edit, Power, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import type { DriverDTO } from "@/types";

interface DriverCardProps {
  driver: DriverDTO;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

/**
 * Karta kierowcy (widok mobile <768px)
 * - Avatar z inicjałami
 * - Podstawowe informacje (email, timezone, data)
 * - Status badge
 * - Przyciski akcji w footer
 */
export function DriverCard({ driver, onEdit, onToggleActive, onDelete }: DriverCardProps) {
  const isDeleted = driver.deletedAt !== null;

  // Generuj inicjały z nazwiska (pierwsze 2 litery)
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Card className={isDeleted ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(driver.name)}</AvatarFallback>
          </Avatar>

          {/* Nazwa i status */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold leading-none">{driver.name}</h3>
              {isDeleted && (
                <Badge variant="outline" className="border-gray-400 text-gray-600">
                  Usunięty
                </Badge>
              )}
            </div>
            <StatusBadge isActive={driver.isActive} variant="compact" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        {/* Email */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4 shrink-0" />
          <span className="truncate">{driver.email}</span>
        </div>

        {/* Strefa czasowa */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          <span>{driver.timezone}</span>
        </div>

        {/* Data dodania */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Dodano {formatDate(driver.createdAt, "dd MMM yyyy")}</span>
        </div>
      </CardContent>

      {!isDeleted && (
        <CardFooter className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            <Edit className="mr-1 h-3 w-3" />
            Edytuj
          </Button>
          <Button variant="outline" size="sm" onClick={onToggleActive} className="flex-1">
            <Power className="mr-1 h-3 w-3" />
            {driver.isActive ? "Dezaktywuj" : "Aktywuj"}
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="flex-1 text-red-600 hover:text-red-700">
            <Trash2 className="mr-1 h-3 w-3" />
            Usuń
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
