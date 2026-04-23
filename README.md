# Aethel Dashboard

Panel de gestión para peluquerías — Next.js 14 + shadcn/ui + MySQL.

## Stack

- Next.js 14 (App Router, JS sin TypeScript)
- shadcn/ui (Radix + Tailwind)
- MySQL via `mysql2/promise` (prepared statements)
- Auth: JWT httpOnly cookies (sameSite=lax, secure en prod), bcrypt (rounds=12)
- Rate limit de login: 10 intentos/hora/IP, backed por tabla `login_attempts`
- Middleware redirige `/dashboard/*` a `/login` si falta cookie

## Setup local

```bash
cd aethel-dashboard
cp .env.example .env.local   # editar y poner DB_PASSWORD real + JWT_SECRET
npm install

# 1. Asegurar tablas (usuarios + login_attempts + índice horarios)
npm run schema

# 2. Crear usuario demo (mariela@demo.cl / Demo2026$)
npm run seed

# 3. Arrancar
npm run dev
# → http://localhost:3000
```

## Páginas

| Ruta | Función |
|---|---|
| `/login` | Login con email + password (rate-limited) |
| `/dashboard` | Citas de hoy + botón "Nueva cita" + polling 15s + alerta visual al llegar cita del bot |
| `/dashboard/agenda` | Calendario semanal con bloqueos y citas |
| `/dashboard/servicios` | CRUD de servicios (activar/desactivar) |
| `/dashboard/horarios` | Horarios por día + bloqueos manuales |
| `/dashboard/clientes` | Clientes agrupados por teléfono con # de visitas |

## API

| Método | Ruta | Auth |
|---|---|---|
| POST | `/api/auth/login` | pública + rate-limit |
| POST | `/api/auth/logout` | cookie |
| GET/POST | `/api/citas` | cookie |
| PATCH | `/api/citas/[id]` | cookie |
| GET/POST | `/api/servicios` | cookie |
| PATCH | `/api/servicios/[id]` | cookie |
| GET/POST | `/api/horarios` | cookie |
| GET/POST/DELETE | `/api/bloqueos` | cookie |
| GET | `/api/clientes` | cookie |

**Regla de oro**: `negocio_id` siempre viene del JWT, NUNCA del body. Ver `lib/api.js → requireSession()`.

## Seguridad implementada

- ✅ JWT firmado con `JWT_SECRET` (mínimo 32 chars), iss/aud fijos
- ✅ Cookie httpOnly + secure (prod) + sameSite=lax
- ✅ `bcrypt` con salt rounds 12
- ✅ Prepared statements en todas las queries (nunca concatenación)
- ✅ `multipleStatements: false` en el pool MySQL
- ✅ Rate limit 10 intentos fallidos/hora/IP con tabla persistente
- ✅ Validación/sanitización de inputs en `lib/validators.js`
- ✅ Security headers en `next.config.js` (CSP, X-Frame-Options, etc.)
- ✅ Ownership check antes de `UPDATE/DELETE` (ej. cita pertenece al negocio de la sesión)
- ✅ Middleware redirige rutas protegidas
- ✅ Audit log de logins (éxito y fallo con IP, email)

## ⚠️ Consideraciones operativas

1. **MySQL expuesto a internet** (`104.248.198.207:3306`): restringí por firewall a las IPs desde donde corre el Next.js. Si desplegás en Vercel, las IPs cambian — la recomendación real es **deployar el Next.js en el mismo VPS** y que MySQL escuche solo en `127.0.0.1`.

2. **`JWT_SECRET` en dev es placeholder** — reemplazalo en prod con `openssl rand -base64 48`.

3. **`.env.local` NO se commitea** (ya está en `.gitignore`). El password actual del usuario `aethel` está ahí — rotalo si el archivo llegó a alguna parte que no debía.

4. **Rate limit en memoria no aplica**: usa la tabla `login_attempts` justamente porque en Vercel (serverless) la memoria no persiste entre invocaciones. Asegurate que la tabla exista antes del primer login (`npm run schema`).

5. **Bot WhatsApp Aethel**: el dashboard espera que el bot (el `demo_bot.js` en el VPS) inserte citas en la tabla `citas` con `origen='bot'` para que la alerta visual funcione. Hay que actualizar el bot para que además de responder con IA, haga `INSERT INTO citas(...)` cuando detecte intent de reserva.

6. **Calendario**: implementado como grid semanal (desktop) / lista por día (mobile). Si querés vista mensual completa, agregar página `/dashboard/agenda/mes` con `date-fns` + `startOfMonth/endOfMonth`.

## Schema esperado (tablas mínimas)

```sql
-- usuarios     (id, negocio_id, email UNIQUE, password_hash, nombre, activo, ...)
-- login_attempts (id, ip, email, exito, created_at)
-- negocios     (id, nombre, ...)
-- servicios    (id, negocio_id, nombre, precio, duracion_min, descripcion, activo, ...)
-- citas        (id, negocio_id, servicio_id, nombre_cliente, telefono, fecha, hora,
--               estado ENUM('confirmada','en_progreso','completada','cancelada','no_asistio'),
--               notas, origen, creado_por, created_at, updated_at)
-- horarios     (negocio_id, dia_semana, hora_apertura, hora_cierre, activo,
--               UNIQUE(negocio_id, dia_semana))
-- bloqueos     (id, negocio_id, fecha, hora_inicio, hora_fin, motivo, created_at)
```

Correr `npm run schema` crea `usuarios`, `login_attempts` y agrega el índice único de `horarios` si no existe.
