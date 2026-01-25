-- CORRECCIÓN: AÑADIR COLUMNAS OBLIGATORIAS QUE FALTAN
-- Ejecuta esto en el SQL Editor para corregir la tabla members

ALTER TABLE public.members 
ADD COLUMN email text,
ADD COLUMN password text;

-- Si ya tienes datos y quieres evitar problemas de nulos en el futuro:
-- ALERT TABLE public.members ALTER COLUMN email SET DEFAULT '';
