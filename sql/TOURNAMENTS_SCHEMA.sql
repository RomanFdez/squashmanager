-- ============================================================
-- SQUASH MANAGER - TOURNAMENTS MODULE SCHEMA
-- ============================================================
-- Este archivo documenta el esquema para el módulo de torneos.
-- Incluye: tablas, políticas RLS y configuración de storage.
-- ============================================================

-- ============================================================
-- 1. TABLAS PRINCIPALES DE TORNEOS
-- ============================================================

-- TABLA DE TORNEOS
CREATE TABLE public.tournaments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id TEXT REFERENCES public.clubs(id) NOT NULL,
  
  -- Información básica
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_deadline DATE NOT NULL,
  location TEXT NOT NULL,
  price NUMERIC(10,2) DEFAULT 0,
  
  -- Configuración de pago (array de opciones)
  payment_types TEXT[] DEFAULT ARRAY['efectivo']::TEXT[], -- efectivo, tarjeta, transferencia
  
  -- Configuración de partidos
  match_format TEXT DEFAULT 'best_of_3' CHECK (match_format IN ('best_of_3', 'best_of_5')),
  
  -- Estado del torneo
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'in_progress', 'finished', 'cancelled')),
  
  -- Publicación
  is_public BOOLEAN DEFAULT FALSE,
  public_slug TEXT UNIQUE, -- URL amigable para acceso público
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TABLA DE PISTAS DEL TORNEO
CREATE TABLE public.tournament_courts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  order_num INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TABLA DE IMÁGENES DEL CLUB (compartidas entre torneos)
CREATE TABLE public.club_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id TEXT REFERENCES public.clubs(id) NOT NULL,
  image_url TEXT NOT NULL,
  name TEXT, -- Nombre descriptivo opcional
  type TEXT DEFAULT 'general' CHECK (type IN ('poster', 'club_logo', 'sponsor', 'general')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TABLA DE IMÁGENES ASIGNADAS A TORNEOS
CREATE TABLE public.tournament_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  club_image_id UUID REFERENCES public.club_images(id) ON DELETE CASCADE NOT NULL,
  slot_number INTEGER NOT NULL CHECK (slot_number >= 1 AND slot_number <= 12),
  -- slot 1 = cartel, slot 2 = logo club, slots 3-12 = sponsors
  UNIQUE(tournament_id, slot_number),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TABLA DE CATEGORÍAS DEL TORNEO
CREATE TABLE public.tournament_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('masculina', 'femenina', 'mixta')),
  age_group TEXT DEFAULT 'todos' CHECK (age_group IN (
    'todos', 'sub7', 'sub9', 'sub11', 'sub13', 'sub15', 'sub18'
  )),
  max_participants INTEGER,
  
  -- Configuración de fase de grupos (opcional)
  has_group_phase BOOLEAN DEFAULT FALSE,
  players_per_group INTEGER DEFAULT 4, -- Jugadores por grupo
  advance_to_main INTEGER DEFAULT 1, -- Cuántos pasan al cuadro principal
  advance_to_consolation INTEGER DEFAULT 0, -- Cuántos pasan a consolación
  -- El resto quedan eliminados
  
  order_num INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TABLA DE JUGADORES EXTERNOS (no socios del club)
CREATE TABLE public.external_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id TEXT REFERENCES public.clubs(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TABLA DE INSCRIPCIONES A CATEGORÍAS
CREATE TABLE public.tournament_registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES public.tournament_categories(id) ON DELETE CASCADE NOT NULL,
  
  -- Un jugador puede ser socio del club o externo
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  external_player_id UUID REFERENCES public.external_players(id) ON DELETE SET NULL,
  
  -- Datos de contacto proporcionados en la inscripción
  registration_name TEXT NOT NULL,
  registration_email TEXT,
  registration_phone TEXT,
  
  -- Seed/cabeza de serie (opcional)
  seed INTEGER,
  
  -- Estado de pago
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('efectivo', 'tarjeta', 'transferencia')),
  
  -- Inscripción auto-gestionada o por admin
  is_self_registered BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Un miembro solo puede inscribirse una vez por categoría
  UNIQUE(category_id, member_id),
  UNIQUE(category_id, external_player_id),
  
  -- Debe tener o member_id o external_player_id
  CHECK (member_id IS NOT NULL OR external_player_id IS NOT NULL)
);

-- TABLA DE GRUPOS (para fase de grupos)
CREATE TABLE public.tournament_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES public.tournament_categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- "Grupo A", "Grupo B", etc.
  order_num INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ASIGNACIÓN DE JUGADORES A GRUPOS
CREATE TABLE public.tournament_group_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.tournament_groups(id) ON DELETE CASCADE NOT NULL,
  registration_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE NOT NULL,
  position INTEGER DEFAULT 0, -- Posición final en el grupo
  points INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  sets_won INTEGER DEFAULT 0,
  sets_lost INTEGER DEFAULT 0,
  UNIQUE(group_id, registration_id)
);

