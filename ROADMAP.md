# Roadmap de Desarrollo - Squash Ciudad de Murcia

Este documento sirve como guía para las futuras funcionalidades y mejoras de la aplicación.

## 🚀 Próximas Funcionalidades (Propuestas)

### Alta Prioridad (Engagement)
- [ ] **Sistema de Ligas / Rankings:** Gestión de grupos, introducción de resultados por parte de los socios y clasificación automática.
- [ ] **Reservas de Pistas:** Calendario interactivo para ver disponibilidad y reservar pistas. Posibilidad de cancelación y reglas de reserva.

### Comunicación y Utilidad
- [ ] **Tablón de Anuncios:** Sección de noticias para comunicados oficiales (torneos, mantenimiento, actas).
- [ ] **Buscador de Compañero:** Tablón donde los socios pueden buscar rivales por nivel y horario.

### Gestión Avanzada
- [ ] **Control de Accesos (QR):** Utilizar el Carnet Digital para registrar entradas al club mediante escaneo de QR.
- [ ] **Gestión Documental:** Repositorio para subir Estatutos, Normativas y Actas accesibles a los socios.
- [ ] **Soporte Multi-club:** (Ya contemplado en arquitectura) Preparar la BD para gestionar múltiples clubes desde la misma instancia.

## ✅ Completado
- [x] **Gestión de Socios:** Altas, bajas, edición, roles (Admin/Socio/Junior).
- [x] **Tesorería Básica:** Control de ingresos y gastos, categorías y resumen anual/mensual.
- [x] **Filtrado Tesorería:** Filtros por mes y tipo.
- [x] **Carnet Digital:** Tarjeta virtual con foto, estado de pago y diseño personalizado.
- [x] **Personalización (Branding):** Logo y colores del club configurables y persistentes en todos los dispositivos.
- [x] **Exportación de Datos:** Descarga de listados de socios y movimientos a CSV (Excel compatible).
- [x] **Responsive Design:** Interfaz adaptada a móviles.
- [x] **Iconos Dinámicos:** Favicon e icono de iOS sincronizados con el logo del club.

## 🛠️ Deuda Técnica / Mejoras
- [ ] **Tests Automáticos:** Implementar tests unitarios y de integración (Vitest/Cypress).
- [ ] **Optimización de Imágenes:** Compresión automática de fotos de perfil y logos al subir.
- [ ] **Validación de Emails:** Confirmación de correo electrónico al registrarse.
