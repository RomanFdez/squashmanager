-- RESTAURAR SEGURIDAD ESTRICTA

-- 1. Limpiar cualquier política temporal
DROP POLICY IF EXISTS "Public View" ON storage.objects;
DROP POLICY IF EXISTS "Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert (Public Role Wrapper)" ON storage.objects;

-- 2. Definir políticas seguras

-- VER: Público (para que se vean en la web)
CREATE POLICY "Public View"
ON storage.objects FOR SELECT
USING ( bucket_id = 'member-photos' );

-- SUBIR: Solo usuarios autenticados
CREATE POLICY "Authenticated Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'member-photos' );

-- MODIFICAR: Solo usuarios autenticados
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'member-photos' );
