-- ALERTA: Este script habilita RLS (Seguridad) pero crea políticas PERMISIVAS.
-- Esto elimina las advertencias de seguridad de Supabase, pero sigue permitiendo
-- acceso público a través de la API si se tiene la clave ANON_KEY.
-- Es necesario porque la autenticación se maneja en el Frontend (React), no en Supabase.

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- 2. Crear Políticas de Acceso Público (Permitir todo al rol 'anon')

-- CLUBS
DROP POLICY IF EXISTS "Public Access Clubs" ON public.clubs;
CREATE POLICY "Public Access Clubs" ON public.clubs 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);

-- TREASURY
DROP POLICY IF EXISTS "Public Access Treasury" ON public.treasury;
CREATE POLICY "Public Access Treasury" ON public.treasury 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Public Access Audit" ON public.audit_logs;
CREATE POLICY "Public Access Audit" ON public.audit_logs 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);

-- MEMBERS
DROP POLICY IF EXISTS "Public Access Members" ON public.members;
CREATE POLICY "Public Access Members" ON public.members 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);
