-- Borrar las políticas "demasiado permisivas" anteriores
DROP POLICY IF EXISTS "Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- 1. VER: Todo el mundo (público)
CREATE POLICY "Public View"
ON storage.objects FOR SELECT
USING ( bucket_id = 'member-photos' );

-- 2. SUBIR: Solo autenticados
-- Usamos (auth.role() = 'authenticated') para ser explícitos
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'member-photos' );

-- 3. EDITAR: Solo autenticados
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'member-photos' );

-- 4. BORRAR: Solo autenticados
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'member-photos' );
