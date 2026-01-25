-- Borrar políticas previas
DROP POLICY IF EXISTS "Public View" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- 1. VER: Público
CREATE POLICY "Public View"
ON storage.objects FOR SELECT
USING ( bucket_id = 'member-photos' );

-- 2. INSERTAR: Usuarios logueados (comprobación explícita de auth.uid())
-- Esta versión comprueba que el usuario tenga un ID (esté logueado)
CREATE POLICY "Authenticated Insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'member-photos' 
  AND auth.role() = 'authenticated'
);

-- 3. ACTUALIZAR: Usuarios logueados
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'member-photos' 
  AND auth.role() = 'authenticated'
);

-- 4. BORRAR: Usuarios logueados
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'member-photos' 
  AND auth.role() = 'authenticated'
);
