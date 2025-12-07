import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { Calendar, Edit, Power, Trash2, Hash } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import type { VehicleDTO } from "@/types";

interface VehicleCardProps {
  vehicle: VehicleDTO;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

/**
 * Karta pojazdu (widok mobile <768px)
 * - Numer rejestracyjny jako główny element
 * - VIN (jeśli dostępny)
 * - Status badge
 * - Data utworzenia
 * - Przyciski akcji w footer
 */
export function VehicleCard({ vehicle, onEdit, onToggleActive, onDelete }: VehicleCardProps) {
  const isDeleted = vehicle.deletedAt !== null;

  return (
    <Card className={isDeleted ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          {/* Numer rejestracyjny i status */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold leading-none text-lg">{vehicle.registrationNumber}</h3>
              {isDeleted && (
                <Badge variant="outline" className="border-gray-400 text-gray-600">
                  Usunięty
                </Badge>
              )}
            </div>
            <StatusBadge vehicle={vehicle} variant="compact" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        {/* VIN */}
        {vehicle.vin && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="h-4 w-4 shrink-0" />
            <span className="font-mono">{vehicle.vin}</span>
          </div>
        )}

        {/* Data utworzenia */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Utworzono {formatDate(vehicle.createdAt, "dd MMM yyyy")}</span>
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
            {vehicle.isActive ? "Dezaktywuj" : "Aktywuj"}
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
