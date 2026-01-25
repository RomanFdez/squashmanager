-- ASEGURAR QUE EL CLUB EXISTE
-- Si ya existe no hará nada, si no existe lo crea.

INSERT INTO public.clubs (id, name, config)
VALUES ('cdsciudadmurcia', 'Squash Ciudad de Murcia', '{"primaryColor": "#931c1f", "accentColor": "#fbbf24"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ASEGURAR QUE LAS COLUMNAS EXISTEN (Por si acaso, repetimos)
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS password text;
