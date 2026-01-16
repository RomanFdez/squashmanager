-- PASO FINAL: AÑADIR TODAS LAS COLUMNAS RESTANTES
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS license_regional boolean default false,
ADD COLUMN IF NOT EXISTS license_national boolean default false,
ADD COLUMN IF NOT EXISTS is_school_enrolled boolean default false,
ADD COLUMN IF NOT EXISTS guardian_name text,
ADD COLUMN IF NOT EXISTS guardian_dni text,
ADD COLUMN IF NOT EXISTS guardian_phone text,
ADD COLUMN IF NOT EXISTS guardian_email text;
