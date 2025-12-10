# ⚠️ Problem: Brakujące zmienne środowiskowe

## 🔒 UWAGA BEZPIECZEŃSTWA

**Wartości poniżej są TYLKO PRZYKŁADAMI!** 
- Nie są prawdziwymi kluczami API
- Nigdy nie używaj przykładowych wartości w produkcji
- Zawsze generuj własne, unikalne klucze
- **NIGDY nie commituj pliku `.env` do repozytorium!**

---

## Rozwiązanie

Twój skrypt wymaga trzech zmiennych środowiskowych. Oto jak je dodać:

### Metoda 1: Dodaj do pliku `.env` (ZALECANE)

Otwórz plik `.env` w edytorze i dodaj:

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=twoj-prawdziwy-service-role-key

# Public Report Token Security
PRIVATE_TOKEN_PEPPER=wygeneruj-losowy-string-32-znaki
```

**Gdzie znaleźć te wartości:**

1. **PUBLIC_SUPABASE_URL** i **SUPABASE_SERVICE_ROLE_KEY**:
   - Zaloguj się do [Supabase Dashboard](https://supabase.com/dashboard)
   - Wybierz swój projekt
   - Idź do: **Settings** → **API**
   - `URL` → skopiuj do `PUBLIC_SUPABASE_URL`
   - `service_role` (secret) → skopiuj do `SUPABASE_SERVICE_ROLE_KEY`

2. **PRIVATE_TOKEN_PEPPER**:
   - To może być dowolny losowy string (min 32 znaki)
   - **Wygeneruj unikalną wartość:** `openssl rand -hex 32`
   - **NIE używaj wartości z tego przykładu w produkcji!**

### Metoda 2: Export w terminalu (tymczasowe)

⚠️ **Uwaga:** Zastąp przykładowe wartości swoimi prawdziwymi kluczami!

```bash
export PUBLIC_SUPABASE_URL="https://twoj-projekt.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="twoj-service-role-key"
export PRIVATE_TOKEN_PEPPER="$(openssl rand -hex 32)"

# Teraz uruchom skrypt
npx tsx scripts/generate-test-token.ts
```

### Metoda 3: Inline przy uruchomieniu (jednorazowe)

```bash
PUBLIC_SUPABASE_URL="..." \
SUPABASE_SERVICE_ROLE_KEY="..." \
PRIVATE_TOKEN_PEPPER="..." \
npx tsx scripts/generate-test-token.ts
```

---

## Przykładowy plik `.env`

⚠️ **OSTRZEŻENIE:** Poniższe wartości są **PRZYKŁADOWE I NIEWAŻNE**!
- `EXAMPLE` w tokenie oznacza, że to nie jest prawdziwy klucz
- Zastąp wszystkie wartości swoimi prawdziwymi kluczami z Supabase Dashboard
- Nigdy nie używaj tych wartości w rzeczywistej aplikacji!

```bash
# ===========================================
# Supabase Configuration
# ===========================================
PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.EXAMPLE_NOT_REAL_TOKEN.REPLACE_WITH_YOUR_ACTUAL_SERVICE_ROLE_KEY

# Public Supabase Anon Key (for client-side)
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.EXAMPLE_NOT_REAL_TOKEN.REPLACE_WITH_YOUR_ACTUAL_ANON_KEY

# ===========================================
# Security & Tokens
# ===========================================
# Generate with: openssl rand -hex 32
PRIVATE_TOKEN_PEPPER=replace-with-output-from-openssl-rand-hex-32

# ===========================================
# Optional: Other Configuration
# ===========================================
# NODE_ENV=development
# PORT=4321
```

**Jak pobrać prawdziwe klucze:**
1. Idź do [Supabase Dashboard](https://supabase.com/dashboard)
2. Wybierz projekt → Settings → API
3. Skopiuj swoje prawdziwe klucze

---

## Weryfikacja

Po dodaniu zmiennych, sprawdź czy działają:

```bash
# Terminal 1: Sprawdź czy zmienne są załadowane
echo $PUBLIC_SUPABASE_URL

# Jeśli puste, załaduj plik .env ręcznie:
source .env

# Terminal 2: Uruchom skrypt
npx tsx scripts/generate-test-token.ts
```

---

## ⚠️ Bezpieczeństwo

**NIGDY** nie commituj pliku `.env` do git!

Sprawdź `.gitignore`:

```bash
cat .gitignore | grep ".env"
# Powinno być:
# .env
# .env.local
# .env*.local
```

---

## 🔧 Troubleshooting

### Problem: Zmienne są w `.env`, ale skrypt ich nie widzi

**Przyczyna:** Node.js nie ładuje automatycznie `.env`

**Rozwiązanie 1:** Użyj `dotenv`

```bash
# Zainstaluj dotenv jeśli nie ma
npm install dotenv

# Uruchom z dotenv
node -r dotenv/config scripts/generate-test-token.ts
```

**Rozwiązanie 2:** Dodaj do skryptu

```typescript
// Na początku scripts/generate-test-token.ts
import "dotenv/config";
// lub
import { config } from "dotenv";
config();
```

**Rozwiązanie 3:** Export ręcznie

```bash
export $(cat .env | grep -v '^#' | xargs)
npx tsx scripts/generate-test-token.ts
```

---

## ✅ Quick Fix (najprostsze)

```bash
# 1. Skopiuj przykładowy .env
cp .env.example .env

# 2. Otwórz w edytorze i wypełnij wartości
code .env
# lub
nano .env

# 3. Załaduj zmienne
export $(cat .env | grep -v '^#' | xargs)

# 4. Uruchom skrypt
npx tsx scripts/generate-test-token.ts
```

---

**Po rozwiązaniu problemu, wróć do:** `docs/testing-public-reports-quickstart.md`
