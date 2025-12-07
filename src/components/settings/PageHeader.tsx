interface PageHeaderProps {
  title: string;
  description?: string;
}

/**
 * Uniwersalny nagłówek strony z tytułem i opcjonalnym opisem
 * Używany na górze widoku settings i innych widoków aplikacji dla spójności UI
 */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}
