import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ExportOptionsCheckboxesProps } from "@/lib/reports/export/types";

/**
 * Export options checkboxes for AI and risk tags inclusion
 * Both options are checked by default
 */
export function ExportOptionsCheckboxes({
  includeAi,
  includeTags,
  onIncludeAiChange,
  onIncludeTagsChange,
  disabled = false,
}: ExportOptionsCheckboxesProps) {
  return (
    <div className="space-y-3">
      <Label>Opcje eksportu</Label>
      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="include-ai"
            checked={includeAi}
            onCheckedChange={onIncludeAiChange}
            disabled={disabled}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="include-ai"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Uwzględnij wyniki AI
            </Label>
            <p className="text-sm text-muted-foreground">
              Eksportuj kolumny z podsumowaniem i oceną AI
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <Checkbox
            id="include-tags"
            checked={includeTags}
            onCheckedChange={onIncludeTagsChange}
            disabled={disabled}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="include-tags"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Uwzględnij tagi ryzyka
            </Label>
            <p className="text-sm text-muted-foreground">
              Eksportuj kolumnę z tagami ryzyka
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



