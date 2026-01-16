-- PROBLEMA: Activamos la seguridad (RLS) pero no dimos permisos.
-- SOLUCIÓN: Desactivar RLS temporalmente para permitir que la app funcione.

ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- Alternativa (si prefieres mantener RLS activado pero abierto):
-- CREATE POLICY "Public Access" ON public.members FOR ALL USING (true);
