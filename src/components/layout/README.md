# Layout Components - AuthenticatedLayout

Ten folder zawiera komponenty layoutu dla authenticated views w aplikacji RouteCheck.

## Przegląd

AuthenticatedLayout to system komponentów zapewniający spójny shell aplikacji dla wszystkich chronionych widoków. Składa się z:

- **Desktop view**: Fixed sidebar z nawigacją po lewej stronie
- **Mobile view**: TopBar + BottomNavigation + wysuwane menu (Sheet)
- **Utilities**: NetworkIndicator, Breadcrumbs, ErrorBoundary, OfflineFallback

## Struktura komponentów

```
LayoutContent (główny orkestrator)
├── ErrorBoundary
├── QueryProvider
├── Desktop Layout (>= 768px)
│   ├── DesktopSidebar
│   │   ├── Logo
│   │   ├── MainNavigation
│   │   │   └── NavItem (x4)
│   │   └── UserMenu
│   ├── Breadcrumbs + NetworkIndicator
│   └── Content Area
└── Mobile Layout (< 768px)
    ├── TopBar (hamburger + logo + title)
    ├── Content Area
    ├── BottomNavigation (4 icons)
    └── Sheet (slide-out menu)
        ├── MainNavigation
        └── UserMenu
```

## Główne komponenty

### `LayoutContent.tsx`

**Główny komponent** łączący wszystkie elementy layoutu. Zarządza:

- Stanem uwierzytelnienia (useAuthContext)
- Monitorowaniem sieci (useNetworkStatus)
- Informacjami o route (useActiveRoute)
- Conditional rendering (loading, error, authenticated states)

**Props**: `{ children: React.ReactNode }`

**Używane hooki**:

- `useAuthContext` - pobiera dane użytkownika i firmy
- `useNetworkStatus` - monitoruje stan połączenia
- `useActiveRoute` - parsuje pathname i generuje breadcrumbs

### `DesktopSidebar.tsx`

Fixed sidebar dla desktop view (>= 768px). Zawiera:

- Logo RouteCheck (link do /dashboard)
- Główną nawigację (Dashboard, Kierowcy, Raporty, Ustawienia)
- UserMenu na dole

**Props**:

```typescript
{
  companyName: string;
  activeRoute: string;
  user: UserDTO;
  company: CompanyDTO;
  onSignOut: () => Promise<void>;
}
```

### `MobileLayout.tsx`

Layout dla urządzeń mobilnych (< 768px). Składa się z:

- **TopBar**: sticky header z hamburgerem, logo i tytułem
- **BottomNavigation**: fixed bottom bar z 4 ikonami
- **Sheet**: wysuwane menu z pełną nawigacją

**Props**:

```typescript
{
  children: React.ReactNode;
  pageTitle: string;
  activeRoute: string;
  companyName: string;
  user: UserDTO;
  company: CompanyDTO;
  onSignOut: () => Promise<void>;
}
```

**Keyboard shortcuts**:

- `Escape` - zamyka menu (gdy otwarte)

### `MainNavigation.tsx`

Lista linków nawigacyjnych. Automatycznie oblicza active state na podstawie pathname.

**Props**:

```typescript
{
  items: NavItem[];
  activeRoute: string;
  orientation?: "vertical" | "horizontal";
  onItemClick?: () => void;
}
```

**Elementy nawigacji**:

- Dashboard - `/dashboard`
- Kierowcy - `/drivers`
- Raporty - `/reports`
- Ustawienia - `/settings` (match prefix `/settings/*`)

### `NavItem.tsx`

Pojedynczy element nawigacji z ikoną i tekstem.

**Features**:

- Active state styling
- Disabled state dla flagowanych features
- Badge "Wkrótce" dla isFlagged items
- Keyboard accessible (Tab, Enter)
- Memoized dla performance

### `UserMenu.tsx`

Dropdown menu z opcjami użytkownika (Shadcn DropdownMenu).

**Menu items**:

- Nazwa firmy (label, disabled)
- Ustawienia firmy → `/settings/profile`
- Ustawienia konta → `/settings/account`
- Wyloguj (z loading state)

## Utility Components

### `NetworkIndicator.tsx`

Badge pokazujący stan połączenia:

- 🟢 **Online** - normalne połączenie
- 🟡 **Wolne** - wolne połączenie (2G, slow-2g)
- 🔴 **Offline** - brak połączenia

Automatycznie pokazuje toasty przy zmianie stanu.

### `Breadcrumbs.tsx`

Breadcrumb navigation pokazujący hierarchię stron.

**Format**: `Dashboard > Parent > Current Page`

Nie renderuje się gdy jest tylko 1 crumb (current page only).

### `OfflineFallback.tsx`

Alert banner wyświetlany gdy aplikacja jest offline.

**Features**:

- Komunikat o braku połączenia
- Przycisk "Spróbuj ponownie"
- Informacja o ograniczonej funkcjonalności

### `ErrorBoundary.tsx`

React Error Boundary przechwytujący błędy renderowania.

**Features**:

- Fallback UI z przyjaznym komunikatem
- Opcje recovery: "Odśwież stronę", "Wróć do Dashboard"
- Stack trace w development mode
- Logowanie błędów do console

## Custom Hooks

### `useAuthContext.ts`

Zarządza stanem uwierzytelnienia.

**Returns**:

```typescript
{
  user: UserDTO | null;
  company: CompanyDTO | null;
  isLoading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}
```

**Features**:

- TanStack Query z 5-minutowym cache
- Auto-refetch co 5 minut
- Auto-redirect przy 401
- Refetch on window focus i reconnect

