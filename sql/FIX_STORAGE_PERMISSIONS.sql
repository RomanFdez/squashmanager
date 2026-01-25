-- Asegurar que el bucket existe y es público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- BORRAR POLÍTICAS ANTIGUAS para evitar conflictos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;

-- CREAR POLÍTICAS PERMISIVAS (Temporales para descartar error de permisos)

-- 1. Permitir VER a TODO EL MUNDO (necesario para cargar la imagen en el formulario)
CREATE POLICY "Public Select"
ON storage.objects FOR SELECT
USING ( bucket_id = 'member-photos' );

-- 2. Permitir SUBIR a TODO EL MUNDO (temporalmente para ver si es problema de auth)
CREATE POLICY "Public Insert"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'member-photos' );

-- 3. Permitir ACTUALIZAR a TODO EL MUNDO
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'member-photos' );

-- 4. Permitir BORRAR a TODO EL MUNDO (opcional, por si acaso)
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'member-photos' );
