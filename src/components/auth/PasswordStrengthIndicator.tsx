import { usePasswordStrength } from "@/lib/auth/usePasswordStrength";

interface PasswordStrengthIndicatorProps {
  password: string;
}

/**
 * Visual indicator showing password strength in real-time
 * 
 * Displays:
 * - Progress bar with color-coded strength (red/yellow/green)
 * - Text feedback ("Słabe", "Średnie", "Mocne")
 * 
 * Accessible via ARIA live region for screen readers
 */
export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { strength, score, feedback } = usePasswordStrength(password);

  if (password.length === 0) {
    return null;
  }

  const barColor = {
    weak: "bg-red-500",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
  }[strength];

  const textColor = {
    weak: "text-red-600",
    medium: "text-yellow-600",
    strong: "text-green-600",
  }[strength];

  return (
    <div className="space-y-1" role="status" aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Siła hasła:</span>
        <span className={`font-medium ${textColor}`}>{feedback}</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${score}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

