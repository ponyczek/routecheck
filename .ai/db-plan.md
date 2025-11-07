# Kompletny schemat bazy danych PostgreSQL dla RouteLog

## 1. Definicje tabel, typów i ograniczeń

### Typy niestandardowe (ENUMs)

```sql
CREATE TYPE report_route_status AS ENUM (
  'COMPLETED',
  'PARTIALLY_COMPLETED',
  'CANCELLED'
);

CREATE TYPE report_risk_level AS ENUM (
  'NONE',
  'LOW',
  'MEDIUM',
  'HIGH'
);
```

### Tabele

#### Tabela `companies`

Przechowuje informacje o firmach (klientach). W MVP obsługiwana jest jedna firma.

```sql
CREATE TABLE companies (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Tabela `users`

Mapuje użytkowników Supabase Auth do firm.

```sql
CREATE TABLE users (
  uuid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_uuid UUID NOT NULL REFERENCES companies(uuid) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Tabela `drivers`

Przechowuje informacje o kierowcach.

```sql
CREATE TABLE drivers (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_uuid UUID NOT NULL REFERENCES companies(uuid) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC' COMMENT 'IANA timezone name, e.g., "Europe/Warsaw"',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ COMMENT 'Enables soft-delete',
  CONSTRAINT drivers_company_email_unique UNIQUE (company_uuid, email)
);
```

#### Tabela `vehicles`

Przechowuje informacje o pojazdach.

```sql
CREATE TABLE vehicles (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_uuid UUID NOT NULL REFERENCES companies(uuid) ON DELETE CASCADE,
  registration_number TEXT NOT NULL,
  vin TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ COMMENT 'Enables soft-delete',
  CONSTRAINT vehicles_company_registration_unique UNIQUE (company_uuid, registration_number)
);
```

#### Tabela `driver_vehicle_assignments`

Tabela łącząca kierowców i pojazdy w czasie, zapobiegająca nakładającym się okresom przypisania.

```sql
CREATE TABLE driver_vehicle_assignments (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_uuid UUID NOT NULL REFERENCES drivers(uuid),
  vehicle_uuid UUID NOT NULL REFERENCES vehicles(uuid),
  start_date DATE NOT NULL,
  end_date DATE,
  company_uuid UUID NOT NULL REFERENCES companies(uuid) ON DELETE CASCADE,

  -- Zapobiega przypisaniu tego samego kierowcy do wielu pojazdów w tym samym czasie
  CONSTRAINT driver_assignments_no_overlap EXCLUDE USING GIST (
    driver_uuid WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ),

  -- Zapobiega przypisaniu tego samego pojazdu do wielu kierowców w tym samym czasie
  CONSTRAINT vehicle_assignments_no_overlap EXCLUDE USING GIST (
    vehicle_uuid WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  )
);
```

#### Tabela `reports`

Główna tabela przechowująca codzienne raporty od kierowców.

```sql
CREATE TABLE reports (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_uuid UUID NOT NULL REFERENCES drivers(uuid),
  company_uuid UUID NOT NULL REFERENCES companies(uuid) ON DELETE CASCADE,
  report_date DATE NOT NULL COMMENT 'Local date of the report, based on driver''s timezone',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now() COMMENT 'UTC timestamp of submission',
  timezone TEXT NOT NULL COMMENT 'IANA timezone of driver at submission',
  route_status report_route_status NOT NULL,
  delay_minutes INT DEFAULT 0,
  delay_reason TEXT,
  cargo_damage_description TEXT,
  vehicle_damage_description TEXT,
  next_day_blockers TEXT,
  is_problem BOOLEAN NOT NULL,
  risk_level report_risk_level COMMENT 'Denormalized from report_ai_results for query performance',
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,

  CONSTRAINT reports_driver_date_unique UNIQUE (driver_uuid, report_date)
) PARTITION BY RANGE (report_date);
```

#### Tabela `report_ai_results`

Przechowuje wyniki analizy AI dla każdego raportu.

```sql
CREATE TABLE report_ai_results (
  report_uuid UUID PRIMARY KEY REFERENCES reports(uuid) ON DELETE CASCADE,
  ai_summary TEXT,
  risk_level report_risk_level NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
```

#### Tabela `risk_tags`

Słownik predefiniowanych tagów ryzyka (w języku angielskim).

```sql
CREATE TABLE risk_tags (
  id SERIAL PRIMARY KEY,
  tag_name TEXT NOT NULL UNIQUE COMMENT 'English tag name, e.g., "delay", "damage"'
);
```

#### Tabela `report_risk_tags`

Tabela łącząca raporty z tagami ryzyka (relacja wiele-do-wielu).

```sql
CREATE TABLE report_risk_tags (
  report_uuid UUID NOT NULL REFERENCES reports(uuid) ON DELETE CASCADE,
  tag_id INT NOT NULL REFERENCES risk_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (report_uuid, tag_id)
);
```

#### Tabela `report_links`

Przechowuje jednorazowe, hashowane tokeny do wypełniania raportów.

```sql
CREATE TABLE report_links (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_uuid UUID NOT NULL REFERENCES drivers(uuid) ON DELETE CASCADE,
  company_uuid UUID NOT NULL REFERENCES companies(uuid) ON DELETE CASCADE,
  hashed_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Tabela `telemetry_events`

Zbiera dane telemetryczne dotyczące interakcji użytkownika.

```sql
CREATE TABLE telemetry_events (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL COMMENT 'e.g., FORM_OPEN, FORM_SUBMIT',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB,
  link_uuid UUID REFERENCES report_links(uuid),
  report_uuid UUID REFERENCES reports(uuid),
  driver_uuid UUID REFERENCES drivers(uuid),
  company_uuid UUID REFERENCES companies(uuid)
) PARTITION BY RANGE (occurred_at);
```

#### Tabela `email_logs`

Logi wysłanych wiadomości e-mail do monitorowania i debugowania.

```sql
CREATE TABLE email_logs (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL COMMENT 'e.g., SENT, FAILED',
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  company_uuid UUID REFERENCES companies(uuid)
);
```

## 2. Relacje między tabelami

- **`companies` 1 : N `users`**: Jedna firma może mieć wielu użytkowników.
- **`companies` 1 : N `drivers`**: Jedna firma może mieć wielu kierowców.
- **`companies` 1 : N `vehicles`**: Jedna firma może mieć wiele pojazdów.
- **`companies` 1 : N `reports`**: Jedna firma ma wiele raportów.
- **`drivers` 1 : N `reports`**: Jeden kierowca może mieć wiele raportów (ale tylko jeden dziennie).
- **`drivers` N : M `vehicles`**: (przez `driver_vehicle_assignments`) Jeden kierowca może używać wielu pojazdów w różnym czasie, a jeden pojazd może być używany przez wielu kierowców w różnym czasie.
- **`reports` 1 : 1 `report_ai_results`**: Każdy raport ma dokładnie jeden powiązany wynik analizy AI.
- **`reports` N : M `risk_tags`**: (przez `report_risk_tags`) Jeden raport może mieć wiele tagów ryzyka, a jeden tag może być przypisany do wielu raportów.

## 3. Indeksy

Klucze podstawowe i większość kluczy obcych są domyślnie indeksowane. Dodatkowe indeksy w celu poprawy wydajności:

```sql
-- Indeksy dla tabel z soft-delete, aby zapewnić unikalność tylko dla aktywnych rekordów
CREATE UNIQUE INDEX drivers_active_email_idx ON drivers (company_uuid, email) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX vehicles_active_registration_idx ON vehicles (company_uuid, registration_number) WHERE (deleted_at IS NULL);

-- Indeksy dla tabeli reports do szybkiego filtrowania na dashboardzie
CREATE INDEX reports_company_date_idx ON reports (company_uuid, report_date DESC);
CREATE INDEX reports_company_risk_level_idx ON reports (company_uuid, risk_level);

-- Indeks GIN do wyszukiwania pełnotekstowego w raportach
CREATE INDEX reports_search_vector_idx ON reports USING GIN (search_vector);
-- Trigger do aktualizacji search_vector
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON reports FOR EACH ROW EXECUTE PROCEDURE
tsvector_update_trigger(search_vector, 'pg_catalog.english', delay_reason, cargo_damage_description, vehicle_damage_description, next_day_blockers);


-- Indeks dla tabeli telemetry_events
CREATE INDEX telemetry_events_type_time_idx ON telemetry_events (event_type, occurred_at DESC);

-- Indeks dla kluczy obcych bez automatycznego indeksu
CREATE INDEX users_company_uuid_idx ON users (company_uuid);
CREATE INDEX drivers_company_uuid_idx ON drivers (company_uuid);
CREATE INDEX reports_driver_uuid_idx ON reports (driver_uuid);
```

## 4. Zasady PostgreSQL (Row Level Security)

RLS zapewnia, że użytkownicy mogą uzyskać dostęp tylko do danych należących do ich firmy.

```sql
-- 1. Funkcja pomocnicza do pobierania company_uuid bieżącego użytkownika
CREATE OR REPLACE FUNCTION auth.company_uuid()
RETURNS UUID AS $$
DECLARE
  company_uuid_val UUID;
BEGIN
  SELECT u.company_uuid INTO company_uuid_val
  FROM public.users u
  WHERE u.uuid = auth.uid();
  RETURN company_uuid_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Włączenie RLS i definicja polityk dla każdej tabeli z kolumną `company_uuid`
-- Przykład dla tabeli `drivers`:
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access to own company data" ON drivers
  FOR ALL
  USING (company_uuid = auth.company_uuid());

-- (Polityki te należy utworzyć dla tabel: users, drivers, vehicles,
-- driver_vehicle_assignments, reports, report_links, telemetry_events, email_logs)
```

## 5. Dodatkowe uwagi projektowe

1.  **Soft Delete**: Tabele `drivers` i `vehicles` używają kolumny `deleted_at` do "miękkiego usuwania", co pozwala zachować integralność historycznych danych (np. raportów powiązanych z usuniętym kierowcą).
2.  **Partycjonowanie**: Tabele `reports` (rocznie po `report_date`) i `telemetry_events` (miesięcznie po `occurred_at`) są zaprojektowane z myślą o partycjonowaniu, aby zapewnić wysoką wydajność w miarę wzrostu ilości danych.
3.  **Obsługa stref czasowych**: System przechowuje czas zdarzenia w UTC (`occurred_at`) oraz strefę czasową użytkownika (`timezone`), co pozwala na poprawne wyświetlanie dat i godzin w interfejsie użytkownika, zgodnie z lokalizacją kierowcy. `report_date` jest datą lokalną.
4.  **Denormalizacja**: Kolumna `risk_level` w tabeli `reports` jest zdenormalizowana (skopiowana z `report_ai_results`), aby znacznie przyspieszyć filtrowanie i sortowanie na głównym dashboardzie bez konieczności kosztownego łączenia tabel.
5.  **Bezpieczeństwo operacji publicznych**: Dostęp do danych przez jednorazowe linki (formularz raportu) powinien być realizowany przez funkcje brzegowe Supabase (Edge Functions) lub procedury RPC z podwyższonymi uprawnieniami (`service_role`), aby uniknąć nadawania uprawnień do zapisu dla anonimowych użytkowników (`anon`).
6.  **Retencja danych**: Zgodnie z notatkami, linki z tabeli `report_links` powinny być okresowo czyszczone (np. co 90 dni) za pomocą zadania `pg_cron`.

```


```
