-- SECURE_DB_FINAL.sql
-- Establece políticas de seguridad REALES basadas en Supabase Auth y ROLES de socio

-- 1. Habilitar RLS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar TODAS las políticas anteriores
DROP POLICY IF EXISTS "Public Access" ON clubs;
DROP POLICY IF EXISTS "Public Access" ON treasury;
DROP POLICY IF EXISTS "Public Access" ON audit_logs;
DROP POLICY IF EXISTS "Public Access" ON members;
DROP POLICY IF EXISTS "Public Access Clubs" ON clubs;
DROP POLICY IF EXISTS "Public Access Treasury" ON treasury;
DROP POLICY IF EXISTS "Public Access Audit" ON audit_logs;
DROP POLICY IF EXISTS "Public Access Members" ON members;

-- Limpiar políticas definitivas previas
DROP POLICY IF EXISTS "Public Read Clubs" ON clubs;
DROP POLICY IF EXISTS "Admin All Clubs" ON clubs;
DROP POLICY IF EXISTS "Public Read Members" ON members;
DROP POLICY IF EXISTS "Admin Write Members" ON members;
DROP POLICY IF EXISTS "Admin Full Access Members" ON members;
DROP POLICY IF EXISTS "Admin All Treasury" ON treasury;
DROP POLICY IF EXISTS "Public Insert Logs" ON audit_logs;
DROP POLICY IF EXISTS "Admin Read Logs" ON audit_logs;

-- ==========================================================
-- POLÍTICAS PARA CLUBS
-- ==========================================================
CREATE POLICY "Public Read Clubs" ON clubs
FOR SELECT USING (true);

CREATE POLICY "Admin All Clubs" ON clubs
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'admin@squashciudadmurcia.com'
  OR
  (SELECT count(*) FROM members WHERE email = auth.jwt() ->> 'email' AND role IN ('Presidente', 'Secretario', 'Tesorero')) > 0
);

-- ==========================================================
-- POLÍTICAS PARA MEMBERS
-- ==========================================================
-- Todo el mundo puede LEER miembros (evita recursión infinita en la subconsulta de roles)
CREATE POLICY "Public Read Members" ON members
FOR SELECT 
TO public
USING (true);

-- Admin y Directiva pueden EDITAR/CREAR/BORRAR
CREATE POLICY "Admin Full Access Members" ON members
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'admin@squashciudadmurcia.com'
  OR
  (SELECT count(*) FROM members WHERE email = auth.jwt() ->> 'email' AND role IN ('Presidente', 'Secretario', 'Tesorero')) > 0
);

-- ==========================================================
-- POLÍTICAS PARA TREASURY
-- ==========================================================
-- Solo Admin y Directiva pueden ver/tocar dinero
CREATE POLICY "Admin All Treasury" ON treasury
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'admin@squashciudadmurcia.com'
  OR
  (SELECT count(*) FROM members WHERE email = auth.jwt() ->> 'email' AND role IN ('Presidente', 'Secretario', 'Tesorero', 'Vocal')) > 0
);
-- Nota: He añadido 'Vocal' aquí porque en tu código de AuthContext los vocales también pueden ver tesorería.

-- ==========================================================
-- POLÍTICAS PARA AUDIT_LOGS
-- ==========================================================
CREATE POLICY "Public Insert Logs" ON audit_logs
FOR INSERT
WITH CHECK (true); 

CREATE POLICY "Admin Read Logs" ON audit_logs
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'admin@squashciudadmurcia.com'
  OR
  (SELECT count(*) FROM members WHERE email = auth.jwt() ->> 'email' AND role IN ('Presidente', 'Secretario', 'Tesorero')) > 0
);
