-- Eliminar la columna password para evitar confusion y riesgo
-- Ya que ahora la autenticacion se gestiona via Supabase Auth

ALTER TABLE public.members DROP COLUMN password;
