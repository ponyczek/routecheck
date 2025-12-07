import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, CheckCircle, ServerCrash } from 'lucide-react';
import type { ErrorType } from '@/lib/public-report/validation';

interface ErrorViewProps {
  errorType: ErrorType;
  message?: string;
}

interface ErrorConfig {
  icon: typeof AlertCircle;
  iconColor: string;
  title: string;
  description: string;
  showRetryButton: boolean;
}

/**
 * ErrorView - Displays error states for token validation failures
 * Handles 404 (not found), 409 (already used), 410 (expired), 500 (server error)
 * 
 * @example
 * <ErrorView errorType="410" message="Link wygasł" />
 */
export function ErrorView({ errorType, message }: ErrorViewProps) {
  const errorConfigs: Record<ErrorType, ErrorConfig> = {
    '404': {
      icon: AlertCircle,
      iconColor: 'text-red-600',
      title: 'Link nie został znaleziony',
      description: 'Ten link nie istnieje lub został usunięty. Sprawdź czy skopiowałeś pełny adres z e-maila.',
      showRetryButton: true,
    },
    '409': {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      title: 'Raport już wysłany',
      description: 'Ten link został już wykorzystany do wysłania raportu. Jeśli chcesz edytować raport, skorzystaj z linku z potwierdzenia.',
      showRetryButton: false,
    },
    '410': {
      icon: Clock,
      iconColor: 'text-orange-600',
      title: 'Link wygasł',
      description: 'Ten link był ważny przez 24 godziny i już wygasł. Skontaktuj się z dyspozytorem, aby otrzymać nowy link.',
      showRetryButton: false,
    },
    '500': {
      icon: ServerCrash,
      iconColor: 'text-red-600',
      title: 'Błąd serwera',
      description: 'Wystąpił problem z serwerem. Spróbuj ponownie za chwilę lub skontaktuj się z pomocą techniczną.',
      showRetryButton: true,
    },
  };

  const config = errorConfigs[errorType];
  const Icon = config.icon;

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        {/* Icon */}
        <div className={`rounded-full bg-gray-100 p-8 ${config.iconColor}`}>
          <Icon className="w-20 h-20" aria-hidden="true" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900">
          {config.title}
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 max-w-md">
          {message || config.description}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          {config.showRetryButton && (
            <Button
              onClick={handleRetry}
              size="lg"
              className="font-semibold"
            >
              Spróbuj ponownie
            </Button>
          )}
        </div>

        {/* Contact Info */}
        <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200 max-w-md">
          <p className="text-sm text-gray-700 font-medium mb-2">
            Potrzebujesz pomocy?
          </p>
          <p className="text-sm text-gray-600">
            Jeśli problem się powtarza, skontaktuj się z dyspozytorem lub działem wsparcia Twojej firmy.
          </p>
        </div>
      </div>
    </div>
  );
}