### `useNetworkStatus.ts`

Monitoruje stan połączenia sieciowego.

**Returns**:

```typescript
{
  isOnline: boolean;
  status: "online" | "offline" | "slow";
}
```

**Features**:

- Nasłuchuje `online`/`offline` events
- Wykrywa wolne połączenie (Network Information API)
- Pokazuje toasty przy zmianie stanu

### `useActiveRoute.ts`

Parsuje pathname i generuje informacje o route.

**Returns**:

```typescript
{
  pathname: string;
  pageTitle: string;
  breadcrumbs: Crumb[];
  parentRoute?: string;
}
```

**Route mapping**:

- `/dashboard` → "Dashboard"
- `/drivers` → "Kierowcy"
- `/reports` → "Raporty"
- `/settings` → "Ustawienia"
- `/settings/profile` → "Profil firmy" (parent: "/settings")
- i inne...

### `useMobileMenu.ts`

Zarządza stanem mobile menu (Sheet).

**Returns**:

```typescript
{
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
}
```

**Features**:

- Auto-close przy zmianie route
- Blokuje scroll body gdy menu otwarte

### `useKeyboardShortcuts.ts`

Centralizuje obsługę keyboard shortcuts.

**Usage**:

```typescript
useKeyboardShortcuts(
  [
    { key: "Escape", callback: closeMenu },
    { key: "k", ctrlKey: true, callback: openSearch },
  ],
  enabled
);
```

## Typy

Wszystkie typy są zdefiniowane w `src/lib/layout/types.ts`:

```typescript
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive: boolean;
  isFlagged?: boolean;
  badgeText?: string;
}

export interface AuthContextValue {
  user: UserDTO | null;
  company: CompanyDTO | null;
  isLoading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ... inne typy
```

## Użycie

### W Astro Layout

**Note**: Authentication guard jest teraz obsługiwany przez middleware (nie w layout).

```astro
---
// src/layouts/AuthenticatedLayout.astro
import { LayoutContent } from "@/components/layout/LayoutContent";

// Authentication is handled by middleware
// We can safely assume user is authenticated here
---

<html>
  <body>
    <LayoutContent client:only="react">
      <slot />
    </LayoutContent>
  </body>
</html>
```

### W Middleware

Authentication guard działa w middleware:

```typescript
// src/middleware/index.ts
export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // Auth guard for protected routes
  if (isProtectedRoute(context.url.pathname)) {
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();

    if (error || !session?.user) {
      return context.redirect(`/signin?returnTo=${encodeURIComponent(context.url.pathname)}&expired=true`);
    }
  }

  return next();
});
```

### W stronie

```astro
---
// src/pages/dashboard.astro
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout.astro";
---

<AuthenticatedLayout title="Dashboard - RouteCheck">
  <div class="container mx-auto p-6">
    <!-- Your content -->
  </div>
</AuthenticatedLayout>
```

## Styling

Layout używa Tailwind CSS z custom variables zdefiniowanymi w `global.css`:

### Breakpoints

- Mobile: `< 768px`
- Desktop: `>= 768px`

### Key classes

- `.container` - max-width 1280px, centered
- `.custom-scrollbar` - stylowany scrollbar dla webkit
- Animations: `.animate-in`, `.fade-in`, `.slide-in-left`

### Colors (CSS variables)

- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--muted`, `--muted-foreground`
- `--border`, `--ring`
- Dark mode support z `.dark` class

## Accessibility

✅ **ARIA labels**: wszystkie landmark regions i nawigacje  
✅ **Skip link**: "Przejdź do treści" na początku strony  
✅ **Keyboard navigation**: pełna obsługa Tab, Enter, Escape  
✅ **Focus management**: focus-visible rings, focus trap w modals  
✅ **Screen reader support**: aria-current, aria-expanded, aria-controls  
✅ **Icons**: decorative icons mają aria-hidden="true"

## Performance

🚀 **Memoization**: NavItem, MainNavigation, Breadcrumbs  
🚀 **Lazy loading**: client:only="react" dla React islands  
🚀 **TanStack Query caching**: 5 min stale time, background refetch  
🚀 **Bundle size**: < 50kb gzipped dla layout bundle

## Testing

Comprehensive test checklist dostępny w:
`.ai/authenticated-layout-testing-checklist.md`

Unit testy:

- `src/lib/layout/__tests__/useActiveRoute.test.tsx`

## Troubleshooting

### "Nieskończone ładowanie"

- Sprawdź czy API endpoints zwracają 200
- Sprawdź console dla błędów
- Verify TanStack Query DevTools

### "Redirect loop"

- Sprawdź czy server-side guard działa poprawnie
- Verify session w cookies/localStorage
- Check middleware configuration

### "Layout nie responsywny"

- Verify breakpoint (768px)
- Check CSS classes (md:hidden, md:flex)
- Inspect computed styles in DevTools

### "Network indicator nie działa"

- Check if `navigator.onLine` is available
- Verify event listeners (online/offline)
- Test with DevTools Network throttling

## Przyszłe rozszerzenia

- [ ] Preload links dla szybszej nawigacji
- [ ] Service Worker dla offline support
- [ ] Keyboard shortcut: Ctrl+K dla search
- [ ] Notifications center w TopBar
- [ ] User avatar z upload
- [ ] Theme switcher (light/dark)
- [ ] Multi-language support

## Maintainers

Dokument tworzony podczas implementacji AuthenticatedLayout zgodnie z planem:
`.ai/authenticated-layout-view-implementation-plan.md`
