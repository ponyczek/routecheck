# AuthenticatedLayout - Checklist testowania

## 1. Server-side Authentication Guard

### Test 1.1: Redirect bez sesji
- [ ] Odwiedź `/dashboard` bez logowania
- [ ] Oczekiwany rezultat: Redirect na `/signin?returnTo=/dashboard&expired=true`
- [ ] Sprawdź czy `returnTo` parameter jest poprawnie zakodowany

### Test 1.2: Dostęp z ważną sesją
- [ ] Zaloguj się przez `/signin`
- [ ] Odwiedź `/dashboard`
- [ ] Oczekiwany rezultat: Dashboard się załadował, brak redirectu
- [ ] Sprawdź czy sidebar/top bar się wyświetlają

### Test 1.3: Redirect na stronę docelową po logowaniu
- [ ] Odwiedź `/drivers` bez logowania (redirect na signin z returnTo)
- [ ] Zaloguj się
- [ ] Oczekiwany rezultat: Automatyczny redirect na `/drivers`

## 2. Client-side API Calls

### Test 2.1: Fetch user data (GET /api/users/me)
- [ ] Otwórz DevTools Network
- [ ] Załaduj `/dashboard` będąc zalogowanym
- [ ] Sprawdź czy jest request do `/api/users/me`
- [ ] Oczekiwany status: 200
- [ ] Sprawdź response body: { uuid, companyUuid, createdAt }

### Test 2.2: Fetch company data (GET /api/companies/me)
- [ ] W tym samym scenariuszu sprawdź request do `/api/companies/me`
- [ ] Oczekiwany status: 200
- [ ] Sprawdź response body: { uuid, name, createdAt }

### Test 2.3: Auto-redirect przy 401
- [ ] Usuń cookies/session storage
- [ ] Odśwież stronę `/dashboard`
- [ ] Oczekiwany rezultat: Automatyczny redirect na `/signin?returnTo=...&expired=true&reason=timeout`
- [ ] Sprawdź czy toast nie pojawił się (redirect bez toastu)

### Test 2.4: Error handling 500
- [ ] Symuluj błąd 500 (można przez DevTools Network throttling)
- [ ] Oczekiwany rezultat: OfflineFallback banner z przyciskiem retry
- [ ] Click "Spróbuj ponownie"
- [ ] Oczekiwany rezultat: Ponowne wywołanie API

## 3. Desktop Navigation

### Test 3.1: Sidebar visibility
- [ ] Załaduj stronę na desktop (> 768px)
- [ ] Oczekiwany rezultat: Sidebar widoczny po lewej (fixed, w-64)
- [ ] Sprawdź czy logo, nawigacja i UserMenu są widoczne

### Test 3.2: Active link highlighting
- [ ] Odwiedź `/dashboard`
- [ ] Sprawdź czy link "Dashboard" ma active styling (bg-primary/10 text-primary)
- [ ] Odwiedź `/drivers`
- [ ] Sprawdź czy link "Kierowcy" jest teraz aktywny
- [ ] Odwiedź `/settings/profile`
- [ ] Sprawdź czy link "Ustawienia" jest aktywny (prefix match)

### Test 3.3: Navigation clicking
- [ ] Click na "Kierowcy" w sidebar
- [ ] Oczekiwany rezultat: Nawigacja do `/drivers`
- [ ] Sprawdź czy content się zmienił
- [ ] Sprawdź czy active state się zaktualizował

### Test 3.4: UserMenu dropdown
- [ ] Click na UserMenu (avatar + nazwa firmy)
- [ ] Oczekiwany rezultat: Dropdown się otworzył
- [ ] Sprawdź zawartość: nazwa firmy, "Ustawienia firmy", "Ustawienia konta", "Wyloguj"
- [ ] Click "Ustawienia firmy"
- [ ] Oczekiwany rezultat: Nawigacja do `/settings/profile`

