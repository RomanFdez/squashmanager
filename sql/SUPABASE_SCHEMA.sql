-- TABLA DE CLUBES (TENANTS) -> Para SaaS
create table public.clubs (
  id text primary key, -- ej: 'cdsciudadmurcia'
  name text not null,
  config jsonb default '{}'::jsonb, -- colores, logo, etc
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA DE SOCIOS
create table public.members (
  id uuid default uuid_generate_v4() primary key,
  club_id text references public.clubs(id) not null, -- CLAVE SEPARACIÓN DATOS
  member_number text not null,
  name text not null,
  dni text,
  role text default 'Socio',
  type text default 'adult', -- adult, junior
  status text default 'active', -- active, inactive
  is_paid boolean default false,
  photo_url text,
  leave_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA DE TESORERÍA
create table public.treasury (
  id uuid default uuid_generate_v4() primary key,
  club_id text references public.clubs(id) not null,
  type text not null, -- income, expense
  concept text not null,
  amount numeric(10,2) not null,
  date date not null,
  recurring boolean default false,
  category text, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA DE AUDITORÍA
create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  club_id text references public.clubs(id) not null,
  user_name text not null, -- Quién hizo la acción
  action text not null,
  details text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- Esto asegura que, aunque la app falle, la base de datos proteja los datos entre clubes.
-- Por ahora lo dejaremos "abierto" para facilitar el desarrollo, pero en producción se activa.

-- ACTIVAR RLS
alter table public.clubs enable row level security;
alter table public.members enable row level security;
alter table public.treasury enable row level security;
alter table public.audit_logs enable row level security;

-- CREAR CLUB DEMO
insert into public.clubs (id, name, config)
values ('cdsciudadmurcia', 'Squash Ciudad de Murcia', '{"primaryColor": "#931c1f", "accentColor": "#fbbf24"}'::jsonb);
