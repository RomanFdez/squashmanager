-- ============================================================
-- SQUASH MANAGER - SUPABASE DATABASE SCHEMA
-- ============================================================
-- Este archivo documenta el esquema completo de la base de datos.
-- Incluye: tablas, políticas RLS, funciones y configuración de storage.
-- ============================================================

-- ============================================================
-- 1. TABLAS PRINCIPALES
-- ============================================================

-- TABLA DE CLUBES (Multi-tenant)
CREATE TABLE public.clubs (
  id TEXT PRIMARY KEY,                    -- ej: 'cdsciudadmurcia'
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}'::JSONB,       -- colores, logo, etc
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TABLA DE SOCIOS
CREATE TABLE public.members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id TEXT REFERENCES public.clubs(id) NOT NULL,
  member_number TEXT NOT NULL,
  name TEXT NOT NULL,
  dni TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  birth_date DATE,
  role TEXT DEFAULT 'Socio',              -- Presidente, Secretario, Tesorero, Vocal, Socio
  type TEXT DEFAULT 'adult',              -- adult, junior
  status TEXT DEFAULT 'active',           -- active, inactive
  is_paid BOOLEAN DEFAULT FALSE,
  photo_url TEXT,
  leave_date DATE,
  license_regional BOOLEAN DEFAULT FALSE,
  license_national BOOLEAN DEFAULT FALSE,
  is_school_enrolled BOOLEAN DEFAULT FALSE,
  guardian_name TEXT,
  guardian_dni TEXT,
  guardian_phone TEXT,
  guardian_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TABLA DE TESORERÍA
CREATE TABLE public.treasury (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id TEXT REFERENCES public.clubs(id) NOT NULL,
  type TEXT NOT NULL,                     -- income, expense
  concept TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  recurring BOOLEAN DEFAULT FALSE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TABLA DE AUDITORÍA
CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id TEXT REFERENCES public.clubs(id) NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 2. FUNCIÓN AUXILIAR PARA VERIFICAR ADMIN
-- ============================================================
-- Usa SECURITY DEFINER para evitar recursión RLS

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Super Admin Hardcoded
  IF (auth.jwt() ->> 'email' = 'admin@squashciudadmurcia.com') THEN
    RETURN TRUE;
  END IF;

  -- Verificar rol en la tabla members
  IF EXISTS (
    SELECT 1 FROM public.members 
    WHERE email = (auth.jwt() ->> 'email')
    AND role IN ('Presidente', 'Secretario', 'Tesorero')
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. POLÍTICAS RLS (Row Level Security)
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- CLUBS
CREATE POLICY "Public Read Clubs" ON clubs
FOR SELECT USING (true);

CREATE POLICY "Admin All Clubs" ON clubs
FOR ALL TO authenticated
USING (public.is_admin());

-- MEMBERS
CREATE POLICY "Public Read Members" ON members
FOR SELECT TO public USING (true);

CREATE POLICY "Admin Full Access Members" ON members
FOR ALL TO authenticated
USING (public.is_admin());

-- TREASURY
CREATE POLICY "Admin All Treasury" ON treasury
FOR ALL TO authenticated
USING (
  public.is_admin() 
  OR 
  EXISTS (SELECT 1 FROM members WHERE email = (auth.jwt() ->> 'email') AND role = 'Vocal')
);

-- AUDIT LOGS
CREATE POLICY "Public Insert Logs" ON audit_logs
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin Read Logs" ON audit_logs
FOR SELECT TO authenticated
USING (public.is_admin());

-- ============================================================
-- 4. STORAGE (member-photos bucket)
-- ============================================================

-- Crear bucket público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage
CREATE POLICY "Public Read Photos" ON storage.objects
FOR SELECT
USING (bucket_id = 'member-photos');

CREATE POLICY "Admin Manage Photos" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'member-photos' AND public.is_admin())
WITH CHECK (bucket_id = 'member-photos' AND public.is_admin());

-- ============================================================
-- 5. DATOS INICIALES
-- ============================================================

INSERT INTO public.clubs (id, name, config)
VALUES ('cdsciudadmurcia', 'Squash Ciudad de Murcia', 
        '{"primaryColor": "#931c1f", "accentColor": "#fbbf24"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
