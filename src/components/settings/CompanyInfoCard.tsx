import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { InfoRow } from "./InfoRow";
import { HelpLink } from "./HelpLink";
import { formatLongDate } from "@/lib/utils/date";
import type { CompanyDTO } from "@/types";

interface CompanyInfoCardProps {
  company: CompanyDTO;
}

/**
 * Karta prezentująca informacje o firmie tylko do odczytu
 * Wyświetla: nazwa, UUID (z kopiowaniem), data utworzenia
 */
export function CompanyInfoCard({ company }: CompanyInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dane firmy</CardTitle>
      </CardHeader>
      <CardContent>
        <InfoRow label="Nazwa" value={company.name} />
        <InfoRow label="Identyfikator" value={company.uuid} copyable />
        <InfoRow label="Data utworzenia" value={formatLongDate(company.createdAt)} />
      </CardContent>
      <CardFooter>
        <HelpLink href="/help" />
      </CardFooter>
    </Card>
  );
}
