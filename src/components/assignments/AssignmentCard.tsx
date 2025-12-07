import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, User, Truck, Calendar } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { AssignmentViewModel } from "@/lib/assignments/assignmentTypes";
import type { AssignmentDTO } from "@/types";

interface AssignmentCardProps {
  assignment: AssignmentViewModel;
  onEdit: (assignment: AssignmentDTO) => void;
  onDelete: (assignment: AssignmentDTO) => void;
}

/**
 * AssignmentCard
 * 
 * Pojedyncza karta przedstawiająca przypisanie w widoku mobilnym.
 * Kompaktowy layout z kluczowymi informacjami i menu akcji.
 */
export function AssignmentCard({ 
  assignment, 
  onEdit, 
  onDelete 
}: AssignmentCardProps) {
  const { assignment: assignmentData, driverName, vehicleRegistration, status, daysRemaining } = assignment;

  // Status badge variants
  const statusConfig = {
    active: {
      variant: "default" as const,
      label: "Aktywne",
    },
    upcoming: {
      variant: "secondary" as const,
      label: "Przyszłe",
    },
    completed: {
      variant: "outline" as const,
      label: "Zakończone",
    },
  };

  const statusInfo = statusConfig[status];

  // Format dates
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: pl });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">{driverName}</h3>
          </div>
          <Badge variant={statusInfo.variant}>
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-2">
        {/* Vehicle */}
        <div className="flex items-center gap-2 text-sm">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Pojazd:</span>
          <span className="font-medium">{vehicleRegistration}</span>
        </div>

        {/* Date Range */}
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="flex flex-col">
            <div>
              <span className="text-muted-foreground">Od:</span>{" "}
              <span className="font-medium">{formatDate(assignmentData.startDate)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Do:</span>{" "}
              {assignmentData.endDate ? (
                <>
                  <span className="font-medium">{formatDate(assignmentData.endDate)}</span>
                  {daysRemaining !== null && daysRemaining > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({daysRemaining} {daysRemaining === 1 ? 'dzień' : 'dni'})
                    </span>
                  )}
                </>
              ) : (
                <span className="italic text-muted-foreground">Bezterminowe</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              aria-label="Otwórz menu akcji"
            >
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Akcje
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(assignmentData)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edytuj
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(assignmentData)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}


