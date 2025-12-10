-- Quick SQL script to create a test driver if none exists

-- Check if there are any active drivers
SELECT 
  uuid, 
  name, 
  email, 
  is_active,
  company_uuid
FROM drivers 
WHERE is_active = true
LIMIT 5;

-- If no drivers exist, create a test driver:
-- First, get a company UUID
-- SELECT uuid FROM companies LIMIT 1;

-- Then insert test driver (replace YOUR_COMPANY_UUID with actual value):
/*
INSERT INTO drivers (
  company_uuid, 
  name, 
  email, 
  timezone,
  is_active
) VALUES (
  'YOUR_COMPANY_UUID',  -- Replace with actual company UUID
  'Jan Testowy',
  'jan.testowy@example.com',
  'Europe/Warsaw',
  true
) RETURNING uuid, name, email;
*/



