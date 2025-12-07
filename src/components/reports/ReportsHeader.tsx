import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";

interface ReportsHeaderProps {
  onAddReport?: () => void;
  onExport?: () => void;
}

/**
 * Header component for reports view
 * Contains title, description, and action buttons
 */
export function ReportsHeader({ onAddReport, onExport }: ReportsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Raporty</h1>
        <p className="text-muted-foreground">
          Przeglądaj i zarządzaj historią raportów kierowców
        </p>
      </div>
      <div className="flex items-center gap-2">
        {onExport && (
          <Button variant="outline" onClick={onExport} className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Eksportuj</span>
          </Button>
        )}
        {onAddReport && (
          <Button onClick={onAddReport} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Dodaj raport</span>
          </Button>
        )}
      </div>
    </div>
  );
}