-- TABLA DE BRACKETS/CUADROS
CREATE TABLE public.tournament_brackets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES public.tournament_categories(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de cuadro
  bracket_type TEXT NOT NULL CHECK (bracket_type IN (
    'main', -- Cuadro principal
    'consolation_1', -- Primera consolación
    'consolation_2', -- Segunda consolación
    'consolation_3', -- etc.
    'consolation_4',
    'consolation_5'
  )),
  
  -- Nivel de consolación (0 = principal, 1 = primera consolación, etc.)
  consolation_level INTEGER DEFAULT 0,
  
  name TEXT NOT NULL, -- "Cuadro Principal", "Consolación 1", etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(category_id, bracket_type)
);

-- TABLA DE PARTIDOS
CREATE TABLE public.tournament_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bracket_id UUID REFERENCES public.tournament_brackets(id) ON DELETE CASCADE NOT NULL,
  
  -- Posición en el bracket
  round INTEGER NOT NULL, -- 1 = final, 2 = semifinal, 4 = cuartos, 8 = octavos, etc.
  position INTEGER NOT NULL, -- Posición dentro de la ronda (1, 2, 3, 4...)
  
  -- Jugadores (por registration_id)
  player1_id UUID REFERENCES public.tournament_registrations(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES public.tournament_registrations(id) ON DELETE SET NULL,
  
  -- BYE: si uno de los jugadores es NULL y el otro no, es un BYE
  
  -- Resultado
  winner_id UUID REFERENCES public.tournament_registrations(id) ON DELETE SET NULL,
  
  -- Marcador detallado (JSON array de sets)
  -- Ejemplo: [{"p1": 11, "p2": 5}, {"p1": 11, "p2": 7}, {"p1": 9, "p2": 11}, {"p1": 11, "p2": 8}]
  score JSONB,
  
  -- Resumen del marcador (ej: "3-1")
  score_summary TEXT,
  
  -- Programación
  scheduled_time TIMESTAMPTZ,
  court_id UUID REFERENCES public.tournament_courts(id) ON DELETE SET NULL,
  
  -- Estado del partido
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'walkover')),
  
  -- Partido del que vienen (para navegación del bracket)
  source_match_1_id UUID REFERENCES public.tournament_matches(id) ON DELETE SET NULL,
  source_match_2_id UUID REFERENCES public.tournament_matches(id) ON DELETE SET NULL,
  
  -- Partido destino del ganador
  winner_next_match_id UUID REFERENCES public.tournament_matches(id) ON DELETE SET NULL,
  winner_next_position INTEGER CHECK (winner_next_position IN (1, 2)), -- ¿player1 o player2 del siguiente?
  
  -- Partido destino del perdedor (consolación)
  loser_next_match_id UUID REFERENCES public.tournament_matches(id) ON DELETE SET NULL,
  loser_next_position INTEGER CHECK (loser_next_position IN (1, 2)),
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(bracket_id, round, position)
);

-- TABLA DE PARTIDOS DE GRUPOS (round-robin)
CREATE TABLE public.tournament_group_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.tournament_groups(id) ON DELETE CASCADE NOT NULL,
  
  player1_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE NOT NULL,
  player2_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE NOT NULL,
  
  winner_id UUID REFERENCES public.tournament_registrations(id) ON DELETE SET NULL,
  score JSONB,
  score_summary TEXT,
  
  scheduled_time TIMESTAMPTZ,
  court_id UUID REFERENCES public.tournament_courts(id) ON DELETE SET NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'walkover')),
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 2. ÍNDICES PARA RENDIMIENTO
-- ============================================================

