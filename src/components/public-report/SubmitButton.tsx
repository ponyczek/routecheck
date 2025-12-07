import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';

interface SubmitButtonProps {
  isSubmitting: boolean;
  isProblem: boolean;
  isOnline: boolean;
}

/**
 * SubmitButton - Main form submit button with loading state and dynamic text
 * Text adapts based on problem/happy path and online/offline status
 * 
 * @example
 * <SubmitButton 
 *   isSubmitting={isSubmitting}
 *   isProblem={isProblem}
 *   isOnline={isOnline}
 * />
 */
export function SubmitButton({ isSubmitting, isProblem, isOnline }: SubmitButtonProps) {
  const getButtonText = () => {
    if (isSubmitting) {
      return (
        <>
          <LoaderCircle className="animate-spin mr-2" aria-hidden="true" />
          Wysyłam...
        </>
      );
    }
    
    if (!isOnline) {
      return 'Wyślę gdy będzie sieć';
    }
    
    if (isProblem) {
      return 'Wyślij zgłoszenie problemu';
    }
    
    return 'Wyślij raport - Wszystko OK';
  };

  return (
    <Button
      type="submit"
      size="lg"
      className="w-full text-lg py-6 font-semibold shadow-lg hover:shadow-xl transition-all"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
    >
      {getButtonText()}
    </Button>
  );
}


