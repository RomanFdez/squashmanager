-- FIX_STORAGE_FINAL.sql
-- Asegurar que las fotos de los socios se vean públicamente

-- 1. Permitir acceso público al bucket 'member-photos'
-- (Esto asume que el bucket ya existe y es público, pero forzamos las policies)

-- Borrar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Public Access Photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Photos" ON storage.objects;

-- Nueva Política: TODO EL MUNDO puede ver fotos en 'member-photos'
CREATE POLICY "Public Read Photos" ON storage.objects
FOR SELECT
USING ( bucket_id = 'member-photos' );

-- Nueva Política: Solo Admin puede subir/borrar
-- Reutilizamos la función is_admin() que creamos antes para consistencia
CREATE POLICY "Admin Manage Photos" ON storage.objects
FOR ALL
TO authenticated
USING ( bucket_id = 'member-photos' AND public.is_admin() )
WITH CHECK ( bucket_id = 'member-photos' AND public.is_admin() );
