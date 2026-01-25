-- FIX_RLS_LOOP.sql
-- Solución definitiva usando SECURITY DEFINER para evitar recursión RLS

-- 1. Crear función segura para verificar admin
-- SECURITY DEFINER significa que se ejecuta con permisos de superusuario,
-- saltándose las políticas RLS de la tabla members para poder leerla.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Super Admin Hardcoded
  IF (auth.jwt() ->> 'email' = 'admin@squashciudadmurcia.com') THEN
    RETURN TRUE;
  END IF;

  -- 2. Verificar rol en la tabla members
  -- Al ser SECURITY DEFINER, esto funcionará aunque el usuario no tenga permiso de lectura aún.
  IF EXISTS (
    SELECT 1 FROM public.members 
    WHERE email = (auth.jwt() ->> 'email')
    AND role IN ('Presidente', 'Secretario', 'Tesorero')
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Limpiar políticas de nuevo
DROP POLICY IF EXISTS "Public Read Clubs" ON clubs;
DROP POLICY IF EXISTS "Admin All Clubs" ON clubs;
DROP POLICY IF EXISTS "Public Read Members" ON members;
DROP POLICY IF EXISTS "Admin Full Access Members" ON members;
DROP POLICY IF EXISTS "Admin All Treasury" ON treasury;
DROP POLICY IF EXISTS "Public Insert Logs" ON audit_logs;
DROP POLICY IF EXISTS "Admin Read Logs" ON audit_logs;


-- 3. Recrear políticas usando la función segura

-- MEMBERS
CREATE POLICY "Public Read Members" ON members
FOR SELECT TO public USING (true);

CREATE POLICY "Admin Full Access Members" ON members
FOR ALL TO authenticated
USING (public.is_admin());

-- CLUBS
CREATE POLICY "Public Read Clubs" ON clubs
FOR SELECT USING (true);

CREATE POLICY "Admin All Clubs" ON clubs
FOR ALL TO authenticated
USING (public.is_admin());

-- TREASURY
-- Aquí quizás quieras incluir 'Vocal', así que hacemos otra función o lógica inline simple
-- como la tesorería no se consulta recursivamente para permisos, la inline safe.
-- Pero mejor consistencia: usaremos la misma función base y añadiremos vocal inline si hace falta.
CREATE POLICY "Admin All Treasury" ON treasury
FOR ALL TO authenticated
USING (
  public.is_admin() 
  OR 
  EXISTS (SELECT 1 FROM members WHERE email = (auth.jwt() ->> 'email') AND role = 'Vocal')
);

-- AUDIT LOGS
CREATE POLICY "Public Insert Logs" ON audit_logs
FOR INSERT WITH CHECK (true); 

CREATE POLICY "Admin Read Logs" ON audit_logs
FOR SELECT TO authenticated
USING (public.is_admin());
