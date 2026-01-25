# Squash Manager - CDS Ciudad de Murcia

Sistema de gestión de socios y tesorería para clubs de squash.

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + Vite 7
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Cloudflare Pages
- **Analytics**: PostHog

## 📋 Características

- ✅ Gestión completa de socios (altas, bajas, edición)
- ✅ Control de roles (Admin, Presidente, Secretario, Tesorero, Vocal, Socio)
- ✅ Tesorería con ingresos/gastos y categorías
- ✅ Carnet digital con foto y QR
- ✅ Exportación a CSV
- ✅ Diseño responsive
- ✅ Multi-club ready (arquitectura multi-tenant)

## 🚀 Desarrollo Local

```bash
# Clonar e instalar
git clone https://github.com/RomanFdez/squashmanager.git
cd squashmanager
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Supabase

# Iniciar servidor de desarrollo
npm run dev
```

## 📁 Estructura

```
├── src/
│   ├── components/     # Componentes React
│   ├── pages/          # Páginas de la app
│   ├── services/       # Servicios Supabase
│   ├── context/        # Auth, Theme, Club providers
│   ├── hooks/          # Custom hooks
│   └── lib/            # Cliente Supabase
├── sql/SCHEMA.sql      # Esquema completo de BD
├── public/             # Assets estáticos
└── wrangler.json       # Config Cloudflare
```

## 🔐 Variables de Entorno

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📄 Licencia

[LICENSE](./LICENSE)
