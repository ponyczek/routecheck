-- Automatyczne utworzenie company i rekordu user po rejestracji
-- Ten trigger zadziała po każdej rejestracji nowego użytkownika

-- 1. Funkcja która tworzy company i user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_uuid UUID;
  company_name TEXT;
BEGIN
  -- Utwórz nazwę firmy bazując na emailu użytkownika
  -- np. "jan@kowalski.pl" -> "Firma Jan"
  company_name := 'Firma ' || SPLIT_PART(NEW.email, '@', 1);
  
  -- Utwórz nową firmę (tylko uuid, name, created_at)
  INSERT INTO public.companies (uuid, name, created_at)
  VALUES (gen_random_uuid(), company_name, NOW())
  RETURNING uuid INTO new_company_uuid;
  
  -- Utwórz rekord użytkownika powiązany z firmą (tylko uuid, company_uuid, created_at)
  INSERT INTO public.users (uuid, company_uuid, created_at)
  VALUES (NEW.id, new_company_uuid, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger który wywoła funkcję po utworzeniu nowego użytkownika
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Napraw istniejących użytkowników bez company
-- (dla użytkowników którzy zarejestrowali się przed dodaniem triggera)

DO $$
DECLARE
  user_record RECORD;
  new_company_uuid UUID;
  company_name TEXT;
BEGIN
  FOR user_record IN 
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN public.users u ON u.uuid = au.id
    WHERE u.uuid IS NULL
  LOOP
    -- Utwórz nazwę firmy
    company_name := 'Firma ' || SPLIT_PART(user_record.email, '@', 1);
    
    -- Utwórz firmę
    INSERT INTO public.companies (uuid, name, created_at)
    VALUES (gen_random_uuid(), company_name, NOW())
    RETURNING uuid INTO new_company_uuid;
    
    -- Utwórz rekord użytkownika
    INSERT INTO public.users (uuid, company_uuid, created_at)
    VALUES (user_record.id, new_company_uuid, NOW());
    
    RAISE NOTICE 'Created company and user for: %', user_record.email;
  END LOOP;
END $$;

-- 4. Weryfikacja - sprawdź czy wszyscy użytkownicy mają company
SELECT 
  au.email,
  u.uuid AS user_uuid,
  u.company_uuid,
  c.name AS company_name
FROM auth.users au
LEFT JOIN public.users u ON u.uuid = au.id
LEFT JOIN public.companies c ON c.uuid = u.company_uuid
ORDER BY au.created_at DESC
LIMIT 20;

