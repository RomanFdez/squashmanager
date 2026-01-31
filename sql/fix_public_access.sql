-- ============================================================
-- SQL DE CORRECCIÓN PARA ACCESO PÚBLICO
-- ============================================================
-- Ejecuta este script en el editor SQL de Supabase para arreglar
-- los permisos de visualización pública y registro externo.

-- 1. TORNEOS: Permitir lectura pública universal (eliminar restricción de is_public)
DROP POLICY IF EXISTS "Public Read Public Tournaments" ON tournaments;
CREATE POLICY "Public Read All Tournaments" ON tournaments FOR SELECT USING (true);

-- 2. CATEGORÍAS: Permitir lectura pública universal
DROP POLICY IF EXISTS "Public Read Categories" ON tournament_categories;
CREATE POLICY "Public Read All Categories" ON tournament_categories FOR SELECT USING (true);

-- 3. PISTAS: Permitir lectura pública (faltaba por completo)
DROP POLICY IF EXISTS "Public Read Courts" ON tournament_courts;
CREATE POLICY "Public Read Courts" ON tournament_courts FOR SELECT USING (true);

-- 4. JUGADORES EXTERNOS: Permitir creación pública (necesario para inscribirse sin cuenta)
DROP POLICY IF EXISTS "Public Insert External Players" ON external_players;
CREATE POLICY "Public Insert External Players" ON external_players FOR INSERT WITH CHECK (true);