### Test 3.5: Sign out
- [ ] Otwórz UserMenu
- [ ] Click "Wyloguj"
- [ ] Oczekiwany rezultat: 
  - Loading state ("Wylogowywanie...")
  - Redirect na `/signin?reason=signed-out`
  - Sesja wyczyszczona

## 4. Mobile Navigation

### Test 4.1: Mobile layout visibility
- [ ] Zmień viewport na mobile (< 768px)
- [ ] Oczekiwany rezultat:
  - Sidebar ukryty
  - TopBar widoczny (sticky top)
  - BottomNavigation widoczny (fixed bottom)

### Test 4.2: TopBar functionality
- [ ] Sprawdź zawartość TopBar: hamburger, logo, page title
- [ ] Click na logo
- [ ] Oczekiwany rezultat: Nawigacja do `/dashboard`

### Test 4.3: Mobile menu (Sheet)
- [ ] Click na hamburger icon
- [ ] Oczekiwany rezultat: Sheet wysuwa się z lewej
- [ ] Sprawdź zawartość: nazwa firmy, pełna nawigacja, UserMenu
- [ ] Click na link w nawigacji
- [ ] Oczekiwany rezultat: Nawigacja + auto-close Sheet

### Test 4.4: Keyboard shortcut (Escape)
- [ ] Otwórz mobile menu
- [ ] Naciśnij Escape
- [ ] Oczekiwany rezultat: Menu się zamyka

### Test 4.5: BottomNavigation
- [ ] Sprawdź zawartość: Dashboard, Kierowcy, Raporty, Więcej
- [ ] Click na "Kierowcy"
- [ ] Oczekiwany rezultat: Nawigacja + active state
- [ ] Click na "Więcej"
- [ ] Oczekiwany rezultat: Sheet się otwiera

## 5. Network Status & Offline Mode

### Test 5.1: NetworkIndicator - online
- [ ] Przy normalnym połączeniu sprawdź NetworkIndicator
- [ ] Oczekiwany rezultat: Zielony badge "Online" z ikoną Wifi

### Test 5.2: Offline detection
- [ ] Wyłącz internet (DevTools → Network → Offline)
- [ ] Oczekiwany rezultat:
  - NetworkIndicator zmienia się na czerwony "Offline"
  - Toast: "Brak połączenia z internetem"
  - OfflineFallback banner pojawia się na górze contentu

### Test 5.3: Reconnect
- [ ] Włącz internet z powrotem
- [ ] Oczekiwany rezultat:
  - NetworkIndicator zmienia się na zielony
  - Toast: "Połączenie przywrócone"
  - OfflineFallback banner znika
  - Automatyczny refetch danych (check Network tab)

### Test 5.4: Offline retry
- [ ] W trybie offline click "Spróbuj ponownie" w OfflineFallback
- [ ] Oczekiwany rezultat: Próba ponownego fetchowania danych

## 6. Breadcrumbs

### Test 6.1: Dashboard breadcrumbs
- [ ] Odwiedź `/dashboard`
- [ ] Oczekiwany rezultat: Brak breadcrumbs (tylko jedna strona w hierarchii)

### Test 6.2: Settings breadcrumbs
- [ ] Odwiedź `/settings/profile`
- [ ] Oczekiwany rezultat: Dashboard > Ustawienia > Profil firmy
- [ ] Sprawdź czy ostatni element nie jest linkiem (aria-current="page")
- [ ] Click na "Dashboard" w breadcrumbs
- [ ] Oczekiwany rezultat: Nawigacja do `/dashboard`

## 7. Loading States

### Test 7.1: Initial loading
- [ ] Wyczyść cache i odśwież `/dashboard`
- [ ] Oczekiwany rezultat: Skeleton loader (sidebar + content area)
- [ ] Po załadowaniu danych: pełny layout

### Test 7.2: No infinite loading
- [ ] Sprawdź czy loading state kończy się po otrzymaniu danych
- [ ] Max czas: ~2 sekundy (zależy od API)

