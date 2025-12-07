# ⚠️ Problem: Brakujące zmienne środowiskowe

## Rozwiązanie

Twój skrypt wymaga trzech zmiennych środowiskowych. Oto jak je dodać:

### Metoda 1: Dodaj do pliku `.env` (ZALECANE)

Otwórz plik `.env` w edytorze i dodaj:

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Public Report Token Security
PRIVATE_TOKEN_PEPPER=zmien-to-na-losowy-string-w-produkcji
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
   - Przykład: `my-super-secret-pepper-string-2024`
   - W produkcji użyj: `openssl rand -hex 32`

### Metoda 2: Export w terminalu (tymczasowe)

```bash
export PUBLIC_SUPABASE_URL="https://twoj-projekt.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
export PRIVATE_TOKEN_PEPPER="my-secret-pepper"

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

```bash
# ===========================================
# Supabase Configuration
# ===========================================
PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYzOTU4NzI4MCwiZXhwIjoxOTU1MTYzMjgwfQ.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Public Supabase Anon Key (for client-side)
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Mzk1ODcyODAsImV4cCI6MTk1NTE2MzI4MH0.YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY

# ===========================================
# Security & Tokens
# ===========================================
PRIVATE_TOKEN_PEPPER=change-this-to-random-string-in-production-min-32-chars

# ===========================================
# Optional: Other Configuration
# ===========================================
# NODE_ENV=development
# PORT=4321
```

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
