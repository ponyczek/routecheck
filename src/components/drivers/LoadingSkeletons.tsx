import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LoadingSkeletonsProps {
  count?: number;
  view?: "table" | "cards";
}

/**
 * Komponenty skeleton wyświetlane podczas ładowania danych
 * Imitują strukturę tabeli (desktop) lub kart (mobile)
 */
export function LoadingSkeletons({ count = 5, view = "table" }: LoadingSkeletonsProps) {
  if (view === "cards") {
    return <LoadingSkeletonsCards count={count} />;
  }

  return <LoadingSkeletonsTable count={count} />;
}

/**
 * Skeletony dla widoku tabeli (desktop)
 */
function LoadingSkeletonsTable({ count }: { count: number }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Imię i nazwisko</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Strefa czasowa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data dodania</TableHead>
            <TableHead className="w-[70px]">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: count }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-48" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Skeletony dla widoku kart (mobile)
 */
function LoadingSkeletonsCards({ count }: { count: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-36" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