## 8. Error Boundary

### Test 8.1: Rendering error
- [ ] Symuluj błąd renderowania (można tymczasowo dodać throw new Error() w komponencie)
- [ ] Oczekiwany rezultat: ErrorBoundary fallback UI
- [ ] Sprawdź przyciski: "Odśwież stronę", "Wróć do Dashboard"

### Test 8.2: Development error details
- [ ] W development mode sprawdź czy stack trace jest widoczny w <details>

## 9. Responsive Design

### Test 9.1: Breakpoint 768px
- [ ] Testuj viewport od 767px do 769px
- [ ] Sprawdź czy layout się zmienia przy 768px
- [ ] Mobile < 768px: TopBar + BottomNav
- [ ] Desktop >= 768px: Sidebar

### Test 9.2: Content spacing
- [ ] Sprawdź czy content ma odpowiednie marginesy
- [ ] Desktop: ml-64 (margines dla sidebar)
- [ ] Mobile: pb-16 (padding dla bottom nav)

### Test 9.3: Container max-width
- [ ] Na dużym ekranie (> 1280px) sprawdź czy content nie rozciąga się za bardzo
- [ ] Oczekiwany rezultat: max-width 1280px, centered

## 10. Accessibility

### Test 10.1: Skip link
- [ ] Załaduj stronę i naciśnij Tab
- [ ] Oczekiwany rezultat: "Przejdź do treści" link staje się widoczny
- [ ] Naciśnij Enter
- [ ] Oczekiwany rezultat: Focus przenosi się do #main-content

### Test 10.2: Keyboard navigation
- [ ] Używaj tylko Tab i Enter do nawigacji
- [ ] Sprawdź czy można dotrzeć do wszystkich linków i przycisków
- [ ] Sprawdź czy focus-visible ring jest widoczny

### Test 10.3: ARIA labels
- [ ] Użyj screen readera (Voice Over na Mac, NVDA na Windows)
- [ ] Sprawdź czy nawigacja ma label "Główna nawigacja"
- [ ] Sprawdź czy breadcrumbs mają label "Breadcrumb"
- [ ] Sprawdź czy aktywny link ma aria-current="page"

### Test 10.4: Icons accessibility
- [ ] Sprawdź czy wszystkie decorative icons mają aria-hidden="true"
- [ ] Sprawdź czy interactive elements z ikonami mają aria-label

## 11. Performance

### Test 11.1: Bundle size
- [ ] Build produkcyjny: `npm run build`
- [ ] Sprawdź rozmiar bundli w folderze dist
- [ ] Layout bundle powinien być < 50kb gzipped

### Test 11.2: API caching
- [ ] Załaduj `/dashboard`
- [ ] Odwiedź `/drivers`
- [ ] Wróć do `/dashboard`
- [ ] Oczekiwany rezultat: Dane z cache (brak nowego requestu do API)
- [ ] Sprawdź TanStack Query DevTools

### Test 11.3: Refetch intervals
- [ ] Pozostań na stronie przez 5+ minut
- [ ] Sprawdź Network tab
- [ ] Oczekiwany rezultat: Automatyczny refetch co 5 minut

## 12. Cross-browser Testing

### Test 12.1: Chrome/Edge
- [ ] Wszystkie powyższe testy

### Test 12.2: Firefox
- [ ] Wszystkie powyższe testy
- [ ] Szczególnie: custom scrollbar (może nie działać)

### Test 12.3: Safari
- [ ] Wszystkie powyższe testy
- [ ] Szczególnie: backdrop-filter, smooth scrolling

## Podsumowanie

Zaznacz wszystkie testy po wykonaniu. Każdy nieudany test powinien być zgłoszony jako bug z:
- Krokami do reprodukcji
- Oczekiwanym rezultatem
- Aktualnym rezultatem
- Screenshotem/nagraniem (jeśli applicable)
- Informacją o przeglądarce i systemie operacyjnym

