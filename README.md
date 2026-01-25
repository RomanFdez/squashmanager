# Squash Manager - CDS Ciudad de Murcia

Sistema de gestión de socios y tesorería para clubs de squash.

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + Vite 7
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Cloudflare Pages
- **Analytics**: PostHog
- **Icons**: Lucide React

## 📋 Características

- ✅ Gestión completa de socios (altas, bajas, edición)
- ✅ Control de roles (Admin, Presidente, Secretario, Tesorero, Vocal, Socio)
- ✅ Tesorería con ingresos/gastos y categorías
- ✅ Carnet digital con foto y QR
- ✅ Exportación a CSV
- ✅ Diseño responsive
- ✅ Multi-club ready (arquitectura multi-tenant)

## 🚀 Desarrollo Local

1. Clona el repositorio:
```bash
git clone https://github.com/RomanFdez/squashmanager.git
cd squashmanager
```

2. Instala dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
# Edita .env con tus credenciales de Supabase
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## 📁 Estructura del Proyecto

```
├── src/
│   ├── components/     # Componentes React reutilizables
│   ├── pages/          # Páginas de la aplicación
│   ├── services/       # Servicios para Supabase
│   ├── context/        # Context providers (Auth, Theme, Club)
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Cliente de Supabase
│   └── utils/          # Utilidades
├── sql/                # Scripts SQL para Supabase
├── scripts/            # Scripts de migración y diagnóstico
├── public/             # Assets estáticos
└── wrangler.json       # Configuración Cloudflare Pages
```

## 🔐 Variables de Entorno

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📖 Documentación Adicional

- [ROADMAP.md](./ROADMAP.md) - Funcionalidades planificadas
- [sql/SUPABASE_SCHEMA.sql](./sql/SUPABASE_SCHEMA.sql) - Esquema de base de datos

## 📄 Licencia

Este proyecto está bajo la licencia incluida en [LICENSE](./LICENSE).
