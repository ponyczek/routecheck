import type { Session } from '@supabase/supabase-js';
import type { SessionViewModel, SessionStatus } from './types';

/**
 * Transformuje sesję Supabase do SessionViewModel
 * 
 * @param session - Sesja Supabase Auth
 * @returns SessionViewModel z przetworzonymi danymi
 * @throws Error jeśli dane sesji są niepełne
 */
export function transformSupabaseSession(session: Session): SessionViewModel {
  if (!session.expires_at || !session.user.email) {
    throw new Error('Niepełne dane sesji');
  }

  const expiresAt = new Date(session.expires_at * 1000).toISOString();
  const now = new Date();
  const expiresDate = new Date(expiresAt);
  const remainingMs = expiresDate.getTime() - now.getTime();
  const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
  
  // Określ status sesji
  let status: SessionStatus = 'active';
  if (remainingHours === 0) {
    status = 'expired';
  } else if (remainingHours < 2) {
    status = 'expiring_soon';
  }
  
  return {
    status,
    expiresAt,
    lastActivityAt: new Date(session.user.last_sign_in_at || session.user.created_at).toISOString(),
    remainingHours,
    email: session.user.email,
    authUserId: session.user.id,
  };
}

/**
 * Formatuje datę ISO do czytelnego formatu dla użytkownika polskiego
 * 
 * @param isoDate - Data w formacie ISO 8601
 * @returns Sformatowana data w formacie "dd MMM yyyy, HH:mm"
 */
export function formatSessionDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Zwraca tekst statusu sesji w języku polskim
 * 
 * @param status - Status sesji
 * @returns Przetłumaczony tekst statusu
 */
export function getSessionStatusText(status: SessionStatus): string {
  const statusMap: Record<SessionStatus, string> = {
    active: 'Aktywna',
    expiring_soon: 'Wygasa wkrótce',
    expired: 'Wygasła',
  };
  return statusMap[status];
}

/**
 * Zwraca wariant koloru dla badge statusu sesji
 * 
 * @param status - Status sesji
 * @returns Wariant badge zgodny z typami Shadcn/ui
 */
export function getSessionStatusVariant(status: SessionStatus): 'default' | 'destructive' | 'secondary' {
  const variantMap: Record<SessionStatus, 'default' | 'destructive' | 'secondary'> = {
    active: 'default',
    expiring_soon: 'secondary',
    expired: 'destructive',
  };
  return variantMap[status];
}