CREATE INDEX idx_tournaments_club ON tournaments(club_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_slug ON tournaments(public_slug);
CREATE INDEX idx_tournament_categories_tournament ON tournament_categories(tournament_id);
CREATE INDEX idx_tournament_registrations_category ON tournament_registrations(category_id);
CREATE INDEX idx_tournament_registrations_member ON tournament_registrations(member_id);
CREATE INDEX idx_tournament_matches_bracket ON tournament_matches(bracket_id);
CREATE INDEX idx_tournament_matches_status ON tournament_matches(status);

-- ============================================================
-- 3. POLÍTICAS RLS (Row Level Security)
-- ============================================================

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_group_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_group_matches ENABLE ROW LEVEL SECURITY;

-- TORNEOS - Lectura pública para torneos públicos, admin para todo
-- TORNEOS - Lectura pública para cualquier torneo (si se tiene el enlace/slug)
DROP POLICY IF EXISTS "Public Read Public Tournaments" ON tournaments;
CREATE POLICY "Public Read All Tournaments" ON tournaments
FOR SELECT USING (true);

CREATE POLICY "Admin All Tournaments" ON tournaments
FOR ALL TO authenticated USING (public.is_admin());

-- PISTAS - Admin only
-- PISTAS - Admin gestiona, público lee
CREATE POLICY "Public Read Courts" ON tournament_courts
FOR SELECT USING (true);

CREATE POLICY "Admin All Courts" ON tournament_courts
FOR ALL TO authenticated USING (
  public.is_admin()
);

-- IMÁGENES DEL CLUB - Admin para gestión, lectura pública
CREATE POLICY "Public Read Club Images" ON club_images
FOR SELECT USING (true);

CREATE POLICY "Admin Manage Club Images" ON club_images
FOR ALL TO authenticated USING (public.is_admin());

-- IMÁGENES DE TORNEOS - Admin y lectura pública
CREATE POLICY "Public Read Tournament Images" ON tournament_images
FOR SELECT USING (true);

CREATE POLICY "Admin Manage Tournament Images" ON tournament_images
FOR ALL TO authenticated USING (public.is_admin());

-- CATEGORÍAS - Lectura pública, admin para gestión
-- CATEGORÍAS - Lectura pública universal
DROP POLICY IF EXISTS "Public Read Categories" ON tournament_categories;
CREATE POLICY "Public Read Categories" ON tournament_categories
FOR SELECT USING (true);

CREATE POLICY "Admin Manage Categories" ON tournament_categories
FOR ALL TO authenticated USING (public.is_admin());

-- JUGADORES EXTERNOS - Admin only
CREATE POLICY "Admin All External Players" ON external_players
FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Public Read External Players" ON external_players
FOR SELECT USING (true);

CREATE POLICY "Public Insert External Players" ON external_players
FOR INSERT WITH CHECK (true);

-- INSCRIPCIONES - Lectura pública, gestión admin + auto-inscripción
CREATE POLICY "Public Read Registrations" ON tournament_registrations
FOR SELECT USING (true);

CREATE POLICY "Admin Manage Registrations" ON tournament_registrations
FOR ALL TO authenticated USING (public.is_admin());

-- Permitir auto-inscripción pública cuando el torneo está abierto
CREATE POLICY "Self Registration" ON tournament_registrations
FOR INSERT WITH CHECK (
  is_self_registered = TRUE AND
  EXISTS (
    SELECT 1 FROM tournament_categories tc
    JOIN tournaments t ON t.id = tc.tournament_id
    WHERE tc.id = category_id 
    AND t.status = 'open'
    AND t.registration_deadline >= CURRENT_DATE
  )
);

-- GRUPOS - Lectura pública, admin para gestión
CREATE POLICY "Public Read Groups" ON tournament_groups
FOR SELECT USING (true);

CREATE POLICY "Admin Manage Groups" ON tournament_groups
FOR ALL TO authenticated USING (public.is_admin());

-- JUGADORES EN GRUPOS - Igual que grupos
CREATE POLICY "Public Read Group Players" ON tournament_group_players
FOR SELECT USING (true);

CREATE POLICY "Admin Manage Group Players" ON tournament_group_players
FOR ALL TO authenticated USING (public.is_admin());

-- BRACKETS - Lectura pública
CREATE POLICY "Public Read Brackets" ON tournament_brackets
FOR SELECT USING (true);

CREATE POLICY "Admin Manage Brackets" ON tournament_brackets
FOR ALL TO authenticated USING (public.is_admin());

-- PARTIDOS - Lectura pública, admin para gestión
CREATE POLICY "Public Read Matches" ON tournament_matches
FOR SELECT USING (true);

CREATE POLICY "Admin Manage Matches" ON tournament_matches
FOR ALL TO authenticated USING (public.is_admin());

-- PARTIDOS DE GRUPO - Igual
CREATE POLICY "Public Read Group Matches" ON tournament_group_matches
FOR SELECT USING (true);

CREATE POLICY "Admin Manage Group Matches" ON tournament_group_matches
FOR ALL TO authenticated USING (public.is_admin());

-- ============================================================
-- 4. STORAGE BUCKET PARA IMÁGENES DE TORNEOS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('tournament-images', 'tournament-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public Read Tournament Photos" ON storage.objects
FOR SELECT
USING (bucket_id = 'tournament-images');

CREATE POLICY "Admin Manage Tournament Photos" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'tournament-images' AND public.is_admin())
WITH CHECK (bucket_id = 'tournament-images' AND public.is_admin());

-- ============================================================
-- 5. FUNCIONES AUXILIARES
-- ============================================================

-- Función para calcular el número de rondas necesarias
CREATE OR REPLACE FUNCTION public.calculate_bracket_rounds(num_players INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF num_players <= 1 THEN
    RETURN 0;
  END IF;
  RETURN CEIL(LOG(2, num_players::NUMERIC))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para calcular el tamaño del bracket (potencia de 2)
CREATE OR REPLACE FUNCTION public.calculate_bracket_size(num_players INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF num_players <= 1 THEN
    RETURN 1;
  END IF;
  RETURN POWER(2, CEIL(LOG(2, num_players::NUMERIC)))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_tournament_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tournament_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_timestamp();

CREATE TRIGGER match_updated_at
  BEFORE UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_timestamp();

CREATE TRIGGER group_match_updated_at
  BEFORE UPDATE ON tournament_group_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_timestamp();
